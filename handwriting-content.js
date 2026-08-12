/**
 * handwriting-content.js — Content Blueprint for Handwriting Practice
 *
 * Fully isolated from lesson.js, units.js, and Firestore content collections.
 * Supports English and Hindi scripts so learners can practice letter, number,
 * and word tracing in either language based on their target language.
 */

const HANDWRITING_CONTENT = {
  // ── ENGLISH CONTENT ──────────────────────────────────────────────
  en: {
    alphabets: [
      { id: "en_a", display: "A" }, { id: "en_b", display: "B" }, { id: "en_c", display: "C" },
      { id: "en_d", display: "D" }, { id: "en_e", display: "E" }, { id: "en_f", display: "F" },
      { id: "en_g", display: "G" }, { id: "en_h", display: "H" }, { id: "en_i", display: "I" },
      { id: "en_j", display: "J" }, { id: "en_k", display: "K" }, { id: "en_l", display: "L" },
      { id: "en_m", display: "M" }, { id: "en_n", display: "N" }, { id: "en_o", display: "O" },
      { id: "en_p", display: "P" }, { id: "en_q", display: "Q" }, { id: "en_r", display: "R" },
      { id: "en_s", display: "S" }, { id: "en_t", display: "T" }, { id: "en_u", display: "U" },
      { id: "en_v", display: "V" }, { id: "en_w", display: "W" }, { id: "en_x", display: "X" },
      { id: "en_y", display: "Y" }, { id: "en_z", display: "Z" }
    ],
    numbers: [
      { id: "en_0", display: "0" }, { id: "en_1", display: "1" }, { id: "en_2", display: "2" },
      { id: "en_3", display: "3" }, { id: "en_4", display: "4" }, { id: "en_5", display: "5" },
      { id: "en_6", display: "6" }, { id: "en_7", display: "7" }, { id: "en_8", display: "8" },
      { id: "en_9", display: "9" }
    ],
    commonWords: [
      { id: "en_hello", display: "Hello" },
      { id: "en_water", display: "Water" },
      { id: "en_food", display: "Food" },
      { id: "en_family", display: "Family" },
      { id: "en_book", display: "Book" },
      { id: "en_school", display: "School" },
      { id: "en_house", display: "House" },
      { id: "en_friend", display: "Friend" },
      { id: "en_money", display: "Money" },
      { id: "en_happy", display: "Happy" }
    ]
  },

  // ── HINDI CONTENT ────────────────────────────────────────────────
  hi: {
    alphabets: [
      { id: "hi_a", display: "अ" }, { id: "hi_aa", display: "आ" }, { id: "hi_i", display: "इ" },
      { id: "hi_ee", display: "ई" }, { id: "hi_u", display: "उ" }, { id: "hi_oo", display: "ऊ" },
      { id: "hi_e", display: "ए" }, { id: "hi_ai", display: "ऐ" }, { id: "hi_o", display: "ओ" },
      { id: "hi_au", display: "औ" }, { id: "hi_ka", display: "क" }, { id: "hi_kha", display: "ख" },
      { id: "hi_ga", display: "ग" }, { id: "hi_gha", display: "घ" }, { id: "hi_cha", display: "च" },
      { id: "hi_ja", display: "ज" }, { id: "hi_ta", display: "त" }, { id: "hi_da", display: "द" },
      { id: "hi_na", display: "न" }, { id: "hi_pa", display: "प" }, { id: "hi_ma", display: "म" },
      { id: "hi_ya", display: "य" }, { id: "hi_ra", display: "र" }, { id: "hi_la", display: "ल" },
      { id: "hi_va", display: "व" }, { id: "hi_sa", display: "स" }
    ],
    numbers: [
      { id: "hi_0", display: "०" }, { id: "hi_1", display: "१" }, { id: "hi_2", display: "२" },
      { id: "hi_3", display: "३" }, { id: "hi_4", display: "४" }, { id: "hi_5", display: "५" },
      { id: "hi_6", display: "६" }, { id: "hi_7", display: "७" }, { id: "hi_8", display: "८" },
      { id: "hi_9", display: "९" }
    ],
    commonWords: [
      { id: "hi_namaste", display: "नमस्ते" },
      { id: "hi_jal", display: "जल" },
      { id: "hi_ghar", display: "घर" },
      { id: "hi_maa", display: "माँ" },
      { id: "hi_kitab", display: "किताब" },
      { id: "hi_school", display: "स्कूल" },
      { id: "hi_mitra", display: "मित्र" },
      { id: "hi_roti", display: "रोटी" },
      { id: "hi_fal", display: "फल" },
      { id: "hi_kaam", display: "काम" }
    ]
  }
};
