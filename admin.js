/**
 * admin.js — Admin Dashboard Logic
 *
 * SECURITY NOTE: The isAdmin check below is a client-side convenience
 * that redirects non-admins away and avoids rendering admin data in the
 * DOM. It is NOT sufficient security on its own — Firestore Security
 * Rules must also restrict reads of other users' documents to accounts
 * with isAdmin == true server-side. See the rules snippet provided
 * alongside this file. Without matching security rules, any signed-in
 * user could bypass this page entirely and query Firestore directly
 * from the browser console.
 */
let currentAdminUid = null;
let allUsersCache = [];
let currentSort = "xp_desc";
let currentSearch = "";

const ADMIN_SKILL_META = {
  reading: { icon: "<i data-lucide=\"book-open\"></i>", label: "Reading" },
  writing: { icon: "<i data-lucide=\"pen-tool\"></i>", label: "Writing" },
  listening: { icon: "<i data-lucide=\"headphones\"></i>", label: "Listening" },
  speaking: { icon: "<i data-lucide=\"mic\"></i>", label: "Speaking" },
  pronunciation: { icon: "<i data-lucide=\"type\"></i>", label: "Pronunciation" },
};

function setupAdminPage() {
  if (window.lucide) lucide.createIcons();
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    try {
      const profile = await getUserProfile(user.uid);

      if (!profile || profile.isAdmin !== true) {
        showAccessDenied();
        return;
      }
      currentAdminUid = user.uid;
      const nameEl = document.getElementById("admin-name");
      const avatarEl = document.getElementById("admin-avatar");
      if (nameEl) nameEl.textContent = profile.fullName || "Admin";
      if (avatarEl)
        avatarEl.textContent = (profile.fullName || "A")
          .charAt(0)
          .toUpperCase();

      const dateEl = document.getElementById("topbar-date");
      if (dateEl)
        dateEl.textContent = new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

      await loadAllUsers();
      renderOverview();
      renderUsersTable();
      renderAdminLeaderboard();
      setupAdminEvents();
      setupAnnouncementPosting();
      loadAnnouncements();
      loadFeedback();
      loadErrorLogs();

      document.getElementById("loading-overlay").classList.add("hidden");
      document.getElementById("admin-content").classList.remove("hidden");
    } catch (err) {
      console.error("Admin dashboard failed to load:", err);
      document.getElementById("loading-overlay").classList.add("hidden");
      showAccessDenied();
    }
  });
}

function showAccessDenied() {
  document.getElementById("loading-overlay").classList.add("hidden");
  document.getElementById("admin-content").classList.remove("hidden");
  document.getElementById("admin-access-denied").classList.remove("hidden");
  const mainBody = document.getElementById("admin-main-body");
  if (mainBody) mainBody.classList.add("hidden");
  const sidebar = document.querySelector(".dash-sidebar");
  if (sidebar) sidebar.classList.add("hidden");
  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 3000);
}

// ─── Data Loading ─────────────────────────────────────────────

function dateStr(d) {
  return d.toISOString().split("T")[0];
}

async function loadAllUsers() {
  const snap = await db.collection("users").get();
  allUsersCache = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      uid: doc.id,
      fullName: d.fullName || "Unknown",
      email: d.email || "",
      xp: d.xp || 0,
      streak: d.streak || 0,
      coins: d.coins || 0,
      currentLevel: d.currentLevel || d.assessmentLevel || "beginner",
      assessmentScore:
        typeof d.assessmentScore === "number" ? d.assessmentScore : null,
      assessmentCompleted: !!d.assessmentCompleted,
      completedLessons: d.completedLessons || [],
      badgesEarned: d.badgesEarned || [],
      lastActiveDate: d.lastActiveDate || null,
      createdAt:
        d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : null,
      literacyLevel: d.literacyLevel || "",
      ageGroup: d.ageGroup || "",
      preferredLanguage: d.preferredLanguage || "en",
      isBanned: !!d.isBanned,
      isAdmin: !!d.isAdmin,
    };
  });
}

// ─── Overview ───────────────────────────────────────────────

function computeOverviewStats() {
  const users = allUsersCache;
  const today = dateStr(new Date());
  const weekAgo = dateStr(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

  const totalUsers = users.length;
  const activeToday = users.filter((u) => u.lastActiveDate === today).length;
  const activeWeek = users.filter(
    (u) => u.lastActiveDate && u.lastActiveDate >= weekAgo,
  ).length;

  const assessed = users.filter(
    (u) => u.assessmentCompleted && typeof u.assessmentScore === "number",
  );
  const avgScore = assessed.length
    ? Math.round(
        assessed.reduce((s, u) => s + u.assessmentScore, 0) / assessed.length,
      )
    : null;

  const totalLessons = users.reduce((s, u) => s + u.completedLessons.length, 0);
  const totalXP = users.reduce((s, u) => s + u.xp, 0);

  return {
    totalUsers,
    activeToday,
    activeWeek,
    avgScore,
    totalLessons,
    totalXP,
  };
}

function renderOverview() {
  const stats = computeOverviewStats();

  setText("admin-stat-total-users", stats.totalUsers);
  setText("admin-stat-active-today", stats.activeToday);
  setText("admin-stat-active-week", stats.activeWeek);
  setText(
    "admin-stat-avg-score",
    stats.avgScore !== null ? stats.avgScore + "%" : "—",
  );
  setText("admin-stat-lessons", stats.totalLessons);
  setText("admin-stat-xp", stats.totalXP);

  renderLevelDistribution();
  renderSignupTrend();
  renderRecentActivity();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderLevelDistribution() {
  const container = document.getElementById("admin-level-distribution");
  if (!container) return;

  const levels = [
    {
      key: "beginner",
      label: "Beginner",
      icon: "<i data-lucide=\"sprout\"></i>",
      color: "var(--color-warm-light,#f59e0b)",
    },
    {
      key: "intermediate",
      label: "Intermediate",
      icon: "<i data-lucide=\"book\"></i>",
      color: "var(--color-primary)",
    },
    {
      key: "advanced",
      label: "Advanced",
      icon: "<i data-lucide=\"rocket\"></i>",
      color: "var(--color-accent)",
    },
  ];
  const total = allUsersCache.length || 1;

  container.innerHTML = levels
    .map((lvl) => {
      const count = allUsersCache.filter(
        (u) => u.currentLevel === lvl.key,
      ).length;
      const pct = Math.round((count / total) * 100);
      return `<div class="skill-bar-item">
      <div class="skill-bar-meta">
        <span class="skill-bar-label">${lvl.icon} ${lvl.label}</span>
        <span class="skill-bar-status-tag" style="background:rgba(108,99,255,0.08);color:var(--color-text-secondary)">${count} users · ${pct}%</span>
      </div>
      <div class="skill-bar-track"><div class="skill-bar-fill" style="width:${pct}%;background:${lvl.color};"></div></div>
    </div>`;
    })
    .join("");
}

function renderSignupTrend() {
  const container = document.getElementById("admin-signup-chart");
  if (!container) return;

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      dateStr: dateStr(d),
      label: d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      }),
      count: 0,
    });
  }

  allUsersCache.forEach((u) => {
    if (!u.createdAt) return;
    const ds = dateStr(u.createdAt);
    const day = days.find((d) => d.dateStr === ds);
    if (day) day.count++;
  });

  const max = Math.max(...days.map((d) => d.count), 1);

  container.innerHTML = days
    .map(
      (d) => `
    <div class="bar-col" title="${d.label}: ${d.count} signup${d.count === 1 ? "" : "s"}">
      <div class="bar-fill ${d.count > 0 ? "active" : "empty"}" style="height:${d.count ? Math.max((d.count / max) * 100, 6) : 0}%;"></div>
      <span class="bar-label">${d.label.split(" ")[0]}</span>
    </div>`,
    )
    .join("");
}

async function renderRecentActivity() {
  const container = document.getElementById("admin-activity-feed");
  const emptyState = document.getElementById("admin-activity-empty");
  if (!container) return;

  container.innerHTML =
    '<div class="analysis-empty-state">Loading recent activity…</div>';

  try {
    // NOTE: this collectionGroup query requires a one-time Firestore
    // index. The first time it runs, if the index doesn't exist yet,
    // Firestore throws an error containing a direct link to auto-create
    // it — check the browser console for that link if this section
    // shows an error state below.
    const snap = await db
      .collectionGroup("lessonHistory")
      .orderBy("completedAt", "desc")
      .limit(20)
      .get();

    if (snap.empty) {
      container.innerHTML = "";
      if (emptyState) {
        emptyState.textContent = "No recent activity yet.";
        emptyState.classList.remove("hidden");
      }
      return;
    }
    if (emptyState) emptyState.classList.add("hidden");

    const userMap = {};
    allUsersCache.forEach((u) => {
      userMap[u.uid] = u;
    });

    container.innerHTML = snap.docs
      .map((doc) => {
        const d = doc.data();
        const uid = doc.ref && doc.ref.parent && doc.ref.parent.parent ? doc.ref.parent.parent.id : "";
        const user = userMap[uid];
        const name = user ? user.fullName : "Learner";
        const meta = ADMIN_SKILL_META[d.type] || {
          icon: '<i data-lucide="pin"></i>',
          label: d.type || "Practice",
        };
        const when =
          d.completedAt && d.completedAt.toDate
            ? timeAgo(d.completedAt.toDate())
            : "Recently";

        const accuracy = typeof d.accuracy === "number" ? d.accuracy : (d.score || 0);
        const isGood = accuracy >= 70;
        const isMed = accuracy >= 40;
        const badgeBg = isGood ? "#dcfce7" : isMed ? "#fef3c7" : "#fef2f2";
        const badgeColor = isGood ? "#15803d" : isMed ? "#b45309" : "#dc2626";
        const badgeBorder = isGood ? "#86efac" : isMed ? "#fde68a" : "#fca5a5";
        const initial = (name || "U").charAt(0).toUpperCase();

        return `
        <div class="admin-activity-row" style="display: flex; align-items: center; justify-content: space-between; gap: 0.85rem; padding: 0.95rem 1.15rem; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; margin-bottom: 0.75rem; box-shadow: 0 4px 14px rgba(15,23,42,0.03); transition: all 0.2s ease;">
          <div style="display: flex; align-items: center; gap: 0.85rem; min-width: 0; flex: 1;">
            <div style="width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; font-weight: 900; font-size: 1.05rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99,102,241,0.25); flex-shrink: 0;">
              ${initial}
            </div>
            <div style="min-width: 0; flex: 1;">
              <div style="font-weight: 800; font-size: 0.95rem; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${name}
              </div>
              <div style="font-size: 0.82rem; color: #64748b; font-weight: 600; margin-top: 0.15rem; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                <span style="background: #f1f5f9; color: #475569; padding: 0.15rem 0.55rem; border-radius: 9999px; font-weight: 800; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.25rem;">
                  ${meta.icon} ${meta.label}
                </span>
                <span>completed lesson</span>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.85rem; flex-shrink: 0;">
            <span style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; padding: 0.3rem 0.75rem; border-radius: 9999px; font-weight: 800; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;">
              <i data-lucide="check-circle-2" style="width: 13px; height: 13px;"></i> ${accuracy}%
            </span>
            <span style="font-size: 0.8rem; font-weight: 700; color: #94a3b8; display: inline-flex; align-items: center; gap: 0.3rem; min-width: 65px; justify-content: flex-end;">
              <i data-lucide="clock" style="width: 13px; height: 13px;"></i> ${when}
            </span>
          </div>
        </div>`;
      })
      .join("");
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.warn(
      "Recent activity unavailable — this usually means the Firestore composite index for the lessonHistory collection group hasn't been created yet. Check this console error for a direct link to create it:",
      err,
    );
    container.innerHTML = "";
    if (emptyState) {
      emptyState.textContent =
        "Recent activity needs a one-time Firestore index. Open the browser console for a direct setup link from Firestore.";
      emptyState.classList.remove("hidden");
    }
  }
}

function timeAgo(date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

let currentLevelFilter = "all";

// ─── Users Table ────────────────────────────────────────────

function renderUsersTable() {
  const tbody = document.getElementById("admin-users-tbody");
  if (!tbody) return;

  // 1. Update metric summary cards for User tab
  const totalCount = allUsersCache.length;
  const today = dateStr(new Date());
  const activeCount = allUsersCache.filter((u) => u.lastActiveDate === today).length;
  const assessedCount = allUsersCache.filter(
    (u) => u.assessmentCompleted && typeof u.assessmentScore === "number"
  ).length;
  const totalXP = allUsersCache.reduce((s, u) => s + (u.xp || 0), 0);
  const avgXP = totalCount ? Math.round(totalXP / totalCount) : 0;

  setText("admin-user-stat-total", totalCount);
  setText("admin-user-stat-active", activeCount);
  setText("admin-user-stat-assessed", assessedCount);
  setText("admin-user-stat-avgxp", avgXP.toLocaleString());

  // 2. Filter list by search query and level filter
  let list = allUsersCache.filter((u) => {
    if (currentLevelFilter && currentLevelFilter !== "all") {
      if ((u.currentLevel || "beginner").toLowerCase() !== currentLevelFilter) {
        return false;
      }
    }
    if (!currentSearch) return true;
    const q = currentSearch.toLowerCase();
    return (
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  // 3. Sort list
  const sorters = {
    xp_desc: (a, b) => (b.xp || 0) - (a.xp || 0),
    streak_desc: (a, b) => (b.streak || 0) - (a.streak || 0),
    score_desc: (a, b) => (b.assessmentScore || 0) - (a.assessmentScore || 0),
    name_asc: (a, b) => (a.fullName || "").localeCompare(b.fullName || ""),
    active_desc: (a, b) =>
      (b.lastActiveDate || "").localeCompare(a.lastActiveDate || ""),
  };
  list = [...list].sort(sorters[currentSort] || sorters.xp_desc);

  // Update count badge text
  const countText = document.getElementById("admin-users-count-text");
  if (countText) {
    countText.textContent = `Showing ${list.length} of ${totalCount} learners`;
  }

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="padding: 3.5rem 1rem; text-align: center; color: #64748b;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #f1f5f9; color: #94a3b8; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;">
            <i data-lucide="user-x" style="width: 28px; height: 28px;"></i>
          </div>
          <div style="font-weight: 800; font-size: 1.05rem; color: #334155; margin-bottom: 0.25rem;">No learners match your query</div>
          <div style="font-size: 0.88rem; color: #94a3b8;">Try adjusting your search terms or level filters.</div>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const LEVEL_CONFIG = {
    beginner: { label: "Beginner", bg: "#fef3c7", color: "#b45309", border: "#fde68a", icon: "sprout" },
    intermediate: { label: "Intermediate", bg: "#e0e7ff", color: "#4338ca", border: "#c7d2fe", icon: "compass" },
    advanced: { label: "Advanced", bg: "#f3e8ff", color: "#6b21a8", border: "#e9d5ff", icon: "award" }
  };

  tbody.innerHTML = list
    .map((u) => {
      const initial = (u.fullName || "U").charAt(0).toUpperCase();
      const level = (u.currentLevel || "beginner").toLowerCase();
      const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.beginner;

      const isToday = u.lastActiveDate === today;
      const score = u.assessmentScore;
      const scoreBadge = (score !== null && score !== undefined)
        ? `<span style="background:${score >= 80 ? '#dcfce7' : score >= 50 ? '#e0e7ff' : '#fef3c7'}; color:${score >= 80 ? '#15803d' : score >= 50 ? '#3730a3' : '#b45309'}; border: 1px solid ${score >= 80 ? '#86efac' : score >= 50 ? '#a5b4fc' : '#fde68a'}; border-radius: 9999px; padding: 0.3rem 0.75rem; font-weight: 800; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 0.25rem;"><i data-lucide="check-circle-2" style="width:13px; height:13px;"></i> ${score}%</span>`
        : `<span style="color:#94a3b8; font-weight:700; font-size:0.82rem;">—</span>`;

      return `
      <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#ffffff'">
        <td style="padding: 1rem 1.25rem;">
          <div class="admin-user-cell" style="display: flex; align-items: center; gap: 0.85rem;">
            <div class="admin-user-avatar" style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; font-weight: 900; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99,102,241,0.25); flex-shrink: 0;">
              ${initial}
            </div>
            <div>
              <div class="admin-user-name" style="font-weight: 800; font-size: 0.95rem; color: #0f172a; display: flex; align-items: center; gap: 0.5rem;">
                ${u.fullName || "Unnamed Learner"}
                ${u.isBanned ? '<span style="background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; padding: 0.15rem 0.5rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 800;">Suspended</span>' : ''}
                ${u.isAdmin ? '<span style="background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe; padding: 0.15rem 0.5rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 800;">Admin</span>' : ''}
              </div>
              <div class="admin-user-email" style="font-size: 0.82rem; font-weight: 600; color: #64748b; margin-top: 0.1rem;">${u.email || "No email"}</div>
            </div>
          </div>
        </td>
        <td style="padding: 1rem 1.25rem;">
          <span style="background: ${cfg.bg}; color: ${cfg.color}; border: 1px solid ${cfg.border}; padding: 0.35rem 0.8rem; border-radius: 9999px; font-weight: 800; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 0.35rem;">
            <i data-lucide="${cfg.icon}" style="width: 14px; height: 14px;"></i>
            ${cfg.label}
          </span>
        </td>
        <td style="padding: 1rem 1.25rem;">${scoreBadge}</td>
        <td style="padding: 1rem 1.25rem;">
          <span style="background: #eef2ff; color: #4f46e5; border-radius: 9999px; padding: 0.3rem 0.75rem; font-weight: 800; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 0.3rem;">
            <i data-lucide="zap" style="width: 13px; height: 13px; color: #6366f1;"></i> ${u.xp || 0}
          </span>
        </td>
        <td style="padding: 1rem 1.25rem;">
          <span style="background: #fff7ed; color: #ea580c; border-radius: 9999px; padding: 0.3rem 0.75rem; font-weight: 800; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 0.3rem;">
            <i data-lucide="flame" style="width: 13px; height: 13px; color: #f97316;"></i> ${u.streak || 0}d
          </span>
        </td>
        <td style="padding: 1rem 1.25rem;">
          <span style="background: #f1f5f9; color: #475569; border-radius: 9999px; padding: 0.3rem 0.75rem; font-weight: 800; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 0.3rem;">
            <i data-lucide="book-open" style="width: 13px; height: 13px; color: #64748b;"></i> ${(u.completedLessons || []).length}
          </span>
        </td>
        <td style="padding: 1rem 1.25rem;">
          ${isToday
            ? '<span style="display:inline-flex; align-items:center; gap:0.4rem; color:#16a34a; font-weight:800; font-size:0.82rem;"><span style="width:8px; height:8px; border-radius:50%; background:#22c55e; box-shadow:0 0 8px #22c55e; display:inline-block;"></span> Active Today</span>'
            : `<span style="color:#64748b; font-weight:600; font-size:0.82rem;">${u.lastActiveDate || "Never"}</span>`}
        </td>
        <td style="padding: 1rem 1.25rem; text-align: right;">
          <button class="admin-view-btn" data-uid="${u.uid}" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; border: none; border-radius: 12px; padding: 0.5rem 1.05rem; font-weight: 800; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; box-shadow: 0 4px 14px rgba(99,102,241,0.25); transition: all 0.2s ease;">
            <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
          </button>
        </td>
      </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll(".admin-view-btn").forEach((btn) => {
    btn.addEventListener("click", () => openUserDetailModal(btn.dataset.uid));
  });
  if (window.lucide) lucide.createIcons();
}

// ─── Events ─────────────────────────────────────────────────

function setupAdminEvents() {
  const searchInput = document.getElementById("admin-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value;
      renderUsersTable();
    });
  }

  const levelFilterSelect = document.getElementById("admin-filter-level");
  if (levelFilterSelect) {
    levelFilterSelect.addEventListener("change", (e) => {
      currentLevelFilter = e.target.value;
      renderUsersTable();
    });
  }

  const sortSelect = document.getElementById("admin-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderUsersTable();
    });
  }

  const awardBtn = document.getElementById("admin-award-top3-btn");
  if (awardBtn) {
    awardBtn.addEventListener("click", awardTopThree);
  }

  const exportBtn = document.getElementById("admin-export-btn");
  if (exportBtn) exportBtn.addEventListener("click", exportUsersCSV);

  document.querySelectorAll(".dash-nav-item[data-section]").forEach((item) => {
    item.addEventListener("click", () => {
      document
        .querySelectorAll(".dash-nav-item[data-section]")
        .forEach((n) => n.classList.remove("active"));
      const targetSec = item.dataset.section;
      document
        .querySelectorAll(`.dash-nav-item[data-section="${targetSec}"]`)
        .forEach((n) => n.classList.add("active"));
      document
        .querySelectorAll(".admin-section")
        .forEach((s) => s.classList.add("hidden"));
      const target = document.getElementById(
        "admin-section-" + item.dataset.section,
      );
      if (target) target.classList.remove("hidden");
    });
  });

  const refreshBtn = document.getElementById("admin-refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = "Refreshing…";
      await loadAllUsers();
      renderOverview();
      renderUsersTable();
      renderAdminLeaderboard();
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = "<i data-lucide='refresh-cw' class='inline-icon'></i> Refresh";
      if (window.lucide) lucide.createIcons();
    });
  }

  const modal = document.getElementById("admin-user-modal");
  const modalCloseBtn = document.getElementById("admin-modal-close");
  if (modalCloseBtn && modal) {
    modalCloseBtn.addEventListener("click", () =>
      modal.classList.add("hidden"),
    );
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });
  }

  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logoutUser().then(() => (window.location.href = "login.html"));
    });
  }
}

function exportUsersCSV() {
  const headers = [
    "Name",
    "Email",
    "Level",
    "Score",
    "XP",
    "Streak",
    "Lessons Completed",
    "Badges",
    "Last Active",
    "Joined",
  ];
  const rows = allUsersCache.map((u) => [
    u.fullName,
    u.email,
    u.currentLevel,
    u.assessmentScore ?? "",
    u.xp,
    u.streak,
    u.completedLessons.length,
    u.badgesEarned.length,
    u.lastActiveDate || "",
    u.createdAt ? dateStr(u.createdAt) : "",
  ]);
  const csv = [headers, ...rows]
    .map((r) =>
      r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aksharGyan-users-${dateStr(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── User Detail Modal ──────────────────────────────────────

async function openUserDetailModal(uid) {
  const user = allUsersCache.find((u) => u.uid === uid);
  if (!user) return;

  const modal = document.getElementById("admin-user-modal");

  setText("admin-modal-avatar", (user.fullName || "U").charAt(0).toUpperCase());
  setText("admin-modal-name", user.fullName);
  setText("admin-modal-email", user.email);

  const levelEl = document.getElementById("admin-modal-level");
  if (levelEl) {
    levelEl.className = `rec-card-tag ${user.currentLevel}`;
    levelEl.textContent =
      user.currentLevel.charAt(0).toUpperCase() + user.currentLevel.slice(1);
  }

  setText("admin-modal-xp", user.xp);
  setText("admin-modal-streak", user.streak);
  setText("admin-modal-lessons", user.completedLessons.length);
  setText("admin-modal-badges", user.badgesEarned.length);

  document.getElementById("admin-modal-skill-bars").innerHTML =
    '<div class="analysis-empty-state">Loading…</div>';
  document.getElementById("admin-modal-trend-chart").innerHTML = "";

  modal.classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
  document.getElementById("admin-edit-name").value = user.fullName || "";
  document.getElementById("admin-edit-level").value =
    user.currentLevel || "beginner";
  document.getElementById("admin-edit-xp").value = user.xp || 0;
  document.getElementById("admin-edit-streak").value = user.streak || 0;
  document.getElementById("admin-edit-coins").value = user.coins || 0;

  updateModalDangerButtons(user);

  document.getElementById("admin-save-edit-btn").onclick = () =>
    saveUserEdits(uid);
  document.getElementById("admin-ban-btn").onclick = () => toggleUserBan(uid);
  document.getElementById("admin-reset-btn").onclick = () =>
    resetUserProgress(uid);
  document.getElementById("admin-toggle-admin-btn").onclick = () =>
    toggleAdminStatus(uid);
  document.getElementById("admin-delete-btn").onclick = () =>
    deleteUserAccount(uid);

  try {
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("lessonHistory")
      .orderBy("completedAt", "asc")
      .get();

    const history = snap.docs.map((d) => {
      const r = d.data();
      return {
        type: r.type || "reading",
        accuracy: typeof r.accuracy === "number" ? r.accuracy : 0,
        completedAt:
          r.completedAt && r.completedAt.toDate ? r.completedAt.toDate() : null,
      };
    });

    renderModalSkillBreakdown(history);
    renderModalAccuracyTrend(history);
  } catch (err) {
    console.error("Error loading user lesson history:", err);
    document.getElementById("admin-modal-skill-bars").innerHTML =
      '<div class="analysis-empty-state">Could not load lesson history for this user.</div>';
  }
}

function updateModalDangerButtons(user) {
  const banBtn = document.getElementById("admin-ban-btn");
  const adminBtn = document.getElementById("admin-toggle-admin-btn");
  if (banBtn)
    banBtn.innerHTML = user.isBanned
      ? "<i data-lucide='unlock' class='inline-icon'></i> Reinstate User"
      : "<i data-lucide='ban' class='inline-icon'></i> Suspend User";
  if (adminBtn)
    adminBtn.innerHTML = user.isAdmin ? "<i data-lucide='arrow-down' class='inline-icon'></i> Revoke Admin" : "<i data-lucide='arrow-up' class='inline-icon'></i> Make Admin";
  if (window.lucide) lucide.createIcons();
}

async function saveUserEdits(uid) {
  const btn = document.getElementById("admin-save-edit-btn");
  const original = btn.innerHTML;
  btn.innerHTML = "Saving…";
  btn.disabled = true;

  const updates = {
    fullName: document.getElementById("admin-edit-name").value.trim(),
    currentLevel: document.getElementById("admin-edit-level").value,
    xp: parseInt(document.getElementById("admin-edit-xp").value, 10) || 0,
    streak:
      parseInt(document.getElementById("admin-edit-streak").value, 10) || 0,
    coins: parseInt(document.getElementById("admin-edit-coins").value, 10) || 0,
  };

  try {
    await db.collection("users").doc(uid).update(updates);
    const cached = allUsersCache.find((u) => u.uid === uid);
    if (cached) Object.assign(cached, updates);
    renderUsersTable();
    btn.innerHTML = "Saved <i data-lucide='check' class='inline-icon'></i>";
  } catch (err) {
    console.error("Failed to save user edits:", err);
    btn.innerHTML = "Error — see console";
  } finally {
    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
      if (window.lucide) lucide.createIcons();
    }, 1500);
  }
}

async function toggleUserBan(uid) {
  const cached = allUsersCache.find((u) => u.uid === uid);
  if (!cached) return;
  const newState = !cached.isBanned;
  if (!confirm(`${newState ? "Suspend" : "Reinstate"} ${cached.fullName}?`))
    return;

  try {
    await db.collection("users").doc(uid).update({ isBanned: newState });
    cached.isBanned = newState;
    renderUsersTable();
    updateModalDangerButtons(cached);
  } catch (err) {
    console.error("Failed to update ban status:", err);
    alert("Could not update ban status — check console.");
  }
}

async function resetUserProgress(uid) {
  const cached = allUsersCache.find((u) => u.uid === uid);
  if (!cached) return;
  if (
    !confirm(
      `Reset ALL progress for ${cached.fullName}? This clears XP, streak, lessons, and badges. This cannot be undone.`,
    )
  )
    return;

  const resetData = {
    xp: 0,
    streak: 0,
    coins: 0,
    completedLessons: [],
    badgesEarned: [],
    lastActiveDate: null,
    practiceDays: [],
    gamesCompleted: 0,
  };

  try {
    await db.collection("users").doc(uid).update(resetData);
    Object.assign(cached, resetData);
    renderUsersTable();
    openUserDetailModal(uid);
  } catch (err) {
    console.error("Failed to reset progress:", err);
    alert("Could not reset progress — check console.");
  }
}

async function toggleAdminStatus(uid) {
  if (uid === currentAdminUid) {
    alert("You can't change your own admin status from here.");
    return;
  }
  const cached = allUsersCache.find((u) => u.uid === uid);
  if (!cached) return;
  const newState = !cached.isAdmin;
  if (
    !confirm(
      `${newState ? "Grant" : "Revoke"} admin access for ${cached.fullName}?`,
    )
  )
    return;

  try {
    await db.collection("users").doc(uid).update({ isAdmin: newState });
    cached.isAdmin = newState;
    updateModalDangerButtons(cached);
  } catch (err) {
    console.error("Failed to update admin status:", err);
    alert("Could not update admin status — check console.");
  }
}

async function deleteUserAccount(uid) {
  const cached = allUsersCache.find((u) => u.uid === uid);
  if (!cached) return;
  if (uid === currentAdminUid) {
    alert("You can't delete your own account from here.");
    return;
  }
  if (
    !confirm(
      `Delete ${cached.fullName}'s data permanently? This removes their profile and cannot be undone.`,
    )
  )
    return;
  if (!confirm("Really sure? This is your last confirmation.")) return;

  try {
    await db.collection("users").doc(uid).delete();
    allUsersCache = allUsersCache.filter((u) => u.uid !== uid);
    renderUsersTable();
    renderOverview();
    document.getElementById("admin-user-modal").classList.add("hidden");
  } catch (err) {
    console.error("Failed to delete user:", err);
    alert("Could not delete user — check console.");
  }
}

function renderModalSkillBreakdown(history) {
  const container = document.getElementById("admin-modal-skill-bars");
  if (!history.length) {
    container.innerHTML =
      '<div class="analysis-empty-state">No lessons completed yet.</div>';
    return;
  }

  const bySkill = {};
  history.forEach((h) => {
    (bySkill[h.type] = bySkill[h.type] || []).push(h);
  });

  container.innerHTML = Object.keys(ADMIN_SKILL_META)
    .map((type) => {
      const attempts = bySkill[type] || [];
      const meta = ADMIN_SKILL_META[type];

      if (!attempts.length) {
        return `<div class="skill-bar-item" style="opacity:0.4;">
        <div class="skill-bar-meta">
          <span class="skill-bar-label">${meta.icon} ${meta.label}</span>
          <span class="skill-bar-status-tag" style="background:rgba(108,99,255,0.08);color:var(--color-text-muted)">No attempts</span>
        </div>
        <div class="skill-bar-track"><div class="skill-bar-fill" style="width:0%"></div></div>
      </div>`;
      }

      const avg = Math.round(
        attempts.reduce((s, a) => s + a.accuracy, 0) / attempts.length,
      );
      const color =
        avg >= 75
          ? "var(--color-accent)"
          : avg >= 50
            ? "var(--color-warm-light,#f59e0b)"
            : "var(--color-error,#ef4444)";

      return `<div class="skill-bar-item">
      <div class="skill-bar-meta">
        <span class="skill-bar-label">${meta.icon} ${meta.label} (${attempts.length})</span>
        <span class="skill-bar-status-tag" style="background:${color}22;color:${color}">${avg}%</span>
      </div>
      <div class="skill-bar-track"><div class="skill-bar-fill" style="width:${avg}%;background:${color};"></div></div>
    </div>`;
    })
    .join("");
}

function renderModalAccuracyTrend(history) {
  const container = document.getElementById("admin-modal-trend-chart");
  if (!history.length) {
    container.innerHTML = "";
    return;
  }

  const recent = history.slice(-10);
  container.innerHTML = recent
    .map((h, idx) => {
      const isLast = idx === recent.length - 1;
      const meta = ADMIN_SKILL_META[h.type] || { icon: "<i data-lucide=\"book-open\"></i>" };
      return `<div class="bar-col" title="${h.accuracy}%">
      <div class="bar-fill ${isLast ? "active" : ""}" style="height:${Math.max(h.accuracy, 3)}%;"></div>
      <span class="bar-label ${isLast ? "active" : ""}">${meta.icon}</span>
    </div>`;
    })
    .join("");
}

if (document.body.id === "page-admin") {
  document.addEventListener("DOMContentLoaded", setupAdminPage);
}

// ─── Announcements ────────────────────────────────────────────
async function loadAnnouncements() {
  const listEl = document.getElementById("admin-announcements-list");
  if (!listEl) return;
  try {
    const snap = await db
      .collection("announcements")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    if (snap.empty) {
      listEl.innerHTML =
        '<div class="analysis-empty-state" style="text-align: center; padding: 2rem; color: #94a3b8; font-weight: 700;">No announcements posted yet.</div>';
      return;
    }
    listEl.innerHTML = snap.docs
      .map((doc) => {
        const d = doc.data();
        const when =
          d.createdAt && d.createdAt.toDate
            ? d.createdAt.toDate().toLocaleString()
            : "";
        const isActive = d.active;

        return `
          <div style="background: ${isActive ? 'linear-gradient(135deg, #ffffff, #f0fdf4)' : '#ffffff'}; border: 1.5px solid ${isActive ? '#bbf7d0' : '#e2e8f0'}; border-radius: 20px; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; box-shadow: ${isActive ? '0 8px 24px rgba(16,185,129,0.08)' : '0 4px 12px rgba(15,23,42,0.03)'}; transition: all 0.25s ease;">
            <div style="display: flex; align-items: flex-start; gap: 1rem; flex: 1;">
              <div style="width: 38px; height: 38px; border-radius: 12px; background: ${isActive ? '#dcfce7' : '#f1f5f9'}; color: ${isActive ? '#15803d' : '#64748b'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.1rem;">
                <i data-lucide="${isActive ? 'radio' : 'radio-off'}" style="width: 20px; height: 20px;"></i>
              </div>
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                  <span style="background: ${isActive ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : '#f1f5f9'}; color: ${isActive ? '#14532d' : '#475569'}; border: 1px solid ${isActive ? '#86efac' : '#cbd5e1'}; font-weight: 900; font-size: 0.72rem; padding: 0.2rem 0.65rem; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${isActive ? '🟢 Active Broadcast' : '⚪ Inactive'}
                  </span>
                  <span style="font-size: 0.8rem; font-weight: 700; color: #94a3b8;">${when}</span>
                </div>
                <div style="font-weight: 700; font-size: 0.98rem; color: #0f172a; line-height: 1.45;">${d.message}</div>
              </div>
            </div>
            ${isActive ? `
              <button class="btn-secondary" data-deactivate="${doc.id}" style="background: rgba(239, 68, 68, 0.08); border: 1.5px solid rgba(239, 68, 68, 0.25); color: #ef4444; border-radius: 12px; padding: 0.45rem 1rem; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;">
                Deactivate
              </button>
            ` : `
              <span style="font-size: 0.82rem; font-weight: 800; color: #94a3b8; background: #f8fafc; padding: 0.35rem 0.75rem; border-radius: 9999px; border: 1px solid #e2e8f0;">Archived</span>
            `}
          </div>
        `;
      })
      .join("");

    listEl.querySelectorAll("[data-deactivate]").forEach((btn) => {
      btn.addEventListener("click", () =>
        deactivateAnnouncement(btn.dataset.deactivate),
      );
    });
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("Failed to load announcements:", err);
    listEl.innerHTML =
      '<div class="analysis-empty-state" style="text-align: center; padding: 2rem; color: #ef4444;">Could not load announcements.</div>';
  }
}

async function deactivateAnnouncement(id) {
  try {
    await db.collection("announcements").doc(id).update({ active: false });
    loadAnnouncements();
  } catch (err) {
    console.error("Failed to deactivate announcement:", err);
    alert("Could not deactivate — check console.");
  }
}

function setupAnnouncementPosting() {
  const btn = document.getElementById("admin-post-announcement-btn");
  const input = document.getElementById("admin-announcement-input");
  if (!btn || !input) return;

  btn.addEventListener("click", async () => {
    const message = input.value.trim();
    if (!message) return;
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = "Posting…";
    try {
      const activeSnap = await db
        .collection("announcements")
        .where("active", "==", true)
        .get();
      const batch = db.batch();
      activeSnap.docs.forEach((doc) =>
        batch.update(doc.ref, { active: false }),
      );
      await batch.commit();

      await db.collection("announcements").add({
        message,
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        postedBy: currentAdminUid || null,
      });
      input.value = "";
      loadAnnouncements();
    } catch (err) {
      console.error("Failed to post announcement:", err);
      alert("Could not post announcement — check console.");
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

// ─── Feedback ─────────────────────────────────────────────────
async function loadFeedback() {
  const listEl = document.getElementById("admin-feedback-list");
  if (!listEl) return;
  try {
    const snap = await db
      .collection("feedback")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    if (snap.empty) {
      listEl.innerHTML =
        '<div class="analysis-empty-state" style="text-align: center; padding: 2rem; color: #94a3b8; font-weight: 700;">No feedback submitted yet.</div>';
      return;
    }
    listEl.innerHTML = snap.docs
      .map((doc) => {
        const d = doc.data();
        const when =
          d.createdAt && d.createdAt.toDate
            ? timeAgo(d.createdAt.toDate())
            : "";
        const isReviewed = d.status === "reviewed";
        const email = d.email || "Anonymous Learner";
        const initial = email.charAt(0).toUpperCase();

        return `
          <div style="background: ${isReviewed ? '#ffffff' : 'linear-gradient(135deg, #ffffff, #faf5ff)'}; border: 1.5px solid ${isReviewed ? '#e2e8f0' : '#e9d5ff'}; border-radius: 24px; padding: 1.5rem; box-shadow: ${isReviewed ? '0 4px 14px rgba(15,23,42,0.03)' : '0 10px 28px rgba(168,85,247,0.1)'}; transition: all 0.25s ease; position: relative;">
            <!-- Header Row: User Avatar, Email, Status Tag, Timestamp, Action Button -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #7c3aed); color: #ffffff; font-weight: 900; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(168,85,247,0.3);">
                  ${initial}
                </div>
                <div>
                  <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1.05rem; color: #0f172a;">${email}</div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.2rem;">
                    <span style="background: ${isReviewed ? '#f1f5f9' : 'rgba(168,85,247,0.1)'}; color: ${isReviewed ? '#475569' : '#a855f7'}; border: 1px solid ${isReviewed ? '#cbd5e1' : 'rgba(168,85,247,0.3)'}; font-weight: 900; font-size: 0.72rem; padding: 0.18rem 0.65rem; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${isReviewed ? '🟢 Reviewed' : '✨ New Feedback'}
                    </span>
                    <span style="font-size: 0.82rem; font-weight: 700; color: #94a3b8;">${when}</span>
                  </div>
                </div>
              </div>

              ${!isReviewed ? `
                <button data-review="${doc.id}" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; border: none; border-radius: 14px; padding: 0.55rem 1.25rem; font-weight: 800; font-size: 0.88rem; cursor: pointer; box-shadow: 0 4px 14px rgba(99,102,241,0.35); width: max-content !important; min-width: auto !important; max-width: max-content !important; display: inline-flex !important; align-items: center !important; gap: 0.4rem !important; transition: transform 0.2s ease;">
                  <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                  <span>Mark Reviewed</span>
                </button>
              ` : `
                <span style="font-size: 0.85rem; font-weight: 800; color: #64748b; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.35rem 0.85rem; border-radius: 9999px;">
                  Archived
                </span>
              `}
            </div>

            <!-- Message Quote Body -->
            <div style="font-weight: 600; font-size: 0.98rem; color: #334155; line-height: 1.5; background: rgba(248,250,252,0.9); border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 1rem 1.25rem;">
              "${d.message}"
            </div>
          </div>
        `;
      })
      .join("");

    listEl.querySelectorAll("[data-review]").forEach((btn) => {
      btn.addEventListener("click", () =>
        markFeedbackReviewed(btn.dataset.review),
      );
    });
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("Failed to load feedback:", err);
    listEl.innerHTML =
      '<div class="analysis-empty-state" style="text-align: center; padding: 2rem; color: #ef4444;">Could not load feedback.</div>';
  }
}

async function markFeedbackReviewed(id) {
  try {
    await db.collection("feedback").doc(id).update({ status: "reviewed" });
    loadFeedback();
  } catch (err) {
    console.error("Failed to mark feedback reviewed:", err);
    alert("Could not update feedback — check console.");
  }
}

// ─── Error Logs ─────────────────────────────────────────────────
async function loadErrorLogs() {
  const listEl = document.getElementById("admin-errors-list");
  if (!listEl) return;
  try {
    const snap = await db
      .collection("errorLogs")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    if (snap.empty) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 3rem 2rem; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border: 2px dashed #a7f3d0; border-radius: 24px;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #dcfce7; color: #16a34a; font-size: 1.75rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.85rem; box-shadow: 0 6px 18px rgba(22,163,74,0.25);">🎉</div>
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 1.25rem; color: #14532d; margin: 0 0 0.35rem;">Zero Runtime Errors Logged!</h3>
          <p style="font-size: 0.92rem; color: #166534; font-weight: 600; margin: 0;">All client applications are running smoothly without any exceptions.</p>
        </div>
      `;
      return;
    }
    listEl.innerHTML = snap.docs
      .map((doc) => {
        const d = doc.data();
        const when =
          d.createdAt && d.createdAt.toDate
            ? timeAgo(d.createdAt.toDate())
            : "";
        const email = d.email || "Anonymous Session";
        const url = d.url || d.page || "";

        return `
          <div style="background: linear-gradient(135deg, #ffffff, #fff5f5); border: 1.5px solid #fecaca; border-radius: 20px; padding: 1.25rem 1.5rem; box-shadow: 0 8px 24px rgba(239, 68, 68, 0.06); transition: all 0.25s ease;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; font-weight: 900; font-size: 0.72rem; padding: 0.2rem 0.65rem; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 0.3rem;">
                  <i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i>
                  <span>Runtime Error</span>
                </span>
                <span style="font-size: 0.85rem; font-weight: 800; color: #0f172a;">${email}</span>
                ${url ? `<span style="font-size: 0.78rem; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 0.15rem 0.5rem; border-radius: 6px;">${url}</span>` : ""}
              </div>
              <span style="font-size: 0.8rem; font-weight: 700; color: #94a3b8;">${when}</span>
            </div>

            <!-- Error Code Block -->
            <div style="font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace; font-size: 0.88rem; background: #0f172a; color: #f87171; border-radius: 14px; padding: 0.85rem 1.1rem; line-height: 1.5; overflow-x: auto; box-shadow: inset 0 2px 8px rgba(0,0,0,0.4);">
              <span style="color: #94a3b8; user-select: none;">$ </span>${d.message || "Unknown error occurred"}
            </div>
          </div>
        `;
      })
      .join("");

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("Failed to load error logs:", err);
    listEl.innerHTML =
      '<div class="analysis-empty-state" style="text-align: center; padding: 2rem; color: #ef4444;">Could not load error logs.</div>';
  }
}

function renderAdminLeaderboard() {
  const tbody = document.getElementById("admin-leaderboard-tbody");
  const podium = document.getElementById("admin-leaderboard-podium");
  const loading = document.getElementById("admin-leaderboard-loading");
  const empty = document.getElementById("admin-leaderboard-empty");
  
  if (!tbody) return;
  
  tbody.innerHTML = "";
  if (loading) loading.classList.remove("hidden");
  if (empty) empty.classList.add("hidden");
  
  db.collection("users")
    .orderBy("xp", "desc")
    .limit(50)
    .get()
    .then(snap => {
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

      // 1. Render Top 3 Champions Podium
      if (podium && userList.length >= 1) {
        const first = userList[0];
        const second = userList[1] || null;
        const third = userList[2] || null;

        let podiumHtml = "";

        // 2nd Place (Silver)
        if (second) {
          podiumHtml += `
            <div style="flex: 1; min-width: 170px; max-width: 210px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 2px solid #cbd5e1; border-radius: 24px; padding: 1.5rem 1rem 1.25rem; text-align: center; box-shadow: 0 10px 25px -5px rgba(15,23,42,0.06); transform: translateY(0); order: 1;">
              <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">🥈</div>
              <div style="width: 52px; height: 52px; border-radius: 50%; background: #94a3b8; color: white; font-weight: 900; font-size: 1.3rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.6rem; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(148,163,184,0.3);">
                ${second.initial}
              </div>
              <div style="font-weight: 800; font-size: 0.95rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${second.name}</div>
              <div style="margin-top: 0.4rem; background: #ffffff; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 900; font-size: 0.85rem; color: #475569; display: inline-flex; align-items: center; gap: 0.25rem; border: 1px solid #e2e8f0;">
                ⚡ ${second.xp} XP
              </div>
            </div>
          `;
        }

        // 1st Place (Gold Crown)
        podiumHtml += `
          <div style="flex: 1; min-width: 190px; max-width: 230px; background: linear-gradient(135deg, #fffbeb, #fef08a); border: 2px solid #eab308; border-radius: 26px; padding: 1.75rem 1rem 1.5rem; text-align: center; box-shadow: 0 16px 36px -8px rgba(234,179,8,0.3); order: 2; z-index: 2;">
            <div style="font-size: 2rem; margin-bottom: 0.2rem; filter: drop-shadow(0 4px 8px rgba(234,179,8,0.4));">👑</div>
            <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #eab308, #ca8a04); color: white; font-weight: 900; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.6rem; border: 4px solid #ffffff; box-shadow: 0 6px 16px rgba(234,179,8,0.4);">
              ${first.initial}
            </div>
            <div style="font-weight: 900; font-size: 1.05rem; color: #854d0e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Plus Jakarta Sans', sans-serif;">${first.name}</div>
            <div style="margin-top: 0.4rem; background: #ffffff; padding: 0.35rem 0.9rem; border-radius: 9999px; font-weight: 900; font-size: 0.92rem; color: #854d0e; display: inline-flex; align-items: center; gap: 0.3rem; border: 1.5px solid #fef08a; box-shadow: 0 4px 12px rgba(234,179,8,0.2);">
              ⚡ ${first.xp} XP
            </div>
          </div>
        `;

        // 3rd Place (Bronze)
        if (third) {
          podiumHtml += `
            <div style="flex: 1; min-width: 170px; max-width: 210px; background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 2px solid #fdba74; border-radius: 24px; padding: 1.5rem 1rem 1.25rem; text-align: center; box-shadow: 0 10px 25px -5px rgba(249,115,22,0.1); transform: translateY(0); order: 3;">
              <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">🥉</div>
              <div style="width: 52px; height: 52px; border-radius: 50%; background: #ea580c; color: white; font-weight: 900; font-size: 1.3rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.6rem; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(234,88,12,0.3);">
                ${third.initial}
              </div>
              <div style="font-weight: 800; font-size: 0.95rem; color: #9a3412; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${third.name}</div>
              <div style="margin-top: 0.4rem; background: #ffffff; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 900; font-size: 0.85rem; color: #9a3412; display: inline-flex; align-items: center; gap: 0.25rem; border: 1px solid #fed7aa;">
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

        let rankBadge = `#${rank}`;
        let rankStyle = "background: #f1f5f9; color: #64748b;";

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

        html += `
          <tr style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; transition: transform 0.2s ease;">
            <td style="padding: 0.9rem 1rem; border-top-left-radius: 16px; border-bottom-left-radius: 16px;">
              <span style="${rankStyle} font-size: 0.9rem; font-weight: 900; padding: 0.35rem 0.75rem; border-radius: 9999px; display: inline-block; min-width: 42px; text-align: center;">${rankBadge}</span>
            </td>
            <td style="padding: 0.9rem 1rem;">
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem; flex-shrink: 0; box-shadow: 0 4px 12px rgba(99,102,241,0.3);">
                  ${u.initial}
                </div>
                <div style="font-weight: 800; font-size: 1rem; color: #0f172a;">${u.name}</div>
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
      tbody.innerHTML = html;
      if (window.lucide) lucide.createIcons();
    })
    .catch(err => {
      if (loading) loading.classList.add("hidden");
      console.error("Error loading leaderboard:", err);
      if (empty) {
        empty.textContent = "Error loading leaderboard.";
        empty.classList.remove("hidden");
      }
    });
}

function awardTopThree() {
  const adminBtn = document.getElementById("admin-award-top3-btn");
  if (adminBtn) {
    adminBtn.disabled = true;
    adminBtn.innerHTML = "Awarding...";
  }
  
  db.collection("users")
    .orderBy("xp", "desc")
    .limit(3)
    .get()
    .then(snap => {
      if (snap.empty) return;
      
      const batch = db.batch();
      const rewards = [
        { coins: 500, xp: 500 }, // 1st
        { coins: 300, xp: 300 }, // 2nd
        { coins: 100, xp: 100 }  // 3rd
      ];
      
      let i = 0;
      snap.forEach(doc => {
        if (i < 3) {
          const reward = rewards[i];
          batch.update(doc.ref, {
            coins: firebase.firestore.FieldValue.increment(reward.coins),
            xp: firebase.firestore.FieldValue.increment(reward.xp)
          });
          i++;
        }
      });
      
      return batch.commit();
    })
    .then(() => {
      alert("Top 3 learners have been awarded their Coins and XP!");
      if (adminBtn) {
        adminBtn.innerHTML = "Awarded!";
        setTimeout(() => {
          adminBtn.disabled = false;
          adminBtn.innerHTML = "<i data-lucide='gift' style='margin-right: 6px;'></i> <span>Award Top 3 Users</span>";
          if (window.lucide) lucide.createIcons();
        }, 3000);
      }
    })
    .catch(err => {
      console.error("Error awarding top 3:", err);
      alert("Failed to award users.");
      if (adminBtn) {
        adminBtn.disabled = false;
        adminBtn.innerHTML = "<i data-lucide='gift' style='margin-right: 6px;'></i> <span>Award Top 3 Users</span>";
        if (window.lucide) lucide.createIcons();
      }
    });
}
