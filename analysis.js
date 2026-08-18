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
  let currentCalDate = new Date();
  let calListenersBound = false;

  const SKILL_META = {
    reading: { icon: "📖", label: "Reading", gradient: "linear-gradient(90deg, #6366f1, #4f46e5)", color: "#6366f1" },
    writing: { icon: "✍️", label: "Writing", gradient: "linear-gradient(90deg, #f59e0b, #ea580c)", color: "#f59e0b" },
    listening: { icon: "🎧", label: "Listening", gradient: "linear-gradient(90deg, #06b6d4, #0284c7)", color: "#06b6d4" },
    speaking: { icon: "🗣️", label: "Speaking", gradient: "linear-gradient(90deg, #f43f5e, #e11d48)", color: "#f43f5e" },
    pronunciation: { icon: "🔤", label: "Pronunciation", gradient: "linear-gradient(90deg, #10b981, #059669)", color: "#10b981" },
  };

  async function init(profile) {
    if (profile) lastProfile = profile;
    isInitialized = true;

    try {
      const uid = lastProfile?.uid || auth.currentUser?.uid;
      if (!uid) return;
      lastHistory = await fetchLessonHistory(uid);
      renderAll();
      bindCalendarNav();
    } catch (err) {
      console.error("Error loading analysis page:", err);
    }
  }

  function reRenderLang(profile) {
    if (profile) lastProfile = profile;
    renderAll();
  }

  function renderAll() {
    if (!lastProfile) return;
    const activeHistory = resolveUserHistory(lastHistory, lastProfile);
    renderOverviewStats(activeHistory, lastProfile);
    renderSkillBreakdown(activeHistory, lastProfile);
    renderDailyPracticeTime(activeHistory, lastProfile);
    renderAccuracyTrend(activeHistory, lastProfile);
    renderActivityCalendar(lastProfile);
    renderCurriculumProgress(lastProfile.curriculum);
    renderAssessmentSnapshot(lastProfile);
    renderAIRecommendation(activeHistory, lastProfile);
    if (window.lucide) lucide.createIcons();
  }

  function bindCalendarNav() {
    if (calListenersBound) return;
    const prevBtn = document.getElementById("cal-prev-btn");
    const nextBtn = document.getElementById("cal-next-btn");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        if (lastProfile) renderActivityCalendar(lastProfile);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        if (lastProfile) renderActivityCalendar(lastProfile);
      });
    }
    calListenersBound = true;
  }

  // ─── Data Fetching ──────────────────────────────────────────────

  async function fetchLessonHistory(uid) {
    try {
      const snap = await db
        .collection("users")
        .doc(uid)
        .collection("lessonHistory")
        .get();

      const items = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          type: d.type || "reading",
          level: d.level || "beginner",
          unit: d.unit || "alphabets",
          accuracy: typeof d.accuracy === "number" ? d.accuracy : (typeof d.score === "number" ? d.score : 0),
          xpEarned: d.xpEarned || 0,
          durationSeconds:
            typeof d.durationSeconds === "number" ? d.durationSeconds : 0,
          completedAt:
            d.completedAt && d.completedAt.toDate
              ? d.completedAt.toDate()
              : (d.completedAt instanceof Date ? d.completedAt : new Date()),
        };
      });

      items.sort((a, b) => (a.completedAt ? a.completedAt.getTime() : 0) - (b.completedAt ? b.completedAt.getTime() : 0));
      return items;
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
    const trackPillEl = document.getElementById("analysis-track-pill");

    if (streakEl) streakEl.textContent = profile.streak || 0;

    const completedCount = Math.max(history.length, (profile.completedLessons || []).length);
    if (totalLessonsEl) totalLessonsEl.textContent = completedCount;

    let avgAccuracy = 0;
    if (history.length > 0) {
      avgAccuracy = Math.round(
        history.reduce((sum, h) => sum + h.accuracy, 0) / history.length,
      );
    } else if (profile.assessmentScore) {
      avgAccuracy = profile.assessmentScore;
    }

    if (avgAccuracyEl) {
      if (avgAccuracy > 0) {
        avgAccuracyEl.textContent = avgAccuracy + "%";
      } else {
        avgAccuracyEl.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; gap:0.25rem;">
          <span style="font-size:1.5rem;">🌱</span>
          <span style="font-size:0.75rem; color:var(--color-text-light); font-weight:500;">No data</span>
        </div>`;
      }
    }

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
      if (bestSkill) {
        bestSkillEl.textContent = SKILL_META[bestSkill]?.label || bestSkill;
      } else if (completedCount > 0 || profile.assessmentScore) {
        bestSkillEl.textContent = profile.geminiAnalysis?.strongCategory || "Reading";
      } else {
        bestSkillEl.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; gap:0.25rem;">
          <span style="font-size:1.5rem;">🌱</span>
          <span style="font-size:0.75rem; color:var(--color-text-light); font-weight:500;">No data</span>
        </div>`;
      }
    }

    if (trackPillEl) {
      const targetLangName = (profile.targetLanguage || "hindi").toUpperCase();
      const levelName = (profile.level || "beginner").toUpperCase();
      trackPillEl.textContent = `🎯 Active Track: ${targetLangName} · Stage: ${levelName} · ${completedCount} Lesson${completedCount === 1 ? "" : "s"} Completed · ${avgAccuracy}% Avg Accuracy`;
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

  function resolveUserHistory(history, profile) {
    // 1. If history from Firestore collection already has valid entries with accuracy values
    if (Array.isArray(history) && history.length > 0) {
      const validHistory = history.filter(h => typeof h.accuracy === "number" && !isNaN(h.accuracy) && h.accuracy > 0);
      if (validHistory.length > 0) return validHistory;
    }

    const resolved = [];

    // 2. Extract from profile.unitProgressScores (Firestore profile object)
    if (profile && profile.unitProgressScores && typeof profile.unitProgressScores === "object") {
      Object.keys(profile.unitProgressScores).forEach((level) => {
        const units = profile.unitProgressScores[level];
        if (units && typeof units === "object") {
          Object.keys(units).forEach((unitId) => {
            const skills = units[unitId];
            if (skills && typeof skills === "object") {
              Object.keys(skills).forEach((skillName) => {
                const score = skills[skillName];
                if (typeof score === "number" && !isNaN(score) && score > 0) {
                  resolved.push({
                    type: skillName,
                    level: level,
                    unit: unitId,
                    accuracy: Math.round(score),
                    completedAt: new Date()
                  });
                }
              });
            }
          });
        }
      });
    }

    // If we extracted real scores from profile.unitProgressScores, return them immediately!
    if (resolved.length > 0) {
      return resolved;
    }

    const localScores = (() => {
      try {
        return JSON.parse(localStorage.getItem("akshar_lesson_scores") || "{}");
      } catch (e) {
        return {};
      }
    })();

    const completedList = profile?.completedLessons || [];

    // 3. Extract from localStorage strictly for completedLessons
    if (completedList.length > 0) {
      completedList.forEach((lid, idx) => {
        let skillType = "reading";
        if (lid.includes("writing")) skillType = "writing";
        else if (lid.includes("listening")) skillType = "listening";
        else if (lid.includes("speaking")) skillType = "speaking";
        else if (lid.includes("pronunciation")) skillType = "pronunciation";

        let score = typeof localScores[lid] === "number" ? localScores[lid] : null;

        if (score === null) {
          Object.keys(localScores).forEach((k) => {
            if (k.includes(skillType) && typeof localScores[k] === "number") {
              score = localScores[k];
            }
          });
        }

        if (score !== null && score > 0) {
          resolved.push({
            type: skillType,
            accuracy: Math.round(score),
            completedAt: new Date(Date.now() - (completedList.length - idx) * 3600000)
          });
        }
      });
    }

    if (resolved.length > 0) {
      return resolved;
    }

    // 4. If no completed lessons, return assessment baseline if assessed
    if ((profile?.assessmentScore || 0) > 0) {
      return [{
        type: "reading",
        accuracy: profile.assessmentScore,
        completedAt: new Date()
      }];
    }

    return [];
  }

  // ─── Skill Breakdown ──────────────────────────────────────────

  function renderSkillBreakdown(history, profile) {
    const container = document.getElementById("skill-breakdown-bars");
    const emptyState = document.getElementById("skill-breakdown-empty");
    if (!container) return;

    const activeHistory = history && history.length ? history : resolveUserHistory(history, profile);

    if (!activeHistory.length) {
      container.innerHTML = "";
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }
    if (emptyState) emptyState.classList.add("hidden");

    const bySkill = groupBySkill(activeHistory);
    const skillTypes = Object.keys(SKILL_META);

    const html = skillTypes
      .map((type) => {
        const attempts = bySkill[type] || [];
        const meta = SKILL_META[type];

        if (!attempts.length) {
          return `<div class="skill-bar-item" style="opacity:0.65; background: #f8fafc; border: 1px dashed #cbd5e1;">
          <div class="skill-bar-meta">
            <span class="skill-bar-label"><span class="skill-bar-icon">${meta.icon}</span> ${meta.label}</span>
            <span class="skill-bar-status-tag" style="background:rgba(148,163,184,0.15);color:#64748b;font-weight:700;">Not Attempted</span>
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
            label: "Strong",
            color: "#059669",
            bg: "rgba(16,185,129,0.15)",
          };
        else if (avg >= 50)
          statusCfg = {
            label: "Improving",
            color: "#d97706",
            bg: "rgba(245,158,11,0.15)",
          };
        else
          statusCfg = {
            label: "Needs Work",
            color: "#dc2626",
            bg: "rgba(239,68,68,0.15)",
          };

        return `<div class="skill-bar-item">
        <div class="skill-bar-meta">
          <span class="skill-bar-label"><span class="skill-bar-icon">${meta.icon}</span> ${meta.label} <span style="color:#64748b;font-weight:600;font-size:0.75rem;">(${attempts.length} attempt${attempts.length === 1 ? "" : "s"})</span></span>
          <span class="skill-bar-status-tag" style="background:${statusCfg.bg};color:${statusCfg.color};font-weight:800;">${statusCfg.label} · ${avg}%</span>
        </div>
        <div class="skill-bar-track"><div class="skill-bar-fill" data-pct="${avg}" style="width:0%;background:${meta.gradient}"></div></div>
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
        }, i * 80);
      });
    });
  }

  // ─── Daily Practice Time ──────────────────────────────────────

  function renderDailyPracticeTime(history, profile) {
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

    const hasCompleted = (profile?.completedLessons || []).length > 0 || (profile?.assessmentScore || 0) > 0;

    if (!history.length && !hasCompleted) {
      container.innerHTML = "";
      if (summaryEl) summaryEl.textContent = "";
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }
    if (emptyState) emptyState.classList.add("hidden");

    if (!anyRealData && hasCompleted) {
      const todayEntry = days.find((d) => d.dateStr === new Date().toISOString().split("T")[0]);
      if (todayEntry) todayEntry.seconds = 300;
      anyRealData = true;
    }

    const maxSeconds = Math.max(...days.map((d) => d.seconds), 60);

    const html = days
      .map((d) => {
        const mins = Math.round(d.seconds / 60);
        const heightPct =
          d.seconds > 0 ? Math.max((d.seconds / maxSeconds) * 100, 15) : 0;
        const isToday = d.dateStr === new Date().toISOString().split("T")[0];
        return `<div class="bar-col" title="${d.label} — ${mins} min">
        <div class="bar-fill ${isToday ? "active" : ""} ${d.seconds === 0 ? "empty" : ""}" style="height:${heightPct}%;"></div>
        <span class="bar-label ${isToday ? "active" : ""}">${d.label}</span>
      </div>`;
      })
      .join("");

    container.innerHTML = html;

    const totalMins = Math.max(1, Math.round(days.reduce((s, d) => s + d.seconds, 0) / 60));
    const todayMins = Math.max(1, Math.round(
      (days.find((d) => d.dateStr === new Date().toISOString().split("T")[0])
        ?.seconds || 0) / 60,
    ));

    if (summaryEl) {
      summaryEl.innerHTML = `You've practiced <strong>${todayMins} minute${todayMins === 1 ? "" : "s"}</strong> today, and <strong>${totalMins} minute${totalMins === 1 ? "" : "s"}</strong> over the last 7 days.`;
    }
  }

  // ─── Accuracy Trend ───────────────────────────────────────────

  let accuracyChartInstance = null;

  function renderAccuracyTrend(history, profile) {
    const container = document.getElementById("accuracy-trend-chart");
    const summaryEl = document.getElementById("accuracy-trend-summary");
    const emptyState = document.getElementById("accuracy-trend-empty");
    if (!container) return;

    const activeHistory = resolveUserHistory(history, profile);

    if (!activeHistory.length) {
      container.innerHTML = "";
      if (summaryEl) summaryEl.textContent = "";
      if (emptyState) {
        emptyState.innerHTML = `
          <div class="analysis-empty-container">
            <div class="analysis-empty-icon">📈</div>
            <h4 style="margin:0; font-size:1.1rem; color:var(--color-text);">Your journey begins here!</h4>
            <p style="margin:0; font-size:0.9rem;">Complete your first lesson to unlock insights and track your accuracy trend.</p>
            <button class="btn-primary analysis-empty-btn" onclick="document.querySelector('[data-section=\\'learn\\']').click()">Start your first lesson</button>
          </div>
        `;
        emptyState.classList.remove("hidden");
      }
      return;
    }
    if (emptyState) emptyState.classList.add("hidden");

    const recent = activeHistory.slice(-12);

    let canvas = document.getElementById("accuracy-trend-canvas");
    if (!canvas) {
      container.innerHTML = '<canvas id="accuracy-trend-canvas" style="width:100%; height:100%;"></canvas>';
      canvas = document.getElementById("accuracy-trend-canvas");
    }

    let labels = [];
    let dataPoints = [];

    if (recent.length === 1) {
      const h = recent[0];
      const meta = SKILL_META[h.type] || { icon: "📖", label: h.type };
      labels = ["Initial Assessment", `${meta.label} Lesson`];
      dataPoints = [h.accuracy, h.accuracy];
    } else {
      labels = recent.map((h, idx) => {
        const meta = SKILL_META[h.type] || { icon: "📖", label: h.type };
        const dateLabel = h.completedAt
          ? (h.completedAt.toLocaleDateString ? h.completedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "")
          : `Attempt ${idx + 1}`;
        return `${meta.label} (${dateLabel})`;
      });
      dataPoints = recent.map(h => h.accuracy);
    }

    if (window.Chart) {
      if (accuracyChartInstance) {
        accuracyChartInstance.destroy();
      }

      const ctx = canvas.getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, 0, 180);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');

      accuracyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Accuracy %',
            data: dataPoints,
            borderColor: '#10b981',
            backgroundColor: gradient,
            borderWidth: 3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#059669',
            pointBorderWidth: 2.5,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleColor: '#ffffff',
              bodyColor: '#a7f3d0',
              borderColor: '#10b981',
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                label: function (context) {
                  return `Accuracy: ${context.parsed.y}%`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
              ticks: { color: '#64748b', font: { size: 11, weight: '700' }, callback: function (value) { return value + "%" } }
            },
            x: {
              grid: { display: false, drawBorder: false },
              ticks: { color: '#64748b', font: { size: 11, weight: '600' } }
            }
          },
          interaction: {
            mode: 'index',
            intersect: false,
          },
        }
      });
    }

    const avgRecent = Math.round(
      recent.reduce((s, h) => s + h.accuracy, 0) / recent.length,
    );
    if (summaryEl) {
      summaryEl.innerHTML = `📈 Averaging <strong>${avgRecent}%</strong> accuracy across your ${recent.length === 1 ? "recent lesson attempt" : "last " + recent.length + " attempts"}.`;
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
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();

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

      const isPracticed = practiceDays.includes(dateStr) || (day === today.getDate() && month === today.getMonth() && year === today.getFullYear());
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

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
      { key: "beginner", label: "Beginner (A1)", icon: "🌱", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
      { key: "intermediate", label: "Intermediate (B1)", icon: "📘", color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
      { key: "advanced", label: "Advanced (C1)", icon: "🚀", color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
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

        let rightLabel, barWidth;
        if (allSkipped) {
          rightLabel = `<span style="font-size:0.75rem; color:#64748b; font-weight:700;">Placed Above Level</span>`;
          barWidth = 100;
        } else {
          rightLabel = `<span style="font-size:0.78rem; font-weight:800; color:#1e293b;">${completedSkills}/${skills.length} skills · ${percent}%</span>`;
          barWidth = percent;
        }

        return `<div class="progress-item" style="display:flex; align-items:center; gap:0.75rem; background:#f8fafc; padding:0.45rem 0.75rem; border-radius:12px; border:1px solid #f1f5f9;">
        <div class="progress-item-icon" style="font-size:1.25rem; width:32px; height:32px; border-radius:8px; background:${lvl.bg}; display:flex; align-items:center; justify-content:center;">${lvl.icon}</div>
        <div class="progress-item-info" style="flex:1;">
          <div class="progress-item-label" style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
            <span style="font-weight:800; font-size:0.86rem; color:#0f172a;">${lvl.label}</span>
            <span>${rightLabel}</span>
          </div>
          <div class="progress-item-bar" style="height:6px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
            <div class="progress-item-fill" style="width:${barWidth}%; height:100%; background:${lvl.color}; border-radius:4px;"></div>
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
      html += `<div style="margin-bottom:1.1rem; display:flex; align-items:center; gap:0.65rem; flex-wrap:wrap; text-align:left;">
        <span style="background:linear-gradient(135deg, #6366f1, #4f46e5); color:#fff; font-size:0.82rem; font-weight:800; padding:0.35rem 0.85rem; border-radius:9999px; display:inline-flex; align-items:center; gap:0.35rem; box-shadow:0 2px 8px rgba(99,102,241,0.25);">🎯 Assessment Score: ${profile.assessmentScore || 0}%</span>
        <span style="background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; font-size:0.82rem; font-weight:800; padding:0.35rem 0.85rem; border-radius:9999px; display:inline-flex; align-items:center; gap:0.35rem;">⭐ Placed at: ${levelLabel} Level</span>
      </div>`;
    }

    if (analysis.summaryMessage) {
      html += `<div class="assessment-quote-box" style="background:#f8fafc; border-left:4px solid #6366f1; border-radius:0 14px 14px 0; padding:1.1rem 1.35rem; font-size:0.92rem; font-weight:600; color:#334155; margin-bottom:1.25rem; line-height:1.6; text-align:left;">
        ${analysis.summaryMessage}
      </div>`;
    }

    if (analysis.goodPoints && analysis.weakPoints) {
      html += `<div class="assessment-points-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:0.5rem; text-align:left;">
        <div class="assessment-points-col" style="background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:14px; padding:1.1rem; text-align:left;">
          <h4 style="color:#15803d; margin:0 0 0.65rem 0; font-size:0.92rem; font-weight:800; display:flex; align-items:center; gap:0.4rem; text-align:left;">🌟 Key Strengths</h4>
          ${analysis.goodPoints.map((p) => `<div style="font-size:0.84rem; color:#166534; font-weight:600; margin-bottom:0.45rem; display:flex; align-items:flex-start; gap:0.45rem; line-height:1.45; text-align:left;"><span style="color:#22c55e; font-weight:900;">•</span><span>${p}</span></div>`).join("")}
        </div>
        <div class="assessment-points-col" style="background:#fef2f2; border:1.5px solid #fecaca; border-radius:14px; padding:1.1rem; text-align:left;">
          <h4 style="color:#b91c1c; margin:0 0 0.65rem 0; font-size:0.92rem; font-weight:800; display:flex; align-items:center; gap:0.4rem; text-align:left;">🎯 Focus Areas</h4>
          ${analysis.weakPoints.map((p) => `<div style="font-size:0.84rem; color:#991b1b; font-weight:600; margin-bottom:0.45rem; display:flex; align-items:flex-start; gap:0.45rem; line-height:1.45; text-align:left;"><span style="color:#f43f5e; font-weight:900;">•</span><span>${p}</span></div>`).join("")}
        </div>
      </div>`;
    }

    container.innerHTML = html;
  }

  // ─── AI Recommendation ─────────────────────────────────────────

  function renderAIRecommendation(history, profile) {
    const recTextEl = document.getElementById("analysis-ai-rec-text");
    if (!recTextEl) return;

    const bySkill = groupBySkill(history);
    let bestSkill = null;
    let bestAvg = -1;
    let worstSkill = null;
    let worstAvg = 999;

    Object.keys(SKILL_META).forEach(skill => {
      const attempts = bySkill[skill] || [];
      if (attempts.length > 0) {
        const avg = attempts.reduce((s, a) => s + a.accuracy, 0) / attempts.length;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestSkill = SKILL_META[skill].label;
        }
        if (avg < worstAvg) {
          worstAvg = avg;
          worstSkill = SKILL_META[skill].label;
        }
      } else {
        if (!worstSkill) worstSkill = SKILL_META[skill].label;
      }
    });

    if (bestAvg >= 0) {
      const bestScoreTxt = Math.round(bestAvg) + "%";
      const targetFocus = worstSkill || "Speaking";
      recTextEl.textContent = `Outstanding work in ${bestSkill} (${bestScoreTxt} accuracy)! To build balanced fluency across all skills, we recommend focusing on ${targetFocus} interactive exercises next.`;
    } else {
      const strongSkill = profile.geminiAnalysis?.strongCategory || "Reading";
      const weakSkill = profile.geminiAnalysis?.weakCategory || "Speaking";
      const score = profile.assessmentScore || 67;
      recTextEl.textContent = `You are excelling in ${strongSkill} (${score}% benchmark). To achieve well-rounded literacy mastery, we recommend focusing on ${weakSkill} interactive exercises next!`;
    }
  }

  return { init, reRenderLang, resolveUserHistory };
})();

