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
let ulExercises        = [];
let ulCurrentIndex     = 0;
let ulScore            = 0;
let ulTotalExercises   = 0;
let ulSelectedAnswer   = null;
let ulParams           = {};
let ulUserProfile      = null;
let ulLessonStartTime  = Date.now();

// ── Parse URL params ──────────────────────────────────────────────
function ulParseParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    level:      p.get("level")     || "beginner",
    unitId:     p.get("unit")      || "",
    unitTitle:  decodeURIComponent(p.get("unitTitle") || "Unit Lesson"),
    skill:      p.get("type")      || "reading",
  };
}

// ── Skill icons ───────────────────────────────────────────────────
const UL_SKILL_ICONS = {
  reading:       "📖",
  writing:       "✍️",
  listening:     "🎧",
  speaking:      "🎤",
  pronunciation: "🔤",
};

// ── Translation visibility based on level ─────────────────────────
function ulTranslationClass() {
  if (ulParams.level === "beginner")     return "translation-prominent";
  if (ulParams.level === "intermediate") return "translation-muted";
  return "translation-hidden";
}

// ── Instruction Translation Map ───────────────────────────────────
const UL_INSTRUCTION_MAP = {
  hi: {
    "Read and answer": "पढ़ें और उत्तर दें",
    "Listen and answer": "सुनें और उत्तर दें",
    "Arrange the words to make a correct sentence": "शब्दों को सही क्रम में व्यवस्थित करें",
    "Arrange the words": "शब्दों को सही क्रम में व्यवस्थित करें",
    "Tap the mic and say this out loud": "माइक टैप करके इसे ज़ोर से बोलें",
    "Tap the mic and pronounce this word clearly": "माइक टैप करके इस शब्द का स्पष्ट उच्चारण करें"
  }
};

// ── Question Translation Map ─────────────────────────────────────
const UL_QUESTION_MAP = {
  hi: {
    "What is the person's name?": "व्यक्ति का नाम क्या है?",
    "What is the speaker asking about?": "वक्ता किस बारे में पूछ रहा है?",
    "How many students are there?": "वहाँ कितने छात्र हैं?",
    "When does the shop open?": "दुकान कब खुलती है?",
    "What is the speaker asking the person to do?": "वक्ता व्यक्ति को क्या करने के लिए कह रहा है?",
    "Where is Anita from?": "अनिता कहाँ से है?",
    "What is the price?": "कीमत क्या है?",
    "What time of day is it?": "दिन का कौन सा समय है?",
    "How many brothers does the speaker have?": "वक्ता के कितने भाई हैं?",
    "What should you write?": "आपको क्या लिखना चाहिए?",
    "What time does this person wake up?": "यह व्यक्ति कितने बजे उठता है?",
    "What does she cook?": "वह क्या पकाती है?",
    "When is the electricity bill due?": "बिजली के बिल की देय तिथि क्या है?",
    "How does he get to the bus stop?": "वह बस स्टॉप तक कैसे पहुँचता है?",
    "How long is the water supply cut?": "पानी की आपूर्ति कितने समय के लिए बंद है?",
    "When does the market open?": "बाज़ार कब खुलता है?",
    "When should you pay the rent?": "आपको किराया कब देना चाहिए?",
    "What does she buy?": "वह क्या खरीदती है?",
    "How often does the bus arrive?": "बस कितनी बार आती है?",
    "When does the speaker take a bath?": "वक्ता कब नहाता है?",
    "Where does the father work?": "पिताजी कहाँ काम करते हैं?",
    "Who got married last year?": "पिछले साल किसकी शादी हुई?",
    "How many daughters do they have?": "उनकी कितनी बेटियाँ हैं?",
    "Who lives in the same house?": "उसी घर में कौन रहता है?",
    "Which class is the son studying in?": "बेटा किस कक्षा में पढ़ रहा है?",
    "Where does the husband work?": "पति कहाँ काम करते हैं?",
    "How many family members are there?": "परिवार में कितने सदस्य हैं?",
    "What is the younger brother doing?": "छोटा भाई क्या कर रहा है?",
    "What do they do together as a family?": "वे एक परिवार के रूप में एक साथ क्या करते हैं?",
    "Who does the mother take care of?": "माँ किसकी देखभाल करती हैं?"
  }
};

// ── Render current exercise ───────────────────────────────────────
function ulRenderExercise() {
  if (ulCurrentIndex >= ulTotalExercises) {
    ulShowComplete();
    return;
  }

  const ex = ulExercises[ulCurrentIndex];
  ulSelectedAnswer = null;

  const targetLang = ulUserProfile?.targetLanguage || "en";
  const knownLang  = ulUserProfile?.preferredLanguage || "hi";

  // Progress
  const pct = ((ulCurrentIndex + 1) / ulTotalExercises) * 100;
  const fillEl = document.getElementById("ul-progress-fill");
  if (fillEl) fillEl.style.width = `${pct}%`;

  // Translated instruction if available in learner's known language
  const rawInstruction = ex.instruction || "Complete the exercise";
  const translatedInstruction = (knownLang === "hi" || targetLang === "hi")
    ? (UL_INSTRUCTION_MAP.hi[rawInstruction] || rawInstruction)
    : rawInstruction;

  const instEl = document.getElementById("ul-instruction-text");
  if (instEl) {
    instEl.innerHTML = `<i data-lucide="help-circle" style="width: 18px; height: 18px; color: #6366f1;"></i> <span>${translatedInstruction}</span>`;
  }

  let mainContent = ex.content;
  let supportTranslation = ex.translation || "";

  if (targetLang === "hi" && ex.translation) {
    mainContent = ex.translation;
    supportTranslation = ex.content;
  }

  let questionMain = ex.question;
  let questionSub  = "";
  if ((knownLang === "hi" || targetLang === "hi") && UL_QUESTION_MAP.hi[ex.question]) {
    if (targetLang === "hi") {
      questionMain = UL_QUESTION_MAP.hi[ex.question];
      questionSub  = ex.question;
    } else {
      questionSub  = UL_QUESTION_MAP.hi[ex.question];
    }
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
        <p style="margin-top: 0.85rem; color: #6366f1; font-weight: 800; font-size: 0.95rem;">${knownLang === "hi" ? "सुनने के लिए टैप करें" : "Tap to Listen"}</p>
      </div>
      ${supportTranslation ? `<p class="translation-text ${ulTranslationClass()}">${supportTranslation}</p>` : ''}
      <h3 class="exercise-question-text">${questionMain}</h3>
      ${questionSub ? `<p style="font-size: 0.95rem; color: #64748b; margin: -0.5rem 0 1rem; font-style: italic; font-weight: 600;">${questionSub}</p>` : ''}
      <div class="exercise-options-grid" id="ul-mcq-options"></div>
    `;
  }

  // 2. Speaking / Pronunciation
  else if (ulParams.skill === "speaking" || ulParams.skill === "pronunciation") {
    html += `
      <div style="text-align: center; margin-bottom: 2rem; padding: 2rem 1.5rem; background: linear-gradient(135deg, #f8fafc, #eef2ff); border-radius: 24px; border: 2px solid #c7d2fe;">
        <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2.2rem; font-weight: 900; color: #4f46e5; margin: 0 0 0.5rem;">${mainContent}</h2>
        ${supportTranslation ? `<p class="translation-text ${ulTranslationClass()}" style="margin: 0.5rem 0;">${supportTranslation}</p>` : ''}
        <p style="color: #64748b; font-size: 1.05rem; font-weight: 700; margin: 0;">"${questionMain}"</p>
      </div>
      <div style="text-align: center; margin-bottom: 1rem;">
        <button id="ul-mic-btn" style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; border: 4px solid #ffffff; box-shadow: 0 10px 28px rgba(99, 102, 241, 0.4); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto; transition: all 0.3s;">
          <i data-lucide="mic" style="width: 32px; height: 32px;"></i>
        </button>
        <p id="ul-stt-result" style="color: #475569; margin-top: 1rem; font-weight: 800; font-size: 0.95rem; min-height: 24px;">${knownLang === "hi" ? "आवाज़ का इंतज़ार है..." : "Waiting for audio..."}</p>
      </div>
    `;
  }

  // 3. Writing (Sentence Builder)
  else if (ulParams.skill === "writing") {
    html += `
      <div style="margin-bottom: 1.5rem; padding: 1.25rem; background: #f0fdf4; border-radius: 20px; border: 1.5px solid #86efac;">
        ${supportTranslation ? `<p class="translation-text ${ulTranslationClass()}" style="margin-bottom: 0.35rem; color: #16a34a;">${supportTranslation}</p>` : ''}
        <p style="font-weight: 800; font-size: 1.15rem; color: #15803d; margin: 0;">${mainContent}</p>
      </div>
      <div class="sentence-builder-area">
        <div id="ul-dropzone" style="min-height: 64px; padding: 1rem; border: 2px dashed #6366f1; border-radius: 20px; display: flex; flex-wrap: wrap; gap: 0.6rem; background: #eef2ff; margin-bottom: 1.25rem; align-items: center;"></div>
        <div id="ul-wordbank" style="min-height: 64px; padding: 1rem; border: 1.5px solid #e2e8f0; border-radius: 20px; display: flex; flex-wrap: wrap; gap: 0.6rem; background: #f8fafc; align-items: center;"></div>
      </div>
    `;
  }

  // 4. Reading (Standard MCQ)
  else {
    html += `
      <div class="exercise-passage-card">
        <p class="exercise-passage-text">${mainContent}</p>
      </div>
      ${supportTranslation ? `<p class="translation-text ${ulTranslationClass()}">${supportTranslation}</p>` : ''}
      <h3 class="exercise-question-text">${questionMain}</h3>
      ${questionSub ? `<p style="font-size: 0.95rem; color: #64748b; margin: -0.5rem 0 1rem; font-style: italic; font-weight: 600;">${questionSub}</p>` : ''}
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
      const textToSpeak = mainContent || questionMain || "";
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
    const bank     = document.getElementById("ul-wordbank");
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
    const micBtn    = document.getElementById("ul-mic-btn");
    const resultEl  = document.getElementById("ul-stt-result");
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
                const expected = ex.content.toLowerCase().replace(/[.,?]/g, "").trim();
                const actual   = transcript.toLowerCase().replace(/[.,?]/g, "").trim();
                const expectedWords = expected.split(/\s+/).filter(Boolean);
                const actualWords   = new Set(actual.split(/\s+/).filter(Boolean));
                const matchRatio    = expectedWords.length
                  ? expectedWords.filter(w => actualWords.has(w)).length / expectedWords.length
                  : 0;
                ulSelectedAnswer = matchRatio >= 0.7 ? "CORRECT" : "INCORRECT";
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
  const ex        = ulExercises[ulCurrentIndex];
  let   isCorrect = false;

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
      if (idx === ex.answerIndex)                          btn.classList.add("correct");
      else if (idx === ulSelectedAnswer && !isCorrect)     btn.classList.add("incorrect");
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
      await db.collection("users").doc(user.uid).update({ [fieldPath]: true });
      console.log(`[unit-lesson.js] ✅ Marked complete: ${fieldPath}`);
    } catch (e) {
      console.warn("[unit-lesson.js] Could not mark unit lesson complete:", e);
    }

    if (typeof updateQuestProgress === "function") {
      updateQuestProgress(user.uid, "lesson", 1);
      updateQuestProgress(user.uid, "xp", xpEarned);
    }
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

  if (typeof UNITS_CONTENT === "undefined" || !UNITS_CONTENT[ulParams.unitId]) {
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

  ulExercises      = UNITS_CONTENT[ulParams.unitId][ulParams.skill] || [];
  ulTotalExercises = ulExercises.length;
  ulLessonStartTime = Date.now();

  if (ulTotalExercises === 0) {
    const overlay = document.getElementById("ul-loading-overlay");
    if (overlay) overlay.style.display = "none";
    const bodyEl = document.getElementById("ul-exercise-body");
    if (bodyEl) {
      bodyEl.innerHTML =
        `<p style="text-align:center;color:#64748b;padding:2rem;font-weight:700;">
           No exercises available for this skill yet.
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
