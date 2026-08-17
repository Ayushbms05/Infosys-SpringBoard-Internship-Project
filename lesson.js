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

// ─── Hardcoded Curriculum Generator (Zero-Latency & Offline) ──────────
async function generateExercises() {
  const level = lessonParams.level || "beginner";
  const skill = lessonParams.type || "reading";
  const lessonIndex = parseInt(lessonParams.lessonIndex, 10) || 1;
  const targetLang = lessonUserProfile?.targetLanguage || "en";

  // 0. Independent Practical Life Skills Check
  const isLifeSkill = ['banking', 'transit', 'health', 'market', 'bills'].includes(lessonParams.unit) || lessonParams.mode === 'practice';
  if (isLifeSkill) {
    const unitKey = ['banking', 'transit', 'health', 'market', 'bills'].includes(lessonParams.unit) ? lessonParams.unit : 'banking';
    console.log(`🌐 Practical Life Skills Independent Mode: unit=${unitKey}, level=${level}`);
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

  // 1. Instant Hardcoded Curriculum Look-up (75 lessons x 10 questions = 750 questions per language)
  if (typeof getCurriculumLessonExercises === "function") {
    const hardcodedExercises = getCurriculumLessonExercises(targetLang, level, skill, lessonIndex);
    if (hardcodedExercises && Array.isArray(hardcodedExercises) && hardcodedExercises.length > 0) {
      console.log(`⚡ Loaded ${hardcodedExercises.length} hardcoded exercises for lang=${targetLang}, level=${level}, skill=${skill}, lesson=${lessonIndex}`);
      return hardcodedExercises;
    }
  }

  // 2. Direct Window Registry Fallback
  const pack = window.CURRICULUM_LESSONS_CONTENT?.[targetLang] || 
               window[`CURRICULUM_LESSONS_${targetLang.toUpperCase()}`] || 
               window.CURRICULUM_LESSONS_EN || {};
  const exercises = pack[level]?.[skill]?.[lessonIndex];
  if (exercises && Array.isArray(exercises) && exercises.length > 0) {
    return exercises;
  }

  // 3. Fallback exercises if needed
  console.warn(`Using fallback exercises for ${level}/${skill}/lesson ${lessonIndex}`);
  return getFallbackExercises(skill);
}

// ─── Dynamic UI Renderer ────────────────────────────────
function renderExercise() {
  if (currentExerciseIndex >= totalExercises) return showLessonComplete();

  const ex = exercises[currentExerciseIndex];
  selectedAnswer = null;

  const fillPercent = ((currentExerciseIndex + 1) / totalExercises) * 100;
  const fillEl = document.getElementById("lesson-progress-fill");
  if (fillEl) fillEl.style.width = `${fillPercent}%`;

  const knownLang = lessonUserProfile?.preferredLanguage || (typeof selectedLang !== "undefined" ? selectedLang : "en") || "en";
  const targetLang = lessonUserProfile?.targetLanguage || "hi";

  const langNames = {
    en: "English",
    hi: "Hindi",
    ta: "Tamil",
    te: "Telugu",
    kn: "Kannada",
    bn: "Bengali",
    mr: "Marathi"
  };
  const targetLangName = langNames[targetLang] || targetLang;

  // Localized Instructions per skill
  const localizedInstructions = {
    writing: {
      en: "Arrange the words below to form the correct sentence",
      hi: "सही वाक्य बनाने के लिए नीचे दिए गए शब्दों को क्रम में लगाएं",
      ta: "சரியான வாக்கியத்தை உருவாக்க கீழே உள்ள சொற்களை வரிசைப்படுத்துங்கள்",
      te: "సరైన వాక్యాన్ని రూపొందించడానికి క్రింది పదాలను క్రమపరచండి",
      kn: "ಸರಿಯಾದ ವಾಕ್ಯವನ್ನು ರೂಪಿಸಲು ಕೆಳಗಿನ ಪದಗಳನ್ನು ಜೋಡಿಸಿ",
      bn: "সঠিক বাক্য গঠন করতে নিচের শব্দগুলি সাজান",
      mr: "योग्य वाक्य तयार करण्यासाठी खालील शब्द क्रमाने लावा"
    },
    reading: {
      en: "Read the passage carefully and choose the correct answer",
      hi: "दिए गए गद्यांश को ध्यानपूर्वक पढ़ें और सही उत्तर चुनें",
      ta: "பத்தியை கவனமாக படித்து சரியான பதிலை தேர்ந்தெடுக்கவும்",
      te: "పాఠాన్ని జాగ్రత్తగా చదివి సరైన సమాధానాన్ని ఎంచుకోండి",
      kn: "ಭಾಗವನ್ನು ಎಚ್ಚರಿಕೆಯಿಂದ ಓದಿ ಮತ್ತು ಸರಿಯಾದ ಉತ್ತರವನ್ನು ಆರಿಸಿ",
      bn: "অনুচ্ছেদটি মনোযোগ দিয়ে পড়ুন এবং সঠিক উত্তরটি বেছে নিন",
      mr: "उतारा काळजीपूर्वक वाचा आणि योग्य उत्तर निवडा"
    },
    listening: {
      en: "Listen to the audio carefully and select the right option",
      hi: "ऑडियो को ध्यान से सुनें और सही विकल्प चुनें",
      ta: "ஆடியோவை கவனமாகக் கேட்டு சரியான விருப்பத்தைத் தேர்ந்தெடுக்கவும்",
      te: "ఆడియోను జాగ్రత్తగా విని సరైన ఎంపికను ఎంచుకోండి",
      kn: "ಆಡಿಯೊವನ್ನು ಎಚ್ಚರಿಕೆಯಿಂದ ಆಲಿಸಿ ಮತ್ತು ಸರಿಯಾದ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ",
      bn: "অডিওটি মনোযোগ সহকারে শুনুন এবং সঠিক বিকল্পটি নির্বাচন করুন",
      mr: "ऑडिओ काळजीपूर्वक ऐका आणि योग्य पर्याय निवडा"
    },
    speaking: {
      en: "Tap the microphone and speak this sentence aloud",
      hi: "माइक पर टैप करें और इस वाक्य को स्पष्ट रूप से बोलें",
      ta: "மைக்ரோஃபோனைத் தட்டி இந்த வாக்கியத்தை சத்தமாகப் பேசுங்கள்",
      te: "మైక్రోఫోన్‌ను నొక్కి ఈ వాక్యాన్ని బిగ్గరగా మాట్లాడండి",
      kn: "ಮೈಕ್ರೊಫೋನ್ ಟ್ಯಾಪ್ ಮಾಡಿ ಮತ್ತು ಈ ವಾಕ್ಯವನ್ನು ಗಟ್ಟಿಯಾಗಿ ಮಾತನಾಡಿ",
      bn: "মাইক্রোফোনে ট্যাপ করুন এবং এই বাক্যটি স্পষ্টভাবে বলুন",
      mr: "माइक टॅप करा आणि हे वाक्य स्पष्टपणे बोला"
    },
    pronunciation: {
      en: "Tap the microphone and pronounce this word clearly",
      hi: "माइक पर टैप करें और इस शब्द का स्पष्ट उच्चारण करें",
      ta: "மைக்ரோஃபோனைத் தட்டி இந்த வார்த்தையை தெளிவாக உச்சரிக்கவும்",
      te: "మైక్రోఫోన్‌ను నొక్కి ఈ పదాన్ని స్పష్టంగా పలకండి",
      kn: "ಮೈಕ್ರೊಫೋನ್ ಟ್ಯಾಪ್ ಮಾಡಿ ಮತ್ತು ಈ ಪದವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಉಚ್ಚರಿಸಿ",
      bn: "মাইক্রোফোনে ট্যাপ করুন এবং এই শব্দটি স্পষ্টভাবে উচ্চারণ করুন",
      mr: "माइक टॅप करा आणि या शब्दाचा स्पष्ट उच्चार करा"
    }
  };

  const instEl = document.getElementById("exercise-instruction-text");
  if (instEl) {
    const instructionText = localizedInstructions[lessonParams.type]?.[knownLang] || 
                            localizedInstructions[lessonParams.type]?.["en"] || 
                            ex.instruction || 
                            "Answer the question to continue";
    instEl.innerHTML = `<i data-lucide="help-circle" style="width: 18px; height: 18px; color: #6366f1;"></i> <span>${instructionText}</span>`;
  }

  const body = document.getElementById("exercise-body");
  let html = "";

  // 1. LISTENING MODE
  if (lessonParams.type === "listening") {
    html += `
      <div style="text-align: center; margin: 1.5rem 0 2rem;">
        <button id="listen-play-btn" style="width: 90px; height: 90px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; border: 4px solid #ffffff; box-shadow: 0 12px 28px rgba(99, 102, 241, 0.4); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); margin: 0 auto;">
          <i data-lucide="volume-2" style="width: 38px; height: 38px;"></i>
        </button>
        <p style="margin-top: 0.85rem; color: #6366f1; font-weight: 800; font-size: 0.95rem;">Tap to Listen</p>
      </div>
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

  // 3. WRITING MODE (Sentence Builder / Translation)
  else if (lessonParams.type === "writing") {
    // Prompt sentence to display in learner's preferred language (e.g. English)
    const promptSentence = ex.content || ex.questionTranslation || ex.translation || ex.question;

    html += `
      <div style="margin-bottom: 1.5rem; padding: 1.25rem 1.5rem; background: #f0fdf4; border-radius: 20px; border: 1.5px solid #86efac; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.08);">
        <div style="font-size: 0.8rem; font-weight: 800; color: #16a34a; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
          <i data-lucide="languages" style="width: 15px; height: 15px;"></i>
          <span>Translate into ${targetLangName}:</span>
        </div>
        <p style="font-weight: 800; font-size: 1.25rem; color: #15803d; margin: 0; line-height: 1.4;">${promptSentence}</p>
      </div>
      <div class="sentence-builder-area">
        <div id="sb-dropzone" style="min-height: 68px; padding: 1rem; border: 2px dashed #6366f1; border-radius: 20px; display: flex; flex-wrap: wrap; gap: 0.65rem; background: #eef2ff; margin-bottom: 1.25rem; align-items: center;"></div>
        <div id="sb-wordbank" style="min-height: 68px; padding: 1rem; border: 1.5px solid #e2e8f0; border-radius: 20px; display: flex; flex-wrap: wrap; gap: 0.65rem; background: #f8fafc; align-items: center;"></div>
      </div>
    `;
  }

  // 4. READING MODE (Standard MCQ)
  else {
    html += `
      <div class="exercise-passage-card">
        <p class="exercise-passage-text">${ex.content}</p>
      </div>
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
// ─── Speech Evaluation Utilities ────────────────────────
function cleanSpeechText(text) {
  if (!text) return "";
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.,?!।॥:;"'`—\-_/\\]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function isWordMatch(w1, w2) {
  if (w1 === w2) return true;
  // Short words (<= 3 chars, e.g. 'का', 'से', 'की', 'to', 'in') require exact match!
  if (w1.length <= 3 || w2.length <= 3) return false;
  // Allow at most 1 character variation for longer words due to STT phonetic transcription variations
  const dist = levenshteinDistance(w1, w2);
  return dist <= 1;
}

function evaluateSpeechTranscript(expectedText, spokenText, isPronunciation = false) {
  const cleanExpected = cleanSpeechText(expectedText);
  const cleanSpoken = cleanSpeechText(spokenText);

  if (!cleanSpoken || !cleanExpected) return false;

  const expectedWords = cleanExpected.split(/\s+/).filter(Boolean);
  const spokenWords = cleanSpoken.split(/\s+/).filter(Boolean);

  if (isPronunciation) {
    // For single word pronunciation, target is usually 1 word
    if (expectedWords.length === 1 && spokenWords.length >= 1) {
      return spokenWords.some(w => isWordMatch(expectedWords[0], w));
    }
  }

  // For speaking sentences: every word must be present in exact order without missing any words!
  if (expectedWords.length !== spokenWords.length) {
    return false;
  }

  for (let i = 0; i < expectedWords.length; i++) {
    if (!isWordMatch(expectedWords[i], spokenWords[i])) {
      return false;
    }
  }

  return true;
}

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

                const isPronunciation = lessonParams.type === "pronunciation";
                const isMatch = evaluateSpeechTranscript(ex.content, transcript, isPronunciation);

                if (isMatch) {
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
    let wrongMsg = "Keep practicing.";
    if (lessonParams.type === "writing") {
      wrongMsg = `Correct sentence: ${ex.question}`;
    } else if (lessonParams.type === "speaking" || lessonParams.type === "pronunciation") {
      wrongMsg = `Please speak all words completely in order: '${ex.content}'`;
    }
    if (feedbackText) feedbackText.textContent = "Not quite. " + wrongMsg;
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