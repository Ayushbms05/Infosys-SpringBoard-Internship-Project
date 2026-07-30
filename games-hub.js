/**
 * games-hub.js — Games & Puzzles Hub + 5 new mini-games
 *
 * Every game's state is in its own IIFE to avoid top-level collisions.
 * Uses window.localizedDictionaries from game.js (single source of truth).
 * Uses addXP / updateStreak / updateQuestProgress / checkAndAwardBadges
 * from auth.js + showBadgeCelebration from celebrations.js.
 */

// ══════════════════════════════════════════
// UNIFIED REWARD HANDLER
// ══════════════════════════════════════════
window.handleGameWin = async function (xp, coins) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    if (typeof addXP === 'function') await addXP(user.uid, xp);
    if (typeof updateStreak === 'function') await updateStreak(user.uid);
    await db.collection("users").doc(user.uid).update({
      gamesCompleted: firebase.firestore.FieldValue.increment(1),
      coins: firebase.firestore.FieldValue.increment(coins)
    });
    if (typeof updateQuestProgress === 'function') {
      updateQuestProgress(user.uid, 'game', 1);
      updateQuestProgress(user.uid, 'xp', xp);
    }
    if (typeof getUserProgress === 'function' && typeof checkAndAwardBadges === 'function') {
      const freshProfile = await getUserProgress(user.uid);
      const newlyEarnedBadges = await checkAndAwardBadges(user.uid, freshProfile);
      if (typeof showBadgeCelebration === 'function') {
        for (const badgeId of newlyEarnedBadges) {
          await showBadgeCelebration(badgeId);
        }
      }
    }
  } catch (e) {
    console.error("Reward error:", e);
  }
};

// Helper: get dictionary for a language
function _getDict(profile) {
  const lang = profile?.preferredLanguage || "en";
  return window.localizedDictionaries[lang] || window.localizedDictionaries['en'];
}

// Helper: shuffle array in place (Fisher-Yates)
function _shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ══════════════════════════════════════════
// GAMES HUB
// ══════════════════════════════════════════
window.GamesHub = (function () {
  let profileRef = null;
  let hubInitialized = false;
  let lastGameInit = null; // for "Play Again"

  const ALL_PLAY_AREAS = [
    'game-word-match', 'game-word-builder', 'game-word-safari',
    'game-word-race', 'game-word-search', 'game-crossword', 'game-complete'
  ];

  const games = [
    { id: 'word-match',   title: 'Word Match',   icon: '🧠', desc: 'Match words with their icons.',    init: () => { lastGameInit = () => window.WordMatch.init(profileRef); lastGameInit(); } },
    { id: 'word-builder',  title: 'Word Builder',  icon: '🔨', desc: 'Unscramble letters to build words.', init: () => { lastGameInit = () => WordBuilder.init(profileRef); lastGameInit(); } },
    { id: 'word-safari',   title: 'Word Safari',   icon: '🦁', desc: 'Spot the right word for the icon.',  init: () => { lastGameInit = () => WordSafari.init(profileRef); lastGameInit(); } },
    { id: 'word-race',     title: 'Word Race',     icon: '⏱️', desc: 'Pick words against the clock!',     init: () => { lastGameInit = () => WordRace.init(profileRef); lastGameInit(); } },
  ];

  const puzzles = [
    { id: 'word-search', title: 'Word Search',  icon: '🔍', desc: 'Find hidden words in the grid.',   init: () => { lastGameInit = () => WordSearchGame.init(profileRef); lastGameInit(); } },
    { id: 'crossword',   title: 'Vocabulary Crossword', icon: '🧩', desc: 'Solve clues to fill the grid.', init: () => { lastGameInit = () => CrosswordGame.init(profileRef); lastGameInit(); } },
  ];

  function init(profile) {
    profileRef = profile;
    if (hubInitialized) return;
    hubInitialized = true;

    renderHub();

    // Wire up shared buttons
    document.getElementById("game-back-btn").onclick = showHub;
    document.getElementById("wb-back-btn").onclick = showHub;
    document.getElementById("ws-back-btn").onclick = showHub;
    document.getElementById("wr-back-btn").onclick = showHub;
    document.getElementById("wsr-back-btn").onclick = showHub;
    document.getElementById("cw-back-btn").onclick = showHub;
    document.getElementById("game-back-hub-btn").onclick = showHub;
    document.getElementById("game-play-again-btn").onclick = () => {
      document.getElementById("game-complete").classList.add("hidden");
      if (lastGameInit) lastGameInit();
      else showHub();
    };
  }

  function renderHub() {
    const gamesGrid = document.getElementById("games-grid");
    const puzzlesGrid = document.getElementById("puzzles-grid");
    if (!gamesGrid || !puzzlesGrid) return;

    gamesGrid.innerHTML = '';
    puzzlesGrid.innerHTML = '';

    games.forEach(g => {
      gamesGrid.appendChild(makeCard(g));
    });
    puzzles.forEach(p => {
      puzzlesGrid.appendChild(makeCard(p));
    });
  }

  function makeCard(item) {
    const card = document.createElement("div");
    card.className = "scenario-card";
    card.innerHTML = `
      <div class="scenario-icon">${item.icon}</div>
      <h3 style="margin:0 0 .5rem 0;">${item.title}</h3>
      <p style="margin:0;color:#64748b;font-size:.9rem;">${item.desc}</p>
    `;
    card.onclick = () => {
      document.getElementById("games-hub-screen").classList.add("hidden");
      item.init();
    };
    return card;
  }

  function showHub() {
    ALL_PLAY_AREAS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });
    document.getElementById("games-hub-screen").classList.remove("hidden");
    // Clear any running timers in sub-games
    if (WordBuilder._clearTimer) WordBuilder._clearTimer();
    if (WordRace._clearTimer) WordRace._clearTimer();
    if (WordSearchGame._clearTimer) WordSearchGame._clearTimer();
  }

  return { init: init, showHub: showHub };
})();


// ══════════════════════════════════════════
// 1. WORD BUILDER
// ══════════════════════════════════════════
var WordBuilder = (function () {
  let round = 0;
  let targetWord = "";
  let timerInterval = null;
  let usedIndices = [];
  let profile = null;
  const TOTAL_ROUNDS = 5;

  function init(p) {
    profile = p;
    round = 0;
    usedIndices = [];
    document.getElementById("game-word-builder").classList.remove("hidden");
    nextRound();
  }

  function nextRound() {
    round++;
    if (round > TOTAL_ROUNDS) { endGame(true); return; }
    document.getElementById("wb-round").textContent = round;

    const dict = _getDict(profile);
    let idx;
    do { idx = Math.floor(Math.random() * dict.length); } while (usedIndices.includes(idx));
    usedIndices.push(idx);
    const wordObj = dict[idx];
    targetWord = wordObj.text;

    document.getElementById("wb-icon").textContent = wordObj.icon;
    document.getElementById("wb-hint").textContent = wordObj.desc;

    // Build slots
    const slotsEl = document.getElementById("wb-slots");
    const lettersEl = document.getElementById("wb-letters");
    slotsEl.innerHTML = '';
    lettersEl.innerHTML = '';

    for (let i = 0; i < targetWord.length; i++) {
      const slot = document.createElement("div");
      slot.className = "wb-slot";
      slot.onclick = () => {
        // click slot to un-place letter
        if (slot.textContent) {
          const char = slot.textContent;
          slot.textContent = '';
          slot.classList.remove("wb-slot-filled");
          // re-show the letter button
          const btns = lettersEl.querySelectorAll("button");
          for (const b of btns) {
            if (b.dataset.char === char && b.style.visibility === "hidden") {
              b.style.visibility = "visible";
              break;
            }
          }
        }
      };
      slotsEl.appendChild(slot);
    }

    const chars = _shuffle(targetWord.split(''));
    chars.forEach(char => {
      const btn = document.createElement("button");
      btn.className = "btn-secondary wb-letter-btn";
      btn.textContent = char;
      btn.dataset.char = char;
      btn.onclick = () => placeLetter(btn, char);
      lettersEl.appendChild(btn);
    });

    // Timer: harder rounds = less time
    let timeLeft = Math.max(15, 35 - round * 3);
    clearInterval(timerInterval);
    document.getElementById("wb-timer").textContent = timeLeft;
    timerInterval = setInterval(() => {
      timeLeft--;
      document.getElementById("wb-timer").textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endGame(false);
      }
    }, 1000);
  }

  function placeLetter(btn, char) {
    const slots = document.getElementById("wb-slots").children;
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].textContent === "") {
        slots[i].textContent = char;
        slots[i].classList.add("wb-slot-filled");
        btn.style.visibility = "hidden";
        checkComplete();
        return;
      }
    }
  }

  function checkComplete() {
    const slots = document.getElementById("wb-slots").children;
    let current = "";
    for (let i = 0; i < slots.length; i++) current += slots[i].textContent;
    if (current.length < targetWord.length) return;

    if (current === targetWord) {
      clearInterval(timerInterval);
      // flash green
      Array.from(slots).forEach(s => s.classList.add("wb-slot-correct"));
      setTimeout(() => {
        Array.from(slots).forEach(s => s.classList.remove("wb-slot-correct"));
        nextRound();
      }, 600);
    } else {
      // wrong: flash red then clear
      Array.from(slots).forEach(s => s.classList.add("wb-slot-wrong"));
      setTimeout(() => {
        Array.from(slots).forEach(s => {
          s.textContent = '';
          s.classList.remove("wb-slot-filled", "wb-slot-wrong");
        });
        const btns = document.getElementById("wb-letters").querySelectorAll("button");
        btns.forEach(b => b.style.visibility = "visible");
      }, 600);
    }
  }

  function endGame(won) {
    clearInterval(timerInterval);
    document.getElementById("game-word-builder").classList.add("hidden");
    if (won) {
      document.getElementById("game-complete-subtitle").textContent =
        `You built all ${TOTAL_ROUNDS} words! Great spelling!`;
      document.getElementById("game-complete").classList.remove("hidden");
      window.handleGameWin(25, 10);
    } else {
      window.GamesHub.showHub();
    }
  }

  function _clearTimer() { clearInterval(timerInterval); }

  return { init, _clearTimer };
})();


// ══════════════════════════════════════════
// 2. WORD SAFARI
// ══════════════════════════════════════════
var WordSafari = (function () {
  let streak = 0;
  let roundNum = 0;
  let profile = null;
  const TOTAL_ROUNDS = 8;

  function init(p) {
    profile = p;
    streak = 0;
    roundNum = 0;
    document.getElementById("game-word-safari").classList.remove("hidden");
    nextRound();
  }

  function nextRound() {
    roundNum++;
    if (roundNum > TOTAL_ROUNDS) { endGame(true); return; }

    document.getElementById("ws-streak").textContent = streak;
    document.getElementById("ws-round").textContent = roundNum;

    const dict = _getDict(profile);
    const shuffled = _shuffle([...dict]);
    const options = shuffled.slice(0, 4);
    const correct = options[Math.floor(Math.random() * 4)];

    document.getElementById("ws-icon").textContent = correct.icon;
    const container = document.getElementById("ws-options");
    container.innerHTML = '';

    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "ws-option-btn";
      btn.textContent = opt.text;
      btn.onclick = () => {
        if (opt.text === correct.text) {
          streak++;
          btn.classList.add("ws-correct");
          setTimeout(() => nextRound(), 500);
        } else {
          btn.classList.add("ws-wrong");
          // Highlight correct
          container.querySelectorAll("button").forEach(b => {
            if (b.textContent === correct.text) b.classList.add("ws-correct");
          });
          streak = 0;
          setTimeout(() => nextRound(), 1200);
        }
        // disable all buttons
        container.querySelectorAll("button").forEach(b => b.disabled = true);
      };
      container.appendChild(btn);
    });
  }

  function endGame(won) {
    document.getElementById("game-word-safari").classList.add("hidden");
    if (won) {
      document.getElementById("game-complete-subtitle").textContent =
        `Safari complete! Best streak: ${streak} 🦁`;
      document.getElementById("game-complete").classList.remove("hidden");
      window.handleGameWin(20, 8);
    } else {
      window.GamesHub.showHub();
    }
  }

  return { init };
})();


// ══════════════════════════════════════════
// 3. WORD RACE
// ══════════════════════════════════════════
var WordRace = (function () {
  let score = 0;
  let timerInterval = null;
  let profile = null;

  function init(p) {
    profile = p;
    score = 0;
    document.getElementById("wr-score").textContent = "0";
    document.getElementById("game-word-race").classList.remove("hidden");

    let timeLeft = 60;
    clearInterval(timerInterval);
    document.getElementById("wr-timer").textContent = timeLeft;

    timerInterval = setInterval(() => {
      timeLeft--;
      document.getElementById("wr-timer").textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endGame();
      }
    }, 1000);

    nextPrompt();
  }

  function nextPrompt() {
    const dict = _getDict(profile);
    const shuffled = _shuffle([...dict]);
    const options = shuffled.slice(0, 4);
    const correct = options[Math.floor(Math.random() * 4)];

    document.getElementById("wr-prompt").textContent = correct.desc;
    const container = document.getElementById("wr-options");
    container.innerHTML = '';

    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "ws-option-btn";
      btn.textContent = opt.text;
      btn.onclick = () => {
        if (opt.text === correct.text) {
          score += 10;
          document.getElementById("wr-score").textContent = score;
          btn.classList.add("ws-correct");
          container.querySelectorAll("button").forEach(b => b.disabled = true);
          setTimeout(nextPrompt, 400);
        } else {
          btn.classList.add("ws-wrong");
          btn.disabled = true;
        }
      };
      container.appendChild(btn);
    });
  }

  function endGame() {
    document.getElementById("game-word-race").classList.add("hidden");
    document.getElementById("game-complete-subtitle").textContent =
      `Time's up! You scored ${score} points ⏱️`;
    document.getElementById("game-complete").classList.remove("hidden");
    if (score > 0) {
      window.handleGameWin(Math.min(score, 50), Math.floor(score / 10));
    }
  }

  function _clearTimer() { clearInterval(timerInterval); }

  return { init, _clearTimer };
})();


// ══════════════════════════════════════════
// 4. WORD SEARCH
// ══════════════════════════════════════════
var WordSearchGame = (function () {
  const GRID_SIZE = 10;
  let grid = [];
  let wordsToFind = [];
  let foundWords = [];
  let hints = 3;
  let timerInterval = null;
  let profile = null;
  let selecting = false;
  let selectStart = null;
  let selectedCells = [];

  function init(p) {
    profile = p;
    foundWords = [];
    hints = 3;
    selecting = false;
    selectStart = null;
    selectedCells = [];

    document.getElementById("game-word-search").classList.remove("hidden");
    document.getElementById("wsr-found").textContent = "0";
    document.getElementById("wsr-hints").textContent = hints;

    const dict = _getDict(profile);
    // Pick 6 short words (≤ GRID_SIZE chars)
    const candidates = _shuffle([...dict]).filter(w => w.text.length <= GRID_SIZE);
    wordsToFind = candidates.slice(0, 6);
    document.getElementById("wsr-total").textContent = wordsToFind.length;

    buildGrid();
    renderWordBank();

    // Timer
    let timeLeft = 120;
    clearInterval(timerInterval);
    document.getElementById("wsr-timer").textContent = timeLeft;
    timerInterval = setInterval(() => {
      timeLeft--;
      document.getElementById("wsr-timer").textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endGame(false);
      }
    }, 1000);

    // Hint button
    document.getElementById("wsr-hint-btn").onclick = giveHint;
  }

  function buildGrid() {
    // Create empty grid
    grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      grid[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) grid[r][c] = '';
    }

    // Place words
    wordsToFind.forEach(wordObj => {
      placeWord(wordObj.text.toUpperCase());
    });

    // Fill empties with random letters
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === '') grid[r][c] = alphabet[Math.floor(Math.random() * 26)];
      }
    }

    renderGrid();
  }

  function placeWord(word) {
    const directions = [
      { dr: 0, dc: 1 },  // horizontal
      { dr: 1, dc: 0 },  // vertical
    ];
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const maxR = GRID_SIZE - (dir.dr * word.length);
      const maxC = GRID_SIZE - (dir.dc * word.length);
      if (maxR <= 0 || maxC <= 0) continue;
      const startR = Math.floor(Math.random() * maxR);
      const startC = Math.floor(Math.random() * maxC);

      let canPlace = true;
      for (let i = 0; i < word.length; i++) {
        const r = startR + dir.dr * i;
        const c = startC + dir.dc * i;
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) { canPlace = false; break; }
      }
      if (canPlace) {
        for (let i = 0; i < word.length; i++) {
          grid[startR + dir.dr * i][startC + dir.dc * i] = word[i];
        }
        placed = true;
      }
    }
  }

  function renderGrid() {
    const gridEl = document.getElementById("wsr-grid");
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = document.createElement("div");
        cell.className = "wsr-cell";
        cell.textContent = grid[r][c];
        cell.dataset.row = r;
        cell.dataset.col = c;

        cell.onpointerdown = (e) => {
          e.preventDefault();
          selecting = true;
          selectStart = { r, c };
          selectedCells = [{ r, c, el: cell }];
          cell.classList.add("wsr-selecting");
        };
        cell.onpointerenter = () => {
          if (!selecting) return;
          // Only allow straight lines (h or v)
          const dr = r - selectStart.r;
          const dc = c - selectStart.c;
          if (dr !== 0 && dc !== 0) return; // diagonal — skip
          selectedCells.forEach(sc => sc.el.classList.remove("wsr-selecting"));
          selectedCells = [];
          const stepR = dr === 0 ? 0 : (dr > 0 ? 1 : -1);
          const stepC = dc === 0 ? 0 : (dc > 0 ? 1 : -1);
          const len = Math.max(Math.abs(dr), Math.abs(dc));
          for (let i = 0; i <= len; i++) {
            const cr = selectStart.r + stepR * i;
            const cc = selectStart.c + stepC * i;
            const el = gridEl.querySelector(`[data-row="${cr}"][data-col="${cc}"]`);
            if (el) { el.classList.add("wsr-selecting"); selectedCells.push({ r: cr, c: cc, el }); }
          }
        };
        cell.onpointerup = () => {
          if (!selecting) return;
          selecting = false;
          checkSelection();
        };

        gridEl.appendChild(cell);
      }
    }
    // Cancel selection if pointer leaves grid
    gridEl.onpointerleave = () => {
      if (selecting) {
        selecting = false;
        selectedCells.forEach(sc => sc.el.classList.remove("wsr-selecting"));
        selectedCells = [];
      }
    };
  }

  function checkSelection() {
    const selectedText = selectedCells.map(sc => grid[sc.r][sc.c]).join('');
    const reversedText = selectedText.split('').reverse().join('');

    let matchedWord = null;
    for (const wordObj of wordsToFind) {
      const upper = wordObj.text.toUpperCase();
      if ((selectedText === upper || reversedText === upper) && !foundWords.includes(upper)) {
        matchedWord = upper;
        break;
      }
    }

    if (matchedWord) {
      foundWords.push(matchedWord);
      selectedCells.forEach(sc => {
        sc.el.classList.remove("wsr-selecting");
        sc.el.classList.add("wsr-found");
      });
      document.getElementById("wsr-found").textContent = foundWords.length;
      // Strike through in word bank
      const bankItems = document.getElementById("wsr-words").children;
      for (const item of bankItems) {
        if (item.dataset.word === matchedWord) {
          item.classList.add("wsr-word-found");
          break;
        }
      }
      if (foundWords.length === wordsToFind.length) {
        clearInterval(timerInterval);
        setTimeout(() => endGame(true), 500);
      }
    } else {
      selectedCells.forEach(sc => sc.el.classList.remove("wsr-selecting"));
    }
    selectedCells = [];
  }

  function renderWordBank() {
    const bank = document.getElementById("wsr-words");
    bank.innerHTML = '';
    wordsToFind.forEach(w => {
      const span = document.createElement("span");
      span.className = "wsr-word-item";
      span.textContent = `${w.icon} ${w.text}`;
      span.dataset.word = w.text.toUpperCase();
      bank.appendChild(span);
    });
  }

  function giveHint() {
    if (hints <= 0) return;
    const remaining = wordsToFind.filter(w => !foundWords.includes(w.text.toUpperCase()));
    if (remaining.length === 0) return;
    const word = remaining[0].text.toUpperCase();
    // Find first letter and flash it
    const gridEl = document.getElementById("wsr-grid");
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === word[0]) {
          const cell = gridEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
          if (cell && !cell.classList.contains("wsr-found")) {
            cell.classList.add("wsr-hint-flash");
            setTimeout(() => cell.classList.remove("wsr-hint-flash"), 1500);
            hints--;
            document.getElementById("wsr-hints").textContent = hints;
            return;
          }
        }
      }
    }
  }

  function endGame(won) {
    clearInterval(timerInterval);
    document.getElementById("game-word-search").classList.add("hidden");
    if (won) {
      document.getElementById("game-complete-subtitle").textContent =
        `You found all ${wordsToFind.length} words! 🔍`;
      document.getElementById("game-complete").classList.remove("hidden");
      window.handleGameWin(20, 8);
    } else {
      window.GamesHub.showHub();
    }
  }

  function _clearTimer() { clearInterval(timerInterval); }

  return { init, _clearTimer };
})();


// ══════════════════════════════════════════
// 5. VOCABULARY CROSSWORD
// ══════════════════════════════════════════
var CrosswordGame = (function () {
  let words = [];
  let gridData = [];
  let gridSize = 0;
  let placements = [];
  let profile = null;

  function init(p) {
    profile = p;
    document.getElementById("game-crossword").classList.remove("hidden");

    const dict = _getDict(profile);
    // Pick 4 short words for a simple crossword
    const candidates = _shuffle([...dict]).filter(w => w.text.length >= 2 && w.text.length <= 8);
    words = candidates.slice(0, 4);

    buildCrossword();

    document.getElementById("cw-check-btn").onclick = checkAnswers;
  }

  function buildCrossword() {
    // Simple layout: place words alternating horizontal/vertical
    placements = [];
    gridSize = 12;
    gridData = [];
    for (let r = 0; r < gridSize; r++) {
      gridData[r] = [];
      for (let c = 0; c < gridSize; c++) gridData[r][c] = null;
    }

    // Place first word horizontally in the middle
    const w0 = words[0].text.toUpperCase();
    const startC = Math.floor((gridSize - w0.length) / 2);
    const startR = Math.floor(gridSize / 2);
    for (let i = 0; i < w0.length; i++) {
      gridData[startR][startC + i] = { letter: w0[i], wordIdx: [0] };
    }
    placements.push({ word: w0, r: startR, c: startC, dir: 'h', clue: words[0].desc });

    // Place second word vertically, intersecting first word if possible
    if (words.length > 1) {
      const w1 = words[1].text.toUpperCase();
      let placed = false;
      for (let i = 0; i < w0.length && !placed; i++) {
        for (let j = 0; j < w1.length && !placed; j++) {
          if (w0[i] === w1[j]) {
            const r = startR - j;
            const c = startC + i;
            if (r >= 0 && r + w1.length <= gridSize) {
              let canPlace = true;
              for (let k = 0; k < w1.length; k++) {
                const cell = gridData[r + k][c];
                if (cell && cell.letter !== w1[k]) { canPlace = false; break; }
              }
              if (canPlace) {
                for (let k = 0; k < w1.length; k++) {
                  if (gridData[r + k][c]) gridData[r + k][c].wordIdx.push(1);
                  else gridData[r + k][c] = { letter: w1[k], wordIdx: [1] };
                }
                placements.push({ word: w1, r, c, dir: 'v', clue: words[1].desc });
                placed = true;
              }
            }
          }
        }
      }
      // Fallback: place independently
      if (!placed) {
        const fr = 1;
        const fc = 1;
        for (let k = 0; k < w1.length && fr + k < gridSize; k++) {
          gridData[fr + k][fc] = { letter: w1[k], wordIdx: [1] };
        }
        placements.push({ word: w1, r: fr, c: fc, dir: 'v', clue: words[1].desc });
      }
    }

    // Place remaining words horizontally on different rows
    for (let wi = 2; wi < words.length; wi++) {
      const w = words[wi].text.toUpperCase();
      const row = wi === 2 ? 2 : gridSize - 3;
      const col = Math.floor((gridSize - w.length) / 2);
      for (let k = 0; k < w.length && col + k < gridSize; k++) {
        if (gridData[row][col + k]) gridData[row][col + k].wordIdx.push(wi);
        else gridData[row][col + k] = { letter: w[k], wordIdx: [wi] };
      }
      placements.push({ word: w, r: row, c: col, dir: 'h', clue: words[wi].desc });
    }

    renderCrossword();
  }

  function renderCrossword() {
    const gridEl = document.getElementById("cw-grid");
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = document.createElement("div");
        cell.className = "cw-cell";
        if (gridData[r][c]) {
          cell.classList.add("cw-cell-active");
          const input = document.createElement("input");
          input.type = "text";
          input.maxLength = 1;
          input.className = "cw-input";
          input.dataset.row = r;
          input.dataset.col = c;
          input.dataset.answer = gridData[r][c].letter;
          input.onfocus = () => {
            const wi = gridData[r][c].wordIdx[0];
            document.getElementById("cw-clue").textContent =
              `${placements[wi].dir === 'h' ? '→' : '↓'} ${placements[wi].clue}`;
            highlightWord(wi);
          };
          input.oninput = () => {
            input.value = input.value.toUpperCase();
            // Auto-advance to next input
            const next = getNextInput(r, c);
            if (next) next.focus();
          };
          cell.appendChild(input);

          // Number label for first cell of each word
          for (const wi of gridData[r][c].wordIdx) {
            if (placements[wi].r === r && placements[wi].c === c) {
              const num = document.createElement("span");
              num.className = "cw-number";
              num.textContent = wi + 1;
              cell.appendChild(num);
            }
          }
        } else {
          cell.classList.add("cw-cell-empty");
        }
        gridEl.appendChild(cell);
      }
    }
  }

  function highlightWord(wi) {
    // Remove all highlights
    document.querySelectorAll(".cw-highlight").forEach(el => el.classList.remove("cw-highlight"));
    const p = placements[wi];
    for (let i = 0; i < p.word.length; i++) {
      const r = p.dir === 'v' ? p.r + i : p.r;
      const c = p.dir === 'h' ? p.c + i : p.c;
      const input = document.querySelector(`.cw-input[data-row="${r}"][data-col="${c}"]`);
      if (input) input.parentElement.classList.add("cw-highlight");
    }
  }

  function getNextInput(r, c) {
    const wi = gridData[r][c].wordIdx[0];
    const p = placements[wi];
    const nr = p.dir === 'v' ? r + 1 : r;
    const nc = p.dir === 'h' ? c + 1 : c;
    return document.querySelector(`.cw-input[data-row="${nr}"][data-col="${nc}"]`);
  }

  function checkAnswers() {
    const inputs = document.querySelectorAll(".cw-input");
    let allCorrect = true;
    inputs.forEach(input => {
      if (input.value.toUpperCase() === input.dataset.answer) {
        input.parentElement.classList.add("cw-correct");
        input.parentElement.classList.remove("cw-wrong");
      } else {
        input.parentElement.classList.add("cw-wrong");
        input.parentElement.classList.remove("cw-correct");
        allCorrect = false;
      }
    });

    if (allCorrect) {
      setTimeout(() => {
        document.getElementById("game-crossword").classList.add("hidden");
        document.getElementById("game-complete-subtitle").textContent =
          "Crossword complete! Great vocabulary! 🧩";
        document.getElementById("game-complete").classList.remove("hidden");
        window.handleGameWin(30, 12);
      }, 800);
    }
  }

  return { init };
})();
