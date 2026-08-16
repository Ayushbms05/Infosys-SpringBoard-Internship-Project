/**
 * units.js — Units Learning Path (All Lessons Open for All Users)
 *
 * ═══════════════════════════════════════════════════════════════════
 * ISOLATION CONTRACT
 * ═══════════════════════════════════════════════════════════════════
 * Reads from CURRICULUM (curriculum.js) and UNITS_CONTENT (units-content.js)
 * Keeps ALL units (Unit 1 to 10) and ALL lessons 100% open for all users.
 * ═══════════════════════════════════════════════════════════════════
 */

let _unitsProfile = null;
let _currentUnitFilter = "all";

const UNIT_SKILLS = [
  { id: "reading", icon: "book-open", label: "Reading", desc: "Read & Comprehend" },
  { id: "writing", icon: "edit-3", label: "Writing", desc: "Sentence Builder" },
  { id: "listening", icon: "headphones", label: "Listening", desc: "Audio Comprehension" },
  { id: "speaking", icon: "mic", label: "Speaking", desc: "Voice Dialogue" },
  { id: "pronunciation", icon: "volume-2", label: "Pronunciation", desc: "Speech Clarity" },
];

const UNIT_DESCRIPTIONS = {
  unit_greetings_numbers: "Learn foundational greetings, daily introductions, self-identity, and basic numerical counting.",
  unit_daily_life: "Master essential daily vocabulary around home life, telling time, and common household routines.",
  unit_family: "Explore relationships, family members, descriptions, and everyday social interactions.",
  unit_shopping: "Practice real-life market conversations, pricing, asking for items, and grocery shopping.",
  unit_work: "Vocabulary and phrases for job applications, workplace dialogues, and professional introductions.",
  unit_health: "Communicate with healthcare professionals, describe symptoms, medicines, and emergency scenarios.",
  unit_banking: "Navigate bank counters, financial terminology, filling deposit forms, and handling money securely.",
  unit_transit: "Ask for directions, purchase bus/train tickets, understand schedules, and navigate public transit.",
  unit_government: "Understand civic services, government offices, IDs, welfare schemes, and official procedures.",
  unit_workplace_comm: "Advanced workplace emails, meetings, collaborating with coworkers, and formal dialogues."
};

function getUnitExercises(unitId, skill) {
  if (typeof UNITS_CONTENT === "undefined") {
    console.error("[units.js] UNITS_CONTENT not loaded — did you include units-content.js?");
    return [];
  }
  const unitData = UNITS_CONTENT[unitId];
  if (!unitData) {
    return [];
  }
  const exercises = unitData[skill];
  return exercises || [];
}

function unitLessonIsCompleted(profile, level, unitId, skill) {
  const up = profile.unitProgress || {};
  return !!(up[level] && up[level][unitId] && up[level][unitId][skill]);
}

async function markUnitLessonComplete(uid, level, unitId, skill) {
  const fieldPath = `unitProgress.${level}.${unitId}.${skill}`;
  await db.collection("users").doc(uid).update({
    [fieldPath]: true
  });
}

function renderUnitsPath(profile) {
  _unitsProfile = profile;

  const container = document.getElementById("units-learning-path");
  if (!container) return;

  // Flatten all units into a single continuous list of units (Unit 1 to Unit 10)
  const allUnits = [];
  const levels = ["beginner", "intermediate", "advanced"];
  levels.forEach((level) => {
    const unitsInLevel = (typeof CURRICULUM !== "undefined" ? CURRICULUM[level] : null) || [];
    unitsInLevel.forEach((unitObj) => {
      allUnits.push({ ...unitObj, level });
    });
  });

  // Calculate total completed unit skills
  let totalUnitSkills = allUnits.length * UNIT_SKILLS.length;
  let completedUnitSkills = 0;

  allUnits.forEach((unitObj) => {
    UNIT_SKILLS.forEach((s) => {
      if (unitLessonIsCompleted(profile, unitObj.level, unitObj.id, s.id)) {
        completedUnitSkills++;
      }
    });
  });

  const overallPct = Math.min(100, Math.round((completedUnitSkills / totalUnitSkills) * 100));

  let html = `
    <!-- Units Hero Banner -->
    <div class="units-hero-card">
      <div class="path-hero-info">
        <div class="path-hero-badge">
          <i data-lucide="layout-grid" style="width: 14px; height: 14px;"></i>
          <span>Practical Life Curriculum</span>
        </div>
        <h2 class="path-hero-title">Real-World Themed Units</h2>
        <p class="path-hero-desc">
          Explore 10 themed modules with real-life vocabulary, practical everyday scenarios, dialogues, and exercises (100% unlocked for everyone).
        </p>
        <div class="path-hero-stats">
          <div class="path-stat-chip">
            <i data-lucide="layers" style="width: 15px; height: 15px; color: #a5b4fc;"></i>
            <span>10 Themed Units</span>
          </div>
          <div class="path-stat-chip">
            <i data-lucide="check-circle" style="width: 15px; height: 15px; color: #34d399;"></i>
            <span>${completedUnitSkills} / ${totalUnitSkills} Skills Mastered (${overallPct}%)</span>
          </div>
          <div class="path-stat-chip">
            <i data-lucide="unlock" style="width: 15px; height: 15px; color: #fbbf24;"></i>
            <span>Open Access Track</span>
          </div>
        </div>
      </div>

      <!-- Level Filter Row -->
      <div class="units-filters-row">
        <button class="unit-filter-btn ${_currentUnitFilter === 'all' ? 'active' : ''}" data-filter="all">All Units (10)</button>
        <button class="unit-filter-btn ${_currentUnitFilter === 'beginner' ? 'active' : ''}" data-filter="beginner">🌱 Beginner (Units 1-4)</button>
        <button class="unit-filter-btn ${_currentUnitFilter === 'intermediate' ? 'active' : ''}" data-filter="intermediate">⚡ Intermediate (Units 5-8)</button>
        <button class="unit-filter-btn ${_currentUnitFilter === 'advanced' ? 'active' : ''}" data-filter="advanced">👑 Advanced (Units 9-10)</button>
      </div>
    </div>

    <!-- Units Cards Grid -->
    <div class="units-grid-wrapper" id="units-cards-grid">
  `;

  allUnits.forEach((unitObj, uIndex) => {
    if (_currentUnitFilter !== "all" && unitObj.level !== _currentUnitFilter) {
      return;
    }

    const unitExercises = UNITS_CONTENT?.[unitObj.id] || {};
    const unitDesc = UNIT_DESCRIPTIONS[unitObj.id] || "Master themed vocabulary and exercises for real-world scenarios.";

    let completedInUnit = 0;
    UNIT_SKILLS.forEach((s) => {
      if (unitLessonIsCompleted(profile, unitObj.level, unitObj.id, s.id)) {
        completedInUnit++;
      }
    });

    const levelBadgeText = unitObj.level.charAt(0).toUpperCase() + unitObj.level.slice(1);

    html += `
      <div class="unit-showcase-card" data-unit-id="${unitObj.id}" data-level="${unitObj.level}">
        <div>
          <div class="unit-showcase-header">
            <div class="unit-showcase-emoji">${unitObj.icon}</div>
            <div class="unit-showcase-meta">
              <div class="unit-showcase-top-row">
                <span class="unit-num-pill">UNIT 0${uIndex + 1}</span>
                <span class="unit-level-badge">${levelBadgeText}</span>
              </div>
              <h3 class="unit-showcase-title">${unitObj.title}</h3>
            </div>
          </div>
          <p style="font-size: 0.85rem; color: #64748b; font-weight: 600; line-height: 1.45; margin: 0 0 1.25rem;">
            ${unitDesc}
          </p>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.76rem; font-weight: 800; color: #475569;">
            <span>Unit Mastery</span>
            <span>${completedInUnit} of 5 Skills</span>
          </div>
          <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 9999px; overflow: hidden; margin-bottom: 1.25rem;">
            <div style="height: 100%; width: ${(completedInUnit / 5) * 100}%; background: linear-gradient(90deg, #6366f1, #10b981); border-radius: 9999px;"></div>
          </div>

          <div class="unit-skills-list">
    `;

    UNIT_SKILLS.forEach((skillDef) => {
      const isDone = unitLessonIsCompleted(profile, unitObj.level, unitObj.id, skillDef.id);
      const hasContent = !!(unitExercises[skillDef.id] && unitExercises[skillDef.id].length > 0);
      
      let localScores = {};
      try {
        localScores = JSON.parse(localStorage.getItem("akshar_lesson_scores") || "{}");
      } catch (e) {}

      const unitScoreKey = `unit_${unitObj.level}_${unitObj.id}_${skillDef.id}`;
      const sVal = profile.unitProgressScores?.[unitObj.level]?.[unitObj.id]?.[skillDef.id]
        || localScores[unitScoreKey]
        || 100;

      const statusText = isDone ? `✓ Score: ${sVal}%` : "Practice ➔";
      const completedClass = isDone ? "completed" : "";

      html += `
        <div class="unit-skill-btn ${completedClass}" 
             data-level="${unitObj.level}"
             data-unit-id="${unitObj.id}"
             data-unit-title="${unitObj.title}"
             data-skill="${skillDef.id}">
          <div class="unit-skill-btn-left">
            <div class="unit-skill-btn-icon">
              <i data-lucide="${skillDef.icon}" style="width: 15px; height: 15px;"></i>
            </div>
            <div>
              <div class="unit-skill-btn-title">${skillDef.label}</div>
              <div style="font-size: 0.72rem; color: #64748b; font-weight: 600;">5 Exercises</div>
            </div>
          </div>
          <div class="unit-skill-btn-status">
            <span>${statusText}</span>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;
  });

  html += `
    </div>
  `;
  container.innerHTML = html;

  if (typeof lucide !== "undefined") lucide.createIcons();

  // Attach click listeners to skill buttons
  container.querySelectorAll(".unit-skill-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const level = btn.dataset.level;
      const unitId = btn.dataset.unitId;
      const unitTitle = encodeURIComponent(btn.dataset.unitTitle);
      const skill = btn.dataset.skill;
      window.location.href = `unit-lesson.html?level=${level}&unit=${unitId}&unitTitle=${unitTitle}&type=${skill}`;
    });
  });

  // Attach filter handlers
  container.querySelectorAll(".unit-filter-btn").forEach((fBtn) => {
    fBtn.addEventListener("click", () => {
      _currentUnitFilter = fBtn.dataset.filter;
      renderUnitsPath(_unitsProfile);
    });
  });
}

function initUnitsTab(profile) {
  _unitsProfile = profile;
  renderUnitsPath(profile);
}
