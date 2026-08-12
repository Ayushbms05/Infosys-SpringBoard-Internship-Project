/**
 * handwriting.js — Handwriting & Tracing Practice Engine
 *
 * ═══════════════════════════════════════════════════════════════════
 * ISOLATION CONTRACT:
 *   ❌  Does NOT call lesson.js, units.js, or generateExercises()
 *   ❌  Does NOT read or write sharedLessonContent or levels/ Firestore paths
 *   ❌  Does NOT use Gemini API
 *   ✅  Reads from HANDWRITING_CONTENT (handwriting-content.js)
 *   ✅  Saves progress in profile.handwritingProgress (array of completed IDs)
 *   ✅  Awards XP via addXP(uid, 5) from auth.js
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
let hwPenColor          = "#6c63ff"; // primary indigo
let hwPenWidth          = 6;
let hwStrokePoints      = [];

// ── Category Labels ───────────────────────────────────────────────
const HW_CATEGORY_LABELS = {
  en: { alphabets: "Letters", numbers: "Numbers", commonWords: "Words" },
  hi: { alphabets: "वर्णमाला", numbers: "संख्याएँ", commonWords: "शब्द" }
};

// ── Initialise Handwriting Feature ────────────────────────────────
function initHandwriting(profile) {
  hwProfile = profile || {};
  
  // Select language set: if user is learning/knows Hindi, default to Hindi set, else English
  const targetLang = hwProfile.targetLanguage || "en";
  const knownLang  = hwProfile.preferredLanguage || "en";
  hwCurrentLang    = (targetLang === "hi" || knownLang === "hi") ? "hi" : "en";

  hwCurrentCategory = "alphabets";
  hwCurrentIndex    = 0;

  renderHandwritingUI();
}

// ── Render Main UI Scaffolding inside #section-handwriting ───────
function renderHandwritingUI() {
  const container = document.getElementById("section-handwriting");
  if (!container) return;

  const contentSet = HANDWRITING_CONTENT[hwCurrentLang] || HANDWRITING_CONTENT.en;
  const categories = Object.keys(contentSet);
  const labels     = HW_CATEGORY_LABELS[hwCurrentLang] || HW_CATEGORY_LABELS.en;

  const completedList = hwProfile.handwritingProgress || [];
  const currentItems  = contentSet[hwCurrentCategory] || [];
  const completedCount = currentItems.filter(item => completedList.includes(item.id)).length;

  html = `
    <div class="dash-card handwriting-card" style="max-width: 800px; margin: 0 auto; padding: 2rem;">
      <!-- Header -->
      <div class="dash-card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
        <div>
          <h3 class="dash-card-title" style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="dash-card-title-icon"><i data-lucide="edit-3"></i></span>
            <span>Handwriting Practice</span>
          </h3>
          <p class="dash-card-subtitle" style="margin-top: 0.25rem;">
            Trace characters and words on screen to build writing muscle memory
          </p>
        </div>
        <div class="hw-progress-badge" style="background: var(--color-bg-surface); border: 1px solid var(--color-border); padding: 0.5rem 1rem; border-radius: 20px; font-weight: 700; font-size: 0.9rem; color: var(--color-primary);">
          ✨ <span id="hw-progress-text">${completedCount} / ${currentItems.length} Practiced</span>
        </div>
      </div>

      <!-- Language & Category Switcher Tabs -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
        <div class="hw-category-tabs" style="display: flex; gap: 0.5rem; background: var(--color-bg-surface); padding: 0.4rem; border-radius: 12px; border: 1px solid var(--color-border);">
          ${categories.map(cat => `
            <button class="hw-cat-tab ${cat === hwCurrentCategory ? 'active' : ''}" 
                    data-cat="${cat}" 
                    style="padding: 0.5rem 1rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; background: ${cat === hwCurrentCategory ? 'var(--color-primary)' : 'transparent'}; color: ${cat === hwCurrentCategory ? 'white' : 'var(--color-text-secondary)'};">
              ${labels[cat] || cat}
            </button>
          `).join('')}
        </div>

        <!-- Language toggle for script -->
        <div style="display: flex; gap: 0.5rem;">
          <button id="hw-lang-en" class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; font-weight: ${hwCurrentLang==='en'?'800':'400'}; ${hwCurrentLang==='en'?'border-color:var(--color-primary);color:var(--color-primary);':''}">English</button>
          <button id="hw-lang-hi" class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; font-weight: ${hwCurrentLang==='hi'?'800':'400'}; ${hwCurrentLang==='hi'?'border-color:var(--color-primary);color:var(--color-primary);':''}">हिंदी (Hindi)</button>
        </div>
      </div>

      <!-- Main Canvas Card Workspace -->
      <div style="background: var(--color-bg-surface); border: 2px dashed var(--color-border); border-radius: 16px; padding: 1.5rem; text-align: center; position: relative; margin-bottom: 1.5rem;">
        
        <!-- Navigation Bar for Targets -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <button id="hw-prev-btn" class="btn-secondary" style="border-radius: 50%; width: 42px; height: 42px; padding: 0; display: flex; align-items: center; justify-content: center;">←</button>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span id="hw-target-label" style="font-weight: 800; font-size: 1.1rem; color: var(--color-text-primary);">Item 1 of ${currentItems.length}</span>
            <button id="hw-audio-btn" style="background: transparent; border: none; font-size: 1.4rem; cursor: pointer;" title="Listen">🔊</button>
          </div>
          <button id="hw-next-btn" class="btn-secondary" style="border-radius: 50%; width: 42px; height: 42px; padding: 0; display: flex; align-items: center; justify-content: center;">→</button>
        </div>

        <!-- HTML5 Canvas Container -->
        <div style="position: relative; width: 100%; max-width: 450px; height: 300px; margin: 0 auto; background: var(--color-surface, #ffffff); border-radius: 12px; box-shadow: var(--shadow-card); overflow: hidden; touch-action: none;">
          <canvas id="hw-canvas" width="450" height="300" style="width: 100%; height: 100%; cursor: crosshair; display: block;"></canvas>
        </div>

        <!-- Controls Toolbar (Color, Thickness, Clear) -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-top: 1.25rem; padding: 0 0.5rem;">
          
          <!-- Color palette -->
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-muted);">Color:</span>
            <button class="hw-color-btn" data-color="#6c63ff" style="width: 24px; height: 24px; border-radius: 50%; background: #6c63ff; border: 2px solid white; outline: 2px solid #6c63ff; cursor: pointer;"></button>
            <button class="hw-color-btn" data-color="#00d4aa" style="width: 24px; height: 24px; border-radius: 50%; background: #00d4aa; border: 2px solid white; cursor: pointer;"></button>
            <button class="hw-color-btn" data-color="#ff6b6b" style="width: 24px; height: 24px; border-radius: 50%; background: #ff6b6b; border: 2px solid white; cursor: pointer;"></button>
            <button class="hw-color-btn" data-color="#2b2d42" style="width: 24px; height: 24px; border-radius: 50%; background: #2b2d42; border: 2px solid white; cursor: pointer;"></button>
          </div>

          <!-- Line Thickness -->
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-muted);">Size:</span>
            <button class="hw-size-btn" data-size="4" style="padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid var(--color-border); background: white; font-weight: 700; cursor: pointer;">Thin</button>
            <button class="hw-size-btn active" data-size="7" style="padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid var(--color-primary); background: var(--color-primary); color: white; font-weight: 700; cursor: pointer;">Medium</button>
            <button class="hw-size-btn" data-size="12" style="padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid var(--color-border); background: white; font-weight: 700; cursor: pointer;">Thick</button>
          </div>

          <!-- Clear Canvas Button -->
          <button id="hw-clear-btn" class="btn-secondary" style="padding: 0.4rem 1rem; font-weight: 700;">
            🗑️ Clear
          </button>
        </div>

      </div>

      <!-- Action Footer: Check / Submit Practice -->
      <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
        <div id="hw-feedback-area" class="hidden" style="padding: 0.75rem 1.5rem; border-radius: 12px; background: rgba(0, 212, 170, 0.15); border: 1px solid #00d4aa; color: #00876c; font-weight: 800; font-size: 1.1rem; width: 100%; max-width: 450px;">
          🎉 Great practice! +5 XP earned!
        </div>
        <button id="hw-done-btn" class="btn-primary" style="padding: 0.8rem 2.5rem; font-size: 1.1rem; width: 100%; max-width: 320px;">
          Check & Earn XP ⚡
        </button>
      </div>

    </div>
  `;

  container.innerHTML = html;
  if (typeof lucide !== "undefined") lucide.createIcons();

  // Attach event handlers
  setupCanvasEvents();
  setupTabEvents();
}

// ── Setup Category Tabs and Language Toggles ─────────────────────
function setupTabEvents() {
  const container = document.getElementById("section-handwriting");
  if (!container) return;

  // Category switches
  container.querySelectorAll(".hw-cat-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      hwCurrentCategory = tab.dataset.cat;
      hwCurrentIndex    = 0;
      renderHandwritingUI();
    });
  });

  // Language toggles
  const langEn = document.getElementById("hw-lang-en");
  const langHi = document.getElementById("hw-lang-hi");
  if (langEn) {
    langEn.addEventListener("click", () => {
      hwCurrentLang    = "en";
      hwCurrentIndex   = 0;
      renderHandwritingUI();
    });
  }
  if (langHi) {
    langHi.addEventListener("click", () => {
      hwCurrentLang    = "hi";
      hwCurrentIndex   = 0;
      renderHandwritingUI();
    });
  }

  // Prev / Next target buttons
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

  // Audio button
  const audioBtn = document.getElementById("hw-audio-btn");
  if (audioBtn) {
    audioBtn.addEventListener("click", () => {
      const currentItem = items[hwCurrentIndex];
      if (currentItem && typeof speakText === "function") {
        speakText(currentItem.display, hwCurrentLang);
      }
    });
  }

  // Clear button
  const clearBtn = document.getElementById("hw-clear-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      redrawCanvasGuide();
    });
  }

  // Color picker buttons
  container.querySelectorAll(".hw-color-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      hwPenColor = btn.dataset.color;
      container.querySelectorAll(".hw-color-btn").forEach(b => b.style.outline = "none");
      btn.style.outline = `2px solid ${hwPenColor}`;
    });
  });

  // Size picker buttons
  container.querySelectorAll(".hw-size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      hwPenWidth = parseInt(btn.dataset.size, 10);
      container.querySelectorAll(".hw-size-btn").forEach(b => {
        b.classList.remove("active");
        b.style.background = "white";
        b.style.color = "black";
        b.style.borderColor = "var(--color-border)";
      });
      btn.classList.add("active");
      btn.style.background = "var(--color-primary)";
      btn.style.color = "white";
      btn.style.borderColor = "var(--color-primary)";
    });
  });

  // Done / Check practice button
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

  // Redraw faint guide text in background
  redrawCanvasGuide();

  // Mouse event listeners
  hwCanvas.addEventListener("mousedown", startDrawing);
  hwCanvas.addEventListener("mousemove", draw);
  hwCanvas.addEventListener("mouseup", stopDrawing);
  hwCanvas.addEventListener("mouseleave", stopDrawing);

  // Touch event listeners
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

  hwCanvas.addEventListener("touchend", (e) => {
    const mouseEvent = new MouseEvent("mouseup", {});
    hwCanvas.dispatchEvent(mouseEvent);
  });
}

function getCanvasCoordinates(e) {
  const rect = hwCanvas.getBoundingClientRect();
  const scaleX = hwCanvas.width / rect.width;
  const scaleY = hwCanvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function startDrawing(e) {
  hwIsDrawing = true;
  hwHasDrawn  = true;
  const pos = getCanvasCoordinates(e);
  hwStrokePoints.push({ x: pos.x, y: pos.y });

  hwCtx.beginPath();
  hwCtx.moveTo(pos.x, pos.y);
  hwCtx.strokeStyle = hwPenColor;
  hwCtx.lineWidth   = hwPenWidth;
  hwCtx.lineCap     = "round";
  hwCtx.lineJoin    = "round";
}

function draw(e) {
  if (!hwIsDrawing) return;
  const pos = getCanvasCoordinates(e);
  hwStrokePoints.push({ x: pos.x, y: pos.y });

  hwCtx.lineTo(pos.x, pos.y);
  hwCtx.stroke();
}

function stopDrawing() {
  if (hwIsDrawing) {
    hwCtx.closePath();
    hwIsDrawing = false;
  }
}

// ── Redraw Guide Text on Canvas ───────────────────────────────────
function redrawCanvasGuide() {
  if (!hwCanvas || !hwCtx) return;

  // Clear canvas
  hwCtx.clearRect(0, 0, hwCanvas.width, hwCanvas.height);
  hwHasDrawn = false;
  hwStrokePoints = [];

  const contentSet  = HANDWRITING_CONTENT[hwCurrentLang] || HANDWRITING_CONTENT.en;
  const items       = contentSet[hwCurrentCategory] || [];
  const currentItem = items[hwCurrentIndex];

  if (!currentItem) return;

  // Draw faint guidelines (baseline & middle line)
  hwCtx.strokeStyle = "#e2e8f0";
  hwCtx.lineWidth   = 1;
  hwCtx.setLineDash([6, 6]);

  // Middle horizontal line
  hwCtx.beginPath();
  hwCtx.moveTo(20, hwCanvas.height / 2);
  hwCtx.lineTo(hwCanvas.width - 20, hwCanvas.height / 2);
  hwCtx.stroke();

  hwCtx.setLineDash([]); // reset line dash

  // Draw faint guide character in background
  const text = currentItem.display;
  hwCtx.fillStyle    = "rgba(203, 213, 225, 0.45)"; // soft light gray
  hwCtx.textAlign    = "center";
  hwCtx.textBaseline = "middle";

  // Dynamic font sizing based on length
  let fontSize = 160;
  if (text.length > 3) fontSize = 90;
  if (text.length > 6) fontSize = 65;

  hwCtx.font = `bold ${fontSize}px sans-serif`;
  hwCtx.fillText(text, hwCanvas.width / 2, hwCanvas.height / 2 + 10);
}

// ── Update Canvas for New Target ──────────────────────────────────
function updateCanvasTarget() {
  const contentSet = HANDWRITING_CONTENT[hwCurrentLang] || HANDWRITING_CONTENT.en;
  const items      = contentSet[hwCurrentCategory] || [];
  const label      = document.getElementById("hw-target-label");

  if (label) {
    label.textContent = `Item ${hwCurrentIndex + 1} of ${items.length}`;
  }

  // Hide feedback area when changing target
  const fb = document.getElementById("hw-feedback-area");
  if (fb) fb.classList.add("hidden");

  redrawCanvasGuide();
}

// ── Evaluate Canvas Drawing Accuracy ──────────────────────────────
function evaluateHandwritingCanvas(targetText) {
  if (!hwCanvas || !hwCtx || !hwHasDrawn || !hwStrokePoints || hwStrokePoints.length < 5) {
    return { success: false, score: 0, reason: "empty" };
  }

  const width = hwCanvas.width;
  const height = hwCanvas.height;

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

  let fontSize = 160;
  if (targetText.length > 3) fontSize = 90;
  if (targetText.length > 6) fontSize = 65;

  gCtx.font = `bold ${fontSize}px sans-serif`;
  gCtx.fillText(targetText, width / 2, height / 2 + 10);

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

    // Search 22px bounding box around point for black target text pixel (<128)
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

    if (isNear) {
      hitCount++;
    }
  }

  const accuracyRatio = hitCount / hwStrokePoints.length;
  const finalScore = Math.round(accuracyRatio * 100);

  const isSuccess = finalScore >= 35;
  return {
    success: isSuccess,
    score: finalScore,
    reason: isSuccess ? "ok" : "incorrect"
  };
}

// ── Handle Practice Completion (Evaluates Canvas Accuracy) ───────
async function handlePracticeDone() {
  const contentSet  = HANDWRITING_CONTENT[hwCurrentLang] || HANDWRITING_CONTENT.en;
  const items       = contentSet[hwCurrentCategory] || [];
  const currentItem = items[hwCurrentIndex];

  if (!currentItem) return;

  const fbArea = document.getElementById("hw-feedback-area");
  if (!fbArea) return;

  const evaluation = evaluateHandwritingCanvas(currentItem.display);

  if (evaluation.reason === "empty") {
    fbArea.className = "";
    fbArea.style.cssText = "padding: 0.75rem 1.5rem; border-radius: 12px; background: #fffbe8; border: 1.5px solid #f59e0b; color: #92400e; font-weight: 800; font-size: 1.05rem; width: 100%; max-width: 450px;";
    fbArea.innerHTML = "⚠️ Please trace or write the character on the canvas first!";
    return;
  }

  if (!evaluation.success) {
    fbArea.className = "";
    fbArea.style.cssText = "padding: 0.75rem 1.5rem; border-radius: 12px; background: #fef2f2; border: 1.5px solid #ef4444; color: #991b1b; font-weight: 800; font-size: 1.05rem; width: 100%; max-width: 450px;";
    fbArea.innerHTML = `❌ Handwriting does not match (${evaluation.score}% match). Please trace closer to the character!`;
    return;
  }

  // Success!
  fbArea.className = "";
  fbArea.style.cssText = "padding: 0.75rem 1.5rem; border-radius: 12px; background: #ecfdf5; border: 1.5px solid #10b981; color: #065f46; font-weight: 800; font-size: 1.05rem; width: 100%; max-width: 450px;";
  fbArea.innerHTML = `🎉 Great writing! Accurate match (${evaluation.score}% match). +5 XP!`;

  const user = auth.currentUser;
  if (user) {
    if (typeof addXP === "function") await addXP(user.uid, 5);

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
      progressEl.textContent = `${completedCount} / ${items.length} Practiced`;
    }
  }

  setTimeout(() => {
    if (hwCurrentIndex < items.length - 1) {
      hwCurrentIndex++;
      updateCanvasTarget();
    }
  }, 1600);
}
