/**
 * lesson.js — Multimodal Exercise Engine
 * Handles Reading (MCQ), Listening (Audio MCQ), Speaking/Pronunciation (STT), and Writing (Sentence Builder)
 */

let lessonParams = {};
let exercises = [];
let currentExerciseIndex = 0;
let lessonScore = 0;
let totalExercises = 5;
let selectedAnswer = null;
let lessonUserProfile = null;
let lessonStartTime = 0;

const typeIcons = {
  reading: "📖",
  writing: "✍️",
  speaking: "🗣️",
  pronunciation: "🔤",
  listening: "🎧",
};
const typeLabels = {
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
  pronunciation: "Pronunciation",
  listening: "Listening",
};

// ─── Setup Lesson ───────────────────────────────────────
function setupLesson() {
  const params = new URLSearchParams(window.location.search);
  lessonParams = {
    level: params.get("level") || "beginner",
    unit: params.get("unit") || "alphabets",  // kept for backward compat
    type: params.get("type") || "reading",
    lessonIndex: parseInt(params.get("lessonIndex"), 10) || 1,
    mode: params.get("mode") || "learning",
  };

  const titleEl = document.getElementById("lesson-title");
  if (titleEl) {
    const formattedUnit = lessonParams.unit.charAt(0).toUpperCase() + lessonParams.unit.slice(1);
    titleEl.textContent = `${formattedUnit} — ${typeLabels[lessonParams.type]}`;
  }

  const levelBadge = document.getElementById("lesson-level-badge");
  if (levelBadge) {
    levelBadge.textContent = lessonParams.level.charAt(0).toUpperCase() + lessonParams.level.slice(1);
  }

  const typeBadge = document.getElementById("lesson-type-badge");
  if (typeBadge) {
    typeBadge.textContent = `${typeIcons[lessonParams.type]} ${typeLabels[lessonParams.type]}`;
  }

  auth.onAuthStateChanged(async (user) => {
    if (!user) return (window.location.href = "login.html");
    try {
      lessonUserProfile = await getUserProgress(user.uid);
      if (typeof applyTheme === "function" && lessonUserProfile?.activeTheme) {
        applyTheme(lessonUserProfile.activeTheme);
      }
      exercises = await generateExercises();
      totalExercises = exercises.length;
      document.getElementById("loading-overlay").classList.add("hidden");
      lessonStartTime = Date.now();
      renderExercise();
    } catch (error) {
      console.error("Lesson generation failed, using fallbacks:", error);
      exercises = getFallbackExercises(lessonParams.type);
      totalExercises = exercises.length;
      document.getElementById("loading-overlay").classList.add("hidden");
      lessonStartTime = Date.now();
      renderExercise();
    }
  });

  const checkBtn = document.getElementById("check-btn");
  if (checkBtn) checkBtn.addEventListener("click", checkAnswer);

  const continueBtn = document.getElementById("continue-lesson-btn");
  if (continueBtn) continueBtn.addEventListener("click", nextExercise);
}

// ─── Gemini AI Generator (Blueprint + Cache-First) ──────────
async function generateExercises() {
  const langNames = { en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu", kn: "Kannada", bn: "Bengali", mr: "Marathi" };
  const knownLang = lessonUserProfile?.preferredLanguage || "en";
  const targetLang = lessonUserProfile?.targetLanguage || "en";
  const knownLangName = langNames[knownLang] || "English";
  const targetLangName = langNames[targetLang] || "English";
  const litLevel = lessonUserProfile?.literacyLevel || "canRecognize";
  const ageGroup = lessonUserProfile?.ageGroup || "26-40";

  const level = lessonParams.level;
  const skill = lessonParams.type;
  const lessonIndex = lessonParams.lessonIndex;

  // 0. Independent Practical Life Skills Check (Bypasses Firestore & Gemini completely)
  const isLifeSkill = ['banking', 'transit', 'health', 'market', 'bills'].includes(lessonParams.unit) || lessonParams.mode === 'practice';
  if (isLifeSkill) {
    const unitKey = ['banking', 'transit', 'health', 'market', 'bills'].includes(lessonParams.unit) ? lessonParams.unit : 'banking';
    console.log(`🌐 Practical Life Skills Independent Mode: unit=${unitKey}, level=${level} — Bypassing Firestore & Gemini`);
    if (typeof LIFE_SKILLS_CONTENT !== "undefined" && LIFE_SKILLS_CONTENT[unitKey]) {
      const pool = LIFE_SKILLS_CONTENT[unitKey][level] || LIFE_SKILLS_CONTENT[unitKey]['beginner'] || [];
      if (pool.length > 0) {
        return pool;
      }
    }
    if (typeof getPracticalLifeSkillFallback === "function") {
      return getPracticalLifeSkillFallback(unitKey, level);
    }
  }

  // 1. Look up the blueprint for this lesson slot
  const blueprintSlots = CURRICULUM_BLUEPRINT?.[level]?.[skill];
  const blueprint = blueprintSlots?.find(b => b.lessonIndex === lessonIndex);
  if (!blueprint) {
    console.warn(`No blueprint found for ${level}/${skill}/lesson ${lessonIndex}, using fallback`);
    return getFallbackExercises(skill);
  }

  // 2. Check Firestore cache
  const cacheDocId = `${targetLang}_${level}_${skill}_${lessonIndex}`;
  try {
    const cachedDoc = await db.collection("sharedLessonContent").doc(cacheDocId).get();
    if (cachedDoc.exists) {
      const cachedData = cachedDoc.data();
      if (cachedData.exercises && cachedData.exercises.length > 0) {
        console.log(`✅ Cache hit: ${cacheDocId} — skipping Gemini`);
        return cachedData.exercises;
      }
    }
  } catch (cacheErr) {
    console.warn("Cache read failed, will generate fresh:", cacheErr);
  }

  // 3. No cache → build Gemini prompt
  console.log(`🔄 Cache miss: ${cacheDocId} — generating via Gemini`);

  const ageContext = {
    "below18": "a teenage learner — keep examples relatable to school, family, and everyday teenage life, but never childish",
    "18-25": "a young adult learner — examples can reference first jobs, further study, banking, and city life",
    "26-40": "a working-age adult learner — examples should reference workplaces, family responsibilities, banking, and civic tasks",
    "41-60": "a middle-aged adult learner — examples should reference established work life, healthcare, family, and community",
    "60+": "an older adult learner — keep pacing calm, examples should reference healthcare, pensions, family, and community; avoid fast-paced or overly modern slang"
  }[ageGroup] || "an adult learner";

  const litContext = {
    neverLearned: "has never learned to read or write — needs the simplest possible language, one idea per sentence",
    canRecognize: "can recognize some letters and words but not full sentences — keep vocabulary basic and sentences short",
    canReadSimple: "can read and write simple sentences with some difficulty — moderate vocabulary is fine",
    canReadComfort: "can read and write comfortably and is returning to build further — can handle richer vocabulary and longer sentences",
    preferNot: "has not specified a literacy level — assume a cautious beginner level"
  }[litLevel] || "an adult learner building foundational literacy";

  const prompts = {
    reading: `Generate ${blueprint.exampleCount} Duolingo-style reading exercises. JSON: [{"instruction": "Read the passage and answer", "content": "ONE short sentence in ${targetLangName}, max 8-10 words", "translation": "The ${knownLangName} translation of that exact sentence", "question": "A short question in ${targetLangName} about the content", "questionTranslation": "The ${knownLangName} translation of the question", "options": ["opt1", "opt2", "opt3", "opt4"], "optionsTranslation": ["opt1 in ${knownLangName}", "opt2 in ${knownLangName}", "opt3 in ${knownLangName}", "opt4 in ${knownLangName}"], "answerIndex": 0, "explanation": "Why this is correct, written in ${knownLangName}"}]`,

    listening: `Generate ${blueprint.exampleCount} Duolingo-style listening exercises. JSON: [{"instruction": "Listen to the audio sentence and choose the correct answer", "content": "ONE short spoken sentence in ${targetLangName}, max 8-10 words", "translation": "The ${knownLangName} translation of that exact sentence", "question": "What did the audio say? (in ${knownLangName})", "options": ["opt1", "opt2", "opt3", "opt4"], "optionsTranslation": ["opt1 in ${knownLangName}", "opt2 in ${knownLangName}", "opt3 in ${knownLangName}", "opt4 in ${knownLangName}"], "answerIndex": 0, "explanation": "Audio translation, in ${knownLangName}"}]`,

    speaking: `Generate ${blueprint.exampleCount} Duolingo-style speaking exercises. JSON: [{"instruction": "Tap the mic and repeat this sentence aloud", "content": "ONE short practical sentence in ${targetLangName}, max 8-10 words", "translation": "The ${knownLangName} translation of that exact sentence", "question": "Speak clearly into your microphone", "options": [], "answerIndex": 0, "explanation": "Great pronunciation!"}]`,

    pronunciation: `Generate ${blueprint.exampleCount} Duolingo-style pronunciation exercises. JSON: [{"instruction": "Tap the mic and pronounce this word aloud", "content": "ONE single challenging word in ${targetLangName}", "translation": "The ${knownLangName} translation of that word", "question": "Pronounce this word clearly", "options": [], "answerIndex": 0, "explanation": "Perfect pronunciation!"}]`,

    writing: `Generate ${blueprint.exampleCount} Duolingo-style sentence building exercises. JSON: [{"instruction": "Arrange the words below to form the correct sentence", "content": "A plain description of the sentence's meaning, in ${knownLangName} — written as a completely different set of words than the target sentence itself", "question": "The correct SHORT sentence (max 6-8 words) in ${targetLangName}, written normally", "questionTranslation": "The ${knownLangName} translation of that exact sentence", "options": ["singleWord1", "singleWord2", "singleWord3", "singleWord4", "singleWord5"], "answerIndex": 0, "explanation": "Correct structure, in ${knownLangName}"}]. CRITICAL RULES: "options" must be SINGLE INDIVIDUAL WORDS ONLY, in ${targetLangName}, and together must contain every word needed to build "question" exactly.`
  };

  const focusInstruction = `LESSON FOCUS: This is lesson ${lessonIndex} of 5 in the "${level}" level "${skill}" skill track. The specific pedagogical focus for this lesson is: "${blueprint.focus}". ALL ${blueprint.exampleCount} exercises MUST be directly about this focus topic — do not generate generic exercises.`;

  const prompt = `You are a language tutor teaching ${targetLangName} to ${ageContext}, who already knows ${knownLangName} and ${litContext}. Every exercise must include BOTH the ${targetLangName} content AND a ${knownLangName} translation field, as specified below. Generate SHORT, bite-sized exercises.
  ${focusInstruction}
  ${prompts[skill]}
  RESPOND ONLY WITH THE RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS.`;

  const idToken = await firebase.auth().currentUser.getIdToken();
  const response = await fetch(APP_CONFIG.CLOUD_FN_GEMINI, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + idToken },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5 } })
  });

  const data = await response.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  text = text.replace(/```(json)?/gi, '').trim();

  let parsed = JSON.parse(text);
  parsed = parsed.slice(0, blueprint.exampleCount);

  if (skill === 'writing') {
    parsed = parsed.map(item => {
      const optionsLookLikeSentences = (item.options || []).some(o => o.trim().split(/\s+/).length > 2);
      const questionLooksMalformed = !item.question || /arrange|\//i.test(item.question);

      const normalize = (s) => (s || "").toLowerCase().replace(/[.,!?]/g, '').trim();
      const contentMatchesAnswer = normalize(item.content) === normalize(item.question);

      const questionWords = normalize(item.question).split(/\s+/).filter(Boolean);
      const optionWords = (item.options || []).map(o => normalize(o));
      const wordsAvailable = [...optionWords];
      const wordBankIncomplete = !questionWords.every(qWord => {
        const idx = wordsAvailable.indexOf(qWord);
        if (idx === -1) return false;
        wordsAvailable.splice(idx, 1);
        return true;
      });

      if (optionsLookLikeSentences || questionLooksMalformed || contentMatchesAnswer || wordBankIncomplete) {
        return getFallbackExercises('writing')[0];
      }
      return item;
    });
  }

  try {
    await db.collection("sharedLessonContent").doc(cacheDocId).set({
      targetLanguage: targetLang,
      level: level,
      skill: skill,
      lessonIndex: lessonIndex,
      exercises: parsed,
      generatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log(`💾 Cached: ${cacheDocId}`);
  } catch (writeErr) {
    console.warn("Cache write failed:", writeErr);
  }

  return parsed;
}

// ─── Dynamic UI Renderer ────────────────────────────────
function renderExercise() {
  if (currentExerciseIndex >= totalExercises) return showLessonComplete();

  const ex = exercises[currentExerciseIndex];
  selectedAnswer = null;

  const fillPercent = ((currentExerciseIndex + 1) / totalExercises) * 100;
  const fillEl = document.getElementById("lesson-progress-fill");
  if (fillEl) fillEl.style.width = `${fillPercent}%`;

  const instEl = document.getElementById("exercise-instruction-text");
  if (instEl) {
    const instructionText = ex.instruction || "Answer the question to continue";
    instEl.innerHTML = `<i data-lucide="help-circle" style="width: 18px; height: 18px; color: #6366f1;"></i> <span>${instructionText}</span>`;
  }

  const body = document.getElementById("exercise-body");
  let html = "";
  const targetLang = lessonUserProfile?.targetLanguage || "hi";

  // 1. LISTENING MODE
  if (lessonParams.type === "listening") {
    html += `
      <div style="text-align: center; margin: 1.5rem 0 2rem;">
        <button id="listen-play-btn" style="width: 90px; height: 90px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; border: 4px solid #ffffff; box-shadow: 0 12px 28px rgba(99, 102, 241, 0.4); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); margin: 0 auto;">
          <i data-lucide="volume-2" style="width: 38px; height: 38px;"></i>
        </button>
        <p style="margin-top: 0.85rem; color: #6366f1; font-weight: 800; font-size: 0.95rem;">Tap to Listen</p>
      </div>
      ${ex.translation ? `<p class="translation-text ${translationVisibilityClass()}">${ex.translation}</p>` : ''}
      <h3 class="exercise-question-text">${ex.question}</h3>
      <div class="exercise-options-grid" id="mcq-options"></div>
    `;
  }

  // 2. SPEAKING & PRONUNCIATION MODE
  else if (
    lessonParams.type === "speaking" ||
    lessonParams.type === "pronunciation"
  ) {
    html += `
      <div style="text-align: center; margin-bottom: 2rem; padding: 2rem 1.5rem; background: linear-gradient(135deg, #f8fafc, #eef2ff); border-radius: 24px; border: 2px solid #c7d2fe;">
        <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2.2rem; font-weight: 900; color: #4f46e5; margin: 0 0 0.5rem;">${ex.content}</h2>
        ${ex.translation ? `<p class="translation-text ${translationVisibilityClass()}" style="margin: 0.5rem 0;">${ex.translation}</p>` : ''}
        <p style="color: #64748b; font-size: 1.05rem; font-weight: 700; margin: 0;">"${ex.question}"</p>
      </div>
      <div style="text-align: center; margin-bottom: 1rem;">
        <button id="stt-mic-btn" style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; border: 4px solid #ffffff; box-shadow: 0 10px 28px rgba(99, 102, 241, 0.4); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto; transition: all 0.3s;">
          <i data-lucide="mic" style="width: 32px; height: 32px;"></i>
        </button>
        <p id="stt-result-text" style="color: #475569; margin-top: 1rem; font-weight: 800; font-size: 0.95rem; min-height: 24px;">Tap microphone to speak...</p>
      </div>
    `;
  }

  // 3. WRITING MODE (Sentence Builder)
  else if (lessonParams.type === "writing") {
    html += `
      <div style="margin-bottom: 1.5rem; padding: 1.25rem; background: #f0fdf4; border-radius: 20px; border: 1.5px solid #86efac;">
        ${ex.translation ? `<p class="translation-text ${translationVisibilityClass()}" style="margin-bottom: 0.35rem; color: #16a34a;">${ex.translation}</p>` : ''}  
        <p style="font-weight: 800; font-size: 1.15rem; color: #15803d; margin: 0;">${ex.content}</p>
      </div>
      <div class="sentence-builder-area">
        <div id="sb-dropzone" style="min-height: 64px; padding: 1rem; border: 2px dashed #6366f1; border-radius: 20px; display: flex; flex-wrap: wrap; gap: 0.6rem; background: #eef2ff; margin-bottom: 1.25rem; align-items: center;"></div>
        <div id="sb-wordbank" style="min-height: 64px; padding: 1rem; border: 1.5px solid #e2e8f0; border-radius: 20px; display: flex; flex-wrap: wrap; gap: 0.6rem; background: #f8fafc; align-items: center;"></div>
      </div>
    `;
  }

  // 4. READING MODE (Standard MCQ)
  else {
    html += `
      <div class="exercise-passage-card">
        <p class="exercise-passage-text">${ex.content}</p>
      </div>
      ${ex.translation ? `<p class="translation-text ${translationVisibilityClass()}">${ex.translation}</p>` : ''}
      <h3 class="exercise-question-text">${ex.question}</h3>
      <div class="exercise-options-grid" id="mcq-options"></div>
    `;
  }

  body.innerHTML = html;

  // Wire up top card TTS speaker button
  const topTtsBtn = document.getElementById("exercise-tts-btn");
  if (topTtsBtn) {
    topTtsBtn.style.display = "inline-flex";
    topTtsBtn.onclick = () => {
      topTtsBtn.style.transform = "scale(0.92)";
      setTimeout(() => (topTtsBtn.style.transform = "scale(1)"), 150);
      const textToSpeak = ex.content || ex.question || "";
      if (typeof speakText === "function") {
        speakText(textToSpeak, targetLang);
      }
    };
  }

  // Reset feedback state & check button
  const feedbackEl = document.getElementById("exercise-feedback");
  if (feedbackEl) feedbackEl.classList.add("hidden");

  const checkBtn = document.getElementById("check-btn");
  if (checkBtn) {
    checkBtn.classList.remove("hidden");
    checkBtn.disabled = true;
  }

  const continueBtn = document.getElementById("continue-lesson-btn");
  if (continueBtn) continueBtn.classList.add("hidden");

  // Hook up mode specific event listeners
  if (lessonParams.type === "listening") {
    const playBtn = document.getElementById("listen-play-btn");
    if (playBtn) {
      playBtn.onclick = function () {
        this.style.transform = "scale(0.92)";
        setTimeout(() => (this.style.transform = "scale(1)"), 200);
        speakText(ex.content, targetLang);
      };
    }
    renderMCQ(ex.options);
  } else if (lessonParams.type === "reading") {
    renderMCQ(ex.options);
  } else if (lessonParams.type === "writing") {
    const bank = document.getElementById("sb-wordbank");
    const dropzone = document.getElementById("sb-dropzone");

    const shuffledOptions = [...ex.options].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach((word) => {
      const chip = document.createElement("button");
      chip.textContent = word;
      chip.style.cssText =
        "padding: 0.65rem 1.15rem; border-radius: 9999px; border: none; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; font-weight: 800; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); transition: all 0.2s ease;";

      chip.onclick = () => {
        if (chip.parentElement === bank) dropzone.appendChild(chip);
        else bank.appendChild(chip);
        if (checkBtn) checkBtn.disabled = dropzone.children.length === 0;
      };
      bank.appendChild(chip);
    });

    selectedAnswer = 0;
  } else if (
    lessonParams.type === "speaking" ||
    lessonParams.type === "pronunciation"
  ) {
    const micBtn = document.getElementById("stt-mic-btn");
    const resultText = document.getElementById("stt-result-text");

    if (micBtn) {
      micBtn.onclick = () => {
        micBtn.style.background = "linear-gradient(135deg, #ef4444, #dc2626)";
        resultText.textContent = "Listening...";

        if (typeof startSpeechToText === "function") {
          startSpeechToText(
            targetLang,
            (transcript) => {
              micBtn.style.background = "linear-gradient(135deg, #6366f1, #4f46e5)";

              if (transcript) {
                resultText.textContent = `You said: "${transcript}"`;

                const expected = ex.content.toLowerCase().replace(/[.,?]/g, "").trim();
                const actual = transcript.toLowerCase().replace(/[.,?]/g, "").trim();

                const expectedWords = expected.split(/\s+/).filter(Boolean);
                const actualWords = new Set(actual.split(/\s+/).filter(Boolean));
                const matchedCount = expectedWords.filter((w) => actualWords.has(w)).length;
                const matchRatio = expectedWords.length ? matchedCount / expectedWords.length : 0;

                if (matchRatio >= 0.7) {
                  selectedAnswer = "CORRECT";
                } else {
                  selectedAnswer = "INCORRECT";
                }
                if (checkBtn) checkBtn.disabled = false;
              } else {
                resultText.textContent = "Didn't catch that. Tap mic to try again.";
              }
            },
            (err) => {
              micBtn.style.background = "linear-gradient(135deg, #6366f1, #4f46e5)";
              resultText.textContent = "Speech recognition issue — tap mic to try again.";
              console.error("STT error:", err);
            }
          );
        }
      };
    }
  }

  if (window.lucide) lucide.createIcons();
}

// ─── MCQ Renderer ───────────────────────────────────────
function renderMCQ(options) {
  const container = document.getElementById("mcq-options");
  if (!container) return;
  container.innerHTML = "";
  const letters = ["A", "B", "C", "D"];
  options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "exercise-option-btn";
    btn.innerHTML = `<div class="exercise-option-letter">${letters[idx]}</div><span>${opt}</span>`;
    btn.onclick = () => {
      document
        .querySelectorAll(".exercise-option-btn")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedAnswer = idx;
      const checkBtn = document.getElementById("check-btn");
      if (checkBtn) checkBtn.disabled = false;
    };
    container.appendChild(btn);
  });
  if (window.lucide) lucide.createIcons();
}

function checkAnswer() {
  const ex = exercises[currentExerciseIndex];
  let isCorrect = false;

  if (lessonParams.type === "writing") {
    const builtSentence = Array.from(
      document.getElementById("sb-dropzone").children
    )
      .map((c) => c.textContent)
      .join(" ")
      .trim();

    const normalize = (s) =>
      s
        .toLowerCase()
        .replace(/[.,!?]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    isCorrect = normalize(builtSentence) === normalize(ex.question);
  } else if (
    lessonParams.type === "speaking" ||
    lessonParams.type === "pronunciation"
  ) {
    isCorrect = selectedAnswer === "CORRECT";
  } else {
    isCorrect = selectedAnswer === ex.answerIndex;
    document.querySelectorAll(".exercise-option-btn").forEach((btn, idx) => {
      if (idx === ex.answerIndex) btn.classList.add("correct");
      else if (idx === selectedAnswer && !isCorrect)
        btn.classList.add("incorrect");
      btn.disabled = true;
    });
  }

  const feedback = document.getElementById("exercise-feedback");
  feedback.classList.remove("hidden", "correct", "incorrect");

  const feedbackIcon = document.getElementById("feedback-icon");
  const feedbackText = document.getElementById("feedback-text");

  if (isCorrect) {
    feedback.classList.add("correct");
    if (feedbackIcon) feedbackIcon.innerHTML = `<i data-lucide="check-circle-2" style="width: 22px; height: 22px; color: #16a34a;"></i>`;
    if (feedbackText) feedbackText.textContent = "Correct! " + (ex.explanation || "Great job!");
    lessonScore++;
    const xpValEl = document.getElementById("lesson-xp-value");
    if (xpValEl) xpValEl.textContent = parseInt(xpValEl.textContent || "0") + 10;
  } else {
    feedback.classList.add("incorrect");
    if (feedbackIcon) feedbackIcon.innerHTML = `<i data-lucide="x-circle" style="width: 22px; height: 22px; color: #dc2626;"></i>`;
    if (feedbackText) feedbackText.textContent = "Not quite. " + (lessonParams.type === "writing" ? `Correct sentence: ${ex.question}` : "Keep practicing.");
  }

  const checkBtn = document.getElementById("check-btn");
  if (checkBtn) checkBtn.classList.add("hidden");

  const continueBtn = document.getElementById("continue-lesson-btn");
  if (continueBtn) continueBtn.classList.remove("hidden");

  if (window.lucide) lucide.createIcons();
}

function nextExercise() {
  currentExerciseIndex++;
  renderExercise();
}

async function showLessonComplete() {
  const contentEl = document.getElementById("lesson-content");
  if (contentEl) contentEl.classList.add("hidden");

  const completeEl = document.getElementById("lesson-complete");
  if (completeEl) completeEl.classList.remove("hidden");

  const fillEl = document.getElementById("lesson-progress-fill");
  if (fillEl) fillEl.style.width = "100%";

  const accuracy = Math.round((lessonScore / totalExercises) * 100);
  const xpEarned = lessonScore * 10;

  const completeScoreEl = document.getElementById("complete-score");
  if (completeScoreEl) completeScoreEl.textContent = accuracy + "%";

  const completeXpEl = document.getElementById("complete-xp");
  if (completeXpEl) completeXpEl.textContent = "+" + xpEarned;

  const user = auth.currentUser;
  if (user) {
    await addXP(user.uid, xpEarned);
    let levelResult = { leveledUp: false, newLevel: null };
    if (lessonParams.mode !== "practice") {
      levelResult = await completeLesson(
        user.uid,
        lessonParams.level,
        lessonParams.type,
        lessonParams.unit,
        lessonParams.lessonIndex,
        accuracy
      );

      try {
        const lessonId = `${lessonParams.level}_${lessonParams.type}_${lessonParams.unit}_${lessonParams.lessonIndex}`;
        const localMap = JSON.parse(localStorage.getItem("akshar_lesson_scores") || "{}");
        localMap[lessonId] = Math.round(accuracy || 0);
        localStorage.setItem("akshar_lesson_scores", JSON.stringify(localMap));
      } catch (e) {}

      if (levelResult && levelResult.leveledUp) {
        const modal = document.getElementById("level-up-modal");
        if (modal) modal.classList.remove("hidden");
        const newLvlTxt = document.getElementById("new-level-text");
        if (newLvlTxt) newLvlTxt.textContent = levelResult.newLevel.toUpperCase();
      }
    }
    await updateStreak(user.uid);

    if (typeof updateQuestProgress === "function") {
      updateQuestProgress(user.uid, "lesson", 1);
      updateQuestProgress(user.uid, "xp", xpEarned);
    }

    const durationSeconds = Math.round((Date.now() - lessonStartTime) / 1000);
    await db.collection("users").doc(user.uid).collection("lessonHistory").add({
      type: lessonParams.type,
      level: lessonParams.level,
      unit: lessonParams.unit,
      accuracy: accuracy,
      xpEarned: xpEarned,
      durationSeconds: durationSeconds,
      completedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const freshProfile = await getUserProgress(user.uid);
    const newlyEarnedBadges = await checkAndAwardBadges(user.uid, freshProfile);

    if (levelResult.leveledUp && typeof showLevelUpCelebration === "function") {
      await showLevelUpCelebration(levelResult.newLevel);
    }
    if (typeof showBadgeCelebration === "function") {
      for (const badgeId of newlyEarnedBadges) {
        await showBadgeCelebration(badgeId);
      }
    }
  }

  const nextBtn = document.getElementById("next-lesson-btn");
  if (nextBtn) {
    nextBtn.onclick = () => window.location.reload();
  }

  if (window.lucide) lucide.createIcons();
}

function getFallbackExercises(type) {
  if (type === "speaking" || type === "pronunciation")
    return [
      {
        instruction: "Tap the mic and say this out loud",
        content: "Hello",
        translation: "नमस्ते",
        question: "Greeting",
        options: [],
        answerIndex: 0,
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Thank you",
        translation: "धन्यवाद",
        question: "Gratitude",
        options: [],
        answerIndex: 0,
      },
    ];
  if (type === "writing")
    return [
      {
        instruction: "Arrange the words to form the sentence",
        content: "I am going to the bank",
        translation: "मैं बैंक जा रहा हूँ",
        question: "I am going to the bank",
        options: ["to", "am", "I", "bank", "going", "the"],
        answerIndex: 0,
      },
    ];
  if (type === "listening")
    return [
      {
        instruction: "Listen to the audio and answer",
        content: "The bus is arriving.",
        translation: "बस आ रही है।",
        question: "What is arriving?",
        options: ["The bus", "The train", "The car", "The plane"],
        answerIndex: 0,
      },
    ];
  return [
    {
      instruction: "Read the sentence and answer",
      content: "Sign here.",
      translation: "यहाँ हस्ताक्षर करें।",
      question: "What should you do?",
      options: ["Wait", "Sign", "Leave", "Pay"],
      answerIndex: 1,
    },
  ];
}

if (document.body.id === "page-lesson") {
  document.addEventListener("DOMContentLoaded", setupLesson);
}

function translationVisibilityClass() {
  if (lessonParams.level === 'beginner') return 'translation-prominent';
  if (lessonParams.level === 'intermediate') return 'translation-muted';
  return 'translation-hidden';
}