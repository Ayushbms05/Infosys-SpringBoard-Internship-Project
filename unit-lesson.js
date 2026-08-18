/**
 * unit-lesson.js — Units Tab Lesson Engine
 *
 * ══════════════════════════════════════════════════════════════════
 * ISOLATION GUARANTEE:
 *   ❌  Does NOT call generateExercises() or lesson.js
 *   ❌  Does NOT read from or write to sharedLessonContent
 *   ❌  Does NOT call the Gemini API
 *   ✅  Reads exercises from UNITS_CONTENT (units-content.js)
 *   ✅  Writes completion to profile.unitProgress only
 *   ✅  Calls addXP() + updateStreak() from auth.js (generic/safe)
 * ══════════════════════════════════════════════════════════════════
 */

// ── State ─────────────────────────────────────────────────────────
let ulExercises = [];
let ulCurrentIndex = 0;
let ulScore = 0;
let ulTotalExercises = 0;
let ulSelectedAnswer = null;
let ulParams = {};
let ulUserProfile = null;
let ulLessonStartTime = Date.now();

// ── Parse URL params ──────────────────────────────────────────────
function ulParseParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    level: p.get("level") || "beginner",
    unitId: p.get("unit") || "",
    unitTitle: decodeURIComponent(p.get("unitTitle") || "Unit Lesson"),
    skill: p.get("type") || "reading",
  };
}

// ── Skill icons ───────────────────────────────────────────────────
const UL_SKILL_ICONS = {
  reading: "📖",
  writing: "✍️",
  listening: "🎧",
  speaking: "🎤",
  pronunciation: "🔤",
};

// ── Unit to Curriculum Mapping ─────────────────────────────────────
const UNIT_INDEX_MAP = {
  unit_greetings_numbers: { level: "beginner", lessonIndex: 1 },
  unit_daily_life: { level: "beginner", lessonIndex: 2 },
  unit_family: { level: "beginner", lessonIndex: 3 },
  unit_shopping: { level: "beginner", lessonIndex: 4 },
  unit_work: { level: "intermediate", lessonIndex: 1 },
  unit_health: { level: "intermediate", lessonIndex: 2 },
  unit_banking: { level: "intermediate", lessonIndex: 3 },
  unit_transit: { level: "advanced", lessonIndex: 1 },
  unit_government: { level: "advanced", lessonIndex: 2 },
  unit_workplace_comm: { level: "advanced", lessonIndex: 3 }
};

// ── Translation visibility based on level ─────────────────────────
function ulTranslationClass() {
  if (ulParams.level === "beginner") return "translation-prominent";
  if (ulParams.level === "intermediate") return "translation-muted";
  return "translation-hidden";
}

// ── Render current exercise ───────────────────────────────────────
function ulRenderExercise() {
  if (ulCurrentIndex >= ulTotalExercises) {
    ulShowComplete();
    return;
  }

  const ex = ulExercises[ulCurrentIndex];
  ulSelectedAnswer = null;

  const targetLang = ulUserProfile?.targetLanguage || "en";
  const knownLang = ulUserProfile?.preferredLanguage || "en";
  const targetLangName = (typeof getLanguageName === "function" ? getLanguageName(targetLang) : targetLang.toUpperCase());

  // Progress
  const pct = ((ulCurrentIndex + 1) / ulTotalExercises) * 100;
  const fillEl = document.getElementById("ul-progress-fill");
  if (fillEl) fillEl.style.width = `${pct}%`;

  // Instruction display
  const rawInstruction = ex.instruction || "Complete the exercise";
  const instEl = document.getElementById("ul-instruction-text");
  if (instEl) {
    instEl.innerHTML = `<i data-lucide="help-circle" style="width: 18px; height: 18px; color: #6366f1;"></i> <span>${rawInstruction}</span>`;
  }

  const body = document.getElementById("ul-exercise-body");
  let html = "";

  // 1. Listening
  if (ulParams.skill === "listening") {
    html += `
      <div style="text-align: center; margin: 1.5rem 0 2rem;">
        <button id="ul-listen-btn" style="width: 90px; height: 90px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; border: 4px solid #ffffff; box-shadow: 0 12px 28px rgba(99, 102, 241, 0.4); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); margin: 0 auto;">
          <i data-lucide="volume-2" style="width: 38px; height: 38px;"></i>
        </button>
        <p style="margin-top: 0.85rem; color: #6366f1; font-weight: 800; font-size: 0.95rem;">Tap to Listen</p>
      </div>
      <h3 class="exercise-question-text">${ex.question}</h3>
      <div class="exercise-options-grid" id="ul-mcq-options"></div>
    `;
  }

  // 2. Speaking / Pronunciation
  else if (ulParams.skill === "speaking" || ulParams.skill === "pronunciation") {
    html += `
      <div style="text-align: center; margin-bottom: 2rem; padding: 2rem 1.5rem; background: linear-gradient(135deg, #f8fafc, #eef2ff); border-radius: 24px; border: 2px solid #c7d2fe;">
        <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2.2rem; font-weight: 900; color: #4f46e5; margin: 0 0 0.5rem;">${ex.content}</h2>
        ${ex.translation ? `<p class="translation-text ${ulTranslationClass()}" style="margin: 0.5rem 0;">${ex.translation}</p>` : ''}
        <p style="color: #64748b; font-size: 1.05rem; font-weight: 700; margin: 0;">"${ex.question}"</p>
      </div>
      <div style="text-align: center; margin-bottom: 1rem;">
        <button id="ul-mic-btn" style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; border: 4px solid #ffffff; box-shadow: 0 10px 28px rgba(99, 102, 241, 0.4); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto; transition: all 0.3s;">
          <i data-lucide="mic" style="width: 32px; height: 32px;"></i>
        </button>
        <p id="ul-stt-result" style="color: #475569; margin-top: 1rem; font-weight: 800; font-size: 0.95rem; min-height: 24px;">Tap microphone to speak...</p>
      </div>
    `;
  }

  // 3. Writing (Sentence Builder)
  else if (ulParams.skill === "writing") {
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
        <div id="ul-dropzone" style="min-height: 68px; padding: 1rem; border: 2px dashed #6366f1; border-radius: 20px; display: flex; flex-wrap: wrap; gap: 0.65rem; background: #eef2ff; margin-bottom: 1.25rem; align-items: center;"></div>
        <div id="ul-wordbank" style="min-height: 68px; padding: 1rem; border: 1.5px solid #e2e8f0; border-radius: 20px; display: flex; flex-wrap: wrap; gap: 0.65rem; background: #f8fafc; align-items: center;"></div>
      </div>
    `;
  }

  // 4. Reading (Standard MCQ)
  else {
    html += `
      <div class="exercise-passage-card">
        <p class="exercise-passage-text">${ex.content}</p>
      </div>
      <h3 class="exercise-question-text">${ex.question}</h3>
      <div class="exercise-options-grid" id="ul-mcq-options"></div>
    `;
  }

  body.innerHTML = html;

  // Wire up top card TTS speaker button
  const ulTopTtsBtn = document.getElementById("ul-tts-btn");
  if (ulTopTtsBtn) {
    ulTopTtsBtn.style.display = "inline-flex";
    ulTopTtsBtn.onclick = () => {
      ulTopTtsBtn.style.transform = "scale(0.92)";
      setTimeout(() => (ulTopTtsBtn.style.transform = "scale(1)"), 150);
      const textToSpeak = ex.content || ex.question || "";
      if (typeof speakText === "function") {
        speakText(textToSpeak, targetLang);
      }
    };
  }

  // Reset feedback / buttons
  const feedbackEl = document.getElementById("ul-feedback");
  if (feedbackEl) feedbackEl.classList.add("hidden");

  const checkBtn = document.getElementById("ul-check-btn");
  if (checkBtn) {
    checkBtn.classList.remove("hidden");
    checkBtn.disabled = true;
  }

  const continueBtn = document.getElementById("ul-continue-btn");
  if (continueBtn) continueBtn.classList.add("hidden");

  // Wire up interaction
  if (ulParams.skill === "listening") {
    const listenBtn = document.getElementById("ul-listen-btn");
    if (listenBtn) {
      listenBtn.onclick = function () {
        this.style.transform = "scale(0.92)";
        setTimeout(() => (this.style.transform = "scale(1)"), 200);
        if (typeof speakText === "function") speakText(ex.content, targetLang);
      };
    }
    ulRenderMCQ(ex.options);

  } else if (ulParams.skill === "reading") {
    ulRenderMCQ(ex.options);

  } else if (ulParams.skill === "writing") {
    const bank = document.getElementById("ul-wordbank");
    const dropzone = document.getElementById("ul-dropzone");
    const shuffled = [...ex.options].sort(() => Math.random() - 0.5);
    shuffled.forEach(word => {
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
    ulSelectedAnswer = 0;

  } else if (ulParams.skill === "speaking" || ulParams.skill === "pronunciation") {
    const micBtn = document.getElementById("ul-mic-btn");
    const resultEl = document.getElementById("ul-stt-result");
    if (micBtn) {
      micBtn.onclick = () => {
        micBtn.style.background = "linear-gradient(135deg, #ef4444, #dc2626)";
        if (resultEl) resultEl.textContent = "Listening...";

        if (typeof startSpeechToText === "function") {
          startSpeechToText(
            targetLang,
            (transcript) => {
              micBtn.style.background = "linear-gradient(135deg, #6366f1, #4f46e5)";

              if (transcript) {
                if (resultEl) resultEl.textContent = `You said: "${transcript}"`;
                const isPronunciation = ulParams.skill === "pronunciation";
                const isMatch = ulEvaluateSpeechTranscript(ex.content, transcript, isPronunciation);
                ulSelectedAnswer = isMatch ? "CORRECT" : "INCORRECT";
                if (checkBtn) checkBtn.disabled = false;
              } else {
                if (resultEl) resultEl.textContent = "Didn't catch that. Tap mic to try again.";
              }
            },
            (err) => {
              micBtn.style.background = "linear-gradient(135deg, #6366f1, #4f46e5)";
              if (resultEl) resultEl.textContent = "Speech recognition issue — tap mic to try again.";
              console.error("STT error:", err);
            }
          );
        }
      };
    }
  }

  if (window.lucide) lucide.createIcons();
}

// ── Speech Evaluation Utilities ──────────────────────────────────
function ulCleanSpeechText(text) {
  if (!text) return "";
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.,?!।॥:;"'`—\-_/\\]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ulLevenshteinDistance(s1, s2) {
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

function ulIsWordMatch(w1, w2) {
  if (w1 === w2) return true;
  if (w1.length <= 3 || w2.length <= 3) return false;
  const dist = ulLevenshteinDistance(w1, w2);
  return dist <= 1;
}

function ulEvaluateSpeechTranscript(expectedText, spokenText, isPronunciation = false) {
  const cleanExpected = ulCleanSpeechText(expectedText);
  const cleanSpoken = ulCleanSpeechText(spokenText);

  if (!cleanSpoken || !cleanExpected) return false;

  const expectedWords = cleanExpected.split(/\s+/).filter(Boolean);
  const spokenWords = cleanSpoken.split(/\s+/).filter(Boolean);

  if (isPronunciation) {
    if (expectedWords.length === 1 && spokenWords.length >= 1) {
      return spokenWords.some(w => ulIsWordMatch(expectedWords[0], w));
    }
  }

  if (expectedWords.length !== spokenWords.length) {
    return false;
  }

  for (let i = 0; i < expectedWords.length; i++) {
    if (!ulIsWordMatch(expectedWords[i], spokenWords[i])) {
      return false;
    }
  }

  return true;
}

// ── Render MCQ buttons ────────────────────────────────────────────
function ulRenderMCQ(options) {
  const container = document.getElementById("ul-mcq-options");
  if (!container) return;
  container.innerHTML = "";
  const letters = ["A", "B", "C", "D"];
  options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "exercise-option-btn";
    btn.innerHTML = `<div class="exercise-option-letter">${letters[idx]}</div><span>${opt}</span>`;
    btn.onclick = () => {
      document.querySelectorAll("#ul-mcq-options .exercise-option-btn")
        .forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      ulSelectedAnswer = idx;
      const checkBtn = document.getElementById("ul-check-btn");
      if (checkBtn) checkBtn.disabled = false;
    };
    container.appendChild(btn);
  });
  if (window.lucide) lucide.createIcons();
}

// ── Check answer ──────────────────────────────────────────────────
function ulCheckAnswer() {
  const ex = ulExercises[ulCurrentIndex];
  let isCorrect = false;

  if (ulParams.skill === "writing") {
    const built = Array.from(document.getElementById("ul-dropzone").children)
      .map(c => c.textContent).join(" ").trim();
    const norm = s => s.toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();
    isCorrect = norm(built) === norm(ex.question);

  } else if (ulParams.skill === "speaking" || ulParams.skill === "pronunciation") {
    isCorrect = ulSelectedAnswer === "CORRECT";

  } else {
    isCorrect = ulSelectedAnswer === ex.answerIndex;
    document.querySelectorAll("#ul-mcq-options .exercise-option-btn").forEach((btn, idx) => {
      if (idx === ex.answerIndex) btn.classList.add("correct");
      else if (idx === ulSelectedAnswer && !isCorrect) btn.classList.add("incorrect");
      btn.disabled = true;
    });
  }

  const feedbackEl = document.getElementById("ul-feedback");
  feedbackEl.classList.remove("hidden", "correct", "incorrect");

  const feedbackIcon = document.getElementById("ul-feedback-icon");
  const feedbackText = document.getElementById("ul-feedback-text");

  if (isCorrect) {
    feedbackEl.classList.add("correct");
    if (feedbackIcon) feedbackIcon.innerHTML = `<i data-lucide="check-circle-2" style="width: 22px; height: 22px; color: #16a34a;"></i>`;
    if (feedbackText) feedbackText.textContent = "Correct! " + (ex.explanation || "Great job!");
    ulScore++;
    const xpEl = document.getElementById("ul-xp-value");
    if (xpEl) xpEl.textContent = parseInt(xpEl.textContent || "0") + 10;
  } else {
    feedbackEl.classList.add("incorrect");
    if (feedbackIcon) feedbackIcon.innerHTML = `<i data-lucide="x-circle" style="width: 22px; height: 22px; color: #dc2626;"></i>`;
    if (feedbackText) feedbackText.textContent = ulParams.skill === "writing"
      ? `Not quite. Correct sentence: ${ex.question}`
      : "Not quite. Keep practising.";
  }

  const checkBtn = document.getElementById("ul-check-btn");
  if (checkBtn) checkBtn.classList.add("hidden");

  const continueBtn = document.getElementById("ul-continue-btn");
  if (continueBtn) continueBtn.classList.remove("hidden");

  if (window.lucide) lucide.createIcons();
}

// ── Next exercise ─────────────────────────────────────────────────
function ulNextExercise() {
  ulCurrentIndex++;
  ulRenderExercise();
}

// ── Show completion screen ────────────────────────────────────────
async function ulShowComplete() {
  const contentEl = document.getElementById("ul-lesson-content");
  if (contentEl) contentEl.classList.add("hidden");

  const completeEl = document.getElementById("ul-lesson-complete");
  if (completeEl) completeEl.classList.remove("hidden");

  const fillEl = document.getElementById("ul-progress-fill");
  if (fillEl) fillEl.style.width = "100%";

  const accuracy = ulTotalExercises > 0
    ? Math.round((ulScore / ulTotalExercises) * 100)
    : 0;
  const xpEarned = ulScore * 10;

  const scoreEl = document.getElementById("ul-complete-score");
  if (scoreEl) scoreEl.textContent = accuracy + "%";

  const xpEl = document.getElementById("ul-complete-xp");
  if (xpEl) xpEl.textContent = "+" + xpEarned;

  const user = auth.currentUser;
  if (user) {
    if (typeof addXP === "function") await addXP(user.uid, xpEarned);
    if (typeof updateStreak === "function") await updateStreak(user.uid);

    try {
      const fieldPath = `unitProgress.${ulParams.level}.${ulParams.unitId}.${ulParams.skill}`;
      const scoreFieldPath = `unitProgressScores.${ulParams.level}.${ulParams.unitId}.${ulParams.skill}`;
      const lessonKey = `unit_${ulParams.level}_${ulParams.unitId}_${ulParams.skill}`;

      await db.collection("users").doc(user.uid).update({
        [fieldPath]: true,
        [scoreFieldPath]: accuracy,
        completedLessons: firebase.firestore.FieldValue.arrayUnion(lessonKey)
      });

      const durationSeconds = Math.round((Date.now() - ulLessonStartTime) / 1000);
      await db.collection("users").doc(user.uid).collection("lessonHistory").add({
        type: ulParams.skill,
        level: ulParams.level,
        unit: ulParams.unitId,
        accuracy: accuracy,
        xpEarned: xpEarned,
        durationSeconds: durationSeconds,
        completedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      const localMap = JSON.parse(localStorage.getItem("akshar_lesson_scores") || "{}");
      localMap[lessonKey] = accuracy;
      localStorage.setItem("akshar_lesson_scores", JSON.stringify(localMap));
      console.log(`[unit-lesson.js] ✅ Marked complete & logged history: ${fieldPath} with score ${accuracy}%`);
    } catch (e) {
      console.warn("[unit-lesson.js] Could not mark unit lesson complete:", e);
    }

    if (typeof updateQuestProgress === "function") {
      updateQuestProgress(user.uid, "lesson", 1);
      updateQuestProgress(user.uid, "xp", xpEarned);
    }

    if (typeof getUserProgress === "function" && typeof checkAndAwardBadges === "function") {
      try {
        const freshProfile = await getUserProgress(user.uid);
        const newlyEarnedBadges = await checkAndAwardBadges(user.uid, freshProfile);
        if (typeof showBadgeCelebration === "function") {
          for (const badgeId of newlyEarnedBadges) {
            await showBadgeCelebration(badgeId);
          }
        }
      } catch (err) {
        console.warn("[unit-lesson.js] Badge check error:", err);
      }
    }
  }

  if (typeof showCelebrationParticles === "function") {
    showCelebrationParticles();
  }

  const nextBtn = document.getElementById("ul-next-btn");
  if (nextBtn) {
    nextBtn.onclick = () => {
      window.location.href = "dashboard.html";
    };
  }

  if (window.lucide) lucide.createIcons();
}

// ── Initialise ────────────────────────────────────────────────────
async function ulSetupLesson() {
  ulParams = ulParseParams();

  await new Promise(resolve => {
    auth.onAuthStateChanged(user => {
      if (!user) { window.location.href = "login.html"; return; }
      resolve(user);
    });
  });

  try {
    const snap = await db.collection("users").doc(auth.currentUser.uid).get();
    ulUserProfile = snap.exists ? snap.data() : {};
  } catch (e) {
    ulUserProfile = {};
  }

  const targetLang = ulUserProfile?.targetLanguage || (typeof selectedLang !== "undefined" ? selectedLang : "en");
  const prefLang   = ulUserProfile?.preferredLanguage || (typeof selectedLang !== "undefined" ? selectedLang : null) || localStorage.getItem("akshar_user_lang") || "kn";

  ulExercises = [];

  // 1. Direct Dedicated Units Content Provider (units-content.js)
  if (typeof getUnitExercises === "function") {
    ulExercises = getUnitExercises(ulParams.unitId, ulParams.skill, targetLang, prefLang) || [];
    ulTotalExercises = ulExercises.length;
  }

  // 2. Fallback to UNITS_CONTENT if not resolved
  if (ulExercises.length === 0 && typeof UNITS_CONTENT !== "undefined" && UNITS_CONTENT[ulParams.unitId]) {
    ulExercises = UNITS_CONTENT[ulParams.unitId][ulParams.skill] || [];
    ulTotalExercises = ulExercises.length;
  }

  ulTotalExercises = ulExercises.length;
  ulLessonStartTime = Date.now();

  if (ulTotalExercises === 0) {
    const overlay = document.getElementById("ul-loading-overlay");
    if (overlay) overlay.style.display = "none";
    const bodyEl = document.getElementById("ul-exercise-body");
    if (bodyEl) {
      bodyEl.innerHTML =
        `<p style="text-align:center;color:#64748b;padding:2rem;font-weight:700;">
           No content found for this unit. Please check back soon.
         </p>`;
    }
    return;
  }

  const titleEl = document.getElementById("ul-lesson-title");
  if (titleEl) titleEl.textContent = `${ulParams.unitTitle}`;

  const lvlEl = document.getElementById("ul-level-badge");
  if (lvlEl) {
    lvlEl.textContent = ulParams.level.charAt(0).toUpperCase() + ulParams.level.slice(1);
    lvlEl.className = `lesson-chip`;
  }

  const typeEl = document.getElementById("ul-type-badge");
  if (typeEl) {
    typeEl.textContent = `${UL_SKILL_ICONS[ulParams.skill] || "📖"} ${ulParams.skill.charAt(0).toUpperCase() + ulParams.skill.slice(1)}`;
  }

  const checkBtn = document.getElementById("ul-check-btn");
  if (checkBtn) checkBtn.onclick = ulCheckAnswer;

  const continueBtn = document.getElementById("ul-continue-btn");
  if (continueBtn) continueBtn.onclick = ulNextExercise;

  const overlay = document.getElementById("ul-loading-overlay");
  if (overlay) overlay.style.display = "none";

  ulRenderExercise();
}

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", ulSetupLesson);
