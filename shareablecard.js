/**
 * shareablecard.js — Purpose-Designed High-Res Social Card Generator
 *
 * ═══════════════════════════════════════════════════════════════════
 * ISOLATION CONTRACT:
 *   ❌  Does NOT modify lesson.js, units.js, curriculum.js, handwriting.js,
 *       leagues.js, or studygroups.js
 *   ❌  Does NOT alter user data or XP calculations
 *   ✅  Generates 1080x1080 (Square) & 1080x1920 (Story) PNG Graphics via Canvas
 *   ✅  Renders live preview modal with 7-language translation support
 *   ✅  Maps language codes to full names (e.g., 'hi' -> 'HINDI')
 *   ✅  Supports Web Share API (with PNG file blob where supported) & Desktop Download
 * ═══════════════════════════════════════════════════════════════════
 */

let cardProfile      = null;
let cardFormat       = "square"; // "square" (1080x1080) | "story" (1080x1920)
let cardTheme        = "amethyst"; // "amethyst" | "emerald" | "solar" | "cyber"
let currentCanvasEl  = null;

const SC_LANG_MAP = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  bn: "Bengali",
  mr: "Marathi"
};

const CARD_THEMES = {
  amethyst: {
    id: "amethyst",
    name: "Amethyst",
    dotColor: "#a855f7",
    gradStops: ["#1e1b4b", "#312e81", "#4c1d95"],
    glow1: "rgba(99, 102, 241, 0.45)",
    glow2: "rgba(168, 85, 247, 0.4)",
    badgeBg: "rgba(168, 85, 247, 0.25)",
    badgeBorder: "rgba(168, 85, 247, 0.5)",
    badgeText: "#c084fc",
    accentXp: "#fbbf24",
    accentStreak: "#ff6b6b",
    accentLessons: "#34d399",
    accentTier: "#38bdf8",
    avatarBgGrad: ["#a855f7", "#6366f1"],
    cardBg: "rgba(255, 255, 255, 0.1)",
    cardBorder: "rgba(255, 255, 255, 0.22)"
  },
  emerald: {
    id: "emerald",
    name: "Emerald",
    dotColor: "#10b981",
    gradStops: ["#064e3b", "#047857", "#0f766e"],
    glow1: "rgba(16, 185, 129, 0.45)",
    glow2: "rgba(20, 184, 166, 0.4)",
    badgeBg: "rgba(16, 185, 129, 0.25)",
    badgeBorder: "rgba(16, 185, 129, 0.5)",
    badgeText: "#34d399",
    accentXp: "#fde047",
    accentStreak: "#ff7849",
    accentLessons: "#6ee7b7",
    accentTier: "#60a5fa",
    avatarBgGrad: ["#10b981", "#059669"],
    cardBg: "rgba(255, 255, 255, 0.1)",
    cardBorder: "rgba(255, 255, 255, 0.22)"
  },
  solar: {
    id: "solar",
    name: "Solar Gold",
    dotColor: "#f59e0b",
    gradStops: ["#451a03", "#78350f", "#b45309"],
    glow1: "rgba(245, 158, 11, 0.45)",
    glow2: "rgba(239, 68, 68, 0.4)",
    badgeBg: "rgba(245, 158, 11, 0.25)",
    badgeBorder: "rgba(245, 158, 11, 0.5)",
    badgeText: "#fbbf24",
    accentXp: "#ffffff",
    accentStreak: "#fef08a",
    accentLessons: "#86efac",
    accentTier: "#7dd3fc",
    avatarBgGrad: ["#f59e0b", "#d97706"],
    cardBg: "rgba(255, 255, 255, 0.12)",
    cardBorder: "rgba(255, 255, 255, 0.25)"
  },
  cyber: {
    id: "cyber",
    name: "Cyber Neon",
    dotColor: "#38bdf8",
    gradStops: ["#0f172a", "#1e1b4b", "#0284c7"],
    glow1: "rgba(56, 189, 248, 0.45)",
    glow2: "rgba(236, 72, 153, 0.4)",
    badgeBg: "rgba(14, 165, 233, 0.25)",
    badgeBorder: "rgba(14, 165, 233, 0.5)",
    badgeText: "#38bdf8",
    accentXp: "#c084fc",
    accentStreak: "#f43f5e",
    accentLessons: "#10b981",
    accentTier: "#f59e0b",
    avatarBgGrad: ["#0284c7", "#6366f1"],
    cardBg: "rgba(255, 255, 255, 0.08)",
    cardBorder: "rgba(255, 255, 255, 0.18)"
  }
};

// ── Translation Helper ────────────────────────────────────────────
function scTr(key) {
  const langCode = (cardProfile && cardProfile.preferredLanguage) || localStorage.getItem("akshargyan_lang") || "en";
  if (typeof getTranslation === "function") {
    return getTranslation(langCode, key);
  }
  return key;
}

// ── Open Card Generator Modal ─────────────────────────────────────
async function openShareableCardModal(profile) {
  cardProfile = profile || {};
  cardFormat  = "square";
  cardTheme   = "amethyst";

  const existing = document.getElementById("shareable-card-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "shareable-card-modal";
  modal.className = "shareable-card-modal-overlay";
  modal.innerHTML = `
    <div class="shareable-card-container">
      <button class="shareable-card-close" id="sc-close-btn" title="Close">✕</button>

      <!-- Modal Header -->
      <div style="text-align: center; margin-bottom: 1.1rem;">
        <h3 style="margin: 0 0 0.3rem; font-size: 1.35rem; font-weight: 900; color: var(--color-text-primary); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <i data-lucide="sparkles" style="color: var(--color-primary); width: 22px; height: 22px;"></i>
          <span>${scTr("shareCardTitle")}</span>
        </h3>
        <p style="margin: 0; color: var(--color-text-secondary); font-size: 0.85rem; line-height: 1.4;">
          ${scTr("shareCardSubtitle")}
        </p>
      </div>

      <!-- Controls: Format & Theme Selectors -->
      <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.1rem;">
        <!-- Format Toggle -->
        <div style="display: flex; gap: 0.6rem;">
          <button id="sc-format-square" class="sc-format-btn active">
            <i data-lucide="square" style="width: 15px; height: 15px;"></i>
            <span>${scTr("squareFormat")} (1:1)</span>
          </button>
          <button id="sc-format-story" class="sc-format-btn">
            <i data-lucide="smartphone" style="width: 15px; height: 15px;"></i>
            <span>${scTr("storyFormat")} (9:16)</span>
          </button>
        </div>

        <!-- Theme Toggle Row -->
        <div style="display: flex; gap: 0.4rem;">
          ${Object.keys(CARD_THEMES).map(tKey => {
            const t = CARD_THEMES[tKey];
            return `
              <button id="sc-theme-${tKey}" class="sc-theme-btn ${tKey === cardTheme ? 'active' : ''}">
                <span class="sc-theme-dot" style="background: ${t.dotColor};"></span>
                <span>${t.name}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Live Preview Container -->
      <div id="sc-preview-wrap" style="text-align: center; margin-bottom: 1.1rem; background: rgba(0,0,0,0.03); padding: 0.75rem; border-radius: 18px; border: 1.5px dashed var(--color-border); display: flex; justify-content: center; align-items: center; min-height: 320px; transition: all 0.25s ease;">
        <div class="loading-spinner"></div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 0.6rem; align-items: center; justify-content: center; flex-wrap: wrap;">
        <button id="sc-download-btn" class="btn-primary sc-action-btn" style="flex: 1.2;">
          <i data-lucide="download" style="width: 17px; height: 17px;"></i>
          <span>${scTr("downloadPng")}</span>
        </button>
        <button id="sc-share-btn" class="btn-secondary sc-action-btn" style="flex: 1; border-color: var(--color-primary); color: var(--color-primary);">
          <i data-lucide="share-2" style="width: 17px; height: 17px;"></i>
          <span>${scTr("shareSocial")}</span>
        </button>
        <button id="sc-copy-btn" class="btn-secondary sc-action-btn" style="flex: 0.9; border-color: var(--color-border); color: var(--color-text-secondary);" title="Copy Summary Text">
          <i data-lucide="copy" style="width: 17px; height: 17px;"></i>
          <span>Copy</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) lucide.createIcons();

  // Attach Event Handlers
  const closeModal = () => modal.remove();
  document.getElementById("sc-close-btn").onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };

  const squareBtn = document.getElementById("sc-format-square");
  const storyBtn  = document.getElementById("sc-format-story");

  squareBtn.onclick = () => {
    cardFormat = "square";
    squareBtn.classList.add("active");
    storyBtn.classList.remove("active");
    renderAndPreviewCard();
  };

  storyBtn.onclick = () => {
    cardFormat = "story";
    storyBtn.classList.add("active");
    squareBtn.classList.remove("active");
    renderAndPreviewCard();
  };

  // Attach Theme Handlers
  Object.keys(CARD_THEMES).forEach(tKey => {
    const btn = document.getElementById(`sc-theme-${tKey}`);
    if (btn) {
      btn.onclick = () => {
        cardTheme = tKey;
        Object.keys(CARD_THEMES).forEach(k => {
          const b = document.getElementById(`sc-theme-${k}`);
          if (b) b.classList.toggle("active", k === tKey);
        });
        renderAndPreviewCard();
      };
    }
  });

  document.getElementById("sc-download-btn").onclick = downloadGeneratedCard;
  document.getElementById("sc-share-btn").onclick    = shareGeneratedCard;
  document.getElementById("sc-copy-btn").onclick     = copyProgressSummaryText;

  // Initial render
  await renderAndPreviewCard();
}

// ── Render Card on Offscreen Canvas and Update Preview ─────────────
async function renderAndPreviewCard() {
  const previewWrap = document.getElementById("sc-preview-wrap");
  if (!previewWrap) return;

  previewWrap.innerHTML = `<div class="loading-spinner"></div>`;

  currentCanvasEl = generateSocialCardCanvas(cardProfile, cardFormat, cardTheme);

  const imgUrl = currentCanvasEl.toDataURL("image/png");
  previewWrap.innerHTML = `
    <img src="${imgUrl}" alt="Shareable Progress Card" style="max-width: 100%; max-height: ${cardFormat === 'square' ? '330px' : '440px'}; border-radius: 14px; box-shadow: 0 14px 35px rgba(0,0,0,0.3); transition: transform 0.2s ease;" />
  `;
}

// ── HTML5 Canvas Rendering Engine ─────────────────────────────────
function generateSocialCardCanvas(profile, format, themeKey) {
  const isSquare = format === "square";
  const W = 1080;
  const H = isSquare ? 1080 : 1920;
  const theme = CARD_THEMES[themeKey] || CARD_THEMES.amethyst;

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // User & Stats Data
  const userName     = profile.fullName || profile.displayName || "Learner";
  const rawLang      = profile.targetLanguage || profile.preferredLanguage || "en";
  const fullLangName = SC_LANG_MAP[rawLang] || rawLang;
  const targetLang   = fullLangName.toUpperCase();

  const streak       = profile.streak || 0;
  const weeklyXP     = profile.weeklyLeagueXP || profile.xp || 0;
  const totalXP      = profile.xp || 0;
  const lessons      = (profile.completedLessons || []).length;
  const tierId       = profile.currentLeague || "bronze";
  const tierMap      = {
    bronze:  scTr("bronzeLeague") || "Bronze League",
    silver:  scTr("silverLeague") || "Silver League",
    gold:    scTr("goldLeague")   || "Gold League",
    diamond: scTr("diamondLeague")|| "Diamond League"
  };
  const tierName     = tierMap[tierId] || "Bronze League";

  // 1. Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0.0, theme.gradStops[0]);
  bgGrad.addColorStop(0.5, theme.gradStops[1]);
  bgGrad.addColorStop(1.0, theme.gradStops[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Decorative Background Radial Glows
  const glow1 = ctx.createRadialGradient(W * 0.25, H * 0.2, 50, W * 0.25, H * 0.2, isSquare ? 500 : 750);
  glow1.addColorStop(0, theme.glow1);
  glow1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W * 0.8, H * 0.75, 50, W * 0.8, H * 0.75, isSquare ? 550 : 850);
  glow2.addColorStop(0, theme.glow2);
  glow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Decorative Sparkles
  drawCanvasSparkles(ctx, W, H);

  // 3. Header Branding Bar (AksharGyan Logo + Target Lang Badge)
  const paddingX = 85;
  let currentY   = isSquare ? 85 : 140;

  // AksharGyan Logo Box (Glassmorphic)
  drawRoundRect(ctx, paddingX, currentY, 280, 64, 16, "rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.25)", 2);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 26px system-ui, -apple-system, sans-serif";
  ctx.fillText("✨ AksharGyan", paddingX + 26, currentY + 41);

  // Target Language Badge
  const langText = `🌐 ${scTr("learningTag") || "LEARNING"} ${targetLang}`;
  ctx.font = "800 20px system-ui, -apple-system, sans-serif";
  const langWidth = ctx.measureText(langText).width + 44;
  drawRoundRect(ctx, W - paddingX - langWidth, currentY, langWidth, 64, 16, theme.badgeBg, theme.badgeBorder, 2);
  ctx.fillStyle = theme.badgeText;
  ctx.fillText(langText, W - paddingX - langWidth + 22, currentY + 40);

  // 4. Learner Profile Header
  currentY += isSquare ? 110 : 170;

  // Profile Avatar Circle with User Initial
  const initial = (userName.charAt(0) || "L").toUpperCase();
  const avatarRadius = isSquare ? 42 : 55;
  const avatarX = paddingX + avatarRadius;
  const avatarY = currentY + avatarRadius;

  // Outer glowing avatar ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 4, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Avatar Circle Gradient Fill
  const avGrad = ctx.createLinearGradient(avatarX - avatarRadius, avatarY - avatarRadius, avatarX + avatarRadius, avatarY + avatarRadius);
  avGrad.addColorStop(0, theme.avatarBgGrad[0]);
  avGrad.addColorStop(1, theme.avatarBgGrad[1]);
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
  ctx.fillStyle = avGrad;
  ctx.fill();
  ctx.restore();

  // Avatar Initial Text
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${isSquare ? 38 : 50}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initial, avatarX, avatarY + 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Name & Subtitle Next to Avatar
  const nameX = avatarX + avatarRadius + 28;
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "800 20px system-ui, -apple-system, sans-serif";
  ctx.fillText((scTr("weeklyProgress") || "WEEKLY PROGRESS CARD").toUpperCase(), nameX, avatarY - (isSquare ? 8 : 12));

  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${isSquare ? 46 : 56}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(userName, nameX, avatarY + (isSquare ? 32 : 40));

  // 5. Central Hero Glass Card (Weekly XP & Streak)
  currentY += isSquare ? 115 : 180;
  const heroH = isSquare ? 280 : 380;
  drawRoundRect(ctx, paddingX, currentY, W - (paddingX * 2), heroH, 30, theme.cardBg, theme.cardBorder, 2);

  // Vertical Divider line between XP and Streak
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2, currentY + 35);
  ctx.lineTo(W / 2, currentY + heroH - 35);
  ctx.stroke();

  // Hero Stat Left: Weekly XP
  const col1X = paddingX + 50;
  let heroTextY = currentY + (isSquare ? 90 : 130);

  ctx.fillStyle = theme.accentXp;
  ctx.font = `900 ${isSquare ? 72 : 88}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(`⚡ ${weeklyXP} XP`, col1X, heroTextY);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 23px system-ui, -apple-system, sans-serif";
  ctx.fillText(scTr("xpEarnedThisWeek") || "XP Earned This Week", col1X, heroTextY + 45);

  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.font = "600 19px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${scTr("totalLifetimeXp") || "Total"}: ${totalXP.toLocaleString()} XP`, col1X, heroTextY + 78);

  // Hero Stat Right: Active Streak
  const col2X = W / 2 + 45;
  ctx.fillStyle = theme.accentStreak;
  ctx.font = `900 ${isSquare ? 72 : 88}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(`🔥 ${streak} DAYS`, col2X, heroTextY);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 23px system-ui, -apple-system, sans-serif";
  ctx.fillText(scTr("dayStreak") || "Active Daily Streak", col2X, heroTextY + 45);

  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.font = "600 19px system-ui, -apple-system, sans-serif";
  ctx.fillText(streak > 0 ? "Unstoppable Momentum! 🚀" : "Start your streak today!", col2X, heroTextY + 78);

  // 6. Secondary Grid Cards (Lessons Mastered & League Tier)
  currentY += heroH + (isSquare ? 35 : 60);
  const cardW = (W - (paddingX * 2) - 35) / 2;
  const subH  = isSquare ? 200 : 270;

  // Sub Card 1: Lessons Mastered
  drawRoundRect(ctx, paddingX, currentY, cardW, subH, 24, theme.cardBg, theme.cardBorder, 2);
  let subTextY = currentY + (isSquare ? 75 : 105);

  ctx.fillStyle = theme.accentLessons;
  ctx.font = `900 ${isSquare ? 52 : 64}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(`🎯 ${lessons}`, paddingX + 35, subTextY);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 22px system-ui, -apple-system, sans-serif";
  ctx.fillText(scTr("lessonsMastered") || "Lessons Completed", paddingX + 35, subTextY + 42);

  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "600 18px system-ui, -apple-system, sans-serif";
  ctx.fillText(scTr("focusedLearning") || "Focused Mastery", paddingX + 35, subTextY + 74);

  // Sub Card 2: League Standing
  drawRoundRect(ctx, paddingX + cardW + 35, currentY, cardW, subH, 24, theme.cardBg, theme.cardBorder, 2);

  ctx.fillStyle = theme.accentTier;
  ctx.font = `900 ${isSquare ? 42 : 52}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(`🏆 ${tierName}`, paddingX + cardW + 35, subTextY);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 22px system-ui, -apple-system, sans-serif";
  ctx.fillText(scTr("leagueTier") || "League Division", paddingX + cardW + 35, subTextY + 42);

  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "600 18px system-ui, -apple-system, sans-serif";
  ctx.fillText(scTr("weeklyCompetition") || "Top Weekly Learner", paddingX + cardW + 35, subTextY + 74);

  // 7. Story Mode Extra Banner (Only in Story Format)
  if (!isSquare) {
    currentY += subH + 60;
    const bannerH = 180;
    drawRoundRect(ctx, paddingX, currentY, W - (paddingX * 2), bannerH, 26, "rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.2)", 2);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 24px system-ui, -apple-system, sans-serif";
    ctx.fillText("🌟 Milestone Highlight", paddingX + 40, currentY + 55);

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "600 21px system-ui, -apple-system, sans-serif";
    ctx.fillText(`"Consistency is the key to mastering ${fullLangName}!"`, paddingX + 40, currentY + 98);

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "500 18px system-ui, -apple-system, sans-serif";
    ctx.fillText("Join millions learning daily on AksharGyan", paddingX + 40, currentY + 135);
  }

  // 8. Footer Branding
  const footerY = H - (isSquare ? 65 : 110);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(paddingX, footerY - 30);
  ctx.lineTo(W - paddingX, footerY - 30);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "700 20px system-ui, -apple-system, sans-serif";
  ctx.fillText("AksharGyan • Empowering Literacy & Learning Every Day", paddingX, footerY + 10);

  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "800 18px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("akshargyan.app", W - paddingX, footerY + 10);
  ctx.textAlign = "left";

  return canvas;
}

// ── Helper: Draw Decorative Sparkles on Canvas ────────────────────
function drawCanvasSparkles(ctx, W, H) {
  const points = [
    { x: W * 0.15, y: H * 0.12, r: 4 },
    { x: W * 0.88, y: H * 0.16, r: 6 },
    { x: W * 0.92, y: H * 0.42, r: 5 },
    { x: W * 0.08, y: H * 0.58, r: 7 },
    { x: W * 0.85, y: H * 0.82, r: 4 },
    { x: W * 0.12, y: H * 0.88, r: 5 }
  ];

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    // Star sparkle cross arms
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x - p.r * 2.5, p.y);
    ctx.lineTo(p.x + p.r * 2.5, p.y);
    ctx.moveTo(p.x, p.y - p.r * 2.5);
    ctx.lineTo(p.x, p.y + p.r * 2.5);
    ctx.stroke();
  });
  ctx.restore();
}

// ── Helper: Draw Rounded Rectangle on Canvas ──────────────────────
function drawRoundRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle, strokeWidth = 2) {
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.rect(x, y, width, height);
  }
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
  ctx.restore();
}

// ── Download PNG Action ───────────────────────────────────────────
function downloadGeneratedCard() {
  if (!currentCanvasEl) return;
  const userName = cardProfile ? (cardProfile.fullName || "learner") : "learner";
  const safeName = userName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  const link = document.createElement("a");
  link.download = `akshargyan-${cardFormat}-${cardTheme}-${safeName}.png`;
  link.href = currentCanvasEl.toDataURL("image/png");
  link.click();
}

// ── Copy Summary Text Action ──────────────────────────────────────
async function copyProgressSummaryText() {
  const userName = cardProfile ? (cardProfile.fullName || "Learner") : "Learner";
  const xp       = cardProfile ? (cardProfile.weeklyLeagueXP || cardProfile.xp || 0) : 0;
  const streak   = cardProfile ? (cardProfile.streak || 0) : 0;
  const lessons  = cardProfile ? (cardProfile.completedLessons || []).length : 0;

  const textSummary = `🌟 ${userName}'s Weekly Progress on AksharGyan!\n\n⚡ ${xp} XP Earned This Week\n🔥 ${streak} Days Active Streak\n🎯 ${lessons} Lessons Mastered\n\nLearn daily on AksharGyan! 🚀`;

  try {
    await navigator.clipboard.writeText(textSummary);
    const copyBtn = document.getElementById("sc-copy-btn");
    if (copyBtn) {
      const origHTML = copyBtn.innerHTML;
      copyBtn.innerHTML = `<i data-lucide="check" style="width:17px; height:17px;"></i><span>Copied!</span>`;
      if (window.lucide) lucide.createIcons();
      setTimeout(() => { copyBtn.innerHTML = origHTML; if (window.lucide) lucide.createIcons(); }, 2000);
    }
  } catch (e) {
    console.warn("Clipboard error:", e);
  }
}

// ── Share Social Action (Web Share API with PNG Blob + Desktop Fallback) ──
async function shareGeneratedCard() {
  if (!currentCanvasEl) return;

  const userName = cardProfile ? (cardProfile.fullName || "Learner") : "Learner";
  const xp       = cardProfile ? (cardProfile.weeklyLeagueXP || cardProfile.xp || 0) : 0;
  const streak   = cardProfile ? (cardProfile.streak || 0) : 0;

  const textSummary = `🌟 ${userName}'s Weekly Progress on AksharGyan!\n\n⚡ ${xp} XP Earned This Week\n🔥 ${streak} Days Active Streak\n\nAksharGyan`;

  if (navigator.canShare && currentCanvasEl.toBlob) {
    try {
      currentCanvasEl.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `akshargyan-${cardTheme}-progress.png`, { type: "image/png" });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${userName}'s Literacy Achievement`,
            text:  textSummary,
            files: [file]
          });
          return;
        } else if (navigator.share) {
          await navigator.share({
            title: `${userName}'s Literacy Achievement`,
            text:  textSummary,
            url:   window.location.origin
          });
          return;
        }
      });
      return;
    } catch (err) {
      if (err.name !== "AbortError") console.warn("[shareablecard.js] Web Share error:", err);
    }
  }

  copyProgressSummaryText();
  downloadGeneratedCard();
}

