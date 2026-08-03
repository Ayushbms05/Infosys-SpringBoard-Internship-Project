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
    unit: params.get("unit") || "alphabets",
    type: params.get("type") || "reading",
  };

  const titleEl = document.getElementById("lesson-title");
  if (titleEl)
    titleEl.textContent = `${lessonParams.unit.charAt(0).toUpperCase() + lessonParams.unit.slice(1)} — ${typeLabels[lessonParams.type]}`;

  const levelBadge = document.getElementById("lesson-level-badge");
  if (levelBadge) {
    levelBadge.className = `rec-card-tag ${lessonParams.level}`;
    levelBadge.textContent =
      lessonParams.level.charAt(0).toUpperCase() + lessonParams.level.slice(1);
  }

  const typeBadge = document.getElementById("lesson-type-badge");
  if (typeBadge)
    typeBadge.textContent = `${typeIcons[lessonParams.type]} ${typeLabels[lessonParams.type]}`;

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
      renderExercise();
    } catch (error) {
      console.error("Lesson generation failed, using fallbacks:", error);
      exercises = getFallbackExercises(lessonParams.type);
      totalExercises = exercises.length;
      document.getElementById("loading-overlay").classList.add("hidden");
      renderExercise();
    }
  });

  document.getElementById("check-btn").addEventListener("click", checkAnswer);
  document
    .getElementById("continue-lesson-btn")
    .addEventListener("click", nextExercise);
}

// ─── Gemini AI Generator ────────────────────────────────
async function generateExercises() {
  const langNames = { en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu", kn: "Kannada", bn: "Bengali", mr: "Marathi" };
  const knownLang = lessonUserProfile?.preferredLanguage || "en";
  const targetLang = lessonUserProfile?.targetLanguage || "en";
  const knownLangName = langNames[knownLang] || "English";
  const targetLangName = langNames[targetLang] || "English";
  const litLevel = lessonUserProfile?.literacyLevel || "canRecognize";
  const ageGroup = lessonUserProfile?.ageGroup || "26-40";

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
    reading: `Generate 5 Duolingo-style reading exercises. JSON: [{"content": "ONE short sentence in ${targetLangName}, max 8-10 words", "translation": "The ${knownLangName} translation of that exact sentence", "question": "A short question in ${targetLangName} about the content", "questionTranslation": "The ${knownLangName} translation of the question", "options": ["opt1", "opt2", "opt3", "opt4"], "optionsTranslation": ["opt1 in ${knownLangName}", "opt2 in ${knownLangName}", "opt3 in ${knownLangName}", "opt4 in ${knownLangName}"], "answerIndex": 0, "explanation": "Why this is correct, written in ${knownLangName}"}]`,

    listening: `Generate 5 Duolingo-style listening exercises. JSON: [{"content": "ONE short spoken sentence in ${targetLangName}, max 8-10 words", "translation": "The ${knownLangName} translation of that exact sentence", "question": "What did the audio say? (in ${knownLangName})", "options": ["opt1", "opt2", "opt3", "opt4"], "optionsTranslation": ["opt1 in ${knownLangName}", "opt2 in ${knownLangName}", "opt3 in ${knownLangName}", "opt4 in ${knownLangName}"], "answerIndex": 0, "explanation": "Audio translation, in ${knownLangName}"}]`,

    speaking: `Generate 5 Duolingo-style speaking exercises. JSON: [{"content": "ONE short practical sentence in ${targetLangName}, max 8-10 words", "translation": "The ${knownLangName} translation of that exact sentence", "question": "Repeat this sentence aloud", "options": [], "answerIndex": 0, "explanation": "Great pronunciation!"}]`,

    pronunciation: `Generate 5 Duolingo-style pronunciation exercises. JSON: [{"content": "ONE single challenging word in ${targetLangName}", "translation": "The ${knownLangName} translation of that word", "question": "Pronounce this word", "options": [], "answerIndex": 0, "explanation": "Perfect!"}]`,

    writing: `Generate 5 Duolingo-style sentence building exercises. JSON: [{"content": "A plain description of the sentence's meaning, in ${knownLangName} — written as a completely different set of words than the target sentence itself", "question": "The correct SHORT sentence (max 6-8 words) in ${targetLangName}, written normally (NOT an instruction, NOT containing 'Arrange', NOT separated by slashes)", "questionTranslation": "The ${knownLangName} translation of that exact sentence", "options": ["singleWord1", "singleWord2", "singleWord3", "singleWord4", "singleWord5"], "answerIndex": 0, "explanation": "Correct structure, in ${knownLangName}"}]. CRITICAL RULES: "options" must be SINGLE INDIVIDUAL WORDS ONLY, in ${targetLangName}, and together must contain every word needed to build "question" exactly. "content" must NEVER reuse the same words as "question".`
  };

  const prompt = `You are a language tutor teaching ${targetLangName} to ${ageContext}, who already knows ${knownLangName} and ${litContext}. Every exercise must include BOTH the ${targetLangName} content AND a ${knownLangName} translation field, as specified below. Generate SHORT, bite-sized exercises — never long paragraphs. Difficulty should come from vocabulary complexity and grammar, NOT sentence length.
  ${prompts[lessonParams.type]}
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
  parsed = parsed.slice(0, 5);

  if (lessonParams.type === 'writing') {
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

  return parsed;
}
// ─── Dynamic UI Renderer ────────────────────────────────
function renderExercise() {
  if (currentExerciseIndex >= totalExercises) return showLessonComplete();

  const ex = exercises[currentExerciseIndex];
  selectedAnswer = null;

  document.getElementById("lesson-progress-fill").style.width =
    (currentExerciseIndex / totalExercises) * 100 + "%";
  document.getElementById("lesson-progress-text").textContent =
    `${currentExerciseIndex + 1}/${totalExercises}`;
  document.getElementById("exercise-instruction-text").textContent =
    ex.instruction;

  const body = document.getElementById("exercise-body");
  let html = "";

  // 1. LISTENING MODE (Big Audio Button, Hidden Text)
  if (lessonParams.type === "listening") {
    html += `
      <div style="text-align: center; margin: 2rem 0;">
        <button id="listen-play-btn" style="width: 100px; height: 100px; border-radius: 50%; background: var(--color-primary); color: white; border: none; font-size: 3rem; cursor: pointer; box-shadow: 0 8px 20px rgba(108, 99, 255, 0.4); transition: transform 0.2s;">🔊</button>
        <p style="margin-top: 1rem; color: var(--color-text-secondary); font-weight: bold;">Tap to Listen</p>
      </div>
      <p class="lesson-translation ${translationVisibilityClass()}">${ex.translation || ''}</p>
      <p class="exercise-question">${ex.question}</p>
      <div class="exercise-options" id="mcq-options"></div>
    `;
  }

  // 2. SPEAKING & PRONUNCIATION MODE (Microphone UI)
  else if (
    lessonParams.type === "speaking" ||
    lessonParams.type === "pronunciation"
  ) {
    html += `
      <div style="text-align: center; margin-bottom: 2rem; padding: 2rem; background: rgba(108, 99, 255, 0.05); border-radius: 12px; border: 1px solid rgba(108, 99, 255, 0.2);">
        <h2 style="font-size: 2.5rem; color: var(--color-text-primary); margin-bottom: 0.5rem;">${ex.content}</h2>
        <p class="lesson-translation ${translationVisibilityClass()}">${ex.translation || ''}</p>
        <p style="color: var(--color-text-muted); font-size: 1.1rem; font-style: italic;">"${ex.question}"</p>
      </div>
      <div style="text-align: center; margin-bottom: 1rem;">
        <button id="stt-mic-btn" style="width: 80px; height: 80px; border-radius: 50%; background: white; color: var(--color-primary); border: 3px solid var(--color-primary); font-size: 2.5rem; cursor: pointer; transition: all 0.3s;">🎤</button>
        <p id="stt-result-text" style="color: var(--color-text-secondary); margin-top: 1rem; font-weight: 600; min-height: 24px;">Waiting for audio...</p>
      </div>
    `;
  }

  // 3. WRITING MODE (Sentence Builder)
  else if (lessonParams.type === "writing") {
    html += `
      <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(0, 212, 170, 0.1); border-radius: 8px; border-left: 4px solid var(--color-accent);">
      <p class="lesson-translation ${translationVisibilityClass()}">${ex.translation || ''}</p>  
      <p style="font-weight: bold; color: var(--color-text-primary);">${ex.content}</p>
      </div>
      <div class="sentence-builder-area">
        <div id="sb-dropzone" style="min-height: 60px; padding: 1rem; border: 2px dashed var(--color-primary); border-radius: 8px; display: flex; flex-wrap: wrap; gap: 0.5rem; background: rgba(108, 99, 255, 0.05); margin-bottom: 1rem; align-items: center;"></div>
        <div id="sb-wordbank" style="min-height: 60px; padding: 1rem; border: 1px solid var(--glass-border); border-radius: 8px; display: flex; flex-wrap: wrap; gap: 0.5rem; background: var(--color-bg-surface); align-items: center;"></div>
      </div>
    `;
  }

  // 4. READING MODE (Standard MCQ)
  else {
    html += `
    <div class="exercise-passage" style="margin-bottom: 1.5rem; padding: 1.5rem; background: rgba(255,255,255,0.03); border: 1px solid var(--color-border); border-radius: 12px; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;">
      <p style="font-size: 1.2rem; font-weight: 600; margin: 0;">${ex.content}</p>
      <button class="passage-tts-btn" onclick="speakText('${ex.content.replace(/'/g, "\\'")}', '${lessonUserProfile?.preferredLanguage}')" style="flex-shrink: 0; background: transparent; border: none; font-size: 1.5rem; cursor: pointer; line-height: 1;">🔊</button>
    </div>
    <p class="lesson-translation ${translationVisibilityClass()}">${ex.translation || ''}</p>
    <p class="exercise-question">${ex.question}</p>
    <div class="exercise-options" id="mcq-options"></div>
  `;
  }

  body.innerHTML = html;

  // Render Buttons / Reset Check state
  document.getElementById("exercise-feedback").classList.add("hidden");
  const checkBtn = document.getElementById("check-btn");
  checkBtn.classList.remove("hidden");
  checkBtn.disabled = true;
  document.getElementById("continue-lesson-btn").classList.add("hidden");

  // Hook up functionality based on mode
  if (lessonParams.type === "listening") {
    document.getElementById("listen-play-btn").onclick = function () {
      this.style.transform = "scale(0.9)";
      setTimeout(() => (this.style.transform = "scale(1)"), 200);
      speakText(ex.content, lessonUserProfile?.preferredLanguage);
    };
    renderMCQ(ex.options);
  } else if (lessonParams.type === "reading") {
    renderMCQ(ex.options);
  } else if (lessonParams.type === "writing") {
    const bank = document.getElementById("sb-wordbank");
    const dropzone = document.getElementById("sb-dropzone");

    // Shuffle jumbled words
    const shuffledOptions = [...ex.options].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach((word) => {
      const chip = document.createElement("button");
      chip.textContent = word;
      chip.style.cssText =
        "padding: 0.6rem 1rem; border-radius: 20px; border: none; background: var(--color-primary); color: white; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);";

      chip.onclick = () => {
        if (chip.parentElement === bank) dropzone.appendChild(chip);
        else bank.appendChild(chip);
        checkBtn.disabled = dropzone.children.length === 0;
      };
      bank.appendChild(chip);
    });

    selectedAnswer = 0; // Dummy value to allow checkAnswer to run
  } else if (
    lessonParams.type === "speaking" ||
    lessonParams.type === "pronunciation"
  ) {
    const micBtn = document.getElementById("stt-mic-btn");
    const resultText = document.getElementById("stt-result-text");

    micBtn.onclick = () => {
      micBtn.style.background = "var(--color-primary)";
      micBtn.style.color = "white";
      micBtn.style.animation = "pulse 1.5s infinite";
      resultText.textContent = "Listening...";

      if (typeof startSpeechToText === "function") {
        startSpeechToText(
          lessonUserProfile?.preferredLanguage || "en",
          (transcript) => {
            micBtn.style.background = "white";
            micBtn.style.color = "var(--color-primary)";
            micBtn.style.animation = "none";

            if (transcript) {
              resultText.textContent = `You said: "${transcript}"`;

              // Fuzzy Match Logic
              // FIXED: "expected" and "actual" were referenced below but never
              // declared here — that's what threw the ReferenceError. Restoring
              // the normalization step that builds them from the target sentence
              // (ex.content) and the transcript.
              const expected = ex.content
                .toLowerCase()
                .replace(/[.,?]/g, "")
                .trim();
              const actual = transcript
                .toLowerCase()
                .replace(/[.,?]/g, "")
                .trim();

              // Word-overlap match instead of exact substring — tolerates natural speech
              // variation (a missed "a"/"the", slightly different word order) while still
              // requiring most of the actual words to be present.
              const expectedWords = expected.split(/\s+/).filter(Boolean);
              const actualWords = new Set(actual.split(/\s+/).filter(Boolean));
              const matchedCount = expectedWords.filter((w) =>
                actualWords.has(w),
              ).length;
              const matchRatio = expectedWords.length
                ? matchedCount / expectedWords.length
                : 0;

              if (matchRatio >= 0.7) {
                // 70%+ of expected words present = pass
                selectedAnswer = "CORRECT";
              } else {
                selectedAnswer = "INCORRECT";
              }
              checkBtn.disabled = false;
            } else {
              resultText.textContent =
                "Didn't catch that. Tap mic to try again.";
            }
          },
          (err) => {
            // NEW: surfaces STT failures instead of leaving the button stuck silently
            micBtn.style.background = "white";
            micBtn.style.color = "var(--color-primary)";
            micBtn.style.animation = "none";
            resultText.textContent = "Something went wrong — please try again.";
            console.error("STT error:", err);
          },
        );
      }
    };
  }
}

// ─── Helpers ────────────────────────────────────────────
function renderMCQ(options) {
  const container = document.getElementById("mcq-options");
  if (!container) return;
  const letters = ["A", "B", "C", "D"];
  options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "option-btn exercise-option";
    btn.innerHTML = `<div class="option-letter">${letters[idx]}</div><span>${opt}</span>`;
    btn.onclick = () => {
      document
        .querySelectorAll(".exercise-option")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedAnswer = idx;
      document.getElementById("check-btn").disabled = false;
    };
    container.appendChild(btn);
  });
}

function checkAnswer() {
  const ex = exercises[currentExerciseIndex];
  let isCorrect = false;

  if (lessonParams.type === "writing") {
    const builtSentence = Array.from(
      document.getElementById("sb-dropzone").children,
    )
      .map((c) => c.textContent)
      .join(" ")
      .trim();

    // Normalize both sides the same way: lowercase, strip punctuation,
    // collapse whitespace — so a correct arrangement isn't marked wrong
    // just because of a missing period or an extra space.
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
    document.querySelectorAll(".exercise-option").forEach((btn, idx) => {
      if (idx === ex.answerIndex) btn.classList.add("correct");
      else if (idx === selectedAnswer && !isCorrect)
        btn.classList.add("incorrect");
      btn.disabled = true;
    });
  }

  const feedback = document.getElementById("exercise-feedback");
  feedback.classList.remove("hidden", "correct", "incorrect");

  if (isCorrect) {
    feedback.classList.add("correct");
    document.getElementById("feedback-icon").textContent = "✅";
    document.getElementById("feedback-text").textContent =
      "Correct! " + (ex.explanation || "Great job!");
    lessonScore++;
    document.getElementById("lesson-xp-value").textContent =
      parseInt(document.getElementById("lesson-xp-value").textContent) + 10;
  } else {
    feedback.classList.add("incorrect");
    document.getElementById("feedback-icon").textContent = "❌";
    document.getElementById("feedback-text").textContent =
      "Not quite. " +
      (lessonParams.type === "writing"
        ? `Correct sentence: ${ex.question}`
        : "Keep practicing.");
  }

  document.getElementById("check-btn").classList.add("hidden");
  document.getElementById("continue-lesson-btn").classList.remove("hidden");
}

function nextExercise() {
  currentExerciseIndex++;
  renderExercise();
}

async function showLessonComplete() {
  document.getElementById("lesson-content").classList.add("hidden");
  document.getElementById("lesson-complete").classList.remove("hidden");
  document.getElementById("lesson-progress-fill").style.width = "100%";

  const accuracy = Math.round((lessonScore / totalExercises) * 100);
  const xpEarned = lessonScore * 10;

  document.getElementById("complete-score").textContent = accuracy + "%";
  document.getElementById("complete-xp").textContent = "+" + xpEarned;

  const user = auth.currentUser;
  if (user) {
    await addXP(user.uid, xpEarned);

    // CHANGED: completeLesson() now needs the skill type (lessonParams.type)
    // and the accuracy just scored, since leveling up now requires genuine
    // mastery (5+ lessons AND 60%+ average accuracy) per skill, not just
    // attendance. It's no longer gated behind "accuracy >= 50" here either
    // — every attempt gets logged toward lessonsCompleted regardless of
    // score, but only a strong average actually earns "completed" status.
    const levelResult = await completeLesson(
      user.uid,
      lessonParams.level,
      lessonParams.type,
      lessonParams.unit,
      1,
      accuracy,
    );

    await updateStreak(user.uid);

    if (typeof updateQuestProgress === "function") {
      updateQuestProgress(user.uid, "lesson", 1); // Adds 1 to "Complete 1 Lesson"
      updateQuestProgress(user.uid, "xp", xpEarned); // Adds earned XP to "Earn 20 XP"
    }

    // Log this attempt for the Analysis page
    await db.collection("users").doc(user.uid).collection("lessonHistory").add({
      type: lessonParams.type,
      level: lessonParams.level,
      unit: lessonParams.unit,
      accuracy: accuracy,
      xpEarned: xpEarned,
      completedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Refetch the profile fresh (post-update) so badge conditions are
    // checked against up-to-date numbers, then show celebrations for
    // anything newly earned. Level-up shows first since it's the bigger
    // milestone.
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

  document.getElementById("next-lesson-btn").onclick = () =>
    window.location.reload();
}

function getFallbackExercises(type) {
  // Safe Fallbacks in case Gemini times out
  if (type === "speaking" || type === "pronunciation")
    return [
      {
        instruction: "Tap the mic and say this out loud",
        content: "Hello",
        question: "Greeting",
        options: [],
        answerIndex: 0,
      },
      {
        instruction: "Tap the mic and say this out loud",
        content: "Thank you",
        question: "Gratitude",
        options: [],
        answerIndex: 0,
      },
    ];
  if (type === "writing")
    return [
      {
        instruction: "Arrange the words",
        content: "I am going to the bank",
        question: "I am going to the bank",
        options: ["to", "am", "I", "bank", "going", "the"],
        answerIndex: 0,
      },
    ];
  if (type === "listening")
    return [
      {
        instruction: "Listen and answer",
        content: "The bus is arriving.",
        question: "What is arriving?",
        options: ["The bus", "The train", "The car", "The plane"],
        answerIndex: 0,
      },
    ];
  return [
    {
      instruction: "Read and answer",
      content: "Sign here.",
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