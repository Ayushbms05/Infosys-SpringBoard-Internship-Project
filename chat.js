/**
 * chat.js — Hybrid WhatsApp Simulator
 * Hardcoded Scenarios for speed + AI Free-Typing for practice.
 *
 * All state is wrapped in the ChatSimulator IIFE to avoid
 * top-level variable collisions with game.js / games-hub.js.
 */

window.ChatSimulator = (function () {
  // ── Private State ──
  let currentScenario = null;
  let currentTurnIndex = 0;
  let userProfile = null;
  let totalXPEarned = 0;
  let totalCoinsEarned = 0;
  let freeChatTurns = 0;
  let lastFriendMessage = "";
  let chatInitialized = false;

  // Hybrid Dictionary: Hardcoded + AI Free-Text
  const SCENARIOS = {
    banking: {
      type: "hardcoded",
      title: "Bank Alert",
      desc: "Handle a 3-step security check.",
      contactName: "Bank Alerts",
      contactIcon: "🏦",
      task: "Read the security alerts and protect your account.",
      turns: [
        { incoming: "ALERT: A login attempt was made from a new device. If this was not you, please reply to lock your account immediately.", options: ["Yes, this was me.", "No, lock my account.", "What is my balance?"], correctIndex: 1 },
        { incoming: "Your account is temporarily locked. To protect your funds, do you want us to block your current debit card?", options: ["Yes, block the card.", "No, leave it active.", "Send me a pizza."], correctIndex: 0 },
        { incoming: "Card blocked successfully. We will mail a replacement to your registered address. Reply 'CONFIRM' to finalize.", options: ["CANCEL", "CONFIRM", "LATER"], correctIndex: 1 }
      ],
      successMessage: "Great job! You successfully completed all security checks."
    },
    recharge: {
      type: "hardcoded",
      title: "Mobile Recharge",
      desc: "Renew your data plan in 3 steps.",
      contactName: "Network Provider",
      contactIcon: "📱",
      task: "Navigate the menus to renew your data plan.",
      turns: [
        { incoming: "Dear customer, your prepaid plan is expiring today. Reply '1' to view plans or '2' to ignore.", options: ["1", "2", "Call me."], correctIndex: 0 },
        { incoming: "Here are the plans: A) ₹299 for 28 Days. B) ₹499 for 56 Days. Which plan do you want to select?", options: ["Plan A", "Plan B", "Neither"], correctIndex: 0 },
        { incoming: "You selected the ₹299 plan. Please reply 'PAY' to receive your payment link.", options: ["NO", "MAYBE", "PAY"], correctIndex: 2 }
      ],
      successMessage: "Perfect! You successfully managed your prepaid service."
    },
    friend: {
      type: "free-text",
      title: "Chat with a Friend",
      desc: "Practice typing your own replies.",
      contactName: "Rahul (Friend)",
      contactIcon: "🧑🏽",
      task: "Type your own replies. Practice your spelling and grammar!",
      incomingMessage: "Hey! It's been a while. How are you doing?",
      successMessage: "Awesome conversation! Your typing is getting much better."
    }
  };

  // ── Public: Init (called lazily by dashboard.js) ──
  function init(profile) {
    userProfile = profile;
    if (chatInitialized) return;
    chatInitialized = true;

    renderScenarioMenu();

    // Free-Text send button
    document.getElementById("free-text-send").addEventListener("click", handleFreeTextSubmit);
    document.getElementById("free-text-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleFreeTextSubmit();
    });

    // Back / Play Again buttons
    document.getElementById("chat-back-btn").onclick = resetToScenarioScreen;
    document.getElementById("chat-play-again-btn").onclick = resetToScenarioScreen;
  }

  // ── Helpers ──
  function resetToScenarioScreen() {
    document.getElementById("chat-phone").classList.add("hidden");
    document.getElementById("success-overlay").classList.add("hidden");
    document.getElementById("chat-scenario-screen").classList.remove("hidden");
    document.body.classList.remove("bg-light");

    // Clear bubbles & toasts but keep structural elements
    const chatBody = document.getElementById("chat-body");
    chatBody.querySelectorAll(".bubble, .reward-toast, [style*='align-self: center']").forEach(el => el.remove());

    // Re-hide footers
    document.getElementById("chat-footer").classList.add("hidden");
    document.getElementById("chat-footer-typing").classList.add("hidden");
  }

  function renderScenarioMenu() {
    const grid = document.getElementById("scenario-grid");
    grid.innerHTML = '';

    Object.keys(SCENARIOS).forEach(key => {
      const data = SCENARIOS[key];
      const card = document.createElement("div");
      card.className = "scenario-card";
      const aiBadge = data.type === "free-text"
        ? '<span style="font-size: 0.7rem; background: #6c63ff; color: white; padding: 0.2rem 0.5rem; border-radius: 12px; position: absolute; top: 1rem; right: 1rem;">✨ AI</span>'
        : '';

      card.innerHTML = `
        ${aiBadge}
        <div class="scenario-icon">${data.contactIcon}</div>
        <h3 style="margin: 0 0 0.5rem 0;">${data.title}</h3>
        <p style="margin: 0; color: #64748b; font-size: 0.9rem; line-height: 1.4;">${data.desc}</p>
      `;
      card.style.position = "relative";
      card.onclick = () => startScenario(key);
      grid.appendChild(card);
    });
  }

  function startScenario(scenarioKey) {
    currentScenario = SCENARIOS[scenarioKey];
    currentTurnIndex = 0;
    totalXPEarned = 0;
    totalCoinsEarned = 0;
    freeChatTurns = 0;

    document.getElementById("chat-scenario-screen").classList.add("hidden");
    document.getElementById("chat-phone").classList.remove("hidden");

    document.getElementById("contact-name").textContent = currentScenario.contactName;
    document.getElementById("contact-icon").textContent = currentScenario.contactIcon;
    document.getElementById("task-text").textContent = currentScenario.task;

    if (currentScenario.type === "hardcoded") {
      executeTurn();
    } else {
      executeFreeTextStart();
    }
  }

  // ── Hardcoded Logic (Bank, Recharge) ──
  function executeTurn() {
    const typing = document.getElementById("typing-indicator");
    const chatBody = document.getElementById("chat-body");
    const footerOptions = document.getElementById("chat-footer");

    footerOptions.classList.add("hidden");
    typing.classList.remove("hidden");
    chatBody.scrollTop = chatBody.scrollHeight;

    const turnData = currentScenario.turns[currentTurnIndex];

    setTimeout(() => {
      typing.classList.add("hidden");
      appendMessage("incoming", turnData.incoming);

      const optionsContainer = document.getElementById("options-container");
      optionsContainer.innerHTML = '';
      turnData.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "reply-btn";
        btn.textContent = opt;
        btn.onclick = () => handleReply(opt, idx);
        optionsContainer.appendChild(btn);
      });

      setTimeout(() => {
        footerOptions.classList.remove("hidden");
        chatBody.scrollTop = chatBody.scrollHeight;
      }, 500);
    }, 1500);
  }

  function handleReply(text, idx) {
    document.getElementById("chat-footer").classList.add("hidden");
    appendMessage("outgoing", text);

    const turnData = currentScenario.turns[currentTurnIndex];

    setTimeout(() => {
      if (idx === turnData.correctIndex) {
        awardDatabaseRewards(10, 5);
        currentTurnIndex++;
        if (currentTurnIndex < currentScenario.turns.length) {
          setTimeout(executeTurn, 1000);
        } else {
          setTimeout(handleWin, 1500);
        }
      } else {
        const bubbles = document.querySelectorAll('.bubble-outgoing');
        const lastBubble = bubbles[bubbles.length - 1];
        lastBubble.style.animation = "shake 0.4s";
        lastBubble.style.background = "#fee2e2";
        setTimeout(() => {
          lastBubble.remove();
          document.getElementById("chat-footer").classList.remove("hidden");
        }, 1500);
      }
    }, 1000);
  }

  // ── Free-Typing Logic (Gemini AI Chat) ──
  function executeFreeTextStart() {
    const typing = document.getElementById("typing-indicator");
    typing.classList.remove("hidden");

    setTimeout(() => {
      typing.classList.add("hidden");
      lastFriendMessage = currentScenario.incomingMessage;
      appendMessage("incoming", lastFriendMessage);
      document.getElementById("chat-footer-typing").classList.remove("hidden");
    }, 1500);
  }

  async function handleFreeTextSubmit() {
    const inputEl = document.getElementById("free-text-input");
    const userText = inputEl.value.trim();
    if (!userText) return;

    inputEl.value = "";
    document.getElementById("chat-footer-typing").classList.add("hidden");
    appendMessage("outgoing", userText);

    const typing = document.getElementById("typing-indicator");
    typing.classList.remove("hidden");
    document.getElementById("chat-body").scrollTop = document.getElementById("chat-body").scrollHeight;

    const langName = userProfile?.preferredLanguage || "English";
    const isFinalTurn = freeChatTurns >= 4;

    const prompt = `You are simulating a text message conversation with an adult literacy learner in India. 
    Language: ${langName}.
    Friend's last message: "${lastFriendMessage}"
    Learner's typed reply: "${userText}"

    Evaluate the learner's reply for spelling, grammar, and context.
    Return ONLY valid JSON format:
    {
      "feedback": "If there is a spelling or grammar mistake, provide a short encouraging correction (e.g., 'Tip: Try spelling it like this...'). If perfect, leave empty string.",
      "friendReply": "${isFinalTurn ? 'Write a friendly goodbye message to wrap up the conversation.' : 'Write a natural reply. YOU MUST ask a follow-up question to keep the chat going.'}",
      "endChat": ${isFinalTurn ? "true" : "false"}
    }`;

    try {
      const idToken = await firebase.auth().currentUser.getIdToken();
      const response = await fetch('/api/callGemini', {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + idToken },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5 } })
      });

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/```(json)?/gi, '').trim();
      const result = JSON.parse(text);

      typing.classList.add("hidden");

      if (result.feedback && result.feedback !== "") {
        const feedbackHtml = `<div style="align-self: center; font-size: 0.8rem; background: #e0f2fe; color: #0f172a; padding: 0.5rem 1rem; border-radius: 12px; margin: 0.5rem 0; text-align: center; border: 1px solid #bae6fd;">💡 ${result.feedback}</div>`;
        document.getElementById("chat-body").insertAdjacentHTML('beforeend', feedbackHtml);
      }

      awardDatabaseRewards(15, 5);
      lastFriendMessage = result.friendReply;
      appendMessage("incoming", result.friendReply);

      freeChatTurns++;
      if (result.endChat || freeChatTurns >= 5) {
        setTimeout(handleWin, 3500);
      } else {
        setTimeout(() => {
          document.getElementById("chat-footer-typing").classList.remove("hidden");
          document.getElementById("chat-body").scrollTop = document.getElementById("chat-body").scrollHeight;
        }, 500);
      }
    } catch (error) {
      console.error("Gemini failed:", error);
      typing.classList.add("hidden");
      appendMessage("incoming", "Haha, that's great! Anyway, I have to go now, talk later!");
      awardDatabaseRewards(15, 5);
      setTimeout(handleWin, 3000);
    }
  }

  // ── Shared Utilities ──
  function appendMessage(type, text) {
    const chatBody = document.getElementById("chat-body");
    const html = `<div class="bubble bubble-${type}">${text}</div>`;
    chatBody.insertAdjacentHTML('beforeend', html);

    if (type === "incoming") {
      document.getElementById("read-chat-btn").onclick = () => {
        if (typeof speakText === 'function') speakText(text, userProfile?.preferredLanguage || 'en');
      };
    }
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function awardDatabaseRewards(xpAmount, coinAmount) {
    totalXPEarned += xpAmount;
    totalCoinsEarned += coinAmount;

    const chatBody = document.getElementById("chat-body");
    const rewardHtml = `<div class="reward-toast">+${xpAmount} XP & +${coinAmount} 🪙</div>`;
    chatBody.insertAdjacentHTML('beforeend', rewardHtml);

    const user = auth.currentUser;
    if (!user) return;

    db.collection('users').doc(user.uid).update({
      coins: firebase.firestore.FieldValue.increment(coinAmount),
      xp: firebase.firestore.FieldValue.increment(xpAmount)
    });

    if (typeof updateQuestProgress === 'function') updateQuestProgress(user.uid, 'xp', xpAmount);
  }

  function handleWin() {
    document.getElementById("success-text").textContent = currentScenario.successMessage;
    const rewardBadge = document.querySelector("#success-overlay .chat-success-reward");
    if (rewardBadge) {
      rewardBadge.textContent = `Total Earned: +${totalXPEarned} XP & +${totalCoinsEarned} 🪙`;
    }
    document.getElementById("success-overlay").classList.remove("hidden");
  }

  return { init: init };
})();