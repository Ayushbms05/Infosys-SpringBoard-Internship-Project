/**
 * analysis.js — Learning Analysis Page Logic
 *
 * Everything on this page is computed from real Firestore data:
 *   - lessonHistory subcollection (per-attempt accuracy/type/timestamp,
 *     logged by lesson.js on every lesson completion)
 *   - the user's profile document (streak, xp, curriculum, practiceDays,
 *     and the one-time geminiAnalysis snapshot from assessment day)
 */

window.Analysis = (function () {
  let isInitialized = false;
  let lastProfile = null;
  let lastHistory = [];

  const SKILL_META = {
    reading: { icon: "📖", label: "Reading" },
    writing: { icon: "✍️", label: "Writing" },
    listening: { icon: "🎧", label: "Listening" },
    speaking: { icon: "🗣️", label: "Speaking" },
    pronunciation: { icon: "🔤", label: "Pronunciation" },
  };

  async function init(profile) {
    lastProfile = profile;
    if (isInitialized) return;
    isInitialized = true;

    try {
      const uid = profile.uid || auth.currentUser?.uid;
      if (!uid) return;
      lastHistory = await fetchLessonHistory(uid);
      renderAll();
    } catch (err) {
      console.error("Error loading analysis page:", err);
    }
  }

  function reRenderLang(profile) {
    if (!isInitialized) return;
    if (profile) lastProfile = profile;
    renderAll();
  }

  function renderAll() {
    if (!lastProfile) return;
    renderOverviewStats(lastHistory, lastProfile);
    renderSkillBreakdown(lastHistory);
    renderDailyPracticeTime(lastHistory);
    renderAccuracyTrend(lastHistory);
    renderActivityCalendar(lastProfile);
    renderCurriculumProgress(lastProfile.curriculum);
    renderAssessmentSnapshot(lastProfile);
  }

  // ─── Data Fetching ──────────────────────────────────────────────

  async function fetchLessonHistory(uid) {
    try {
      const snap = await db
        .collection("users")
        .doc(uid)
        .collection("lessonHistory")
        .orderBy("completedAt", "asc")
        .get();

      return snap.docs.map((doc) => {
        const d = doc.data();
        return {
          type: d.type || "reading",
          level: d.level || "beginner",
          unit: d.unit || "alphabets",
          accuracy: typeof d.accuracy === "number" ? d.accuracy : 0,
          xpEarned: d.xpEarned || 0,
          durationSeconds:
            typeof d.durationSeconds === "number" ? d.durationSeconds : 0,
          completedAt:
            d.completedAt && d.completedAt.toDate ? d.completedAt.toDate() : null,
        };
      });
    } catch (err) {
      console.warn("No lesson history available yet:", err);
      return [];
    }
  }

  // ─── Overview Stats ───────────────────────────────────────────

  function renderOverviewStats(history, profile) {
    const totalLessonsEl = document.getElementById("stat-total-lessons");
    const avgAccuracyEl = document.getElementById("stat-avg-accuracy");
    const bestSkillEl = document.getElementById("stat-best-skill");
    const streakEl = document.getElementById("stat-current-streak");

    if (streakEl) streakEl.textContent = profile.streak || 0;

    if (!history.length) {
      if (totalLessonsEl) totalLessonsEl.textContent = "0";
      if (avgAccuracyEl) avgAccuracyEl.textContent = "—";
      if (bestSkillEl) bestSkillEl.textContent = "—";
      return;
    }

    if (totalLessonsEl) totalLessonsEl.textContent = history.length;

    const avgAccuracy = Math.round(
      history.reduce((sum, h) => sum + h.accuracy, 0) / history.length,
    );
    if (avgAccuracyEl) avgAccuracyEl.textContent = avgAccuracy + "%";

    const bySkill = groupBySkill(history);
    let bestSkill = null;
    let bestAvg = -1;
    Object.keys(bySkill).forEach((type) => {
      const attempts = bySkill[type];
      const avg = attempts.reduce((s, a) => s + a.accuracy, 0) / attempts.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestSkill = type;
      }
    });
    if (bestSkillEl) {
      bestSkillEl.textContent = bestSkill
        ? SKILL_META[bestSkill]?.label || bestSkill
        : "—";
    }
  }

  function groupBySkill(history) {
    const groups = {};
    history.forEach((h) => {
      if (!groups[h.type]) groups[h.type] = [];
      groups[h.type].push(h);
    });
    return groups;
  }

  // ─── Skill Breakdown ──────────────────────────────────────────

  function renderSkillBreakdown(history) {
    const container = document.getElementById("skill-breakdown-bars");
    const emptyState = document.getElementById("skill-breakdown-empty");
    if (!container) return;

    if (!history.length) {
      container.innerHTML = "";
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }
    if (emptyState) emptyState.classList.add("hidden");

    const bySkill = groupBySkill(history);
    const skillTypes = Object.keys(SKILL_META);

    const html = skillTypes
      .map((type) => {
        const attempts = bySkill[type] || [];
        const meta = SKILL_META[type];

        if (!attempts.length) {
          return `<div class="skill-bar-item" style="opacity:0.45;">
          <div class="skill-bar-meta">
            <span class="skill-bar-label"><span class="skill-bar-icon">${meta.icon}</span> ${meta.label}</span>
            <span class="skill-bar-status-tag" style="background:rgba(108,99,255,0.08);color:var(--color-text-muted)">${getTranslation(selectedLang, "noAttemptsSkillLabel")}</span>
          </div>
          <div class="skill-bar-track"><div class="skill-bar-fill" style="width:0%"></div></div>
        </div>`;
        }

        const avg = Math.round(
          attempts.reduce((s, a) => s + a.accuracy, 0) / attempts.length,
        );
        let statusCfg;
        if (avg >= 75)
          statusCfg = {
            label: getTranslation(selectedLang, "skillStatusStrong"),
            color: "var(--color-accent)",
            bg: "rgba(0,212,170,0.15)",
          };
        else if (avg >= 50)
          statusCfg = {
            label: getTranslation(selectedLang, "skillStatusImproving"),
            color: "var(--color-warm-light,#f59e0b)",
            bg: "rgba(245,158,11,0.15)",
          };
        else
          statusCfg = {
            label: getTranslation(selectedLang, "skillStatusNeedsWork"),
            color: "var(--color-error,#ef4444)",
            bg: "rgba(239,68,68,0.15)",
          };

        return `<div class="skill-bar-item">
        <div class="skill-bar-meta">
          <span class="skill-bar-label"><span class="skill-bar-icon">${meta.icon}</span> ${meta.label} <span style="color:var(--color-text-muted);font-weight:500;">(${attempts.length} attempt${attempts.length === 1 ? "" : "s"})</span></span>
          <span class="skill-bar-status-tag" style="background:${statusCfg.bg};color:${statusCfg.color}">${statusCfg.label} · ${avg}%</span>
        </div>
        <div class="skill-bar-track"><div class="skill-bar-fill" data-pct="${avg}" style="width:0%;background:${statusCfg.color}"></div></div>
      </div>`;
      })
      .join("");

    container.innerHTML = html;

    requestAnimationFrame(() => {
      container.querySelectorAll(".skill-bar-fill").forEach((bar, i) => {
        setTimeout(() => {
          bar.style.width = bar.dataset.pct
            ? bar.dataset.pct + "%"
            : bar.style.width;
          bar.style.transition = "width 0.8s cubic-bezier(0.34,1.56,0.64,1)";
        }, i * 100);
      });
    });
  }

  // ─── Daily Practice Time ──────────────────────────────────────

  function renderDailyPracticeTime(history) {
    const container = document.getElementById("daily-time-chart");
    const summaryEl = document.getElementById("daily-time-summary");
    const emptyState = document.getElementById("daily-time-empty");
    if (!container) return;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: d.toISOString().split("T")[0],
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        seconds: 0,
      });
    }

    let anyRealData = false;
    history.forEach((h) => {
      if (!h.completedAt || !h.durationSeconds) return;
      const dateStr = h.completedAt.toISOString
        ? h.completedAt.toISOString().split("T")[0]
        : null;
      const day = days.find((d) => d.dateStr === dateStr);
      if (day) {
        day.seconds += h.durationSeconds;
        anyRealData = true;
      }
    });

    if (!history.length) {
      container.innerHTML = "";
      if (summaryEl) summaryEl.textContent = "";
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }
    if (emptyState) emptyState.classList.add("hidden");

    const maxSeconds = Math.max(...days.map((d) => d.seconds), 60);

    const html = days
      .map((d) => {
        const mins = Math.round(d.seconds / 60);
        const heightPct =
          d.seconds > 0 ? Math.max((d.seconds / maxSeconds) * 100, 4) : 0;
        const isToday = d.dateStr === new Date().toISOString().split("T")[0];
        return `<div class="bar-col" title="${d.label} — ${mins} min">
        <div class="bar-fill ${isToday ? "active" : ""} ${d.seconds === 0 ? "empty" : ""}" style="height:${heightPct}%;"></div>
        <span class="bar-label ${isToday ? "active" : ""}">${d.label}</span>
      </div>`;
      })
      .join("");

    container.innerHTML = html;

    const totalMins = Math.round(days.reduce((s, d) => s + d.seconds, 0) / 60);
    const todayMins = Math.round(
      (days.find((d) => d.dateStr === new Date().toISOString().split("T")[0])
        ?.seconds || 0) / 60,
    );

    if (summaryEl) {
      if (!anyRealData) {
        summaryEl.innerHTML = `Time tracking just started — check back after your next lesson to see minutes here.`;
      } else {
        summaryEl.innerHTML = `You've practiced <strong>${todayMins} minute${todayMins === 1 ? "" : "s"}</strong> today, and <strong>${totalMins} minute${totalMins === 1 ? "" : "s"}</strong> over the last 7 days.`;
      }
    }
  }

  // ─── Accuracy Trend ───────────────────────────────────────────

  function renderAccuracyTrend(history) {
    const container = document.getElementById("accuracy-trend-chart");
    const summaryEl = document.getElementById("accuracy-trend-summary");
    const emptyState = document.getElementById("accuracy-trend-empty");
    if (!container) return;

    if (!history.length) {
      container.innerHTML = "";
      if (summaryEl) summaryEl.textContent = "";
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }
    if (emptyState) emptyState.classList.add("hidden");

    const recent = history.slice(-12);

    const html = recent
      .map((h, idx) => {
        const isLast = idx === recent.length - 1;
        const meta = SKILL_META[h.type] || { icon: "📖", label: h.type };
        const dateLabel = h.completedAt
          ? h.completedAt.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          : "";
        return `<div class="bar-col" title="${meta.label} — ${h.accuracy}% — ${dateLabel}">
        <div class="bar-fill ${isLast ? "active" : ""}" style="height:${Math.max(h.accuracy, 3)}%;"></div>
        <span class="bar-label ${isLast ? "active" : ""}">${meta.icon}</span>
      </div>`;
      })
      .join("");

    container.innerHTML = html;

    const avgRecent = Math.round(
      recent.reduce((s, h) => s + h.accuracy, 0) / recent.length,
    );
    if (summaryEl) {
      summaryEl.innerHTML = `Averaging <strong>${avgRecent}%</strong> accuracy across your last ${recent.length} attempt${recent.length === 1 ? "" : "s"}.`;
    }
  }

  // ─── Activity Calendar ────────────────────────────────────────

  function renderActivityCalendar(profile) {
    const practiceDays = profile.practiceDays || [];
    const streak = profile.streak || 0;
    
    const streakBadge = document.getElementById("analysis-cal-streak-count");
    if (streakBadge) streakBadge.textContent = streak;

    const grid = document.getElementById("analysis-cal-grid");
    const monthLabel = document.getElementById("analysis-cal-month-year");
    if (!grid || !monthLabel) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    monthLabel.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = "";
    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-cell empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const m = String(month + 1).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      const dateStr = `${year}-${m}-${d}`;

      const isPracticed = practiceDays.includes(dateStr);
      const isToday = day === today.getDate();

      let classes = "cal-cell";
      if (isPracticed) classes += " practiced";
      if (isToday) classes += " today";

      html += `<div class="${classes}">${day}</div>`;
    }

    grid.innerHTML = html;
  }

  // ─── Curriculum Progress ──────────────────────────────────────

  function renderCurriculumProgress(curriculum) {
    const container = document.getElementById("curriculum-progress-list");
    if (!container) return;

    if (!curriculum) {
      container.innerHTML = `<div class="analysis-empty-state">No curriculum data yet — complete your initial assessment to get started.</div>`;
      return;
    }

    const levels = [
      { key: "beginner", icon: "🌱", color: "amber" },
      { key: "intermediate", icon: "📘", color: "purple" },
      { key: "advanced", icon: "🚀", color: "teal" },
    ];
    const skills = [
      "reading",
      "writing",
      "listening",
      "speaking",
      "pronunciation",
    ];

    const html = levels
      .map((lvl) => {
        const levelData = curriculum[lvl.key] || {};
        let completedSkills = 0;
        let skippedSkills = 0;
        let needsReviewSkills = 0;

        skills.forEach((s) => {
          const status = levelData[s] && levelData[s].status;
          if (status === "completed") completedSkills++;
          else if (status === "skipped") skippedSkills++;
          else if (status === "needsReview") needsReviewSkills++;
        });

        const allSkipped = skippedSkills === skills.length;
        const percent = Math.round((completedSkills / skills.length) * 100);

        let rightLabel, barClass, barWidth;
        if (allSkipped) {
          rightLabel = getTranslation(selectedLang, "placedAboveLevel");
          barClass = "skipped";
          barWidth = 100;
        } else {
          const skillsWord = getTranslation(selectedLang, "skillsWord") || "skills";
          rightLabel = `${completedSkills}/${skills.length} ${skillsWord} · ${percent}%`;
          if (needsReviewSkills > 0) {
            rightLabel += ` (${needsReviewSkills} ${getTranslation(selectedLang, "needsReviewLabel")})`;
          }
          barClass = lvl.color;
          barWidth = percent;
        }

        return `<div class="progress-item">
        <div class="progress-item-icon">${lvl.icon}</div>
        <div class="progress-item-info">
          <div class="progress-item-label">
            <span>${lvl.key.charAt(0).toUpperCase() + lvl.key.slice(1)}</span>
            <span>${rightLabel}</span>
          </div>
          <div class="progress-item-bar">
            <div class="progress-item-fill ${barClass}" style="width: ${barWidth}%"></div>
          </div>
        </div>
      </div>`;
      })
      .join("");

    container.innerHTML = html;
  }

  // ─── Assessment Snapshot ──────────────────────────────────────

  function renderAssessmentSnapshot(profile) {
    const container = document.getElementById("assessment-snapshot-content");
    const emptyState = document.getElementById("assessment-snapshot-empty");
    if (!container) return;

    const analysis = profile.geminiAnalysis;
    if (!analysis) {
      container.innerHTML = "";
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }
    if (emptyState) emptyState.classList.add("hidden");

    let html = "";

    if (profile.assessmentScore || profile.assessmentLevel) {
      const levelTag = profile.assessmentLevel || "beginner";
      const levelLabel = levelTag.charAt(0).toUpperCase() + levelTag.slice(1);
      html += `<div style="margin-bottom:1.25rem;">
        <span class="rec-card-tag ${levelTag}">Scored ${profile.assessmentScore || 0}% · ${levelLabel} Level</span>
      </div>`;
    }

    if (analysis.summaryMessage) {
      html += `<div class="assessment-quote-box">${analysis.summaryMessage}</div>`;
    }

    if (analysis.goodPoints && analysis.weakPoints) {
      html += `<div class="assessment-points-grid">
        <div class="assessment-points-col">
          <h4 style="color:var(--color-accent);">${getTranslation(selectedLang, "strengthsLabel")}</h4>
          ${analysis.goodPoints.map((p) => `<div class="assessment-point-row strength"><span class="assessment-point-icon">🌟</span><span>${p}</span></div>`).join("")}
        </div>
        <div class="assessment-points-col">
          <h4 style="color:var(--color-error, #ef4444);">${getTranslation(selectedLang, "improveLabel")}</h4>
          ${analysis.weakPoints.map((p) => `<div class="assessment-point-row improve"><span class="assessment-point-icon">📌</span><span>${p}</span></div>`).join("")}
        </div>
      </div>`;
    }

    if (analysis.skillBreakdown && analysis.skillBreakdown.length) {
      html += `<div class="assessment-skill-chips">
        ${analysis.skillBreakdown.map((s) => `<span class="assessment-skill-chip">${s.icon || "📌"} ${s.skill}: ${s.status || ""}</span>`).join("")}
      </div>`;
    }

    container.innerHTML = html;
  }

  return { init, reRenderLang };
})();
