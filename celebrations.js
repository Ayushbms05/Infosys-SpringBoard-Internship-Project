/**
 * celebrations.js — Badge & Level-Up Celebration Modals
 *
 * Shared across lesson.html and game.html (anywhere completeLesson() or
 * checkAndAwardBadges() might report something new happened).
 *
 * Both celebration types:
 *   - Show a centered modal with confetti (pure CSS, no library)
 *   - Auto-dismiss on click or after a few seconds
 *   - Return a Promise that resolves once dismissed, so calling code
 *     can await them and show multiple celebrations one after another
 *     instead of stacking on top of each other.
 */

// ─── Badge metadata (kept in sync with the IDs auth.js awards) ──
const BADGE_META = {
  assessmentDone:      { icon: "🎯", label: "Evaluated",            desc: "Completed your initial assessment" },
  firstLesson:         { icon: "🌱", label: "First Steps",          desc: "Completed your first lesson" },
  beginnerGraduate:    { icon: "🌿", label: "Beginner Graduate",    desc: "Mastered all 5 skills at Beginner level" },
  intermediateGraduate:{ icon: "📗", label: "Intermediate Graduate",desc: "Mastered all 5 skills at Intermediate level" },
  advancedGraduate:    { icon: "🏆", label: "Advanced Graduate",    desc: "Mastered every skill in the curriculum" },
  streak5:             { icon: "🔥", label: "5-Day Streak",         desc: "Practiced 5 days in a row" },
  streak10:            { icon: "🔥", label: "10-Day Streak",        desc: "Practiced 10 days in a row" },
  streak30:            { icon: "🏅", label: "Habit Formed",         desc: "Practiced 30 days in a row" },
  gameWinner:          { icon: "🎮", label: "Match Master",         desc: "Won a Word Match game" },
  gameChampion:        { icon: "👑", label: "Match Champion",       desc: "Won 10 Word Match games" }
};

const LEVEL_META = {
  intermediate: { icon: "📘", label: "Intermediate", tagline: "You've mastered the Beginner level!" },
  advanced:     { icon: "🚀", label: "Advanced",      tagline: "You've mastered the Intermediate level!" }
};

/**
 * ensureCelebrationLayer()
 * Creates the fixed full-screen overlay container once per page load.
 */
function ensureCelebrationLayer() {
  let layer = document.getElementById('celebration-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'celebration-layer';
    layer.className = 'celebration-overlay hidden';
    document.body.appendChild(layer);
  }
  return layer;
}

/**
 * buildConfetti(count)
 * Generates `count` small colored div "pieces" with randomized horizontal
 * position, fall delay, and rotation — pure CSS animation, no library.
 */
function buildConfetti(count) {
  const colors = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-warm, #F59E0B)', '#FB7185'];
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = Math.random() * 100;
    const delay = (Math.random() * 0.6).toFixed(2);
    const duration = (2.2 + Math.random() * 1.2).toFixed(2);
    const color = colors[i % colors.length];
    const rotate = Math.floor(Math.random() * 360);
    html += `<div class="confetti-piece" style="left:${left}%; background:${color}; animation-delay:${delay}s; animation-duration:${duration}s; transform:rotate(${rotate}deg);"></div>`;
  }
  return html;
}

/**
 * showBadgeCelebration(badgeId)
 * Returns a Promise that resolves once the modal is dismissed.
 */
function showBadgeCelebration(badgeId) {
  const meta = BADGE_META[badgeId];
  if (!meta) return Promise.resolve(); // unknown badge id, skip silently

  return new Promise((resolve) => {
    const layer = ensureCelebrationLayer();
    layer.innerHTML = `
      <div class="celebration-confetti">${buildConfetti(40)}</div>
      <div class="celebration-card badge-card">
        <div class="celebration-icon-circle badge-icon-circle">${meta.icon}</div>
        <div class="celebration-eyebrow">Badge Earned!</div>
        <h2 class="celebration-title">${meta.label}</h2>
        <p class="celebration-desc">${meta.desc}</p>
        <button class="btn-primary celebration-dismiss-btn">Nice!</button>
      </div>
    `;
    layer.classList.remove('hidden');

    const dismiss = () => {
      layer.classList.add('hidden');
      layer.innerHTML = '';
      resolve();
    };

    layer.querySelector('.celebration-dismiss-btn').addEventListener('click', dismiss);
    layer.addEventListener('click', (e) => { if (e.target === layer) dismiss(); });
    setTimeout(dismiss, 4500); // auto-dismiss so it never blocks flow
  });
}

/**
 * showLevelUpCelebration(newLevel)
 * Bigger, more prominent modal — leveling up is a rarer, larger milestone
 * than a single badge, so it gets more confetti and a distinct layout.
 */
function showLevelUpCelebration(newLevel) {
  const meta = LEVEL_META[newLevel];
  if (!meta) return Promise.resolve();

  return new Promise((resolve) => {
    const layer = ensureCelebrationLayer();
    layer.innerHTML = `
      <div class="celebration-confetti">${buildConfetti(70)}</div>
      <div class="celebration-card levelup-card">
        <div class="celebration-icon-circle levelup-icon-circle">${meta.icon}</div>
        <div class="celebration-eyebrow">Level Up!</div>
        <h2 class="celebration-title">Welcome to ${meta.label}</h2>
        <p class="celebration-desc">${meta.tagline}</p>
        <button class="btn-primary celebration-dismiss-btn">Let's go!</button>
      </div>
    `;
    layer.classList.remove('hidden');

    const dismiss = () => {
      layer.classList.add('hidden');
      layer.innerHTML = '';
      resolve();
    };

    layer.querySelector('.celebration-dismiss-btn').addEventListener('click', dismiss);
    layer.addEventListener('click', (e) => { if (e.target === layer) dismiss(); });
    setTimeout(dismiss, 5500);
  });
}