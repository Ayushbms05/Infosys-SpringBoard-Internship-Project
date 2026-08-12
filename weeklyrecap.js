/**
 * weeklyrecap.js — Celebratory "Week in Review" Recap Engine
 *
 * ═══════════════════════════════════════════════════════════════════
 * ISOLATION CONTRACT:
 *   ❌  Does NOT modify lesson.js, units.js, curriculum.js, handwriting.js,
 *       leagues.js, or studygroups.js
 *   ❌  Does NOT alter XP or streak calculations
 *   ✅  Reads user profile & weekly snapshots
 *   ✅  Silently snapshots end-of-week stats without intrusive auto-popups on refresh
 *   ✅  Opens clean on-demand Weekly Recap modal with Lucide icons
 * ═══════════════════════════════════════════════════════════════════
 */

let recapProfile = null;

// ── ISO Week Helper ───────────────────────────────────────────────
function getRecapWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ── Get Previous Week ID ──────────────────────────────────────────
function getPreviousWeekId(currentWeekId) {
  const [yearStr, weekStr] = currentWeekId.split("-W");
  let year = parseInt(yearStr, 10);
  let week = parseInt(weekStr, 10) - 1;

  if (week < 1) {
    year -= 1;
    week = 52;
  }
  return `${year}-W${String(week).padStart(2, '0')}`;
}

// ── Silent Snapshot Sync on Week Transition (No Auto-Popups) ──────
async function checkAndShowWeeklyRecap(profile) {
  recapProfile = profile || {};
  const user = auth.currentUser;
  if (!user) return;

  const currentWeek   = getRecapWeekId();
  const lastRecapWeek = recapProfile.lastRecapWeek;
  const totalXP       = recapProfile.xp || 0;
  const lessonsCount  = (recapProfile.completedLessons || []).length;

  if (totalXP === 0 && lessonsCount === 0) return;

  // Silently snapshot previous week metrics if week changed
  if (lastRecapWeek !== currentWeek) {
    const prevWeek   = getPreviousWeekId(currentWeek);
    const snapshotId = `${user.uid}_${prevWeek}`;
    try {
      const snapRef = db.collection("weeklySnapshots").doc(snapshotId);
      const snapDoc = await snapRef.get();
      if (!snapDoc.exists) {
        await snapRef.set({
          uid:              user.uid,
          weekId:           prevWeek,
          xpEarned:         recapProfile.weeklyLeagueXP || 0,
          lessonsCompleted: lessonsCount,
          createdAt:        firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      await db.collection("users").doc(user.uid).update({ lastRecapWeek: currentWeek });
      recapProfile.lastRecapWeek = currentWeek;
    } catch (err) {
      console.warn("[weeklyrecap.js] Silent snapshot error:", err);
    }
  }
}

// ── Render & Display Weekly Recap Modal (On-Demand) ───────────────
async function showWeeklyRecapModal(profile, targetPrevWeek) {
  recapProfile = profile || {};
  const user   = auth.currentUser;
  if (!user) return;

  const currentWeek  = getRecapWeekId();
  const prevWeek     = targetPrevWeek || getPreviousWeekId(currentWeek);
  const prevPrevWeek = getPreviousWeekId(prevWeek);

  let lastWeekXP = recapProfile.weeklyLeagueXP || 0;
  let prevWeekXP = 0;
  let xpDiffPct  = null;

  try {
    const lastSnapDoc = await db.collection("weeklySnapshots").doc(`${user.uid}_${prevWeek}`).get();
    if (lastSnapDoc.exists) {
      lastWeekXP = lastSnapDoc.data().xpEarned || lastWeekXP;
    }

    const prevSnapDoc = await db.collection("weeklySnapshots").doc(`${user.uid}_${prevPrevWeek}`).get();
    if (prevSnapDoc.exists) {
      prevWeekXP = prevSnapDoc.data().xpEarned || 0;
      if (prevWeekXP > 0) {
        xpDiffPct = Math.round(((lastWeekXP - prevWeekXP) / prevWeekXP) * 100);
      }
    }
  } catch (err) {
    console.warn("[weeklyrecap.js] Snapshot comparison fetch error:", err);
  }

  const tierId       = recapProfile.currentLeague || "bronze";
  const tierNameMap  = { bronze: "Bronze League", silver: "Silver League", gold: "Gold League", diamond: "Diamond League" };
  const tierName     = tierNameMap[tierId] || "Bronze League";

  const streak       = recapProfile.streak || 0;
  const totalLessons = (recapProfile.completedLessons || []).length;

  let headline = "Great Week!";
  let subtitle = `You earned <strong>${lastWeekXP} XP</strong> and kept your streak alive!`;

  if (lastWeekXP === 0) {
    headline = "Fresh Week Ahead!";
    subtitle = "Ready for a fresh start this week? Complete a lesson today to kickstart your practice!";
  } else if (lastWeekXP > 100) {
    headline = "Outstanding Achievement!";
    subtitle = `Amazing dedication! You racked up <strong>${lastWeekXP} XP</strong> this past week!`;
  }

  const existingModal = document.getElementById("weekly-recap-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "weekly-recap-modal";
  modal.className = "weekly-recap-modal-overlay";
  modal.innerHTML = `
    <div class="weekly-recap-card">
      <button class="weekly-recap-close-btn" id="recap-close-x">✕</button>
      
      <!-- Celebratory Banner -->
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="margin-bottom: 0.5rem; display: flex; justify-content: center;">
          <i data-lucide="sparkles" style="width: 48px; height: 48px; color: var(--color-primary);"></i>
        </div>
        <h3 style="margin: 0 0 0.4rem; font-size: 1.6rem; font-weight: 900; color: var(--color-text-primary);">${headline}</h3>
        <p style="margin: 0; color: var(--color-text-secondary); font-size: 0.95rem; line-height: 1.4;">${subtitle}</p>
      </div>

      <!-- Stats Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
        
        <div style="background: rgba(108, 99, 255, 0.07); border: 1px solid rgba(108, 99, 255, 0.2); padding: 1rem; border-radius: 14px; text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--color-primary); letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
            <i data-lucide="zap" style="width: 14px; height: 14px;"></i> Weekly Practice
          </div>
          <div style="font-size: 1.6rem; font-weight: 900; color: var(--color-text-primary); margin: 0.2rem 0;">${lastWeekXP} XP</div>
          ${xpDiffPct !== null ? `
            <div style="font-size: 0.75rem; font-weight: 700; color: ${xpDiffPct >= 0 ? '#00876c' : '#d63031'};">
              ${xpDiffPct >= 0 ? '▲ +' + xpDiffPct + '%' : '▼ ' + xpDiffPct + '%'} vs prior week
            </div>
          ` : '<div style="font-size: 0.75rem; color: var(--color-text-muted);">Past 7 Days</div>'}
        </div>

        <div style="background: rgba(255, 107, 107, 0.07); border: 1px solid rgba(255, 107, 107, 0.2); padding: 1rem; border-radius: 14px; text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #e8582f; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
            <i data-lucide="flame" style="width: 14px; height: 14px;"></i> Daily Streak
          </div>
          <div style="font-size: 1.6rem; font-weight: 900; color: var(--color-text-primary); margin: 0.2rem 0;">${streak} Days</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">Active Streak</div>
        </div>

        <div style="background: rgba(0, 212, 170, 0.07); border: 1px solid rgba(0, 212, 170, 0.2); padding: 1rem; border-radius: 14px; text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #00876c; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
            <i data-lucide="book-open" style="width: 14px; height: 14px;"></i> Total Lessons
          </div>
          <div style="font-size: 1.6rem; font-weight: 900; color: var(--color-text-primary); margin: 0.2rem 0;">${totalLessons}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">Mastered</div>
        </div>

        <div style="background: rgba(255, 215, 0, 0.1); border: 1px solid rgba(214, 158, 46, 0.3); padding: 1rem; border-radius: 14px; text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #b7791f; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
            <i data-lucide="trophy" style="width: 14px; height: 14px;"></i> League Standing
          </div>
          <div style="font-size: 1.3rem; font-weight: 900; color: var(--color-text-primary); margin: 0.2rem 0;">${tierName}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">Active Tier</div>
        </div>

      </div>

      <!-- Action Button -->
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <button class="btn-primary" id="recap-open-card-btn" style="width: 100%; padding: 0.8rem; font-size: 0.95rem; font-weight: 800; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <i data-lucide="share-2" style="width: 18px; height: 18px;"></i>
          <span>Share Progress Card</span>
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) lucide.createIcons();

  const closeModal = () => modal.remove();
  document.getElementById("recap-close-x").onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };

  document.getElementById("recap-open-card-btn").onclick = () => {
    closeModal();
    if (typeof openShareableCardModal === "function") {
      openShareableCardModal(recapProfile);
    }
  };
}
