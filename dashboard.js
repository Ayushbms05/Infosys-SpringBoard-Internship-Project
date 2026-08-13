/**
 * dashboard.js — Duolingo-Style Dashboard Logic
 *
 * Renders the learning path tree, XP/streak counters, skill cards,
 * and handles navigation to lesson pages.
 */

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

  for (const lvl of levels) {
    for (const skill of skills) {
      for (let i = 1; i <= 5; i++) {
        const lessonId = `${lvl}_${skill}_${unit}_${i}`;
        if (!completedLessons.includes(lessonId)) {
          const blueprint = window.CURRICULUM_BLUEPRINT?.[lvl]?.[skill]?.find(b => b.lessonIndex === i);
          const focusText = blueprint ? blueprint.focus : `Lesson ${i}`;

          return {
            level: lvl,
            unit: unit,
            lessonType: skill,
            lessonIndex: i,
            title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} — Lesson ${i}`,
            sub: `${lvl.charAt(0).toUpperCase() + lvl.slice(1)} Level`,
            url: `lesson.html?level=${lvl}&unit=${unit}&type=${skill}&lessonIndex=${i}`,
            icon: "<i data-lucide='play-circle'></i>"
          };
        }
      }
    }
  }

  return {
    level: "advanced",
    unit: unit,
    lessonType: "reading",
    lessonIndex: 1,
    title: "All caught up!",
    sub: "You've completed everything!",
    url: "#",
    icon: "<i data-lucide='check-circle'></i>",
    isFinished: true
  };
}

function renderRecommendation(profile) {
  const score = profile.assessmentScore || 0;
  const litLvl = profile.literacyLevel || "preferNot";
  const rec = computeRecommendation(score, litLvl);
  const nextLesson = computeNextIncompleteLesson(profile);

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
  if (ctaIcon) ctaIcon.innerHTML = nextLesson.icon;
  if (ctaTitle) ctaTitle.textContent = nextLesson.title;
  if (ctaSub) ctaSub.textContent = nextLesson.sub;
  if (ctaBtn) {
    ctaBtn.href = nextLesson.url;
    if (nextLesson.isFinished) {
      ctaBtn.style.pointerEvents = "none";
      ctaBtn.textContent = "✔ Completed";
      ctaBtn.style.opacity = "0.5";
    } else {
      ctaBtn.textContent = "▶ Resume";
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

  const currentLevel = profile.currentLevel || profile.assessmentLevel || "beginner";
  const levels = ["beginner", "intermediate", "advanced"];
  const skills = ["reading", "writing", "listening", "speaking", "pronunciation"];
  
  // Find up to 3 uncompleted lessons
  let recs = [];
  const completedLessons = profile.completedLessons || [];
  const curriculum = profile.curriculum || {};

  for (const lvl of levels) {
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
          const focusText = blueprint ? blueprint.focus : `Lesson ${i}`;
          
          recs.push({
            title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} — ${focusText}`,
            sub: `${lvl.charAt(0).toUpperCase() + lvl.slice(1)} Level`,
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
    recs = [
      { title: "Review Reading", sub: "Keep your skills sharp", url: "lesson.html?type=reading&mode=practice", icon: "<i data-lucide='book-open'></i>" },
      { title: "Review Speaking", sub: "Practice pronunciation", url: "lesson.html?type=speaking&mode=practice", icon: "<i data-lucide='mic'></i>" },
      { title: "Review Listening", sub: "Improve comprehension", url: "lesson.html?type=listening&mode=practice", icon: "<i data-lucide='headphones'></i>" }
    ];
  }

  container.innerHTML = recs.map(r => `
    <a href="${r.url}" class="recommended-card">
      <div class="recommended-icon">${r.icon}</div>
      <h4 class="recommended-title">${r.title}</h4>
      <p class="recommended-sub">${r.sub}</p>
    </a>
  `).join("");

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function renderHomeHeatmap(profile) {
  const container = document.getElementById("home-activity-heatmap");
  if (!container) return;

  const practiceDays = profile.practiceDays || [];
  const days = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      dateStr: dateStr,
      label: d.toLocaleDateString(undefined, { weekday: "short" }).charAt(0),
      isPracticed: practiceDays.includes(dateStr),
      isToday: i === 0
    });
  }

  container.innerHTML = days.map(d => `
    <div class="heatmap-day" title="${d.dateStr}">
      <div class="heatmap-dot ${d.isPracticed ? 'active' : ''}"></div>
      <span class="heatmap-label ${d.isToday ? 'today' : ''}">${d.label}</span>
    </div>
  `).join("");
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

  const currentLevel = profile.currentLevel || profile.assessmentLevel || "beginner";
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

  const userLevelIndex = levels.indexOf(currentLevel);

  const skillIcons = {
    reading: "<i data-lucide='book-open'></i>",
    writing: "<i data-lucide='pen-tool'></i>",
    listening: "<i data-lucide='headphones'></i>",
    speaking: "<i data-lucide='mic'></i>",
    pronunciation: "<i data-lucide='mic'></i>",
  };

  // 1. Render the Explainer Card at the top
  let html = `
    <div class="roadmap-container zigzag-mode">
  `;

  let globalDotIndex = 0;

  // 2. Render the Levels and Skills
  levels.forEach((level) => {
    const levelIndex = levels.indexOf(level);
    const levelKey = `roadmapLevel${level.charAt(0).toUpperCase() + level.slice(1)}`;

    let levelBadgeHtml = "";
    if (levelIndex < userLevelIndex) {
      levelBadgeHtml = `<span class="roadmap-placed-above" data-i18n="levelPassed">✓ Level Passed</span>`;
    } else if (levelIndex === userLevelIndex) {
      levelBadgeHtml = `<span class="roadmap-you-are-here" data-i18n="youAreHere">You are here</span>`;
    } else {
      levelBadgeHtml = `<span class="roadmap-level-locked" data-i18n="levelLocked">Locked</span>`;
    }

    html += `
      <div class="roadmap-level-block zigzag-level-block">
        <div class="roadmap-level-header" style="text-align: center; margin-bottom: 2rem;">
          <h3 class="roadmap-level-title" style="justify-content: center; margin-bottom: 0.5rem;">
            <span data-i18n="${levelKey}">${level.charAt(0).toUpperCase() + level.slice(1)} Level</span>
          </h3>
          <div style="display: flex; justify-content: center; margin-top: 0.4rem;">
            ${levelBadgeHtml}
          </div>
        </div>
        <div class="zigzag-skills-wrapper">
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
      const skillKey = `roadmapSkill${skill.charAt(0).toUpperCase() + skill.slice(1)}`;

      html += `
        <div class="zigzag-skill-group">
          <div class="zigzag-skill-label">
            <span class="zigzag-skill-icon">${skillIcons[skill]}</span>
            <span data-i18n="${skillKey}">${skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
          </div>
          <div class="zigzag-dots-container">
      `;

      // Render the 5 lesson dots
      for (let i = 1; i <= 5; i++) {
        const lessonId = `${level}_${skill}_${unit}_${i}`;
        const isCompleted = completedLessons.includes(lessonId);

        let state = "locked";
        if (levelIndex < userLevelIndex) {
          state = "skipped";
        } else if (levelIndex === userLevelIndex) {
          state = isCompleted ? "completed" : "available";
        } else {
          state = "locked";
        }

        const blueprint = window.CURRICULUM_BLUEPRINT?.[level]?.[skill]?.find(
          (b) => b.lessonIndex === i,
        );
        const focusText = blueprint ? blueprint.focus : `Lesson ${i}`;

        // Zigzag logic: sine wave based on global index
        const offsetX = Math.sin(globalDotIndex * 0.75) * 100;
        
        // Custom styling based on state for the inner icon
        let iconHtml = '';
        if (state === 'completed' || state === 'skipped') {
           iconHtml = '<i data-lucide="check" style="width: 24px; height: 24px;"></i>';
        } else if (state === 'locked') {
           iconHtml = '<i data-lucide="lock" style="width: 20px; height: 20px;"></i>';
        } else {
           iconHtml = skillIcons[skill]; // available shows skill icon
        }

        const tooltipText = state === 'locked' 
          ? `Complete ${levels[userLevelIndex]} level to unlock` 
          : state === 'skipped' 
            ? `Lesson ${i} (Placed above)` 
            : focusText;

        html += `
          <div class="zigzag-node-wrap" style="transform: translateX(${offsetX}px);">
            <div class="roadmap-dot zigzag-dot ${state}" 
                 data-level="${level}" 
                 data-skill="${skill}" 
                 data-unit="${unit}" 
                 data-index="${i}" 
                 title="${tooltipText}">
              ${iconHtml}
            </div>
            <div class="units-dot-label">Lesson ${i}</div>
          </div>
        `;
        globalDotIndex++;
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

  // re-init lucide icons for dynamically added HTML
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // 3. Attach click handlers to available/completed dots
  pathContainer.querySelectorAll(".roadmap-dot.available, .roadmap-dot.completed").forEach((dot) => {
    dot.addEventListener("click", () => {
      const { level, skill, unit, index } = dot.dataset;
      window.location.href = `lesson.html?level=${level}&type=${skill}&unit=${unit}&lessonIndex=${index}`;
    });
  });

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
          <span class="rec-card-tag ${level}">${getTranslation(selectedLang, LEVEL_CONFIG[level].label) || LEVEL_CONFIG[level].fallback}</span>
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
      const mobileMoreBtn  = document.getElementById("mobile-more-btn");
      if (MORE_SECTIONS.includes(section)) {
        if (desktopMoreBtn) desktopMoreBtn.classList.add("active");
        if (mobileMoreBtn)  mobileMoreBtn.classList.add("active");
      } else {
        if (desktopMoreBtn) desktopMoreBtn.classList.remove("active");
        if (mobileMoreBtn)  mobileMoreBtn.classList.remove("active");
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
  const level = profile.currentLevel || profile.assessmentLevel || "beginner";
  const levelLabel = getTranslation(selectedLang, LEVEL_CONFIG[level].label) || LEVEL_CONFIG[level].fallback;

  const profileNameEl = document.getElementById("profile-name");
  if (profileNameEl) {
    profileNameEl.innerHTML = `
      <span>${profile.fullName || "User"}</span>
      <span style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.75rem; border-radius: 9999px; vertical-align: middle; margin-left: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(99,102,241,0.3);">⭐ ${levelLabel}</span>
    `;
  }
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
        icon: "<i data-lucide=\"target\"></i>",
        label:
          getTranslation(selectedLang, "badgeEvaluatedLabel") || "Evaluated",
        desc:
          getTranslation(selectedLang, "badgeEvaluatedDesc") ||
          "Completed initial assessment",
      },
      {
        id: "firstLesson",
        icon: "<i data-lucide=\"sprout\"></i>",
        label:
          getTranslation(selectedLang, "badgeFirstStepsLabel") || "First Steps",
        desc:
          getTranslation(selectedLang, "badgeFirstStepsDesc") ||
          "Completed your first lesson",
      },
      {
        id: "alphabetMaster",
        icon: "<i data-lucide=\"type\"></i>",
        label:
          getTranslation(selectedLang, "badgeLetterKingLabel") || "Letter King",
        desc:
          getTranslation(selectedLang, "badgeLetterKingDesc") ||
          "Mastered the alphabets unit",
      },
      {
        id: "beginnerGraduate",
        icon: "<i data-lucide=\"medal\"></i>",
        label:
          getTranslation(selectedLang, "badgeBeginnerGradLabel") ||
          "Beginner Graduate",
        desc:
          getTranslation(selectedLang, "badgeBeginnerGradDesc") ||
          "Mastered all beginner skills",
      },
      {
        id: "intermediateGraduate",
        icon: "<i data-lucide=\"medal\"></i>",
        label:
          getTranslation(selectedLang, "badgeIntermediateGradLabel") ||
          "Intermediate Graduate",
        desc:
          getTranslation(selectedLang, "badgeIntermediateGradDesc") ||
          "Mastered all intermediate skills",
      },
      {
        id: "advancedGraduate",
        icon: "<i data-lucide=\"medal\"></i>",
        label:
          getTranslation(selectedLang, "badgeAdvancedGradLabel") ||
          "Advanced Graduate",
        desc:
          getTranslation(selectedLang, "badgeAdvancedGradDesc") ||
          "Mastered all advanced skills",
      },
      {
        id: "streak5",
        icon: "<i data-lucide=\"flame\"></i>",
        label:
          getTranslation(selectedLang, "badgeStreak5Label") || "5-Day Streak",
        desc:
          getTranslation(selectedLang, "badgeStreak5Desc") ||
          "Practiced 5 days in a row",
      },
      {
        id: "streak10",
        icon: "<i data-lucide=\"flame\"></i>",
        label:
          getTranslation(selectedLang, "badgeStreak10Label") || "10-Day Streak",
        desc:
          getTranslation(selectedLang, "badgeStreak10Desc") ||
          "Practiced 10 days in a row",
      },
      {
        id: "streak30",
        icon: "<i data-lucide=\"flame\"></i>",
        label:
          getTranslation(selectedLang, "badgeStreak30Label") || "30-Day Streak",
        desc:
          getTranslation(selectedLang, "badgeStreak30Desc") ||
          "Practiced 30 days in a row",
      },
      {
        id: "gameWinner",
        icon: "<i data-lucide=\"gamepad-2\"></i>",
        label:
          getTranslation(selectedLang, "badgeMatchMasterLabel") ||
          "Match Master",
        desc:
          getTranslation(selectedLang, "badgeMatchMasterDesc") ||
          "Won a Word Match game",
      },
      {
        id: "gameChampion",
        icon: "<i data-lucide=\"trophy\"></i>",
        label:
          getTranslation(selectedLang, "badgeGameChampionLabel") ||
          "Game Champion",
        desc:
          getTranslation(selectedLang, "badgeGameChampionDesc") ||
          "Won 10 games",
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
        <div class="badge-card-item ${isEarned ? "earned" : "locked"}" title="${tooltip}">
          <div class="badge-icon-circle">${b.icon}</div>
          ${!isEarned ? '<div class="badge-lock-overlay"><i data-lucide="lock" class="inline-icon"></i></div>' : ""}
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

  applyTheme(profile.activeTheme || "default");

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
                const expected = translatedTarget
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
                    ${isCurrentUser ? `<span style="background: #6366f1; color: white; padding: 0.12rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px;">YOU</span>` : ""}
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
