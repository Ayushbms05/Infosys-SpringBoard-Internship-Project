/**
 * studygroups.js — Study Groups & Async Group Feed Engine (v3)
 *
 * ═══════════════════════════════════════════════════════════════════
 * ISOLATION CONTRACT:
 *   ❌  Does NOT modify lesson.js, units.js, curriculum.js, handwriting.js, or leagues.js
 *   ❌  Does NOT alter existing group create, join, leave, or discovery logic
 *   ✅  Renders Group Detail & Async Forum-style Group Feed
 *   ✅  Supports 20-post cursor pagination (startAfter)
 *   ✅  Supports expandable nested replies & FieldValue.increment(1) for replyCount
 *   ✅  Batch-deletes subcollection replies when a post is deleted (zero orphaned data)
 *   ✅  Enforces member-only post & reply access
 * ═══════════════════════════════════════════════════════════════════
 */

let sgProfile          = null;
let sgActiveTab        = "discover"; // "discover" | "my-groups" | "create" | "detail"
let sgLangFilter       = "all";
let sgActiveGroupId    = null;
let sgActiveGroupData  = null;
let sgPostsList        = [];
let sgLastPostSnapshot = null;
let sgHasMorePosts     = false;
let sgLoadingPosts     = false;

const SG_LANG_NAMES = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  kn: "Kannada (कन्नड़)",
  bn: "Bengali (বাংলা)",
  mr: "Marathi (मराठी)"
};

// ── Relative Time Formatter ───────────────────────────────────────
function sgFormatTimeAgo(timestamp) {
  if (!timestamp) return "just now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now  = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// ── Translation Helper ────────────────────────────────────────────
function sgTr(key) {
  const userLang = (sgProfile && sgProfile.preferredLanguage) || localStorage.getItem("akshargyan_lang") || "en";
  if (typeof getTranslation === "function") {
    return getTranslation(userLang, key);
  }
  return key;
}

// ── Entrypoint ────────────────────────────────────────────────────
async function initStudyGroups(profile) {
  sgProfile    = profile || {};
  sgActiveTab  = "discover";
  sgLangFilter = "all";

  const user = auth.currentUser;
  if (user) {
    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        sgProfile.studyGroupIds = uData.studyGroupIds || [];
        if (uData.fullName || uData.displayName) {
          sgProfile.fullName = uData.fullName || uData.displayName;
        }
      }
    } catch (err) {
      console.warn("[studygroups.js] Could not refresh user profile:", err);
    }
  }

  renderStudyGroupsUI();
}

// ── Main UI Layout ────────────────────────────────────────────────
function renderStudyGroupsUI() {
  const container = document.getElementById("section-studygroups");
  if (!container) return;

  const html = `
    <div class="dash-card studygroups-card" style="max-width: 900px; margin: 0 auto; padding: 2rem;">
      
      <!-- Header -->
      <div class="dash-card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
        <div>
          <h3 class="dash-card-title" style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="dash-card-title-icon"><i data-lucide="users"></i></span>
            <span>${sgTr("studyGroupsTitle")}</span>
          </h3>
          <p class="dash-card-subtitle" style="margin-top: 0.25rem;">
            ${sgTr("studyGroupsSubtitle")}
          </p>
        </div>
        ${sgActiveTab !== 'detail' ? `
          <button id="sg-create-btn-top" class="btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.9rem;">
            ${sgTr("createGroupBtn")}
          </button>
        ` : ''}
      </div>

      ${sgActiveTab !== 'detail' ? `
        <!-- Sub Navigation Tabs -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.75rem; margin-bottom: 1.5rem;">
          <div class="sg-sub-tabs" style="display: flex; gap: 0.5rem;">
            <button class="sg-tab ${sgActiveTab === 'discover' ? 'active' : ''}" data-tab="discover" style="padding: 0.5rem 1.25rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; background: ${sgActiveTab === 'discover' ? 'var(--color-primary)' : 'transparent'}; color: ${sgActiveTab === 'discover' ? 'white' : 'var(--color-text-secondary)'}; display: inline-flex; align-items: center; gap: 0.4rem;">
              <i data-lucide="search" style="width: 16px; height: 16px;"></i>
              <span>${sgTr("discoverGroups")}</span>
            </button>
            <button class="sg-tab ${sgActiveTab === 'my-groups' ? 'active' : ''}" data-tab="my-groups" style="padding: 0.5rem 1.25rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; background: ${sgActiveTab === 'my-groups' ? 'var(--color-primary)' : 'transparent'}; color: ${sgActiveTab === 'my-groups' ? 'white' : 'var(--color-text-secondary)'}; display: inline-flex; align-items: center; gap: 0.4rem;">
              <i data-lucide="users" style="width: 16px; height: 16px;"></i>
              <span>${sgTr("myGroups")} (${(sgProfile.studyGroupIds || []).length})</span>
            </button>
            <button class="sg-tab ${sgActiveTab === 'create' ? 'active' : ''}" data-tab="create" style="padding: 0.5rem 1.25rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; background: ${sgActiveTab === 'create' ? 'var(--color-primary)' : 'transparent'}; color: ${sgActiveTab === 'create' ? 'white' : 'var(--color-text-secondary)'}; display: inline-flex; align-items: center; gap: 0.4rem;">
              <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i>
              <span>${sgTr("createNewGroup")}</span>
            </button>
          </div>

          ${sgActiveTab === 'discover' ? `
            <!-- Learning Language Filter -->
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-muted);">${sgTr("learningLabel")}:</span>
              <select id="sg-lang-filter" style="padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid var(--color-border); font-size: 0.85rem; font-weight: 600;">
                <option value="all" ${sgLangFilter === 'all' ? 'selected' : ''}>${sgTr("allTargetLangs")}</option>
                ${Object.entries(SG_LANG_NAMES).map(([code, name]) => `
                  <option value="${code}" ${sgLangFilter === code ? 'selected' : ''}>${name}</option>
                `).join('')}
              </select>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Tab View Container -->
      <div id="sg-view-container"></div>

    </div>
  `;

  container.innerHTML = html;
  if (typeof lucide !== "undefined") lucide.createIcons();

  // Attach tab handlers
  setupSGTabEvents();

  // Load active view
  if (sgActiveTab === "discover")  loadDiscoverView();
  if (sgActiveTab === "my-groups") loadMyGroupsView();
  if (sgActiveTab === "create")    renderCreateGroupView();
  if (sgActiveTab === "detail")    loadGroupDetailView();
}

function setupSGTabEvents() {
  const container = document.getElementById("section-studygroups");
  if (!container) return;

  // Sub tab clicks
  container.querySelectorAll(".sg-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      sgActiveTab = tab.dataset.tab;
      renderStudyGroupsUI();
    });
  });

  // Top Create Group button
  const topCreateBtn = document.getElementById("sg-create-btn-top");
  if (topCreateBtn) {
    topCreateBtn.addEventListener("click", () => {
      sgActiveTab = "create";
      renderStudyGroupsUI();
    });
  }

  // Language filter change
  const langSelect = document.getElementById("sg-lang-filter");
  if (langSelect) {
    langSelect.addEventListener("change", (e) => {
      sgLangFilter = e.target.value;
      loadDiscoverView();
    });
  }
}

// ── Tab 1: Discover / Browse Public Groups ────────────────────────
async function loadDiscoverView() {
  const viewEl = document.getElementById("sg-view-container");
  if (!viewEl) return;

  viewEl.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
      <p style="color: var(--color-text-muted); font-weight: 600;">Finding public study groups...</p>
    </div>
  `;

  try {
    const snap = await db.collection("studyGroups").where("isPublic", "==", true).get();
    let groups = [];
    snap.forEach(d => groups.push({ id: d.id, ...d.data() }));

    if (sgLangFilter !== "all") {
      groups = groups.filter(g => (g.learningLanguage || g.language) === sgLangFilter);
    }

    const userNative   = sgProfile.preferredLanguage || "hi";
    const userLearning = sgProfile.targetLanguage    || "en";

    groups.sort((a, b) => {
      const aNative   = a.nativeLanguage || "hi";
      const aLearning = a.learningLanguage || a.language || "en";
      const bNative   = b.nativeLanguage || "hi";
      const bLearning = b.learningLanguage || b.language || "en";

      let scoreA = 0;
      let scoreB = 0;

      if (aLearning === userLearning) scoreA += 10;
      if (aNative === userNative)     scoreA += 5;

      if (bLearning === userLearning) scoreB += 10;
      if (bNative === userNative)     scoreB += 5;

      if (scoreB !== scoreA) return scoreB - scoreA;

      const timeA = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : a.createdAt) : 0;
      const timeB = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : b.createdAt) : 0;
      return timeB - timeA;
    });

    renderGroupGrid(viewEl, groups, "discover");
  } catch (err) {
    console.warn("[studygroups.js] Could not load public groups:", err);
    viewEl.innerHTML = `<p style="text-align: center; color: var(--color-text-muted); padding: 2rem;">Could not load groups. Please try again.</p>`;
  }
}

// ── Tab 2: My Joined Groups ───────────────────────────────────────
async function loadMyGroupsView() {
  const viewEl = document.getElementById("sg-view-container");
  if (!viewEl) return;

  const joinedIds = sgProfile.studyGroupIds || [];

  if (joinedIds.length === 0) {
    viewEl.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; background: var(--color-bg-surface); border-radius: 14px; border: 1px dashed var(--color-border);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">👥</div>
        <h4 style="margin: 0 0 0.5rem; font-weight: 800;">You haven't joined any study groups yet</h4>
        <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Browse public groups to practice together with other learners!</p>
        <button id="sg-browse-now-btn" class="btn-primary" style="padding: 0.6rem 1.5rem;">Browse Groups</button>
      </div>
    `;
    const bBtn = document.getElementById("sg-browse-now-btn");
    if (bBtn) {
      bBtn.onclick = () => {
        sgActiveTab = "discover";
        renderStudyGroupsUI();
      };
    }
    return;
  }

  viewEl.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
      <p style="color: var(--color-text-muted); font-weight: 600;">Loading your groups...</p>
    </div>
  `;

  try {
    const groups = [];
    for (let i = 0; i < joinedIds.length; i += 10) {
      const chunk = joinedIds.slice(i, i + 10);
      const snap  = await db.collection("studyGroups")
        .where(firebase.firestore.FieldPath.documentId(), "in", chunk)
        .get();
      snap.forEach(d => groups.push({ id: d.id, ...d.data() }));
    }

    renderGroupGrid(viewEl, groups, "my-groups");
  } catch (err) {
    console.warn("[studygroups.js] Could not load your groups:", err);
    viewEl.innerHTML = `<p style="text-align: center; color: var(--color-text-muted); padding: 2rem;">Could not load your groups.</p>`;
  }
}

// ── Render Group Grid ─────────────────────────────────────────────
function renderGroupGrid(containerEl, groups, context) {
  if (groups.length === 0) {
    containerEl.innerHTML = `
      <div style="text-align: center; padding: 3.5rem 1.5rem; background: rgba(255,255,255,0.9); border-radius: 24px; border: 1.5px dashed #cbd5e1;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">👥</div>
        <h4 style="margin: 0 0 0.5rem; font-weight: 800; color: #0f172a;">No study groups found</h4>
        <p style="color: #64748b; font-weight: 600; margin: 0;">Be the first to create one for your learning language!</p>
      </div>
    `;
    return;
  }

  const user = auth.currentUser;
  const userJoinedIds = sgProfile.studyGroupIds || [];
  const userNative    = sgProfile.preferredLanguage || "hi";
  const userLearning  = sgProfile.targetLanguage    || "en";

  let html = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">`;

  groups.forEach(g => {
    const isMember     = userJoinedIds.includes(g.id);
    const isFull       = (g.memberCount || (g.members || []).length) >= 50;
    const nativeName   = SG_LANG_NAMES[g.nativeLanguage]  || g.nativeLanguage  || "Hindi";
    const learningName = SG_LANG_NAMES[g.learningLanguage || g.language] || g.learningLanguage || g.language || "English";
    const memberCount  = g.memberCount || (g.members || []).length;

    const isPerfectMatch = (g.nativeLanguage === userNative || (!g.nativeLanguage && userNative === 'hi')) 
                        && ((g.learningLanguage || g.language) === userLearning);

    html += `
      <div class="dash-card sg-group-card" style="display: flex; flex-direction: column; justify-content: space-between; border: ${isPerfectMatch ? '2px solid #6366f1' : '1.5px solid #e2e8f0'}; border-radius: 24px; padding: 1.5rem; background: #ffffff; box-shadow: ${isPerfectMatch ? '0 12px 35px -8px rgba(99, 102, 241, 0.18)' : '0 10px 30px -10px rgba(15, 23, 42, 0.05)'}; position: relative; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
        
        ${isPerfectMatch ? `
          <div style="position: absolute; top: -12px; right: 16px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 0.2rem 0.75rem; border-radius: 9999px; font-weight: 800; font-size: 0.72rem; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);">
            ⭐ ${sgTr("bestMatchTag")}
          </div>
        ` : ''}

        <div>
          <div style="margin-bottom: 0.75rem;">
            <h4 class="sg-group-title-click" data-id="${g.id}" style="margin: 0 0 0.5rem; font-size: 1.15rem; font-weight: 900; color: #0f172a; line-height: 1.35; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;">
              ${g.name}
            </h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem;">
              <span style="background: rgba(99, 102, 241, 0.1); color: #4338ca; padding: 0.2rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; border: 1px solid rgba(99, 102, 241, 0.2);">
                💬 ${sgTr("speaksLabel")}: ${nativeName.split(' ')[0]}
              </span>
              <span style="background: #ecfdf5; color: #065f46; padding: 0.2rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; border: 1px solid #10b981;">
                🎯 ${sgTr("learningLabel")}: ${learningName.split(' ')[0]}
              </span>
            </div>
          </div>

          <p style="color: #475569; font-size: 0.88rem; margin: 0 0 1.25rem; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; font-weight: 500;">
            ${g.description || "A collaborative study group for practice and learning together."}
          </p>
        </div>

        <div style="border-top: 1.5px dashed #e2e8f0; padding-top: 1rem; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 0.82rem; font-weight: 800; color: #64748b; display: inline-flex; align-items: center; gap: 0.35rem;">
            <i data-lucide="users" style="width: 16px; height: 16px;"></i>
            <span>${memberCount} / 50 ${sgTr("membersLabel")}</span>
          </span>

          ${isMember ? `
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn-primary sg-open-feed-btn" data-id="${g.id}" style="padding: 0.45rem 0.95rem; font-size: 0.82rem; border-radius: 12px; display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);">
                <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
                <span>${sgTr("openFeed")}</span>
              </button>
              <button class="btn-secondary sg-leave-btn" data-id="${g.id}" style="padding: 0.45rem 0.75rem; font-size: 0.82rem; border-radius: 12px; border: 1.5px solid #f87171; color: #991b1b; background: #fef2f2; font-weight: 800;">
                ${sgTr("leaveBtn")}
              </button>
            </div>
          ` : isFull ? `
            <button disabled class="btn-secondary" style="padding: 0.45rem 0.95rem; font-size: 0.82rem; border-radius: 12px; opacity: 0.5; font-weight: 800;">
              Full
            </button>
          ` : `
            <button class="btn-primary sg-join-btn" data-id="${g.id}" style="padding: 0.45rem 1.1rem; font-size: 0.82rem; border-radius: 12px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);">
              ${sgTr("joinBtn")}
            </button>
          `}
        </div>

      </div>
    `;
  });

  html += `</div>`;
  containerEl.innerHTML = html;
  if (typeof lucide !== "undefined") lucide.createIcons();

  // Attach event listeners
  containerEl.querySelectorAll(".sg-open-feed-btn, .sg-group-title-click").forEach(el => {
    el.addEventListener("click", () => {
      sgActiveGroupId = el.dataset.id;
      sgActiveTab     = "detail";
      renderStudyGroupsUI();
    });
  });

  containerEl.querySelectorAll(".sg-join-btn").forEach(btn => {
    btn.addEventListener("click", () => handleJoinGroup(btn.dataset.id));
  });

  containerEl.querySelectorAll(".sg-leave-btn").forEach(btn => {
    btn.addEventListener("click", () => handleLeaveGroup(btn.dataset.id));
  });
}

// ── Tab 3: Create Group Form View ─────────────────────────────────
function renderCreateGroupView() {
  const viewEl = document.getElementById("sg-view-container");
  if (!viewEl) return;

  const defaultNative   = sgProfile.preferredLanguage || "hi";
  const defaultLearning = sgProfile.targetLanguage    || "en";

  viewEl.innerHTML = `
    <div style="max-width: 550px; margin: 0 auto; background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 16px; padding: 1.75rem;">
      <h4 style="margin: 0 0 0.5rem; font-size: 1.3rem; font-weight: 800; color: var(--color-text-primary);">Create a New Study Group</h4>
      <p style="color: var(--color-text-muted); font-size: 0.88rem; margin-bottom: 1.5rem;">Start a group and connect with learners matching your native and target languages.</p>

      <form id="sg-create-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
        
        <div>
          <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.4rem; color: var(--color-text-primary);">Group Name *</label>
          <input type="text" id="sg-input-name" placeholder="e.g. Hindi Speakers Learning English" required maxLength="40" style="width: 100%; padding: 0.75rem; border-radius: 10px; border: 1px solid var(--color-border); font-size: 0.95rem; box-sizing: border-box;" />
        </div>

        <div>
          <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.4rem; color: var(--color-text-primary);">Description *</label>
          <textarea id="sg-input-desc" placeholder="Briefly describe what your group will practice..." required maxLength="150" rows="3" style="width: 100%; padding: 0.75rem; border-radius: 10px; border: 1px solid var(--color-border); font-size: 0.95rem; box-sizing: border-box; font-family: inherit;"></textarea>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.4rem; color: var(--color-text-primary);">I speak (Native) *</label>
            <select id="sg-input-native-lang" required style="width: 100%; padding: 0.75rem; border-radius: 10px; border: 1px solid var(--color-border); font-size: 0.9rem; box-sizing: border-box;">
              ${Object.entries(SG_LANG_NAMES).map(([code, name]) => `
                <option value="${code}" ${code === defaultNative ? 'selected' : ''}>${name}</option>
              `).join('')}
            </select>
          </div>

          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.4rem; color: var(--color-text-primary);">I'm learning *</label>
            <select id="sg-input-learning-lang" required style="width: 100%; padding: 0.75rem; border-radius: 10px; border: 1px solid var(--color-border); font-size: 0.9rem; box-sizing: border-box;">
              ${Object.entries(SG_LANG_NAMES).map(([code, name]) => `
                <option value="${code}" ${code === defaultLearning ? 'selected' : ''}>${name}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div id="sg-form-msg" class="hidden" style="padding: 0.75rem; border-radius: 8px; font-weight: 700; font-size: 0.9rem;"></div>

        <button type="submit" id="sg-submit-btn" class="btn-primary" style="padding: 0.8rem; font-size: 1rem; width: 100%; margin-top: 0.5rem;">
          Create Group & Join
        </button>
      </form>
    </div>
  `;

  document.getElementById("sg-create-form").addEventListener("submit", handleCreateGroupSubmit);
}

// ── Tab 4: Group Detail & Async Feed View ────────────────────────
async function loadGroupDetailView() {
  const viewEl = document.getElementById("sg-view-container");
  if (!viewEl || !sgActiveGroupId) return;

  viewEl.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
      <p style="color: var(--color-text-muted); font-weight: 600;">Loading group feed...</p>
    </div>
  `;

  try {
    const groupDoc = await db.collection("studyGroups").doc(sgActiveGroupId).get();
    if (!groupDoc.exists) {
      viewEl.innerHTML = `<p style="text-align:center; padding:2rem;">Group not found.</p>`;
      return;
    }

    sgActiveGroupData = { id: groupDoc.id, ...groupDoc.data() };
    const user = auth.currentUser;
    const isMember = user && (sgActiveGroupData.members || []).includes(user.uid);

    const nativeName   = SG_LANG_NAMES[sgActiveGroupData.nativeLanguage]  || "Hindi";
    const learningName = SG_LANG_NAMES[sgActiveGroupData.learningLanguage || sgActiveGroupData.language] || "English";

    let html = `
      <div>
        <!-- Detail Header Banner -->
        <div style="background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <button id="sg-back-to-list-btn" class="btn-secondary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; margin-bottom: 0.75rem;">
                ${sgTr("backToMyGroups")}
              </button>
              <h3 style="margin: 0 0 0.3rem; font-size: 1.4rem; font-weight: 900; color: var(--color-text-primary);">${sgActiveGroupData.name}</h3>
              <p style="margin: 0 0 0.75rem; color: var(--color-text-muted); font-size: 0.9rem;">${sgActiveGroupData.description}</p>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span style="background: rgba(108, 99, 255, 0.1); color: var(--color-primary); padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.75rem; font-weight: 700;">
                  ${sgTr("speaksLabel")}: ${nativeName.split(' ')[0]}
                </span>
                <span style="background: rgba(0, 212, 170, 0.15); color: #00876c; padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.75rem; font-weight: 700;">
                  ${sgTr("learningLabel")}: ${learningName.split(' ')[0]}
                </span>
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); margin-left: 0.5rem; display: inline-flex; align-items: center; gap: 0.3rem;">
                  <i data-lucide="users" style="width: 14px; height: 14px;"></i>
                  <span>${(sgActiveGroupData.members || []).length} / 50 ${sgTr("membersLabel")}</span>
                </span>
              </div>
            </div>

            ${isMember ? `
              <button id="sg-detail-leave-btn" class="btn-secondary" style="border-color: #ff6b6b; color: #d63031; padding: 0.4rem 0.9rem; font-size: 0.85rem;">
                ${sgTr("leaveGroup")}
              </button>
            ` : `
              <button id="sg-detail-join-btn" class="btn-primary" style="padding: 0.5rem 1.25rem;">
                ${sgTr("joinBtn")}
              </button>
            `}
          </div>
        </div>
    `;

    // Access check: only members can view/post in the feed
    if (!isMember) {
      html += `
        <div style="text-align: center; padding: 3rem 1rem; background: var(--color-bg-surface); border-radius: 16px; border: 1px dashed var(--color-border);">
          <div style="margin-bottom: 0.5rem; display: flex; justify-content: center;">
            <i data-lucide="lock" style="width: 40px; height: 40px; color: var(--color-text-muted);"></i>
          </div>
          <h4 style="margin: 0 0 0.5rem; font-weight: 800;">Member-Only Group Feed</h4>
          <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Join this study group to view posts, ask questions, and practice with members.</p>
          <button id="sg-detail-join-inline-btn" class="btn-primary" style="padding: 0.6rem 1.5rem;">${sgTr("joinBtn")}</button>
        </div>
      </div>
      `;
      viewEl.innerHTML = html;
      if (typeof lucide !== "undefined") lucide.createIcons();

      document.getElementById("sg-back-to-list-btn").onclick = () => {
        sgActiveTab = "my-groups";
        renderStudyGroupsUI();
      };
      const inlineJoinBtn = document.getElementById("sg-detail-join-inline-btn");
      if (inlineJoinBtn) inlineJoinBtn.onclick = () => handleJoinGroup(sgActiveGroupId);
      const topJoinBtn    = document.getElementById("sg-detail-join-btn");
      if (topJoinBtn) topJoinBtn.onclick = () => handleJoinGroup(sgActiveGroupId);
      return;
    }

    // Members View: Post creation box + Feed list
    html += `
        <!-- Create Post Input Box -->
        <div style="background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 16px; padding: 1.25rem; margin-bottom: 1.5rem;">
          <form id="sg-post-form">
            <textarea id="sg-post-input-text" placeholder="${sgTr("postMessagePrompt")}" required maxLength="500" rows="3" style="width: 100%; padding: 0.75rem; border-radius: 10px; border: 1px solid var(--color-border); font-size: 0.95rem; box-sizing: border-box; font-family: inherit; resize: vertical; margin-bottom: 0.75rem;"></textarea>
            <div style="display: flex; justify-content: flex-end;">
              <button type="submit" id="sg-post-submit-btn" class="btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.4rem;">
                <i data-lucide="message-square" style="width: 16px; height: 16px;"></i>
                <span>${sgTr("postMessageBtn")}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Posts Feed Container -->
        <div id="sg-feed-list" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="text-align: center; padding: 1rem;">Loading posts...</div>
        </div>

        <!-- Pagination Load More Button -->
        <div id="sg-load-more-container" style="text-align: center; margin-top: 1.5rem; display: none;">
          <button id="sg-load-more-btn" class="btn-secondary" style="padding: 0.6rem 1.5rem; font-weight: 700;">
            Load More Posts
          </button>
        </div>

      </div>
    `;

    viewEl.innerHTML = html;

    // Attach Header Handlers
    document.getElementById("sg-back-to-list-btn").onclick = () => {
      sgActiveTab = "my-groups";
      renderStudyGroupsUI();
    };

    const leaveBtn = document.getElementById("sg-detail-leave-btn");
    if (leaveBtn) leaveBtn.onclick = () => handleLeaveGroup(sgActiveGroupId);

    // Attach Post Submit Form
    document.getElementById("sg-post-form").addEventListener("submit", handleCreatePostSubmit);

    // Initial fetch of 20 posts
    sgPostsList        = [];
    sgLastPostSnapshot = null;
    sgHasMorePosts     = false;
    await fetchGroupPosts(true);

  } catch (err) {
    console.warn("[studygroups.js] Could not load group detail:", err);
    viewEl.innerHTML = `<p style="text-align:center; padding:2rem;">Error loading group details.</p>`;
  }
}

// ── Fetch Posts with 20-post Cursor Pagination ────────────────────
async function fetchGroupPosts(reset = false) {
  if (sgLoadingPosts || !sgActiveGroupId) return;
  sgLoadingPosts = true;

  const feedEl     = document.getElementById("sg-feed-list");
  const loadMoreEl = document.getElementById("sg-load-more-container");

  if (reset) {
    sgPostsList        = [];
    sgLastPostSnapshot = null;
    if (feedEl) feedEl.innerHTML = `<div style="text-align:center; padding:1.5rem;"><div class="loading-spinner" style="margin:0 auto;"></div></div>`;
  }

  try {
    let query = db.collection("studyGroups")
      .doc(sgActiveGroupId)
      .collection("posts")
      .orderBy("createdAt", "desc")
      .limit(20);

    if (!reset && sgLastPostSnapshot) {
      query = query.startAfter(sgLastPostSnapshot);
    }

    const snap = await query.get();

    if (!snap.empty) {
      sgLastPostSnapshot = snap.docs[snap.docs.length - 1];
      sgHasMorePosts     = snap.docs.length === 20;

      snap.forEach(doc => {
        sgPostsList.push({ id: doc.id, ...doc.data() });
      });
    } else {
      sgHasMorePosts = false;
    }

    renderPostsFeed();

    if (loadMoreEl) {
      loadMoreEl.style.display = sgHasMorePosts ? "block" : "none";
      const btn = document.getElementById("sg-load-more-btn");
      if (btn) btn.onclick = () => fetchGroupPosts(false);
    }

  } catch (err) {
    console.warn("[studygroups.js] Could not fetch group posts:", err);
    if (feedEl && reset) {
      feedEl.innerHTML = `<p style="text-align:center; color:var(--color-text-muted); padding:1rem;">No posts yet. Be the first to share a message!</p>`;
    }
  } finally {
    sgLoadingPosts = false;
  }
}

// ── Render Posts Feed ─────────────────────────────────────────────
function renderPostsFeed() {
  const feedEl = document.getElementById("sg-feed-list");
  if (!feedEl) return;

  if (sgPostsList.length === 0) {
    feedEl.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; background: var(--color-bg-surface); border-radius: 14px; border: 1px dashed var(--color-border);">
        <p style="color: var(--color-text-muted); font-weight: 600; margin: 0;">No posts in this group yet. Share the first message above!</p>
      </div>
    `;
    return;
  }

  const user = auth.currentUser;

  let html = "";
  sgPostsList.forEach(post => {
    const isAuthor  = user && post.authorUid === user.uid;
    const timeAgo   = sgFormatTimeAgo(post.createdAt);
    const replyCount = post.replyCount || 0;
    const initial   = (post.authorName || "Learner").charAt(0).toUpperCase();

    html += `
      <div class="dash-card sg-post-card" id="post-card-${post.id}" style="background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 14px; padding: 1.25rem;">
        
        <!-- Post Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem;">
              ${initial}
            </div>
            <div>
              <div style="font-weight: 800; font-size: 0.95rem; color: var(--color-text-primary);">${post.authorName || "Learner"}</div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600;">${timeAgo}</div>
            </div>
          </div>

          ${isAuthor ? `
            <button class="sg-delete-post-btn" data-post-id="${post.id}" style="background: transparent; border: none; color: #ff6b6b; cursor: pointer; font-size: 0.85rem; font-weight: 700;" title="Delete post">
              🗑️ Delete
            </button>
          ` : ''}
        </div>

        <!-- Post Content -->
        <p style="margin: 0 0 1rem; color: var(--color-text-primary); font-size: 0.95rem; line-height: 1.5; white-space: pre-wrap;">${post.text}</p>

        <!-- Post Actions -->
        <div style="border-top: 1px solid var(--color-border); padding-top: 0.6rem; display: flex; align-items: center; justify-content: space-between;">
          <button class="sg-toggle-replies-btn" data-post-id="${post.id}" style="background: transparent; border: none; color: var(--color-primary); font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
            💬 Replies (${replyCount})
          </button>
        </div>

        <!-- Nested Replies Expandable Container -->
        <div id="replies-container-${post.id}" class="hidden" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--color-border); background: var(--color-bg-surface); padding: 1rem; border-radius: 12px;">
          <div id="replies-list-${post.id}" style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem;">
            <div style="text-align: center; font-size: 0.85rem; color: var(--color-text-muted);">Loading replies...</div>
          </div>

          <!-- Add Reply Form -->
          <form class="sg-reply-form" data-post-id="${post.id}" style="display: flex; gap: 0.5rem;">
            <input type="text" id="reply-input-${post.id}" placeholder="Write a reply..." required maxLength="300" style="flex: 1; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--color-border); font-size: 0.85rem;" />
            <button type="submit" class="btn-primary" style="padding: 0.5rem 0.9rem; font-size: 0.85rem;">Reply</button>
          </form>
        </div>

      </div>
    `;
  });

  feedEl.innerHTML = html;

  // Attach event handlers for Delete Post
  feedEl.querySelectorAll(".sg-delete-post-btn").forEach(btn => {
    btn.addEventListener("click", () => handleDeletePost(btn.dataset.postId));
  });

  // Attach event handlers for Replies Expand Toggle
  feedEl.querySelectorAll(".sg-toggle-replies-btn").forEach(btn => {
    btn.addEventListener("click", () => toggleRepliesThread(btn.dataset.postId));
  });

  // Attach event handlers for Reply Form Submit
  feedEl.querySelectorAll(".sg-reply-form").forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleCreateReplySubmit(form.dataset.postId);
    });
  });
}

// ── Submit New Post ───────────────────────────────────────────────
async function handleCreatePostSubmit(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user || !sgActiveGroupId) return;

  const inputEl  = document.getElementById("sg-post-input-text");
  const submitBtn = document.getElementById("sg-post-submit-btn");
  const text     = inputEl.value.trim();

  if (!text) return;

  submitBtn.disabled    = true;
  submitBtn.textContent = "Posting...";

  try {
    const authorName = sgProfile.fullName || sgProfile.displayName || "Learner";

    await db.collection("studyGroups")
      .doc(sgActiveGroupId)
      .collection("posts")
      .add({
        authorUid:  user.uid,
        authorName: authorName,
        text:       text,
        createdAt:  firebase.firestore.FieldValue.serverTimestamp(),
        replyCount: 0
      });

    inputEl.value         = "";
    submitBtn.disabled    = false;
    submitBtn.textContent = "Post Message 💬";

    // Refresh feed
    await fetchGroupPosts(true);
  } catch (err) {
    console.warn("[studygroups.js] Create post failed:", err);
    alert("Could not post message. Please try again.");
    submitBtn.disabled    = false;
    submitBtn.textContent = "Post Message 💬";
  }
}

// ── Toggle & Fetch Replies Thread (Oldest First) ─────────────────
async function toggleRepliesThread(postId) {
  const container = document.getElementById(`replies-container-${postId}`);
  if (!container) return;

  const isHidden = container.classList.toggle("hidden");
  if (!isHidden) {
    await fetchPostReplies(postId);
  }
}

async function fetchPostReplies(postId) {
  const listEl = document.getElementById(`replies-list-${postId}`);
  if (!listEl || !sgActiveGroupId) return;

  try {
    const snap = await db.collection("studyGroups")
      .doc(sgActiveGroupId)
      .collection("posts")
      .doc(postId)
      .collection("replies")
      .orderBy("createdAt", "asc") // Oldest first for replies thread
      .get();

    const user = auth.currentUser;

    if (snap.empty) {
      listEl.innerHTML = `<p style="margin: 0; font-size: 0.85rem; color: var(--color-text-muted); font-style: italic;">No replies yet. Start the conversation below!</p>`;
      return;
    }

    let html = "";
    snap.forEach(d => {
      const rep = { id: d.id, ...d.data() };
      const isAuthor = user && rep.authorUid === user.uid;
      const timeAgo  = sgFormatTimeAgo(rep.createdAt);
      const initial  = (rep.authorName || "L").charAt(0).toUpperCase();

      html += `
        <div style="background: var(--color-bg-card); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--color-border);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem;">
                ${initial}
              </div>
              <span style="font-weight: 800; font-size: 0.85rem; color: var(--color-text-primary);">${rep.authorName}</span>
              <span style="font-size: 0.72rem; color: var(--color-text-muted);">${timeAgo}</span>
            </div>
            ${isAuthor ? `
              <button class="sg-delete-reply-btn" data-post-id="${postId}" data-reply-id="${rep.id}" style="background: transparent; border: none; color: #ff6b6b; cursor: pointer; font-size: 0.75rem; font-weight: 700;">
                Delete
              </button>
            ` : ''}
          </div>
          <p style="margin: 0; font-size: 0.88rem; color: var(--color-text-primary); white-space: pre-wrap;">${rep.text}</p>
        </div>
      `;
    });

    listEl.innerHTML = html;

    // Attach Delete Reply listeners
    listEl.querySelectorAll(".sg-delete-reply-btn").forEach(btn => {
      btn.addEventListener("click", () => handleDeleteReply(btn.dataset.postId, btn.dataset.replyId));
    });

  } catch (err) {
    console.warn("[studygroups.js] Could not fetch replies:", err);
    listEl.innerHTML = `<p style="margin: 0; font-size: 0.85rem; color: var(--color-text-muted);">Could not load replies.</p>`;
  }
}

// ── Submit Reply to Post (Increments replyCount via FieldValue.increment)
async function handleCreateReplySubmit(postId) {
  const user = auth.currentUser;
  if (!user || !sgActiveGroupId) return;

  const inputEl = document.getElementById(`reply-input-${postId}`);
  const text    = inputEl ? inputEl.value.trim() : "";

  if (!text) return;

  try {
    const authorName = sgProfile.fullName || sgProfile.displayName || "Learner";
    const postRef    = db.collection("studyGroups").doc(sgActiveGroupId).collection("posts").doc(postId);

    // 1. Add reply doc
    await postRef.collection("replies").add({
      authorUid:  user.uid,
      authorName: authorName,
      text:       text,
      createdAt:  firebase.firestore.FieldValue.serverTimestamp()
    });

    // 2. Increment parent post replyCount using FieldValue.increment(1)
    await postRef.update({
      replyCount: firebase.firestore.FieldValue.increment(1)
    });

    inputEl.value = "";

    // Update local post count
    const postObj = sgPostsList.find(p => p.id === postId);
    if (postObj) postObj.replyCount = (postObj.replyCount || 0) + 1;

    // Refresh replies view
    await fetchPostReplies(postId);

  } catch (err) {
    console.warn("[studygroups.js] Create reply failed:", err);
    alert("Could not post reply.");
  }
}

// ── Delete Post (Includes explicit Batch Delete of nested Replies)
async function handleDeletePost(postId) {
  const user = auth.currentUser;
  if (!user || !sgActiveGroupId) return;

  if (!confirm("Are you sure you want to delete this post and its replies?")) return;

  try {
    const postRef = db.collection("studyGroups").doc(sgActiveGroupId).collection("posts").doc(postId);

    // 1. Explicitly fetch and batch-delete all subcollection replies to avoid orphaned data
    const repliesSnap = await postRef.collection("replies").get();
    if (!repliesSnap.empty) {
      const batch = db.batch();
      repliesSnap.forEach(rDoc => batch.delete(rDoc.ref));
      await batch.commit();
      console.log(`[studygroups.js] ✅ Batch-deleted ${repliesSnap.docs.length} replies for post ${postId}`);
    }

    // 2. Delete parent post doc
    await postRef.delete();

    // 3. Update local array
    sgPostsList = sgPostsList.filter(p => p.id !== postId);
    renderPostsFeed();

  } catch (err) {
    console.warn("[studygroups.js] Delete post failed:", err);
    alert("Could not delete post.");
  }
}

// ── Delete Reply (Decrements replyCount via FieldValue.increment(-1))
async function handleDeleteReply(postId, replyId) {
  const user = auth.currentUser;
  if (!user || !sgActiveGroupId) return;

  try {
    const postRef  = db.collection("studyGroups").doc(sgActiveGroupId).collection("posts").doc(postId);
    const replyRef = postRef.collection("replies").doc(replyId);

    // 1. Delete reply doc
    await replyRef.delete();

    // 2. Decrement parent post replyCount using FieldValue.increment(-1)
    await postRef.update({
      replyCount: firebase.firestore.FieldValue.increment(-1)
    });

    // Update local post count
    const postObj = sgPostsList.find(p => p.id === postId);
    if (postObj && postObj.replyCount > 0) postObj.replyCount--;

    // Refresh replies view
    await fetchPostReplies(postId);

  } catch (err) {
    console.warn("[studygroups.js] Delete reply failed:", err);
    alert("Could not delete reply.");
  }
}

// ── Handle Group Creation Submit ──────────────────────────────────
async function handleCreateGroupSubmit(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const nameInput     = document.getElementById("sg-input-name");
  const descInput     = document.getElementById("sg-input-desc");
  const nativeLangEl   = document.getElementById("sg-input-native-lang");
  const learningLangEl = document.getElementById("sg-input-learning-lang");
  const submitBtn     = document.getElementById("sg-submit-btn");
  const msgEl         = document.getElementById("sg-form-msg");

  const name         = nameInput.value.trim();
  const desc         = descInput.value.trim();
  const nativeLang   = nativeLangEl.value;
  const learningLang = learningLangEl.value;

  if (!name || !desc) return;

  submitBtn.disabled    = true;
  submitBtn.textContent = "Creating...";

  try {
    const newDocRef = await db.collection("studyGroups").add({
      name:             name,
      description:      desc,
      nativeLanguage:   nativeLang,
      learningLanguage: learningLang,
      language:         learningLang,
      createdBy:        user.uid,
      members:          [user.uid],
      memberCount:      1,
      isPublic:         true,
      createdAt:        firebase.firestore.FieldValue.serverTimestamp()
    });

    const updatedIds = [...(sgProfile.studyGroupIds || []), newDocRef.id];
    sgProfile.studyGroupIds = updatedIds;

    await db.collection("users").doc(user.uid).update({
      studyGroupIds: firebase.firestore.FieldValue.arrayUnion(newDocRef.id)
    });

    console.log(`[studygroups.js] ✅ Created study group ${newDocRef.id}`);

    sgActiveGroupId = newDocRef.id;
    sgActiveTab     = "detail";
    renderStudyGroupsUI();
  } catch (err) {
    console.warn("[studygroups.js] Create group failed:", err);
    if (msgEl) {
      msgEl.classList.remove("hidden");
      msgEl.style.background = "rgba(255, 107, 107, 0.15)";
      msgEl.style.color      = "#d63031";
      msgEl.textContent      = "Could not create group. Please check fields and try again.";
    }
    submitBtn.disabled    = false;
    submitBtn.textContent = "Create Group & Join";
  }
}

// ── Handle Join Group (Atomic Firestore Transaction) ──────────────
async function handleJoinGroup(groupId) {
  const user = auth.currentUser;
  if (!user) return;

  const groupRef = db.collection("studyGroups").doc(groupId);
  const userRef  = db.collection("users").doc(user.uid);

  try {
    await db.runTransaction(async (transaction) => {
      const gDoc = await transaction.get(groupRef);
      if (!gDoc.exists) throw new Error("Group does not exist.");

      const gData       = gDoc.data();
      const members     = gData.members || [];
      const memberCount = gData.memberCount || members.length;

      if (members.includes(user.uid)) return;
      if (memberCount >= 50) throw new Error("Group is full (max 50 members).");

      transaction.update(groupRef, {
        members:     firebase.firestore.FieldValue.arrayUnion(user.uid),
        memberCount: firebase.firestore.FieldValue.increment(1)
      });

      transaction.update(userRef, {
        studyGroupIds: firebase.firestore.FieldValue.arrayUnion(groupId)
      });
    });

    sgProfile.studyGroupIds = [...(sgProfile.studyGroupIds || []), groupId];
    console.log(`[studygroups.js] ✅ Joined group ${groupId}`);

    sgActiveGroupId = groupId;
    sgActiveTab     = "detail";
    renderStudyGroupsUI();
  } catch (err) {
    console.warn("[studygroups.js] Join group failed:", err);
    alert(err.message || "Could not join group.");
  }
}

// ── Handle Leave Group (Atomic Firestore Transaction) ─────────────
async function handleLeaveGroup(groupId) {
  const user = auth.currentUser;
  if (!user) return;

  const groupRef = db.collection("studyGroups").doc(groupId);
  const userRef  = db.collection("users").doc(user.uid);

  try {
    await db.runTransaction(async (transaction) => {
      const gDoc = await transaction.get(groupRef);
      if (gDoc.exists) {
        transaction.update(groupRef, {
          members:     firebase.firestore.FieldValue.arrayRemove(user.uid),
          memberCount: firebase.firestore.FieldValue.increment(-1)
        });
      }

      transaction.update(userRef, {
        studyGroupIds: firebase.firestore.FieldValue.arrayRemove(groupId)
      });
    });

    sgProfile.studyGroupIds = (sgProfile.studyGroupIds || []).filter(id => id !== groupId);
    console.log(`[studygroups.js] ✅ Left group ${groupId}`);

    sgActiveTab = "my-groups";
    renderStudyGroupsUI();
  } catch (err) {
    console.warn("[studygroups.js] Leave group failed:", err);
    alert("Could not leave group.");
  }
}
