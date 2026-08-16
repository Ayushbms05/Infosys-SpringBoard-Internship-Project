/**
 * celebrations.js — Enhanced Badge & Level-Up Celebration Engine
 *
 * Provides:
 *   - Procedural Web Audio fanfare chime (C5->E5->G5->C6)
 *   - Rich multi-particle confetti & starburst effects
 *   - Luxury 3D glassmorphic badge unlock modals with XP rewards
 *   - Global window.showCelebrationParticles() helper
 *   - Full 7-language localization support
 */

// ─── Badge metadata (synchronized with auth.js IDs & translations.js) ──
const BADGE_META = {
  assessmentDone:       { icon: "🎯", labelKey: "badgeEvaluatedLabel",        descKey: "badgeEvaluatedDesc",        label: "Evaluated",             desc: "Completed your initial skill assessment",           xp: 25 },
  firstLesson:          { icon: "🌱", labelKey: "badgeFirstStepsLabel",       descKey: "badgeFirstStepsDesc",       label: "First Steps",           desc: "Completed your first interactive lesson",           xp: 20 },
  beginnerGraduate:     { icon: "🌿", labelKey: "badgeBeginnerGradLabel",     descKey: "badgeBeginnerGradDesc",     label: "Beginner Graduate",     desc: "Mastered all 5 foundational skills at Beginner level", xp: 50 },
  intermediateGraduate: { icon: "📗", labelKey: "badgeIntermediateGradLabel", descKey: "badgeIntermediateGradDesc", label: "Intermediate Graduate", desc: "Mastered all 5 skills at Intermediate level",         xp: 75 },
  advancedGraduate:     { icon: "🏆", labelKey: "badgeAdvancedGradLabel",     descKey: "badgeAdvancedGradDesc",     label: "Advanced Graduate",     desc: "Mastered every skill module in the curriculum",     xp: 100 },
  streak5:              { icon: "🔥", labelKey: "badgeStreak5Label",          descKey: "badgeStreak5Desc",          label: "5-Day Streak",          desc: "Practiced consistently 5 days in a row",            xp: 25 },
  streak10:             { icon: "🔥", labelKey: "badgeStreak10Label",         descKey: "badgeStreak10Desc",         label: "10-Day Streak",         desc: "Practiced consistently 10 days in a row",           xp: 50 },
  streak30:             { icon: "🏅", labelKey: "badgeStreak30Label",         descKey: "badgeStreak30Desc",         label: "Habit Master",          desc: "Maintained a phenomenal 30-day streak",             xp: 100 },
  gameWinner:           { icon: "🎮", labelKey: "badgeMatchMasterLabel",      descKey: "badgeMatchMasterDesc",      label: "Match Master",          desc: "Successfully solved a Word Match brain game",       xp: 20 },
  gameChampion:         { icon: "👑", labelKey: "badgeGameChampionLabel",     descKey: "badgeGameChampionDesc",     label: "Match Champion",        desc: "Dominated and won 10 Word Match games",             xp: 50 },
  letterKing:           { icon: "👑", labelKey: "badgeLetterKingLabel",       descKey: "badgeLetterKingDesc",       label: "Letter Master",         desc: "Mastered full stroke accuracy in handwriting",      xp: 30 }
};

const LEVEL_META = {
  intermediate: { icon: "📘", label: "Intermediate Level", tagline: "You've conquered Beginner foundations! Unlocking advanced vocabulary & exercises.", xp: 100 },
  advanced:     { icon: "🚀", label: "Advanced Level",     tagline: "You've reached top proficiency! Unlocking elite fluency modules & challenges.", xp: 200 }
};

// ─── Procedural Fanfare Sound ───
function playCelebrationFanfare() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const chord = [
      { f: 523.25, t: 0.00, d: 0.12 }, // C5
      { f: 659.25, t: 0.10, d: 0.12 }, // E5
      { f: 783.99, t: 0.20, d: 0.16 }, // G5
      { f: 1046.5, t: 0.32, d: 0.45 }  // C6
    ];
    chord.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.t);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + n.t);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + n.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n.t + n.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + n.t);
      osc.stop(ctx.currentTime + n.t + n.d + 0.05);
    });
  } catch (e) {
    // AudioContext blocked or not supported — graceful fallback
  }
}

// ─── Helper: Get Localized Text ───
function getCelebrationText(key, fallback) {
  const lang = (typeof selectedLang !== "undefined" && selectedLang) || localStorage.getItem("appLang") || "en";
  if (typeof translations !== "undefined" && translations[lang] && translations[lang][key]) {
    return translations[lang][key];
  }
  if (typeof translations !== "undefined" && translations.en && translations.en[key]) {
    return translations.en[key];
  }
  return fallback;
}

// ─── DOM Container Layer ───
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

// ─── Confetti & Star Particle Generator ───
function buildConfetti(count = 50) {
  const colors = ['#f59e0b', '#6366f1', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4', '#fbbf24'];
  const symbols = ['★', '✦', '◆', '●'];
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = Math.random() * 100;
    const delay = (Math.random() * 0.7).toFixed(2);
    const duration = (2.2 + Math.random() * 1.5).toFixed(2);
    const color = colors[i % colors.length];
    const isSpecial = i % 4 === 0;
    const symbol = symbols[i % symbols.length];
    const size = isSpecial ? (14 + Math.random() * 8).toFixed(0) : (8 + Math.random() * 6).toFixed(0);

    if (isSpecial) {
      html += `
        <div class="confetti-piece confetti-star" style="left:${left}%; color:${color}; font-size:${size}px; animation-delay:${delay}s; animation-duration:${duration}s;">
          ${symbol}
        </div>
      `;
    } else {
      html += `
        <div class="confetti-piece" style="left:${left}%; background:${color}; width:${size}px; height:${(size * 1.4).toFixed(0)}px; animation-delay:${delay}s; animation-duration:${duration}s;"></div>
      `;
    }
  }
  return html;
}

// ─── Global Celebration Particles Burst (Used across app) ───
window.showCelebrationParticles = function (durationMs = 2800) {
  const layer = ensureCelebrationLayer();
  const particleBox = document.createElement('div');
  particleBox.className = 'celebration-confetti-burst';
  particleBox.innerHTML = buildConfetti(45);
  layer.appendChild(particleBox);
  layer.classList.remove('hidden');
  playCelebrationFanfare();

  setTimeout(() => {
    particleBox.remove();
    if (!layer.querySelector('.celebration-card')) {
      layer.classList.add('hidden');
    }
  }, durationMs);
};

// ─── Show Badge Celebration Modal ───
function showBadgeCelebration(badgeId) {
  const meta = BADGE_META[badgeId];
  if (!meta) return Promise.resolve();

  return new Promise((resolve) => {
    playCelebrationFanfare();
    const layer = ensureCelebrationLayer();

    const title = meta.labelKey ? getCelebrationText(meta.labelKey, meta.label) : meta.label;
    const desc = meta.descKey ? getCelebrationText(meta.descKey, meta.desc) : meta.desc;
    const xpBonus = meta.xp || 50;

    layer.innerHTML = `
      <div class="celebration-confetti">${buildConfetti(55)}</div>
      <div class="celebration-card badge-card">
        <button class="celebration-close-btn" id="celeb-close-btn" aria-label="Close">×</button>
        <div class="celebration-sunburst"></div>
        
        <div class="celebration-badge-halo">
          <div class="celebration-icon-circle badge-icon-circle">
            <span class="celebration-badge-emoji">${meta.icon}</span>
          </div>
        </div>

        <div class="celebration-eyebrow">
          <i data-lucide="award" style="width: 14px; height: 14px;"></i>
          <span>Achievement Unlocked</span>
        </div>

        <h2 class="celebration-title">${title}</h2>
        <p class="celebration-desc">${desc}</p>

        <div class="celebration-reward-pill">
          <i data-lucide="zap" style="width: 16px; height: 16px; color: #f59e0b;"></i>
          <span><strong>+${xpBonus} XP</strong> Bonus • Added to Trophy Case</span>
        </div>

        <button class="celebration-action-btn" id="celeb-action-btn">
          <span>Claim Reward</span>
          <i data-lucide="arrow-right" style="width: 18px; height: 18px;"></i>
        </button>
      </div>
    `;

    layer.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const dismiss = () => {
      layer.classList.add('hidden');
      layer.innerHTML = '';
      resolve();
    };

    const actionBtn = layer.querySelector('#celeb-action-btn');
    const closeBtn = layer.querySelector('#celeb-close-btn');

    if (actionBtn) actionBtn.addEventListener('click', dismiss);
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    layer.addEventListener('click', (e) => { if (e.target === layer) dismiss(); });
    setTimeout(dismiss, 6000); // 6s auto dismiss fallback
  });
}

// ─── Show Level Up Celebration Modal ───
function showLevelUpCelebration(newLevel) {
  const meta = LEVEL_META[newLevel] || { icon: "🚀", label: "Level Advanced", tagline: "Great progress on your learning journey!", xp: 100 };

  return new Promise((resolve) => {
    playCelebrationFanfare();
    const layer = ensureCelebrationLayer();

    layer.innerHTML = `
      <div class="celebration-confetti">${buildConfetti(75)}</div>
      <div class="celebration-card levelup-card">
        <button class="celebration-close-btn" id="celeb-close-btn" aria-label="Close">×</button>
        <div class="celebration-sunburst levelup-sunburst"></div>
        
        <div class="celebration-badge-halo">
          <div class="celebration-icon-circle levelup-icon-circle">
            <span class="celebration-badge-emoji">${meta.icon}</span>
          </div>
        </div>

        <div class="celebration-eyebrow levelup-eyebrow">
          <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>
          <span>Tier Promoted</span>
        </div>

        <h2 class="celebration-title">Welcome to ${meta.label}!</h2>
        <p class="celebration-desc">${meta.tagline}</p>

        <div class="celebration-reward-pill">
          <i data-lucide="award" style="width: 16px; height: 16px; color: #6366f1;"></i>
          <span><strong>+${meta.xp} XP</strong> Milestone Reward</span>
        </div>

        <button class="celebration-action-btn levelup-btn" id="celeb-action-btn">
          <span>Let's Level Up! 🚀</span>
        </button>
      </div>
    `;

    layer.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const dismiss = () => {
      layer.classList.add('hidden');
      layer.innerHTML = '';
      resolve();
    };

    const actionBtn = layer.querySelector('#celeb-action-btn');
    const closeBtn = layer.querySelector('#celeb-close-btn');

    if (actionBtn) actionBtn.addEventListener('click', dismiss);
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    layer.addEventListener('click', (e) => { if (e.target === layer) dismiss(); });
    setTimeout(dismiss, 7000);
  });
}

// Export functions to global scope
window.showBadgeCelebration = showBadgeCelebration;
window.showLevelUpCelebration = showLevelUpCelebration;