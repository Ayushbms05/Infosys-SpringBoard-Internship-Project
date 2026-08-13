/**
 * leagues.js — Weekly Competitive Leagues Engine (Multilingual & Lucide Icons)
 *
 * ═══════════════════════════════════════════════════════════════════
 * ISOLATION & INTEGRITY GUARANTEES:
 *   ❌  Does NOT modify lesson.js, units.js, curriculum.js, or handwriting.js
 *   ❌  Does NOT alter total XP calculation or historical user XP
 *   ✅  Reads user profile & LEAGUE_TIERS (leagues-config.js)
 *   ✅  Uses getTranslation() for full 7-language support
 *   ✅  Uses clean Lucide Icons throughout the UI
 *   ✅  Manages cohort groups in leagueGroups/{groupId}
 * ═══════════════════════════════════════════════════════════════════
 */

let leaguesProfile = null;

// ── Translation Helper ────────────────────────────────────────────
function lTr(key) {
  const userLang = (leaguesProfile && leaguesProfile.preferredLanguage) || localStorage.getItem("akshargyan_lang") || "en";
  if (typeof getTranslation === "function") {
    return getTranslation(userLang, key);
  }
  return key;
}

// ── ISO Week ID Helper (e.g. "2026-W33") ─────────────────────────
function getISOWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ── Countdown helper until Sunday 23:59:59 UTC ────────────────────
function getTimeRemainingInWeek() {
  const now = new Date();
  const nextSunday = new Date(now);
  const dayOfWeek = now.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  nextSunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
  nextSunday.setHours(23, 59, 59, 999);

  const diffMs = nextSunday - now;
  const days  = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins  = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h ${mins}m remaining`;
}

// ── Main Entrypoint: Lazy Reset & Group Assignment ────────────────
async function initLeagues(profile) {
  leaguesProfile = profile || {};
  const user = auth.currentUser;
  if (!user) return;

  const currentWeek = getISOWeekId();
  const currentTier = leaguesProfile.currentLeague || "bronze";
  const lastWeek    = leaguesProfile.lastLeagueWeek;

  let groupId      = leaguesProfile.leagueGroupId;
  let resetNeeded  = lastWeek !== currentWeek;

  if (resetNeeded || !groupId) {
    try {
      groupId = await assignUserToLeagueGroup(user.uid, currentWeek, currentTier);

      const updateData = {
        lastLeagueWeek: currentWeek,
        currentLeague:  currentTier,
        leagueGroupId:  groupId
      };

      if (resetNeeded) {
        updateData.weeklyLeagueXP = 0;
        leaguesProfile.weeklyLeagueXP = 0;
      }

      await db.collection("users").doc(user.uid).update(updateData);
      leaguesProfile.lastLeagueWeek = currentWeek;
      leaguesProfile.leagueGroupId  = groupId;
      leaguesProfile.currentLeague  = currentTier;

      console.log(`[leagues.js] ✅ Assigned to group ${groupId} for ${currentWeek}`);
    } catch (err) {
      console.warn("[leagues.js] Error during group assignment:", err);
    }
  }

  renderLeaguesUI();
}

// ── Assign User to a Cohort Group (<30 members) ──────────────────
async function assignUserToLeagueGroup(uid, weekId, tierId) {
  const snap = await db.collection("leagueGroups")
    .where("weekId", "==", weekId)
    .where("tierId", "==", tierId)
    .get();

  let openGroupDoc = null;
  snap.forEach(doc => {
    if (!openGroupDoc) {
      const data = doc.data();
      const count = data.memberCount || (data.members || []).length;
      if (count < 30) {
        openGroupDoc = doc;
      }
    }
  });

  if (openGroupDoc) {
    const groupRef = openGroupDoc.ref;
    await groupRef.update({
      members:     firebase.firestore.FieldValue.arrayUnion(uid),
      memberCount: firebase.firestore.FieldValue.increment(1)
    });
    return openGroupDoc.id;
  }

  const newDocRef = await db.collection("leagueGroups").add({
    weekId:      weekId,
    tierId:      tierId,
    members:     [uid],
    memberCount: 1,
    createdAt:   firebase.firestore.FieldValue.serverTimestamp()
  });

  return newDocRef.id;
}

// ── Render Leagues View ───────────────────────────────────────────
async function renderLeaguesUI() {
  const container = document.getElementById("section-leagues");
  if (!container) return;

  const currentTierId = leaguesProfile.currentLeague || "bronze";
  const tierInfo      = LEAGUE_TIERS.find(t => t.id === currentTierId) || LEAGUE_TIERS[0];
  const timeRemaining = getTimeRemainingInWeek();

  container.innerHTML = `
    <div style="text-align: center; padding: 3rem;">
      <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
      <p style="color: var(--color-text-muted); font-weight: 600;">Loading group standings...</p>
    </div>
  `;

  // Fetch cohort group members
  let membersList = [];
  const groupId = leaguesProfile.leagueGroupId;

  if (groupId) {
    try {
      const groupDoc = await db.collection("leagueGroups").doc(groupId).get();
      if (groupDoc.exists) {
        const memberUids = groupDoc.data().members || [];
        
        if (memberUids.length > 0) {
          const chunks = [];
          for (let i = 0; i < memberUids.length; i += 10) {
            chunks.push(memberUids.slice(i, i + 10));
          }
          
          for (const chunk of chunks) {
            const userSnap = await db.collection("users")
              .where(firebase.firestore.FieldPath.documentId(), "in", chunk)
              .get();
            
            userSnap.forEach(d => {
              const uData = d.data();
              membersList.push({
                uid:            d.id,
                displayName:    uData.fullName || uData.displayName || "Learner",
                weeklyLeagueXP: uData.weeklyLeagueXP || 0,
                totalXP:        uData.xp || 0,
                avatar:         (uData.fullName || uData.displayName || "L").charAt(0).toUpperCase()
              });
            });
          }
        }
      }
    } catch (err) {
      console.warn("[leagues.js] Could not fetch group leaderboard:", err);
    }
  }

  const user = auth.currentUser;
  if (membersList.length === 0 && user) {
    membersList.push({
      uid:            user.uid,
      displayName:    leaguesProfile.fullName || "Learner",
      weeklyLeagueXP: leaguesProfile.weeklyLeagueXP || 0,
      totalXP:        leaguesProfile.xp || 0,
      avatar:         (leaguesProfile.fullName || "L").charAt(0).toUpperCase()
    });
  }

  membersList.sort((a, b) => b.weeklyLeagueXP - a.weeklyLeagueXP || b.totalXP - a.totalXP);

  const lucideIconMap = {
    bronze:  '<i data-lucide="shield" style="width: 42px; height: 42px; color: #cd7f32;"></i>',
    silver:  '<i data-lucide="award" style="width: 42px; height: 42px; color: #718096;"></i>',
    gold:    '<i data-lucide="trophy" style="width: 42px; height: 42px; color: #d69e2e;"></i>',
    diamond: '<i data-lucide="gem" style="width: 42px; height: 42px; color: #00d4aa;"></i>'
  };

  const tierDescMap = {
    bronze:  lTr("bronzeDesc"),
    silver:  lTr("silverDesc"),
    gold:    lTr("goldDesc"),
    diamond: lTr("diamondDesc")
  };

  const translatedTierNameMap = {
    bronze:  lTr("bronzeLeague"),
    silver:  lTr("silverLeague"),
    gold:    lTr("goldLeague"),
    diamond: lTr("diamondLeague")
  };

  let html = `
    <div class="dash-card leagues-card" style="max-width: 880px; margin: 0 auto; padding: 1.5rem; box-sizing: border-box; width: 100%; overflow: hidden;">
      
      <!-- Tier Banner -->
      <div class="league-tier-banner" style="background: ${tierInfo.bgGradient}; border: 2px solid ${tierInfo.borderColor}; border-radius: 20px; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 1rem; box-shadow: 0 12px 30px -10px rgba(99, 102, 241, 0.12); width: 100%; box-sizing: border-box;">
        <div style="display: flex; align-items: center; gap: 1rem; width: 100%; min-width: 0;">
          <div style="width: 60px; height: 60px; min-width: 60px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 50%; box-shadow: 0 8px 20px rgba(0,0,0,0.1); flex-shrink: 0;">
            ${lucideIconMap[tierInfo.id] || lucideIconMap.bronze}
          </div>
          <div style="min-width: 0; flex: 1; overflow: hidden;">
            <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: ${tierInfo.color};">${lTr("currentTier")}</span>
            <h2 style="margin: 0.15rem 0; font-size: 1.45rem; font-weight: 900; color: #0f172a; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${translatedTierNameMap[tierInfo.id] || tierInfo.name}</h2>
            <p style="margin: 0; color: #475569; font-size: 0.83rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${tierDescMap[tierInfo.id] || tierInfo.desc}</p>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); padding: 0.75rem 1rem; border-radius: 14px; border: 1.5px solid rgba(226,232,240,0.8); box-shadow: 0 4px 12px rgba(15,23,42,0.04); width: 100%; box-sizing: border-box;">
          <div style="font-size: 0.72rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${lTr("weekEndsIn")}</div>
          <div style="font-weight: 900; font-size: 1.05rem; color: #6366f1; margin-top: 0.2rem; display: flex; align-items: center; gap: 0.4rem;">
            <i data-lucide="clock" style="width: 16px; height: 16px;"></i>
            <span>${timeRemaining}</span>
          </div>
        </div>
      </div>

      <!-- Tier Selection Bar (View Tiers) -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 0.5rem; width: 100%; box-sizing: border-box; scrollbar-width: none;">
        ${LEAGUE_TIERS.map(t => `
          <div style="flex: 1; min-width: 78px; max-width: 110px; text-align: center; padding: 0.7rem 0.4rem; border-radius: 14px; border: 2px solid ${t.id === currentTierId ? t.color : '#e2e8f0'}; background: ${t.id === currentTierId ? '#ffffff' : 'rgba(248, 250, 252, 0.7)'}; box-shadow: ${t.id === currentTierId ? '0 8px 20px -4px rgba(99,102,241,0.15)' : 'none'}; opacity: ${t.id === currentTierId ? '1' : '0.75'}; transition: all 0.25s ease; box-sizing: border-box;">
            <div style="display: flex; justify-content: center; margin-bottom: 0.25rem;">
              ${lucideIconMap[t.id] || lucideIconMap.bronze}
            </div>
            <div style="font-size: 0.75rem; font-weight: 900; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${translatedTierNameMap[t.id] || t.name}</div>
          </div>
        `).join('')}
      </div>

      <!-- Leaderboard Header Info -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding: 0 0.25rem; flex-wrap: wrap; gap: 0.5rem;">
        <h4 style="margin: 0; font-size: 1.2rem; font-weight: 900; color: #0f172a; font-family: 'Plus Jakarta Sans', sans-serif;">
          🏆 ${lTr("groupStandings")} (${membersList.length} ${lTr("membersLabel")})
        </h4>
        <span style="font-size: 0.82rem; color: #64748b; font-weight: 700;">${lTr("rankedByWeeklyXp")}</span>
      </div>

      <!-- Leaderboard Table -->
      <div class="leagues-table" style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%; box-sizing: border-box;">
        ${membersList.map((m, idx) => {
          const rank = idx + 1;
          const isCurrentUser = user && m.uid === user.uid;

          const isPromotion = rank <= 5;
          const isDemotion  = currentTierId !== "bronze" && membersList.length >= 10 && rank > membersList.length - 5;

          let badgeHtml = "";
          let rowStyle = "background: #ffffff; border: 1.5px solid #e2e8f0; box-shadow: 0 4px 15px rgba(15,23,42,0.03);";

          if (isCurrentUser) {
            rowStyle = "background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08)); border: 2px solid #6366f1; box-shadow: 0 10px 25px -5px rgba(99,102,241,0.2);";
          }

          if (isPromotion) {
            badgeHtml = `<span style="background: #ecfdf5; color: #065f46; border: 1.5px solid #10b981; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.25rem;">
              <span>${lTr("promotionZone")}</span> <i data-lucide="arrow-up" style="width: 11px; height: 11px;"></i>
            </span>`;
          } else if (isDemotion) {
            badgeHtml = `<span style="background: #fef2f2; color: #991b1b; border: 1.5px solid #f87171; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.25rem;">
              <span>${lTr("relegationZone")}</span> <i data-lucide="arrow-down" style="width: 11px; height: 11px;"></i>
            </span>`;
          }

          let rankBadge = `#${rank}`;
          let rankClass = "";
          if (rank === 1) { rankBadge = "👑 1"; rankClass = "league-rank-1"; }
          else if (rank === 2) { rankBadge = "🥈 2"; rankClass = "league-rank-2"; }
          else if (rank === 3) { rankBadge = "🥉 3"; rankClass = "league-rank-3"; }

          return `
            <div class="league-member-row" style="${rowStyle} border-radius: 16px; padding: 0.75rem 0.85rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; box-sizing: border-box; width: 100%;">
              
              <div style="display: flex; align-items: center; gap: 0.55rem; flex: 1; min-width: 0; overflow: hidden;">
                <span class="${rankClass}" style="font-size: 0.85rem; font-weight: 900; padding: 0.3rem 0.5rem; border-radius: 9999px; min-width: 34px; text-align: center; flex-shrink: 0; ${!rankClass ? 'color: #64748b; background: #f1f5f9;' : ''}">${rankBadge}</span>
                <div style="width: 36px; height: 36px; min-width: 36px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.95rem; flex-shrink: 0; box-shadow: 0 4px 10px rgba(99,102,241,0.3);">
                  ${m.avatar}
                </div>
                <div style="min-width: 0; flex: 1; overflow: hidden;">
                  <div style="font-weight: 800; font-size: 0.9rem; color: #0f172a; display: flex; align-items: center; gap: 0.35rem; overflow: hidden;">
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.displayName}</span>
                    ${isCurrentUser ? `<span style="background: #6366f1; color: white; padding: 0.1rem 0.4rem; border-radius: 9999px; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.5px; flex-shrink: 0;">${lTr("youTag")}</span>` : ""}
                  </div>
                  <div style="margin-top: 0.15rem;">${badgeHtml}</div>
                </div>
              </div>

              <div style="text-align: right; flex-shrink: 0; max-width: 90px;">
                <div style="font-weight: 900; font-size: 0.92rem; color: #6366f1; display: flex; align-items: center; justify-content: flex-end; gap: 0.2rem; white-space: nowrap;">
                  <i data-lucide="zap" style="width: 13px; height: 13px; fill: #6366f1;"></i>
                  <span>${m.weeklyLeagueXP} XP</span>
                </div>
                <div style="font-size: 0.7rem; color: #64748b; font-weight: 700; margin-top: 0.1rem; white-space: nowrap;">Total: ${m.totalXP} XP</div>
              </div>

            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;

  container.innerHTML = html;
  if (typeof lucide !== "undefined") lucide.createIcons();
}
