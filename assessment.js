/**
 * assessment.js — AI-Powered Literacy Assessment using Gemini API.
 *
 * Fetches user profile, sends education level + language to Gemini API
 * to generate 10 personalized MCQ questions, renders the quiz,
 * calculates score, and saves results to Firestore.
 *
 * Falls back to hardcoded questions if Gemini API is unavailable.
 */

// ─── Fallback Question Banks ──────────────────────────────────
// Used only if Gemini API call fails

const fallbackQuestions = {
  beginner: [
    { text: "Which of these is a letter?", options: ["A", "5", "?", "@"], answerIndex: 0 },
    { text: "What comes after B?", options: ["A", "C", "D", "E"], answerIndex: 1 },
    { text: "Which word starts with 'B'?", options: ["Bus", "Apple", "Car", "Sun"], answerIndex: 0 },
    { text: "Identify the number 'Three'", options: ["1", "2", "3", "4"], answerIndex: 2 },
    { text: "Which is a color?", options: ["Ticket", "Red", "Form", "Tree"], answerIndex: 1 },
    { text: "Opposite of 'Hot'", options: ["Warm", "Sun", "Cold", "Fire"], answerIndex: 2 },
    { text: "Where do you deposit money?", options: ["Hospital", "Bank", "Market", "Bus stop"], answerIndex: 1 },
    { text: "What is this shape? (O)", options: ["Square", "Triangle", "Circle", "Line"], answerIndex: 2 },
    { text: "The sky is...", options: ["Green", "Blue", "Red", "Yellow"], answerIndex: 1 },
    { text: "How many days in a week?", options: ["5", "6", "7", "8"], answerIndex: 2 }
  ],
  intermediate: [
    { text: "Select the correct spelling:", options: ["Ticekt", "Tiket", "Ticket", "Tickit"], answerIndex: 2 },
    { text: "Which sentence is correct?", options: ["I needs a doctor.", "I need a doctor.", "I needing a doctor.", "I is need a doctor."], answerIndex: 1 },
    { text: "Past tense of 'Pay' is:", options: ["Payed", "Paid", "Paying", "Pays"], answerIndex: 1 },
    { text: "A place to buy medicine is a...", options: ["Pharmacy", "Bank", "Post Office", "School"], answerIndex: 0 },
    { text: "Synonym for 'Signature':", options: ["Name", "Address", "Sign", "Form"], answerIndex: 2 },
    { text: "Choose the noun:", options: ["Quickly", "Beautiful", "Ration Card", "Run"], answerIndex: 2 },
    { text: "Opposite of 'Always':", options: ["Sometimes", "Never", "Often", "Forever"], answerIndex: 1 },
    { text: "Which is a complete sentence?", options: ["The bus at 9 AM.", "Filling the form.", "She signed the document.", "In the market."], answerIndex: 2 },
    { text: "Select the pronoun:", options: ["He", "Table", "Jump", "Green"], answerIndex: 0 },
    { text: "Where do you catch a train?", options: ["Hospital", "Market", "Station", "Bank"], answerIndex: 2 }
  ],
  advanced: [
    { text: "Identify the adverb:", options: ["Quick", "Quickly", "Quicker", "Quickness"], answerIndex: 1 },
    { text: "Which word means 'to predict'?", options: ["Recall", "Foresee", "Forget", "Review"], answerIndex: 1 },
    { text: "Choose the correct preposition: 'The meeting is ___ 10 AM.'", options: ["in", "on", "at", "with"], answerIndex: 2 },
    { text: "What is the main idea of a contract?", options: ["The last sentence", "The agreement terms", "The first word", "The punctuation"], answerIndex: 1 },
    { text: "Identify the complex sentence:", options: ["I signed the form.", "I filled the form and submitted it.", "Because the office was closed, we returned home.", "The manager is speaking."], answerIndex: 2 },
    { text: "Meaning of 'Mandatory':", options: ["Optional", "Required", "Suggested", "Fast"], answerIndex: 1 },
    { text: "Find the error: 'He don't have the ticket.'", options: ["He", "don't", "have", "ticket"], answerIndex: 1 },
    { text: "Passive voice of 'They approved the loan':", options: ["The loan approved they.", "The loan is approving.", "The loan was approved by them.", "They are approving the loan."], answerIndex: 2 },
    { text: "Which is a metaphor?", options: ["As brave as a lion", "Time is money", "Runs very fast", "Sings beautifully"], answerIndex: 1 },
    { text: "Identify the conjunction:", options: ["And", "Run", "Blue", "Slowly"], answerIndex: 0 }
  ]
};

// ─── Language Mapping for Gemini Prompts ──────────────────────
const languageNames = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  bn: "Bengali",
  mr: "Marathi"
};

// ─── Literacy Level Descriptions ─────────────────────────────
const literacyDescriptions = {
  neverLearned: "never learned to read/write, completely new to literacy",
  canRecognize: "can recognize some letters or words, but cannot read sentences",
  canReadSimple: "can read and write simple sentences with difficulty",
  canReadComfort: "can read and write comfortably, returning to learn more",
  preferNot: "literacy level not specified, treat as beginner"
};

// ─── Assessment State ─────────────────────────────────────────
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let userProfile = null;
let isLoadingQuestions = false;

// ─── Gemini API Integration ───────────────────────────────────

/**
 * Fetches 10 assessment questions from Gemini API based on the user's
 * literacy level, age group, and preferred language.
 */
async function fetchQuestionsFromGemini(literacyLevel, ageGroup, knownLang, targetLang, motherTongue) {

  const cacheKey = `gemini_assessment_${literacyLevel}_${ageGroup}_${knownLang}_${targetLang}_${motherTongue}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }

  // CHANGED: now takes BOTH languages. knownLangName is what the learner
  // already understands (instructions/options go here); targetLangName is
  // what's being assessed (the specific word/phrase under test goes here).
  const knownLangName = languageNames[knownLang] || "English";
  const targetLangName = languageNames[targetLang] || "English";
  const litDesc = literacyDescriptions[literacyLevel] || literacyDescriptions.neverLearned;

  const isChild = ageGroup === 'below18';
  const learnerType = isChild ? "child/young learner" : "adult learner";
  const contextRule = isChild
    ? "IMPORTANT: Use child-friendly contexts (e.g., school, animals, playing, family, colors) suitable for kids or young teens. Keep the tone encouraging and simple."
    : "IMPORTANT: Use real-world adult contexts (e.g., bus tickets, medicine labels, bank forms, ration cards, market shopping). Adjust the tone to be respectful for adult learners.";

  // CHANGED: this is now a PLACEMENT TEST for a new language, not a
  // literacy test in the learner's own language. The learner already
  // knows ${knownLangName} — we're measuring how much ${targetLangName}
  // they already know, if any. So the question framing/instructions
  // must stay in ${knownLangName} (so they can understand what's being
  // asked), while the specific word/phrase under test is shown in
  // ${targetLangName}.
  const prompt = `You are designing a placement test to measure how much ${targetLangName} a learner already knows, BEFORE they start lessons. The learner's known language is ${knownLangName} — they may know ZERO ${targetLangName} yet. Generate exactly 10 multiple-choice questions.

LEARNER PROFILE:
- Self-reported starting literacy level: ${litDesc}
- Age Group: ${ageGroup}
- Known language (for instructions): ${knownLangName}
- Language being tested: ${targetLangName}

CRITICAL FORMAT RULE — every question MUST follow this bilingual structure:
- The "question" field itself must be written in ${knownLangName}, and must embed the specific ${targetLangName} word/phrase being tested inside it. Example pattern: "What does the ${targetLangName} word '____' mean?" or "Which ${targetLangName} word means '____' (in ${knownLangName})?" — with the blank filled by a real ${targetLangName} word/phrase.
- The 4 "options" must be written in ${knownLangName} (since we're testing whether the learner understands the ${targetLangName} word, not whether they can read ${knownLangName}).
- Do NOT write entire questions in ${targetLangName} — a learner who knows zero ${targetLangName} must still be able to read and understand the question itself.

REQUIREMENTS:
1. ${contextRule}
2. Each question must have exactly 4 options with exactly one correct answer.
3. Questions should progressively increase in difficulty from question 1 to 10 — start with extremely common/basic ${targetLangName} words (numbers, greetings, common nouns) and increase toward short phrases or simple sentence meanings by question 10, so someone with zero prior exposure can still answer the early questions and someone with real ability is meaningfully challenged by the later ones.
4. Each question must be SHORT — one sentence, never a scenario or paragraph.

RESPOND WITH ONLY a valid JSON array of 10 objects. Do NOT include markdown code fences.
Each object MUST have this exact structure:
{
  "question": "string",
  "options": { "A": "string", "B": "string", "C": "string", "D": "string" },
  "correctAnswer": "A" | "B" | "C" | "D"
}`;

  const maxRetries = 3;
  const backoff = [1000, 2000, 4000];
  let attempts = 0;

  while (attempts <= maxRetries) {
    try {
      const idToken = await firebase.auth().currentUser.getIdToken();
      const response = await fetch('/api/callGemini', {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + idToken },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096, responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        if (response.status === 429 && attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, backoff[attempts]));
          attempts++;
          continue;
        }
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      let textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      textContent = textContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();

      const questions = JSON.parse(textContent);
      const validQuestions = [];
      const letterToIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

      for (const q of questions) {
        if (q.question && q.options && typeof letterToIndex[q.correctAnswer] !== 'undefined') {
          validQuestions.push({
            text: q.question,
            options: [q.options.A, q.options.B, q.options.C, q.options.D],
            answerIndex: letterToIndex[q.correctAnswer]
          });
        }
      }

      const finalQuestions = validQuestions.slice(0, 10);
      sessionStorage.setItem(cacheKey, JSON.stringify(finalQuestions));
      return finalQuestions;

    } catch (error) {
      console.error(`Gemini API error (attempt ${attempts + 1}):`, error);
      return null;
    }
  }
  return null;
}

/**
 * AI Insights - Analyzes result and builds a custom dashboard path
 */
async function triggerAssessmentAIAnalysis(scorePercent, level) {
  const loadingEl = document.getElementById("assessment-ai-loading");
  const insightsEl = document.getElementById("assessment-ai-insights");
  
  if (loadingEl) loadingEl.classList.remove("hidden");
  if (insightsEl) insightsEl.classList.add("hidden");
  
  
  const user = auth.currentUser;
  
  // 1. Resolve Profile Attributes local state safely
  let litDesc = "Beginner";
  let ageGroup = "adult";
  let isChild = false;
  let knownLangName = "English";
  
  if (user) {
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists) {
        const data = doc.data();
        litDesc = data.literacyLevel || "Beginner";
        ageGroup = data.ageGroup || "adult";
        isChild = (data.ageGroup === 'below18');
        const langNames = { en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu", kn: "Kannada", bn: "Bengali", mr: "Marathi" };
        knownLangName = langNames[data.preferredLanguage] || "English";
      }
    } catch (e) { console.error("Error reading user data profile", e); }
  }

  // 2. Pre-compiled local backup path objects to deploy if Gemini drops a 503 error
  const localFallbacks = {
    beginner: {
      summaryMessage: `Welcome! You completed the assessment with a score of ${scorePercent}%. We have prepared a foundational learning path to practice letter structures, core visual identification, and basic sentence concepts.`,
      goodPoints: ["Strong instinctive visual matching", "Basic letter structure awareness"],
      weakPoints: ["Connecting letters to word sounds", "Constructing functional sentences"],
      customPath: [
        { title: "Step 1: Alphabet Shapes", desc: "Master letter structures and phonetic sounds.", level: "beginner", unit: "alphabets", type: "pronunciation" },
        { title: "Step 2: Core Everyday Words", desc: "Identify common sight words used in daily life.", level: "beginner", unit: "words", type: "reading" },
        { title: "Step 3: Direct Instructional Listening", desc: "Practice decoding simple spoken audio words.", level: "beginner", unit: "words", type: "listening" },
        { title: "Step 4: Basic Word Arranging", desc: "Construct short 3-word sentences accurately.", level: "beginner", unit: "sentences", type: "writing" },
        { title: "Step 5: Visual Sign Comprehension", desc: "Read basic community signs and labels safely.", level: "beginner", unit: "sentences", type: "reading" }
      ]
    },
    intermediate: {
      summaryMessage: `Excellent job! You achieved an intermediate rank of ${scorePercent}%. Your road path targets real-world reading comprehension fluency, structural grammar, and interactive oral construction.`,
      goodPoints: ["Good baseline vocabulary retention", "Comfortable with simple sentence logic"],
      weakPoints: ["Applying advanced grammatical rules", "Comprehending dense multi-line layouts"],
      customPath: [
        { title: "Step 1: Scscenario Vocabulary", desc: "Build intermediate vocabulary for adult environments.", level: "intermediate", unit: "words", type: "reading" },
        { title: "Step 2: Grammar & Structure", desc: "Practice arranging words into clean structural layouts.", level: "intermediate", unit: "sentences", type: "writing" },
        { title: "Step 3: Fast Audio Comprehension", desc: "Decode complex spoken expressions comfortably.", level: "intermediate", unit: "sentences", type: "listening" },
        { title: "Step 4: Active Vocalization", desc: "Build sentence speaking fluency aloud.", level: "intermediate", unit: "sentences", type: "speaking" },
        { title: "Step 5: Form Notice Reading", desc: "Learn to read paragraph length documents and forms.", level: "intermediate", unit: "paragraphs", type: "reading" }
      ]
    },
    advanced: {
      summaryMessage: `Phenomenal performance! With an advanced score of ${scorePercent}%, your customized path bypasses entry mechanics to focus heavily on intricate document parsing, articulation, and advanced sentence writing.`,
      goodPoints: ["Superb sentence structural understanding", "Fluent vocabulary translation skills"],
      weakPoints: ["Parsing highly complex legalese/forms", "Advanced vocabulary pronunciation check rules"],
      customPath: [
        { title: "Step 1: Advanced Form Parsing", desc: "Master complex structural layout reading mechanics.", level: "advanced", unit: "sentences", type: "reading" },
        { title: "Step 2: Application Composition", desc: "Practice writing out clean paragraphs from prompt logs.", level: "advanced", unit: "sentences", type: "writing" },
        { title: "Step 3: Articulation Mastery", desc: "Perfect your pronunciation of complex terminology.", level: "advanced", unit: "paragraphs", type: "pronunciation" },
        { title: "Step 4: Extended Broadcast Tracking", desc: "Follow long spoken alerts and paragraph narratives.", level: "advanced", unit: "paragraphs", type: "listening" },
        { title: "Step 5: Dense Layout Analysis", desc: "Read long real-world context materials effortlessly.", level: "advanced", unit: "paragraphs", type: "reading" }
      ]
    }
  };

  const targetTier = localFallbacks[level] ? level : "beginner";

  const prompt = `You are an expert literacy coach. Analyse this learner's initial assessment results.

LEARNER PROFILE:
- Age Group: ${ageGroup} (${isChild ? 'Child' : 'Adult'})
- Self-reported literacy: ${litDesc}
- Assessment Score: ${scorePercent}%
- Assessed Level: ${level}

Identify 2 strengths and 2 areas to improve based on their score. Then, create a personalized 5-step learning roadmap specifically tailored to their age, level, and areas where they are lagging behind.

CRITICAL: Write your ENTIRE response — summaryMessage, goodPoints, weakPoints, and every customPath title/desc — in ${knownLangName}, since that is the learner's understood language. Do NOT respond in English unless ${knownLangName} is English.

RESPOND ONLY with this exact JSON structure (no markdown, no extra text):
{
  "summaryMessage": "A personalized paragraph explaining their result, in ${knownLangName}.",
  "goodPoints": ["Point 1", "Point 2"],
  "weakPoints": ["Point 1", "Point 2"],
  "customPath": [
    { "title": "Step 1: Custom Title", "desc": "Specific reason", "level": "${level}", "unit": "alphabets", "type": "reading" },
    { "title": "Step 2: Custom Title", "desc": "...", "level": "${level}", "unit": "words", "type": "writing" },
    { "title": "Step 3: Custom Title", "desc": "...", "level": "${level}", "unit": "sentences", "type": "speaking" },
    { "title": "Step 4: Custom Title", "desc": "...", "level": "${level}", "unit": "paragraphs", "type": "listening" },
    { "title": "Step 5: Custom Title", "desc": "...", "level": "${level}", "unit": "alphabets", "type": "pronunciation" }
  ]
}`;

  try {
    const idToken = await firebase.auth().currentUser.getIdToken();
    const resp = await fetch('/api/callGemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + idToken },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048, responseMimeType: 'application/json' }
      })
    });
    
    if (!resp.ok) throw new Error(`Gemini status code crash log: ${resp.status}`);
    const data = await resp.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    text = text.replace(/```(json)?/gi, '').trim();
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
       text = text.substring(startIdx, endIdx + 1);
    }
    
    const analysis = JSON.parse(text);
    
    // Save live result
    if (user) {
      await db.collection('users').doc(user.uid).update({
        geminiAnalysis: analysis,
        geminiAnalyzedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    renderAnalysisToScreen(analysis, loadingEl, insightsEl);

  } catch (err) {
    console.error('Gemini call dropped. Triggering automatic local fallback path execution sequence:', err);
    // FAIL-SAFE EXECUTION: Commit pre-defined path array to Firebase so the user's dashboard functions perfectly
    await saveFallbackAndRender(user, localFallbacks[targetTier], loadingEl, insightsEl);
  }
}

// Sub-routines to cleanly structure the fallback steps
async function saveFallbackAndRender(user, fallbackData, loadingEl, insightsEl) {
  if (user) {
    try {
      await db.collection('users').doc(user.uid).update({
        geminiAnalysis: fallbackData,
        geminiAnalyzedAt: firebase.firestore.FieldValue.serverTimestamp(),
        fallbackGenerated: true
      });
    } catch(e) { console.error("Critical database save fault:", e); }
  }
  renderAnalysisToScreen(fallbackData, loadingEl, insightsEl);
}

function renderAnalysisToScreen(analysis, loadingEl, insightsEl) {
  if (loadingEl) loadingEl.classList.add("hidden");
  if (insightsEl) insightsEl.classList.remove("hidden");
  
  const summaryMsg = document.getElementById("score-summary-message");
  if (summaryMsg && analysis.summaryMessage) {
    summaryMsg.textContent = analysis.summaryMessage;
  }
  
  const goodList = document.getElementById("ai-good-points");
  if (goodList && analysis.goodPoints) {
    goodList.innerHTML = analysis.goodPoints.map(p => `<li style="margin-bottom: 6px;">${p}</li>`).join('');
  }
  
  const weakList = document.getElementById("ai-weak-points");
  if (weakList && analysis.weakPoints) {
    weakList.innerHTML = analysis.weakPoints.map(p => `<li style="margin-bottom: 6px;">${p}</li>`).join('');
  }
}

/**
 * Gets questions either from Gemini or falls back to hardcoded bank.
 */
async function getAssessmentQuestions(profile) {
  const tier = determineTier(profile);

  // Try Gemini first
  const geminiQuestions = await fetchQuestionsFromGemini(
    profile.literacyLevel,
    profile.ageGroup,
    profile.preferredLanguage || selectedLang,  // known language
    profile.targetLanguage || profile.preferredLanguage || selectedLang, // target language
    profile.motherTongue
  );

  if (geminiQuestions) {
    return geminiQuestions;
  }

  // Fallback to hardcoded questions
  console.log(`📋 Using fallback ${tier} questions`);
  return fallbackQuestions[tier] || fallbackQuestions.beginner;
}

// ─── Setup Assessment ─────────────────────────────────────────

function setupAssessment() {
  const introSection = document.getElementById("assessment-intro");
  const quizSection = document.getElementById("assessment-quiz");
  const scoreSection = document.getElementById("assessment-score");
  const loadingOverlay = document.getElementById("loading-overlay");

  const startBtn = document.getElementById("start-btn");
  const nextBtn = document.getElementById("next-btn");
  const continueBtn = document.getElementById("continue-btn");

  // Ensure user is logged in
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // Fetch profile and check assessment status
    getUserProfile(user.uid).then((profile) => {
      if (!profile) {
        window.location.href = "login.html";
        return;
      }

      userProfile = profile;

      // If assessment already completed, skip to dashboard
      if (profile.assessmentCompleted) {
        window.location.href = "dashboard.html";
        return;
      }

      // Hide loading, show intro
      loadingOverlay.classList.add("hidden");
    }).catch(err => {
      console.error("Error fetching profile:", err);
      loadingOverlay.classList.add("hidden"); // At least let them try
    });
  });

  // Start Assessment
  startBtn.addEventListener("click", async () => {
    // Show loading state
    startBtn.disabled = true;
    startBtn.classList.add("loading");
    startBtn.textContent = "";

    // Update loading text
    const loadingHint = document.getElementById("loading-hint");
    if (loadingHint) {
      loadingHint.classList.remove("hidden");
    }

    try {
      // Fetch questions (from Gemini or fallback)
      currentQuestions = await getAssessmentQuestions(userProfile);
      currentQuestionIndex = 0;
      userAnswers = new Array(currentQuestions.length).fill(null);

      // Hide intro, show quiz
      introSection.classList.add("hidden");
      quizSection.classList.remove("hidden");

      document.getElementById("total-q-num").textContent = currentQuestions.length;
      renderQuestion();
    } catch (error) {
      console.error("Error loading questions:", error);
      // Use fallback
      const tier = determineTier(userProfile);
      currentQuestions = fallbackQuestions[tier] || fallbackQuestions.beginner;
      currentQuestionIndex = 0;
      userAnswers = new Array(currentQuestions.length).fill(null);

      introSection.classList.add("hidden");
      quizSection.classList.remove("hidden");

      document.getElementById("total-q-num").textContent = currentQuestions.length;
      renderQuestion();
    }
  });

  // Next Question / Submit
  nextBtn.addEventListener("click", () => {
    const errorMsg = document.getElementById("assessment-error");

    // Validate selection
    if (userAnswers[currentQuestionIndex] === null) {
      errorMsg.style.display = "block";
      errorMsg.classList.add("visible");
      return;
    }
    errorMsg.style.display = "none";

    if (currentQuestionIndex < currentQuestions.length - 1) {
      // Go to next question
      currentQuestionIndex++;
      renderQuestion();
    } else {
      // Submit assessment
      finishAssessment();
    }
  });

  // Continue to Dashboard
  continueBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });
  
  // TTS for question
  const ttsBtn = document.getElementById("tts-question-btn");
  if (ttsBtn) {
    ttsBtn.addEventListener("click", () => {
      const qData = currentQuestions[currentQuestionIndex];
      let text = qData.text;
      qData.options.forEach(opt => text += ". " + opt);
      if (typeof speakText === "function") {
        speakText(text, userProfile?.preferredLanguage || selectedLang);
      }
    });
  }
}

// ─── Logic Helpers ────────────────────────────────────────────

function determineTier(profile) {
  if (!profile) return 'beginner';

  const lit = profile.literacyLevel;

  if (lit === 'neverLearned') return 'beginner';
  if (lit === 'canRecognize') return 'beginner';
  if (lit === 'canReadSimple') return 'intermediate';
  if (lit === 'canReadComfort') return 'advanced';

  return 'beginner'; // Default safe tier (e.g. preferNot)
}

function renderQuestion() {
  const qData = currentQuestions[currentQuestionIndex];

  document.getElementById("current-q-num").textContent = currentQuestionIndex + 1;
  document.getElementById("card-q-num").textContent = currentQuestionIndex + 1;
  document.getElementById("question-text").textContent = qData.text;

  // Update progress bar
  const progressPercent = ((currentQuestionIndex) / currentQuestions.length) * 100;
  document.getElementById("progress-fill").style.width = `${progressPercent}%`;

  // Update button text if last question
  const nextBtn = document.getElementById("next-btn");
  if (currentQuestionIndex === currentQuestions.length - 1) {
    nextBtn.textContent = getTranslation(selectedLang, "assessmentSubmitBtn") || "Submit Assessment";
  } else {
    nextBtn.textContent = getTranslation(selectedLang, "assessmentNextBtn") || "Next";
  }

  // Render options
  const optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML = '';

  const letters = ['A', 'B', 'C', 'D'];

  qData.options.forEach((optText, index) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";

    // Retain selection if they go back
    if (userAnswers[currentQuestionIndex] === index) {
      btn.classList.add("selected");
    }

    btn.innerHTML = `
      <div class="option-letter">${letters[index]}</div>
      <span>${optText}</span>
    `;

    btn.addEventListener("click", () => {
      // Clear other selections
      document.querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      userAnswers[currentQuestionIndex] = index;
      document.getElementById("assessment-error").style.display = "none";
    });

    optionsContainer.appendChild(btn);
  });
}

function finishAssessment() {
  const quizSection = document.getElementById("assessment-quiz");
  const scoreSection = document.getElementById("assessment-score");
  const loadingOverlay = document.getElementById("loading-overlay");

  loadingOverlay.classList.remove("hidden");

  let correctCount = 0;
  currentQuestions.forEach((q, idx) => {
    if (userAnswers[idx] === q.answerIndex) correctCount++;
  });

  const scorePercent = Math.round((correctCount / currentQuestions.length) * 100);

  const user = auth.currentUser;
  if (user) {
    // CHANGED: fetch the profile first so we have literacyLevel, then use
    // the SAME determineLevel() the recommendation card uses — instead of
    // a raw-score-only band split that could (and did) disagree with it.
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
          currentLevel: level
        }))
        .then(() => {
          loadingOverlay.classList.add("hidden");
          quizSection.classList.add("hidden");
          scoreSection.classList.remove("hidden");
          displayScore(scorePercent, level);
          triggerAssessmentAIAnalysis(scorePercent, level);
        });
    }).catch(err => {
      console.error("Error saving assessment:", err);
      loadingOverlay.classList.add("hidden");
      quizSection.classList.add("hidden");
      scoreSection.classList.remove("hidden");
      displayScore(scorePercent, "beginner");
      triggerAssessmentAIAnalysis(scorePercent, "beginner");
    });
  }
}

// ─── Assessment AI Insights (Gemini) ──────────────────────────

async function triggerAssessmentAIAnalysis(scorePercent, level) {
  const loadingEl = document.getElementById("assessment-ai-loading");
  const insightsEl = document.getElementById("assessment-ai-insights");
  
  if (loadingEl) loadingEl.classList.remove("hidden");
  if (insightsEl) insightsEl.classList.add("hidden");
  
  // 1. Fetch exact user profile directly to ensure we have Age and Literacy
  const user = auth.currentUser;
  let litDesc = "Beginner";
  let isChild = false;
  let ageGroup = "adult";
  let knownLangName = "English";
  
  if (user) {
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists) {
        const data = doc.data();
        litDesc = data.literacyLevel || "Beginner";
        ageGroup = data.ageGroup || "adult";
        isChild = (data.ageGroup === 'below18');
        const langNames = { en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu", kn: "Kannada", bn: "Bengali", mr: "Marathi" };
        knownLangName = langNames[data.preferredLanguage] || "English";
      }
    } catch (e) { console.error("Error fetching user data", e); }
  }

  const prompt = `You are an expert literacy coach. Analyse this learner's initial assessment results.

LEARNER PROFILE:
- Age Group: ${ageGroup} (${isChild ? 'Child' : 'Adult'})
- Self-reported literacy: ${litDesc}
- Assessment Score: ${scorePercent}%
- Assessed Level: ${level}

Identify 2 strengths and 2 areas to improve based on their score. Then, create a personalized 5-step learning roadmap specifically tailored to their age, level, and areas where they are lagging behind.

CRITICAL: Write your ENTIRE response — summaryMessage, goodPoints, weakPoints, and every customPath title/desc — in ${knownLangName}, since that is the learner's understood language. Do NOT respond in English unless ${knownLangName} is English.

RESPOND ONLY with this exact JSON structure (no markdown, no extra text):
{
  "summaryMessage": "A personalized paragraph explaining their result, in ${knownLangName}.",
  "goodPoints": ["Point 1", "Point 2"],
  "weakPoints": ["Point 1", "Point 2"],
  "customPath": [
    { "title": "Step 1: Custom Title", "desc": "Specific reason", "level": "${level}", "unit": "alphabets", "type": "reading" },
    { "title": "Step 2: Custom Title", "desc": "...", "level": "${level}", "unit": "words", "type": "writing" },
    { "title": "Step 3: Custom Title", "desc": "...", "level": "${level}", "unit": "sentences", "type": "speaking" },
    { "title": "Step 4: Custom Title", "desc": "...", "level": "${level}", "unit": "paragraphs", "type": "listening" },
    { "title": "Step 5: Custom Title", "desc": "...", "level": "${level}", "unit": "alphabets", "type": "pronunciation" }
  ]
}`;

  try {
    const idToken = await firebase.auth().currentUser.getIdToken();
    const resp = await fetch('/api/callGemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + idToken },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048, responseMimeType: 'application/json' }
      })
    });
    
    if (!resp.ok) throw new Error(`Gemini API Error: ${resp.status}`);
    const data = await resp.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // 2. EXTREMELY SAFE JSON PARSING (Removes markdown bugs)
    text = text.replace(/```(json)?/gi, '').trim();
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
       text = text.substring(startIdx, endIdx + 1);
    }
    
    const analysis = JSON.parse(text);
    
    // 3. Save to Firestore so dashboard can read the custom path
    if (user) {
      await db.collection('users').doc(user.uid).update({
        geminiAnalysis: analysis,
        geminiAnalyzedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    // 4. Render UI on Assessment Page
    if (loadingEl) loadingEl.classList.add("hidden");
    if (insightsEl) insightsEl.classList.remove("hidden");
    
    const summaryMsg = document.getElementById("score-summary-message");
    if (summaryMsg && analysis.summaryMessage) {
      summaryMsg.textContent = analysis.summaryMessage;
    }
    
    const goodList = document.getElementById("ai-good-points");
    if (goodList && analysis.goodPoints) {
      goodList.innerHTML = analysis.goodPoints.map(p => `<li style="margin-bottom: 6px;">${p}</li>`).join('');
    }
    
    const weakList = document.getElementById("ai-weak-points");
    if (weakList && analysis.weakPoints) {
      weakList.innerHTML = analysis.weakPoints.map(p => `<li style="margin-bottom: 6px;">${p}</li>`).join('');
    }

  } catch (err) {
    console.error('Gemini assessment analysis failed:', err);
    if (loadingEl) loadingEl.classList.add("hidden");
    if (insightsEl) {
      insightsEl.classList.remove("hidden");
      document.getElementById("score-summary-message").textContent = "We have prepared your personalized learning path. Please continue to the Dashboard.";
    }
  }
}

/**
 * Initialize curriculum unlock state based on assessed level.
 * Beginner: Only beginner alphabets unlocked
 * Intermediate: Beginner complete, intermediate alphabets unlocked
 * Advanced: Beginner+Intermediate complete, advanced alphabets unlocked
 */
function initializeCurriculum(level) {
  const skills = ['reading', 'writing', 'listening', 'speaking', 'pronunciation'];
  const levels = ['beginner', 'intermediate', 'advanced'];
  const curriculum = {};

  levels.forEach(lvl => {
    curriculum[lvl] = {};
    skills.forEach(skill => {
      curriculum[lvl][skill] = {
        status: 'locked', // locked, available, completed, skipped
        lessonsCompleted: 0,
        totalLessons: 5
      };
    });
  });

  const levelIdx = levels.indexOf(level);
  levels.forEach((lvl, idx) => {
    if (idx < levelIdx) {
      // Placed above this level by assessment — honest label, not fake completion
      skills.forEach(skill => { curriculum[lvl][skill].status = 'skipped'; });
    } else if (idx === levelIdx) {
      skills.forEach(skill => { curriculum[lvl][skill].status = 'available'; });
    }
  });

  return curriculum;
}

function displayScore(scorePercent, level) {
  document.getElementById("final-score").textContent = scorePercent;

  // Animate circle
  const circle = document.getElementById("score-circle");
  // Circumference is 2 * pi * r (r=80) ~ 502
  const offset = 502 - (502 * scorePercent) / 100;
  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
  }, 100);

  // Set badge
  const badge = document.getElementById("score-level-badge");
  badge.className = `score-level ${level}`;

  let badgeKey = "scoreLevelBeginner";
  if (level === "intermediate") badgeKey = "scoreLevelIntermediate";
  if (level === "advanced") badgeKey = "scoreLevelAdvanced";

  // Apply translation
  badge.innerHTML = `<span>${getTranslation(selectedLang, badgeKey)}</span>`;
}

// Ensure this runs when loaded via main.js routing
if (document.body.id === "page-assessment") {
  document.addEventListener("DOMContentLoaded", setupAssessment);
}
