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
  reading: { icon: "📖", label: "Reading" },
  writing: { icon: "✍️", label: "Writing" },
  listening: { icon: "🎧", label: "Listening" },
  speaking: { icon: "🗣️", label: "Speaking" },
  pronunciation: { icon: "🔤", label: "Pronunciation" },
};

function setupAdminPage() {
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
      icon: "🌱",
      color: "var(--color-warm-light,#f59e0b)",
    },
    {
      key: "intermediate",
      label: "Intermediate",
      icon: "📘",
      color: "var(--color-primary)",
    },
    {
      key: "advanced",
      label: "Advanced",
      icon: "🚀",
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
        const uid = doc.ref.parent.parent.id;
        const user = userMap[uid];
        const name = user ? user.fullName : "Unknown user";
        const meta = ADMIN_SKILL_META[d.type] || {
          icon: "📌",
          label: d.type || "",
        };
        const when =
          d.completedAt && d.completedAt.toDate
            ? timeAgo(d.completedAt.toDate())
            : "";
        const accColor =
          (d.accuracy || 0) >= 70
            ? "var(--color-accent)"
            : (d.accuracy || 0) >= 40
              ? "var(--color-warm)"
              : "var(--color-error, #ef4444)";

        return `<div class="admin-activity-row">
        <span class="admin-activity-icon">${meta.icon}</span>
        <div class="admin-activity-info">
          <div class="admin-activity-main"><strong>${name}</strong> completed a ${meta.label} lesson — <span style="color:${accColor}; font-weight:700;">${d.accuracy || 0}%</span></div>
          <div class="admin-activity-time">${when}</div>
        </div>
      </div>`;
      })
      .join("");
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

// ─── Users Table ────────────────────────────────────────────

function renderUsersTable() {
  const tbody = document.getElementById("admin-users-tbody");
  if (!tbody) return;

  let list = allUsersCache.filter((u) => {
    if (!currentSearch) return true;
    const q = currentSearch.toLowerCase();
    return (
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  const sorters = {
    xp_desc: (a, b) => b.xp - a.xp,
    streak_desc: (a, b) => b.streak - a.streak,
    score_desc: (a, b) => (b.assessmentScore || 0) - (a.assessmentScore || 0),
    name_asc: (a, b) => a.fullName.localeCompare(b.fullName),
    active_desc: (a, b) =>
      (b.lastActiveDate || "").localeCompare(a.lastActiveDate || ""),
  };
  list = [...list].sort(sorters[currentSort] || sorters.xp_desc);

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="admin-table-empty">No users match your search.</td></tr>`;
    return;
  }

  const LEVEL_LABELS = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };

  tbody.innerHTML = list
    .map(
      (u) => `
    <tr>
      <td>
        <div class="admin-user-cell">
          <div class="admin-user-avatar">${(u.fullName || "U").charAt(0).toUpperCase()}</div>
          <div>
            <div class="admin-user-name">${u.fullName} ${u.isBanned ? '<span class="admin-suspended-badge">Suspended</span>' : ""}</div>
            <div class="admin-user-email">${u.email}</div>
          </div>
        </div>
      </td>
      <td><span class="rec-card-tag ${u.currentLevel}">${LEVEL_LABELS[u.currentLevel] || u.currentLevel}</span></td>
      <td>${u.assessmentScore !== null ? u.assessmentScore + "%" : "—"}</td>
      <td>${u.xp}</td>
      <td>🔥 ${u.streak}</td>
      <td>${u.completedLessons.length}</td>
      <td>${u.lastActiveDate || "Never"}</td>
      <td><button class="admin-view-btn" data-uid="${u.uid}">View</button></td>
    </tr>
  `,
    )
    .join("");

  tbody.querySelectorAll(".admin-view-btn").forEach((btn) => {
    btn.addEventListener("click", () => openUserDetailModal(btn.dataset.uid));
  });
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

  const sortSelect = document.getElementById("admin-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderUsersTable();
    });
  }

  const exportBtn = document.getElementById("admin-export-btn");
  if (exportBtn) exportBtn.addEventListener("click", exportUsersCSV);

  document.querySelectorAll(".dash-nav-item[data-section]").forEach((item) => {
    item.addEventListener("click", () => {
      document
        .querySelectorAll(".dash-nav-item[data-section]")
        .forEach((n) => n.classList.remove("active"));
      item.classList.add("active");
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
      refreshBtn.disabled = false;
      refreshBtn.textContent = "🔄 Refresh";
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
    banBtn.textContent = user.isBanned
      ? "🔓 Reinstate User"
      : "🚫 Suspend User";
  if (adminBtn)
    adminBtn.textContent = user.isAdmin ? "⬇ Revoke Admin" : "⬆ Make Admin";
}

async function saveUserEdits(uid) {
  const btn = document.getElementById("admin-save-edit-btn");
  const original = btn.textContent;
  btn.textContent = "Saving…";
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
    btn.textContent = "Saved ✓";
  } catch (err) {
    console.error("Failed to save user edits:", err);
    btn.textContent = "Error — see console";
  } finally {
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
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
      const meta = ADMIN_SKILL_META[h.type] || { icon: "📖" };
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
        '<div class="analysis-empty-state">No announcements yet.</div>';
      return;
    }
    listEl.innerHTML = snap.docs
      .map((doc) => {
        const d = doc.data();
        const when =
          d.createdAt && d.createdAt.toDate
            ? d.createdAt.toDate().toLocaleString()
            : "";
        return `<div class="admin-activity-row">
        <span class="admin-activity-icon">${d.active ? "🟢" : "⚪"}</span>
        <div class="admin-activity-info">
          <div class="admin-activity-main">${d.message}</div>
          <div class="admin-activity-time">${when}</div>
        </div>
        ${d.active ? `<button class="admin-view-btn" data-deactivate="${doc.id}">Deactivate</button>` : ""}
      </div>`;
      })
      .join("");

    listEl.querySelectorAll("[data-deactivate]").forEach((btn) => {
      btn.addEventListener("click", () =>
        deactivateAnnouncement(btn.dataset.deactivate),
      );
    });
  } catch (err) {
    console.error("Failed to load announcements:", err);
    listEl.innerHTML =
      '<div class="analysis-empty-state">Could not load announcements.</div>';
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
        '<div class="analysis-empty-state">No feedback yet.</div>';
      return;
    }
    listEl.innerHTML = snap.docs
      .map((doc) => {
        const d = doc.data();
        const when =
          d.createdAt && d.createdAt.toDate
            ? timeAgo(d.createdAt.toDate())
            : "";
        return `<div class="admin-activity-row">
        <span class="admin-activity-icon">${d.status === "reviewed" ? "✅" : "🆕"}</span>
        <div class="admin-activity-info">
          <div class="admin-activity-main"><strong>${d.email || "Unknown user"}</strong>: ${d.message}</div>
          <div class="admin-activity-time">${when}</div>
        </div>
        ${d.status !== "reviewed" ? `<button class="admin-view-btn" data-review="${doc.id}">Mark Reviewed</button>` : ""}
      </div>`;
      })
      .join("");

    listEl.querySelectorAll("[data-review]").forEach((btn) => {
      btn.addEventListener("click", () =>
        markFeedbackReviewed(btn.dataset.review),
      );
    });
  } catch (err) {
    console.error("Failed to load feedback:", err);
    listEl.innerHTML =
      '<div class="analysis-empty-state">Could not load feedback.</div>';
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
      listEl.innerHTML =
        '<div class="analysis-empty-state">No errors logged. 🎉</div>';
      return;
    }
    listEl.innerHTML = snap.docs
      .map((doc) => {
        const d = doc.data();
        const when =
          d.createdAt && d.createdAt.toDate
            ? timeAgo(d.createdAt.toDate())
            : "";
        return `<div class="admin-activity-row">
        <span class="admin-activity-icon">🐞</span>
        <div class="admin-activity-info">
          <div class="admin-activity-main">${d.message}</div>
          <div class="admin-activity-time">${d.email || "Unknown user"} · ${when}</div>
        </div>
      </div>`;
      })
      .join("");
  } catch (err) {
    console.error("Failed to load error logs:", err);
    listEl.innerHTML =
      '<div class="analysis-empty-state">Could not load error logs.</div>';
  }
}
