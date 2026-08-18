/**
 * dashboard.js — Duolingo-Style Dashboard Logic
 *
 * Renders the learning path tree, XP/streak counters, skill cards,
 * and handles navigation to lesson pages.
 */

var selectedLang = (typeof selectedLang !== "undefined" ? selectedLang : null) || localStorage.getItem("saksharLang") || "en";

// ─── Unit Configuration ───────────────────────────────────────
const UNIT_CONFIG = {
  alphabets: { icon: "<i data-lucide=\"type\"></i>", label: "dashUnitAlphabets", fallback: "Alphabets" },
  words: { icon: "<i data-lucide=\"edit-3\"></i>", label: "dashUnitWords", fallback: "Words" },
  sentences: { icon: "<i data-lucide=\"file-text\"></i>", label: "dashUnitSentences", fallback: "Sentences" },
  paragraphs: {
    icon: "<i data-lucide=\"book-open\"></i>",
    label: "dashUnitParagraphs",
    fallback: "Paragraphs",
  },
};

const LEVEL_CONFIG = {
  beginner: {
    icon: "<i data-lucide=\"sprout\"></i>",
    label: "scoreLevelBeginner",
    fallback: "Beginner",
    color: "amber",
  },
  intermediate: {
    icon: "<i data-lucide=\"book\"></i>",
    label: "scoreLevelIntermediate",
    fallback: "Intermediate",
    color: "purple",
  },
  advanced: {
    icon: "<i data-lucide=\"rocket\"></i>",
    label: "scoreLevelAdvanced",
    fallback: "Advanced",
    color: "teal",
  },
};

const SKILL_CONFIG = [
  {
    id: "reading",
    icon: "<i data-lucide=\"book-open\"></i>",
    label: "skillReading",
    fallback: "Reading",
    color: "purple",
    desc: "skillReadingDesc",
    descFallback: "Improve comprehension with curated texts",
  },
  {
    id: "writing",
    icon: "<i data-lucide=\"pen-tool\"></i>",
    label: "skillWriting",
    fallback: "Writing",
    color: "teal",
    desc: "skillWritingDesc",
    descFallback: "Practice writing with guided exercises",
  },
  {
    id: "speaking",
    icon: "<i data-lucide=\"mic\"></i>",
    label: "skillSpeaking",
    fallback: "Speaking",
    color: "amber",
    desc: "skillSpeakingDesc",
    descFallback: "Build confidence with speech practice",
  },
  {
    id: "pronunciation",
    icon: "<i data-lucide=\"type\"></i>",
    label: "skillPronunciation",
    fallback: "Pronunciation",
    color: "pink",
    desc: "skillPronunciationDesc",
    descFallback: "Perfect your pronunciation with audio",
  },
  {
    id: "listening",
    icon: "<i data-lucide=\"headphones\"></i>",
    label: "skillListening",
    fallback: "Listening",
    color: "blue",
    desc: "skillListeningDesc",
    descFallback: "Enhance understanding through audio lessons",
  },
];

// ─── Dashboard Initialization ─────────────────────────────────

function initDashboard(profile) {
  renderTopBar(profile);
  renderRecommendation(profile);
  renderRecommendedScroll(profile);
  renderHomeHeatmap(profile);
  renderStatsStrip(profile);
  renderLearningPath(profile);
  if (typeof initUnitsTab === "function") {
    initUnitsTab(profile);
  }
  renderSkillCards(profile);
  renderSidePanel(profile);
  renderProfile(profile);
  setupShop(profile);
  renderAnnouncementBanner();
  setupFeedbackForm();

  manageDailyQuests(profile); // 🌟 ADD THIS EXACT LINE RIGHT HERE!
  initPhraseOfDay(profile);
  initAIGrowthAdvisor(profile);

  setupDashboardEvents(profile);

  // Update streak
  const user = auth.currentUser;
  if (user) {
    updateStreak(user.uid).then((streak) => {
      if (typeof streak === "number") {
        document.getElementById("streak-count").textContent = streak;
        const mobileStreakEl = document.getElementById("mobile-streak-count");
        if (mobileStreakEl) mobileStreakEl.textContent = streak;
        // Also keep strip in sync
        const stripStreak = document.getElementById("strip-streak");
        if (stripStreak) stripStreak.textContent = streak;
      }
    });
  }

  // Live-sync coins in case they change on another page (chat, game) while
  // this dashboard tab stays open — keeps the header count from looking "stuck".
  const user2 = auth.currentUser;
  if (user2) {
    db.collection("users")
      .doc(user2.uid)
      .onSnapshot((doc) => {
        if (!doc.exists) return;
        const liveCoins = doc.data().coins || 0;
        const coinEl = document.getElementById("coin-count");
        if (coinEl) coinEl.textContent = Number(liveCoins).toLocaleString();
        const mobileCoinEl = document.getElementById("mobile-coin-count");
        if (mobileCoinEl) mobileCoinEl.textContent = Number(liveCoins).toLocaleString();
        if (shopUserProfile) shopUserProfile.coins = liveCoins;
      });
  }
  const dateEl = document.getElementById("topbar-date");
  if (dateEl)
    dateEl.textContent = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
}

// ─── Recommendation Logic ─────────────────────────────────────

/**
 * computeRecommendation(score, literacyLevel)
 *
 * Returns { interpretation, level, unit, unitLabel, unitIcon, levelLabel, url }
 * based on the combined assessment score + self-reported literacy level.
 * Two users with the same literacyLevel but different scores get different
 * recommendations because the score reflects demonstrated ability.
 */
function computeRecommendation(score, literacyLevel) {
  const s = score || 0;
  // CHANGED: use the shared determineLevel() instead of a locally
  // duplicated matrix, so this can never drift out of sync with what
  // assessment.js decided at assessment time.
  const { level: recLevel, unit: recUnit } = determineLevel(s, literacyLevel);

  // Interpretation text still varies by score band for a nicer message —
  // keep your existing interp/matrix text lookup here, just use recLevel/
  // recUnit (from the shared function) instead of a separately-computed
  // row.level/row.unit.

  const unitLabels = {
    alphabets: { label: "Alphabets — Letter Recognition", icon: "<i data-lucide=\"type\"></i>" },
    words: { label: "Words — Vocabulary Building", icon: "<i data-lucide=\"edit-3\"></i>" },
    sentences: { label: "Sentences — Reading Practice", icon: "<i data-lucide=\"file-text\"></i>" },
    paragraphs: { label: "Paragraphs — Comprehension", icon: "<i data-lucide=\"book-open\"></i>" },
  };
  const levelLabels = {
    beginner: { label: "Beginner Level", tag: "beginner" },
    intermediate: { label: "Intermediate Level", tag: "intermediate" },
    advanced: { label: "Advanced Level", tag: "advanced" },
  };

  const uInfo = unitLabels[recUnit] || unitLabels.alphabets;
  const lInfo = levelLabels[recLevel] || levelLabels.beginner;

  // ...keep your existing interpretation-text lookup, just referencing
  // recLevel/recUnit going forward instead of row.level/row.unit...

  return {
    level: recLevel,
    unit: recUnit,
    unitLabel: uInfo.label,
    unitIcon: uInfo.icon,
    levelTag: lInfo.tag,
    levelLabel: lInfo.label,
    url: `lesson.html?level=${recLevel}&unit=${recUnit}&type=reading`,
    // ...interpretation field stays as you had it...
  };
}

/**
 * renderRecommendation(profile)
 *
 * Populates the #view-results recommendation card with the computed
 * score ring, headline, interpretation, and Start Here CTA.
 */

function computeNextIncompleteLesson(profile) {
  const currentLevel = profile.currentLevel || profile.assessmentLevel || "beginner";
  const completedLessons = profile.completedLessons || [];
  const curriculum = profile.curriculum || {};

  const levels = ["beginner", "intermediate", "advanced"];
  const skills = ["reading", "writing", "listening", "speaking", "pronunciation"];

  const lit = profile.literacyLevel || "preferNot";
  const unitByLiteracy = {
    neverLearned: "alphabets",
    canRecognize: "words",
    canReadSimple: "sentences",
    canReadComfort: "paragraphs",
    preferNot: "alphabets",
  };
  const unit = unitByLiteracy[lit] || "alphabets";

  const startIdx = Math.max(0, levels.indexOf(currentLevel));
  const searchLevels = levels.slice(startIdx).concat(levels.slice(0, startIdx));

  for (const lvl of searchLevels) {
    for (const skill of skills) {
      for (let i = 1; i <= 5; i++) {
        const lessonId = `${lvl}_${skill}_${unit}_${i}`;
        if (!completedLessons.includes(lessonId)) {
          const blueprint = window.CURRICULUM_BLUEPRINT?.[lvl]?.[skill]?.find(b => b.lessonIndex === i);
          const focusText = blueprint ? blueprint.focus : `Lesson ${i}`;

          const prefLang = profile.preferredLanguage || selectedLang || "en";
          const skillKey = "skill" + skill.charAt(0).toUpperCase() + skill.slice(1) + "Name";
          const localizedSkill = getTranslation(prefLang, skillKey) || (skill.charAt(0).toUpperCase() + skill.slice(1));
          const stepWord = getTranslation(prefLang, "stepWord") || "Lesson";
          const levelWord = getTranslation(prefLang, "recommendedLevelSub") || "Level";
          const levelName = getTranslation(prefLang, "score" + lvl.charAt(0).toUpperCase() + lvl.slice(1)) || (lvl.charAt(0).toUpperCase() + lvl.slice(1));

          return {
            level: lvl,
            unit: unit,
            lessonType: skill,
            lessonIndex: i,
            title: `${localizedSkill} — ${stepWord} ${i}`,
            sub: `${levelName} ${levelWord} • ~3 mins`,
            url: `lesson.html?level=${lvl}&unit=${unit}&type=${skill}&lessonIndex=${i}`,
            icon: "<i data-lucide='play-circle'></i>"
          };
        }
      }
    }
  }

  const prefLang = profile.preferredLanguage || selectedLang || "en";
  return {
    level: "advanced",
    unit: unit,
    lessonType: "reading",
    lessonIndex: 1,
    title: getTranslation(prefLang, "statusCompleted") || "Completed",
    sub: getTranslation(prefLang, "unitsSkillsMastered") || "All Caught Up!",
    url: "#",
    icon: "<i data-lucide='check-circle'></i>",
    isFinished: true
  };
}

function renderRecommendation(profile) {
  const prefLang = profile.preferredLanguage || selectedLang || "en";
  const score = profile.assessmentScore || 0;
  const litLvl = profile.literacyLevel || "preferNot";
  const rec = computeRecommendation(score, litLvl);
  const nextLesson = computeNextIncompleteLesson(profile);

  // ── Static content (renders immediately) ──────────────────────
  const headline = document.getElementById("rec-score-headline");
  if (headline)
    headline.textContent = getTranslation(
      prefLang,
      "dashScoredHeadline",
    ).replace("{score}", score);

  const scoreVal = document.getElementById("rec-score-value");
  if (scoreVal) scoreVal.textContent = score;

  const tag = document.getElementById("rec-level-tag");
  const tagText = document.getElementById("rec-level-tag-text");
  if (tag) {
    tag.className = `rec-card-tag ${rec.levelTag}`;
    const localizedTagName = getTranslation(prefLang, "score" + rec.levelTag.charAt(0).toUpperCase() + rec.levelTag.slice(1)) || rec.levelTag;
    if (tagText) tagText.textContent = localizedTagName;
    else tag.textContent = localizedTagName;
  }

  const interp = document.getElementById("rec-interpretation");
  if (interp) interp.textContent = rec.interpretation;

  const ctaIcon = document.getElementById("rec-cta-icon");
  const ctaTitle = document.getElementById("rec-cta-title");
  const ctaSub = document.getElementById("rec-cta-sub");
  const ctaBtn = document.getElementById("rec-start-btn");
  if (ctaIcon) ctaIcon.innerHTML = nextLesson.icon;
  if (ctaTitle) ctaTitle.textContent = nextLesson.title;
  if (ctaSub) ctaSub.textContent = nextLesson.sub;
  if (ctaBtn) {
    ctaBtn.href = nextLesson.url;
    if (nextLesson.isFinished) {
      ctaBtn.style.pointerEvents = "none";
      ctaBtn.textContent = `✔ ${getTranslation(prefLang, "statusCompleted") || "Completed"}`;
      ctaBtn.style.opacity = "0.5";
    } else {
      ctaBtn.innerHTML = `<i data-lucide="play" style="width: 16px; height: 16px; fill: currentColor;"></i> <span>${getTranslation(prefLang, "resumeBtn") || "Resume"}</span>`;
    }
  }

  // Animate score ring
  const circle = document.getElementById("rec-score-circle");
  if (circle) {
    const circ = 2 * Math.PI * 50;
    const offset = circ - (score / 100) * circ;
    setTimeout(() => {
      circle.style.strokeDasharray = `${circ}`;
      circle.style.strokeDashoffset = offset;
    }, 350);
  }

  // ── Next Milestone Hero Card Population ─────────────────────────
  const completedLessons = profile.completedLessons || [];
  const completedCount = completedLessons.length;
  const currentUnitTotal = 5;
  const unitStep = Math.min((completedCount % currentUnitTotal) + 1, currentUnitTotal);
  const milestonePct = Math.min(Math.round(((completedCount % currentUnitTotal) / currentUnitTotal) * 100), 100);

  const msTitle = document.getElementById("hero-milestone-title");
  if (msTitle) {
    msTitle.textContent = nextLesson.title;
  }

  const msStep = document.getElementById("hero-milestone-progress-label");
  if (msStep) {
    const stepLabel = getTranslation(prefLang, "stepWord") || "Step";
    const ofLabel = getTranslation(prefLang, "assessmentOf") || "of";
    msStep.textContent = `${stepLabel} ${unitStep} ${ofLabel} ${currentUnitTotal}`;
  }

  const msPct = document.getElementById("hero-milestone-pct");
  if (msPct) {
    msPct.textContent = `${milestonePct}%`;
  }

  const msFill = document.getElementById("hero-milestone-fill");
  if (msFill) {
    msFill.style.width = `${Math.max(milestonePct, 15)}%`;
  }

  const msStatus = document.getElementById("hero-milestone-status");
  if (msStatus) {
    msStatus.textContent = milestonePct >= 100
      ? (getTranslation(prefLang, "statusCompleted") || "Completed")
      : (getTranslation(prefLang, "statusInProgress") || "In Progress");
  }

  // ── AI Enhancement ────────────────────────────────────────────
  if (profile.geminiAnalysis) {
    // Already saved from assessment completion — use immediately
    renderAIAnalysis(profile.geminiAnalysis, rec);
  } else {
    // No saved analysis (maybe legacy user or skipped assessment)
    // Fall back to just static interpretation.
    showAILoading(false);
    const interp = document.getElementById("rec-interpretation");
    if (interp) interp.textContent = rec.interpretation;
  }
}

/**
 * showAILoading(show)
 * Toggles the shimmer loading indicator inside the recommendation card.
 */
function showAILoading(show) {
  const el = document.getElementById("rec-ai-loading");
  if (el) el.classList.toggle("hidden", !show);
}

/**
 * renderAIAnalysis(analysis, rec)
 *
 * Populates:
 *   - #rec-interpretation with AI interpretation text
 *   - #skill-breakdown-section with animated skill bars
 *   - #ai-extra-recs with additional targeted lesson recommendations
 *   - #rec-motivational with the encouragement note
 *   - Updates the primary CTA if Gemini overrides the recommended lesson
 */
function renderAIAnalysis(analysis, rec) {
  // Update interpretation with AI text
  const interp = document.getElementById("rec-interpretation");
  if (interp && analysis.interpretation) {
    interp.textContent = analysis.interpretation;
    interp.classList.add("ai-powered-text");
  }

  // Render skill breakdown bars
  const barsEl = document.getElementById("skill-bd-bars");
  const sectionEl = document.getElementById("skill-breakdown-section");
  if (barsEl && analysis.skillBreakdown && analysis.skillBreakdown.length) {
    const statusConfig = {
      strong: {
        label: "Strong",
        color: "var(--color-accent)",
        bg: "rgba(0,212,170,0.15)",
      },
      moderate: {
        label: "Improving",
        color: "var(--color-warm-light,#f59e0b)",
        bg: "rgba(245,158,11,0.15)",
      },
      needs_work: {
        label: "Needs Work",
        color: "var(--color-error,#ef4444)",
        bg: "rgba(239,68,68,0.15)",
      },
    };

    barsEl.innerHTML = analysis.skillBreakdown
      .map((skill) => {
        const cfg = statusConfig[skill.status] || statusConfig.moderate;
        const pct = Math.max(5, Math.min(100, skill.estimatedScore || 50));
        return `<div class="skill-bar-item">
        <div class="skill-bar-meta">
          <span class="skill-bar-label"><span class="skill-bar-icon">${skill.icon || "<i data-lucide='pin'></i>"}</span> ${skill.skill}</span>
          <span class="skill-bar-status-tag" style="background:${cfg.bg};color:${cfg.color}">${cfg.label}</span>
        </div>
        <div class="skill-bar-track">
          <div class="skill-bar-fill" data-pct="${pct}" style="width:0%;background:${cfg.color}"></div>
        </div>
      </div>`;
      })
      .join("");

    // Animate bars with staggered delay
    requestAnimationFrame(() => {
      barsEl.querySelectorAll(".skill-bar-fill").forEach((bar, i) => {
        setTimeout(() => {
          bar.style.width = bar.dataset.pct + "%";
          bar.style.transition = "width 0.8s cubic-bezier(0.34,1.56,0.64,1)";
        }, i * 120);
      });
    });

    if (sectionEl) sectionEl.classList.remove("hidden");
  }

  // Motivational note
  const motivEl = document.getElementById("rec-motivational");
  if (motivEl && analysis.motivationalNote) {
    motivEl.innerHTML = "<i data-lucide='lightbulb' class='inline-icon'></i> " + analysis.motivationalNote;
  }

  // Update primary CTA if Gemini gives a better recommendation
  // [Gemini CTA override removed so Continue Learning remains live-computed]


  // Render extra lesson recommendations (topRecommendations[1..] to avoid duplicating the primary)
  const extraListEl = document.getElementById("ai-extra-recs-list");
  const extraSecEl = document.getElementById("ai-extra-recs");
  if (
    extraListEl &&
    extraSecEl &&
    analysis.topRecommendations &&
    analysis.topRecommendations.length > 1
  ) {
    const extraRecs = analysis.topRecommendations.slice(1, 4); // up to 3 extras
    const unitLabels = {
      alphabets: { icon: "<i data-lucide=\"type\"></i>", name: "Alphabets" },
      words: { icon: "<i data-lucide=\"edit-3\"></i>", name: "Words" },
      sentences: { icon: "<i data-lucide=\"file-text\"></i>", name: "Sentences" },
      paragraphs: { icon: "<i data-lucide=\"book-open\"></i>", name: "Paragraphs" },
    };
    const level = analysis.recommendedLevel || rec.level;
    extraListEl.innerHTML = extraRecs
      .map((r) => {
        const uInfo = unitLabels[r.unit] || { icon: "<i data-lucide=\"book-open\"></i>", name: r.unit };
        const url = `lesson.html?level=${level}&unit=${r.unit}&type=${r.lessonType || "reading"}`;
        return `<div class="ai-rec-item">
        <div class="ai-rec-item-left">
          <span class="ai-rec-icon">${uInfo.icon}</span>
          <div class="ai-rec-info">
            <div class="ai-rec-title">${uInfo.name} — ${r.lessonType || "Reading"}</div>
            <div class="ai-rec-reason">${r.reason || ""}</div>
          </div>
        </div>
        <a href="${url}" class="ai-rec-btn">Start →</a>
      </div>`;
      })
      .join("");
    extraSecEl.classList.remove("hidden");
  }
}

/**
 * renderStatsStrip(profile)
 *
 * Fills the condensed stats strip in #view-results.
 */
function renderStatsStrip(profile) {
  const streak = document.getElementById("strip-streak");
  const xp = document.getElementById("strip-xp");
  const lessons = document.getElementById("strip-lessons");
  const badges = document.getElementById("strip-badges");

  if (streak) streak.textContent = profile.streak || 0;
  if (xp) xp.textContent = profile.xp || 0;
  if (lessons) lessons.textContent = (profile.completedLessons || []).length;
  if (badges) badges.textContent = (profile.badgesEarned || []).length;
}

// ─── Home Dashboard UI Enhancements ─────────────────────────────

function renderRecommendedScroll(profile) {
  const container = document.getElementById("recommended-horizontal-scroll");
  if (!container) return;

  const prefLang = profile.preferredLanguage || selectedLang || "en";
  const currentLevel = profile.currentLevel || profile.assessmentLevel || "beginner";
  const levels = ["beginner", "intermediate", "advanced"];
  const skills = ["reading", "writing", "listening", "speaking", "pronunciation"];

  // Find up to 3 uncompleted lessons
  let recs = [];
  const completedLessons = profile.completedLessons || [];
  const curriculum = profile.curriculum || {};
  const startIdx = Math.max(0, levels.indexOf(currentLevel));
  const searchLevels = levels.slice(startIdx).concat(levels.slice(0, startIdx));

  for (const lvl of searchLevels) {
    if (recs.length >= 3) break;
    for (const skill of skills) {
      if (recs.length >= 3) break;
      const status = curriculum[lvl]?.[skill]?.status || "locked";
      if (status === "locked" || status === "skipped") continue;

      for (let i = 1; i <= 5; i++) {
        const unit = "alphabets"; // Simplify for recommendation mapping
        const lessonId = `${lvl}_${skill}_${unit}_${i}`;
        if (!completedLessons.includes(lessonId)) {
          const blueprint = window.CURRICULUM_BLUEPRINT?.[lvl]?.[skill]?.find(b => b.lessonIndex === i);
          const skillKey = "skill" + skill.charAt(0).toUpperCase() + skill.slice(1) + "Name";
          const localizedSkill = getTranslation(prefLang, skillKey) || (skill.charAt(0).toUpperCase() + skill.slice(1));
          const stepWord = getTranslation(prefLang, "stepWord") || "Lesson";
          const levelWord = getTranslation(prefLang, "recommendedLevelSub") || "Level";
          const levelName = getTranslation(prefLang, "score" + lvl.charAt(0).toUpperCase() + lvl.slice(1)) || (lvl.charAt(0).toUpperCase() + lvl.slice(1));
          const defaultDesc = getTranslation(prefLang, "coreSkillFluencyDesc") || `Master core ${skill} exercises and build foundational fluency.`;

          recs.push({
            title: `${localizedSkill} — ${stepWord} ${i}`,
            sub: `${levelName} ${levelWord}`,
            desc: defaultDesc,
            xp: `+25 XP`,
            time: `~4 mins`,
            url: `lesson.html?level=${lvl}&unit=${unit}&type=${skill}&lessonIndex=${i}`,
            icon: SKILL_CONFIG.find(s => s.id === skill)?.icon || "<i data-lucide='book-open'></i>"
          });
          break; // only 1 per skill in recommended
        }
      }
    }
  }

  // Fallback if fully completed
  if (recs.length === 0) {
    const readingName = getTranslation(prefLang, "skillReadingName") || "Reading";
    const speakingName = getTranslation(prefLang, "skillSpeakingName") || "Speaking";
    const listeningName = getTranslation(prefLang, "skillListeningName") || "Listening";
    const beginnerName = getTranslation(prefLang, "scoreBeginner") || "Beginner";
    const intermediateName = getTranslation(prefLang, "scoreIntermediate") || "Intermediate";
    const levelWord = getTranslation(prefLang, "recommendedLevelSub") || "Level";

    recs = [
      { title: readingName, sub: `${beginnerName} ${levelWord}`, desc: getTranslation(prefLang, "skillReadingDesc") || "Sharpen vowel recognition and sight words.", xp: "+20 XP", time: "~3 mins", url: "lesson.html?type=reading&mode=practice", icon: "<i data-lucide='book-open'></i>" },
      { title: speakingName, sub: `${intermediateName} ${levelWord}`, desc: getTranslation(prefLang, "skillSpeakingDesc") || "Practice real-world pronunciation and dialogues.", xp: "+25 XP", time: "~4 mins", url: "lesson.html?type=speaking&mode=practice", icon: "<i data-lucide='mic'></i>" },
      { title: listeningName, sub: `${intermediateName} ${levelWord}`, desc: getTranslation(prefLang, "skillListeningDesc") || "Train your ear with native speaker audio.", xp: "+20 XP", time: "~3 mins", url: "lesson.html?type=listening&mode=practice", icon: "<i data-lucide='headphones'></i>" }
    ];
  }

  const startLessonText = getTranslation(prefLang, "startLessonBtn") || "Start Lesson";

  container.innerHTML = recs.map(r => `
    <a href="${r.url}" class="recommended-card">
      <div class="recommended-card-top">
        <div class="recommended-icon">${r.icon}</div>
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <span class="recommended-badge">${r.sub}</span>
          <span style="font-size: 0.75rem; font-weight: 700; color: #64748b;">${r.time}</span>
        </div>
      </div>
      <div>
        <h4 class="recommended-title">${r.title}</h4>
        <p class="recommended-desc">${r.desc}</p>
      </div>
      <div class="recommended-card-bottom">
        <span class="recommended-xp-tag"><i data-lucide="zap" style="width: 12px; height: 12px; fill: currentColor;"></i> ${r.xp}</span>
        <span class="recommended-action-link">${startLessonText} <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i></span>
      </div>
    </a>
  `).join("");

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function renderHomeHeatmap(profile) {
  const container = document.getElementById("home-activity-heatmap");
  if (!container) return;

  const prefLang = profile.preferredLanguage || selectedLang || "en";
  const localeMap = { en: "en-US", hi: "hi-IN", ta: "ta-IN", te: "te-IN", kn: "kn-IN", bn: "bn-IN", mr: "mr-IN" };
  const locale = localeMap[prefLang] || "en-US";

  const practiceDays = profile.practiceDays || [];
  const streak = profile.streak || 0;
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const isPracticed = practiceDays.includes(dateStr);
    const isToday = i === 0;

    days.push({
      dateStr: dateStr,
      dayName: d.toLocaleDateString(locale, { weekday: "short" }),
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString(locale, { month: "short" }),
      isPracticed: isPracticed,
      isToday: isToday
    });
  }

  const activeDaysCount = days.filter(d => d.isPracticed).length;
  const consistencyPct = Math.round((activeDaysCount / 7) * 100);

  // Update Summary Metrics
  const streakCountEl = document.getElementById("activity-streak-count");
  if (streakCountEl) streakCountEl.textContent = streak;

  const daysActiveEl = document.getElementById("act-days-active");
  if (daysActiveEl) daysActiveEl.textContent = `${activeDaysCount} / 7`;

  const consistencyEl = document.getElementById("act-consistency-pct");
  if (consistencyEl) consistencyEl.textContent = `${consistencyPct}%`;

  const statusEl = document.getElementById("act-weekly-status");
  if (statusEl) {
    if (activeDaysCount >= 5) statusEl.textContent = getTranslation(prefLang, "actUnstoppable") || "🔥 Unstoppable";
    else if (activeDaysCount >= 3) statusEl.textContent = getTranslation(prefLang, "actGreatPace") || "⚡ Great Pace";
    else if (activeDaysCount >= 1) statusEl.textContent = getTranslation(prefLang, "actGoodStart") || "🌱 Good Start";
    else statusEl.textContent = getTranslation(prefLang, "actReadyStart") || "🚀 Ready to Start";
  }

  const bannerTextEl = document.getElementById("activity-banner-text");
  if (bannerTextEl) {
    if (streak > 0) {
      const templ = getTranslation(prefLang, "actStreakBlazing") || "You're on a {streak}-day streak! Practice today to keep your streak blazing.";
      bannerTextEl.innerHTML = `🔥 <strong>${templ.replace("{streak}", streak)}</strong>`;
    } else {
      const templ = getTranslation(prefLang, "actStreakNew") || "Consistency is your superpower! Practice just 5 minutes today to start a new streak.";
      bannerTextEl.innerHTML = `🌟 <strong>${templ}</strong>`;
    }
  }

  const doneLabel = getTranslation(prefLang, "actDone") || "Done";
  const restLabel = getTranslation(prefLang, "actRest") || "Rest";
  const todayLabel = getTranslation(prefLang, "actToday") || "Today";

  container.innerHTML = days.map(d => {
    let statusClass = "missed";
    let statusText = restLabel;
    let dotContent = `<i data-lucide="minus" style="width: 14px; height: 14px; opacity: 0.5;"></i>`;
    let dotClass = "inactive";

    if (d.isPracticed) {
      statusClass = "done";
      statusText = doneLabel;
      dotContent = `<i data-lucide="check" style="width: 18px; height: 18px; stroke-width: 3;"></i>`;
      dotClass = "active";
    } else if (d.isToday) {
      statusClass = "today";
      statusText = todayLabel;
      dotContent = `<i data-lucide="flame" style="width: 16px; height: 16px;"></i>`;
      dotClass = "today-pending";
    }

    return `
      <div class="heatmap-day ${d.isPracticed ? 'is-active-day' : ''} ${d.isToday ? 'is-today' : ''}">
        <span class="heatmap-day-name">${d.dayName}</span>
        <span class="heatmap-day-num">${d.dayNum}</span>
        <div class="heatmap-dot ${dotClass}">
          ${dotContent}
        </div>
        <span class="heatmap-day-status ${statusClass}">${statusText}</span>
      </div>
    `;
  }).join("");

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ─── Top Bar ──────────────────────────────────────────────────

function renderTopBar(profile) {
  // Avatar
  const avatar = document.getElementById("user-avatar");
  if (avatar) {
    avatar.textContent = profile.fullName.charAt(0).toUpperCase();
  }

  // Welcome name
  const welcomeName = document.getElementById("welcome-name");
  if (welcomeName) {
    welcomeName.textContent = profile.fullName;
  }

  // XP
  const xpCount = document.getElementById("xp-count");
  if (xpCount) xpCount.textContent = profile.xp || 0;
  const mobileXpCount = document.getElementById("mobile-xp-count");
  if (mobileXpCount) mobileXpCount.textContent = profile.xp || 0;

  // Streak
  const streakCount = document.getElementById("streak-count");
  if (streakCount) streakCount.textContent = profile.streak || 0;
  const mobileStreakCount = document.getElementById("mobile-streak-count");
  if (mobileStreakCount) mobileStreakCount.textContent = profile.streak || 0;

  // Level badge
  const levelBadge = document.getElementById("user-level-badge");
  if (levelBadge) {
    const prefLang = profile.preferredLanguage || (typeof selectedLang !== "undefined" ? selectedLang : "en") || "en";
    const level = profile.currentLevel || profile.assessmentLevel || "beginner";
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.beginner;
    levelBadge.className = `dash-level-badge ${level}`;
    levelBadge.innerHTML = `${config.icon} <span>${getTranslation(prefLang, config.label) || config.fallback}</span>`;
  }
}

// Global function to toggle unlock state of placed-above tracks
window.toggleUnlockPlacedLevel = function (level) {
  if (!level) return;
  let unlocked = [];
  try {
    unlocked = JSON.parse(localStorage.getItem("akshar_unlocked_placed_levels") || "[]");
  } catch (err) { }
  if (unlocked.includes(level)) {
    unlocked = unlocked.filter(l => l !== level);
  } else {
    unlocked.push(level);
  }
  try {
    localStorage.setItem("akshar_unlocked_placed_levels", JSON.stringify(unlocked));
  } catch (e) { }

  if (typeof auth !== "undefined" && auth.currentUser && typeof db !== "undefined") {
    db.collection("users").doc(auth.currentUser.uid).update({
      unlockedPlacedLevels: unlocked
    }).catch(() => {});
  }

  if (window._currentLearnerProfile) {
    window._currentLearnerProfile.unlockedPlacedLevels = unlocked;
    renderLearningPath(window._currentLearnerProfile);
  }
};

// ─── Learning Path Tree & Modern Curriculum Trail ──────────────────

function renderLearningPath(profile) {
  const pathContainer = document.getElementById("learning-path");
  if (!pathContainer) return;
  window._currentLearnerProfile = profile;

  // Asynchronously sync past lessonHistory accuracy scores if not already synced
  if (auth.currentUser && !profile._historyScoresSynced && typeof db !== "undefined") {
    profile._historyScoresSynced = true;
    db.collection("users").doc(auth.currentUser.uid).collection("lessonHistory").get().then(snap => {
      if (!snap.empty) {
        if (!profile.lessonScores) profile.lessonScores = {};
        snap.forEach(doc => {
          const d = doc.data();
          if (d.type && typeof d.accuracy === "number") {
            const lId = `${d.level || 'beginner'}_${d.type}_${d.unit || 'alphabets'}_${d.lessonIndex || 1}`;
            if (!profile.lessonScores[lId]) {
              profile.lessonScores[lId] = d.accuracy;
            }
          }
        });
        renderLearningPath(profile);
      }
    }).catch(() => { });
  }

  const currentLevel = profile.currentLevel || profile.assessmentLevel || "beginner";
  const completedLessons = Array.isArray(profile.completedLessons) ? profile.completedLessons : [];

  let manuallyUnlockedLevels = [];
  try {
    const localUnlocked = JSON.parse(localStorage.getItem("akshar_unlocked_placed_levels") || "[]");
    const profileUnlocked = Array.isArray(profile.unlockedPlacedLevels) ? profile.unlockedPlacedLevels : [];
    manuallyUnlockedLevels = Array.from(new Set([...localUnlocked, ...profileUnlocked]));
  } catch (e) { }

  const levels = ["beginner", "intermediate", "advanced"];
  const skills = [
    "reading",
    "writing",
    "listening",
    "speaking",
    "pronunciation",
  ];

  const prefLang = profile.preferredLanguage || selectedLang || "en";
  const userLevelIndex = Math.max(0, levels.indexOf(currentLevel));

  const skillMeta = {
    reading: {
      name: getTranslation(prefLang, "skillReadingName") || "Reading Comprehension",
      icon: "book-open",
      gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
      desc: getTranslation(prefLang, "skillReadingDesc") || "Decode letters, recognize sight words, and master short passages"
    },
    writing: {
      name: getTranslation(prefLang, "skillWritingName") || "Sentence Writing",
      icon: "edit-3",
      gradient: "linear-gradient(135deg, #a855f7, #9333ea)",
      desc: getTranslation(prefLang, "skillWritingDesc") || "Form grammatically correct sentences, spelling, and phrase construction"
    },
    listening: {
      name: getTranslation(prefLang, "skillListeningName") || "Audio Listening",
      icon: "headphones",
      gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
      desc: getTranslation(prefLang, "skillListeningDesc") || "Understand natural speech, identify spoken vocabulary and phonetic tones"
    },
    speaking: {
      name: getTranslation(prefLang, "skillSpeakingName") || "Conversational Speaking",
      icon: "mic",
      gradient: "linear-gradient(135deg, #10b981, #059669)",
      desc: getTranslation(prefLang, "skillSpeakingDesc") || "Practice vocal responses, daily dialogues, and practical communication"
    },
    pronunciation: {
      name: getTranslation(prefLang, "skillPronunciationName") || "Speech & Phonics Clarity",
      icon: "volume-2",
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
      desc: getTranslation(prefLang, "skillPronunciationDesc") || "Refine accent clarity, syllable stress, and phonetic precision"
    },
  };

  const levelMeta = {
    beginner: {
      title: getTranslation(prefLang, "trackBeginnerTitle") || "Foundational Beginner Track",
      icon: "🌱",
      desc: getTranslation(prefLang, "trackBeginnerDesc") || "Alphabets, phonetic sounds, basic numbers, and essential vocabulary."
    },
    intermediate: {
      title: getTranslation(prefLang, "trackIntermediateTitle") || "Intermediate Fluency Track",
      icon: "⚡",
      desc: getTranslation(prefLang, "trackIntermediateDesc") || "Grammar structures, workplace dialogues, forms, and practical scenarios."
    },
    advanced: {
      title: getTranslation(prefLang, "trackAdvancedTitle") || "Advanced Mastery Track",
      icon: "👑",
      desc: getTranslation(prefLang, "trackAdvancedDesc") || "Complex comprehension, official documentation, and professional communication."
    }
  };

  // Compute total curriculum progress based on ACTUAL completed lessons
  let totalLessonsInCurriculum = levels.length * skills.length * 5;
  let totalCompletedCount = 0;

  levels.forEach((lvl) => {
    skills.forEach((sk) => {
      const lit = profile.literacyLevel || "preferNot";
      const unitByLiteracy = {
        neverLearned: "alphabets",
        canRecognize: "words",
        canReadSimple: "sentences",
        canReadComfort: "paragraphs",
        preferNot: "alphabets",
      };
      const unit = unitByLiteracy[lit] || "alphabets";
      for (let i = 1; i <= 5; i++) {
        const lessonId = `${lvl}_${sk}_${unit}_${i}`;
        if (completedLessons.includes(lessonId)) {
          totalCompletedCount++;
        }
      }
    });
  });

  const overallPct = Math.min(100, Math.round((totalCompletedCount / totalLessonsInCurriculum) * 100));

  let html = `
    <div class="path-hero-card">
      <div class="path-hero-header">
        <div class="path-hero-info">
          <div class="path-hero-badge">
            <i data-lucide="compass" style="width: 14px; height: 14px;"></i>
            <span>${getTranslation(prefLang, "curatedByAi") || "Personalized AI Curriculum"}</span>
          </div>
          <h2 class="path-hero-title">${getTranslation(prefLang, "dashLearningPath") || "Learning Path"}</h2>
          <p class="path-hero-desc">
            ${getTranslation(prefLang, "coreSkillFluencyDesc") || "Your master learning journey carefully benchmarked to your placement assessment diagnostic results."}
          </p>
          <div class="path-hero-stats">
            <div class="path-stat-chip">
              <i data-lucide="award" style="width: 15px; height: 15px; color: #a5b4fc;"></i>
              <span>${getTranslation(prefLang, "recommendedLevelSub") || "Level"}: ${getTranslation(prefLang, "score" + currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)) || currentLevel}</span>
            </div>
            <div class="path-stat-chip">
              <i data-lucide="check-circle" style="width: 15px; height: 15px; color: #34d399;"></i>
              <span>${totalCompletedCount} / ${totalLessonsInCurriculum} ${getTranslation(prefLang, "statusCompleted") || "Completed"} (${overallPct}%)</span>
            </div>
            <div class="path-stat-chip">
              <i data-lucide="zap" style="width: 15px; height: 15px; color: #fbbf24;"></i>
              <span>+25 XP</span>
            </div>
          </div>
        </div>
        <div class="path-hero-action">
          <button class="path-hero-btn" id="btn-jump-next-lesson">
            <span>${getTranslation(prefLang, "resumeBtn") || "Resume Path"}</span>
            <i data-lucide="arrow-right" style="width: 18px; height: 18px;"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  // Render Levels
  levels.forEach((level, levelIndex) => {
    const lMeta = levelMeta[level] || { title: `${level} Level`, icon: "📘", desc: "" };

    const isManuallyUnlocked = manuallyUnlockedLevels.includes(level);
    let statusClass = "path-status-locked";
    let statusText = "🔒";
    let statusIcon = "lock";
    let levelSub = lMeta.desc;
    let unlockBtnHtml = "";

    if (levelIndex < userLevelIndex) {
      if (isManuallyUnlocked) {
        statusClass = "path-status-placed-above";
        statusText = "⭐ " + (getTranslation(prefLang, "openAccessTrack") || "Unlocked");
        statusIcon = "unlock";
        levelSub = "Unlocked for optional practice.";
        unlockBtnHtml = `
          <button type="button" class="path-unlock-track-btn relock" data-level="${level}" title="Lock this track again">
            <i data-lucide="lock" style="width: 13px; height: 13px;"></i>
            <span>${getTranslation(prefLang, "relockTrack") || "Re-lock Track"}</span>
          </button>
        `;
      } else {
        statusClass = "path-status-placed-above";
        statusText = "⭐ " + (getTranslation(prefLang, "skillBenchmarked") || "Placed Above");
        statusIcon = "award";
        levelSub = "Placed above this tier in diagnostic testing.";
        unlockBtnHtml = `
          <button type="button" class="path-unlock-track-btn" data-level="${level}" title="Unlock this level's lessons for practice">
            <i data-lucide="unlock" style="width: 13px; height: 13px;"></i>
            <span>${getTranslation(prefLang, "unlockToPractice") || getTranslation(prefLang, "openAccessTrack") || "Unlock to Practice"}</span>
          </button>
        `;
      }
    } else if (levelIndex === userLevelIndex) {
      statusClass = "path-status-current";
      statusText = getTranslation(prefLang, "activeTierLabel") || "Active Track";
      statusIcon = "compass";
    } else {
      statusClass = "path-status-locked";
      statusText = "🔒";
      statusIcon = "lock";
    }

    html += `
      <div class="path-level-section">
        <div class="path-level-header">
          <div class="path-level-title-wrap">
            <div class="path-level-icon">${lMeta.icon}</div>
            <div>
              <h3 class="path-level-title">${lMeta.title}</h3>
              <p class="path-level-subtitle">${levelSub}</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
            <span class="path-level-status-pill ${statusClass}">
              <i data-lucide="${statusIcon}" style="width: 14px; height: 14px;"></i>
              <span>${statusText}</span>
            </span>
            ${unlockBtnHtml}
          </div>
        </div>
    `;

    // Render Skills Chapters
    skills.forEach((skill) => {
      const sMeta = skillMeta[skill] || { name: skill, icon: "book", gradient: "#6366f1", desc: "" };
      const lit = profile.literacyLevel || "preferNot";
      const unitByLiteracy = {
        neverLearned: "alphabets",
        canRecognize: "words",
        canReadSimple: "sentences",
        canReadComfort: "paragraphs",
        preferNot: "alphabets",
      };
      const unit = unitByLiteracy[lit] || "alphabets";

      let completedInSkill = 0;
      for (let i = 1; i <= 5; i++) {
        const lessonId = `${level}_${skill}_${unit}_${i}`;
        if (completedLessons.includes(lessonId)) {
          completedInSkill++;
        }
      }

      let chipText = `${completedInSkill} / 5 ${getTranslation(prefLang, "statusCompleted") || "Complete"}`;

      html += `
        <div class="path-skill-chapter">
          <div class="path-skill-header">
            <div class="path-skill-info">
              <div class="path-skill-icon-badge" style="background: ${sMeta.gradient};">
                <i data-lucide="${sMeta.icon}" style="width: 18px; height: 18px;"></i>
              </div>
              <div>
                <h4 class="path-skill-name">${sMeta.name}</h4>
                <p style="font-size: 0.78rem; color: #64748b; font-weight: 600; margin: 0;">${sMeta.desc}</p>
              </div>
            </div>
            <span class="path-skill-progress-chip">
              ${chipText}
            </span>
          </div>

          <div class="path-lesson-grid">
      `;

      // 5 Lessons in this skill
      for (let i = 1; i <= 5; i++) {
        const lessonId = `${level}_${skill}_${unit}_${i}`;
        const isCompleted = completedLessons.includes(lessonId);

        let state = "locked";
        if (levelIndex < userLevelIndex) {
          if (isCompleted) {
            state = "completed";
          } else if (isManuallyUnlocked) {
            state = "available";
          } else {
            state = "placed-above"; // locked placed-above state
          }
        } else if (levelIndex === userLevelIndex) {
          state = isCompleted ? "completed" : "available";
        } else {
          state = "locked";
        }

        const blueprint = window.CURRICULUM_BLUEPRINT?.[level]?.[skill]?.find(
          (b) => b.lessonIndex === i,
        );
        const focusTitle = blueprint ? blueprint.focus : `${getTranslation(prefLang, "stepWord") || "Lesson"} ${i}`;

        let btnLabel = getTranslation(prefLang, "startLessonBtn") || "Start Lesson";
        let btnIcon = "play";
        let topMetaHtml = `<div class="path-lesson-meta">⏱️ 5 min • +25 XP</div>`;

        if (state === "completed") {
          btnLabel = getTranslation(prefLang, "reviewLessonBtn") || "Review Lesson";
          btnIcon = "rotate-ccw";

          let localScores = {};
          try {
            localScores = JSON.parse(localStorage.getItem("akshar_lesson_scores") || "{}");
          } catch (e) { }

          // Retrieve genuine score for this lesson
          const sObj = (profile.lessonScores && profile.lessonScores[lessonId])
            || (profile.lessonScores && profile.lessonScores[`${level}_${skill}_${unit}_${i}`])
            || localScores[lessonId]
            || null;

          let scoreVal = null;
          if (typeof sObj === "number") {
            scoreVal = sObj;
          } else if (sObj && typeof sObj.accuracy === "number") {
            scoreVal = sObj.accuracy;
          } else if (sObj && typeof sObj.score === "number") {
            scoreVal = sObj.score;
          }

          if (scoreVal !== null && !isNaN(scoreVal)) {
            topMetaHtml = `
              <div class="path-lesson-score-badge" title="Last Attempt Accuracy Score">
                <i data-lucide="award" style="width: 12px; height: 12px;"></i>
                <span>Score: ${Math.round(scoreVal)}%</span>
              </div>
            `;
          } else {
            topMetaHtml = `
              <div class="path-lesson-score-badge" title="Lesson Completed">
                <i data-lucide="check-circle" style="width: 12px; height: 12px;"></i>
                <span>Completed</span>
              </div>
            `;
          }
        } else if (state === "placed-above") {
          btnLabel = "🔒 Placed Above";
          btnIcon = "lock";
          topMetaHtml = `
            <div class="path-lesson-meta" style="color: #9333ea; font-weight: 800; display: inline-flex; align-items: center; gap: 0.3rem;">
              <i data-lucide="shield-check" style="width: 13px; height: 13px;"></i>
              <span>Placed Above</span>
            </div>
          `;
        } else if (state === "locked") {
          btnLabel = "Locked";
          btnIcon = "lock";
          topMetaHtml = `<div class="path-lesson-meta">🔒 Locked</div>`;
        }

        html += `
          <div class="path-lesson-card ${state}" 
               data-level="${level}" 
               data-skill="${skill}" 
               data-unit="${unit}" 
               data-index="${i}">
            <div class="path-lesson-top">
              <div class="path-lesson-num">0${i}</div>
              ${topMetaHtml}
            </div>
            <div class="path-lesson-title">${focusTitle}</div>
            <button class="path-lesson-btn" tabindex="-1">
              <i data-lucide="${btnIcon}" style="width: 14px; height: 14px;"></i>
              <span>${btnLabel}</span>
            </button>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `
      </div>
    `;
  });

  pathContainer.innerHTML = html;

  // Hydrate Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Attach unlock / relock button listeners
  pathContainer.querySelectorAll(".path-unlock-track-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const lvl = btn.dataset.level;
      if (lvl && typeof window.toggleUnlockPlacedLevel === "function") {
        window.toggleUnlockPlacedLevel(lvl);
      }
    });
  });

  // Attach click listeners to available & completed lesson cards
  pathContainer.querySelectorAll(".path-lesson-card.available, .path-lesson-card.completed").forEach((card) => {
    card.addEventListener("click", () => {
      const { level, skill, unit, index } = card.dataset;
      window.location.href = `lesson.html?level=${level}&type=${skill}&unit=${unit}&lessonIndex=${index}`;
    });
  });

  // When a placed-above card is clicked while locked, highlight & pulse the "Unlock to Practice" button
  pathContainer.querySelectorAll(".path-lesson-card.placed-above").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const { level } = card.dataset;
      const unlockBtn = pathContainer.querySelector(`.path-unlock-track-btn[data-level="${level}"]`);
      if (unlockBtn) {
        unlockBtn.classList.remove("highlight-pulse");
        void unlockBtn.offsetWidth; // Trigger DOM reflow to restart animation
        unlockBtn.classList.add("highlight-pulse");
        unlockBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          unlockBtn.classList.remove("highlight-pulse");
        }, 2000);
      }
    });
  });

  // Fast Jump Button handler
  const jumpBtn = document.getElementById("btn-jump-next-lesson");
  if (jumpBtn) {
    jumpBtn.addEventListener("click", () => {
      const firstAvailable = pathContainer.querySelector(".path-lesson-card.available");
      if (firstAvailable) {
        firstAvailable.scrollIntoView({ behavior: "smooth", block: "center" });
        firstAvailable.style.transition = "all 0.3s ease";
        firstAvailable.style.transform = "scale(1.05)";
        setTimeout(() => {
          firstAvailable.style.transform = "";
        }, 1200);
      }
    });
  }
}

// ─── Skill Practice Cards ─────────────────────────────────────

async function renderSkillCards(profile) {
  const container = document.getElementById("skill-cards");
  if (!container) return;

  const level = profile.currentLevel || profile.assessmentLevel || "beginner";

  let html = "";
  SKILL_CONFIG.forEach((skill) => {
    html += `
      <div class="skill-card" data-skill="${skill.id}">
        <!-- Top row with 3D Icon and Level Badge -->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.25rem;">
          <div class="skill-card-icon ${skill.color}">${skill.icon}</div>
          <span class="skill-card-level-pill ${level}">${getTranslation(selectedLang, LEVEL_CONFIG[level].label) || LEVEL_CONFIG[level].fallback}</span>
        </div>

        <!-- Full-width Content Area -->
        <div class="skill-card-content" style="width: 100%; flex: 1;">
          <h4 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.2rem; font-weight: 900; color: #0f172a; margin: 0 0 0.4rem;">
            ${getTranslation(selectedLang, skill.label) || skill.fallback}
          </h4>
          <p style="font-size: 0.88rem; color: #475569; margin: 0 0 1rem; line-height: 1.45; font-weight: 500;">
            ${getTranslation(selectedLang, skill.desc) || skill.descFallback}
          </p>
          <div id="skill-prog-${skill.id}"></div>
        </div>

        <!-- Bottom Action Bar -->
        <div style="display: flex; justify-content: flex-end; width: 100%; margin-top: 1rem; border-top: 1.5px dashed #e2e8f0; padding-top: 0.75rem;">
          <span style="font-size: 0.85rem; font-weight: 800; color: #6366f1; display: inline-flex; align-items: center; gap: 0.35rem;">
            <span>Practice Now</span>
            <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
          </span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Click handlers
  container.querySelectorAll(".skill-card").forEach((card) => {
    card.addEventListener("click", () => {
      const skill = card.dataset.skill;
      // Navigate to lesson page with the skill type
      const curriculum = profile.curriculum;
      // Find first available unit for the current level
      let targetUnit = "alphabets";
      if (curriculum && curriculum[level]) {
        const units = ["alphabets", "words", "sentences", "paragraphs"];
        for (const u of units) {
          if (curriculum[level][u]?.status === "available") {
            targetUnit = u;
            break;
          }
        }
      }
      window.location.href = `lesson.html?level=${level}&unit=${targetUnit}&type=${skill}&mode=practice`;
    });
  });

  // Fetch history for mastery and last score
  try {
    const uid = profile.uid || (auth.currentUser ? auth.currentUser.uid : null);
    if (!uid) {
      throw new Error("No UID found for fetching history");
    }
    const snap = await db.collection("users").doc(uid).collection("lessonHistory").orderBy("completedAt", "desc").get();
    const history = snap.docs.map(d => d.data());

    SKILL_CONFIG.forEach((skill) => {
      const progEl = document.getElementById(`skill-prog-${skill.id}`);
      if (!progEl) return;

      const skillHistory = history.filter(h => h.type === skill.id);
      if (skillHistory.length === 0) {
        progEl.innerHTML = `<div class="skill-progress-wrap"><div class="skill-progress-text"><span>Not started yet</span></div><div class="skill-progress-track"><div class="skill-progress-fill" style="width:0%"></div></div></div>`;
      } else {
        const lastScore = typeof skillHistory[0].accuracy === 'number' ? skillHistory[0].accuracy : 0;
        const avgScore = Math.round(skillHistory.reduce((s, h) => s + (h.accuracy || 0), 0) / skillHistory.length);
        progEl.innerHTML = `<div class="skill-progress-wrap">
          <div class="skill-progress-text"><span>Mastery: ${avgScore}%</span><span>Last score: ${lastScore}%</span></div>
          <div class="skill-progress-track"><div class="skill-progress-fill" style="width:${avgScore}%;"></div></div>
        </div>`;
      }
    });
  } catch (err) {
    console.warn("Error loading skill history for progress bars:", err);
    // Render fallback empty states so it's not just blank
    SKILL_CONFIG.forEach((skill) => {
      const progEl = document.getElementById(`skill-prog-${skill.id}`);
      if (progEl) {
        progEl.innerHTML = `<div class="skill-progress-wrap"><div class="skill-progress-text"><span>Not started yet</span></div><div class="skill-progress-track"><div class="skill-progress-fill" style="width:0%"></div></div></div>`;
      }
    });
  }
}

function manageDailyQuests(profile) {
  const questContainer = document.getElementById("quest-list");
  if (!questContainer) return;

  const today = new Date().toISOString().split("T")[0];
  let quests = profile.dailyQuests || [];
  let needsSave = false;

  if (profile.questDate !== today || quests.length === 0) {
    quests = [
      {
        id: "q1",
        title: getTranslation(selectedLang, "questEarnXP") || "Earn 20 XP",
        target: 20,
        progress: 0,
        reward: 10,
        completed: false,
        type: "xp",
      },
      {
        id: "q2",
        title:
          getTranslation(selectedLang, "questPlayGame") || "Play Word Match",
        target: 1,
        progress: 0,
        reward: 15,
        completed: false,
        type: "game",
      },
      {
        id: "q3",
        title:
          getTranslation(selectedLang, "questCompleteLesson") ||
          "Complete 1 Lesson",
        target: 1,
        progress: 0,
        reward: 20,
        completed: false,
        type: "lesson",
      },
    ];
    needsSave = true;
  }

  // Render using CSS classes instead of inline styles, so stylesheet
  // rules can actually theme these (inline styles previously blocked that).
  let html = "";
  quests.forEach((q) => {
    const isDone = q.completed;
    const progressPct = Math.min((q.progress / q.target) * 100, 100);

    html += `
      <div class="quest-item ${isDone ? "quest-done" : ""}">
        <div class="quest-item-top">
          <div class="quest-item-left">
            <div class="quest-check">${isDone ? "<i data-lucide=\"check\"></i>" : ""}</div>
            <span class="quest-title">${q.id === "q1"
        ? getTranslation(selectedLang, "questEarnXP") || "Earn 20 XP"
        : q.id === "q2"
          ? getTranslation(selectedLang, "questPlayGame") ||
          "Play Word Match"
          : getTranslation(selectedLang, "questCompleteLesson") ||
          "Complete 1 Lesson"
      }</span>
          </div>
          <span class="quest-reward">+${q.reward} <i data-lucide="coins" style="width: 14px; height: 14px; vertical-align: middle;"></i></span>
        </div>
        <div class="quest-progress-track">
          <div class="quest-progress-fill" style="width: ${progressPct}%;"></div>
        </div>
      </div>
    `;
  });

  questContainer.innerHTML = html;
  if (window.lucide) lucide.createIcons();

  const coinEl = document.getElementById("coin-count");
  if (coinEl) coinEl.textContent = Number(profile.coins || 0).toLocaleString();
  const mobileCoinEl = document.getElementById("mobile-coin-count");
  if (mobileCoinEl) mobileCoinEl.textContent = Number(profile.coins || 0).toLocaleString();

  if (needsSave) {
    const user = auth.currentUser;
    if (user) {
      db.collection("users")
        .doc(user.uid)
        .update({
          dailyQuests: quests,
          questDate: today,
        })
        .catch((err) =>
          console.error("Could not save quests to database:", err),
        );
    }
  }
}
// ─── Side Panel ───────────────────────────────────────────────

function renderSidePanel(profile) {
  // 1. Time-Based Goal Logic
  const targetMins = profile.dailyTimeGoal || 15;
  // *Note: Since we don't have a real-time stopwatch yet, we are estimating minutes based on XP (e.g., 5 XP = 1 minute of practice)
  const estimatedMinsSpent = Math.floor((profile.xp || 0) / 5);

  const ringFill = document.getElementById("goal-ring-fill");
  const ringText = document.getElementById("goal-ring-text");
  const minsSpentEl = document.getElementById("daily-mins-spent");
  const minsTargetEl = document.getElementById("daily-mins-target");
  const statusText = document.getElementById("goal-status-text");

  if (ringFill && minsSpentEl) {
    minsSpentEl.textContent = estimatedMinsSpent;
    minsTargetEl.textContent = targetMins;

    let percent = Math.min(
      Math.round((estimatedMinsSpent / targetMins) * 100),
      100,
    );
    ringText.textContent = percent + "%";

    // SVG stroke-dashoffset is 100 for 0%, and 0 for 100%
    setTimeout(() => {
      ringFill.style.strokeDashoffset = 100 - percent;
    }, 300);

    if (percent >= 100) {
      statusText.innerHTML = getTranslation(selectedLang, "goalReached");
      statusText.style.color = "var(--color-success)";
    } else if (percent > 0) {
      statusText.innerHTML = getTranslation(selectedLang, "goalKeepItUp");
      statusText.style.color = "var(--color-primary)";
    }
    if (window.lucide) lucide.createIcons();
  }

  // Edit Goal Setup
  const editBtn = document.getElementById("edit-goal-btn");
  const editContainer = document.getElementById("goal-edit-container");
  const goalSelect = document.getElementById("goal-select");

  if (editBtn && editContainer && goalSelect) {
    goalSelect.value = targetMins.toString();
    if (!editBtn.dataset.listenerAttached) {
      editBtn.dataset.listenerAttached = "true";
      editBtn.addEventListener("click", () =>
        editContainer.classList.toggle("hidden"),
      );

      goalSelect.addEventListener("change", async (e) => {
        const newGoal = parseInt(e.target.value, 10);
        editContainer.classList.add("hidden");

        // Optimistic UI Update
        minsTargetEl.textContent = newGoal;
        let p = Math.min(Math.round((estimatedMinsSpent / newGoal) * 100), 100);
        ringText.textContent = p + "%";
        ringFill.style.strokeDashoffset = 100 - p;

        const user = auth.currentUser;
        if (user)
          await db
            .collection("users")
            .doc(user.uid)
            .update({ dailyTimeGoal: newGoal });
      });
    }
  }

  // 3. Word of the Day Logic
  renderWordOfTheDay(profile);
}

// ─── Announcement Banner ────────────────────────────────────────
async function renderAnnouncementBanner() {
  const banner = document.getElementById("announcement-banner");
  const textEl = document.getElementById("announcement-text");
  const dismissBtn = document.getElementById("announcement-dismiss");
  if (!banner || !textEl) return;

  try {
    const snap = await db
      .collection("announcements")
      .where("active", "==", true)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snap.empty) return;

    const doc = snap.docs[0];
    const data = doc.data();
    if (localStorage.getItem("dismissedAnnouncementId") === doc.id) return;

    textEl.textContent = data.message || "";
    banner.classList.remove("hidden");

    if (dismissBtn && !dismissBtn.dataset.listenerAttached) {
      dismissBtn.dataset.listenerAttached = "true";
      dismissBtn.addEventListener("click", () => {
        localStorage.setItem("dismissedAnnouncementId", doc.id);
        banner.classList.add("hidden");
      });
    }
  } catch (err) {
    console.warn("Could not load announcement:", err);
  }
}

// ─── Feedback Form ───────────────────────────────────────────────
function setupFeedbackForm() {
  const submitBtn = document.getElementById("feedback-submit-btn");
  const textarea = document.getElementById("feedback-message");
  const statusEl = document.getElementById("feedback-status");
  if (!submitBtn || !textarea || submitBtn.dataset.listenerAttached) return;
  submitBtn.dataset.listenerAttached = "true";

  submitBtn.addEventListener("click", async () => {
    const message = textarea.value.trim();
    if (!message) return;
    const user = auth.currentUser;
    if (!user) return;

    submitBtn.disabled = true;
    const original = submitBtn.textContent;
    submitBtn.textContent = "Sending…";

    try {
      await db.collection("feedback").add({
        uid: user.uid,
        email: user.email || "",
        message: message,
        status: "new",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      textarea.value = "";
      if (statusEl) {
        statusEl.textContent = "Thanks — your feedback was sent!";
        statusEl.classList.remove("hidden");
        setTimeout(() => statusEl.classList.add("hidden"), 4000);
      }
    } catch (err) {
      console.error("Failed to send feedback:", err);
      if (statusEl) {
        statusEl.textContent = "Something went wrong — please try again.";
        statusEl.classList.remove("hidden");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = original;
    }
  });
}

function renderWordOfTheDay(profile) {
  const targetLang = (profile && profile.targetLanguage) || (profile && profile.preferredLanguage) || "en";
  const prefLang = (profile && profile.preferredLanguage) || "en";

  const dictionary = [
    {
      word: getTranslation(targetLang, "wotd_0_word") || "Sign",
      meaning:
        getTranslation(prefLang, "wotd_0_desc") ||
        "To write your name on a document.",
    },
    {
      word: getTranslation(targetLang, "wotd_1_word") || "Deposit",
      meaning:
        getTranslation(prefLang, "wotd_1_desc") ||
        "To put money into a bank account.",
    },
    {
      word: getTranslation(targetLang, "wotd_2_word") || "Prescription",
      meaning:
        getTranslation(prefLang, "wotd_2_desc") ||
        "A doctor's written note for medicine.",
    },
    {
      word: getTranslation(targetLang, "wotd_3_word") || "Receipt",
      meaning:
        getTranslation(prefLang, "wotd_3_desc") ||
        "A piece of paper proving you paid for something.",
    },
    {
      word: getTranslation(targetLang, "wotd_4_word") || "Platform",
      meaning:
        getTranslation(prefLang, "wotd_4_desc") ||
        "The area at a station where you wait for a train.",
    },
    {
      word: getTranslation(targetLang, "wotd_5_word") || "Verify",
      meaning:
        getTranslation(prefLang, "wotd_5_desc") ||
        "To make sure something is true or accurate.",
    },
    {
      word: getTranslation(targetLang, "wotd_6_word") || "Balance",
      meaning:
        getTranslation(prefLang, "wotd_6_desc") ||
        "The amount of money left in your account.",
    },
  ];

  // Pick one based on the current day of the year
  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 0)) /
    1000 /
    60 /
    60 /
    24,
  );
  const wotd = dictionary[dayOfYear % dictionary.length];

  const wordEl = document.getElementById("wotd-word");
  const meanEl = document.getElementById("wotd-meaning");
  const listenBtn = document.getElementById("wotd-listen");

  if (wordEl) wordEl.textContent = wotd.word;
  if (meanEl) meanEl.textContent = wotd.meaning;

  if (listenBtn) {
    listenBtn.onclick = () => {
      if (typeof speakText === "function") {
        speakText(wotd.word, targetLang);
        setTimeout(() => speakText(wotd.meaning, prefLang), 1500);
      }
    };
  }
}

// ─── Dashboard Events ─────────────────────────────────────────

function setupDashboardEvents(profile) {
  // Sidebar collapse/expand + mobile drawer
  setupSidebarToggle();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logoutUser().then(() => {
        if (typeof smoothNavigateTo === "function") {
          smoothNavigateTo("login.html");
        } else {
          window.location.href = "login.html";
        }
      });
    });
  }

  const mobileLogoutBtn = document.getElementById("mobile-logout-btn");
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", () => {
      logoutUser().then(() => {
        if (typeof smoothNavigateTo === "function") {
          smoothNavigateTo("login.html");
        } else {
          window.location.href = "login.html";
        }
      });
    });
  }

  // Accessibility Toggles
  const fontBtn = document.getElementById("toggle-font-btn");
  if (fontBtn) {
    fontBtn.addEventListener("click", () => {
      document.body.classList.toggle("font-size-large");
      localStorage.setItem(
        "a11y_largeFont",
        document.body.classList.contains("font-size-large"),
      );
    });
    if (localStorage.getItem("a11y_largeFont") === "true") {
      document.body.classList.add("font-size-large");
    }
  }

  const dyslexiaBtn = document.getElementById("toggle-dyslexia-btn");
  if (dyslexiaBtn) {
    dyslexiaBtn.addEventListener("click", () => {
      document.body.classList.toggle("dyslexia-friendly");
      localStorage.setItem(
        "a11y_dyslexia",
        document.body.classList.contains("dyslexia-friendly"),
      );
    });
    if (localStorage.getItem("a11y_dyslexia") === "true") {
      document.body.classList.add("dyslexia-friendly");
    }
  }

  // Language switcher
  const langSelect = document.getElementById("dash-lang-select");
  if (langSelect) {
    langSelect.value = selectedLang;
    langSelect.addEventListener("change", function () {
      selectedLang = this.value;
      localStorage.setItem("saksharLang", selectedLang);
      applyTranslations(selectedLang);
      // Re-render dynamic content
      renderRecommendation(profile);
      renderLearningPath(profile);
      renderSkillCards(profile);
      renderSidePanel(profile);
      renderProfile(profile);
      manageDailyQuests(profile);
      initPhraseOfDay(profile);
      if (typeof initHandwriting === "function" && document.getElementById("section-handwriting") && !document.getElementById("section-handwriting").classList.contains("hidden")) {
        initHandwriting(profile);
      }
      if (window.Analysis) {
        window.Analysis.reRenderLang(profile);
      }
      if (mobileLangSelect) mobileLangSelect.value = selectedLang;
    });
  }

  const mobileLangSelect = document.getElementById("mobile-dash-lang-select");
  if (mobileLangSelect) {
    mobileLangSelect.value = selectedLang;
    mobileLangSelect.addEventListener("change", function () {
      selectedLang = this.value;
      localStorage.setItem("saksharLang", selectedLang);
      applyTranslations(selectedLang);
      renderRecommendation(profile);
      renderLearningPath(profile);
      renderSkillCards(profile);
      renderSidePanel(profile);
      renderProfile(profile);
      manageDailyQuests(profile);
      initPhraseOfDay(profile);
      if (typeof initHandwriting === "function" && document.getElementById("section-handwriting") && !document.getElementById("section-handwriting").classList.contains("hidden")) {
        initHandwriting(profile);
      }
      if (window.Analysis) {
        window.Analysis.reRenderLang(profile);
      }
      if (langSelect) langSelect.value = selectedLang;
    });
  }

  // "More" dropdown logic
  const navMoreWrap = document.getElementById("nav-more-wrap");
  const navMoreBtn = document.getElementById("nav-more-btn");
  if (navMoreBtn && navMoreWrap) {
    navMoreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navMoreWrap.classList.toggle("open");
    });
    document.addEventListener("click", () =>
      navMoreWrap.classList.remove("open"),
    );
  }

  // ── Mobile "More" sheet ──
  const mobileMoreBtn = document.getElementById("mobile-more-btn");
  const mobileMoreSheet = document.getElementById("mobile-more-sheet");
  const mobileMoreBackdrop = document.getElementById("mobile-more-backdrop");

  function closeMobileMoreSheet() {
    if (mobileMoreSheet) mobileMoreSheet.classList.remove("open");
    if (mobileMoreBackdrop) mobileMoreBackdrop.classList.remove("open");
    if (mobileMoreBtn) mobileMoreBtn.classList.remove("active");
  }

  if (mobileMoreBtn && mobileMoreSheet && mobileMoreBackdrop) {
    mobileMoreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = mobileMoreSheet.classList.toggle("open");
      mobileMoreBackdrop.classList.toggle("open", isOpen);
      mobileMoreBtn.classList.toggle("active", isOpen);
    });
    mobileMoreBackdrop.addEventListener("click", closeMobileMoreSheet);
    mobileMoreSheet.querySelectorAll(".dash-nav-item").forEach((item) => {
      item.addEventListener("click", closeMobileMoreSheet);
    });
  }

  // ── Desktop "More" dropdown ──
  const desktopMoreBtn = document.getElementById("desktop-more-btn");
  const desktopMoreMenu = document.getElementById("desktop-more-menu");

  function closeDesktopMoreMenu() {
    if (desktopMoreMenu) desktopMoreMenu.classList.add("hidden");
    if (desktopMoreBtn) desktopMoreBtn.classList.remove("active");
  }

  if (desktopMoreBtn && desktopMoreMenu) {
    desktopMoreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = desktopMoreMenu.classList.toggle("hidden");
      desktopMoreBtn.classList.toggle("active", !isHidden);
      if (!isHidden && window.lucide) lucide.createIcons();
    });
    document.addEventListener("click", (e) => {
      if (!desktopMoreMenu.contains(e.target) && e.target !== desktopMoreBtn) {
        closeDesktopMoreMenu();
      }
    });
    desktopMoreMenu.querySelectorAll(".dash-nav-item").forEach((item) => {
      item.addEventListener("click", closeDesktopMoreMenu);
    });
  }

  // ── Main navigation tabs ──
  const MORE_SECTIONS = ["leagues", "leaderboard", "studygroups", "games", "chat", "analysis", "feedback"];

  document.querySelectorAll(".dash-nav-item").forEach((navItem) => {
    navItem.addEventListener("click", () => {
      const section = navItem.dataset.section;
      if (!section) return;

      document
        .querySelectorAll(".dash-nav-item")
        .forEach((n) => n.classList.remove("active"));
      document
        .querySelectorAll(`.dash-nav-item[data-section="${section}"]`)
        .forEach((n) => n.classList.add("active"));

      // Highlight "More" tab button when inside any of its child sections
      const desktopMoreBtn = document.getElementById("desktop-more-btn");
      const mobileMoreBtn = document.getElementById("mobile-more-btn");
      if (MORE_SECTIONS.includes(section)) {
        if (desktopMoreBtn) desktopMoreBtn.classList.add("active");
        if (mobileMoreBtn) mobileMoreBtn.classList.add("active");
      } else {
        if (desktopMoreBtn) desktopMoreBtn.classList.remove("active");
        if (mobileMoreBtn) mobileMoreBtn.classList.remove("active");
      }

      if (navMoreWrap) navMoreWrap.classList.remove("open");

      // Show/hide sections
      document
        .querySelectorAll(".dash-main-section")
        .forEach((s) => s.classList.add("hidden"));
      const target = document.getElementById(`section-${section}`);
      if (target) target.classList.remove("hidden");

      document.body.dataset.activeSection = section;

      // Lazy-init merged sub-apps on first visit
      if (section === "chat" && window.ChatSimulator) {
        window.ChatSimulator.init(profile);
      }
      if (section === "games" && window.GamesHub) {
        window.GamesHub.init(profile);
      }
      if (section === "analysis" && window.Analysis) {
        window.Analysis.init(profile);
      }
      if (section === "leaderboard") {
        initLeaderboard(profile);
      }
      if (section === "handwriting" && typeof initHandwriting === "function") {
        initHandwriting(profile);
      }
      if (section === "leagues" && typeof initLeagues === "function") {
        initLeagues(profile);
      }
      if (section === "studygroups" && typeof initStudyGroups === "function") {
        initStudyGroups(profile);
      }
      if (section === "profile") {
        renderProfile(profile);
      }
    });
  });

  // On-demand Weekly Recap click handler
  const recapBtn = document.getElementById("nav-weekly-recap-btn");
  if (recapBtn) {
    recapBtn.addEventListener("click", () => {
      if (typeof showWeeklyRecapModal === "function") {
        showWeeklyRecapModal(profile);
      }
    });
  }

  // On-demand Shareable Card click handler
  const shareCardBtn = document.getElementById("nav-share-card-btn");
  if (shareCardBtn) {
    shareCardBtn.addEventListener("click", () => {
      if (typeof openShareableCardModal === "function") {
        openShareableCardModal(profile);
      }
    });
  }

  // Silent background snapshot check on week transition (no popups)
  if (typeof checkAndShowWeeklyRecap === "function") {
    checkAndShowWeeklyRecap(profile);
  }

  // ── Learn sub-tabs (My Results ↔ Learning Path) ──
  document.querySelectorAll(".learn-sub-tab").forEach((subTab) => {
    subTab.addEventListener("click", () => {
      const viewId = subTab.dataset.view;

      // Update active state
      document.querySelectorAll(".learn-sub-tab").forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      subTab.classList.add("active");
      subTab.setAttribute("aria-selected", "true");

      // Show / hide sub-views
      document
        .querySelectorAll(".learn-sub-view")
        .forEach((v) => v.classList.add("hidden"));
      const target = document.getElementById(viewId);
      if (target) target.classList.remove("hidden");

      // If switching to Learning Path, trigger a re-render so the tree is fresh
      if (viewId === "view-path") {
        renderLearningPath(profile);
      }
      // If switching to Units tab, render the unit-based path (isolated from above)
      else if (viewId === "view-units") {
        if (typeof initUnitsTab === "function") initUnitsTab(profile);
      }

      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }
    });
  });

  // Profile Edit Events
  const editBtn = document.getElementById("edit-profile-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  const editForm = document.getElementById("edit-profile-form");
  const statsContainer = document.getElementById("profile-stats-container");

  if (editBtn && cancelBtn && editForm) {
    editBtn.addEventListener("click", () => {
      editForm.classList.remove("hidden");
      if (statsContainer) statsContainer.classList.add("hidden");
      editBtn.classList.add("hidden");
    });

    cancelBtn.addEventListener("click", () => {
      editForm.classList.add("hidden");
      if (statsContainer) statsContainer.classList.remove("hidden");
      editBtn.classList.remove("hidden");
    });

    editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const updatedData = {
        fullName: document.getElementById("edit-fullname").value,
        preferredLanguage: document.getElementById("edit-language").value,
        targetLanguage: document.getElementById("edit-target-language").value,
        ageGroup: document.getElementById("edit-age").value,
        literacyLevel: document.getElementById("edit-literacy").value,
      };

      const saveBtn = document.getElementById("save-profile-btn");
      const originalText = saveBtn.textContent;
      saveBtn.textContent =
        getTranslation(selectedLang, "savingText") || "Saving...";
      saveBtn.disabled = true;

      const user = auth.currentUser;
      if (user) {
        updateUserProfile(user.uid, updatedData)
          .then(() => {
            // Update local profile and re-render
            Object.assign(profile, updatedData);

            // If language changed, update globally
            if (updatedData.preferredLanguage !== selectedLang) {
              selectedLang = updatedData.preferredLanguage;
              localStorage.setItem("saksharLang", selectedLang);
              applyTranslations(selectedLang);
            }

            renderTopBar(profile);
            renderProfile(profile);

            saveBtn.textContent =
              getTranslation(selectedLang, "savedText") || "Saved!";
            setTimeout(() => {
              saveBtn.textContent = originalText;
              saveBtn.disabled = false;
              cancelBtn.click();
            }, 1000);
          })
          .catch((err) => {
            console.error("Error updating profile:", err);
            saveBtn.textContent = "Error";
            setTimeout(() => {
              saveBtn.textContent = originalText;
              saveBtn.disabled = false;
            }, 2000);
          });
      }
    });
  }
}

// ─── Profile & Side Panel Rendering ───────────────────────────

function renderProfile(profile) {
  if (!profile) return;
  window.currentProfile = profile;
  const prefLang = profile.preferredLanguage || (typeof selectedLang !== "undefined" ? selectedLang : "en") || "en";

  // Language mapping
  const LANG_NAMES = {
    en: "English",
    hi: "हिन्दी (Hindi)",
    ta: "தமிழ் (Tamil)",
    te: "తెలుగు (Telugu)",
    kn: "ಕನ್ನಡ (Kannada)",
    bn: "বাংলা (Bengali)",
    mr: "मराठी (Marathi)"
  };

  const LIT_LABELS = {
    neverLearned: "Baseline: Beginner",
    canRecognize: "Baseline: Letters",
    canReadSimple: "Baseline: Sentences",
    canReadComfort: "Baseline: Fluent Reader",
    preferNot: "Baseline: Learner"
  };

  const currentLevelKey = profile.currentLevel || profile.assessmentLevel || "beginner";
  const levelConfig = LEVEL_CONFIG[currentLevelKey] || LEVEL_CONFIG.beginner;
  const levelLabel = getTranslation(prefLang, levelConfig.label) || levelConfig.fallback;

  // 1. Profile Name, Avatar & Email
  const profileNameEl = document.getElementById("profile-name");
  if (profileNameEl) {
    profileNameEl.innerHTML = `
      <span>${profile.fullName || "Learner"}</span>
      <span style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; font-size: 0.75rem; font-weight: 800; padding: 0.28rem 0.85rem; border-radius: 9999px; vertical-align: middle; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(99,102,241,0.3); display: inline-flex; align-items: center; gap: 0.3rem;">
        <i data-lucide="award" style="width: 13px; height: 13px;"></i> ⭐ ${levelLabel}
      </span>
    `;
  }

  const user = auth.currentUser;
  const emailText = user ? (user.email || profile.email || "") : (profile.email || "");
  const emailValEl = document.getElementById("profile-email-val");
  if (emailValEl) {
    emailValEl.textContent = emailText;
  } else {
    const emailEl = document.getElementById("profile-email");
    if (emailEl) emailEl.textContent = emailText;
  }

  const avatarEl = document.getElementById("profile-avatar");
  if (avatarEl) {
    avatarEl.textContent = (profile.fullName || "U").charAt(0).toUpperCase();
  }

  // 2. Profile Tags Strip
  const nativePill = document.getElementById("profile-native-lang-pill");
  if (nativePill) {
    const natName = LANG_NAMES[profile.preferredLanguage || "en"] || "English";
    const prefix = getTranslation(prefLang, "profileNativePrefix") || "Native:";
    nativePill.innerHTML = `<i data-lucide="globe"></i><span>${prefix} ${natName}</span>`;
  }

  const targetPill = document.getElementById("profile-target-lang-pill");
  if (targetPill) {
    const tgtName = LANG_NAMES[profile.targetLanguage || profile.preferredLanguage || "en"] || "English";
    const prefix = getTranslation(prefLang, "profileLearningPrefix") || "Learning:";
    targetPill.innerHTML = `<i data-lucide="sparkles"></i><span>${prefix} ${tgtName}</span>`;
  }

  const agePill = document.getElementById("profile-age-pill");
  if (agePill) {
    const ageVal = profile.ageGroup || "18–25";
    const prefix = getTranslation(prefLang, "profileAgePrefix") || "Age:";
    agePill.innerHTML = `<i data-lucide="user"></i><span>${prefix} ${ageVal}</span>`;
  }

  // 3. Edit Form Fields
  const editFullName = document.getElementById("edit-fullname");
  if (editFullName) editFullName.value = profile.fullName || "";

  const editLang = document.getElementById("edit-language");
  if (editLang) editLang.value = profile.preferredLanguage || "en";

  const editTgtLang = document.getElementById("edit-target-language");
  if (editTgtLang) editTgtLang.value = profile.targetLanguage || profile.preferredLanguage || "en";

  const editAge = document.getElementById("edit-age");
  if (editAge) editAge.value = profile.ageGroup || "26-40";

  const editLit = document.getElementById("edit-literacy");
  if (editLit) editLit.value = profile.literacyLevel || "canRecognize";

  // 4. Level Progression Calculation
  const totalXp = profile.xp || 0;
  let currentLevelTitle = getTranslation(prefLang, "profileLevel1Title") || "Level 1: Beginner Explorer";
  let nextLevelTitle = getTranslation(prefLang, "profileLevel2Title") || "Level 2: Apprentice Scholar";
  let minTierXp = 0;
  let maxTierXp = 150;

  if (totalXp >= 1500) {
    currentLevelTitle = getTranslation(prefLang, "profileLevel5Title") || "Level 5: Grandmaster of AksharGyan";
    nextLevelTitle = "Max Level Reached! 👑";
    minTierXp = 1500;
    maxTierXp = 3000;
  } else if (totalXp >= 800) {
    currentLevelTitle = getTranslation(prefLang, "profileLevel4Title") || "Level 4: Master Polyglot";
    nextLevelTitle = getTranslation(prefLang, "profileLevel5Title") || "Level 5: Grandmaster of AksharGyan";
    minTierXp = 800;
    maxTierXp = 1500;
  } else if (totalXp >= 400) {
    currentLevelTitle = getTranslation(prefLang, "profileLevel3Title") || "Level 3: Fluent Scholar";
    nextLevelTitle = getTranslation(prefLang, "profileLevel4Title") || "Level 4: Master Polyglot";
    minTierXp = 400;
    maxTierXp = 800;
  } else if (totalXp >= 150) {
    currentLevelTitle = getTranslation(prefLang, "profileLevel2Title") || "Level 2: Apprentice Wordsmith";
    nextLevelTitle = getTranslation(prefLang, "profileLevel3Title") || "Level 3: Fluent Scholar";
    minTierXp = 150;
    maxTierXp = 400;
  }

  const levelProgressPct = Math.min(100, Math.max(8, Math.round(((totalXp - minTierXp) / (maxTierXp - minTierXp)) * 100)));
  const xpNeeded = Math.max(0, maxTierXp - totalXp);

  const levelTitleEl = document.getElementById("profile-level-title");
  if (levelTitleEl) levelTitleEl.textContent = currentLevelTitle;

  const nextLevelEl = document.getElementById("profile-next-level-title");
  if (nextLevelEl) nextLevelEl.textContent = nextLevelTitle;

  const levelFillEl = document.getElementById("profile-level-fill");
  if (levelFillEl) levelFillEl.style.width = `${levelProgressPct}%`;

  const xpProgressTextEl = document.getElementById("profile-xp-progress-text");
  if (xpProgressTextEl) {
    const progressTempl = getTranslation(prefLang, "xpEarnedToNextTier") || "{xp} XP earned ({pct}% to next tier)";
    xpProgressTextEl.innerHTML = `<strong>${totalXp} XP</strong> ` + progressTempl.replace("{xp}", "").replace("{pct}", levelProgressPct).trim();
  }

  const xpNeededTextEl = document.getElementById("profile-xp-needed-text");
  if (xpNeededTextEl) {
    if (totalXp >= 1500) {
      xpNeededTextEl.textContent = getTranslation(prefLang, "topTierMasterStatus") || "You've reached top tier literacy master status! 🌟";
    } else {
      const neededTempl = getTranslation(prefLang, "xpToReachNextLevel") || "{xp} XP to reach {level}! Keep practicing daily. 🚀";
      xpNeededTextEl.textContent = neededTempl.replace("{xp}", xpNeeded).replace("{level}", nextLevelTitle);
    }
  }

  // 5. Populate 6 Stats Command Matrix
  const streakEl = document.getElementById("strip-streak");
  if (streakEl) streakEl.textContent = profile.streak || 0;

  const streakSubtext = document.getElementById("profile-streak-subtext");
  if (streakSubtext) {
    streakSubtext.textContent = (profile.streak || 0) > 0 ? (getTranslation(prefLang, "hotStreakSubtext") || "🔥 Hot Streak") : (getTranslation(prefLang, "startStreakSubtext") || "Start your streak today");
  }

  const xpEl = document.getElementById("strip-xp");
  if (xpEl) xpEl.textContent = totalXp;

  const completedLessons = profile.completedLessons || [];
  const lessonsEl = document.getElementById("strip-lessons");
  if (lessonsEl) lessonsEl.textContent = completedLessons.length;

  const earnedBadges = profile.badgesEarned || [];
  const badgesEl = document.getElementById("strip-badges");
  if (badgesEl) badgesEl.textContent = earnedBadges.length;

  const coinsEl = document.getElementById("strip-coins");
  if (coinsEl) {
    coinsEl.textContent = profile.coins !== undefined ? profile.coins : (profile.gems !== undefined ? profile.gems : 25);
  }

  const accuracyEl = document.getElementById("strip-accuracy");
  if (accuracyEl) {
    accuracyEl.textContent = profile.assessmentScore ? `${profile.assessmentScore}%` : "95%";
  }

  // 6. AI Smart Tutor Insights
  const strengthTextEl = document.getElementById("ai-strength-text");
  const focusTextEl = document.getElementById("ai-focus-text");
  const feedbackTextEl = document.getElementById("ai-feedback-text");

  if (profile.geminiAnalysis && profile.geminiAnalysis.learningPlan) {
    if (strengthTextEl) strengthTextEl.textContent = "AI Diagnosed Strength: " + (profile.geminiAnalysis.strongCategory || "Phonics & Recognition");
    if (focusTextEl) focusTextEl.textContent = "Target Area: " + (profile.geminiAnalysis.focusArea || "Daily Practice");
    if (feedbackTextEl) feedbackTextEl.textContent = profile.geminiAnalysis.summary || profile.geminiAnalysis.learningPlan;
  } else {
    if (currentLevelKey === "beginner") {
      if (strengthTextEl) strengthTextEl.textContent = "Phonetic Letter Recognition";
      if (focusTextEl) focusTextEl.textContent = "Recommended Focus: Alphabet Unit 1 & Sound Match";
      if (feedbackTextEl) feedbackTextEl.textContent = "Solid foundational progress! Focus on interactive Alphabet sound matching and tracing to build effortless letter-to-sound recognition.";
    } else if (currentLevelKey === "intermediate") {
      if (strengthTextEl) strengthTextEl.textContent = "Everyday Word Comprehension";
      if (focusTextEl) focusTextEl.textContent = "Recommended Focus: Real-World Scenarios & Phrases";
      if (feedbackTextEl) feedbackTextEl.textContent = "Great vocabulary retention! You are well-equipped to practice chat dialogues, daily conversation replies, and life-skill reading.";
    } else {
      if (strengthTextEl) strengthTextEl.textContent = "Advanced Reading & Sentence Synthesis";
      if (focusTextEl) focusTextEl.textContent = "Recommended Focus: Speed Challenges & Life Skills";
      if (feedbackTextEl) feedbackTextEl.textContent = "Exceptional reading fluency! Keep mastering handwriting speed drills, complex medicine labels, and speed word match puzzles.";
    }
  }

  // Also update side calendar if present
  const calendar = document.getElementById("streak-calendar");
  if (calendar) {
    let calHtml = "";
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const isPracticed = (profile.practiceDays || []).includes(dateStr);
      let dayName = "D";
      try {
        dayName = d.toLocaleDateString(selectedLang || "en", { weekday: "narrow" });
      } catch (e) {
        dayName = d.toLocaleDateString("en", { weekday: "narrow" });
      }
      calHtml += `<div class="calendar-day ${isPracticed ? "practiced" : ""}" title="${dateStr}">
        ${dayName}
      </div>`;
    }
    calendar.innerHTML = calHtml;
  }

  // 7. Account & Details Table
  const acctNative = document.getElementById("account-native-lang-val");
  if (acctNative) acctNative.textContent = LANG_NAMES[profile.preferredLanguage || "en"] || "English";

  const acctTgt = document.getElementById("account-target-lang-val");
  if (acctTgt) acctTgt.textContent = LANG_NAMES[profile.targetLanguage || profile.preferredLanguage || "en"] || "English";

  const acctAge = document.getElementById("account-age-val");
  if (acctAge) acctAge.textContent = profile.ageGroup || "18–25";

  // 10. Refined Badge Shelf System & Interactive Filtering
  const badgeShelf = document.getElementById("badge-shelf");
  if (badgeShelf) {
    const allBadges = [
      {
        id: "assessmentDone",
        icon: '<i data-lucide="target"></i>',
        label: getTranslation(selectedLang, "badgeEvaluatedLabel") || "Evaluated",
        desc: getTranslation(selectedLang, "badgeEvaluatedDesc") || "Completed initial assessment",
      },
      {
        id: "firstLesson",
        icon: '<i data-lucide="sprout"></i>',
        label: getTranslation(selectedLang, "badgeFirstStepsLabel") || "First Steps",
        desc: getTranslation(selectedLang, "badgeFirstStepsDesc") || "Completed your first lesson",
      },
      {
        id: "alphabetMaster",
        icon: '<i data-lucide="type"></i>',
        label: getTranslation(selectedLang, "badgeLetterKingLabel") || "Letter King",
        desc: getTranslation(selectedLang, "badgeLetterKingDesc") || "Mastered the alphabets unit",
      },
      {
        id: "beginnerGraduate",
        icon: '<i data-lucide="medal"></i>',
        label: getTranslation(selectedLang, "badgeBeginnerGradLabel") || "Beginner Graduate",
        desc: getTranslation(selectedLang, "badgeBeginnerGradDesc") || "Mastered all beginner skills",
      },
      {
        id: "intermediateGraduate",
        icon: '<i data-lucide="medal"></i>',
        label: getTranslation(selectedLang, "badgeIntermediateGradLabel") || "Intermediate Graduate",
        desc: getTranslation(selectedLang, "badgeIntermediateGradDesc") || "Mastered all intermediate skills",
      },
      {
        id: "advancedGraduate",
        icon: '<i data-lucide="medal"></i>',
        label: getTranslation(selectedLang, "badgeAdvancedGradLabel") || "Advanced Graduate",
        desc: getTranslation(selectedLang, "badgeAdvancedGradDesc") || "Mastered all advanced skills",
      },
      {
        id: "streak5",
        icon: '<i data-lucide="flame"></i>',
        label: getTranslation(selectedLang, "badgeStreak5Label") || "5-Day Streak",
        desc: getTranslation(selectedLang, "badgeStreak5Desc") || "Practiced 5 days in a row",
      },
      {
        id: "streak10",
        icon: '<i data-lucide="flame"></i>',
        label: getTranslation(selectedLang, "badgeStreak10Label") || "10-Day Streak",
        desc: getTranslation(selectedLang, "badgeStreak10Desc") || "Practiced 10 days in a row",
      },
      {
        id: "streak30",
        icon: '<i data-lucide="flame"></i>',
        label: getTranslation(selectedLang, "badgeStreak30Label") || "30-Day Streak",
        desc: getTranslation(selectedLang, "badgeStreak30Desc") || "Practiced 30 days in a row",
      },
      {
        id: "gameWinner",
        icon: '<i data-lucide="gamepad-2"></i>',
        label: getTranslation(selectedLang, "badgeMatchMasterLabel") || "Match Master",
        desc: getTranslation(selectedLang, "badgeMatchMasterDesc") || "Won a Word Match game",
      },
      {
        id: "gameChampion",
        icon: '<i data-lucide="trophy"></i>',
        label: getTranslation(selectedLang, "badgeGameChampionLabel") || "Game Champion",
        desc: getTranslation(selectedLang, "badgeGameChampionDesc") || "Won 10 games",
      },
    ];

    const earned = profile.badgesEarned || [];

    const badgeSummary = document.getElementById("badge-summary");
    if (badgeSummary) {
      badgeSummary.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>${earned.length} of ${allBadges.length} badges unlocked</span>
      `;
    }

    badgeShelf.innerHTML = allBadges
      .map((b) => {
        const isEarned = earned.includes(b.id);
        const tooltip = isEarned ? b.label : `Locked: ${b.desc}`;
        return `
        <div class="badge-card-item ${isEarned ? "earned" : "locked"}" title="${tooltip}" data-badge-id="${b.id}">
          <div class="badge-icon-circle">${b.icon}</div>
          ${!isEarned ? '<div class="badge-lock-overlay"><i data-lucide="lock" class="inline-icon"></i></div>' : ""}
          <div class="badge-card-label" style="font-weight: 800; font-size: 0.82rem; color: #0f172a;">${b.label}</div>
        </div>
      `;
      })
      .join("");

    badgeShelf.querySelectorAll(".badge-card-item.earned").forEach((item) => {
      item.addEventListener("mouseenter", () => {
        const iconCircle = item.querySelector(".badge-icon-circle");
        if (iconCircle) iconCircle.style.transform = "scale(1.12) translateY(-3px)";
      });
      item.addEventListener("mouseleave", () => {
        const iconCircle = item.querySelector(".badge-icon-circle");
        if (iconCircle) iconCircle.style.transform = "scale(1) translateY(0)";
      });
    });
  }

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}
// ─── Virtual Shop Engine ───────────────────────────────────────

const SHOP_CATALOG = [
  {
    id: "freeze",
    type: "consumable",
    icon: "<i data-lucide=\"snowflake\"></i>",
    title: "Streak Freeze",
    desc: "Miss a day of practice without losing your streak! Protects your progress.",
    price: 50,
  },
  {
    id: "theme_emerald",
    type: "theme",
    icon: "<i data-lucide=\"tree-pine\"></i>",
    title: "Emerald Theme",
    desc: "A calming green color layout for your dashboard.",
    price: 100,
    color: "#10b981",
  },
  {
    id: "theme_sunset",
    type: "theme",
    icon: "<i data-lucide=\"sun\"></i>",
    title: "Sunset Theme",
    desc: "A warm, energetic orange layout for your dashboard.",
    price: 100,
    color: "#f59e0b",
  },
  {
    id: "theme_rose",
    type: "theme",
    icon: "<i data-lucide=\"gem\"></i>",
    title: "Ruby Theme",
    desc: "A bold, beautiful red layout for your dashboard.",
    price: 100,
    color: "#e11d48",
  },
  // ── Premium Themes ──
  {
    id: "theme_ocean",
    type: "theme",
    icon: '<i data-lucide="waves"></i>',
    title: "Ocean Theme",
    desc: "Dive into a serene deep-sea world with calming cyan waves and floating bubbles.",
    price: 200,
    color: "#0891B2",
  },
  {
    id: "theme_amethyst",
    type: "theme",
    icon: '<i data-lucide="sparkles"></i>',
    title: "Amethyst Theme",
    desc: "A magical purple galaxy with twinkling stars, golden crystals, and aurora lights.",
    price: 200,
    color: "#7C3AED",
  },

];

// Holds the ONE live copy of the user's profile that the whole dashboard
// works from. setupShop() receives it from initDashboard() and every
// shop function below reads/writes through THIS variable — never a
// separate global — so we never act on stale data.
let shopUserProfile = null;

function setupShop(profile) {
  shopUserProfile = profile; // keep a live reference, not a copy

  const shopBtn = document.getElementById("open-shop-btn");
  const mobileShopBtn = document.getElementById("mobile-open-shop-btn");
  const closeBtn = document.getElementById("close-shop-btn");
  const shopModal = document.getElementById("shop-modal");

  if (typeof applyTheme === "function") {
    applyTheme(profile.activeTheme || "default");
  }

  function openShop() {
    renderShopItems(shopUserProfile);
    document.getElementById("shop-balance").textContent =
      shopUserProfile.coins || 0;
    shopModal.classList.remove("hidden");
  }

  if (shopBtn) shopBtn.addEventListener("click", openShop);
  if (mobileShopBtn) mobileShopBtn.addEventListener("click", openShop);
  if (closeBtn && shopModal) {
    closeBtn.addEventListener("click", () => shopModal.classList.add("hidden"));
    shopModal.addEventListener("click", (e) => {
      if (e.target === shopModal) shopModal.classList.add("hidden");
    });
  }
}

function renderShopItems(profile) {
  const grid = document.getElementById("shop-items-grid");
  grid.innerHTML = "";

  const balance = profile.coins || 0;
  const inventory = profile.inventory || [];
  const activeTheme = profile.activeTheme || "default";

  SHOP_CATALOG.forEach((item) => {
    const isOwned = inventory.includes(item.id);
    const isEquipped = activeTheme === item.id;
    const canAfford = balance >= item.price;

    let btnHtml = "";

    if (item.type === "theme") {
      if (isEquipped) {
        btnHtml = `<button class="shop-buy-btn equipped" disabled>Equipped</button>`;
      } else if (isOwned) {
        btnHtml = `<button class="shop-buy-btn" onclick="equipItem('${item.id}')" style="background:#6c63ff;">Equip</button>`;
      } else {
        btnHtml = `<button class="shop-buy-btn" ${!canAfford ? "disabled" : ""} onclick="buyItem('${item.id}', ${item.price})">${item.price} <i data-lucide="coins" class="inline-icon"></i></button>`;
      }
    } else if (item.type === "consumable") {
      const ownedCount = profile.streakFreezes || 0;
      if (ownedCount > 0) {
        btnHtml = `<div style="text-align: right;"><span style="font-size:0.8rem;color:#64748b;">Owned: ${ownedCount}</span><br><button class="shop-buy-btn" ${!canAfford ? "disabled" : ""} onclick="buyItem('${item.id}', ${item.price})">${item.price} <i data-lucide="coins" class="inline-icon"></i></button></div>`;
      } else {
        btnHtml = `<button class="shop-buy-btn" ${!canAfford ? "disabled" : ""} onclick="buyItem('${item.id}', ${item.price})">${item.price} <i data-lucide="coins" class="inline-icon"></i></button>`;
      }
    }

    grid.innerHTML += `
      <div class="shop-item">
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-info">
          <h4 class="shop-item-title">${item.title}</h4>
          <p class="shop-item-desc">${item.desc}</p>
        </div>
        <div class="shop-item-action">
          ${btnHtml}
        </div>
      </div>
    `;
  });
  if (window.lucide) lucide.createIcons();
}

/**
 * buyItem(itemId, price)
 *
 * FIXED: no longer references an undefined global. Reads/writes through
 * shopUserProfile (the live profile), and — critically — writes the
 * Firestore change with FieldValue.increment(-price) instead of an
 * absolute `coins: newValue`. This means a purchase can NEVER stomp over
 * coins earned elsewhere (quests, chat, games) between page loads,
 * because it's a relative change, not a snapshot overwrite.
 */
async function buyItem(itemId, price) {
  const user = auth.currentUser;
  if (!user || !shopUserProfile) return;
  if ((shopUserProfile.coins || 0) < price) return; // not enough coins

  const itemDef = SHOP_CATALOG.find((i) => i.id === itemId);
  if (!itemDef) return;

  // Optimistic local update (for instant UI feedback)
  shopUserProfile.coins = (shopUserProfile.coins || 0) - price;
  document.getElementById("shop-balance").textContent = shopUserProfile.coins;
  const coinEl = document.getElementById("coin-count");
  if (coinEl) coinEl.textContent = shopUserProfile.coins;

  // Build a RELATIVE Firestore update — never an absolute value for coins.
  const updateData = {
    coins: firebase.firestore.FieldValue.increment(-price),
  };

  if (itemDef.type === "theme") {
    shopUserProfile.inventory = shopUserProfile.inventory || [];
    if (!shopUserProfile.inventory.includes(itemId)) {
      shopUserProfile.inventory.push(itemId);
    }
    updateData.inventory = firebase.firestore.FieldValue.arrayUnion(itemId);
  } else if (itemId === "freeze") {
    shopUserProfile.streakFreezes = (shopUserProfile.streakFreezes || 0) + 1;
    updateData.streakFreezes = firebase.firestore.FieldValue.increment(1);
  }

  try {
    await db.collection("users").doc(user.uid).update(updateData);
    renderShopItems(shopUserProfile);
  } catch (e) {
    console.error("Purchase failed", e);
    // Roll back the optimistic UI change since the write failed
    shopUserProfile.coins += price;
    if (coinEl) coinEl.textContent = shopUserProfile.coins;
    document.getElementById("shop-balance").textContent = shopUserProfile.coins;
  }
}

async function equipItem(itemId) {
  const user = auth.currentUser;
  if (!user || !shopUserProfile) return;

  shopUserProfile.activeTheme = itemId;
  applyTheme(itemId);
  renderShopItems(shopUserProfile);

  try {
    await db.collection("users").doc(user.uid).update({ activeTheme: itemId });
  } catch (e) {
    console.error("Equip failed", e);
  }
}

// ─── Sidebar Icon-Rail Toggle ──────────────────────────────────
// Purely additive: desktop collapse/expand + mobile drawer.
// Does NOT modify any existing event handlers or logic.
function setupSidebarToggle() {
  const body = document.body;
  const collapseBtn = document.getElementById("sidebar-collapse-btn");
  const menuBtn = document.getElementById("mobile-menu-btn");
  const backdrop = document.getElementById("sidebar-backdrop");
  const avatarSlot = document.querySelector(".mobile-topbar-avatar-slot");
  const sidebar = document.querySelector(".dash-sidebar");

  // Clear legacy sidebar collapsed state if present
  body.classList.remove("sidebar-collapsed");
  localStorage.removeItem("sidebar_collapsed");

  if (collapseBtn) {
    collapseBtn.addEventListener("click", function () {
      if (window.innerWidth <= 900) {
        closeDrawer();
      } else {
        const isCollapsed = body.classList.toggle("sidebar-collapsed");
        localStorage.setItem("sidebar_collapsed", isCollapsed);
        collapseBtn.setAttribute(
          "aria-label",
          isCollapsed ? "Expand sidebar" : "Collapse sidebar",
        );
      }
    });
    // Set initial aria-label
    if (body.classList.contains("sidebar-collapsed")) {
      collapseBtn.setAttribute("aria-label", "Expand sidebar");
    }
  }

  // ── Mobile: drawer open / close ──
  function openDrawer() {
    body.classList.add("sidebar-drawer-open");
    if (sidebar) sidebar.focus();
  }

  function closeDrawer() {
    body.classList.remove("sidebar-drawer-open");
    if (menuBtn) menuBtn.focus();
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", openDrawer);
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeDrawer);
  }

  // Close drawer when a nav item is clicked (in addition to its existing handler)
  document.querySelectorAll(".dash-nav-item").forEach(function (item) {
    item.addEventListener("click", function () {
      if (body.classList.contains("sidebar-drawer-open")) {
        closeDrawer();
      }
    });
  });

  // ── Avatar: single source of truth ──
  // On mobile, move #user-avatar into the topbar slot.
  // On desktop, keep it in .sidebar-user.
  var mobileQuery = window.matchMedia("(max-width: 900px)");

  function placeAvatar(mq) {
    var avatar = document.getElementById("user-avatar");
    if (!avatar) return;
    var sidebarUser = document.querySelector(".sidebar-user");

    if (mq.matches && avatarSlot) {
      // Mobile: move avatar to topbar slot
      avatarSlot.appendChild(avatar);
    } else if (sidebarUser) {
      // Desktop: move avatar back to sidebar-user (prepend so it's before user-info)
      sidebarUser.prepend(avatar);
    }
  }

  placeAvatar(mobileQuery);
  mobileQuery.addEventListener("change", placeAvatar);

  // Re-initialize Lucide icons if loaded (they may have been added dynamically)
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ─── Phrase of the Day Logic ──────────────────────────────
const DAILY_PHRASES = [
  "How much does this cost?",
  "Where is the nearest hospital?",
  "I would like to open a bank account.",
  "Can you help me with this form?",
  "What time does the bus arrive?",
  "I need to buy some groceries.",
  "Could you please repeat that?",
  "Is there a pharmacy nearby?",
  "How do I get to the train station?",
  "Thank you for your help.",
];

function initPhraseOfDay(profile) {
  const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_PHRASES.length;
  const todayPhrase = DAILY_PHRASES[dayIndex];

  const targetLang = profile.targetLanguage || profile.preferredLanguage || "en";
  const prefLang = profile.preferredLanguage || "en";

  const fetchTarget = targetLang === "en" ? Promise.resolve(todayPhrase) :
    fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(todayPhrase)}`)
      .then((r) => r.json())
      .then((data) => data[0][0][0])
      .catch(() => todayPhrase);

  const fetchPref = prefLang === "en" ? Promise.resolve(todayPhrase) :
    fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${prefLang}&dt=t&q=${encodeURIComponent(todayPhrase)}`)
      .then((r) => r.json())
      .then((data) => data[0][0][0])
      .catch(() => todayPhrase);

  Promise.all([fetchTarget, fetchPref]).then(([translatedTarget, translatedPref]) => {
    const textEl = document.getElementById("phrase-of-day-text");
    if (textEl) textEl.textContent = translatedTarget;

    const trEl = document.getElementById("phrase-of-day-translation");
    if (trEl) {
      if (targetLang === prefLang && targetLang !== "en") {
        trEl.textContent = getTranslation(prefLang, "phraseOfDayTitle") || "Practice speaking this phrase!";
      } else if (targetLang === "en" && prefLang === "en") {
        trEl.textContent = "Practice speaking this phrase!";
      } else {
        trEl.textContent = translatedPref;
      }
    }

    const listenBtn = document.getElementById("phrase-listen-btn");
    const speakBtn = document.getElementById("phrase-speak-btn");
    const feedbackEl = document.getElementById("phrase-feedback");

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    let isAlreadyCompleted =
      profile.phraseCompletedOn === todayStr ||
      localStorage.getItem("phraseCompletedOn") === todayStr;

    if (isAlreadyCompleted && speakBtn) {
      speakBtn.innerHTML = "<i data-lucide='check'></i> <span>Completed</span>";
      speakBtn.classList.add("completed");
      speakBtn.disabled = true;
      if (window.lucide) lucide.createIcons();
    }

    if (listenBtn) {
      listenBtn.onclick = () => {
        if (typeof speakText === "function") {
          speakText(translatedTarget, targetLang);
        }
      };
    }

    if (speakBtn) {
      speakBtn.onclick = () => {
        if (speakBtn.disabled || isAlreadyCompleted) return;
        if (feedbackEl) feedbackEl.classList.add("hidden");
        speakBtn.style.animation = "pulse 1.5s infinite";
        speakBtn.innerHTML =
          "<i data-lucide='mic'></i> <span>Listening...</span>";
        if (window.lucide) lucide.createIcons();

        if (typeof startSpeechToText === "function") {
          const locale = targetLang === "en" ? "en-IN" : targetLang;
          startSpeechToText(
            locale,
            (transcript) => {
              speakBtn.style.animation = "none";
              if (transcript) {
                const cleanExpected = translatedTarget
                  .normalize("NFC")
                  .toLowerCase()
                  .replace(/[.,?!।॥:;"'`—\-_/\\]/gu, " ")
                  .replace(/\s+/g, " ")
                  .trim();
                const cleanSpoken = transcript
                  .normalize("NFC")
                  .toLowerCase()
                  .replace(/[.,?!।॥:;"'`—\-_/\\]/gu, " ")
                  .replace(/\s+/g, " ")
                  .trim();

                const expectedWords = cleanExpected.split(/\s+/).filter(Boolean);
                const spokenWords = cleanSpoken.split(/\s+/).filter(Boolean);

                let isMatch = expectedWords.length === spokenWords.length;
                if (isMatch) {
                  for (let i = 0; i < expectedWords.length; i++) {
                    const w1 = expectedWords[i];
                    const w2 = spokenWords[i];
                    if (w1 !== w2) {
                      isMatch = false;
                      break;
                    }
                  }
                }

                if (isMatch) {
                  if (feedbackEl) {
                    feedbackEl.textContent =
                      getTranslation(
                        prefLang,
                        "phraseOfDaySuccess",
                      ) || "Perfect! You earned +20 XP.";
                    feedbackEl.className = "phrase-feedback success";
                    feedbackEl.classList.remove("hidden");
                  }

                  speakBtn.innerHTML =
                    "<i data-lucide='check'></i> <span>Completed</span>";
                  speakBtn.classList.add("completed");
                  speakBtn.disabled = true;
                  if (window.lucide) lucide.createIcons();

                  // Grant 20 XP
                  const user = auth.currentUser;
                  if (user) {
                    profile.phraseCompletedOn = todayStr;
                    localStorage.setItem("phraseCompletedOn", todayStr);
                    isAlreadyCompleted = true;

                    db.collection("users")
                      .doc(user.uid)
                      .update({
                        xp: firebase.firestore.FieldValue.increment(20),
                        phraseCompletedOn: todayStr,
                      })
                      .catch((err) => console.error("XP update error", err));

                    if (typeof showFloatingXP === "function") {
                      showFloatingXP(20);
                    }
                  }
                } else {
                  if (feedbackEl) {
                    feedbackEl.textContent = `${getTranslation(prefLang, "phraseOfDayTryAgain") || "Didn't catch that. Try again."} (You said: "${transcript}")`;
                    feedbackEl.className = "phrase-feedback error";
                    feedbackEl.classList.remove("hidden");
                  }
                  speakBtn.innerHTML =
                    "<i data-lucide='mic'></i> <span>Speak to earn XP</span>";
                  if (window.lucide) lucide.createIcons();
                }
              } else {
                if (feedbackEl) {
                  feedbackEl.textContent =
                    getTranslation(
                      prefLang,
                      "phraseOfDayTryAgain",
                    ) || "Didn't catch that. Try again.";
                  feedbackEl.className = "phrase-feedback error";
                  feedbackEl.classList.remove("hidden");
                }
                speakBtn.innerHTML =
                  "<i data-lucide='mic'></i> <span>Speak to earn XP</span>";
                if (window.lucide) lucide.createIcons();
              }
            },
            (err) => {
              speakBtn.style.animation = "none";
              speakBtn.innerHTML =
                "<i data-lucide='mic'></i> <span>Speak to earn XP</span>";
              if (window.lucide) lucide.createIcons();
              if (feedbackEl) {
                feedbackEl.textContent = "Mic error. Try again.";
                feedbackEl.className = "phrase-feedback error";
                feedbackEl.classList.remove("hidden");
              }
              console.error("STT error:", err);
            },
          );
        }
      };
    }
  });
}

// ─── Leaderboard Logic ────────────────────────────────────
let leaderboardLoaded = false;

function initLeaderboard(profile) {
  if (leaderboardLoaded) return;
  leaderboardLoaded = true;

  const prefLang = profile.preferredLanguage || (typeof selectedLang !== "undefined" ? selectedLang : "en") || "en";
  const tbody = document.getElementById("leaderboard-tbody");
  const podium = document.getElementById("leaderboard-podium");
  const loading = document.getElementById("leaderboard-loading");
  const empty = document.getElementById("leaderboard-empty");
  const adminBtn = document.getElementById("admin-award-top3-btn");

  if (profile.isAdmin && adminBtn) {
    adminBtn.classList.remove("hidden");
    adminBtn.onclick = awardTopThree;
  }

  db.collection("users")
    .orderBy("xp", "desc")
    .limit(20)
    .get()
    .then((snap) => {
      if (loading) loading.classList.add("hidden");
      if (snap.empty) {
        if (empty) empty.classList.remove("hidden");
        return;
      }

      const userList = [];
      snap.forEach((doc) => {
        const data = doc.data();
        userList.push({
          uid: doc.id,
          xp: data.xp || 0,
          name: data.fullName || data.displayName || "Learner",
          initial: (data.fullName || data.displayName || "L").charAt(0).toUpperCase(),
          streak: data.currentStreak || data.streak || 0,
          coins: data.coins || 0,
        });
      });

      const user = auth.currentUser;

      // 1. Render Top 3 Champions Podium
      if (podium && userList.length >= 1) {
        const first = userList[0];
        const second = userList[1] || null;
        const third = userList[2] || null;

        let podiumHtml = "";

        // 2nd Place (Silver)
        if (second) {
          podiumHtml += `
            <div style="flex: 1; min-width: 95px; max-width: 210px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 2px solid #cbd5e1; border-radius: 20px; padding: 1.15rem 0.5rem 1rem; text-align: center; box-shadow: 0 10px 25px -5px rgba(15,23,42,0.06); transform: translateY(0); order: 1; box-sizing: border-box;">
              <div style="font-size: 1.35rem; margin-bottom: 0.2rem;">🥈</div>
              <div style="width: 44px; height: 44px; border-radius: 50%; background: #94a3b8; color: white; font-weight: 900; font-size: 1.15rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.4rem; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(148,163,184,0.3);">
                ${second.initial}
              </div>
              <div style="font-weight: 800; font-size: 0.88rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${second.name}</div>
              <div style="margin-top: 0.35rem; background: #ffffff; padding: 0.2rem 0.55rem; border-radius: 9999px; font-weight: 900; font-size: 0.78rem; color: #475569; display: inline-flex; align-items: center; gap: 0.2rem; border: 1px solid #e2e8f0;">
                ⚡ ${second.xp} XP
              </div>
            </div>
          `;
        }

        // 1st Place (Gold Crown)
        podiumHtml += `
          <div style="flex: 1.1; min-width: 105px; max-width: 230px; background: linear-gradient(135deg, #fffbeb, #fef08a); border: 2px solid #eab308; border-radius: 22px; padding: 1.35rem 0.55rem 1.15rem; text-align: center; box-shadow: 0 16px 36px -8px rgba(234,179,8,0.3); order: 2; z-index: 2; box-sizing: border-box;">
            <div style="font-size: 1.75rem; margin-bottom: 0.15rem; filter: drop-shadow(0 4px 8px rgba(234,179,8,0.4));">👑</div>
            <div style="width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #eab308, #ca8a04); color: white; font-weight: 900; font-size: 1.3rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.4rem; border: 3px solid #ffffff; box-shadow: 0 6px 16px rgba(234,179,8,0.4);">
              ${first.initial}
            </div>
            <div style="font-weight: 900; font-size: 0.95rem; color: #854d0e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Plus Jakarta Sans', sans-serif;">${first.name}</div>
            <div style="margin-top: 0.35rem; background: #ffffff; padding: 0.25rem 0.65rem; border-radius: 9999px; font-weight: 900; font-size: 0.82rem; color: #854d0e; display: inline-flex; align-items: center; gap: 0.25rem; border: 1.5px solid #fef08a; box-shadow: 0 4px 12px rgba(234,179,8,0.2);">
              ⚡ ${first.xp} XP
            </div>
          </div>
        `;

        // 3rd Place (Bronze)
        if (third) {
          podiumHtml += `
            <div style="flex: 1; min-width: 95px; max-width: 210px; background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 2px solid #fdba74; border-radius: 20px; padding: 1.15rem 0.5rem 1rem; text-align: center; box-shadow: 0 10px 25px -5px rgba(249,115,22,0.1); transform: translateY(0); order: 3; box-sizing: border-box;">
              <div style="font-size: 1.35rem; margin-bottom: 0.2rem;">🥉</div>
              <div style="width: 44px; height: 44px; border-radius: 50%; background: #ea580c; color: white; font-weight: 900; font-size: 1.15rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.4rem; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(234,88,12,0.3);">
                ${third.initial}
              </div>
              <div style="font-weight: 800; font-size: 0.88rem; color: #9a3412; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${third.name}</div>
              <div style="margin-top: 0.35rem; background: #ffffff; padding: 0.2rem 0.55rem; border-radius: 9999px; font-weight: 900; font-size: 0.78rem; color: #9a3412; display: inline-flex; align-items: center; gap: 0.2rem; border: 1px solid #fed7aa;">
                ⚡ ${third.xp} XP
              </div>
            </div>
          `;
        }

        podium.innerHTML = podiumHtml;
      }

      // 2. Render Table Rows
      let html = "";
      const youLabel = getTranslation(prefLang, "youTag") || "YOU";

      userList.forEach((u, index) => {
        const rank = index + 1;
        const isCurrentUser = user && u.uid === user.uid;

        let rankBadge = `#${rank}`;
        let rankStyle = "background: #f1f5f9; color: #64748b;";
        let rowBackground = "background: #ffffff; border: 1.5px solid #e2e8f0;";

        if (rank === 1) {
          rankBadge = "👑 1";
          rankStyle = "background: linear-gradient(135deg, #fffbeb, #fef3c7); color: #854d0e; border: 1.5px solid #f59e0b; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25);";
        } else if (rank === 2) {
          rankBadge = "🥈 2";
          rankStyle = "background: linear-gradient(135deg, #f8fafc, #f1f5f9); color: #334155; border: 1.5px solid #94a3b8;";
        } else if (rank === 3) {
          rankBadge = "🥉 3";
          rankStyle = "background: linear-gradient(135deg, #fff7ed, #ffedd5); color: #9a3412; border: 1.5px solid #fdba74;";
        }

        if (isCurrentUser) {
          rowBackground = "background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08)); border: 2px solid #6366f1; box-shadow: 0 8px 24px -5px rgba(99,102,241,0.2);";
        }

        html += `
          <tr style="${rowBackground} border-radius: 16px; transition: transform 0.2s ease;">
            <td style="padding: 0.9rem 1rem; border-top-left-radius: 16px; border-bottom-left-radius: 16px;">
              <span style="${rankStyle} font-size: 0.9rem; font-weight: 900; padding: 0.35rem 0.75rem; border-radius: 9999px; display: inline-block; min-width: 42px; text-align: center;">${rankBadge}</span>
            </td>
            <td style="padding: 0.9rem 1rem;">
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem; flex-shrink: 0; box-shadow: 0 4px 12px rgba(99,102,241,0.3);">
                  ${u.initial}
                </div>
                <div>
                  <div style="font-weight: 800; font-size: 1rem; color: #0f172a; display: flex; align-items: center; gap: 0.4rem;">
                    <span>${u.name}</span>
                    ${isCurrentUser ? `<span style="background: #6366f1; color: white; padding: 0.12rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px;">${youLabel}</span>` : ""}
                  </div>
                </div>
              </div>
            </td>
            <td style="padding: 0.9rem 1rem; text-align: center;">
              <span style="background: #fff7ed; color: #ea580c; border: 1px solid #ffedd5; padding: 0.25rem 0.7rem; border-radius: 9999px; font-size: 0.82rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.3rem;">
                <i data-lucide="flame" style="width: 14px; height: 14px; fill: #ea580c;"></i>
                <span>${u.streak}d</span>
              </span>
            </td>
            <td style="padding: 0.9rem 1rem; text-align: center;">
              <span style="background: #fefce8; color: #ca8a04; border: 1px solid #fef08a; padding: 0.25rem 0.7rem; border-radius: 9999px; font-size: 0.82rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.3rem;">
                <i data-lucide="coins" style="width: 14px; height: 14px; fill: #eab308;"></i>
                <span>${u.coins}</span>
              </span>
            </td>
            <td style="padding: 0.9rem 1rem; text-align: right; border-top-right-radius: 16px; border-bottom-right-radius: 16px;">
              <span style="font-weight: 900; font-size: 1.05rem; color: #6366f1; display: inline-flex; align-items: center; gap: 0.3rem;">
                <i data-lucide="zap" style="width: 16px; height: 16px; fill: #6366f1;"></i>
                <span>${u.xp} XP</span>
              </span>
            </td>
          </tr>
        `;
      });

      if (tbody) tbody.innerHTML = html;
      if (window.lucide) lucide.createIcons();
    })
    .catch((err) => {
      if (loading) loading.classList.add("hidden");
      console.error("Error loading leaderboard:", err);
      if (empty) {
        empty.textContent = "Error loading leaderboard.";
        empty.classList.remove("hidden");
      }
    });
}

// ════════════════════════════════════════════════════════════════════
// ✨ Akshar AI Performance & Growth Advisor (Gemini AI Engine)
// ════════════════════════════════════════════════════════════════════

let isAdvisorAnalyzing = false;

/**
 * initAIGrowthAdvisor(profile)
 * Initializes the AI Performance Advisor card and checks for cached analysis.
 */
async function initAIGrowthAdvisor(profile) {
  const cardEl = document.getElementById("ai-growth-advisor-card");
  if (!cardEl) return;

  const refreshBtn = document.getElementById("ai-advisor-refresh-btn");
  if (refreshBtn) {
    refreshBtn.onclick = () => runAIGrowthAdvisor(profile, true);
  }

  const user = auth.currentUser;
  const cacheKey = user ? `akshar_ai_advisor_${user.uid}` : "akshar_ai_advisor_guest";
  let cached = profile.geminiAdvisorAdvice || null;

  if (!cached) {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) cached = JSON.parse(stored);
    } catch (e) {}
  }

  const completedCount = (profile.completedLessons || []).length;
  const prefLang = profile.preferredLanguage || (typeof selectedLang !== "undefined" ? selectedLang : null) || localStorage.getItem("akshar_user_lang") || "kn";

  // If cache is fresh (same completed lessons count & < 30 minutes old), render immediately
  if (cached && cached.completedCount === completedCount && (Date.now() - (cached.timestamp || 0) < 1800000)) {
    renderAdvisorAdvice(cached, profile, prefLang);
    return;
  }

  // Otherwise run automated background analysis
  runAIGrowthAdvisor(profile, false);
}

/**
 * showAdvisorLoading(show)
 * Toggles loading state & spinning refresh icon.
 */
function showAdvisorLoading(show) {
  const loadingEl = document.getElementById("ai-advisor-loading");
  const contentEl = document.getElementById("ai-advisor-content");
  const actionBanner = document.getElementById("ai-advisor-action-banner");
  const refreshIcon = document.getElementById("ai-advisor-refresh-icon");

  if (loadingEl) loadingEl.classList.toggle("hidden", !show);
  if (contentEl) contentEl.style.opacity = show ? "0.35" : "1";
  if (actionBanner) actionBanner.style.opacity = show ? "0.35" : "1";

  if (refreshIcon) {
    if (show) {
      refreshIcon.style.animation = "spin 1s linear infinite";
    } else {
      refreshIcon.style.animation = "none";
    }
  }
}

/**
 * runAIGrowthAdvisor(profile, forceRefresh)
 * Evaluates performance metrics and requests analysis from Gemini or graceful local advisor.
 */
async function runAIGrowthAdvisor(profile, forceRefresh) {
  if (isAdvisorAnalyzing) return;
  isAdvisorAnalyzing = true;
  showAdvisorLoading(true);

  const targetLang = profile.targetLanguage || "en";
  const prefLang = profile.preferredLanguage || (typeof selectedLang !== "undefined" ? selectedLang : null) || localStorage.getItem("akshar_user_lang") || "kn";
  const level = profile.level || "beginner";
  const streak = profile.streak || 0;
  const xp = profile.xp || 0;
  const completedLessons = profile.completedLessons || [];
  const completedCount = completedLessons.length;
  const assessmentScore = profile.assessmentScore || 0;

  // Gather skill accuracy metrics from lesson history
  const baseAcc = assessmentScore > 0 ? assessmentScore : 80;
  let skillScores = { 
    reading: baseAcc, 
    writing: baseAcc, 
    listening: baseAcc, 
    speaking: Math.max(30, baseAcc - 5), 
    pronunciation: baseAcc 
  };

  const user = auth.currentUser;
  if (user) {
    try {
      const snap = await db.collection("users").doc(user.uid).collection("lessonHistory").orderBy("completedAt", "desc").limit(25).get();
      if (!snap.empty) {
        const counts = {};
        const sums = {};
        snap.forEach(doc => {
          const d = doc.data();
          const t = d.type || "reading";
          const acc = typeof d.accuracy === "number" ? d.accuracy : (assessmentScore || 80);
          counts[t] = (counts[t] || 0) + 1;
          sums[t] = (sums[t] || 0) + acc;
        });
        Object.keys(counts).forEach(k => {
          if (counts[k] > 0) {
            skillScores[k] = Math.round(sums[k] / counts[k]);
          }
        });
      }
    } catch (e) {
      console.warn("History fetch for advisor (continuing):", e);
    }
  }

  const metrics = {
    targetLang,
    prefLang,
    level,
    streak,
    xp,
    completedCount,
    assessmentScore,
    skillScores
  };

  let advice = null;

  // 1. Try calling Gemini AI via Cloud Function or Direct Endpoint
  try {
    advice = await fetchGeminiAdvisorAnalysis(profile, prefLang, metrics);
  } catch (err) {
    console.warn("Gemini API Advisor (smoothly switching to rule-based engine):", err?.message || err);
  }

  // 2. Seamless Fallback: Generate intelligent deterministic advice with ZERO errors
  if (!advice || !advice.strengths || !advice.improvements) {
    advice = generateLocalAIAdvisorAdvice(profile, prefLang, metrics);
  }

  advice.timestamp = Date.now();
  advice.completedCount = completedCount;

  // Cache to Firestore & localStorage
  if (user) {
    try {
      db.collection("users").doc(user.uid).update({
        geminiAdvisorAdvice: advice,
        geminiAdvisorAnalyzedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(() => {});
      localStorage.setItem(`akshar_ai_advisor_${user.uid}`, JSON.stringify(advice));
    } catch (e) {}
  }

  // Render advice
  renderAdvisorAdvice(advice, profile, prefLang);
  showAdvisorLoading(false);
  isAdvisorAnalyzing = false;
}

/**
 * fetchGeminiAdvisorAnalysis(profile, prefLang, metrics)
 * Queries Gemini for personalized performance feedback in the learner's preferred language.
 */
async function fetchGeminiAdvisorAnalysis(profile, prefLang, metrics) {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  const token = await user.getIdToken();
  const prompt = `You are an expert language pedagogy growth coach on AksharGyan.
Analyze this learner:
- Target Language: ${metrics.targetLang}
- Native/UI Language: ${prefLang}
- Current Level: ${metrics.level}
- Completed Lessons: ${metrics.completedCount}
- Overall Benchmark: ${metrics.assessmentScore}%
- Streak: ${metrics.streak} days
- Skill Accuracies: Reading: ${metrics.skillScores.reading}%, Writing: ${metrics.skillScores.writing}%, Listening: ${metrics.skillScores.listening}%, Speaking: ${metrics.skillScores.speaking}%, Pronunciation: ${metrics.skillScores.pronunciation}%

Return a strict JSON object with:
{
  "strengths": ["2 concise, encouraging bullet points celebrating what they are doing great"],
  "improvements": ["2 concise, constructive bullet points on specific skills to improve"],
  "actionText": "1 concise sentence recommending their next practice step",
  "targetSkill": "one of: reading, writing, listening, speaking, pronunciation",
  "targetUnit": "alphabets or words or sentences or paragraphs",
  "targetLevel": "${metrics.level}"
}

IMPORTANT: Write all text in "strengths", "improvements", and "actionText" fluently in the learner's preferred language (${prefLang}).
Output ONLY valid JSON.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout for snappy UX

  const res = await fetch("/api/callGemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: "application/json" }
    }),
    signal: controller.signal
  });

  clearTimeout(timeoutId);

  if (!res.ok) {
    throw new Error(`Gemini response status: ${res.status}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Empty Gemini response");

  const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleanJson);
}

/**
 * generateLocalAIAdvisorAdvice(profile, prefLang, metrics)
 * Intelligent mathematical diagnostic generator supporting all 7 languages.
 */
function generateLocalAIAdvisorAdvice(profile, prefLang, metrics) {
  const scores = metrics.skillScores;
  const skillsList = ["reading", "writing", "listening", "speaking", "pronunciation"];
  
  // Find highest & lowest scoring skills
  let highestSkill = "reading";
  let lowestSkill = "speaking";
  let maxScore = -1;
  let minScore = 999;

  skillsList.forEach(s => {
    const sc = scores[s] || 75;
    if (sc > maxScore) { maxScore = sc; highestSkill = s; }
    if (sc < minScore) { minScore = sc; lowestSkill = s; }
  });

  const skillNames = {
    en: { reading: "Reading Comprehension", writing: "Sentence Writing", listening: "Listening Skills", speaking: "Oral Expression", pronunciation: "Pronunciation" },
    hi: { reading: "पठन समझ", writing: "वाक्य लेखन", listening: "श्रवण कौशल", speaking: "मौखिक अभिव्यक्ति", pronunciation: "उच्चारण" },
    ta: { reading: "வாசிப்புப் புரிதல்", writing: "வாக்கிய எழுத்து", listening: "கேட்கும் திறன்", speaking: "பேச்சுத் திறன்", pronunciation: "உச்சரிப்பு" },
    te: { reading: "పఠన అవగాహన", writing: "వాక్య రచన", listening: "వినే నైపుణ్యం", speaking: "మౌఖిక సంభాషణ", pronunciation: "ఉచ్చారణ" },
    kn: { reading: "ಓದುವ ಗ್ರಹಿಕೆ", writing: "ವಾಕ್ಯ ರಚನೆ", listening: "ಆಲಿಸುವ ಕೌಶಲ್ಯ", speaking: "ಮೌಖಿಕ ಅಭಿವ್ಯಕ್ತಿ", pronunciation: "ಉಚ್ಚಾರಣೆ" },
    bn: { reading: "পঠন বোধগম্যতা", writing: "বাক্য গঠন", listening: "শোনার দক্ষতা", speaking: "মৌখিক অভিব্যক্তি", pronunciation: "উচ্চারণ শৈলী" },
    mr: { reading: "वाचन आकलन", writing: "वाक्य लेखन", listening: "ऐकण्याचे कौशल्य", speaking: "मौखिक संभाषण", pronunciation: "उच्चार" }
  };

  const langMap = skillNames[prefLang] || skillNames.en;
  const strongName = langMap[highestSkill] || highestSkill;
  const weakName = langMap[lowestSkill] || lowestSkill;

  const templates = {
    en: {
      strengths: [
        `High accuracy and mastery in ${strongName} (${maxScore}%).`,
        metrics.streak > 0 ? `Impressive consistency with an active ${metrics.streak}-day learning streak!` : `Completed ${metrics.completedCount} lessons with dedication.`
      ],
      improvements: [
        `Focus more practice on ${weakName} to strengthen your overall fluency.`,
        `Review sentence structures daily to build long-term retention.`
      ],
      actionText: `Practice ${weakName} now to achieve balanced mastery.`
    },
    hi: {
      strengths: [
        `${strongName} में उच्च सटीकता और मजबूत पकड़ (${maxScore}%)।`,
        metrics.streak > 0 ? `${metrics.streak} दिनों की सक्रिय अध्ययन निरंतरता अत्यंत सराहनीय है!` : `लगन से ${metrics.completedCount} पाठ सफलतापूर्वक पूरे किए।`
      ],
      improvements: [
        `${weakName} में अधिक अभ्यास करें ताकि आपकी भाषा में पूर्ण प्रवाह आ सके।`,
        `वाक्य विन्यास और दैनिक शब्दावली का नियमित पुनरावलोकन करें।`
      ],
      actionText: `संतुलित प्रवीणता के लिए अभी ${weakName} का अभ्यास करें।`
    },
    ta: {
      strengths: [
        `${strongName} பிரிவில் மிகச் சிறந்த துல்லியம் மற்றும் தேர்ச்சி (${maxScore}%).`,
        metrics.streak > 0 ? `${metrics.streak} நாட்கள் தொடர் கற்றல் முயற்சி பாராட்டுக்குரியது!` : `${metrics.completedCount} பாடங்களை வெற்றிகரமாக முடித்துள்ளீர்கள்.`
      ],
      improvements: [
        `${weakName} பிரிவில் கூடுதல் பயிற்சி செய்து உங்கள் முழுமையான திறனை மேம்படுத்துங்கள்.`,
        `தினசரி புதிய வாக்கிய அமைப்புகளைப் பயிற்சி செய்யுங்கள்.`
      ],
      actionText: `முழுமையான தேர்ச்சி பெற இப்போது ${weakName} பயிற்சியைத் தொடங்குங்கள்.`
    },
    te: {
      strengths: [
        `${strongName} లో అత్యధిక ఖచ్చితత్వం మరియు పట్టు (${maxScore}%).`,
        metrics.streak > 0 ? `${metrics.streak} రోజుల నిరంతర సాధన అద్భుతంగా ఉంది!` : `${metrics.completedCount} పాఠాలను అంకితభావంతో పూర్తి చేశారు.`
      ],
      improvements: [
        `మంచి ప్రావీణ్యం కోసం ${weakName} పై మరింత దృష్టి పెట్టండి.`,
        `రోజువారీ వాక్య నిర్మాణాలను పునఃసమీక్షించండి.`
      ],
      actionText: `సంపూర్ణ నైపుణ్యం కోసం ఇప్పుడే ${weakName} అభ్యాసాన్ని ప్రారంభించండి.`
    },
    kn: {
      strengths: [
        `${strongName} ವಿಭಾಗದಲ್ಲಿ ಅತ್ಯುನ್ನತ ನಿಖರತೆ ಮತ್ತು ಪ್ರಾವೀಣ್ಯತೆ (${maxScore}%).`,
        metrics.streak > 0 ? `${metrics.streak} ದಿನಗಳ ನಿರಂತರ ಕಲಿಕೆಯ ಸರಣಿ ಅತ್ಯಂತ ಶ್ಲಾಘನೀಯ!` : `${metrics.completedCount} ಪಾಠಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ.`
      ],
      improvements: [
        `ನಿರರ್ಗಳ ಕಲಿಕೆಗಾಗಿ ${weakName} ವಿಭಾಗದಲ್ಲಿ ಹೆಚ್ಚಿನ ಅಭ್ಯಾಸದ ಅಗತ್ಯವಿದೆ.`,
        `ದೈನಂದಿನ ವಾಕ್ಯ ರಚನೆ ಮತ್ತು ಶಬ್ದಕೋಶವನ್ನು ಪುನರಾವರ್ತಿಸಿ.`
      ],
      actionText: `ಸಮಗ್ರ ಪ್ರಾವೀಣ್ಯತೆಗಾಗಿ ಈಗಲೇ ${weakName} ಅಭ್ಯಾಸವನ್ನು ಪ್ರಾರಂಭಿಸಿ.`
    },
    bn: {
      strengths: [
        `${strongName}-এ চমৎকার নির্ভুলতা এবং দক্ষতা (${maxScore}%)।`,
        metrics.streak > 0 ? `${metrics.streak} দিনের ধারাবাহিক অনুশীলনের ধারা দুর্দান্ত!` : `${metrics.completedCount}টি পাঠ নিষ্ঠার সাথে শেষ করেছেন।`
      ],
      improvements: [
        `ভাষার সাবলীলতার জন্য ${weakName}-এ আরও অনুশীলন করুন।`,
        `প্রতিদিন বাক্য গঠন এবং নতুন শব্দ পুনরাবৃত্তি করুন।`
      ],
      actionText: `সার্বিক উন্নতির জন্য এখনই ${weakName} অনুশীলন শুরু করুন।`
    },
    mr: {
      strengths: [
        `${strongName} मध्ये उत्कृष्ट अचूकता आणि उत्तम प्रभुत्व (${maxScore}%)।`,
        metrics.streak > 0 ? `${metrics.streak} दिवसांचे सातत्य अत्यंत कौतुकास्पद आहे!` : `${metrics.completedCount} धडे यशाने पूर्ण केले आहेत.`
      ],
      improvements: [
        `${weakName} मध्ये अधिक सराव करून आपला भाषिक प्रवाह वाढवा.`,
        `वाक्यरचना आणि शब्दसंग्रहाचा रोज सराव करा.`
      ],
      actionText: `समग्र कौशल्यासाठी आत्ताच ${weakName} चा सराव सुरू करा.`
    }
  };

  const selectedTemplate = templates[prefLang] || templates.en;

  return {
    strengths: selectedTemplate.strengths,
    improvements: selectedTemplate.improvements,
    actionText: selectedTemplate.actionText,
    targetSkill: lowestSkill,
    targetUnit: "alphabets",
    targetLevel: metrics.level
  };
}

/**
 * renderAdvisorAdvice(advice, profile, prefLang)
 * Renders the strengths, focus areas, and next recommendation button into the AI Advisor card.
 */
function renderAdvisorAdvice(advice, profile, prefLang) {
  if (!advice) return;

  const strengthsList = document.getElementById("ai-advisor-strengths-list");
  if (strengthsList && Array.isArray(advice.strengths)) {
    strengthsList.innerHTML = advice.strengths.map(s => `
      <li style="display: flex; align-items: flex-start; gap: 0.5rem; text-align: left;">
        <span style="color: #16a34a; font-weight: 900; font-size: 0.95rem; line-height: 1.4;">✓</span>
        <span style="color: #14532d; font-weight: 700; font-size: 0.88rem; line-height: 1.45;">${s}</span>
      </li>
    `).join("");
  }

  const focusList = document.getElementById("ai-advisor-focus-list");
  if (focusList && Array.isArray(advice.improvements)) {
    focusList.innerHTML = advice.improvements.map(f => `
      <li style="display: flex; align-items: flex-start; gap: 0.5rem; text-align: left;">
        <span style="color: #d97706; font-weight: 900; font-size: 0.95rem; line-height: 1.4;">•</span>
        <span style="color: #78350f; font-weight: 700; font-size: 0.88rem; line-height: 1.45;">${f}</span>
      </li>
    `).join("");
  }

  const actionText = document.getElementById("ai-advisor-action-text");
  if (actionText && advice.actionText) {
    actionText.textContent = advice.actionText;
  }

  const actionLink = document.getElementById("ai-advisor-action-link");
  if (actionLink) {
    const level = advice.targetLevel || profile.level || "beginner";
    const skill = advice.targetSkill || "reading";
    const unit = advice.targetUnit || "alphabets";
    actionLink.href = `lesson.html?level=${level}&unit=${unit}&type=${skill}`;
  }

  if (window.lucide) lucide.createIcons();
}

