/**
 * dashboard.js — Duolingo-Style Dashboard Logic
 *
 * Renders the learning path tree, XP/streak counters, skill cards,
 * and handles navigation to lesson pages.
 */

// ─── Unit Configuration ───────────────────────────────────────
const UNIT_CONFIG = {
  alphabets: { icon: "🔤", label: "dashUnitAlphabets", fallback: "Alphabets" },
  words: { icon: "📝", label: "dashUnitWords", fallback: "Words" },
  sentences: { icon: "📄", label: "dashUnitSentences", fallback: "Sentences" },
  paragraphs: {
    icon: "📚",
    label: "dashUnitParagraphs",
    fallback: "Paragraphs",
  },
};

const LEVEL_CONFIG = {
  beginner: {
    icon: "🌱",
    label: "scoreLevelBeginner",
    fallback: "Beginner",
    color: "amber",
  },
  intermediate: {
    icon: "📘",
    label: "scoreLevelIntermediate",
    fallback: "Intermediate",
    color: "purple",
  },
  advanced: {
    icon: "🚀",
    label: "scoreLevelAdvanced",
    fallback: "Advanced",
    color: "teal",
  },
};

const SKILL_CONFIG = [
  {
    id: "reading",
    icon: "📖",
    label: "skillReading",
    fallback: "Reading",
    color: "purple",
    desc: "skillReadingDesc",
    descFallback: "Improve comprehension with curated texts",
  },
  {
    id: "writing",
    icon: "✍️",
    label: "skillWriting",
    fallback: "Writing",
    color: "teal",
    desc: "skillWritingDesc",
    descFallback: "Practice writing with guided exercises",
  },
  {
    id: "speaking",
    icon: "🗣️",
    label: "skillSpeaking",
    fallback: "Speaking",
    color: "amber",
    desc: "skillSpeakingDesc",
    descFallback: "Build confidence with speech practice",
  },
  {
    id: "pronunciation",
    icon: "🔤",
    label: "skillPronunciation",
    fallback: "Pronunciation",
    color: "pink",
    desc: "skillPronunciationDesc",
    descFallback: "Perfect your pronunciation with audio",
  },
  {
    id: "listening",
    icon: "🎧",
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
  renderStatsStrip(profile);
  renderLearningPath(profile);
  renderSkillCards(profile);
  renderSidePanel(profile);
  renderProfile(profile);
  setupShop(profile);
  renderAnnouncementBanner();
  setupFeedbackForm();

  manageDailyQuests(profile); // 🌟 ADD THIS EXACT LINE RIGHT HERE!
  initPhraseOfDay(profile);

  setupDashboardEvents(profile);

  // Update streak
  const user = auth.currentUser;
  if (user) {
    updateStreak(user.uid).then((streak) => {
      if (typeof streak === "number") {
        document.getElementById("streak-count").textContent = streak;
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
        if (coinEl) coinEl.textContent = liveCoins;
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
    alphabets: { label: "Alphabets — Letter Recognition", icon: "🔤" },
    words: { label: "Words — Vocabulary Building", icon: "📝" },
    sentences: { label: "Sentences — Reading Practice", icon: "📄" },
    paragraphs: { label: "Paragraphs — Comprehension", icon: "📚" },
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
function renderRecommendation(profile) {
  const score = profile.assessmentScore || 0;
  const litLvl = profile.literacyLevel || "preferNot";
  const rec = computeRecommendation(score, litLvl);

  // ── Static content (renders immediately) ──────────────────────
  const headline = document.getElementById("rec-score-headline");
  if (headline)
    headline.textContent = getTranslation(
      selectedLang,
      "dashScoredHeadline",
    ).replace("{score}", score);

  const scoreVal = document.getElementById("rec-score-value");
  if (scoreVal) scoreVal.textContent = score;

  const tag = document.getElementById("rec-level-tag");
  if (tag) {
    tag.className = `rec-card-tag ${rec.levelTag}`;
    const tagLabels = {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
    };
    tag.textContent = tagLabels[rec.levelTag] || rec.levelTag;
  }

  const interp = document.getElementById("rec-interpretation");
  if (interp) interp.textContent = rec.interpretation;

  const ctaIcon = document.getElementById("rec-cta-icon");
  const ctaTitle = document.getElementById("rec-cta-title");
  const ctaSub = document.getElementById("rec-cta-sub");
  const ctaBtn = document.getElementById("rec-start-btn");
  if (ctaIcon) ctaIcon.textContent = rec.unitIcon;
  if (ctaTitle) ctaTitle.textContent = rec.unitLabel;
  if (ctaSub) ctaSub.textContent = rec.levelLabel;
  if (ctaBtn) ctaBtn.href = rec.url;

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
          <span class="skill-bar-label"><span class="skill-bar-icon">${skill.icon || "📌"}</span> ${skill.skill}</span>
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
    motivEl.textContent = "💡 " + analysis.motivationalNote;
  }

  // Update primary CTA if Gemini gives a better recommendation
  if (analysis.recommendedLevel && analysis.recommendedUnit) {
    const unitLabels = {
      alphabets: { label: "Alphabets — Letter Recognition", icon: "🔤" },
      words: { label: "Words — Vocabulary Building", icon: "📝" },
      sentences: { label: "Sentences — Reading Practice", icon: "📄" },
      paragraphs: { label: "Paragraphs — Comprehension", icon: "📚" },
    };
    const levelLabels = {
      beginner: "Beginner Level",
      intermediate: "Intermediate Level",
      advanced: "Advanced Level",
    };
    const uInfo = unitLabels[analysis.recommendedUnit] || unitLabels.alphabets;
    const lType = analysis.recommendedLessonType || "reading";

    const ctaLabelEl = document.getElementById("rec-cta-label-text");
    if (ctaLabelEl)
      ctaLabelEl.textContent = "🎯 Best starting point based on your results";

    const ctaIcon = document.getElementById("rec-cta-icon");
    const ctaTitle = document.getElementById("rec-cta-title");
    const ctaSub = document.getElementById("rec-cta-sub");
    const ctaBtn = document.getElementById("rec-start-btn");
    if (ctaIcon) ctaIcon.textContent = uInfo.icon;
    if (ctaTitle) ctaTitle.textContent = uInfo.label;
    if (ctaSub)
      ctaSub.textContent =
        levelLabels[analysis.recommendedLevel] || "Beginner Level";
    if (ctaBtn)
      ctaBtn.href = `lesson.html?level=${analysis.recommendedLevel}&unit=${analysis.recommendedUnit}&type=${lType}`;
  }

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
      alphabets: { icon: "🔤", name: "Alphabets" },
      words: { icon: "📝", name: "Words" },
      sentences: { icon: "📄", name: "Sentences" },
      paragraphs: { icon: "📚", name: "Paragraphs" },
    };
    const level = analysis.recommendedLevel || rec.level;
    extraListEl.innerHTML = extraRecs
      .map((r) => {
        const uInfo = unitLabels[r.unit] || { icon: "📖", name: r.unit };
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
  if (xpCount) {
    xpCount.textContent = profile.xp || 0;
  }

  // Streak
  const streakCount = document.getElementById("streak-count");
  if (streakCount) {
    streakCount.textContent = profile.streak || 0;
  }

  // Level badge
  const levelBadge = document.getElementById("user-level-badge");
  if (levelBadge) {
    const level = profile.currentLevel || profile.assessmentLevel || "beginner";
    const config = LEVEL_CONFIG[level];
    levelBadge.className = `dash-level-badge ${level}`;
    levelBadge.innerHTML = `${config.icon} <span>${getTranslation(selectedLang, config.label) || config.fallback}</span>`;
  }
}

// ─── Learning Path Tree ───────────────────────────────────────

function renderLearningPath(profile) {
  const pathContainer = document.getElementById("learning-path");
  if (!pathContainer) return;

  const currentLevel =
    profile.currentLevel || profile.assessmentLevel || "beginner";
  const completedLessons = profile.completedLessons || [];
  const curriculum = profile.curriculum || {};

  const levels = ["beginner", "intermediate", "advanced"];
  const skills = [
    "reading",
    "writing",
    "listening",
    "speaking",
    "pronunciation",
  ];

  const skillIcons = {
    reading: "📖",
    writing: "✍️",
    listening: "🎧",
    speaking: "🗣️",
    pronunciation: "🎙️",
  };

  // 1. Render the Explainer Card at the top
  let html = `
    <div class="roadmap-explainer">
      <div class="roadmap-explainer-content">
        <h4 data-i18n="howItWorksTitle">How This Works</h4>
        <p data-i18n="howItWorksBody">Follow the path from left to right. Complete all 5 dots in a skill to master it. Complete all 5 skills to unlock the next level.</p>
      </div>
      <button class="roadmap-tts-btn" id="roadmap-tts-btn" aria-label="Listen">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      </button>
    </div>
    <div class="roadmap-container">
  `;

  // 2. Render the Levels and Skills
  levels.forEach((level) => {
    // Level Header
    const levelKey = `roadmapLevel${level.charAt(0).toUpperCase() + level.slice(1)}`;
    html += `
      <div class="roadmap-level-block">
        <h3 class="roadmap-level-title">
          <span data-i18n="${levelKey}">${level.charAt(0).toUpperCase() + level.slice(1)} Level</span>
          ${level === currentLevel ? `<span class="roadmap-you-are-here" data-i18n="youAreHere">You are here</span>` : ""}
        </h3>
        <div class="roadmap-skills-wrapper">
    `;

    skills.forEach((skill) => {
      // Find unit from auth.js logic (fallback to alphabets if not known)
      const lit = profile.literacyLevel || "preferNot";
      const unitByLiteracy = {
        neverLearned: "alphabets",
        canRecognize: "words",
        canReadSimple: "sentences",
        canReadComfort: "paragraphs",
        preferNot: "alphabets",
      };
      const unit = unitByLiteracy[lit] || "alphabets";

      const skillStatus = curriculum[level]?.[skill]?.status || "locked";
      const skillKey = `roadmapSkill${skill.charAt(0).toUpperCase() + skill.slice(1)}`;

      html += `
        <div class="roadmap-skill-row">
          <div class="roadmap-skill-label">
            <span class="roadmap-skill-icon">${skillIcons[skill]}</span>
            <span data-i18n="${skillKey}">${skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
          </div>
          <div class="roadmap-dots">
      `;

      // Render the 5 lesson dots
      for (let i = 1; i <= 5; i++) {
        const lessonId = `${level}_${skill}_${unit}_${i}`;
        const isCompleted = completedLessons.includes(lessonId);

        let state = "locked";
        if (isCompleted) {
          state = "completed";
        } else if (skillStatus === "available") {
          // If skill is available, allow any dot (or enforce order if preferred, for now all available)
          state = "available";
        } else if (skillStatus === "skipped" || skillStatus === "completed") {
          // If the whole skill was skipped/completed by assessment, mark dots as completed
          state = "completed";
        }

        const blueprint = window.CURRICULUM_BLUEPRINT?.[level]?.[skill]?.find(
          (b) => b.lessonIndex === i,
        );
        const focusText = blueprint ? blueprint.focus : `Lesson ${i}`;

        html += `
          <div class="roadmap-dot ${state}" 
               data-level="${level}" 
               data-skill="${skill}" 
               data-unit="${unit}" 
               data-index="${i}" 
               title="${focusText}">
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
      </div>
    `;
  });

  html += `</div>`;
  pathContainer.innerHTML = html;

  // 3. Attach click handlers to available/completed dots
  pathContainer.querySelectorAll(".roadmap-dot:not(.locked)").forEach((dot) => {
    dot.addEventListener("click", () => {
      const { level, skill, unit, index } = dot.dataset;
      window.location.href = `lesson.html?level=${level}&type=${skill}&unit=${unit}&lessonIndex=${index}`;
    });
  });

  // 4. Attach TTS handler to the explainer card
  const ttsBtn = document.getElementById("roadmap-tts-btn");
  if (ttsBtn) {
    ttsBtn.addEventListener("click", () => {
      // Read the localized text using the user's *preferred* language
      const title =
        getTranslation(selectedLang, "howItWorksTitle") || "How This Works";
      const body =
        getTranslation(selectedLang, "howItWorksBody") ||
        "Follow the path from left to right. Complete all 5 dots in a skill to master it. Complete all 5 skills to unlock the next level.";

      const langMap = {
        en: "en-IN",
        hi: "hi-IN",
        ta: "ta-IN",
        te: "te-IN",
        kn: "kn-IN",
        bn: "bn-IN",
        mr: "mr-IN",
      };
      const voiceLang = langMap[selectedLang] || "en-IN";

      ttsBtn.style.color = "var(--color-primary)";
      ttsBtn.style.animation = "pulse 1.5s infinite";

      if (typeof speakText === "function") {
        speakText(`${title}. ${body}`, voiceLang).finally(() => {
          ttsBtn.style.color = "";
          ttsBtn.style.animation = "none";
        });
      }
    });
  }
}

// ─── Skill Practice Cards ─────────────────────────────────────

function renderSkillCards(profile) {
  const container = document.getElementById("skill-cards");
  if (!container) return;

  const level = profile.currentLevel || profile.assessmentLevel || "beginner";

  let html = "";
  SKILL_CONFIG.forEach((skill) => {
    html += `<div class="skill-card" data-skill="${skill.id}">
      <div class="skill-card-icon ${skill.color}">${skill.icon}</div>
      <div class="skill-card-content">
        <h4>${getTranslation(selectedLang, skill.label) || skill.fallback}</h4>
        <p>${getTranslation(selectedLang, skill.desc) || skill.descFallback}</p>
      </div>
      <div class="skill-card-level">
        <span class="rec-card-tag ${level}">${getTranslation(selectedLang, LEVEL_CONFIG[level].label) || LEVEL_CONFIG[level].fallback}</span>
      </div>
      <svg class="skill-card-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>`;
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
      window.location.href = `lesson.html?level=${level}&unit=${targetUnit}&type=${skill}`;
    });
  });
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
            <div class="quest-check">${isDone ? "✓" : ""}</div>
            <span class="quest-title">${
              q.id === "q1"
                ? getTranslation(selectedLang, "questEarnXP") || "Earn 20 XP"
                : q.id === "q2"
                  ? getTranslation(selectedLang, "questPlayGame") ||
                    "Play Word Match"
                  : getTranslation(selectedLang, "questCompleteLesson") ||
                    "Complete 1 Lesson"
            }</span>
          </div>
          <span class="quest-reward">+${q.reward} 🪙</span>
        </div>
        <div class="quest-progress-track">
          <div class="quest-progress-fill" style="width: ${progressPct}%;"></div>
        </div>
      </div>
    `;
  });

  questContainer.innerHTML = html;

  const coinEl = document.getElementById("coin-count");
  if (coinEl) coinEl.textContent = profile.coins || 0;

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
      statusText.textContent = getTranslation(selectedLang, "goalReached");
      statusText.style.color = "var(--color-success)";
    } else if (percent > 0) {
      statusText.textContent = getTranslation(selectedLang, "goalKeepItUp");
      statusText.style.color = "var(--color-primary)";
    }
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
  renderWordOfTheDay();
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

function renderWordOfTheDay() {
  const dictionary = [
    {
      word: getTranslation(selectedLang, "wotd_0_word") || "Sign",
      meaning:
        getTranslation(selectedLang, "wotd_0_desc") ||
        "To write your name on a document.",
    },
    {
      word: getTranslation(selectedLang, "wotd_1_word") || "Deposit",
      meaning:
        getTranslation(selectedLang, "wotd_1_desc") ||
        "To put money into a bank account.",
    },
    {
      word: getTranslation(selectedLang, "wotd_2_word") || "Prescription",
      meaning:
        getTranslation(selectedLang, "wotd_2_desc") ||
        "A doctor's written note for medicine.",
    },
    {
      word: getTranslation(selectedLang, "wotd_3_word") || "Receipt",
      meaning:
        getTranslation(selectedLang, "wotd_3_desc") ||
        "A piece of paper proving you paid for something.",
    },
    {
      word: getTranslation(selectedLang, "wotd_4_word") || "Platform",
      meaning:
        getTranslation(selectedLang, "wotd_4_desc") ||
        "The area at a station where you wait for a train.",
    },
    {
      word: getTranslation(selectedLang, "wotd_5_word") || "Verify",
      meaning:
        getTranslation(selectedLang, "wotd_5_desc") ||
        "To make sure something is true or accurate.",
    },
    {
      word: getTranslation(selectedLang, "wotd_6_word") || "Balance",
      meaning:
        getTranslation(selectedLang, "wotd_6_desc") ||
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
        speakText(`${wotd.word}. ${wotd.meaning}`, selectedLang || "en");
      }
    };
  }
}

// ─── Dashboard Events ─────────────────────────────────────────

function setupDashboardEvents(profile) {
  // Sidebar collapse/expand + mobile drawer
  setupSidebarToggle();

  // Logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logoutUser().then(() => {
        window.location.href = "login.html";
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
      if (window.Analysis) {
        window.Analysis.reRenderLang(profile);
      }
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

  // ── Main navigation tabs ──
  document.querySelectorAll(".dash-nav-item").forEach((navItem) => {
    navItem.addEventListener("click", () => {
      const section = navItem.dataset.section;
      document
        .querySelectorAll(".dash-nav-item")
        .forEach((n) => n.classList.remove("active"));
      document
        .querySelectorAll(`.dash-nav-item[data-section="${section}"]`)
        .forEach((n) => n.classList.add("active"));

      if (navMoreWrap) navMoreWrap.classList.remove("open");

      // Show/hide sections
      document
        .querySelectorAll(".dash-main-section")
        .forEach((s) => s.classList.add("hidden"));
      const target = document.getElementById(`section-${section}`);
      if (target) target.classList.remove("hidden");

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
    });
  });

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
  // Populate profile fields
  document.getElementById("profile-name").textContent =
    profile.fullName || "User";
  const user = auth.currentUser;
  if (user) {
    document.getElementById("profile-email").textContent = user.email || "";
  }
  document.getElementById("profile-avatar").textContent = (
    profile.fullName || "U"
  )
    .charAt(0)
    .toUpperCase();

  // Populate form fields
  document.getElementById("edit-fullname").value = profile.fullName || "";
  document.getElementById("edit-language").value =
    profile.preferredLanguage || "en";
  document.getElementById("edit-target-language").value =
    profile.targetLanguage || profile.preferredLanguage || "en";
  document.getElementById("edit-age").value = profile.ageGroup || "26-40";
  document.getElementById("edit-literacy").value =
    profile.literacyLevel || "canRecognize";

  // ─── Refined Badge Shelf System ───
  const badgeShelf = document.getElementById("badge-shelf");
  if (badgeShelf) {
    const allBadges = [
      {
        id: "assessmentDone",
        icon: "🎯",
        label:
          getTranslation(selectedLang, "badgeEvaluatedLabel") || "Evaluated",
        desc:
          getTranslation(selectedLang, "badgeEvaluatedDesc") ||
          "Completed initial assessment",
      },
      {
        id: "firstLesson",
        icon: "🌱",
        label:
          getTranslation(selectedLang, "badgeFirstStepsLabel") || "First Steps",
        desc:
          getTranslation(selectedLang, "badgeFirstStepsDesc") ||
          "Completed your first lesson",
      },
      {
        id: "alphabetMaster",
        icon: "🔤",
        label:
          getTranslation(selectedLang, "badgeLetterKingLabel") || "Letter King",
        desc:
          getTranslation(selectedLang, "badgeLetterKingDesc") ||
          "Mastered the alphabets unit",
      },
      {
        id: "beginnerGraduate",
        icon: "🥉",
        label:
          getTranslation(selectedLang, "badgeBeginnerGradLabel") ||
          "Beginner Graduate",
        desc:
          getTranslation(selectedLang, "badgeBeginnerGradDesc") ||
          "Mastered all beginner skills",
      },
      {
        id: "intermediateGraduate",
        icon: "🥈",
        label:
          getTranslation(selectedLang, "badgeIntermediateGradLabel") ||
          "Intermediate Graduate",
        desc:
          getTranslation(selectedLang, "badgeIntermediateGradDesc") ||
          "Mastered all intermediate skills",
      },
      {
        id: "advancedGraduate",
        icon: "🥇",
        label:
          getTranslation(selectedLang, "badgeAdvancedGradLabel") ||
          "Advanced Graduate",
        desc:
          getTranslation(selectedLang, "badgeAdvancedGradDesc") ||
          "Mastered all advanced skills",
      },
      {
        id: "streak5",
        icon: "🔥",
        label:
          getTranslation(selectedLang, "badgeStreak5Label") || "5-Day Streak",
        desc:
          getTranslation(selectedLang, "badgeStreak5Desc") ||
          "Practiced 5 days in a row",
      },
      {
        id: "streak10",
        icon: "🔥",
        label:
          getTranslation(selectedLang, "badgeStreak10Label") || "10-Day Streak",
        desc:
          getTranslation(selectedLang, "badgeStreak10Desc") ||
          "Practiced 10 days in a row",
      },
      {
        id: "streak30",
        icon: "🔥",
        label:
          getTranslation(selectedLang, "badgeStreak30Label") || "30-Day Streak",
        desc:
          getTranslation(selectedLang, "badgeStreak30Desc") ||
          "Practiced 30 days in a row",
      },
      {
        id: "gameWinner",
        icon: "🎮",
        label:
          getTranslation(selectedLang, "badgeMatchMasterLabel") ||
          "Match Master",
        desc:
          getTranslation(selectedLang, "badgeMatchMasterDesc") ||
          "Won a Word Match game",
      },
      {
        id: "gameChampion",
        icon: "🏆",
        label:
          getTranslation(selectedLang, "badgeGameChampionLabel") ||
          "Game Champion",
        desc:
          getTranslation(selectedLang, "badgeGameChampionDesc") ||
          "Won 10 games",
      },
    ];

    const earned = profile.badgesEarned || [];

    badgeShelf.innerHTML = allBadges
      .map((b) => {
        const isEarned = earned.includes(b.id);
        return `
        <div class="badge-card-item ${isEarned ? "earned" : "locked"}" title="${b.desc}">
          <div class="badge-icon-circle">${b.icon}</div>
          ${!isEarned ? '<div class="badge-lock-overlay">🔒</div>' : ""}
          <div class="badge-card-label">${b.label}</div>
        </div>
      `;
      })
      .join("");

    badgeShelf.querySelectorAll(".badge-card-item.earned").forEach((item) => {
      item.addEventListener("mouseenter", () => {
        item.querySelector(".badge-icon-circle").style.transform =
          "scale(1.1) translateY(-3px)";
      });
      item.addEventListener("mouseleave", () => {
        item.querySelector(".badge-icon-circle").style.transform =
          "scale(1) translateY(0)";
      });
    });
  }

  // Update Side Calendar (Phase 6)
  const calendar = document.getElementById("streak-calendar");
  if (calendar) {
    let calHtml = "";
    const today = new Date();
    // Render last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const isPracticed = (profile.practiceDays || []).includes(dateStr);
      // Try to get day name properly depending on language
      let dayName = "D";
      try {
        dayName = d.toLocaleDateString(selectedLang || "en", {
          weekday: "narrow",
        });
      } catch (e) {
        dayName = d.toLocaleDateString("en", { weekday: "narrow" });
      }
      calHtml += `<div class="calendar-day ${isPracticed ? "practiced" : ""}" title="${dateStr}">
        ${dayName}
      </div>`;
    }
    calendar.innerHTML = calHtml;
  }
}
// ─── Virtual Shop Engine ───────────────────────────────────────

const SHOP_CATALOG = [
  {
    id: "freeze",
    type: "consumable",
    icon: "🧊",
    title: "Streak Freeze",
    desc: "Miss a day of practice without losing your streak! Protects your progress.",
    price: 50,
  },
  {
    id: "theme_emerald",
    type: "theme",
    icon: "🌲",
    title: "Emerald Theme",
    desc: "A calming green color layout for your dashboard.",
    price: 100,
    color: "#10b981",
  },
  {
    id: "theme_sunset",
    type: "theme",
    icon: "🌅",
    title: "Sunset Theme",
    desc: "A warm, energetic orange layout for your dashboard.",
    price: 100,
    color: "#f59e0b",
  },
  {
    id: "theme_rose",
    type: "theme",
    icon: "💎",
    title: "Ruby Theme",
    desc: "A bold, beautiful red layout for your dashboard.",
    price: 100,
    color: "#e11d48",
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
  const closeBtn = document.getElementById("close-shop-btn");
  const shopModal = document.getElementById("shop-modal");

  applyTheme(profile.activeTheme || "default");

  if (shopBtn && closeBtn && shopModal) {
    shopBtn.addEventListener("click", () => {
      renderShopItems(shopUserProfile);
      document.getElementById("shop-balance").textContent =
        shopUserProfile.coins || 0;
      shopModal.classList.remove("hidden");
    });

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
        btnHtml = `<button class="shop-buy-btn" ${!canAfford ? "disabled" : ""} onclick="buyItem('${item.id}', ${item.price})">${item.price} 🪙</button>`;
      }
    } else if (item.type === "consumable") {
      const ownedCount = profile.streakFreezes || 0;
      if (ownedCount > 0) {
        btnHtml = `<div style="text-align: right;"><span style="font-size:0.8rem;color:#64748b;">Owned: ${ownedCount}</span><br><button class="shop-buy-btn" ${!canAfford ? "disabled" : ""} onclick="buyItem('${item.id}', ${item.price})">${item.price} 🪙</button></div>`;
      } else {
        btnHtml = `<button class="shop-buy-btn" ${!canAfford ? "disabled" : ""} onclick="buyItem('${item.id}', ${item.price})">${item.price} 🪙</button>`;
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

  const textEl = document.getElementById("phrase-of-day-text");
  if (textEl) textEl.textContent = todayPhrase;

  // Try to translate the phrase via free Google Translate API or fallback
  const targetLang = profile.preferredLanguage || "hi";
  if (targetLang !== "en") {
    fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(todayPhrase)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        const trEl = document.getElementById("phrase-of-day-translation");
        if (trEl) trEl.textContent = data[0][0][0];
      })
      .catch(() => {
        const trEl = document.getElementById("phrase-of-day-translation");
        if (trEl)
          trEl.textContent = "Practice speaking this phrase in English!";
      });
  } else {
    const trEl = document.getElementById("phrase-of-day-translation");
    if (trEl) trEl.textContent = "Practice speaking this phrase!";
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
        speakText(todayPhrase, "en");
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
        startSpeechToText(
          "en-IN",
          (transcript) => {
            speakBtn.style.animation = "none";
            if (transcript) {
              const expected = todayPhrase
                .toLowerCase()
                .replace(/[.,?]/g, "")
                .trim();
              const actual = transcript
                .toLowerCase()
                .replace(/[.,?]/g, "")
                .trim();

              const expectedWords = expected.split(/\s+/).filter(Boolean);
              const actualWords = new Set(actual.split(/\s+/).filter(Boolean));
              const matchedCount = expectedWords.filter((w) =>
                actualWords.has(w),
              ).length;
              const matchRatio = expectedWords.length
                ? matchedCount / expectedWords.length
                : 0;

              if (matchRatio >= 0.6) {
                if (feedbackEl) {
                  feedbackEl.textContent =
                    getTranslation(
                      profile.preferredLanguage || "en",
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
                  // Update memory so it persists across soft navigation
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

                  // Show floating XP if celebration exists
                  if (typeof showFloatingXP === "function") {
                    showFloatingXP(20);
                  }
                }
              } else {
                if (feedbackEl) {
                  feedbackEl.textContent = `${getTranslation(profile.preferredLanguage || "en", "phraseOfDayTryAgain") || "Didn't catch that. Try again."} (You said: "${transcript}")`;
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
                    profile.preferredLanguage || "en",
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
}

// ─── Leaderboard Logic ────────────────────────────────────
let leaderboardLoaded = false;

function initLeaderboard(profile) {
  if (leaderboardLoaded) return;
  leaderboardLoaded = true;

  const tbody = document.getElementById("leaderboard-tbody");
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

      let html = "";
      let rank = 1;
      snap.forEach((doc) => {
        const data = doc.data();
        const xp = data.xp || 0;
        const name = data.fullName || "Learner";
        const initial = name.charAt(0).toUpperCase();
        const streak = data.currentStreak || data.streak || 0;
        const coins = data.coins || 0;

        html += '<tr class="leaderboard-row rank-' + rank + '">';
        html +=
          '  <td><div class="leaderboard-rank-badge">' + rank + "</div></td>";
        html += "  <td>";
        html += '    <div class="leaderboard-user-cell">';
        html += '      <div class="leaderboard-avatar">' + initial + "</div>";
        html += '      <div style="font-weight: 500;">' + name + "</div>";
        html += "    </div>";
        html += "  </td>";
        html +=
          '  <td style="text-align: center; color: var(--color-warning);">🔥 ' +
          streak +
          "</td>";
        html +=
          '  <td style="text-align: center; color: #f59e0b;">🪙 ' +
          coins +
          "</td>";
        html += '  <td class="leaderboard-xp">' + xp + " XP</td>";
        html += "</tr>";
        rank++;
      });
      if (tbody) tbody.innerHTML = html;
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
