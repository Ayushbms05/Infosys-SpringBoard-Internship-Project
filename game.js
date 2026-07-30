/**
 * game.js — Word Match + Shared Localized Dictionary
 *
 * localizedDictionaries is set on `window` as the single source of truth
 * that games-hub.js's new games also read from — no duplicate declaration.
 *
 * Word Match game state is wrapped in window.WordMatch IIFE to avoid
 * top-level variable collisions with chat.js / games-hub.js.
 */

// ── Shared Dictionary (single source of truth) ──
window.localizedDictionaries = {
  en: [
    { text: "Bank", icon: "🏦", desc: "A place to keep money" },
    { text: "Bus", icon: "🚌", desc: "A large vehicle for many passengers" },
    { text: "Ticket", icon: "🎫", desc: "Paper needed for entry or travel" },
    { text: "Medicine", icon: "💊", desc: "Used to treat illness" },
    { text: "Market", icon: "🛒", desc: "A place to buy food and goods" },
    { text: "Water", icon: "🚰", desc: "Clear liquid we drink to survive" },
    { text: "Apple", icon: "🍎", desc: "A round red or green fruit" },
    { text: "Book", icon: "📖", desc: "Pages with words to read" },
    { text: "House", icon: "🏠", desc: "A building people live in" },
    { text: "Sun", icon: "☀️", desc: "The star that lights our day" },
    { text: "Moon", icon: "🌙", desc: "Shines at night in the sky" },
    { text: "Tree", icon: "🌳", desc: "A woody plant with branches" },
    { text: "Fire", icon: "🔥", desc: "Gives heat and light" },
    { text: "Dog", icon: "🐕", desc: "A loyal pet animal" },
    { text: "Cat", icon: "🐈", desc: "A small furry pet" }
  ],
  hi: [
    { text: "बैंक", icon: "🏦", desc: "पैसे रखने की जगह" },
    { text: "बस", icon: "🚌", desc: "यात्रियों के लिए बड़ा वाहन" },
    { text: "टिकट", icon: "🎫", desc: "यात्रा के लिए आवश्यक" },
    { text: "दवा", icon: "💊", desc: "बीमारी के इलाज के लिए" },
    { text: "बाज़ार", icon: "🛒", desc: "सामान खरीदने की जगह" },
    { text: "पानी", icon: "🚰", desc: "पीने योग्य तरल" },
    { text: "सेब", icon: "🍎", desc: "एक लाल या हरा फल" },
    { text: "किताब", icon: "📖", desc: "पढ़ने के लिए पन्नों वाली वस्तु" },
    { text: "घर", icon: "🏠", desc: "रहने की जगह" },
    { text: "सूरज", icon: "☀️", desc: "दिन में चमकने वाला तारा" },
    { text: "चाँद", icon: "🌙", desc: "रात में चमकने वाला उपग्रह" },
    { text: "पेड़", icon: "🌳", desc: "पत्तियों और शाखाओं वाला पौधा" },
    { text: "आग", icon: "🔥", desc: "जलने की प्रक्रिया" },
    { text: "कुत्ता", icon: "🐕", desc: "एक पालतू जानवर" },
    { text: "बिल्ली", icon: "🐈", desc: "एक छोटा पालतू जानवर" }
  ],
  ta: [
    { text: "வங்கி", icon: "🏦", desc: "பணம் வைக்கும் இடம்" },
    { text: "பேருந்து", icon: "🚌", desc: "பயணிகளுக்கான வாகனம்" },
    { text: "டிக்கெட்", icon: "🎫", desc: "பயண அனுமதிச் சீட்டு" },
    { text: "மருந்து", icon: "💊", desc: "நோயைக் குணப்படுத்தும்" },
    { text: "சந்தை", icon: "🛒", desc: "பொருட்கள் வாங்கும் இடம்" },
    { text: "தண்ணீர்", icon: "🚰", desc: "குடிக்கும் திரவம்" },
    { text: "ஆப்பிள்", icon: "🍎", desc: "ஒரு பழம்" },
    { text: "புத்தகம்", icon: "📖", desc: "படிக்க உதவும்" },
    { text: "வீடு", icon: "🏠", desc: "வாழும் இடம்" },
    { text: "சூரியன்", icon: "☀️", desc: "பகலில் ஒளிரும் நட்சத்திரம்" },
    { text: "நிலா", icon: "🌙", desc: "இரவில் தோன்றும் கோள்" },
    { text: "மரம்", icon: "🌳", desc: "கிளைகள் உள்ள தாவரம்" },
    { text: "நெருப்பு", icon: "🔥", desc: "எரியும் நெருப்பு" },
    { text: "நாய்", icon: "🐕", desc: "விசுவாசமான விலங்கு" },
    { text: "பூனை", icon: "🐈", desc: "சிறிய வீட்டு விலங்கு" }
  ],
  te: [
    { text: "బ్యాంకు", icon: "🏦", desc: "డబ్బులు దాచే చోటు" },
    { text: "బస్సు", icon: "🚌", desc: "ప్రయాణికుల వాహనం" },
    { text: "టికెట్", icon: "🎫", desc: "ప్రయాణానికి కాగితం" },
    { text: "మందు", icon: "💊", desc: "వ్యాధికి చికిత్స" },
    { text: "మార్కెట్", icon: "🛒", desc: "వస్తువులు కొనే స్థలం" },
    { text: "నీరు", icon: "🚰", desc: "త్రాగే ద్రవం" },
    { text: "ఆపిల్", icon: "🍎", desc: "ఒక పండు" },
    { text: "పుస్తకం", icon: "📖", desc: "చదవడానికి ఉపయోగం" },
    { text: "ఇల్లు", icon: "🏠", desc: "నివసించే ప్రదేశం" },
    { text: "సూర్యుడు", icon: "☀️", desc: "పగలు ప్రకాశించే నక్షత్రం" },
    { text: "చంద్రుడు", icon: "🌙", desc: "రాత్రి ప్రకాశించే ఉపగ్రహం" },
    { text: "చెట్టు", icon: "🌳", desc: "ఆకులు ఉన్న మొక్క" },
    { text: "మంట", icon: "🔥", desc: "కాలిపోయే ప్రక్రియ" },
    { text: "కుక్క", icon: "🐕", desc: "విశ్వాసపాత్ర జంతువు" },
    { text: "పిల్లి", icon: "🐈", desc: "చిన్న పెంపుడు జంతువు" }
  ],
  kn: [
    { text: "ಬ್ಯಾಂಕ್", icon: "🏦", desc: "ಹಣ ಇಡುವ ಸ್ಥಳ" },
    { text: "ಬಸ್ಸು", icon: "🚌", desc: "ಪ್ರಯಾಣಿಕರ ವಾಹನ" },
    { text: "ಟಿಕೆಟ್", icon: "🎫", desc: "ಪ್ರಯಾಣದ ಚೀಟಿ" },
    { text: "ಔಷಧಿ", icon: "💊", desc: "ರೋಗ ಗುಣಪಡಿಸುವ ವಸ್ತು" },
    { text: "ಮಾರುಕಟ್ಟೆ", icon: "🛒", desc: "ಸಾಮಾನು ಕೊಳ್ಳುವ ಸ್ಥಳ" },
    { text: "ನೀರು", icon: "🚰", desc: "ಕುಡಿಯುವ ದ್ರವ" },
    { text: "ಸೇಬು", icon: "🍎", desc: "ಒಂದು ಹಣ್ಣು" },
    { text: "ಪುಸ್ತಕ", icon: "📖", desc: "ಓದುವ ವಸ್ತು" },
    { text: "ಮನೆ", icon: "🏠", desc: "ವಾಸಿಸುವ ಸ್ಥಳ" },
    { text: "ಸೂರ್ಯ", icon: "☀️", desc: "ಹಗಲಿನ ನಕ್ಷತ್ರ" },
    { text: "ಚಂದ್ರ", icon: "🌙", desc: "ರಾತ್ರಿ ಬೆಳಗುವ ಉಪಗ್ರಹ" },
    { text: "ಮರ", icon: "🌳", desc: "ಎಲೆಗಳಿರುವ ಸಸ್ಯ" },
    { text: "ಬೆಂಕಿ", icon: "🔥", desc: "ಉರಿಯುವಿಕೆ" },
    { text: "ನಾಯಿ", icon: "🐕", desc: "ನಿಯತ್ತಿನ ಪ್ರಾಣಿ" },
    { text: "ಬೆಕ್ಕು", icon: "🐈", desc: "ಸಣ್ಣ ಸಾಕುಪ್ರಾಣಿ" }
  ],
  bn: [
    { text: "ব্যাংক", icon: "🏦", desc: "টাকা রাখার জায়গা" },
    { text: "বাস", icon: "🚌", desc: "যাত্রীদের বড় গাড়ি" },
    { text: "টিকিট", icon: "🎫", desc: "ভ্রমণের কাগজ" },
    { text: "ওষুধ", icon: "💊", desc: "রোগ সারানোর জন্য" },
    { text: "বাজার", icon: "🛒", desc: "জিনিস কেনার জায়গা" },
    { text: "জল", icon: "🚰", desc: "পানের যোগ্য তরল" },
    { text: "আপেল", icon: "🍎", desc: "একটি ফল" },
    { text: "বই", icon: "📖", desc: "পড়ার জন্য" },
    { text: "বাড়ি", icon: "🏠", desc: "থাকার জায়গা" },
    { text: "সূর্য", icon: "☀️", desc: "দিনের নক্ষত্র" },
    { text: "চাঁদ", icon: "🌙", desc: "রাতের উপগ্রহ" },
    { text: "গাছ", icon: "🌳", desc: "পাতা ও ডালের উদ্ভিদ" },
    { text: "আগুন", icon: "🔥", desc: "জ্বলন্ত অবস্থা" },
    { text: "কুকুর", icon: "🐕", desc: "বিশ্বস্ত প্রাণী" },
    { text: "বিড়াল", icon: "🐈", desc: "ছোট পোষা প্রাণী" }
  ],
  mr: [
    { text: "बँक", icon: "🏦", desc: "पैसे ठेवण्याचे ठिकाण" },
    { text: "बस", icon: "🚌", desc: "प्रवाशांसाठी वाहन" },
    { text: "तिकीट", icon: "🎫", desc: "प्रवासासाठी आवश्यक" },
    { text: "औषध", icon: "💊", desc: "आजार बरा करण्यासाठी" },
    { text: "बाजार", icon: "🛒", desc: "वस्तू विकत घेण्याचे ठिकाण" },
    { text: "पाणी", icon: "🚰", desc: "पिण्याचे द्रव" },
    { text: "सफरचंद", icon: "🍎", desc: "एक फळ" },
    { text: "पुस्तक", icon: "📖", desc: "वाचनासाठी" },
    { text: "घर", icon: "🏠", desc: "राहण्याचे ठिकाण" },
    { text: "सूर्य", icon: "☀️", desc: "दिवसा प्रकाशणारा तारा" },
    { text: "चंद्र", icon: "🌙", desc: "रात्री प्रकाशणारा उपग्रह" },
    { text: "झाड", icon: "🌳", desc: "पाने आणि फांद्या वनस्पती" },
    { text: "आग", icon: "🔥", desc: "जळण्याची क्रिया" },
    { text: "कुत्रा", icon: "🐕", desc: "एक इमानदार प्राणी" },
    { text: "मांजर", icon: "🐈", desc: "एक लहान पाळीव प्राणी" }
  ]
};

// ── Word Match Game (IIFE — no top-level vars leak) ──
window.WordMatch = (function () {
  let cards = [];
  let flippedCards = [];
  let matchedCount = 0;
  let scoreXP = 0;
  let lockBoard = false;
  const totalPairs = 6;

  function init(profile) {
    const board = document.getElementById("options-grid");
    if (!board) return;
    board.innerHTML = "";
    cards = [];
    flippedCards = [];
    matchedCount = 0;
    scoreXP = 0;
    lockBoard = false;

    // Reset UI counters
    const mc = document.getElementById("match-count");
    const gx = document.getElementById("game-xp");
    if (mc) mc.textContent = "0";
    if (gx) gx.textContent = "0 XP";

    // Show the Word Match play area, hide hub
    document.getElementById("games-hub-screen").classList.add("hidden");
    document.getElementById("game-word-match").classList.remove("hidden");

    const lang = profile?.preferredLanguage || "en";
    const dict = window.localizedDictionaries[lang] || window.localizedDictionaries['en'];

    // Pick random 6 words
    const shuffledDict = [...dict].sort(() => 0.5 - Math.random());
    const selectedWords = shuffledDict.slice(0, totalPairs);

    // Create pairs
    selectedWords.forEach(word => {
      cards.push({ type: 'text', val: word.text, id: word.text, lang });
      cards.push({ type: 'icon', val: word.icon, id: word.text, lang });
    });

    // Shuffle
    cards.sort(() => 0.5 - Math.random());

    // Render
    cards.forEach((card, idx) => {
      const cardEl = document.createElement("div");
      cardEl.classList.add("game-card");
      cardEl.dataset.id = card.id;
      cardEl.dataset.idx = idx;

      cardEl.innerHTML = `
        <div class="card-front">?</div>
        <div class="card-back" style="font-size: ${card.type === 'icon' ? '3rem' : '1.5rem'}">${card.val}</div>
      `;

      cardEl.addEventListener("click", () => flipCard(cardEl, card));
      board.appendChild(cardEl);
    });
  }

  function flipCard(cardEl, cardData) {
    if (lockBoard) return;
    if (cardEl.classList.contains("flipped")) return;

    cardEl.classList.add("flipped");
    flippedCards.push(cardEl);

    if (cardData.type === 'text' && typeof speakText === 'function') {
      speakText(cardData.val, cardData.lang);
    }

    if (flippedCards.length === 2) {
      checkMatch();
    }
  }

  function checkMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.id === card2.dataset.id;

    if (isMatch) {
      card1.classList.add("matched");
      card2.classList.add("matched");
      matchedCount++;
      document.getElementById("match-count").textContent = matchedCount;

      scoreXP += 5;
      document.getElementById("game-xp").textContent = `${scoreXP} XP`;

      if (matchedCount === totalPairs) {
        setTimeout(async () => {
          document.getElementById("game-word-match").classList.add("hidden");
          document.getElementById("game-complete").classList.remove("hidden");
          document.getElementById("game-complete-subtitle").textContent =
            "You've matched all the words perfectly!";

          // Use the shared reward handler from games-hub.js
          if (window.handleGameWin) {
            await window.handleGameWin(scoreXP, 10);
          }
        }, 500);
      }

      flippedCards = [];
    } else {
      lockBoard = true;
      card1.querySelector('.card-back').style.borderColor = 'var(--color-error, #ef4444)';
      card2.querySelector('.card-back').style.borderColor = 'var(--color-error, #ef4444)';

      setTimeout(() => {
        card1.classList.remove("flipped");
        card2.classList.remove("flipped");
        card1.querySelector('.card-back').style.borderColor = 'var(--color-primary)';
        card2.querySelector('.card-back').style.borderColor = 'var(--color-primary)';
        flippedCards = [];
        lockBoard = false;
      }, 1000);
    }
  }

  return { init: init };
})();