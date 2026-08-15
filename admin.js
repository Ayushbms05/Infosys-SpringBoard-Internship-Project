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
  reading: {
    icon: '<i data-lucide="book-open"></i>',
    iconName: "book-open",
    label: "Reading",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
    bg: "rgba(99, 102, 241, 0.12)",
  },
  writing: {
    icon: '<i data-lucide="pen-tool"></i>',
    iconName: "pen-tool",
    label: "Writing",
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    bg: "rgba(16, 185, 129, 0.12)",
  },
  listening: {
    icon: '<i data-lucide="headphones"></i>',
    iconName: "headphones",
    label: "Listening",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    bg: "rgba(245, 158, 11, 0.12)",
  },
  speaking: {
    icon: '<i data-lucide="mic"></i>',
    iconName: "mic",
    label: "Speaking",
    color: "#ec4899",
    gradient: "linear-gradient(135deg, #ec4899, #e11d48)",
    bg: "rgba(236, 72, 153, 0.12)",
  },
  pronunciation: {
    icon: '<i data-lucide="type"></i>',
    iconName: "type",
    label: "Pronunciation",
    color: "#06b6d4",
    gradient: "linear-gradient(135deg, #06b6d4, #0284c7)",
    bg: "rgba(6, 182, 212, 0.12)",
  },
};

function showAdminToast(message, type = "success", title = "") {
  let container = document.getElementById("admin-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "admin-toast-container";
    container.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 100000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 420px;
      width: calc(100vw - 48px);
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `admin-toast-card ${type}`;
  toast.style.cssText = `
    pointer-events: auto;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid ${
      type === "success"
        ? "rgba(16, 185, 129, 0.35)"
        : type === "error"
          ? "rgba(239, 68, 68, 0.35)"
          : type === "warning"
            ? "rgba(245, 158, 11, 0.35)"
            : "rgba(99, 102, 241, 0.35)"
    };
    border-radius: 20px;
    padding: 1rem 1.25rem;
    box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(0,0,0,0.02);
    display: flex;
    align-items: flex-start;
    gap: 0.9rem;
    transform: translateY(-20px) scale(0.95);
    opacity: 0;
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
  `;

  const iconBg =
    type === "success"
      ? "linear-gradient(135deg, #10b981, #059669)"
      : type === "error"
        ? "linear-gradient(135deg, #ef4444, #dc2626)"
        : type === "warning"
          ? "linear-gradient(135deg, #f59e0b, #d97706)"
          : "linear-gradient(135deg, #6366f1, #4f46e5)";

  const iconName =
    type === "success"
      ? "check-circle-2"
      : type === "error"
        ? "alert-triangle"
        : type === "warning"
          ? "alert-circle"
          : "info";

  const defaultTitle =
    type === "success"
      ? "Success"
      : type === "error"
        ? "Action Failed"
        : type === "warning"
          ? "Notice"
          : "Information";

  toast.innerHTML = `
    <div style="width: 38px; height: 38px; border-radius: 12px; background: ${iconBg}; color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.12);">
      <i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i>
    </div>
    <div style="flex: 1; min-width: 0; padding-top: 2px;">
      <h6 style="margin: 0 0 0.2rem 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.95rem; font-weight: 800; color: #0f172a;">
        ${title || defaultTitle}
      </h6>
      <p style="margin: 0; font-size: 0.84rem; font-weight: 600; color: #475569; line-height: 1.4;">
        ${message}
      </p>
    </div>
    <button style="background: none; border: none; padding: 4px; color: #94a3b8; cursor: pointer; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-top: -2px; margin-right: -4px;">
      <i data-lucide="x" style="width: 16px; height: 16px;"></i>
    </button>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  requestAnimationFrame(() => {
    toast.style.transform = "translateY(0) scale(1)";
    toast.style.opacity = "1";
  });

  const closeBtn = toast.querySelector("button");
  const dismiss = () => {
    toast.style.transform = "translateY(-15px) scale(0.95)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 350);
  };

  closeBtn.onclick = dismiss;
  setTimeout(dismiss, 4500);
}

function showAdminConfirm({
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmType = "primary", // "danger" | "warning" | "primary"
  icon = "help-circle",
}) {
  return new Promise((resolve) => {
    const existing = document.getElementById("admin-confirm-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "admin-confirm-overlay";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 100001;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      box-sizing: border-box;
      opacity: 0;
      transition: opacity 0.25s ease;
    `;

    const iconBg =
      confirmType === "danger"
        ? "linear-gradient(135deg, #ef4444, #dc2626)"
        : confirmType === "warning"
          ? "linear-gradient(135deg, #f59e0b, #d97706)"
          : "linear-gradient(135deg, #6366f1, #4f46e5)";

    const confirmBtnBg =
      confirmType === "danger"
        ? "linear-gradient(135deg, #ef4444, #dc2626)"
        : confirmType === "warning"
          ? "linear-gradient(135deg, #f59e0b, #d97706)"
          : "linear-gradient(135deg, #6366f1, #4f46e5)";

    const confirmBtnShadow =
      confirmType === "danger"
        ? "0 6px 18px rgba(220, 38, 38, 0.35)"
        : confirmType === "warning"
          ? "0 6px 18px rgba(217, 119, 6, 0.35)"
          : "0 6px 18px rgba(99, 102, 241, 0.35)";

    overlay.innerHTML = `
      <div class="admin-confirm-box" style="
        background: rgba(255, 255, 255, 0.98);
        border: 2px solid rgba(226, 232, 240, 0.9);
        border-radius: 28px;
        padding: 2rem 2.25rem;
        max-width: 480px;
        width: 100%;
        box-shadow: 0 30px 70px -15px rgba(15, 23, 42, 0.3);
        transform: scale(0.92);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        text-align: center;
      ">
        <div style="width: 56px; height: 56px; border-radius: 18px; background: ${iconBg}; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; box-shadow: 0 8px 20px rgba(0,0,0,0.12);">
          <i data-lucide="${icon}" style="width: 28px; height: 28px;"></i>
        </div>
        <h4 style="margin: 0 0 0.5rem 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.35rem; font-weight: 900; color: #0f172a;">
          ${title}
        </h4>
        <p style="margin: 0 0 1.75rem 0; font-size: 0.95rem; font-weight: 600; color: #64748b; line-height: 1.5;">
          ${message}
        </p>
        <div style="display: flex; gap: 0.85rem; justify-content: center;">
          <button id="admin-confirm-cancel" style="
            flex: 1;
            background: #ffffff;
            border: 1.5px solid #cbd5e1;
            color: #334155;
            font-weight: 800;
            font-size: 0.92rem;
            border-radius: 14px;
            padding: 0.75rem 1.25rem;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            ${cancelText}
          </button>
          <button id="admin-confirm-ok" style="
            flex: 1;
            background: ${confirmBtnBg};
            border: none;
            color: #ffffff;
            font-weight: 800;
            font-size: 0.92rem;
            border-radius: 14px;
            padding: 0.75rem 1.25rem;
            cursor: pointer;
            box-shadow: ${confirmBtnShadow};
            transition: all 0.2s ease;
          ">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    if (window.lucide) lucide.createIcons();

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      const box = overlay.querySelector(".admin-confirm-box");
      if (box) box.style.transform = "scale(1)";
    });

    const cleanup = (result) => {
      overlay.style.opacity = "0";
      const box = overlay.querySelector(".admin-confirm-box");
      if (box) box.style.transform = "scale(0.92)";
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 250);
    };

    overlay.querySelector("#admin-confirm-cancel").onclick = () => cleanup(false);
    overlay.querySelector("#admin-confirm-ok").onclick = () => cleanup(true);

    overlay.onclick = (e) => {
      if (e.target === overlay) cleanup(false);
    };
  });
}

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

function renderActivityItemHtml({ d, name, initial }) {
  const meta = ADMIN_SKILL_META[(d.type || "reading").toLowerCase()] || {
    icon: '<i data-lucide="book-open"></i>',
    label: d.type || "Practice",
  };
  const when =
    d.completedAt && d.completedAt.toDate
      ? timeAgo(d.completedAt.toDate())
      : d.completedAt instanceof Date
        ? timeAgo(d.completedAt)
        : "Recently";

  const accuracy = typeof d.accuracy === "number" ? d.accuracy : (d.score || 0);
  const isGood = accuracy >= 70;
  const isMed = accuracy >= 40;
  const badgeBg = isGood ? "#dcfce7" : isMed ? "#fef3c7" : "#fef2f2";
  const badgeColor = isGood ? "#15803d" : isMed ? "#b45309" : "#dc2626";
  const badgeBorder = isGood ? "#86efac" : isMed ? "#fde68a" : "#fca5a5";

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
          <span>completed drill</span>
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
}

async function renderRecentActivity() {
  const container = document.getElementById("admin-activity-feed");
  const emptyState = document.getElementById("admin-activity-empty");
  if (!container) return;

  container.innerHTML =
    '<div class="analysis-empty-state">Loading recent activity…</div>';

  const userMap = {};
  allUsersCache.forEach((u) => {
    userMap[u.uid] = u;
  });

  try {
    const snap = await db
      .collectionGroup("lessonHistory")
      .orderBy("completedAt", "desc")
      .limit(20)
      .get();

    if (!snap.empty) {
      if (emptyState) emptyState.classList.add("hidden");
      container.innerHTML = snap.docs
        .map((doc) => {
          const d = doc.data();
          const uid = doc.ref && doc.ref.parent && doc.ref.parent.parent ? doc.ref.parent.parent.id : "";
          const user = userMap[uid];
          const name = user ? user.fullName : "Learner";
          const initial = (name || "U").charAt(0).toUpperCase();
          return renderActivityItemHtml({ d, name, initial });
        })
        .join("");
      if (window.lucide) lucide.createIcons();
      return;
    }
  } catch (err) {
    console.warn("CollectionGroup query requires index or failed, attempting user subcollection fallback:", err);
  }

  // Seamless fallback: fetch lesson history directly across users without index
  try {
    const activeUsers = allUsersCache.slice(0, 15);
    const fetchPromises = activeUsers.map(async (user) => {
      try {
        const hSnap = await db
          .collection("users")
          .doc(user.uid)
          .collection("lessonHistory")
          .orderBy("completedAt", "desc")
          .limit(5)
          .get();
        return hSnap.docs.map((d) => ({ d: d.data(), user }));
      } catch (e) {
        return [];
      }
    });

    const results = (await Promise.all(fetchPromises)).flat();
    results.sort((a, b) => {
      const tA = a.d.completedAt && a.d.completedAt.toDate ? a.d.completedAt.toDate().getTime() : 0;
      const tB = b.d.completedAt && b.d.completedAt.toDate ? b.d.completedAt.toDate().getTime() : 0;
      return tB - tA;
    });

    const top20 = results.slice(0, 20);
    if (top20.length > 0) {
      if (emptyState) emptyState.classList.add("hidden");
      container.innerHTML = top20
        .map(({ d, user }) => {
          const name = user ? user.fullName : "Learner";
          const initial = (name || "U").charAt(0).toUpperCase();
          return renderActivityItemHtml({ d, name, initial });
        })
        .join("");
      if (window.lucide) lucide.createIcons();
      return;
    }
  } catch (fallbackErr) {
    console.error("Activity fallback error:", fallbackErr);
  }

  // If no activity records found
  container.innerHTML = "";
  if (emptyState) {
    emptyState.textContent = "No recent lesson activity recorded yet.";
    emptyState.classList.remove("hidden");
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
      const targetSec = item.dataset.section;
      document
        .querySelectorAll(".dash-nav-item[data-section]")
        .forEach((n) => n.classList.remove("active"));
      document
        .querySelectorAll(`.dash-nav-item[data-section="${targetSec}"]`)
        .forEach((n) => n.classList.add("active"));
      document
        .querySelectorAll(".admin-section")
        .forEach((s) => s.classList.add("hidden"));
      const target = document.getElementById(
        "admin-section-" + targetSec,
      );
      if (target) {
        target.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (targetSec === "errors") loadErrorLogs();
      if (targetSec === "announcements") loadAnnouncements();
      if (targetSec === "feedback") loadFeedback();
      if (targetSec === "leaderboard") renderAdminLeaderboard();

      if (window.lucide) lucide.createIcons();
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
    modalCloseBtn.addEventListener("click", closeUserDetailModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeUserDetailModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        closeUserDetailModal();
      }
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

function closeUserDetailModal() {
  const modal = document.getElementById("admin-user-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
  document.body.style.overflow = "";
}

async function openUserDetailModal(uid) {
  const user = allUsersCache.find((u) => u.uid === uid);
  if (!user) return;

  document.body.style.overflow = "hidden";

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
        accuracy:
          typeof r.accuracy === "number"
            ? r.accuracy
            : typeof r.score === "number"
              ? r.score
              : 0,
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

  const confirmed = await showAdminConfirm({
    title: newState ? "Suspend Learner Account" : "Reinstate Learner Account",
    message: newState
      ? `Are you sure you want to suspend ${cached.fullName}? They will be blocked from logging into the platform until reinstated.`
      : `Reinstate ${cached.fullName}? They will regain full access to their learning account and lessons.`,
    confirmText: newState ? "Yes, Suspend Account" : "Yes, Reinstate Account",
    confirmType: newState ? "warning" : "primary",
    icon: newState ? "user-x" : "user-check",
  });
  if (!confirmed) return;

  try {
    await db.collection("users").doc(uid).update({ isBanned: newState });
    cached.isBanned = newState;
    renderUsersTable();
    updateModalDangerButtons(cached);
    showAdminToast(
      `${cached.fullName} has been ${newState ? "suspended" : "reinstated"}.`,
      newState ? "warning" : "success",
      newState ? "User Suspended" : "User Reinstated"
    );
  } catch (err) {
    console.error("Failed to update ban status:", err);
    showAdminToast("Could not update ban status — check console.", "error");
  }
}

async function resetUserProgress(uid) {
  const cached = allUsersCache.find((u) => u.uid === uid);
  if (!cached) return;

  const confirmed = await showAdminConfirm({
    title: "Reset Learner Progress",
    message: `Are you sure you want to reset ALL progress for ${cached.fullName}? This clears XP, streak, completed lessons, and earned badges. This action cannot be undone.`,
    confirmText: "Yes, Reset All Progress",
    confirmType: "danger",
    icon: "rotate-ccw",
  });
  if (!confirmed) return;

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
    showAdminToast(`Progress reset for ${cached.fullName}.`, "success", "Progress Cleared");
  } catch (err) {
    console.error("Failed to reset progress:", err);
    showAdminToast("Could not reset progress — check console.", "error");
  }
}

async function toggleAdminStatus(uid) {
  if (uid === currentAdminUid) {
    showAdminToast("You can't change your own admin status from here.", "warning", "Action Restricted");
    return;
  }
  const cached = allUsersCache.find((u) => u.uid === uid);
  if (!cached) return;
  const newState = !cached.isAdmin;

  const confirmed = await showAdminConfirm({
    title: newState ? "Grant Administrator Access" : "Revoke Administrator Access",
    message: newState
      ? `Grant full administrator privileges to ${cached.fullName}? They will be able to access the admin portal, moderate learners, and manage curriculum.`
      : `Revoke administrator privileges from ${cached.fullName}? They will return to standard learner status.`,
    confirmText: newState ? "Yes, Grant Admin" : "Yes, Revoke Admin",
    confirmType: newState ? "primary" : "warning",
    icon: "shield-alert",
  });
  if (!confirmed) return;

  try {
    await db.collection("users").doc(uid).update({ isAdmin: newState });
    cached.isAdmin = newState;
    updateModalDangerButtons(cached);
    showAdminToast(
      `Admin privileges ${newState ? "granted to" : "revoked from"} ${cached.fullName}.`,
      "success",
      "Permissions Updated"
    );
  } catch (err) {
    console.error("Failed to update admin status:", err);
    showAdminToast("Could not update admin status — check console.", "error");
  }
}

async function deleteUserAccount(uid) {
  const cached = allUsersCache.find((u) => u.uid === uid);
  if (!cached) return;
  if (uid === currentAdminUid) {
    showAdminToast("You can't delete your own account from here.", "warning", "Action Restricted");
    return;
  }

  const confirmed = await showAdminConfirm({
    title: "Delete Learner Account",
    message: `Are you sure you want to delete ${cached.fullName}'s account permanently? All learner profile data, XP, history, and test logs will be permanently erased.`,
    confirmText: "Permanently Delete User",
    confirmType: "danger",
    icon: "trash-2",
  });
  if (!confirmed) return;

  try {
    await db.collection("users").doc(uid).delete();
    allUsersCache = allUsersCache.filter((u) => u.uid !== uid);
    renderUsersTable();
    renderOverview();
    closeUserDetailModal();
    showAdminToast(`${cached.fullName}'s account has been permanently deleted.`, "success", "Account Deleted");
  } catch (err) {
    console.error("Failed to delete user:", err);
    showAdminToast("Could not delete user — check console.", "error");
  }
}

function renderModalSkillBreakdown(history) {
  const container = document.getElementById("admin-modal-skill-bars");
  if (!container) return;

  const bySkill = {};
  history.forEach((h) => {
    const key = (h.type || "reading").toLowerCase();
    (bySkill[key] = bySkill[key] || []).push(h);
  });

  const skillCardsHtml = Object.keys(ADMIN_SKILL_META)
    .map((type) => {
      const attempts = bySkill[type] || [];
      const meta = ADMIN_SKILL_META[type];
      const hasAttempts = attempts.length > 0;

      const avg = hasAttempts
        ? Math.round(
            attempts.reduce((s, a) => s + (typeof a.accuracy === "number" ? a.accuracy : (a.score || 0)), 0) / attempts.length
          )
        : 0;

      let scoreBadgeHtml = "";
      let trackFillColor = meta.gradient;
      let statusCaption = "";

      if (!hasAttempts) {
        scoreBadgeHtml = `<span class="skill-pct-badge" style="background:#f1f5f9;color:#94a3b8;border:1px solid #e2e8f0;">Not Attempted</span>`;
        statusCaption = `<span style="color:#94a3b8;"><i data-lucide="circle-dashed" style="width:13px;height:13px;display:inline-block;vertical-align:middle;"></i> No practice sessions recorded yet</span>`;
      } else if (avg >= 85) {
        scoreBadgeHtml = `<span class="skill-pct-badge" style="background:rgba(16,185,129,0.12);color:#047857;border:1px solid rgba(16,185,129,0.3);"><i data-lucide="sparkles" style="width:13px;height:13px;"></i> ${avg}%</span>`;
        trackFillColor = "linear-gradient(90deg, #10b981, #34d399)";
        statusCaption = `<span style="color:#047857;"><i data-lucide="check-circle-2" style="width:13px;height:13px;display:inline-block;vertical-align:middle;"></i> Mastered • High Retention</span>`;
      } else if (avg >= 65) {
        scoreBadgeHtml = `<span class="skill-pct-badge" style="background:rgba(99,102,241,0.12);color:#4338ca;border:1px solid rgba(99,102,241,0.3);"><i data-lucide="zap" style="width:13px;height:13px;"></i> ${avg}%</span>`;
        trackFillColor = "linear-gradient(90deg, #6366f1, #818cf8)";
        statusCaption = `<span style="color:#4338ca;"><i data-lucide="trending-up" style="width:13px;height:13px;display:inline-block;vertical-align:middle;"></i> Proficient • Good Progress</span>`;
      } else {
        scoreBadgeHtml = `<span class="skill-pct-badge" style="background:rgba(245,158,11,0.12);color:#b45309;border:1px solid rgba(245,158,11,0.3);"><i data-lucide="alert-circle" style="width:13px;height:13px;"></i> ${avg}%</span>`;
        trackFillColor = "linear-gradient(90deg, #f59e0b, #fbbf24)";
        statusCaption = `<span style="color:#b45309;"><i data-lucide="help-circle" style="width:13px;height:13px;display:inline-block;vertical-align:middle;"></i> Developing • Recommended Practice</span>`;
      }

      return `
        <div class="skill-card-enhanced" style="${!hasAttempts ? "opacity: 0.65;" : ""}">
          <div class="skill-header-row">
            <div class="skill-info-left">
              <div class="skill-icon-squircle" style="background: ${meta.gradient};">
                <i data-lucide="${meta.iconName}" style="width:18px;height:18px;"></i>
              </div>
              <div>
                <h5 class="skill-name-title">
                  <span>${meta.label}</span>
                  <span class="skill-attempts-chip">${attempts.length} ${attempts.length === 1 ? "attempt" : "attempts"}</span>
                </h5>
              </div>
            </div>
            <div>
              ${scoreBadgeHtml}
            </div>
          </div>
          <div class="skill-track-wrap">
            <div class="skill-track-fill" style="width: ${avg}%; background: ${trackFillColor}; box-shadow: ${hasAttempts ? `0 2px 8px ${meta.color}55` : "none"};"></div>
          </div>
          <div class="skill-status-footnote">
            ${statusCaption}
          </div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `<div class="skill-bd-grid">${skillCardsHtml}</div>`;
  if (window.lucide) lucide.createIcons();
}

function renderModalAccuracyTrend(history) {
  const container = document.getElementById("admin-modal-trend-chart");
  if (!container) return;

  if (!history || !history.length) {
    container.innerHTML = `
      <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 2.5rem 1.5rem; text-align: center;">
        <div style="width: 52px; height: 52px; border-radius: 16px; background: rgba(99,102,241,0.1); color: #6366f1; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.4rem;">
          <i data-lucide="bar-chart-2" style="width: 26px; height: 26px;"></i>
        </div>
        <h5 style="font-size: 1.05rem; font-weight: 900; color: #0f172a; margin: 0 0 0.4rem;">No Accuracy Data Yet</h5>
        <p style="font-size: 0.85rem; color: #64748b; font-weight: 600; max-width: 420px; margin: 0 auto;">
          This learner has not taken any quizzes or diagnostic exercises yet. Once they begin practicing, score trends across reading, writing, and speech will appear here.
        </p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const recent = history.slice(-10);
  const totalAcc = recent.reduce((sum, h) => sum + (typeof h.accuracy === "number" ? h.accuracy : (h.score || 0)), 0);
  const avgAcc = Math.round(totalAcc / recent.length);
  const maxAcc = Math.max(...recent.map((h) => typeof h.accuracy === "number" ? h.accuracy : (h.score || 0)));

  let trajectoryText = "Consistent";
  let trajectoryColor = "#10b981";
  if (recent.length >= 2) {
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    const avg1 = firstHalf.reduce((s, a) => s + (typeof a.accuracy === "number" ? a.accuracy : (a.score || 0)), 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((s, a) => s + (typeof a.accuracy === "number" ? a.accuracy : (a.score || 0)), 0) / secondHalf.length;
    if (avg2 - avg1 >= 4) {
      trajectoryText = `+${Math.round(avg2 - avg1)}% Improving`;
      trajectoryColor = "#10b981";
    } else if (avg1 - avg2 >= 4) {
      trajectoryText = `-${Math.round(avg1 - avg2)}% Needs Focus`;
      trajectoryColor = "#f59e0b";
    } else {
      trajectoryText = "Stable & Strong";
      trajectoryColor = "#6366f1";
    }
  }

  const barsHtml = recent
    .map((h, idx) => {
      const isLatest = idx === recent.length - 1;
      const typeKey = (h.type || "reading").toLowerCase();
      const meta = ADMIN_SKILL_META[typeKey] || {
        iconName: "book-open",
        label: "Lesson",
        color: "#6366f1",
        gradient: "linear-gradient(180deg, #6366f1, #818cf8)",
      };

      const rawScore = typeof h.accuracy === "number" ? h.accuracy : (h.score || 0);
      const acc = Math.max(0, Math.min(100, rawScore));

      let badgeBg = "rgba(99,102,241,0.12)";
      let badgeColor = "#4338ca";
      let pillarGrad = meta.gradient;
      let pillarShadow = `0 4px 14px ${meta.color}44`;

      if (acc >= 90) {
        badgeBg = "#ecfdf5";
        badgeColor = "#047857";
        pillarGrad = "linear-gradient(180deg, #10b981, #34d399)";
        pillarShadow = "0 6px 16px rgba(16,185,129,0.35)";
      } else if (acc >= 75) {
        badgeBg = "#eff6ff";
        badgeColor = "#1d4ed8";
        pillarGrad = "linear-gradient(180deg, #6366f1, #818cf8)";
        pillarShadow = "0 6px 16px rgba(99,102,241,0.35)";
      } else {
        badgeBg = "#fffbeb";
        badgeColor = "#b45309";
        pillarGrad = "linear-gradient(180deg, #f59e0b, #fbbf24)";
        pillarShadow = "0 6px 16px rgba(245,158,11,0.35)";
      }

      return `
        <div class="trend-bar-column" title="Attempt ${idx + 1}: ${meta.label} (${acc}%)">
          <span class="trend-score-tag" style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}33;">
            ${acc}%
          </span>
          <div class="trend-bar-pillar" style="height: ${Math.max(acc, 10)}%; background: ${pillarGrad}; box-shadow: ${pillarShadow}; ${isLatest ? 'outline: 2px solid #6366f1; outline-offset: 1px;' : ''}"></div>
        </div>
      `;
    })
    .join("");

  const footerAxisHtml = recent
    .map((h, idx) => {
      const isLatest = idx === recent.length - 1;
      const typeKey = (h.type || "reading").toLowerCase();
      const meta = ADMIN_SKILL_META[typeKey] || {
        iconName: "book-open",
        label: "Lesson",
      };

      const dateDisplay = h.completedAt
        ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(h.completedAt)
        : `#${idx + 1}`;

      return `
        <div class="trend-axis-node">
          <div class="trend-axis-icon" style="${isLatest ? 'background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; box-shadow: 0 4px 10px rgba(99,102,241,0.3);' : ''}">
            <i data-lucide="${meta.iconName}" style="width: 14px; height: 14px;"></i>
          </div>
          <span class="trend-axis-label">${meta.label.substring(0, 5)}</span>
          <span class="trend-axis-sub">${isLatest ? "✨ Latest" : dateDisplay}</span>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="trend-vis-card">
      <div class="trend-summary-strip">
        <div class="trend-summary-item">
          <div class="trend-summary-val" style="color: #6366f1;">${avgAcc}%</div>
          <div class="trend-summary-lbl">Avg Accuracy</div>
        </div>
        <div class="trend-summary-item">
          <div class="trend-summary-val" style="color: #10b981;">${maxAcc}%</div>
          <div class="trend-summary-lbl">Peak Score</div>
        </div>
        <div class="trend-summary-item">
          <div class="trend-summary-val" style="color: #0f172a;">${recent.length}</div>
          <div class="trend-summary-lbl">Evaluated</div>
        </div>
        <div class="trend-summary-item">
          <div class="trend-summary-val" style="color: ${trajectoryColor}; font-size: 1.05rem;">${trajectoryText}</div>
          <div class="trend-summary-lbl">Trajectory</div>
        </div>
      </div>

      <div class="trend-chart-stage">
        ${barsHtml}
      </div>

      <div class="trend-footer-axis">
        ${footerAxisHtml}
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
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
    showAdminToast("Announcement has been deactivated.", "info", "Announcement Updated");
  } catch (err) {
    console.error("Failed to deactivate announcement:", err);
    showAdminToast("Could not deactivate announcement — check console.", "error");
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
      showAdminToast("New platform announcement posted successfully!", "success", "Broadcast Published");
    } catch (err) {
      console.error("Failed to post announcement:", err);
      showAdminToast("Could not post announcement — check console.", "error");
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
    showAdminToast("Feedback item marked as reviewed.", "success", "Feedback Updated");
  } catch (err) {
    console.error("Failed to mark feedback reviewed:", err);
    showAdminToast("Could not update feedback — check console.", "error");
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
          <div class="admin-error-card" style="background: linear-gradient(135deg, #ffffff, #fff5f5); border: 1.5px solid #fecaca; border-radius: 20px; padding: 1.25rem 1.5rem; box-shadow: 0 8px 24px rgba(239, 68, 68, 0.06); transition: all 0.25s ease; max-width: 100%; box-sizing: border-box; overflow: hidden;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.75rem; flex-wrap: wrap; width: 100%;">
              <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; min-width: 0; max-width: 100%;">
                <span style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; font-weight: 900; font-size: 0.72rem; padding: 0.2rem 0.65rem; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 0.3rem; flex-shrink: 0;">
                  <i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i>
                  <span>Runtime Error</span>
                </span>
                <span style="font-size: 0.85rem; font-weight: 800; color: #0f172a; word-break: break-word;">${email}</span>
                ${url ? `<span style="font-size: 0.78rem; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 0.15rem 0.5rem; border-radius: 6px; word-break: break-all; max-width: 100%;">${url}</span>` : ""}
              </div>
              <span style="font-size: 0.8rem; font-weight: 700; color: #94a3b8; flex-shrink: 0;">${when}</span>
            </div>

            <!-- Error Code Block -->
            <div class="admin-error-code" style="font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace; font-size: 0.85rem; background: #0f172a; color: #f87171; border-radius: 14px; padding: 0.85rem 1.1rem; line-height: 1.5; overflow-x: auto; -webkit-overflow-scrolling: touch; box-shadow: inset 0 2px 8px rgba(0,0,0,0.4); word-break: break-word; white-space: pre-wrap; max-width: 100%; box-sizing: border-box;">
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
            <div class="podium-card podium-silver" style="flex: 1; min-width: 160px; max-width: 210px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 2px solid #cbd5e1; border-radius: 24px; padding: 1.5rem 1rem 1.25rem; text-align: center; box-shadow: 0 10px 25px -5px rgba(15,23,42,0.06);">
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
          <div class="podium-card podium-gold" style="flex: 1; min-width: 180px; max-width: 230px; background: linear-gradient(135deg, #fffbeb, #fef08a); border: 2px solid #eab308; border-radius: 26px; padding: 1.75rem 1rem 1.5rem; text-align: center; box-shadow: 0 16px 36px -8px rgba(234,179,8,0.3); z-index: 2;">
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
            <div class="podium-card podium-bronze" style="flex: 1; min-width: 160px; max-width: 210px; background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 2px solid #fdba74; border-radius: 24px; padding: 1.5rem 1rem 1.25rem; text-align: center; box-shadow: 0 10px 25px -5px rgba(249,115,22,0.1);">
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

async function awardTopThree() {
  const adminBtn = document.getElementById("admin-award-top3-btn");
  if (adminBtn) {
    adminBtn.disabled = true;
    adminBtn.innerHTML = "<i data-lucide='gift' style='width:16px;height:16px;'></i> <span>Awarding...</span>";
    if (window.lucide) lucide.createIcons();
  }

  try {
    const snap = await db.collection("users").orderBy("xp", "desc").limit(3).get();
    if (snap.empty) {
      showAdminToast("No users found on the leaderboard to award.", "warning", "Leaderboard Empty");
      if (adminBtn) {
        adminBtn.disabled = false;
        adminBtn.innerHTML = "<i data-lucide='gift' style='width:16px;height:16px;'></i> <span>Award Top 3 Users</span>";
        if (window.lucide) lucide.createIcons();
      }
      return;
    }

    const batch = db.batch();
    const rewards = [
      { coins: 500, xp: 500 }, // 1st
      { coins: 300, xp: 300 }, // 2nd
      { coins: 100, xp: 100 }, // 3rd
    ];

    let i = 0;
    snap.forEach((doc) => {
      if (i < 3) {
        const reward = rewards[i];
        batch.update(doc.ref, {
          coins: firebase.firestore.FieldValue.increment(reward.coins),
          xp: firebase.firestore.FieldValue.increment(reward.xp),
        });
        i++;
      }
    });

    await batch.commit();

    // Instantly refresh user data & UI across all tabs
    await loadAllUsers();
    renderAdminLeaderboard();
    renderOverview();
    renderUsersTable();

    if (adminBtn) {
      adminBtn.innerHTML = "<i data-lucide='check' style='width:16px;height:16px;'></i> <span>Awarded!</span>";
      if (window.lucide) lucide.createIcons();
      setTimeout(() => {
        adminBtn.disabled = false;
        adminBtn.innerHTML = "<i data-lucide='gift' style='width:16px;height:16px;'></i> <span>Award Top 3 Users</span>";
        if (window.lucide) lucide.createIcons();
      }, 3000);
    }

    showAdminToast(
      "Top 3 learners have been awarded their Coins & XP! Leaderboard and profile stats are updated.",
      "success",
      "🎉 Rewards Distributed!"
    );
  } catch (err) {
    console.error("Error awarding top 3:", err);
    showAdminToast("Could not distribute rewards. Please check console.", "error", "Awarding Failed");
    if (adminBtn) {
      adminBtn.disabled = false;
      adminBtn.innerHTML = "<i data-lucide='gift' style='width:16px;height:16px;'></i> <span>Award Top 3 Users</span>";
      if (window.lucide) lucide.createIcons();
    }
  }
}
