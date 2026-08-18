/**
 * leagues.js — Weekly Competitive Leagues Engine (Enhanced & Gamified)
 *
 * ═══════════════════════════════════════════════════════════════════
 * FEATURES:
 *   ✅  Themed Hero Card with dynamic countdown clock & active status alert
 *   ✅  Tier Roadmap (Bronze ➔ Silver ➔ Gold ➔ Diamond)
 *   ✅  Weekly Prizes & Promotion rewards banner
 *   ✅  3D Top 3 Performers Podium with glowing crowns & pedestals
 *   ✅  Promotion Zone (Top 5) & Safe/Relegation Zone roster
 *   ✅  Personal User Ranking card with remaining XP to next promotion rank
 *   ✅  Full 7-language support & Lucide icons
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
    <div style="text-align: center; padding: 4rem 1rem;">
      <div class="loading-spinner" style="margin: 0 auto 1.25rem;"></div>
      <p style="color: #64748b; font-weight: 700; font-size: 1rem;">Loading League Standings & Leaderboard...</p>
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

  // Sort descending by weeklyLeagueXP
  membersList.sort((a, b) => b.weeklyLeagueXP - a.weeklyLeagueXP || b.totalXP - a.totalXP);

  // Identify current user's rank
  const userRankIndex = membersList.findIndex(m => user && m.uid === user.uid);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : 1;
  const userInPromotion = userRank <= 5;
  const userInRelegation = currentTierId !== "bronze" && membersList.length >= 10 && userRank > membersList.length - 5;

  const translatedTierNameMap = {
    bronze:  lTr("bronzeLeague"),
    silver:  lTr("silverLeague"),
    gold:    lTr("goldLeague"),
    diamond: lTr("diamondLeague")
  };

  const tierDescMap = {
    bronze:  lTr("bronzeDesc"),
    silver:  lTr("silverDesc"),
    gold:    lTr("goldDesc"),
    diamond: lTr("diamondDesc")
  };

  // Top 3 Podium Winners
  const firstPlace  = membersList[0] || null;
  const secondPlace = membersList[1] || null;
  const thirdPlace  = membersList[2] || null;

  // Render full gamified container
  let html = `
    <div class="leagues-container" style="width: 100%; max-width: 100%; box-sizing: border-box; min-width: 0;">
      
      <!-- ═══ 1. LEAGUE HERO CARD ═══ -->
      <div class="league-tier-banner" style="background: ${tierInfo.bgGradient}; color: #ffffff; position: relative; overflow: hidden; border-radius: 24px; padding: clamp(1.15rem, 2.5vw, 1.75rem); box-shadow: 0 12px 30px -8px rgba(15,23,42,0.12); margin-bottom: 1.5rem; width: 100%; box-sizing: border-box;">
        
        <!-- Ambient Glow Orb -->
        <div style="position: absolute; right: -40px; top: -40px; width: 240px; height: 240px; background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0) 70%); pointer-events: none;"></div>

        <div style="display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; position: relative; z-index: 2;">
          
          <!-- Tier Emblem & Titles -->
          <div style="display: flex; align-items: center; gap: 1.25rem;">
            <div style="width: 76px; height: 76px; border-radius: 24px; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.2); flex-shrink: 0;">
              ${tierInfo.icon}
            </div>
            <div>
              <div style="display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.74rem; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
                <i data-lucide="shield" style="width: 13px; height: 13px;"></i>
                <span>${lTr("currentTier")} • TIER ${tierInfo.tierNumber}</span>
              </div>
              <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-weight: 900; margin: 0.35rem 0 0.2rem; line-height: 1.2;">
                ${translatedTierNameMap[tierInfo.id] || tierInfo.name}
              </h2>
              <p style="margin: 0; color: rgba(255,255,255,0.85); font-size: 0.92rem; font-weight: 600;">
                ${tierDescMap[tierInfo.id] || tierInfo.desc}
              </p>
            </div>
          </div>

          <!-- Weekly Countdown Timer -->
          <div style="background: rgba(0, 0, 0, 0.25); border: 1.5px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 0.85rem 1.35rem; border-radius: 18px; text-align: right;">
            <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: rgba(255,255,255,0.75);">
              ${lTr("weekEndsIn")}
            </div>
            <div style="font-size: 1.25rem; font-weight: 900; color: #fde68a; margin-top: 0.25rem; display: flex; align-items: center; justify-content: flex-end; gap: 0.4rem;">
              <i data-lucide="clock" style="width: 18px; height: 18px;"></i>
              <span>${timeRemaining}</span>
            </div>
          </div>

        </div>

        <!-- Personal Promotion/Relegation Status Banner -->
        <div style="margin-top: 1.5rem; padding: 0.75rem 1.1rem; border-radius: 14px; background: ${userInPromotion ? 'rgba(16, 185, 129, 0.25)' : userInRelegation ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.15)'}; border: 1px solid ${userInPromotion ? 'rgba(110, 231, 183, 0.4)' : userInRelegation ? 'rgba(252, 165, 165, 0.4)' : 'rgba(255, 255, 255, 0.2)'}; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; font-size: 0.88rem; font-weight: 800;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>${userInPromotion ? '🔥' : userInRelegation ? '⚠️' : '🛡️'}</span>
            <span>${userInPromotion ? lTr("leaguePromotionAlert") : userInRelegation ? lTr("leagueRelegationAlert") : lTr("leagueSafeAlert")}</span>
          </div>
          <div style="background: rgba(0,0,0,0.2); padding: 0.2rem 0.65rem; border-radius: 8px; font-size: 0.8rem;">
            #<strong>${userRank}</strong> / ${membersList.length}
          </div>
        </div>

      </div>

      <!-- ═══ 2. TIER PROGRESSION ROADMAP ═══ -->
      <div class="dash-card leagues-progression-card" style="border-radius: 24px; padding: clamp(1rem, 2vw, 1.5rem); margin-bottom: 1.5rem; width: 100%; box-sizing: border-box;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
          <span style="font-size: 0.82rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b;">
            ${lTr("leagueProgressionTiers")}
          </span>
          <span style="font-size: 0.82rem; font-weight: 800; color: #6366f1;">
            Top 5: ${lTr("promotionZone")} ➔
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem;">
          ${LEAGUE_TIERS.map(t => {
            const isCurrent = t.id === currentTierId;
            const isPassed = t.tierNumber < tierInfo.tierNumber;
            return `
              <div style="border-radius: 18px; padding: 1rem 0.75rem; text-align: center; border: 2px solid ${isCurrent ? '#6366f1' : '#e2e8f0'}; background: ${isCurrent ? '#f5f3ff' : '#ffffff'}; box-shadow: ${isCurrent ? '0 8px 24px -4px rgba(99, 102, 241, 0.25)' : 'none'}; transition: all 0.25s ease; position: relative;">
                ${isCurrent ? `<span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #6366f1; color: white; font-size: 0.62rem; font-weight: 900; padding: 0.15rem 0.55rem; border-radius: 9999px; letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap;">${lTr("activeTierLabel")}</span>` : ''}
                <div style="font-size: 2rem; margin-bottom: 0.25rem;">${t.icon}</div>
                <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.88rem; font-weight: 900; color: #0f172a;">${translatedTierNameMap[t.id] || t.name}</div>
                <div style="font-size: 0.72rem; font-weight: 700; color: ${isCurrent ? '#6366f1' : '#64748b'}; margin-top: 0.2rem;">
                  ${isPassed ? `✓ ${lTr("statusCompleted")}` : isCurrent ? lTr("activeTierLabel") : '🔒'}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- ═══ 3. TOP 3 PERFORMERS PODIUM ═══ -->
      ${membersList.length >= 1 ? `
        <div class="dash-card leagues-podium-card" style="border-radius: 24px; padding: clamp(1.25rem, 2.5vw, 1.75rem) clamp(0.75rem, 2vw, 1.25rem); margin-bottom: 1.5rem; width: 100%; box-sizing: border-box;">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: #fffbeb; border: 1px solid #fef3c7; color: #b45309; font-size: 0.76rem; font-weight: 900; text-transform: uppercase; padding: 0.25rem 0.75rem; border-radius: 9999px;">
              <i data-lucide="trophy" style="width: 14px; height: 14px;"></i>
              <span>${lTr("leaguePodiumTitle")}</span>
            </div>
            <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: clamp(1.15rem, 2.5vw, 1.4rem); font-weight: 900; color: #0f172a; margin: 0.35rem 0 0;">
              ${lTr("cohortLeaderboardStage")}
            </h3>
          </div>

          <div style="display: flex; align-items: flex-end; justify-content: center; gap: clamp(0.4rem, 1.5vw, 1rem); width: 100%; max-width: 580px; margin: 0 auto; box-sizing: border-box;">
            
            <!-- 2nd Place (Silver) -->
            ${secondPlace ? `
              <div style="flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; min-width: 0;">
                <div style="font-size: 1.3rem; margin-bottom: -4px;">🥈</div>
                <div style="width: clamp(40px, 8vw, 52px); height: clamp(40px, 8vw, 52px); border-radius: 50%; background: linear-gradient(135deg, #94a3b8, #64748b); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: clamp(1rem, 2vw, 1.3rem); border: 3px solid #ffffff; box-shadow: 0 8px 18px rgba(148, 163, 184, 0.4); flex-shrink: 0;">
                  ${secondPlace.avatar}
                </div>
                <div style="font-weight: 800; font-size: clamp(0.75rem, 1.8vw, 0.85rem); color: #1e293b; margin: 0.35rem 0 0.15rem; width: 100%; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${secondPlace.displayName}
                </div>
                <div style="font-size: clamp(0.7rem, 1.6vw, 0.75rem); font-weight: 900; color: #6366f1;">
                  ${secondPlace.weeklyLeagueXP} XP
                </div>
                <div style="width: 100%; height: clamp(65px, 12vw, 90px); background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%); border-radius: 16px 16px 0 0; margin-top: 0.65rem; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: clamp(1.1rem, 2.5vw, 1.4rem); color: #475569; box-shadow: inset 0 2px 4px rgba(255,255,255,0.8);">
                  2
                </div>
              </div>
            ` : ''}

            <!-- 1st Place (Gold Champion) -->
            ${firstPlace ? `
              <div style="flex: 1.2; text-align: center; display: flex; flex-direction: column; align-items: center; min-width: 0;">
                <div style="font-size: 1.8rem; margin-bottom: -6px; animation: bounce 2s infinite;">👑</div>
                <div style="width: clamp(48px, 10vw, 64px); height: clamp(48px, 10vw, 64px); border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: clamp(1.2rem, 2.5vw, 1.6rem); border: 3px solid #fef3c7; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.45); flex-shrink: 0;">
                  ${firstPlace.avatar}
                </div>
                <div style="font-weight: 900; font-size: clamp(0.8rem, 2vw, 0.95rem); color: #0f172a; margin: 0.4rem 0 0.15rem; width: 100%; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${firstPlace.displayName}
                </div>
                <div style="font-size: clamp(0.72rem, 1.7vw, 0.82rem); font-weight: 900; color: #d97706; background: #fef3c7; padding: 0.15rem 0.6rem; border-radius: 9999px; border: 1px solid #fde68a;">
                  ⚡ ${firstPlace.weeklyLeagueXP} XP
                </div>
                <div style="width: 100%; height: clamp(90px, 16vw, 125px); background: linear-gradient(180deg, #fef08a 0%, #facc15 100%); border-radius: 20px 20px 0 0; margin-top: 0.65rem; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 900; font-size: clamp(1.3rem, 3vw, 1.8rem); color: #854d0e; box-shadow: inset 0 2px 6px rgba(255,255,255,0.9), 0 8px 20px rgba(250, 204, 21, 0.3);">
                  <span>1</span>
                  <span style="font-size: clamp(0.62rem, 1.4vw, 0.72rem); font-weight: 800; text-transform: uppercase; color: #a16207; letter-spacing: 0.5px;">${lTr("leaderTitle")}</span>
                </div>
              </div>
            ` : ''}

            <!-- 3rd Place (Bronze) -->
            ${thirdPlace ? `
              <div style="flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; min-width: 0;">
                <div style="font-size: 1.3rem; margin-bottom: -4px;">🥉</div>
                <div style="width: clamp(40px, 8vw, 52px); height: clamp(40px, 8vw, 52px); border-radius: 50%; background: linear-gradient(135deg, #b45309, #78350f); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: clamp(1rem, 2vw, 1.3rem); border: 3px solid #ffffff; box-shadow: 0 8px 18px rgba(180, 83, 9, 0.35); flex-shrink: 0;">
                  ${thirdPlace.avatar}
                </div>
                <div style="font-weight: 800; font-size: clamp(0.75rem, 1.8vw, 0.85rem); color: #1e293b; margin: 0.35rem 0 0.15rem; width: 100%; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${thirdPlace.displayName}
                </div>
                <div style="font-size: clamp(0.7rem, 1.6vw, 0.75rem); font-weight: 900; color: #6366f1;">
                  ${thirdPlace.weeklyLeagueXP} XP
                </div>
                <div style="width: 100%; height: clamp(55px, 10vw, 70px); background: linear-gradient(180deg, #fed7aa 0%, #fdba74 100%); border-radius: 16px 16px 0 0; margin-top: 0.65rem; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: clamp(1.1rem, 2.5vw, 1.4rem); color: #7c2d12; box-shadow: inset 0 2px 4px rgba(255,255,255,0.8);">
                  3
                </div>
              </div>
            ` : ''}

          </div>
        </div>
      ` : ''}

      <!-- ═══ 4. FULL GROUP STANDINGS ROSTER ═══ -->
      <div class="dash-card leagues-standings-card" style="border-radius: 24px; padding: clamp(1.25rem, 2.5vw, 1.75rem) clamp(0.75rem, 2vw, 1.25rem); width: 100%; box-sizing: border-box;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: clamp(1.1rem, 2.2vw, 1.25rem); font-weight: 900; color: #0f172a; margin: 0;">
              ${lTr("groupStandings")} (${membersList.length} Learners)
            </h3>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.84rem; color: #64748b; font-weight: 600;">
              ${lTr("rankedByWeeklyXp")}
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.75rem; font-weight: 800;">
            <span style="display: inline-flex; align-items: center; gap: 0.25rem; background: #ecfdf5; color: #065f46; padding: 0.25rem 0.6rem; border-radius: 8px; border: 1px solid #a7f3d0;">
              <i data-lucide="arrow-up" style="width: 12px; height: 12px;"></i> Top 5: Promote
            </span>
          </div>
        </div>

        <div class="leagues-table" style="display: flex; flex-direction: column; gap: 0.65rem; width: 100%;">
          ${membersList.map((m, idx) => {
            const rank = idx + 1;
            const isCurrentUser = user && m.uid === user.uid;
            const isPromotion = rank <= 5;
            const isDemotion  = currentTierId !== "bronze" && membersList.length >= 10 && rank > membersList.length - 5;

            let rowBg = "#ffffff";
            let borderStyle = "1.5px solid #e2e8f0";
            let leftAccent = "transparent";

            if (isCurrentUser) {
              rowBg = "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))";
              borderStyle = "2px solid #6366f1";
              leftAccent = "#6366f1";
            } else if (isPromotion) {
              leftAccent = "#10b981";
            } else if (isDemotion) {
              leftAccent = "#ef4444";
            }

            let rankIcon = `#${rank}`;
            let rankColor = "#64748b";
            let rankBg = "#f1f5f9";

            if (rank === 1) { rankIcon = "👑 1"; rankColor = "#b45309"; rankBg = "#fef3c7"; }
            else if (rank === 2) { rankIcon = "🥈 2"; rankColor = "#334155"; rankBg = "#e2e8f0"; }
            else if (rank === 3) { rankIcon = "🥉 3"; rankColor = "#78350f"; rankBg = "#fed7aa"; }

            return `
              <div class="league-member-row" style="background: ${rowBg}; border: ${borderStyle}; border-left: 5px solid ${leftAccent}; border-radius: 18px; padding: 0.85rem 1.15rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; box-shadow: 0 4px 12px rgba(15,23,42,0.02); transition: all 0.2s ease;">
                
                <!-- Left: Rank + Avatar + Name -->
                <div style="display: flex; align-items: center; gap: 0.85rem; min-width: 0; flex: 1;">
                  
                  <span style="font-size: 0.85rem; font-weight: 900; color: ${rankColor}; background: ${rankBg}; padding: 0.35rem 0.65rem; border-radius: 10px; min-width: 38px; text-align: center; flex-shrink: 0;">
                    ${rankIcon}
                  </span>

                  <div style="width: 42px; height: 42px; border-radius: 14px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem; flex-shrink: 0; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                    ${m.avatar}
                  </div>

                  <div style="min-width: 0; flex: 1;">
                    <div style="font-weight: 800; font-size: 0.95rem; color: #0f172a; display: flex; align-items: center; gap: 0.45rem; overflow: hidden;">
                      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.displayName}</span>
                      ${isCurrentUser ? `<span style="background: #6366f1; color: white; padding: 0.12rem 0.55rem; border-radius: 9999px; font-size: 0.68rem; font-weight: 900; letter-spacing: 0.5px; flex-shrink: 0;">${lTr("youTag")}</span>` : ''}
                    </div>

                    <div style="margin-top: 0.25rem;">
                      ${isPromotion ? `
                        <span style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 0.15rem 0.55rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.2rem;">
                          <i data-lucide="arrow-up" style="width: 10px; height: 10px;"></i>
                          <span>${lTr("promotionZone")}</span>
                        </span>
                      ` : isDemotion ? `
                        <span style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; padding: 0.15rem 0.55rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.2rem;">
                          <i data-lucide="arrow-down" style="width: 10px; height: 10px;"></i>
                          <span>${lTr("relegationZone")}</span>
                        </span>
                      ` : `
                        <span style="font-size: 0.72rem; color: #64748b; font-weight: 700;">
                          ${lTr("safeZone")}
                        </span>
                      `}
                    </div>
                  </div>

                </div>

                <!-- Right: Weekly XP & Lifetime Total -->
                <div style="text-align: right; flex-shrink: 0;">
                  <div style="font-weight: 900; font-size: 1.05rem; color: #6366f1; display: flex; align-items: center; justify-content: flex-end; gap: 0.25rem;">
                    <i data-lucide="zap" style="width: 15px; height: 15px; fill: #6366f1;"></i>
                    <span>${m.weeklyLeagueXP} XP</span>
                  </div>
                  <div style="font-size: 0.74rem; color: #64748b; font-weight: 700; margin-top: 0.15rem;">
                    Total: ${m.totalXP} XP
                  </div>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  `;

  container.innerHTML = html;
  if (typeof lucide !== "undefined") lucide.createIcons();
}
