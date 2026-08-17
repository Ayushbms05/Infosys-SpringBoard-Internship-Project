/**
 * chat.js — Multilingual Real-World Interactive Chat Simulator
 *
 * Teaches target language conversational literacy across 6 real-world scenarios:
 * 1. 🏦 Bank Alert & OTP Security (5 turns)
 * 2. 🏥 Doctor Clinic Appointment (5 turns)
 * 3. 🏢 Ration & Civic Helpdesk (5 turns)
 * 4. 📱 Mobile Recharge & UPI (4 turns)
 * 5. 🚆 Bus & Train Travel Enquiry (5 turns)
 * 6. 💼 Workplace Shift & Leave Request (4 turns)
 *
 * Features:
 * - 100% Option-based dialogue (No free typing).
 * - Target language teaching with preferred language scaffolding.
 * - 🔊 Native TTS audio playback for all incoming messages & options.
 * - Instant 💡 Coach Tip on wrong replies explaining the mistake constructively.
 * - Real-time XP & Coin rewards (+10 XP / +5 Coins per correct turn, +30 XP bonus on win).
 */

window.ChatSimulator = (function () {
  // ─── Private State ──────────────────────────────────────────
  let currentScenario = null;
  let currentTurnIndex = 0;
  let userProfile = null;
  let totalXPEarned = 0;
  let totalCoinsEarned = 0;
  let chatInitialized = false;

  // ─── Scenario Keys ──────────────────────────────────────────
  const SCENARIO_KEYS = ["banking", "clinic", "gov_services", "recharge", "transport", "workplace"];

  // ─── Public: Init ───────────────────────────────────────────
  function init(profile) {
    userProfile = profile || userProfile;
    if (chatInitialized) {
      renderScenarioMenu();
      return;
    }
    chatInitialized = true;

    renderScenarioMenu();

    // Back / Play Again buttons
    const backBtn = document.getElementById("chat-back-btn");
    if (backBtn) backBtn.onclick = resetToScenarioScreen;

    const playAgainBtn = document.getElementById("chat-play-again-btn");
    if (playAgainBtn) playAgainBtn.onclick = resetToScenarioScreen;
  }

  // ─── Render Scenario Grid Menu ──────────────────────────────
  function renderScenarioMenu() {
    const grid = document.getElementById("scenario-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const tLang = userProfile?.targetLanguage || userProfile?.preferredLanguage || selectedLang || "hi";
    const pLang = userProfile?.preferredLanguage || selectedLang || "en";

    SCENARIO_KEYS.forEach(key => {
      const scenario = typeof getChatScenario === "function"
        ? getChatScenario(key, tLang, pLang)
        : null;

      if (!scenario) return;

      const card = document.createElement("div");
      card.className = "scenario-card";

      card.innerHTML = `
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <div style="width: 50px; height: 50px; border-radius: 16px; background: #eef2ff; border: 1px solid #e0e7ff; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);">
              ${scenario.icon}
            </div>
            <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; background: #f8fafc; color: #475569; padding: 0.35rem 0.75rem; border-radius: 9999px; border: 1.5px solid #e2e8f0;">
              ${scenario.category}
            </span>
          </div>

          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 0.45rem 0; line-height: 1.35;">
            ${scenario.title}
          </h3>

          <p style="margin: 0; color: #64748b; font-size: 0.9rem; font-weight: 600; line-height: 1.5;">
            ${scenario.desc}
          </p>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 1.25rem; padding-top: 0.85rem; border-top: 1.5px dashed #e2e8f0; font-size: 0.82rem; font-weight: 800; color: #6366f1;">
          <span style="display: flex; align-items: center; gap: 0.35rem;">
            <i data-lucide="message-square" style="width: 15px; height: 15px;"></i>
            <span>${scenario.turnsCount} Turns</span>
          </span>
          <span style="display: flex; align-items: center; gap: 0.35rem; color: #d97706; background: #fffbeb; padding: 0.2rem 0.6rem; border-radius: 8px; border: 1px solid #fef3c7;">
            <i data-lucide="zap" style="width: 14px; height: 14px;"></i>
            <span>+${scenario.turnsCount * 10 + 30} XP</span>
          </span>
        </div>
      `;

      card.onclick = () => startScenario(key);
      grid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  // ─── Start Scenario ─────────────────────────────────────────
  function startScenario(scenarioKey) {
    const tLang = userProfile?.targetLanguage || userProfile?.preferredLanguage || selectedLang || "hi";
    const pLang = userProfile?.preferredLanguage || selectedLang || "en";

    currentScenario = typeof getChatScenario === "function"
      ? getChatScenario(scenarioKey, tLang, pLang)
      : null;

    if (!currentScenario) return;

    currentTurnIndex = 0;
    totalXPEarned = 0;
    totalCoinsEarned = 0;

    document.getElementById("chat-scenario-screen").classList.add("hidden");
    const phoneEl = document.getElementById("chat-phone");
    phoneEl.classList.remove("hidden");

    // Header contact info
    document.getElementById("contact-name").textContent = currentScenario.contactName;
    const contactRoleEl = document.querySelector(".contact-info p");
    if (contactRoleEl) {
      contactRoleEl.textContent = currentScenario.contactRole || "Online";
    }

    const contactIconEl = document.getElementById("contact-icon");
    if (contactIconEl) contactIconEl.innerHTML = `<span style="font-size: 1.5rem;">${currentScenario.icon}</span>`;

    // Task Banner
    const taskBanner = document.getElementById("task-banner");
    const taskText = document.getElementById("task-text");
    if (taskText) taskText.textContent = currentScenario.task;

    // Clear previous chat bubbles
    const chatBody = document.getElementById("chat-body");
    chatBody.querySelectorAll(".bubble, .reward-toast, .chat-coach-tip, [style*='align-self: center']").forEach(el => el.remove());

    // Hide any success overlay
    document.getElementById("success-overlay").classList.add("hidden");

    if (window.lucide) lucide.createIcons();

    // Start Turn 0
    executeTurn();
  }

  // ─── Reset / Return to Grid ─────────────────────────────────
  function resetToScenarioScreen() {
    const phoneEl = document.getElementById("chat-phone");
    const scenarioScreen = document.getElementById("chat-scenario-screen");
    const successOverlay = document.getElementById("success-overlay");

    if (phoneEl) phoneEl.classList.add("hidden");
    if (successOverlay) successOverlay.classList.add("hidden");
    if (scenarioScreen) scenarioScreen.classList.remove("hidden");

    const chatBody = document.getElementById("chat-body");
    if (chatBody) {
      chatBody.querySelectorAll(".bubble, .reward-toast, .chat-coach-tip, [style*='align-self: center']").forEach(el => el.remove());
    }

    const footerOptions = document.getElementById("chat-footer");
    if (footerOptions) footerOptions.classList.add("hidden");

    const footerTyping = document.getElementById("chat-footer-typing");
    if (footerTyping) footerTyping.classList.add("hidden");

    renderScenarioMenu();
  }

  // ─── Execute Current Turn ───────────────────────────────────
  function executeTurn() {
    if (!currentScenario || currentTurnIndex >= currentScenario.turns.length) {
      handleWin();
      return;
    }

    const typing = document.getElementById("typing-indicator");
    const chatBody = document.getElementById("chat-body");
    const footerOptions = document.getElementById("chat-footer");
    const optionsContainer = document.getElementById("options-container");

    footerOptions.classList.add("hidden");
    typing.classList.remove("hidden");
    chatBody.scrollTop = chatBody.scrollHeight;

    const turnData = currentScenario.turns[currentTurnIndex];
    const tLang = userProfile?.targetLanguage || userProfile?.preferredLanguage || selectedLang || "hi";

    setTimeout(() => {
      typing.classList.add("hidden");

      // Append incoming message
      appendIncomingMessage(turnData.incoming, turnData.incomingTranslation, tLang);

      // Render 3 Option Buttons
      optionsContainer.innerHTML = "";
      const letters = ["A", "B", "C", "D"];

      turnData.options.forEach((optText, idx) => {
        const optTranslation = (turnData.optionsTranslations && turnData.optionsTranslations[idx]) || "";

        const btn = document.createElement("button");
        btn.className = "chat-option-btn";
        btn.type = "button";
        btn.style.cssText = "display: flex; align-items: flex-start; gap: 0.75rem; width: 100%; text-align: left; margin-bottom: 0.65rem; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 0.85rem 1rem; background: #ffffff; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.02);";

        btn.innerHTML = `
          <div style="width: 28px; height: 28px; border-radius: 8px; background: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.85rem; flex-shrink: 0; margin-top: 0.1rem;">
            ${letters[idx] || idx + 1}
          </div>
          <div style="flex: 1;">
            <div style="font-size: 0.95rem; font-weight: 700; color: #1e293b; line-height: 1.4;">${optText}</div>
            ${optTranslation ? `<div style="font-size: 0.8rem; font-weight: 600; color: #64748b; margin-top: 0.2rem;">${optTranslation}</div>` : ""}
          </div>
          <button type="button" class="opt-tts-btn" style="background: transparent; border: none; color: #6366f1; cursor: pointer; padding: 0.25rem; margin-top: 0.1rem; border-radius: 6px;" title="Listen">
            <i data-lucide="volume-2" style="width: 16px; height: 16px;"></i>
          </button>
        `;

        // Wire TTS for option
        const ttsBtn = btn.querySelector(".opt-tts-btn");
        if (ttsBtn) {
          ttsBtn.onclick = (e) => {
            e.stopPropagation();
            if (typeof speakText === "function") {
              speakText(optText, tLang);
            }
          };
        }

        btn.onclick = () => handleOptionClick(btn, optText, idx, turnData);
        optionsContainer.appendChild(btn);
      });

      if (window.lucide) lucide.createIcons();

      setTimeout(() => {
        footerOptions.classList.remove("hidden");
        chatBody.scrollTop = chatBody.scrollHeight;
      }, 300);
    }, 900);
  }

  // ─── Handle Option Click ────────────────────────────────────
  function handleOptionClick(btnElement, optText, chosenIndex, turnData) {
    const footerOptions = document.getElementById("chat-footer");
    const tLang = userProfile?.targetLanguage || userProfile?.preferredLanguage || selectedLang || "hi";

    // ── CORRECT OPTION CHOSEN ──
    if (chosenIndex === turnData.correctIndex) {
      btnElement.style.background = "#dcfce7";
      btnElement.style.borderColor = "#10b981";
      footerOptions.classList.add("hidden");

      // Append outgoing message bubble
      appendOutgoingMessage(optText, tLang);

      // Award Turn Rewards (+10 XP, +5 Coins)
      awardDatabaseRewards(10, 5);

      currentTurnIndex++;

      if (currentTurnIndex < currentScenario.turns.length) {
        setTimeout(executeTurn, 1000);
      } else {
        setTimeout(handleWin, 1400);
      }
    }
    // ── WRONG OPTION CHOSEN (TEACHING COACH TIP) ──
    else {
      btnElement.style.background = "#fee2e2";
      btnElement.style.borderColor = "#ef4444";
      btnElement.style.animation = "shake 0.4s";

      // Display Educational Coach Tip in Chat Body
      insertCoachTip(turnData.coachTip);

      setTimeout(() => {
        btnElement.style.animation = "none";
      }, 600);
    }
  }

  // ─── Append Incoming Message Bubble ─────────────────────────
  function appendIncomingMessage(text, translation, lang) {
    const chatBody = document.getElementById("chat-body");
    const bubbleWrapper = document.createElement("div");
    bubbleWrapper.className = "bubble bubble-incoming";
    bubbleWrapper.style.cssText = "display: flex; flex-direction: column; align-self: flex-start; max-width: 85%; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px 18px 18px 4px; padding: 0.85rem 1.1rem; margin-bottom: 0.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); position: relative;";

    bubbleWrapper.innerHTML = `
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem;">
        <div style="font-size: 0.95rem; font-weight: 700; color: #0f172a; line-height: 1.45;">
          ${text}
        </div>
        <button type="button" class="bubble-tts-btn" style="background: #eef2ff; border: none; border-radius: 8px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: #4f46e5; cursor: pointer; flex-shrink: 0;" title="Listen">
          <i data-lucide="volume-2" style="width: 15px; height: 15px;"></i>
        </button>
      </div>
      ${translation ? `<div style="font-size: 0.82rem; font-weight: 600; color: #64748b; margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px dashed #e2e8f0; line-height: 1.4;">${translation}</div>` : ""}
    `;

    const ttsBtn = bubbleWrapper.querySelector(".bubble-tts-btn");
    if (ttsBtn) {
      ttsBtn.onclick = () => {
        if (typeof speakText === "function") {
          speakText(text, lang);
        }
      };
    }

    chatBody.appendChild(bubbleWrapper);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Header audio button sync
    const readChatBtn = document.getElementById("read-chat-btn");
    if (readChatBtn) {
      readChatBtn.onclick = () => {
        if (typeof speakText === "function") speakText(text, lang);
      };
    }

    if (window.lucide) lucide.createIcons();
  }

  // ─── Append Outgoing Message Bubble ─────────────────────────
  function appendOutgoingMessage(text, lang) {
    const chatBody = document.getElementById("chat-body");
    const bubble = document.createElement("div");
    bubble.className = "bubble bubble-outgoing";
    bubble.style.cssText = "align-self: flex-end; max-width: 80%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; font-weight: 700; font-size: 0.95rem; line-height: 1.45; border-radius: 18px 18px 4px 18px; padding: 0.85rem 1.15rem; margin-bottom: 0.75rem; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);";
    bubble.textContent = text;

    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // ─── Insert Educational Coach Tip ───────────────────────────
  function insertCoachTip(tipText) {
    const chatBody = document.getElementById("chat-body");
    // Remove existing coach tips to avoid stacking
    chatBody.querySelectorAll(".chat-coach-tip").forEach(el => el.remove());

    const tipDiv = document.createElement("div");
    tipDiv.className = "chat-coach-tip";
    tipDiv.style.cssText = "align-self: center; width: 92%; max-width: 440px; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 16px; padding: 0.75rem 1rem; margin: 0.5rem auto 0.75rem; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.12); animation: fadeInUp 0.3s ease;";

    tipDiv.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 0.55rem; text-align: left;">
        <div style="font-size: 1.2rem; line-height: 1; flex-shrink: 0; margin-top: 0.1rem;">💡</div>
        <div>
          <div style="font-weight: 900; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; color: #b45309; margin-bottom: 0.2rem;">Learning Coach Tip</div>
          <div style="font-size: 0.88rem; font-weight: 700; color: #78350f; line-height: 1.45;">${tipText}</div>
        </div>
      </div>
    `;

    chatBody.appendChild(tipDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // ─── Award Database Rewards ─────────────────────────────────
  function awardDatabaseRewards(xpAmount, coinAmount) {
    totalXPEarned += xpAmount;
    totalCoinsEarned += coinAmount;

    const chatBody = document.getElementById("chat-body");
    const rewardToast = document.createElement("div");
    rewardToast.className = "reward-toast";
    rewardToast.style.cssText = "align-self: center; background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; font-weight: 800; font-size: 0.82rem; border-radius: 9999px; padding: 0.35rem 0.85rem; margin: 0.25rem auto 0.5rem; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);";
    rewardToast.innerHTML = `<span>+${xpAmount} XP</span> &bull; <span>+${coinAmount} 🪙</span>`;

    chatBody.appendChild(rewardToast);
    chatBody.scrollTop = chatBody.scrollHeight;

    const user = auth.currentUser;
    if (!user) return;

    if (window.db) {
      db.collection("users").doc(user.uid).update({
        coins: firebase.firestore.FieldValue.increment(coinAmount),
        xp: firebase.firestore.FieldValue.increment(xpAmount)
      }).catch(err => console.warn("Firestore reward update:", err));
    }

    if (typeof updateQuestProgress === "function") {
      updateQuestProgress(user.uid, "xp", xpAmount);
    }
  }

  // ─── Handle Scenario Victory ────────────────────────────────
  function handleWin() {
    const successOverlay = document.getElementById("success-overlay");
    const successText = document.getElementById("success-text");
    const rewardBadge = document.querySelector("#success-overlay .chat-success-reward");

    // Bonus Victory Award
    awardDatabaseRewards(30, 20);

    if (successText) {
      successText.textContent = currentScenario.successMessage;
    }

    if (rewardBadge) {
      rewardBadge.innerHTML = `<strong>Total Earned:</strong> +${totalXPEarned} XP & +${totalCoinsEarned} 🪙 Coins`;
    }

    if (typeof showCelebrationParticles === "function") {
      showCelebrationParticles(3500);
    }

    if (successOverlay) {
      successOverlay.classList.remove("hidden");
    }
  }

  return {
    init: init,
    startScenario: startScenario,
    resetToScenarioScreen: resetToScenarioScreen
  };
})();