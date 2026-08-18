/**
 * handwriting.js — Handwriting & Tracing Studio Engine
 *
 * ═══════════════════════════════════════════════════════════════════
 * FEATURES:
 *   ✅ Supports all 7 official platform languages (en, hi, ta, te, kn, bn, mr)
 *   ✅ Full i18n support with data-i18n attributes and dynamic locale lookup
 *   ✅ Retina high-DPI canvas with smooth quadratic bezier curve ink
 *   ✅ Undo stroke history, ink colors, brush size options, clear & guide toggle
 *   ✅ Instant native speech pronunciation for all characters & words
 *   ✅ Stroke accuracy evaluation comparing user strokes to glyph guide
 *   ✅ Saves progress to profile.handwritingProgress and awards +15 XP
 * ═══════════════════════════════════════════════════════════════════
 */

let hwProfile           = null;
let hwCanvas            = null;
let hwCtx               = null;
let hwIsDrawing         = false;
let hwHasDrawn          = false;
let hwCurrentLang       = "en";
let hwCurrentCategory   = "alphabets";
let hwCurrentIndex      = 0;
let hwPenColor          = "#6366f1"; // primary indigo
let hwPenWidth          = 8;
let hwStrokePoints      = [];
let hwStrokeHistory     = []; // For undo functionality
let hwShowGuideLines    = true;
let hwState             = "ready"; // "ready" (Check & Earn XP) | "checked" (Next Character ➔)

// ── 7 Supported Languages Metadata ────────────────────────────────
const HW_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" }
];

// ── Category Definitions ──────────────────────────────────────────
const HW_CATEGORIES = [
  { id: "alphabets", icon: "book-open", i18nKey: "hwAlphabets", defaultLabel: "Letters" },
  { id: "numbers", icon: "hash", i18nKey: "hwNumbers", defaultLabel: "Numbers" },
  { id: "commonWords", icon: "sparkles", i18nKey: "hwWords", defaultLabel: "Words" }
];

// ── Helper to Get Active Language Translation ────────────────────
function getHwText(key, defaultText) {
  const curLang = typeof selectedLang !== "undefined" ? selectedLang : (hwCurrentLang || "en");
  if (typeof translations !== "undefined" && translations[curLang] && translations[curLang][key]) {
    return translations[curLang][key];
  }
  if (typeof translations !== "undefined" && translations.en && translations.en[key]) {
    return translations.en[key];
  }
  return defaultText || key;
}

// ── Initialise Handwriting Studio ─────────────────────────────────
function initHandwriting(profile) {
  hwProfile = profile || {};

  // Auto-select language script matching user preference or target language
  const target = hwProfile.targetLanguage || hwProfile.preferredLanguage || (typeof selectedLang !== "undefined" ? selectedLang : "en");
  const isValidLang = HW_LANGUAGES.some(l => l.code === target);
  hwCurrentLang = isValidLang ? target : "en";

  hwCurrentCategory = "alphabets";
  hwCurrentIndex    = 0;

  renderHandwritingUI();
}

// ── Render Studio UI inside #section-handwriting ──────────────────
function renderHandwritingUI() {
  const container = document.getElementById("section-handwriting");
  if (!container) return;

  const contentSet   = HANDWRITING_CONTENT[hwCurrentLang] || HANDWRITING_CONTENT.en;
  const currentItems = contentSet[hwCurrentCategory] || [];
  const completedList = hwProfile.handwritingProgress || [];
  const completedCount = currentItems.filter(item => completedList.includes(item.id)).length;

  const currentItem = currentItems[hwCurrentIndex] || { id: "none", display: "A" };
  const isLastItem = hwCurrentIndex >= currentItems.length - 1;
  const isFirstItem = hwCurrentIndex <= 0;

  let html = `
    <div class="hw-studio-card">
      
      <!-- Studio Header Hero -->
      <div class="hw-studio-hero">
        <div>
          <div class="hw-hero-title-row">
            <div class="hw-hero-icon">
              <i data-lucide="edit-3" style="width: 22px; height: 22px;"></i>
            </div>
            <div>
              <h2 class="hw-hero-title" data-i18n="hwTitle">${getHwText("hwTitle", "Interactive Handwriting Studio")}</h2>
            </div>
          </div>
          <p class="hw-hero-subtitle" data-i18n="hwSubtitle">${getHwText("hwSubtitle", "Trace native script characters, numbers, and vocabulary to build muscle memory.")}</p>
        </div>

        <div class="hw-progress-chip">
          <i data-lucide="sparkles" style="width: 15px; height: 15px;"></i>
          <span id="hw-progress-text">${completedCount} / ${currentItems.length} <span data-i18n="hwPracticed">${getHwText("hwPracticed", "Practiced")}</span></span>
        </div>
      </div>

      <!-- Select Practice Script (Modern Dropdown Selector) -->
      <div class="hw-script-section">
        <div class="hw-script-header">
          <div class="hw-script-title">
            <i data-lucide="globe" style="width: 14px; height: 14px; color: #6366f1;"></i>
            <span data-i18n="hwSelectScript">${getHwText("hwSelectScript", "Select Practice Script")}</span>
          </div>
          <span class="hw-script-count">7 Languages</span>
        </div>
        <div class="hw-script-dropdown-wrap">
          <select id="hw-lang-select" class="hw-lang-select" aria-label="Select Practice Script">
            ${HW_LANGUAGES.map(lang => `
              <option value="${lang.code}" ${lang.code === hwCurrentLang ? 'selected' : ''}>
                ${lang.nativeLabel} ${lang.code !== 'en' ? `(${lang.label})` : ''}
              </option>
            `).join('')}
          </select>
          <div class="hw-select-arrow">
            <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
          </div>
        </div>
      </div>

      <!-- Mode Tabs (Letters, Numbers, Words) -->
      <div class="hw-modes-container">
        <div class="hw-mode-tabs">
          ${HW_CATEGORIES.map(cat => `
            <button class="hw-mode-tab ${cat.id === hwCurrentCategory ? 'active' : ''}" 
                    data-cat="${cat.id}">
              <i data-lucide="${cat.icon}" style="width: 14px; height: 14px; flex-shrink: 0;"></i>
              <span>${getHwText(cat.i18nKey, cat.defaultLabel)}</span>
            </button>
          `).join('')}
        </div>
        <div class="hw-stroke-hint-row">
          <span data-i18n="hwStrokeHint">${getHwText("hwStrokeHint", "Follow the dotted guidelines with your finger or stylus")}</span>
        </div>
      </div>

      <!-- Main Canvas Workspace Area -->
      <div class="hw-workspace-box">
        
        <!-- Target Character Navigator -->
        <div class="hw-nav-strip">
          <button id="hw-prev-btn" class="hw-nav-circle-btn" ${isFirstItem ? 'disabled' : ''} title="${getHwText('hwPrevChar', 'Previous')}">
            <i data-lucide="chevron-left" style="width: 20px; height: 20px;"></i>
          </button>

          <div class="hw-target-center">
            <div class="hw-target-badge" id="hw-target-label">
              <span data-i18n="hwItemOf">${getHwText("hwItemOf", "Character")}</span> ${hwCurrentIndex + 1} / ${currentItems.length}
            </div>
            <button id="hw-audio-btn" class="hw-tts-circle-btn" title="${getHwText('hwListen', 'Listen & Pronounce')}">
              <i data-lucide="volume-2" style="width: 18px; height: 18px;"></i>
            </button>
          </div>

          <button id="hw-next-btn" class="hw-nav-circle-btn" ${isLastItem ? 'disabled' : ''} title="${getHwText('hwNextChar', 'Next')}">
            <i data-lucide="chevron-right" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Tracing Canvas (Square 1:1) -->
        <div class="hw-canvas-wrapper">
          <canvas id="hw-canvas" width="360" height="360"></canvas>
        </div>

        <!-- Toolbar (Thickness & Auxiliary Tools) -->
        <div class="hw-toolbar">
          
          <!-- Brush Sizes -->
          <div class="hw-sizes-group">
            <span style="font-size: 0.74rem; font-weight: 800; color: #64748b; margin-right: 0.15rem;" data-i18n="hwSize">${getHwText("hwSize", "Thickness")}:</span>
            <button class="hw-size-btn-pill" data-size="4" data-i18n="hwThin">${getHwText("hwThin", "Fine")}</button>
            <button class="hw-size-btn-pill active" data-size="8" data-i18n="hwMedium">${getHwText("hwMedium", "Med")}</button>
            <button class="hw-size-btn-pill" data-size="14" data-i18n="hwThick">${getHwText("hwThick", "Bold")}</button>
          </div>

          <!-- Auxiliary Tools (Undo, Guide, Clear) -->
          <div class="hw-aux-actions">
            <button id="hw-undo-btn" class="hw-btn-tool" title="Undo Last Stroke">
              <i data-lucide="rotate-ccw" style="width: 13px; height: 13px;"></i>
              <span>Undo</span>
            </button>
            <button id="hw-guide-btn" class="hw-btn-tool" title="Toggle Guidelines">
              <i data-lucide="eye" style="width: 13px; height: 13px;"></i>
              <span data-i18n="hwGuidelineMode">${getHwText("hwGuidelineMode", "Guide")}</span>
            </button>
            <button id="hw-clear-btn" class="hw-btn-tool hw-clear-tool" title="Clear Canvas">
              <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
              <span data-i18n="hwClear">${getHwText("hwClear", "Clear")}</span>
            </button>
          </div>

        </div>

      </div>

      <!-- Action Footer: Check Accuracy & Earn XP -->
      <div class="hw-footer-cta">
        <div id="hw-feedback-area" class="hidden hw-feedback-banner"></div>
        <button id="hw-done-btn" class="hw-check-btn">
          <i data-lucide="check-circle" style="width: 18px; height: 18px;"></i>
          <span data-i18n="hwCheck">${getHwText("hwCheck", "Check & Earn XP ⚡")}</span>
        </button>
      </div>

    </div>
  `;

  container.innerHTML = html;
  if (typeof lucide !== "undefined") lucide.createIcons();

  // Attach handlers
  setupCanvasEvents();
  setupTabEvents();
}

// ── Setup Category, Script, and Action Event Handlers ─────────────
function setupTabEvents() {
  const container = document.getElementById("section-handwriting");
  if (!container) return;

  // 1. Script selector dropdown
  const langSelect = document.getElementById("hw-lang-select");
  if (langSelect) {
    langSelect.addEventListener("change", (e) => {
      hwCurrentLang  = e.target.value;
      hwCurrentIndex = 0;
      renderHandwritingUI();
    });
  }

  // 2. Category switches
  container.querySelectorAll(".hw-mode-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      hwCurrentCategory = tab.dataset.cat;
      hwCurrentIndex    = 0;
      renderHandwritingUI();
    });
  });

  // 3. Navigation (Previous / Next)
  const prevBtn = document.getElementById("hw-prev-btn");
  const nextBtn = document.getElementById("hw-next-btn");
  const contentSet = HANDWRITING_CONTENT[hwCurrentLang] || HANDWRITING_CONTENT.en;
  const items      = contentSet[hwCurrentCategory] || [];

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (hwCurrentIndex > 0) {
        hwCurrentIndex--;
        updateCanvasTarget();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (hwCurrentIndex < items.length - 1) {
        hwCurrentIndex++;
        updateCanvasTarget();
      }
    });
  }

  // 4. Native Pronunciation Audio
  const audioBtn = document.getElementById("hw-audio-btn");
  if (audioBtn) {
    audioBtn.addEventListener("click", () => {
      const currentItem = items[hwCurrentIndex];
      if (currentItem && typeof speakText === "function") {
        audioBtn.style.transform = "scale(0.9)";
        setTimeout(() => (audioBtn.style.transform = "scale(1)"), 150);
        speakText(currentItem.display, hwCurrentLang);
      }
    });
  }

  // 5. Clear Canvas
  const clearBtn = document.getElementById("hw-clear-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      hwStrokeHistory = [];
      redrawCanvasGuide();
    });
  }

  // 6. Undo Stroke
  const undoBtn = document.getElementById("hw-undo-btn");
  if (undoBtn) {
    undoBtn.addEventListener("click", () => {
      if (hwStrokeHistory.length > 0) {
        hwStrokeHistory.pop();
        reconstructCanvasFromHistory();
      }
    });
  }

  // 7. Toggle Guidelines
  const guideBtn = document.getElementById("hw-guide-btn");
  if (guideBtn) {
    guideBtn.addEventListener("click", () => {
      hwShowGuideLines = !hwShowGuideLines;
      guideBtn.style.color = hwShowGuideLines ? "#4f46e5" : "#64748b";
      reconstructCanvasFromHistory();
    });
  }

  // 8. Brush Size Picker
  container.querySelectorAll(".hw-size-btn-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      hwPenWidth = parseInt(btn.dataset.size, 10);
      container.querySelectorAll(".hw-size-btn-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // 9. Check & Submit Practice
  const doneBtn = document.getElementById("hw-done-btn");
  if (doneBtn) {
    doneBtn.addEventListener("click", handlePracticeDone);
  }
}

// ── Setup Canvas Drawing Engine (Mouse + Touch) ───────────────────
function setupCanvasEvents() {
  hwCanvas = document.getElementById("hw-canvas");
  if (!hwCanvas) return;
  hwCtx = hwCanvas.getContext("2d");

  // Handle High-DPI Display Sharpness
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = 360;
  const displayHeight = 360;
  
  hwCanvas.width = displayWidth * dpr;
  hwCanvas.height = displayHeight * dpr;
  hwCtx.scale(dpr, dpr);

  hwStrokeHistory = [];
  redrawCanvasGuide();

  // Mouse Handlers
  hwCanvas.addEventListener("mousedown", startDrawing);
  hwCanvas.addEventListener("mousemove", draw);
  hwCanvas.addEventListener("mouseup", stopDrawing);
  hwCanvas.addEventListener("mouseleave", stopDrawing);

  // Touch Handlers
  hwCanvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    hwCanvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  hwCanvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    hwCanvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  hwCanvas.addEventListener("touchend", () => {
    const mouseEvent = new MouseEvent("mouseup", {});
    hwCanvas.dispatchEvent(mouseEvent);
  });
}

function getCanvasCoordinates(e) {
  const rect = hwCanvas.getBoundingClientRect();
  const displayWidth = 360;
  const displayHeight = 360;
  return {
    x: ((e.clientX - rect.left) / rect.width) * displayWidth,
    y: ((e.clientY - rect.top) / rect.height) * displayHeight
  };
}

let currentStroke = null;

function startDrawing(e) {
  if (hwState === "checked") {
    resetHwButton();
    const fbArea = document.getElementById("hw-feedback-area");
    if (fbArea) fbArea.classList.add("hidden");
  }

  hwIsDrawing = true;
  hwHasDrawn  = true;
  const pos = getCanvasCoordinates(e);

  currentStroke = {
    color: hwPenColor,
    width: hwPenWidth,
    points: [pos]
  };

  hwStrokePoints.push(pos);

  hwCtx.beginPath();
  hwCtx.moveTo(pos.x, pos.y);
  hwCtx.strokeStyle = hwPenColor;
  hwCtx.lineWidth   = hwPenWidth;
  hwCtx.lineCap     = "round";
  hwCtx.lineJoin    = "round";
}

function draw(e) {
  if (!hwIsDrawing || !currentStroke) return;
  const pos = getCanvasCoordinates(e);

  currentStroke.points.push(pos);
  hwStrokePoints.push(pos);

  // Smooth quadratic bezier drawing
  const points = currentStroke.points;
  if (points.length > 2) {
    const p1 = points[points.length - 2];
    const p2 = points[points.length - 1];
    const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

    hwCtx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
    hwCtx.stroke();
  } else {
    hwCtx.lineTo(pos.x, pos.y);
    hwCtx.stroke();
  }
}

function stopDrawing() {
  if (hwIsDrawing) {
    hwCtx.closePath();
    hwIsDrawing = false;
    if (currentStroke && currentStroke.points.length > 0) {
      hwStrokeHistory.push(currentStroke);
    }
    currentStroke = null;
  }
}

// ── Redraw Guide Text on Canvas ───────────────────────────────────
function redrawCanvasGuide() {
  if (!hwCanvas || !hwCtx) return;

  const displayWidth = 360;
  const displayHeight = 360;

  // Clear canvas
  hwCtx.clearRect(0, 0, displayWidth, displayHeight);
  hwHasDrawn = false;
  hwStrokePoints = [];

  const contentSet  = HANDWRITING_CONTENT[hwCurrentLang] || HANDWRITING_CONTENT.en;
  const items       = contentSet[hwCurrentCategory] || [];
  const currentItem = items[hwCurrentIndex];

  if (!currentItem) return;

  if (hwShowGuideLines) {
    // Calligraphy guidelines
    hwCtx.strokeStyle = "#e2e8f0";
    hwCtx.lineWidth   = 1.5;
    hwCtx.setLineDash([6, 6]);

    // Top guide line
    hwCtx.beginPath();
    hwCtx.moveTo(20, 75);
    hwCtx.lineTo(displayWidth - 20, 75);
    hwCtx.stroke();

    // Middle horizontal guideline
    hwCtx.beginPath();
    hwCtx.moveTo(20, displayHeight / 2);
    hwCtx.lineTo(displayWidth - 20, displayHeight / 2);
    hwCtx.stroke();

    // Baseline guide line
    hwCtx.beginPath();
    hwCtx.moveTo(20, displayHeight - 75);
    hwCtx.lineTo(displayWidth - 20, displayHeight - 75);
    hwCtx.stroke();

    hwCtx.setLineDash([]); // Reset dash

    // Draw faint guide character in background
    const text = currentItem.display;
    hwCtx.fillStyle    = "rgba(203, 213, 225, 0.4)"; // Soft light slate
    hwCtx.textAlign    = "center";
    hwCtx.textBaseline = "middle";

    let fontSize = 150;
    if (text.length > 2) fontSize = 100;
    if (text.length > 4) fontSize = 70;
    if (text.length > 7) fontSize = 48;

    hwCtx.font = `bold ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
    hwCtx.fillText(text, displayWidth / 2, displayHeight / 2 + 5);
  }
}

// ── Reconstruct Canvas after Undo or Guide Toggle ─────────────────
function reconstructCanvasFromHistory() {
  redrawCanvasGuide();
  hwStrokePoints = [];

  if (hwStrokeHistory.length === 0) {
    hwHasDrawn = false;
    return;
  }

  hwHasDrawn = true;
  hwStrokeHistory.forEach(stroke => {
    if (stroke.points.length < 1) return;
    hwCtx.beginPath();
    hwCtx.strokeStyle = stroke.color;
    hwCtx.lineWidth   = stroke.width;
    hwCtx.lineCap     = "round";
    hwCtx.lineJoin    = "round";

    hwCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
    hwStrokePoints.push(stroke.points[0]);

    for (let i = 1; i < stroke.points.length; i++) {
      const pt = stroke.points[i];
      hwStrokePoints.push(pt);
      hwCtx.lineTo(pt.x, pt.y);
    }
    hwCtx.stroke();
    hwCtx.closePath();
  });
}

// ── Reset Practice Button back to Ready State ─────────────────────
function resetHwButton() {
  hwState = "ready";
  const doneBtn = document.getElementById("hw-done-btn");
  if (doneBtn) {
    doneBtn.style.background = "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)";
    doneBtn.style.boxShadow = "0 10px 24px rgba(99, 102, 241, 0.35)";
    doneBtn.innerHTML = `
      <i data-lucide="check-circle" style="width: 18px; height: 18px;"></i>
      <span data-i18n="hwCheck">${getHwText("hwCheck", "Check & Earn XP ⚡")}</span>
    `;
    if (typeof lucide !== "undefined") lucide.createIcons();
  }
}

// ── Update Canvas for New Target Character ────────────────────────
function updateCanvasTarget() {
  const contentSet = HANDWRITING_CONTENT[hwCurrentLang] || HANDWRITING_CONTENT.en;
  const items      = contentSet[hwCurrentCategory] || [];
  const label      = document.getElementById("hw-target-label");
  const prevBtn    = document.getElementById("hw-prev-btn");
  const nextBtn    = document.getElementById("hw-next-btn");

  if (label) {
    label.innerHTML = `<span data-i18n="hwItemOf">${getHwText("hwItemOf", "Character")}</span> ${hwCurrentIndex + 1} / ${items.length}`;
  }

  if (prevBtn) prevBtn.disabled = hwCurrentIndex <= 0;
  if (nextBtn) nextBtn.disabled = hwCurrentIndex >= items.length - 1;

  // Hide & reset feedback area
  const fb = document.getElementById("hw-feedback-area");
  if (fb) {
    fb.innerHTML = "";
    fb.classList.add("hidden");
  }

  hwStrokeHistory = [];
  resetHwButton();
  redrawCanvasGuide();
}

// ── Evaluate Canvas Drawing Accuracy ──────────────────────────────
function evaluateHandwritingCanvas(targetText) {
  if (!hwCanvas || !hwCtx || !hwHasDrawn || !hwStrokePoints || hwStrokePoints.length < 5) {
    return { success: false, score: 0, reason: "empty" };
  }

  const width = 360;
  const height = 360;

  // 1. Render target guide text on offscreen canvas
  const guideCanvas = document.createElement("canvas");
  guideCanvas.width = width;
  guideCanvas.height = height;
  const gCtx = guideCanvas.getContext("2d");

  gCtx.fillStyle = "#ffffff";
  gCtx.fillRect(0, 0, width, height);

  gCtx.fillStyle = "#000000";
  gCtx.textAlign = "center";
  gCtx.textBaseline = "middle";

  let fontSize = 150;
  if (targetText.length > 2) fontSize = 100;
  if (targetText.length > 4) fontSize = 70;
  if (targetText.length > 7) fontSize = 48;

  gCtx.font = `bold ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
  gCtx.fillText(targetText, width / 2, height / 2 + 5);

  const guideData = gCtx.getImageData(0, 0, width, height).data;

  // 2. Check user stroke points against ground truth guideData
  const radius = 22; // 22px tolerance radius around target text strokes
  let hitCount = 0;

  for (let i = 0; i < hwStrokePoints.length; i++) {
    const pt = hwStrokePoints[i];
    const px = Math.round(pt.x);
    const py = Math.round(pt.y);

    let isNear = false;
    const minY = Math.max(0, py - radius);
    const maxY = Math.min(height - 1, py + radius);
    const minX = Math.max(0, px - radius);
    const maxX = Math.min(width - 1, px + radius);

    // Search bounding box for black target text pixel (< 128)
    for (let y = minY; y <= maxY; y += 3) {
      for (let x = minX; x <= maxX; x += 3) {
        const idx = (y * width + x) * 4;
        if (guideData[idx] < 128) {
          isNear = true;
          break;
        }
      }
      if (isNear) break;
    }

    if (isNear) hitCount++;
  }

  const accuracyRatio = hitCount / hwStrokePoints.length;
  const finalScore = Math.round(accuracyRatio * 100);
  const isSuccess = finalScore >= 30;

  return {
    success: isSuccess,
    score: finalScore,
    reason: isSuccess ? "ok" : "incorrect"
  };
}

// ── Handle Practice Completion ────────────────────────────────────
async function handlePracticeDone() {
  const contentSet  = HANDWRITING_CONTENT[hwCurrentLang] || HANDWRITING_CONTENT.en;
  const items       = contentSet[hwCurrentCategory] || [];
  const currentItem = items[hwCurrentIndex];

  if (!currentItem) return;

  // If already in "checked" state, clicking button advances to next letter cleanly!
  if (hwState === "checked") {
    if (hwCurrentIndex < items.length - 1) {
      hwCurrentIndex++;
    } else {
      hwCurrentIndex = 0; // Loop back or restart category
    }
    resetHwButton();
    updateCanvasTarget();
    return;
  }

  const fbArea = document.getElementById("hw-feedback-area");
  if (!fbArea) return;

  const evaluation = evaluateHandwritingCanvas(currentItem.display);

  if (evaluation.reason === "empty") {
    fbArea.classList.remove("hidden");
    fbArea.style.background = "#fffbe8";
    fbArea.style.border = "1.5px solid #f59e0b";
    fbArea.style.color = "#92400e";
    fbArea.innerHTML = `⚠️ ${getHwText("hwStrokeHint", "Please trace or write the character on the canvas first!")}`;
    return;
  }

  if (!evaluation.success) {
    fbArea.classList.remove("hidden");
    fbArea.style.background = "#fef2f2";
    fbArea.style.border = "1.5px solid #ef4444";
    fbArea.style.color = "#991b1b";
    fbArea.innerHTML = `❌ Trace closer to the outline (${evaluation.score}% match). Try again!`;
    return;
  }

  // Success!
  fbArea.classList.remove("hidden");
  fbArea.style.background = "#ecfdf5";
  fbArea.style.border = "1.5px solid #10b981";
  fbArea.style.color = "#065f46";
  fbArea.innerHTML = `${getHwText("hwFeedbackSuccess", "🎉 Beautiful stroke! +15 XP earned!")} (${evaluation.score}% accuracy)`;

  // Trigger celebration confetti
  if (typeof showCelebrationParticles === "function") {
    showCelebrationParticles();
  }

  const user = auth.currentUser;
  if (user) {
    if (typeof addXP === "function") await addXP(user.uid, 15);

    const completedList = hwProfile.handwritingProgress || [];
    if (!completedList.includes(currentItem.id)) {
      completedList.push(currentItem.id);
      hwProfile.handwritingProgress = completedList;

      try {
        await db.collection("users").doc(user.uid).update({
          handwritingProgress: firebase.firestore.FieldValue.arrayUnion(currentItem.id)
        });
      } catch (err) {
        console.warn("[handwriting.js] Could not update handwritingProgress:", err);
      }
    }

    const completedCount = items.filter(item => completedList.includes(item.id)).length;
    const progressEl = document.getElementById("hw-progress-text");
    if (progressEl) {
      progressEl.innerHTML = `${completedCount} / ${items.length} <span data-i18n="hwPracticed">${getHwText("hwPracticed", "Practiced")}</span>`;
    }
  }

  // Switch button state to "checked" -> Next Character ➔ (NO auto-advance timeout!)
  hwState = "checked";
  const doneBtn = document.getElementById("hw-done-btn");
  if (doneBtn) {
    if (hwCurrentIndex < items.length - 1) {
      doneBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      doneBtn.style.boxShadow = "0 10px 24px rgba(16, 185, 129, 0.35)";
      doneBtn.innerHTML = `
        <span>${getHwText("hwNextLetter", "Next Character ➔")}</span>
        <i data-lucide="arrow-right" style="width: 20px; height: 20px;"></i>
      `;
    } else {
      doneBtn.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
      doneBtn.style.boxShadow = "0 10px 24px rgba(245, 158, 11, 0.35)";
      doneBtn.innerHTML = `
        <span>Practice Again 🔄</span>
        <i data-lucide="rotate-ccw" style="width: 20px; height: 20px;"></i>
      `;
    }
    if (typeof lucide !== "undefined") lucide.createIcons();
  }
}
