/**
 * theme.js — Shared Dashboard Theme Engine
 *
 * Extracted out of dashboard.js so every page in the app (lesson, game,
 * chat — not just the dashboard) can apply the user's equipped theme.
 *
 * Each theme now does TWO things when applied:
 *   1. Recolors the shared CSS design tokens (--color-primary, etc.)
 *      so every gradient/badge/ring/button across the app updates.
 *   2. Renders a full-viewport decorative SVG scene behind the content
 *      (pine forest for Emerald, glowing horizon for Sunset, faceted
 *      gems for Ruby) — hand-built inline SVG, not external images.
 *      This keeps things copyright-safe and 100% offline-reliable,
 *      unlike pulling in real photography from the web.
 *
 * The decoration layer is fixed, non-interactive (pointer-events: none),
 * sits behind all page content (z-index: -1), and is kept at low opacity
 * so it never interferes with text readability — important since this
 * app serves users with a wide range of literacy levels.
 *
 * Usage on any page, right after fetching the user's profile:
 *
 *   if (typeof applyTheme === 'function' && profile?.activeTheme) {
 *     applyTheme(profile.activeTheme);
 *   }
 */

// ─── Theme Color Tokens ─────────────────────────────────────────
const THEME_TOKENS = {
  default: {
    primary: "#6C63FF", primaryDark: "#5A52D5", primaryLight: "#8B83FF",
    accent: "#00D4AA", bgDeep: "#FCFAF6", bgSurface: "#F6F1E8"
  },
  theme_emerald: {
    primary: "#10B981", primaryDark: "#059669", primaryLight: "#34D399",
    accent: "#22D3AA", bgDeep: "#F5FAF7", bgSurface: "#E9F5EE"
  },
  theme_sunset: {
    primary: "#F97316", primaryDark: "#C2410C", primaryLight: "#FB923C",
    accent: "#FBBF24", bgDeep: "#FFF8F0", bgSurface: "#FDEEDC"
  },
  theme_rose: {
    primary: "#E11D48", primaryDark: "#BE123C", primaryLight: "#FB7185",
    accent: "#F472B6", bgDeep: "#FFF5F7", bgSurface: "#FCE7EC"
  },
  // ── Premium Themes ─────────────────────────────────────────────
  theme_ocean: {
    primary: "#0891B2", primaryDark: "#0E7490", primaryLight: "#22D3EE",
    accent: "#06B6D4", bgDeep: "#F0FDFA", bgSurface: "#E0F7FA"
  },
  theme_amethyst: {
    primary: "#7C3AED", primaryDark: "#6D28D9", primaryLight: "#A78BFA",
    accent: "#F59E0B", bgDeep: "#FAF5FF", bgSurface: "#EDE9FE"
  }
};

/**
 * applyTheme(themeId)
 *
 * Sets shared CSS custom properties AND renders the matching decorative
 * scene. Falls back to "default" if themeId is missing/unrecognized.
 */
function applyTheme(themeId) {
  const tokens = THEME_TOKENS[themeId] || THEME_TOKENS.default;
  const root = document.documentElement.style;

  // Core color tokens — applied for every theme
  root.setProperty('--color-primary', tokens.primary);
  root.setProperty('--color-primary-dark', tokens.primaryDark);
  root.setProperty('--color-primary-light', tokens.primaryLight);
  root.setProperty('--color-accent', tokens.accent);
  root.setProperty('--color-bg-deep', tokens.bgDeep);
  root.setProperty('--color-bg-surface', tokens.bgSurface);

  // Dark themes need full text/card/border overrides
  if (tokens.dark) {
    document.body.classList.remove('light-theme');
    root.setProperty('--color-text-primary', tokens.textPrimary);
    root.setProperty('--color-text-secondary', tokens.textSecondary);
    root.setProperty('--color-text-muted', tokens.textMuted);
    root.setProperty('--color-bg-card', tokens.bgCard);
    root.setProperty('--color-bg-card-solid', tokens.bgCardSolid);
    root.setProperty('--color-bg-card-hover', tokens.bgCardHover);
    root.setProperty('--color-bg-input', tokens.bgInput);
    root.setProperty('--color-bg-input-focus', tokens.bgInputFocus);
    root.setProperty('--color-border', tokens.border);
    root.setProperty('--shadow-card', tokens.shadowCard);
    root.setProperty('--glass-bg', tokens.glassBg);
    root.setProperty('--glass-border', tokens.glassBorder);
  } else {
    // Switching away from a dark theme — restore light-theme class
    // and clear any inline dark overrides so the CSS defaults take over.
    if (!document.body.classList.contains('light-theme')) {
      document.body.classList.add('light-theme');
    }
    const darkProps = [
      '--color-text-primary', '--color-text-secondary', '--color-text-muted',
      '--color-bg-card', '--color-bg-card-solid', '--color-bg-card-hover',
      '--color-bg-input', '--color-bg-input-focus', '--color-border',
      '--shadow-card', '--glass-bg', '--glass-border'
    ];
    darkProps.forEach(p => root.removeProperty(p));
  }

  document.body.style.transition = "background-color 0.4s ease, color 0.4s ease";

  renderThemeDecoration(themeId);
}

/**
 * ensureDecorationLayer()
 *
 * Creates the fixed full-viewport container for theme scenery once per
 * page load, if it doesn't already exist. Returns the element.
 */
function ensureDecorationLayer() {
  let layer = document.getElementById('theme-decoration-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'theme-decoration-layer';
    // Inserted as the very first child of body so it sits behind
    // everything else in normal stacking order, combined with the
    // fixed positioning + negative z-index in the CSS below.
    document.body.insertBefore(layer, document.body.firstChild);
  }
  return layer;
}

/**
 * renderThemeDecoration(themeId)
 *
 * Builds and injects the SVG scene for the given theme. Safe to call
 * repeatedly (e.g. every time the user switches themes) — it just
 * replaces the layer's content.
 */
function renderThemeDecoration(themeId) {
  const layer = ensureDecorationLayer();
  const builders = {
    theme_emerald: buildEmeraldScene,
    theme_sunset: buildSunsetScene,
    theme_rose: buildRubyScene,
    theme_ocean: buildOceanScene,
    theme_ocean: buildOceanScene,
    theme_amethyst: buildAmethystScene
  };
  const builder = builders[themeId];
  layer.innerHTML = builder ? builder() : ''; // default theme = no scenery, clean slate
}

// ─── Emerald Theme: Pine Forest Horizon ─────────────────────────
function buildEmeraldScene() {
  // Generates a row of overlapping pine trees at staggered sizes/depths,
  // via a small helper rather than hand-writing dozens of coordinates.
  function pineTree(x, scale, opacity) {
    const h = 100 * scale;
    return `
      <g transform="translate(${x}, ${400 - h}) scale(${scale})" fill="#0F6B4F" opacity="${opacity}">
        <path d="M30 0 L50 35 L38 35 L55 65 L42 65 L60 100 L0 100 L18 65 L5 65 L22 35 L10 35 Z" />
        <rect x="26" y="95" width="8" height="14" fill="#6B4423" />
      </g>`;
  }

  let trees = '';
  // Back row — smaller, lighter, more numerous (creates depth)
  const backPositions = [40, 180, 320, 460, 610, 760, 920, 1080, 1240, 1400];
  backPositions.forEach((x, i) => { trees += pineTree(x, 0.65 + (i % 3) * 0.05, 0.10); });
  // Front row — larger, slightly darker, fewer
  const frontPositions = [10, 220, 480, 760, 1040, 1320];
  frontPositions.forEach((x, i) => { trees += pineTree(x, 1.0 + (i % 2) * 0.15, 0.16); });

  return `
    <svg class="theme-deco-svg" viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="emeraldGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10B981" stop-opacity="0" />
          <stop offset="100%" stop-color="#10B981" stop-opacity="0.08" />
        </linearGradient>
      </defs>
      <rect x="0" y="200" width="1600" height="200" fill="url(#emeraldGround)" />
      ${trees}
    </svg>`;
}

// ─── Sunset Theme: Glowing Horizon ───────────────────────────────
function buildSunsetScene() {
  function bird(x, y, scale) {
    return `<path d="M${x} ${y} q ${8 * scale} -${10 * scale} ${16 * scale} 0 q ${8 * scale} -${10 * scale} ${16 * scale} 0"
              stroke="#C2410C" stroke-width="2" fill="none" opacity="0.18" />`;
  }
  const birds = [bird(200, 90, 1), bird(260, 70, 0.8), bird(1300, 110, 1), bird(1360, 85, 0.7)].join('');

  return `
    <svg class="theme-deco-svg" viewBox="0 0 1600 500" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sunsetSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="#FB923C" stop-opacity="0.05" />
          <stop offset="55%" stop-color="#F97316" stop-opacity="0.12" />
          <stop offset="100%" stop-color="#C2410C" stop-opacity="0.05" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stop-color="#FBBF24" stop-opacity="0.55" />
          <stop offset="60%" stop-color="#F97316" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#F97316" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="1600" height="500" fill="url(#sunsetSky)" />

      <!-- Glowing sun, low on the horizon -->
      <circle cx="1250" cy="380" r="220" fill="url(#sunGlow)" class="theme-sun-pulse" />
      <circle cx="1250" cy="380" r="70" fill="#FBBF24" opacity="0.35" />

      <!-- Horizon line -->
      <rect x="0" y="380" width="1600" height="2" fill="#C2410C" opacity="0.10" />

      <!-- Soft rolling hill silhouette -->
      <path d="M0 400 Q 300 350 600 395 T 1200 390 T 1600 400 L1600 500 L0 500 Z" fill="#C2410C" opacity="0.06" />

      ${birds}
    </svg>`;
}

// ─── Ruby Theme: Faceted Gems ────────────────────────────────────
function buildRubyScene() {
  function gem(x, y, scale, opacity) {
    // A faceted diamond: top point, two shoulder facets, table (flat top),
    // and a bottom point — built from a handful of paths with slightly
    // different fill tones to fake light catching each facet.
    return `
      <g transform="translate(${x}, ${y}) scale(${scale})" opacity="${opacity}">
        <polygon points="0,-40 -30,-10 30,-10" fill="#F472B6" />
        <polygon points="-30,-10 0,-40 -10,-40 -30,-15" fill="#FB7185" />
        <polygon points="30,-10 0,-40 10,-40 30,-15" fill="#E11D48" />
        <polygon points="-30,-10 0,50 -3,-10" fill="#BE123C" />
        <polygon points="30,-10 0,50 3,-10" fill="#9F1239" />
        <polygon points="-3,-10 3,-10 0,50" fill="#F472B6" />
        <!-- highlight glint -->
        <path d="M-14 -28 L-6 -20" stroke="#FFF" stroke-width="2" stroke-linecap="round" opacity="0.6" />
      </g>`;
  }

  function sparkle(x, y, scale, delay) {
    return `
      <g transform="translate(${x}, ${y}) scale(${scale})" class="theme-gem-sparkle" style="animation-delay:${delay}s">
        <path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" fill="#FCA5A5" opacity="0.5" />
      </g>`;
  }

  const gems = [
    gem(120, 340, 1.4, 0.14),
    gem(320, 250, 0.9, 0.10),
    gem(1420, 320, 1.6, 0.14),
    gem(1250, 200, 0.8, 0.09)
  ].join('');

  const sparkles = [
    sparkle(200, 260, 1, 0),
    sparkle(1350, 240, 1.2, 0.6),
    sparkle(90, 220, 0.8, 1.1),
    sparkle(1480, 380, 1, 1.6)
  ].join('');

  return `
    <svg class="theme-deco-svg" viewBox="0 0 1600 450" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rubyVignette" cx="50%" cy="100%" r="80%">
          <stop offset="0%"  stop-color="#E11D48" stop-opacity="0.06" />
          <stop offset="100%" stop-color="#E11D48" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="1600" height="450" fill="url(#rubyVignette)" />
      ${gems}
      ${sparkles}
    </svg>`;
}

// ─── Ocean Theme: Deep Seascape ─────────────────────────────────
function buildOceanScene() {
  // Gentle layered waves at the bottom with floating bubbles
  function bubble(cx, cy, r, opacity, delay) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#22D3EE" opacity="${opacity}"
              class="theme-ocean-bubble" style="animation-delay:${delay}s" />`;
  }

  const bubbles = [
    bubble(120, 320, 6, 0.15, 0), bubble(340, 280, 4, 0.12, 0.8),
    bubble(560, 350, 8, 0.18, 1.5), bubble(780, 300, 5, 0.10, 0.3),
    bubble(1000, 340, 7, 0.14, 2.0), bubble(1200, 290, 4, 0.11, 1.1),
    bubble(1400, 330, 6, 0.16, 0.6), bubble(200, 360, 3, 0.09, 1.8),
    bubble(900, 370, 5, 0.13, 2.5), bubble(1500, 310, 4, 0.10, 0.4)
  ].join('');

  return `
    <svg class="theme-deco-svg" viewBox="0 0 1600 450" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="oceanDepth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0891B2" stop-opacity="0" />
          <stop offset="60%" stop-color="#0891B2" stop-opacity="0.04" />
          <stop offset="100%" stop-color="#0E7490" stop-opacity="0.10" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1600" height="450" fill="url(#oceanDepth)" />

      <!-- Layered waves -->
      <path d="M0 380 Q200 350 400 375 T800 370 T1200 380 T1600 365 L1600 450 L0 450 Z"
            fill="#0891B2" opacity="0.06" />
      <path d="M0 395 Q250 370 500 390 T1000 385 T1600 395 L1600 450 L0 450 Z"
            fill="#0E7490" opacity="0.08" />
      <path d="M0 410 Q300 395 600 408 T1200 405 T1600 415 L1600 450 L0 450 Z"
            fill="#155E75" opacity="0.10" />

      <!-- Light rays from the surface -->
      <polygon points="400,0 440,450 360,450" fill="#22D3EE" opacity="0.03" />
      <polygon points="800,0 850,450 750,450" fill="#22D3EE" opacity="0.025" />
      <polygon points="1200,0 1250,450 1150,450" fill="#06B6D4" opacity="0.03" />

      <!-- Seaweed clusters -->
      <path d="M150 450 Q145 400 155 370 Q165 340 150 310" stroke="#0E7490" stroke-width="3" fill="none" opacity="0.12" />
      <path d="M165 450 Q160 410 170 385 Q180 360 168 330" stroke="#0D9488" stroke-width="2.5" fill="none" opacity="0.10" />
      <path d="M1400 450 Q1395 405 1405 375 Q1415 345 1400 315" stroke="#0E7490" stroke-width="3" fill="none" opacity="0.12" />
      <path d="M1415 450 Q1410 415 1420 390 Q1430 365 1418 335" stroke="#0D9488" stroke-width="2.5" fill="none" opacity="0.10" />

      ${bubbles}
    </svg>`;
}

// ─── Amethyst Theme: Crystal Galaxy ────────────────────────────
function buildAmethystScene() {
  function crystal(x, y, scale, opacity, hue) {
    const fill1 = hue === 'gold' ? '#F59E0B' : '#A78BFA';
    const fill2 = hue === 'gold' ? '#D97706' : '#7C3AED';
    const fill3 = hue === 'gold' ? '#FBBF24' : '#C4B5FD';
    return `
      <g transform="translate(${x}, ${y}) scale(${scale})" opacity="${opacity}">
        <polygon points="0,-50 -18,-15 18,-15" fill="${fill3}" />
        <polygon points="-18,-15 0,-50 -25,-20" fill="${fill1}" />
        <polygon points="18,-15 0,-50 25,-20" fill="${fill2}" />
        <polygon points="-18,-15 0,40 -2,-15" fill="${fill2}" />
        <polygon points="18,-15 0,40 2,-15" fill="${fill1}" />
        <polygon points="-2,-15 2,-15 0,40" fill="${fill3}" />
        <path d="M-10 -38 L-5 -28" stroke="#FFF" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
      </g>`;
  }

  function star(cx, cy, r, opacity, delay) {
    return `
      <g class="theme-amethyst-star" style="animation-delay:${delay}s">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#C4B5FD" opacity="${opacity}" />
        <circle cx="${cx}" cy="${cy}" r="${r * 0.4}" fill="#FFF" opacity="${opacity * 0.8}" />
      </g>`;
  }

  const crystals = [
    crystal(100, 380, 1.2, 0.14, 'purple'),
    crystal(280, 320, 0.7, 0.10, 'gold'),
    crystal(1380, 360, 1.4, 0.14, 'purple'),
    crystal(1200, 280, 0.6, 0.09, 'gold'),
    crystal(700, 400, 0.8, 0.08, 'purple')
  ].join('');

  const stars = [
    star(200, 60, 2, 0.25, 0), star(450, 30, 1.5, 0.20, 0.5),
    star(700, 80, 2.5, 0.30, 1.0), star(950, 40, 1.8, 0.22, 1.5),
    star(1150, 70, 2, 0.28, 0.3), star(1400, 50, 1.5, 0.18, 2.0),
    star(300, 100, 1, 0.15, 0.8), star(850, 110, 1.2, 0.17, 1.3),
    star(1300, 95, 1.8, 0.20, 0.7), star(550, 45, 1, 0.12, 2.2),
    star(100, 40, 1.5, 0.18, 1.8), star(1500, 85, 2, 0.22, 0.2)
  ].join('');

  return `
    <svg class="theme-deco-svg" viewBox="0 0 1600 450" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="amethystGlow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.06" />
          <stop offset="100%" stop-color="#7C3AED" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="amethystFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7C3AED" stop-opacity="0" />
          <stop offset="100%" stop-color="#6D28D9" stop-opacity="0.07" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1600" height="450" fill="url(#amethystGlow)" />
      <rect x="0" y="300" width="1600" height="150" fill="url(#amethystFloor)" />

      <!-- Subtle aurora band -->
      <path d="M0 180 Q400 140 800 175 T1600 160 L1600 220 Q1200 200 800 215 T0 210 Z"
            fill="#A78BFA" opacity="0.04" />

      ${stars}
      ${crystals}
    </svg>`;
}