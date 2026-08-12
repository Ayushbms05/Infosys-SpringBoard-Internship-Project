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
  const pct = (ulCurrentIndex / ulTotalExercises) * 100;
  document.getElementById("ul-progress-fill").style.width = pct + "%";
  document.getElementById("ul-progress-text").textContent =
    `${ulCurrentIndex + 1}/${ulTotalExercises}`;

  // Translated instruction if available in learner's known language
  const rawInstruction = ex.instruction || "Complete the exercise";
  const translatedInstruction = (knownLang === "hi" || targetLang === "hi")
    ? (UL_INSTRUCTION_MAP.hi[rawInstruction] || rawInstruction)
    : rawInstruction;

  document.getElementById("ul-instruction-text").textContent = translatedInstruction;

  // Determine main card content & support translation based on target language:
  // If target is Hindi (learning Hindi): main = Hindi, support = English
  // If target is English (learning English): main = English, support = Hindi
  let mainContent = ex.content;
  let supportTranslation = ex.translation || "";

  if (targetLang === "hi" && ex.translation) {
    mainContent = ex.translation;
    supportTranslation = ex.content;
  }

  // Question translation for Hindi learners/speakers
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

  // TTS button reads the main target content
  document.getElementById("ul-tts-btn").onclick = () => {
    if (typeof speakText === "function") speakText(mainContent, targetLang);
  };

  const body = document.getElementById("ul-exercise-body");
  let html = "";

  // ── Listening ──
  if (ulParams.skill === "listening") {
    html += `
      <div style="text-align:center;margin:2rem 0;">
        <button id="ul-listen-btn" style="width:100px;height:100px;border-radius:50%;background:var(--color-primary);color:white;border:none;font-size:3rem;cursor:pointer;box-shadow:0 8px 20px rgba(108,99,255,0.4);transition:transform .2s;">🔊</button>
        <p style="margin-top:1rem;color:var(--color-text-secondary);font-weight:bold;">${knownLang === "hi" ? "सुनने के लिए टैप करें" : "Tap to Listen"}</p>
      </div>
      <p class="lesson-translation ${ulTranslationClass()}">${supportTranslation}</p>
      <p class="exercise-question">${questionMain}</p>
      ${questionSub ? `<p style="font-size:0.95rem;color:var(--color-text-muted);margin-top:-0.5rem;margin-bottom:1rem;font-style:italic;">${questionSub}</p>` : ""}
      <div class="exercise-options" id="ul-mcq-options"></div>
    `;
  }

  // ── Speaking / Pronunciation ──
  else if (ulParams.skill === "speaking" || ulParams.skill === "pronunciation") {
    html += `
      <div style="text-align:center;margin-bottom:2rem;padding:2rem;background:rgba(108,99,255,0.05);border-radius:12px;border:1px solid rgba(108,99,255,0.2);">
        <h2 style="font-size:2.5rem;color:var(--color-text-primary);margin-bottom:0.5rem;">${mainContent}</h2>
        <p class="lesson-translation ${ulTranslationClass()}">${supportTranslation}</p>
        <p style="color:var(--color-text-muted);font-size:1.1rem;font-style:italic;">"${questionMain}"</p>
      </div>
      <div style="text-align:center;margin-bottom:1rem;">
        <button id="ul-mic-btn" style="width:80px;height:80px;border-radius:50%;background:white;color:var(--color-primary);border:3px solid var(--color-primary);font-size:2.5rem;cursor:pointer;transition:all .3s;">🎤</button>
        <p id="ul-stt-result" style="color:var(--color-text-secondary);margin-top:1rem;font-weight:600;min-height:24px;">${knownLang === "hi" ? "आवाज़ का इंतज़ार है..." : "Waiting for audio..."}</p>
      </div>
    `;
  }

  // ── Writing (sentence builder) ──
  else if (ulParams.skill === "writing") {
    html += `
      <div style="margin-bottom:1.5rem;padding:1rem;background:rgba(0,212,170,0.1);border-radius:8px;border-left:4px solid var(--color-accent);">
        <p class="lesson-translation ${ulTranslationClass()}">${supportTranslation}</p>
        <p style="font-weight:bold;color:var(--color-text-primary);">${mainContent}</p>
      </div>
      <div class="sentence-builder-area">
        <div id="ul-dropzone" style="min-height:60px;padding:1rem;border:2px dashed var(--color-primary);border-radius:8px;display:flex;flex-wrap:wrap;gap:0.5rem;background:rgba(108,99,255,0.05);margin-bottom:1rem;align-items:center;"></div>
        <div id="ul-wordbank" style="min-height:60px;padding:1rem;border:1px solid var(--glass-border);border-radius:8px;display:flex;flex-wrap:wrap;gap:0.5rem;background:var(--color-bg-surface);align-items:center;"></div>
      </div>
    `;
  }

  // ── Reading (default MCQ) ──
  else {
    html += `
      <div class="exercise-passage" style="margin-bottom:1.5rem;padding:1.5rem;background:rgba(255,255,255,0.03);border:1px solid var(--color-border);border-radius:12px;display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;">
        <p style="font-size:1.25rem;font-weight:600;margin:0;">${mainContent}</p>
        <button onclick="if(typeof speakText==='function')speakText('${mainContent.replace(/'/g,"\\'")}','${targetLang}')" style="flex-shrink:0;background:transparent;border:none;font-size:1.5rem;cursor:pointer;line-height:1;">🔊</button>
      </div>
      <p class="lesson-translation ${ulTranslationClass()}" style="font-size:1.1rem;margin-top:-0.5rem;margin-bottom:1.5rem;">${supportTranslation}</p>
      <p class="exercise-question" style="font-size:1.15rem;font-weight:700;">${questionMain}</p>
      ${questionSub ? `<p style="font-size:0.95rem;color:var(--color-text-muted);margin-top:-0.5rem;margin-bottom:1rem;font-style:italic;">${questionSub}</p>` : ""}
      <div class="exercise-options" id="ul-mcq-options"></div>
    `;
  }

  body.innerHTML = html;

  // Reset feedback / buttons
  document.getElementById("ul-feedback").classList.add("hidden");
  const checkBtn = document.getElementById("ul-check-btn");
  checkBtn.classList.remove("hidden");
  checkBtn.disabled = true;
  document.getElementById("ul-continue-btn").classList.add("hidden");

  // ── Wire up interaction ──
  if (ulParams.skill === "listening") {
    document.getElementById("ul-listen-btn").onclick = function () {
      this.style.transform = "scale(0.9)";
      setTimeout(() => (this.style.transform = "scale(1)"), 200);
      if (typeof speakText === "function") speakText(ex.content, ulUserProfile?.targetLanguage || "en");
    };
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
        "padding:.6rem 1rem;border-radius:20px;border:none;background:var(--color-primary);color:white;font-weight:bold;cursor:pointer;box-shadow:0 4px 6px rgba(0,0,0,.1);";
      chip.onclick = () => {
        if (chip.parentElement === bank) dropzone.appendChild(chip);
        else bank.appendChild(chip);
        checkBtn.disabled = dropzone.children.length === 0;
      };
      bank.appendChild(chip);
    });
    ulSelectedAnswer = 0; // dummy to allow checkAnswer

  } else if (ulParams.skill === "speaking" || ulParams.skill === "pronunciation") {
    const micBtn    = document.getElementById("ul-mic-btn");
    const resultEl  = document.getElementById("ul-stt-result");
    micBtn.onclick = () => {
      micBtn.style.background = "var(--color-primary)";
      micBtn.style.color      = "white";
      micBtn.style.animation  = "pulse 1.5s infinite";
      resultEl.textContent    = "Listening...";

      if (typeof startSpeechToText === "function") {
        startSpeechToText(
          ulUserProfile?.targetLanguage || "en-IN",
          (transcript) => {
            micBtn.style.background = "white";
            micBtn.style.color      = "var(--color-primary)";
            micBtn.style.animation  = "none";

            if (transcript) {
              resultEl.textContent = `You said: "${transcript}"`;
              const expected = ex.content.toLowerCase().replace(/[.,?]/g, "").trim();
              const actual   = transcript.toLowerCase().replace(/[.,?]/g, "").trim();
              const expectedWords = expected.split(/\s+/).filter(Boolean);
              const actualWords   = new Set(actual.split(/\s+/).filter(Boolean));
              const matchRatio    = expectedWords.length
                ? expectedWords.filter(w => actualWords.has(w)).length / expectedWords.length
                : 0;
              ulSelectedAnswer = matchRatio >= 0.7 ? "CORRECT" : "INCORRECT";
              checkBtn.disabled = false;
            } else {
              resultEl.textContent = "Didn't catch that. Tap mic to try again.";
            }
          },
          (err) => {
            micBtn.style.background = "white";
            micBtn.style.color      = "var(--color-primary)";
            micBtn.style.animation  = "none";
            resultEl.textContent    = "Something went wrong — please try again.";
            console.error("STT error:", err);
          }
        );
      }
    };
  }
}

// ── Render MCQ buttons ────────────────────────────────────────────
function ulRenderMCQ(options) {
  const container = document.getElementById("ul-mcq-options");
  if (!container) return;
  const letters = ["A", "B", "C", "D"];
  options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "option-btn exercise-option";
    btn.innerHTML = `<div class="option-letter">${letters[idx]}</div><span>${opt}</span>`;
    btn.onclick = () => {
      document.querySelectorAll("#ul-mcq-options .exercise-option")
        .forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      ulSelectedAnswer = idx;
      document.getElementById("ul-check-btn").disabled = false;
    };
    container.appendChild(btn);
  });
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
    document.querySelectorAll("#ul-mcq-options .exercise-option").forEach((btn, idx) => {
      if (idx === ex.answerIndex)                          btn.classList.add("correct");
      else if (idx === ulSelectedAnswer && !isCorrect)     btn.classList.add("incorrect");
      btn.disabled = true;
    });
  }

  const feedbackEl = document.getElementById("ul-feedback");
  feedbackEl.classList.remove("hidden", "correct", "incorrect");

  if (isCorrect) {
    feedbackEl.classList.add("correct");
    document.getElementById("ul-feedback-icon").textContent = "✅";
    document.getElementById("ul-feedback-text").textContent =
      "Correct! " + (ex.explanation || "Great job!");
    ulScore++;
    const xpEl = document.getElementById("ul-xp-value");
    xpEl.textContent = parseInt(xpEl.textContent) + 10;
  } else {
    feedbackEl.classList.add("incorrect");
    document.getElementById("ul-feedback-icon").textContent = "❌";
    document.getElementById("ul-feedback-text").textContent =
      ulParams.skill === "writing"
        ? `Not quite. Correct sentence: ${ex.question}`
        : "Not quite. Keep practising.";
  }

  document.getElementById("ul-check-btn").classList.add("hidden");
  document.getElementById("ul-continue-btn").classList.remove("hidden");
}

// ── Next exercise ─────────────────────────────────────────────────
function ulNextExercise() {
  ulCurrentIndex++;
  ulRenderExercise();
}

// ── Show completion screen ────────────────────────────────────────
async function ulShowComplete() {
  document.getElementById("ul-lesson-content").classList.add("hidden");
  document.getElementById("ul-lesson-complete").classList.remove("hidden");
  document.getElementById("ul-progress-fill").style.width = "100%";

  const accuracy = ulTotalExercises > 0
    ? Math.round((ulScore / ulTotalExercises) * 100)
    : 0;
  const xpEarned = ulScore * 10;

  document.getElementById("ul-complete-score").textContent = accuracy + "%";
  document.getElementById("ul-complete-xp").textContent   = "+" + xpEarned;

  const user = auth.currentUser;
  if (user) {
    // 1. Award XP using the shared generic function (safe to reuse)
    if (typeof addXP === "function") await addXP(user.uid, xpEarned);

    // 2. Update streak using the shared generic function (safe to reuse)
    if (typeof updateStreak === "function") await updateStreak(user.uid);

    // 3. Mark the unit lesson complete in profile.unitProgress ONLY
    //    (never touches completedLessons or curriculum)
    try {
      const fieldPath = `unitProgress.${ulParams.level}.${ulParams.unitId}.${ulParams.skill}`;
      await db.collection("users").doc(user.uid).update({ [fieldPath]: true });
      console.log(`[unit-lesson.js] ✅ Marked complete: ${fieldPath}`);
    } catch (e) {
      console.warn("[unit-lesson.js] Could not mark unit lesson complete:", e);
    }

    // 4. Quest progress (generic, safe to reuse)
    if (typeof updateQuestProgress === "function") {
      updateQuestProgress(user.uid, "lesson", 1);
      updateQuestProgress(user.uid, "xp", xpEarned);
    }
  }

  // Next lesson button — goes back to dashboard Units tab
  document.getElementById("ul-next-btn").onclick = () => {
    window.location.href = "dashboard.html";
  };
}

// ── Initialise ────────────────────────────────────────────────────
async function ulSetupLesson() {
  ulParams = ulParseParams();

  // Wait for Firebase auth
  await new Promise(resolve => {
    auth.onAuthStateChanged(user => {
      if (!user) { window.location.href = "login.html"; return; }
      resolve(user);
    });
  });

  // Load user profile so we can pass targetLanguage to TTS
  try {
    const snap = await db.collection("users").doc(auth.currentUser.uid).get();
    ulUserProfile = snap.exists ? snap.data() : {};
  } catch (e) {
    ulUserProfile = {};
  }

  // ── Pull exercises from UNITS_CONTENT (no Gemini, no Firestore content read) ──
  if (typeof UNITS_CONTENT === "undefined" || !UNITS_CONTENT[ulParams.unitId]) {
    document.getElementById("ul-loading-overlay").style.display = "none";
    document.getElementById("ul-exercise-body").innerHTML =
      `<p style="text-align:center;color:var(--color-text-muted);padding:2rem;">
         No content found for this unit. Please check back soon.
       </p>`;
    return;
  }

  ulExercises      = UNITS_CONTENT[ulParams.unitId][ulParams.skill] || [];
  ulTotalExercises = ulExercises.length;
  ulLessonStartTime = Date.now();

  if (ulTotalExercises === 0) {
    document.getElementById("ul-loading-overlay").style.display = "none";
    document.getElementById("ul-exercise-body").innerHTML =
      `<p style="text-align:center;color:var(--color-text-muted);padding:2rem;">
         No exercises available for this skill yet.
       </p>`;
    return;
  }

  // Set header labels
  document.getElementById("ul-lesson-title").textContent =
    `${ulParams.unitTitle}`;
  document.getElementById("ul-level-badge").textContent =
    ulParams.level.charAt(0).toUpperCase() + ulParams.level.slice(1);
  document.getElementById("ul-level-badge").className =
    `rec-card-tag ${ulParams.level}`;
  document.getElementById("ul-type-badge").textContent =
    `${UL_SKILL_ICONS[ulParams.skill] || "📖"} ${ulParams.skill.charAt(0).toUpperCase() + ulParams.skill.slice(1)}`;

  // Wire buttons
  document.getElementById("ul-check-btn").onclick    = ulCheckAnswer;
  document.getElementById("ul-continue-btn").onclick = ulNextExercise;

  // Hide overlay and render first exercise
  document.getElementById("ul-loading-overlay").style.display = "none";
  ulRenderExercise();
}

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", ulSetupLesson);
