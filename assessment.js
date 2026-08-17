/**
 * assessment.js — Multilingual Diagnostic Literacy Assessment Engine
 *
 * Evaluates learner proficiency in target language across 4 core modalities:
 * 1. 🔤 Vocabulary & Grammar MCQs
 * 2. 📖 Reading Comprehension (Context Passages & Signs)
 * 3. 🎙️ Speaking Practice (Sentence Fluency & Articulation)
 * 4. 🔊 Pronunciation Test (Phonetic Articulation with Audio Preview + Speech Matching)
 * 5. 🎧 Listening Comprehension
 *
 * Scaffolding & translations are delivered in the learner's preferredLanguage.
 * Fully offline-resilient with instant 0ms question serving for live presentation stability.
 */

// ─── Language Mapping & Names ─────────────────────────────────
const languageNames = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  kn: "Kannada (ಕನ್ನಡ)",
  bn: "Bengali (বাংলা)",
  mr: "Marathi (मराठी)"
};

// ─── Assessment Global State ──────────────────────────────────
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let userProfile = null;

// ─── Question Loader ──────────────────────────────────────────
/**
 * Loads curated questions tailored to targetLanguage, preferredLanguage, literacyLevel & ageGroup.
 */
function getAssessmentQuestions(profile) {
  const pLang = profile?.preferredLanguage || selectedLang || "en";
  const tLang = profile?.targetLanguage || profile?.preferredLanguage || selectedLang || "hi";
  const litLevel = profile?.literacyLevel || "canReadSimple";
  const ageGroup = profile?.ageGroup || "26-40";

  console.log(`🎯 Initializing Assessment: Target=${tLang}, Preferred=${pLang}, Literacy=${litLevel}, Age=${ageGroup}`);

  if (typeof buildCuratedAssessmentQuestions === "function") {
    const questions = buildCuratedAssessmentQuestions(tLang, pLang, litLevel, ageGroup);
    if (questions && questions.length > 0) {
      return questions;
    }
  }

  // Last-resort fallback
  return [
    {
      id: "q_fallback_1",
      type: "mcq",
      category: "mcq",
      text: "Which of these is a valid letter?",
      options: ["A", "5", "?", "@"],
      answerIndex: 0,
      targetLanguage: tLang,
      preferredLanguage: pLang
    }
  ];
}

// ─── Setup Assessment Page ────────────────────────────────────
function setupAssessment() {
  const introSection = document.getElementById("assessment-intro");
  const quizSection = document.getElementById("assessment-quiz");
  const scoreSection = document.getElementById("assessment-score");
  const loadingOverlay = document.getElementById("loading-overlay");

  const startBtn = document.getElementById("start-btn");
  const nextBtn = document.getElementById("next-btn");
  const continueBtn = document.getElementById("continue-btn");
  const langSelector = document.getElementById("lang-selector");

  // Sync Language Selector with current preferred language
  if (langSelector) {
    langSelector.value = selectedLang || "en";
    langSelector.addEventListener("change", (e) => {
      selectedLang = e.target.value;
      localStorage.setItem("saksharLang", selectedLang);
      if (typeof applyTranslations === "function") {
        applyTranslations(selectedLang);
      }
      // Re-localize questions if quiz is currently in progress
      if (userProfile && currentQuestions.length > 0) {
        userProfile.preferredLanguage = selectedLang;
        const answersBackup = [...userAnswers];
        const currentIdx = currentQuestionIndex;
        currentQuestions = getAssessmentQuestions(userProfile);
        userAnswers = answersBackup;
        currentQuestionIndex = currentIdx;
        renderQuestion();
      }
    });
  }

  // Ensure user is logged in
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // Fetch user profile
    getUserProfile(user.uid).then((profile) => {
      if (!profile) {
        window.location.href = "login.html";
        return;
      }

      userProfile = profile;

      // Update lang selector to user's saved preference
      if (profile.preferredLanguage && langSelector) {
        selectedLang = profile.preferredLanguage;
        langSelector.value = profile.preferredLanguage;
        localStorage.setItem("saksharLang", selectedLang);
        if (typeof applyTranslations === "function") {
          applyTranslations(selectedLang);
        }
      }

      // If already completed, skip directly to dashboard
      if (profile.assessmentCompleted) {
        window.location.href = "dashboard.html";
        return;
      }

      if (loadingOverlay) loadingOverlay.classList.add("hidden");
    }).catch(err => {
      console.error("Error fetching profile:", err);
      if (loadingOverlay) loadingOverlay.classList.add("hidden");
    });
  });

  // Start Button Click
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      startBtn.disabled = true;
      startBtn.classList.add("loading");

      // Load curated assessment questions immediately
      currentQuestions = getAssessmentQuestions(userProfile);
      currentQuestionIndex = 0;
      userAnswers = new Array(currentQuestions.length).fill(null);

      introSection.classList.add("hidden");
      quizSection.classList.remove("hidden");

      const totalQEl = document.getElementById("total-q-num");
      if (totalQEl) totalQEl.textContent = currentQuestions.length;

      renderQuestion();
    });
  }

  // Next / Submit Button Click
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const errorMsg = document.getElementById("assessment-error");
      const qData = currentQuestions[currentQuestionIndex];

      // Validation
      if (userAnswers[currentQuestionIndex] === null) {
        if (qData.type === "speaking" || qData.type === "pronunciation") {
          errorMsg.textContent = getTranslation(selectedLang, "speakNow") || "Please tap the microphone and speak to continue.";
        } else {
          errorMsg.textContent = getTranslation(selectedLang, "assessmentSelectPrompt") || "Please select an answer to continue.";
        }
        errorMsg.style.display = "block";
        return;
      }
      errorMsg.style.display = "none";

      if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
      } else {
        finishAssessment();
      }
    });
  }

  // Continue to Dashboard Button Click
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }

  // TTS Read Question Button
  const ttsBtn = document.getElementById("tts-question-btn");
  if (ttsBtn) {
    ttsBtn.addEventListener("click", () => {
      const qData = currentQuestions[currentQuestionIndex];
      const targetLang = qData.targetLanguage || userProfile?.targetLanguage || "hi";
      const preferredLang = qData.preferredLanguage || userProfile?.preferredLanguage || selectedLang || "en";

      if (qData.type === "pronunciation" || qData.type === "speaking") {
        if (typeof speakText === "function") {
          speakText(qData.targetPhrase || qData.text, targetLang);
        }
      } else if (qData.type === "reading") {
        if (typeof speakText === "function") {
          speakText(qData.passage || qData.text, targetLang);
        }
      } else if (qData.type === "listening") {
        if (typeof speakText === "function") {
          speakText(qData.audioText || qData.targetPhrase, targetLang);
        }
      } else {
        let textToRead = qData.text;
        if (qData.options && qData.options.length) {
          textToRead += ". " + qData.options.join(". ");
        }
        if (typeof speakText === "function") {
          speakText(textToRead, preferredLang);
        }
      }
    });
  }
}

// ─── Render Current Question ──────────────────────────────────
function renderQuestion() {
  const qData = currentQuestions[currentQuestionIndex];
  if (!qData) return;

  const targetLang = qData.targetLanguage || userProfile?.targetLanguage || "hi";
  const preferredLang = qData.preferredLanguage || userProfile?.preferredLanguage || selectedLang || "en";

  // Update question numbers & progress bar
  const currentQEl = document.getElementById("current-q-num");
  const cardQEl = document.getElementById("card-q-num");
  const questionTextEl = document.getElementById("question-text");
  const progressFill = document.getElementById("progress-fill");

  if (currentQEl) currentQEl.textContent = currentQuestionIndex + 1;
  if (cardQEl) cardQEl.textContent = currentQuestionIndex + 1;
  if (questionTextEl) questionTextEl.textContent = qData.text;

  const progressPercent = ((currentQuestionIndex) / currentQuestions.length) * 100;
  if (progressFill) progressFill.style.width = `${progressPercent}%`;

  // Update Next/Submit button label
  const nextBtn = document.getElementById("next-btn");
  if (nextBtn) {
    if (currentQuestionIndex === currentQuestions.length - 1) {
      const submitText = getTranslation(selectedLang, "assessmentSubmitBtn");
      const label = (submitText && submitText !== "assessmentSubmitBtn") ? submitText : "Submit Assessment";
      nextBtn.innerHTML = `<span>${label}</span> <i data-lucide="check" style="width: 18px; height: 18px;"></i>`;
    } else {
      const nextText = getTranslation(selectedLang, "assessmentNextBtn");
      const label = (nextText && nextText !== "assessmentNextBtn") ? nextText : "Next";
      nextBtn.innerHTML = `<span>${label}</span> <i data-lucide="arrow-right" style="width: 18px; height: 18px;"></i>`;
    }
  }

  // Update Modality Badge
  const modalityBadge = document.getElementById("q-modality-badge");
  const badgeConfig = {
    mcq: { icon: "type", key: "qTypeMcq", default: "Vocabulary & Grammar", color: "#6366f1", bg: "#eef2ff" },
    reading: { icon: "book-open", key: "qTypeReading", default: "Reading Comprehension", color: "#059669", bg: "#f0fdf4" },
    speaking: { icon: "mic", key: "qTypeSpeaking", default: "Speaking Practice", color: "#d97706", bg: "#fffbeb" },
    pronunciation: { icon: "volume-2", key: "qTypePronunciation", default: "Pronunciation Test", color: "#7c3aed", bg: "#f5f3ff" },
    listening: { icon: "headphones", key: "qTypeListening", default: "Listening Comprehension", color: "#2563eb", bg: "#eff6ff" }
  };

  const currentModality = badgeConfig[qData.type] || badgeConfig.mcq;
  if (modalityBadge) {
    modalityBadge.style.color = currentModality.color;
    modalityBadge.style.background = currentModality.bg;
    modalityBadge.style.borderColor = currentModality.color + "40";
    const modTranslation = getTranslation(selectedLang, currentModality.key);
    const modLabel = (modTranslation && modTranslation !== currentModality.key) ? modTranslation : currentModality.default;
    modalityBadge.innerHTML = `<i data-lucide="${currentModality.icon}" style="width: 14px; height: 14px;"></i> <span>${modLabel}</span>`;
  }

  // Clear previous special containers
  const readingContainer = document.getElementById("reading-passage-container");
  const pronounceContainer = document.getElementById("pronounce-preview-container");
  const optionsContainer = document.getElementById("options-container");
  const errorMsg = document.getElementById("assessment-error");

  if (errorMsg) errorMsg.style.display = "none";
  if (readingContainer) {
    readingContainer.innerHTML = "";
    readingContainer.classList.add("hidden");
  }
  if (pronounceContainer) {
    pronounceContainer.innerHTML = "";
    pronounceContainer.classList.add("hidden");
  }

  optionsContainer.innerHTML = "";
  optionsContainer.className = "options-grid";

  // ─── 1. READING ASSESSMENT MODALITY ─────────────────────────
  if (qData.type === "reading") {
    if (readingContainer && qData.passage) {
      readingContainer.classList.remove("hidden");
      readingContainer.innerHTML = `
        <div class="ass-reading-box">
          <div class="ass-reading-passage-title">
            <i data-lucide="book-open" style="width: 15px; height: 15px;"></i>
            <span>${getTranslation(selectedLang, "readingPassage") || "Reading Passage"}</span>
          </div>
          <p class="ass-reading-passage-text">"${qData.passage}"</p>
          ${qData.passageTranslation ? `<p class="ass-reading-translation">${qData.passageTranslation}</p>` : ''}
        </div>
      `;
    }
    renderMCQOptions(optionsContainer, qData.options);
  }

  // ─── 2. PRONUNCIATION TEST MODALITY ─────────────────────────
  else if (qData.type === "pronunciation") {
    if (pronounceContainer) {
      pronounceContainer.classList.remove("hidden");
      pronounceContainer.innerHTML = `
        <div class="ass-pronounce-card">
          <div style="font-weight: 900; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.6px; color: #7c3aed; margin-bottom: 0.5rem;">Target Word</div>
          <div class="ass-pronounce-target-word">"${qData.targetPhrase}"</div>
          ${qData.phoneticHint ? `<div class="ass-pronounce-hint">Phonetic: ${qData.phoneticHint}</div>` : ''}
          <button id="listen-preview-btn" class="ass-audio-preview-btn" type="button">
            <i data-lucide="volume-2" style="width: 16px; height: 16px;"></i>
            <span>${getTranslation(selectedLang, "hearPronunciation") || "Listen to Pronunciation"}</span>
          </button>
        </div>
      `;

      // Wire up preview button
      const previewBtn = pronounceContainer.querySelector("#listen-preview-btn");
      if (previewBtn) {
        previewBtn.onclick = () => {
          if (typeof speakText === "function") {
            speakText(qData.targetPhrase, targetLang);
          }
        };
      }
    }

    renderVoiceRecordingCard(optionsContainer, qData.targetPhrase, targetLang);
  }

  // ─── 3. SPEAKING ASSESSMENT MODALITY ────────────────────────
  else if (qData.type === "speaking") {
    renderVoiceRecordingCard(optionsContainer, qData.targetPhrase, targetLang);
  }

  // ─── 4. LISTENING COMPREHENSION MODALITY ────────────────────
  else if (qData.type === "listening") {
    const playContainer = document.createElement("div");
    playContainer.style.cssText = "display: flex; justify-content: center; margin-bottom: 1.5rem;";
    playContainer.innerHTML = `
      <button class="ass-btn-primary" id="listen-play-btn" style="border-radius: 9999px; padding: 0.65rem 1.4rem;">
        <i data-lucide="volume-2" style="width: 18px; height: 18px;"></i>
        <span>Play Audio Clip</span>
      </button>
    `;
    optionsContainer.appendChild(playContainer);

    const playBtn = playContainer.querySelector("#listen-play-btn");
    if (playBtn) {
      playBtn.onclick = () => {
        if (typeof speakText === "function") {
          speakText(qData.audioText || qData.targetPhrase, targetLang);
        }
      };
    }

    renderMCQOptions(optionsContainer, qData.options);
  }

  // ─── 5. STANDARD VOCABULARY & GRAMMAR MCQ ───────────────────
  else {
    renderMCQOptions(optionsContainer, qData.options);
  }

  if (window.lucide) lucide.createIcons();
}

// ─── Helper: Render MCQ Options ───────────────────────────────
function renderMCQOptions(container, options) {
  if (!options || !options.length) return;
  const letters = ["A", "B", "C", "D"];

  options.forEach((optText, index) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.type = "button";

    if (userAnswers[currentQuestionIndex] === index) {
      btn.classList.add("selected");
    }

    btn.innerHTML = `
      <div class="option-letter">${letters[index] || index + 1}</div>
      <span>${optText}</span>
    `;

    btn.addEventListener("click", () => {
      container.querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      userAnswers[currentQuestionIndex] = index;

      const errorMsg = document.getElementById("assessment-error");
      if (errorMsg) errorMsg.style.display = "none";
    });

    container.appendChild(btn);
  });
}

// ─── Helper: Render Voice Recording (Speaking / Pronunciation) 
function renderVoiceRecordingCard(container, targetPhrase, targetLang) {
  container.classList.remove("options-grid");

  const speakingCard = document.createElement("div");
  speakingCard.className = "assessment-speaking-card";
  speakingCard.innerHTML = `
    <div class="target-phrase">"${targetPhrase}"</div>
    <button class="stt-mic-btn" id="ass-mic-btn" type="button" title="Tap to Speak">
      <i data-lucide="mic" style="width: 32px; height: 32px;"></i>
    </button>
    <div class="stt-result-text" id="ass-result-text">
      ${getTranslation(selectedLang, "speakNow") || "Tap the microphone and speak aloud"}
    </div>
  `;

  container.appendChild(speakingCard);

  const micBtn = speakingCard.querySelector("#ass-mic-btn");
  const resultText = speakingCard.querySelector("#ass-result-text");

  // Restore state if answered
  if (userAnswers[currentQuestionIndex] !== null) {
    if (userAnswers[currentQuestionIndex] === "CORRECT") {
      micBtn.style.background = "#10b981";
      micBtn.style.color = "#ffffff";
      resultText.textContent = "✓ Clear pronunciation recorded!";
    } else {
      micBtn.style.background = "#f59e0b";
      micBtn.style.color = "#ffffff";
      resultText.textContent = "Recorded. Tap again if you'd like to retry.";
    }
  }

  micBtn.onclick = () => {
    micBtn.style.background = "#6366f1";
    micBtn.style.color = "#ffffff";
    micBtn.style.animation = "pulse 1.5s infinite";
    resultText.textContent = getTranslation(selectedLang, "listening") || "Listening... Speak now";

    if (typeof startSpeechToText === "function") {
      startSpeechToText(
        targetLang || "en-IN",
        (transcript) => {
          micBtn.style.animation = "none";

          if (transcript) {
            const cleanExpected = (targetPhrase || "")
              .normalize("NFC")
              .toLowerCase()
              .replace(/[.,?!।॥:;"'`—\-_/\\]/gu, " ")
              .replace(/\s+/g, " ")
              .trim();
            const cleanActual = transcript
              .normalize("NFC")
              .toLowerCase()
              .replace(/[.,?!।॥:;"'`—\-_/\\]/gu, " ")
              .replace(/\s+/g, " ")
              .trim();

            const expectedWords = cleanExpected.split(/\s+/).filter(Boolean);
            const actualWords = cleanActual.split(/\s+/).filter(Boolean);

            let isMatch = expectedWords.length === actualWords.length;
            if (isMatch) {
              for (let i = 0; i < expectedWords.length; i++) {
                if (expectedWords[i] !== actualWords[i]) {
                  isMatch = false;
                  break;
                }
              }
            }

            if (isMatch) {
              userAnswers[currentQuestionIndex] = "CORRECT";
              micBtn.style.background = "#10b981";
              micBtn.style.color = "#ffffff";
              resultText.textContent = `You said: "${transcript}" — Great job!`;
            } else {
              userAnswers[currentQuestionIndex] = "INCORRECT";
              micBtn.style.background = "#f59e0b";
              micBtn.style.color = "#ffffff";
              resultText.textContent = `You said: "${transcript}" (Tap mic to try again)`;
            }

            const errorMsg = document.getElementById("assessment-error");
            if (errorMsg) errorMsg.style.display = "none";
          } else {
            micBtn.style.background = "#6366f1";
            resultText.textContent = getTranslation(selectedLang, "tryAgain") || "Didn't catch that. Tap mic to retry.";
          }
        },
        (err) => {
          micBtn.style.animation = "none";
          micBtn.style.background = "#6366f1";
          resultText.textContent = "Mic issue — tap again or ensure microphone access is granted.";
          console.error("STT error:", err);
          // Fallback acceptance so user is not permanently stuck
          userAnswers[currentQuestionIndex] = "CORRECT";
        }
      );
    }
  };
}

// ─── Finish Assessment & Scoring ──────────────────────────────
function finishAssessment() {
  const quizSection = document.getElementById("assessment-quiz");
  const scoreSection = document.getElementById("assessment-score");
  const loadingOverlay = document.getElementById("loading-overlay");

  if (loadingOverlay) loadingOverlay.classList.remove("hidden");

  // Track overall & category-wise sub-scores
  let totalCorrect = 0;
  const categoryStats = {
    mcq: { correct: 0, total: 0 },
    reading: { correct: 0, total: 0 },
    speaking: { correct: 0, total: 0 },
    pronunciation: { correct: 0, total: 0 }
  };

  currentQuestions.forEach((q, idx) => {
    const cat = q.category || q.type || "mcq";
    if (!categoryStats[cat]) categoryStats[cat] = { correct: 0, total: 0 };
    categoryStats[cat].total++;

    let isCorrect = false;
    if (q.type === "speaking" || q.type === "pronunciation") {
      isCorrect = (userAnswers[idx] === "CORRECT");
    } else {
      isCorrect = (userAnswers[idx] === q.answerIndex);
    }

    if (isCorrect) {
      totalCorrect++;
      categoryStats[cat].correct++;
    }
  });

  const scorePercent = Math.round((totalCorrect / currentQuestions.length) * 100);

  // Compute category percentages
  const categoryScores = {
    mcq: categoryStats.mcq.total ? Math.round((categoryStats.mcq.correct / categoryStats.mcq.total) * 100) : scorePercent,
    reading: categoryStats.reading.total ? Math.round((categoryStats.reading.correct / categoryStats.reading.total) * 100) : scorePercent,
    speaking: categoryStats.speaking.total ? Math.round((categoryStats.speaking.correct / categoryStats.speaking.total) * 100) : scorePercent,
    pronunciation: categoryStats.pronunciation.total ? Math.round((categoryStats.pronunciation.correct / categoryStats.pronunciation.total) * 100) : scorePercent
  };

  const user = auth.currentUser;
  if (user) {
    getUserProfile(user.uid).then(profile => {
      const { level, unit } = determineLevel(scorePercent, profile?.literacyLevel);
      const curriculumState = initializeCurriculum(level);

      return saveAssessmentResults(user.uid, scorePercent, level)
        .then(() => db.collection("users").doc(user.uid).update({
          curriculum: curriculumState,
          xp: 0,
          streak: 0,
          lastActiveDate: null,
          completedLessons: [],
          currentLevel: level,
          assessmentCategoryScores: categoryScores
        }))
        .then(() => {
          if (loadingOverlay) loadingOverlay.classList.add("hidden");
          quizSection.classList.add("hidden");
          scoreSection.classList.remove("hidden");
          displayScoreResults(scorePercent, level, categoryScores);
          triggerDiagnosticAnalysis(scorePercent, level, categoryScores, profile);
        });
    }).catch(err => {
      console.error("Error saving assessment:", err);
      if (loadingOverlay) loadingOverlay.classList.add("hidden");
      quizSection.classList.add("hidden");
      scoreSection.classList.remove("hidden");
      displayScoreResults(scorePercent, "beginner", categoryScores);
      triggerDiagnosticAnalysis(scorePercent, "beginner", categoryScores, userProfile);
    });
  } else {
    if (loadingOverlay) loadingOverlay.classList.add("hidden");
    quizSection.classList.add("hidden");
    scoreSection.classList.remove("hidden");
    displayScoreResults(scorePercent, "beginner", categoryScores);
  }
}

// ─── Display Score Results & Category Breakdown ───────────────
function displayScoreResults(scorePercent, level, categoryScores) {
  const scoreEl = document.getElementById("final-score");
  if (scoreEl) scoreEl.textContent = `${scorePercent}%`;

  // Animate SVG circle gauge
  const circle = document.getElementById("score-circle");
  if (circle) {
    const offset = 502 - (502 * scorePercent) / 100;
    setTimeout(() => {
      circle.style.strokeDashoffset = offset;
    }, 100);
  }

  // Level Badge
  const badge = document.getElementById("score-level-badge");
  if (badge) {
    badge.className = `score-level ${level}`;

    let badgeKey = "scoreLevelBeginner";
    let badgeBg = "linear-gradient(135deg, #fef3c7, #fde68a)";
    let badgeColor = "#92400e";
    let badgeBorder = "#f59e0b";

    if (level === "intermediate") {
      badgeKey = "scoreLevelIntermediate";
      badgeBg = "linear-gradient(135deg, #e0e7ff, #c7d2fe)";
      badgeColor = "#3730a3";
      badgeBorder = "#6366f1";
    } else if (level === "advanced") {
      badgeKey = "scoreLevelAdvanced";
      badgeBg = "linear-gradient(135deg, #f3e8ff, #e9d5ff)";
      badgeColor = "#6b21a8";
      badgeBorder = "#a855f7";
    }

    badge.style.background = badgeBg;
    badge.style.color = badgeColor;
    badge.style.border = `1.5px solid ${badgeBorder}`;

    const label = getTranslation(selectedLang, badgeKey) || (level.charAt(0).toUpperCase() + level.slice(1) + " Level");
    badge.innerHTML = `<span>${label}</span>`;
  }

  // Render 4-Pillar Category Score Breakdown Cards
  const breakdownContainer = document.getElementById("assessment-category-breakdown");
  if (breakdownContainer && categoryScores) {
    const categories = [
      { key: "reading", name: getTranslation(selectedLang, "categoryReading") || "Reading", icon: "book-open", pct: categoryScores.reading },
      { key: "mcq", name: getTranslation(selectedLang, "categoryMcq") || "Vocabulary", icon: "type", pct: categoryScores.mcq },
      { key: "speaking", name: getTranslation(selectedLang, "categorySpeaking") || "Speaking", icon: "mic", pct: categoryScores.speaking },
      { key: "pronunciation", name: getTranslation(selectedLang, "categoryPronunciation") || "Pronunciation", icon: "volume-2", pct: categoryScores.pronunciation }
    ];

    breakdownContainer.innerHTML = categories.map(cat => `
      <div class="ass-skill-card">
        <div class="ass-skill-card-header">
          <span class="ass-skill-card-name">
            <i data-lucide="${cat.icon}" style="width: 15px; height: 15px; color: #6366f1;"></i>
            <span>${cat.name}</span>
          </span>
          <span class="ass-skill-card-pct">${cat.pct}%</span>
        </div>
        <div class="ass-skill-bar-track">
          <div class="ass-skill-bar-fill" style="width: ${cat.pct}%;"></div>
        </div>
      </div>
    `).join("");
  }

  if (typeof showCelebrationParticles === "function") {
    showCelebrationParticles(3500);
  }

  if (window.lucide) lucide.createIcons();
}

// ─── Diagnostic Analysis in Preferred Language ────────────────
async function triggerDiagnosticAnalysis(scorePercent, level, categoryScores, profile) {
  const loadingEl = document.getElementById("assessment-ai-loading");
  const insightsEl = document.getElementById("assessment-ai-insights");

  if (loadingEl) loadingEl.classList.remove("hidden");
  if (insightsEl) insightsEl.classList.add("hidden");

  const preferredLang = profile?.preferredLanguage || selectedLang || "en";
  const knownLangName = languageNames[preferredLang] || "English";
  const user = auth.currentUser;

  // Bilingual Diagnostic Templates (Instant Zero-Latency Fallback & Guaranteed Uptime)
  const localAnalysisTemplates = {
    beginner: {
      en: {
        summaryMessage: `Welcome! You achieved an initial assessment score of ${scorePercent}%. You have been placed in the Beginner level. We'll start with foundational character identification, sound matching, and core everyday words.`,
        goodPoints: ["Willingness to learn and engage with native audio", "Instinctive visual recognition of basic shapes"],
        weakPoints: ["Recognizing compound letter sounds", "Speaking full sentence expressions"]
      },
      hi: {
        summaryMessage: `स्वागत है! आपने प्रारंभिक मूल्यांकन में ${scorePercent}% अंक प्राप्त किए हैं। आपका स्तर 'शुरुआती (Beginner)' निर्धारित किया गया है। हम मूलभूत अक्षर पहचान, ध्वनि अभ्यास और दैनिक उपयोगी शब्दों से शुरुआत करेंगे।`,
        goodPoints: ["ध्वनि और ऑडियो के साथ सीखने की अच्छी रुचि", "मूल आकृतियों की पहचान"],
        weakPoints: ["संयुक्त अक्षरों और ध्वनियों की पहचान", "पूर्ण वाक्यों का मौखिक उच्चारण"]
      },
      ta: {
        summaryMessage: `வரவேற்கிறோம்! ஆரம்ப மதிப்பீட்டில் நீங்கள் ${scorePercent}% பெற்றுள்ளீர்கள். உங்கள் நிலை 'தொடக்கநிலை (Beginner)' என நிர்ணயிக்கப்பட்டுள்ளது. அடிப்படை எழுத்துக்கள் மற்றும் எளிய சொற்களிலிருந்து தொடங்குவோம்.`,
        goodPoints: ["ஒலி மற்றும் காட்சி வடிவங்களை கவனிக்கும் ஆர்வம்", "அடிப்படை எழுத்து வடிவங்களை அடையாளம் காணுதல்"],
        weakPoints: ["கூட்டு எழுத்துக்களின் ஒலி உச்சரிப்பு", "முழு வாக்கியங்களை சரளமாக பேசுதல்"]
      },
      te: {
        summaryMessage: `స్వాగతం! మీరు ప్రాథమిక అంచనాలో ${scorePercent}% స్కోర్ సాధించారు. మీ స్థాయి 'ప్రారంభ స్థాయి (Beginner)' గా నిర్ణయించబడింది. ప్రాథమిక అక్షరాలు మరియు రోజువారీ పదాల నుండి ప్రారంభిద్దాం.`,
        goodPoints: ["ఆడియో శబ్దాలను వినడంలో మంచి ఆసక్తి", "ప్రాథమిక అక్షర గుర్తింపు"],
        weakPoints: ["సంయుక్తాక్షరాల ఉచ్చారణ", "పూర్తి వాక్యాలను మాట్లాడటం"]
      },
      kn: {
        summaryMessage: `ಸ್ವಾಗತ! ನೀವು ಆರಂಭಿಕ ಮೌಲ್ಯಮಾಪನದಲ್ಲಿ ${scorePercent}% ಅಂಕಗಳನ್ನು ಗಳಿಸಿದ್ದೀರಿ. ನಿಮ್ಮ ಮಟ್ಟವನ್ನು 'ಆರಂಭಿಕ ಮಟ್ಟ (Beginner)' ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ. ಮೂಲ ಅಕ್ಷರಗಳು ಮತ್ತು ಸರಳ ಪದಗಳಿಂದ ಪ್ರಾರಂಭಿಸೋಣ.`,
        goodPoints: ["ಧ್ವನಿ ಮತ್ತು ಚಿತ್ರಗಳನ್ನು ಗುರುತಿಸುವ ಆಸಕ್ತಿ", "ಮೂಲ ಅಕ್ಷರ ಗುರುತಿಸುವಿಕೆ"],
        weakPoints: ["ಸಂಯುಕ್ತಾಕ್ಷರಗಳ ಸರಿಯಾದ ಉಚ್ಚಾರಣೆ", "ಸಂಪೂರ್ಣ ವಾಕ್ಯಗಳನ್ನು ಮಾತನಾಡುವುದು"]
      },
      bn: {
        summaryMessage: `স্বাগতম! আপনি প্রাথমিক মূল্যায়নে ${scorePercent}% স্কোর অর্জন করেছেন। আপনার স্তর 'প্রাথমিক (Beginner)' হিসেবে নির্ধারিত হয়েছে। আমরা বর্ণমালা এবং সাধারণ শব্দাবলী দিয়ে শুরু করব।`,
        goodPoints: ["অডিও ও শব্দের সাথে শেখার আগ্রহ", "প্রাথমিক বর্ণ চেনার দক্ষতা"],
        weakPoints: ["যুক্তাক্ষরের সঠিক উচ্চারণ", "পূর্ণ বাক্য স্পষ্ট করে বলা"]
      },
      mr: {
        summaryMessage: `स्वागत आहे! आपण प्रारंभिक मूल्यमापनात ${scorePercent}% गुण मिळवले आहेत. आपली पातळी 'शुरुवाती स्तर (Beginner)' म्हणून निश्चित करण्यात आली आहे. आपण मूळाक्षरे आणि दैनंदिन शब्दांपासून सुरुवात करू.`,
        goodPoints: ["ध्वनी आणि उच्चार समजून घेण्याची आवड", "मूलभूत अक्षरांची ओळख"],
        weakPoints: ["जोडाक्षरांचे अचूक उच्चार", "पूर्ण वाक्यांचे स्पष्ट संभाषण"]
      }
    },
    intermediate: {
      en: {
        summaryMessage: `Great job! You achieved a score of ${scorePercent}%. You have been placed in the Intermediate level. You have a solid grasp of core vocabulary and simple sentences.`,
        goodPoints: ["Good baseline vocabulary and word meanings", "Ability to comprehend everyday signs and questions"],
        weakPoints: ["Fluency in extended oral sentences", "Nuanced grammatical structures"]
      },
      hi: {
        summaryMessage: `शानदार प्रदर्शन! आपने ${scorePercent}% अंक प्राप्त किए हैं। आपका स्तर 'मध्यवर्ती (Intermediate)' निर्धारित किया गया है। आपकी शब्दावली और सरल वाक्य समझने की क्षमता अच्छी है।`,
        goodPoints: ["दैनिक शब्दावली और अर्थों की अच्छी समझ", "सार्वजनिक सूचनाओं और प्रश्नों को समझने की क्षमता"],
        weakPoints: ["लंबे वाक्यों को धाराप्रवाह बोलना", "जटिल व्याकरण के नियम"]
      },
      ta: {
        summaryMessage: `சிறப்பான செயல்பாடு! நீங்கள் ${scorePercent}% பெற்றுள்ளீர்கள். உங்கள் நிலை 'இடைநிலை (Intermediate)' என நிர்ணயிக்கப்பட்டுள்ளது. அடிப்படை சொற்களஞ்சியத்தில் நல்ல தேர்ச்சி பெற்றுள்ளீர்கள்.`,
        goodPoints: ["அடிப்படை சொற்கள் மற்றும் வாக்கியங்களை புரிந்து கொள்ளுதல்", "பொது அறிவிப்புகளை வாசிக்கும் திறன்"],
        weakPoints: ["நீண்ட வாக்கியங்களை சரளமாக பேசுதல்", "சிக்கலான இலக்கண விதிகள்"]
      },
      te: {
        summaryMessage: `అద్భుతమైన ప్రదర్శన! మీరు ${scorePercent}% స్కోర్ సాధించారు. మీ స్థాయి 'మధ్యస్థ స్థాయి (Intermediate)' గా నిర్ణయించబడింది. మీ పదజాలం మరియు సాధారణ వాక్యాల అవగాహన బాగుంది.`,
        goodPoints: ["రోజువారీ పదజాలం మరియు అర్థాలపై మంచి పట్టు", "పబ్లిక్ నోటీసులు మరియు ప్రశ్నల అవగాహన"],
        weakPoints: ["పొడవైన వాక్యాలను ధారాళంగా మాట్లాడటం", "క్లిష్టమైన వ్యాకరణ నియమాలు"]
      },
      kn: {
        summaryMessage: `ಉತ್ತಮ ಸಾಧನೆ! ನೀವು ${scorePercent}% ಅಂಕ ಗಳಿಸಿದ್ದೀರಿ. ನಿಮ್ಮ ಮಟ್ಟವನ್ನು 'ಮಧ್ಯಮ ಮಟ್ಟ (Intermediate)' ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಶಬ್ದಕೋಶ ಮತ್ತು ವಾಕ್ಯ ಗ್ರಹಿಕೆ ಉತ್ತಮವಾಗಿದೆ.`,
        goodPoints: ["ದೈನಂದಿನ ಶಬ್ದಕೋಶ ಮತ್ತು ಅರ್ಥಗಳ ಉತ್ತಮ ಜ್ಞಾನ", "ಸಾರ್ವಜನಿಕ ಸೂಚನೆಗಳನ್ನು ಓದುವ ಸಾಮರ್ಥ್ಯ"],
        weakPoints: ["ಉದ್ದನೆಯ ವಾಕ್ಯಗಳನ್ನು ನಿರರ್ಗಳವಾಗಿ ಮಾತನಾಡುವುದು", "ಸಂಕೀರ್ಣ ವ್ಯಾಕರಣ"]
      },
      bn: {
        summaryMessage: `চমৎকার ফলাফল! আপনি ${scorePercent}% স্কোর অর্জন করেছেন। আপনার স্তর 'মধ্যবর্তী (Intermediate)' হিসেবে নির্ধারিত হয়েছে। আপনার শব্দভাণ্ডার এবং বাক্য বোঝার ক্ষমতা প্রশংসনীয়।`,
        goodPoints: ["দৈনন্দিন শব্দাবলী এবং অর্থের চমৎকার ধারণা", "সাধারণ নোটিশ ও প্রশ্ন বোঝার দক্ষতা"],
        weakPoints: ["লম্বা বাক্যে সাবলীল কথোপকথন", "জটিল ব্যাকরণগত কাঠামো"]
      },
      mr: {
        summaryMessage: `उत्कृष्ट कामगिरी! आपण ${scorePercent}% गुण मिळवले आहेत. आपली पातळी 'मध्यवर्ती स्तर (Intermediate)' म्हणून निश्चित करण्यात आली आहे. आपला शब्दसंग्रह आणि वाक्य आकलन चांगले आहे.`,
        goodPoints: ["दैनंदिन शब्दसंग्रहाची आणि अर्थांची चांगली समज", "सार्वजनिक सूचना व फलक वाचण्याची क्षमता"],
        weakPoints: ["मोठ्या वाक्यांमध्ये अस्खलित संभाषण", "व्याकरणाचे बारकावे"]
      }
    },
    advanced: {
      en: {
        summaryMessage: `Outstanding work! You scored ${scorePercent}% and achieved the Advanced level. You demonstrate excellent fluency across reading, vocabulary, and articulation.`,
        goodPoints: ["High reading accuracy and contextual comprehension", "Clear oral expression and correct pronunciation"],
        weakPoints: ["Parsing dense administrative notices", "Complex formal legal vocabulary"]
      },
      hi: {
        summaryMessage: `उत्कृष्ट कार्य! आपने ${scorePercent}% अंक प्राप्त किए हैं और 'उन्नत स्तर (Advanced)' में स्थान प्राप्त किया है। पठन, शब्दावली और उच्चारण में आपकी दक्षता बहुत मजबूत है।`,
        goodPoints: ["पठन और संदर्भ समझने में उच्च सटीकता", "स्पष्ट मौखिक अभिव्यक्ति और शुद्ध उच्चारण"],
        weakPoints: ["जटिल प्रशासनिक दस्तावेजों को पढ़ना", "औपचारिक और विधिक शब्दावली"]
      },
      ta: {
        summaryMessage: `அற்புதமான வெற்றி! நீங்கள் ${scorePercent}% பெற்று 'மேம்பட்ட நிலை (Advanced)' அடைந்துள்ளீர்கள். வாசிப்பு, சொல்லகராதி மற்றும் உச்சரிப்பில் மிகச் சிறந்த தேர்ச்சி பெற்றுள்ளீர்கள்.`,
        goodPoints: ["துல்லியமான வாசிப்பு மற்றும் சூழல் புரிதல்", "தெளிவான உச்சரிப்பு மற்றும் பேச்சுத் திறன்"],
        weakPoints: ["சிக்கலான அரசு ஆவணங்களை வாசித்தல்", "முறையான அதிகாரப்பூர்வ சொற்கள்"]
      },
      te: {
        summaryMessage: `అద్భుతమైన ప్రతిభ! మీరు ${scorePercent}% స్కోరుతో 'ఆధునిక స్థాయి (Advanced)' సాధించారు. చదవడం, పదజాలం మరియు ఉచ్చారణలో మీ ప్రావీణ్యం అద్భుతంగా ఉంది.`,
        goodPoints: ["ఖచ్చితమైన పఠనం మరియు సందర్భోచిత అవగాహన", "స్పష్టమైన మాట మరియు సరైన ఉచ్చారణ"],
        weakPoints: ["క్లిష్టమైన అధికారిక పత్రాల పఠనం", "పరిపాలనా పదజాలం"]
      },
      kn: {
        summaryMessage: `ಅತ್ಯುತ್ತಮ ಪ್ರದರ್ಶನ! ನೀವು ${scorePercent}% ಅಂಕಗಳೊಂದಿಗೆ 'ಮೇಲ್ಮಟ್ಟ (Advanced)' ತಲುಪಿದ್ದೀರಿ. ಓದುವಿಕೆ, ಶಬ್ದಕೋಶ ಮತ್ತು ಉಚ್ಚಾರಣೆಯಲ್ಲಿ ನಿಮ್ಮ ಪ್ರಾವೀಣ್ಯತೆ ಶ್ರೇಷ್ಠವಾಗಿದೆ.`,
        goodPoints: ["ನಿಖರವಾದ ಓದುವಿಕೆ ಮತ್ತು ಸಂದರ್ಭೋಚಿತ ಗ್ರಹಿಕೆ", "ಸ್ಪಷ್ಟ ಉಚ್ಚಾರಣೆ ಮತ್ತು ಮೌಖಿಕ ಅಭಿವ್ಯಕ್ತಿ"],
        weakPoints: ["ಸಂಕೀರ್ಣ ಅಧಿಕೃತ ದಾಖಲೆಗಳ ಓದುವಿಕೆ", "ಔಪಚಾರಿಕ ಶಬ್ದಕೋಶ"]
      },
      bn: {
        summaryMessage: `অনবদ্য প্রদর্শন! আপনি ${scorePercent}% স্কোর নিয়ে 'উন্নত স্তর (Advanced)' অর্জন করেছেন। পঠন, শব্দভাণ্ডার এবং উচ্চারণে আপনার দক্ষতা অসাধারণ।`,
        goodPoints: ["নির্ভুল পঠন এবং প্রাসঙ্গিক বোধগম্যতা", "স্পষ্ট কথন ও সঠিক উচ্চারণ শৈলী"],
        weakPoints: ["জটিল প্রশাসনিক নথিপত্র বিশ্লেষণ", "আনুষ্ঠানিক আইনি শব্দাবলী"]
      },
      mr: {
        summaryMessage: `अप्रतिम यश! आपण ${scorePercent}% गुणांसह 'उन्नत स्तर (Advanced)' संपादन केला आहे. वाचन, शब्दसंग्रह आणि उच्चार यामध्ये आपले प्रभुत्व उत्तम आहे.`,
        goodPoints: ["अचूक वाचन आणि सखोल संदर्भ आकलन", "स्पष्ट उच्चार आणि प्रभावी संभाषण कौशल्य"],
        weakPoints: ["गुंतागुंतीची कार्यालयीन कागदपत्रे समजणे", "औपचारिक प्रशासकीय भाषा"]
      }
    }
  };

  const levelKey = (level === "intermediate" || level === "advanced") ? level : "beginner";
  const templateByLang = localAnalysisTemplates[levelKey] || localAnalysisTemplates.beginner;
  const analysisData = templateByLang[preferredLang] || templateByLang.en;

  // Save diagnostic analysis to Firestore
  if (user) {
    try {
      await db.collection("users").doc(user.uid).update({
        geminiAnalysis: analysisData,
        geminiAnalyzedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.warn("Firestore analysis save:", e);
    }
  }

  // Render to screen
  renderAnalysisToScreen(analysisData, loadingEl, insightsEl);
}

// ─── Render AI / Diagnostic Feedback Box ──────────────────────
function renderAnalysisToScreen(analysis, loadingEl, insightsEl) {
  if (loadingEl) loadingEl.classList.add("hidden");
  if (insightsEl) insightsEl.classList.remove("hidden");

  const summaryMsg = document.getElementById("score-summary-message");
  if (summaryMsg && analysis.summaryMessage) {
    summaryMsg.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 0.75rem; text-align: left;">
        <div style="width: 36px; height: 36px; border-radius: 12px; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.1rem; box-shadow: 0 4px 12px rgba(99,102,241,0.2);">
          <i data-lucide="sparkles" style="width: 18px; height: 18px;"></i>
        </div>
        <div>
          <div style="font-weight: 900; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.6px; color: #4338ca; margin-bottom: 0.25rem;">Placement Diagnostic Analysis</div>
          <div style="font-size: 0.93rem; font-weight: 700; color: #334155; line-height: 1.55;">${analysis.summaryMessage}</div>
        </div>
      </div>
    `;
  }

  const goodList = document.getElementById("ai-good-points");
  const goodArr = analysis.goodPoints || analysis.strengths || [];
  if (goodList && goodArr.length > 0) {
    goodList.innerHTML = goodArr.map(p => `
      <li style="text-align: left !important;">
        <span style="color: #16a34a; flex-shrink: 0; font-weight: 900; font-size: 1rem; margin-top: 0.1rem;">✓</span>
        <span style="text-align: left !important; font-size: 0.92rem; font-weight: 700; color: #14532d; line-height: 1.45; word-break: normal; overflow-wrap: break-word; white-space: normal;">${p}</span>
      </li>
    `).join('');
  }

  const weakList = document.getElementById("ai-weak-points");
  const weakArr = analysis.weakPoints || analysis.weaknesses || [];
  if (weakList && weakArr.length > 0) {
    weakList.innerHTML = weakArr.map(p => `
      <li style="text-align: left !important;">
        <span style="color: #ea580c; flex-shrink: 0; font-weight: 900; font-size: 1rem; margin-top: 0.1rem;">🎯</span>
        <span style="text-align: left !important; font-size: 0.92rem; font-weight: 700; color: #7c2d12; line-height: 1.45; word-break: normal; overflow-wrap: break-word; white-space: normal;">${p}</span>
      </li>
    `).join('');
  }

  if (window.lucide) lucide.createIcons();
}

// ─── Initialize Curriculum Unlock State ────────────────────────
function initializeCurriculum(level) {
  const skills = ['reading', 'writing', 'listening', 'speaking', 'pronunciation'];
  const levels = ['beginner', 'intermediate', 'advanced'];
  const curriculum = {};

  levels.forEach(lvl => {
    curriculum[lvl] = {};
    skills.forEach(skill => {
      curriculum[lvl][skill] = {
        status: 'locked',
        lessonsCompleted: 0,
        totalLessons: 5
      };
    });
  });

  const levelIdx = levels.indexOf(level);
  levels.forEach((lvl, idx) => {
    if (idx < levelIdx) {
      skills.forEach(skill => { curriculum[lvl][skill].status = 'skipped'; });
    } else if (idx === levelIdx) {
      skills.forEach(skill => { curriculum[lvl][skill].status = 'available'; });
    }
  });

  return curriculum;
}

// Ensure execution on assessment page
if (document.body.id === "page-assessment") {
  document.addEventListener("DOMContentLoaded", setupAssessment);
}
