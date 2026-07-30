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

  root.setProperty('--color-primary', tokens.primary);
  root.setProperty('--color-primary-dark', tokens.primaryDark);
  root.setProperty('--color-primary-light', tokens.primaryLight);
  root.setProperty('--color-accent', tokens.accent);
  root.setProperty('--color-bg-deep', tokens.bgDeep);
  root.setProperty('--color-bg-surface', tokens.bgSurface);

  document.body.style.transition = "background-color 0.4s ease";

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
    theme_rose: buildRubyScene
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