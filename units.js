/**
 * units.js — Units Learning Path (All Lessons Open for All Users)
 *
 * ═══════════════════════════════════════════════════════════════════
 * ISOLATION CONTRACT — read before editing
 * ═══════════════════════════════════════════════════════════════════
 * Reads from CURRICULUM (curriculum.js) and UNITS_CONTENT (units-content.js)
 * Keeps ALL units (Unit 1 to 10) and ALL lessons 100% open for all users.
 * ═══════════════════════════════════════════════════════════════════
 */

let _unitsProfile = null;

const UNIT_SKILLS = [
  { id: "reading",       icon: "<i data-lucide='book-open'></i>",  label: "Reading" },
  { id: "writing",       icon: "<i data-lucide='pen-tool'></i>",    label: "Writing" },
  { id: "listening",     icon: "<i data-lucide='headphones'></i>",  label: "Listening" },
  { id: "speaking",      icon: "<i data-lucide='mic'></i>",         label: "Speaking" },
  { id: "pronunciation", icon: "<i data-lucide='mic'></i>",         label: "Pronunciation" },
];

function getUnitExercises(unitId, skill) {
  if (typeof UNITS_CONTENT === "undefined") {
    console.error("[units.js] UNITS_CONTENT not loaded — did you include units-content.js?");
    return [];
  }
  const unitData = UNITS_CONTENT[unitId];
  if (!unitData) {
    console.warn(`[units.js] No content found for unit: ${unitId}`);
    return [];
  }
  const exercises = unitData[skill];
  if (!exercises || exercises.length === 0) {
    console.warn(`[units.js] No exercises found for ${unitId}/${skill}`);
    return [];
  }
  return exercises;
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
  console.log(`[units.js] ✅ Marked complete: unitProgress.${level}.${unitId}.${skill}`);
}

function computeUnitLockState(profile, level, unitId, unitIndex) {
  const states = {};
  for (const s of UNIT_SKILLS) {
    const done = unitLessonIsCompleted(profile, level, unitId, s.id);
    if (done) {
      states[s.id] = "completed";
    } else {
      states[s.id] = "available"; // Unlocked & open for all users!
    }
  }
  return states;
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

  let html = `
    <div class="roadmap-container zigzag-mode">
      <div class="units-path-wrapper" style="width: 100%;">
  `;

  let globalDotIndex = 0;

  allUnits.forEach((unitObj, uIndex) => {
    const lockStates = computeUnitLockState(profile, unitObj.level, unitObj.id, uIndex);
    const unitExercises = UNITS_CONTENT?.[unitObj.id] || {};

    html += `
      <div class="units-unit-card" style="margin-bottom: 2rem;">
        <div class="units-unit-header">
          <div class="units-unit-emoji">${unitObj.icon}</div>
          <div>
            <p class="units-unit-label">Unit ${uIndex + 1}</p>
            <h4 class="units-unit-title">${unitObj.title}</h4>
          </div>
        </div>
        <div class="units-dots-row">
    `;

    UNIT_SKILLS.forEach((skillDef) => {
      const state = lockStates[skillDef.id];
      const offsetX = Math.sin(globalDotIndex * 0.75) * 100;
      const hasContent = !!(unitExercises[skillDef.id] && unitExercises[skillDef.id].length > 0);
      let iconHtml = "";
      if (state === "completed") {
        iconHtml = `<i data-lucide="check" style="width:22px;height:22px;"></i>`;
      } else {
        iconHtml = skillDef.icon;
      }

      const tooltip = `${skillDef.label}: ${unitObj.title}${!hasContent ? " (coming soon)" : ""}`;

      html += `
        <div class="zigzag-node-wrap" style="transform: translateX(${offsetX}px);">
          <div class="roadmap-dot zigzag-dot ${state} units-dot${!hasContent ? " units-dot-no-content" : ""}"
               data-level="${unitObj.level}"
               data-unit-id="${unitObj.id}"
               data-unit-title="${unitObj.title}"
               data-skill="${skillDef.id}"
               title="${tooltip}">
            ${iconHtml}
          </div>
          <div class="units-dot-label">${skillDef.label}</div>
        </div>
      `;
      globalDotIndex++;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;
  container.innerHTML = html;

  if (typeof lucide !== "undefined") lucide.createIcons();

  container.querySelectorAll(".units-dot.available, .units-dot.completed").forEach((dot) => {
    dot.addEventListener("click", () => {
      const level     = dot.dataset.level;
      const unitId    = dot.dataset.unitId;
      const unitTitle = encodeURIComponent(dot.dataset.unitTitle);
      const skill     = dot.dataset.skill;
      window.location.href =
        `unit-lesson.html?level=${level}&unit=${unitId}&unitTitle=${unitTitle}&type=${skill}`;
    });
  });
}

function initUnitsTab(profile) {
  _unitsProfile = profile;
  renderUnitsPath(profile);
}
