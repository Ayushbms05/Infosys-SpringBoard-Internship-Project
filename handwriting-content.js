/**
 * handwriting-content.js — Content Blueprint for Handwriting Practice
 *
 * Supports all 7 official platform languages:
 * English (en), Hindi (hi), Tamil (ta), Telugu (te), Kannada (kn), Bengali (bn), Marathi (mr).
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
  },

  // ── TAMIL CONTENT ────────────────────────────────────────────────
  ta: {
    alphabets: [
      { id: "ta_a", display: "அ" }, { id: "ta_aa", display: "ஆ" }, { id: "ta_i", display: "இ" },
      { id: "ta_ee", display: "ஈ" }, { id: "ta_u", display: "உ" }, { id: "ta_oo", display: "ஊ" },
      { id: "ta_e", display: "எ" }, { id: "ta_ae", display: "ஏ" }, { id: "ta_ai", display: "ஐ" },
      { id: "ta_o", display: "ஒ" }, { id: "ta_oa", display: "ஓ" }, { id: "ta_au", display: "ஔ" },
      { id: "ta_ka", display: "க" }, { id: "ta_nga", display: "ங" }, { id: "ta_sa", display: "ச" },
      { id: "ta_nya", display: "ஞ" }, { id: "ta_ta", display: "த" }, { id: "ta_na", display: "ந" },
      { id: "ta_pa", display: "ப" }, { id: "ta_ma", display: "ம" }, { id: "ta_ya", display: "ய" },
      { id: "ta_ra", display: "ர" }, { id: "ta_la", display: "ல" }, { id: "ta_va", display: "வ" }
    ],
    numbers: [
      { id: "ta_0", display: "௦" }, { id: "ta_1", display: "௧" }, { id: "ta_2", display: "௨" },
      { id: "ta_3", display: "௩" }, { id: "ta_4", display: "௪" }, { id: "ta_5", display: "௫" },
      { id: "ta_6", display: "௬" }, { id: "ta_7", display: "௭" }, { id: "ta_8", display: "௮" },
      { id: "ta_9", display: "௯" }
    ],
    commonWords: [
      { id: "ta_vanakkam", display: "வணக்கம்" },
      { id: "ta_thanneer", display: "தண்ணீர்" },
      { id: "ta_veedu", display: "வீடு" },
      { id: "ta_amma", display: "அம்மா" },
      { id: "ta_nool", display: "நூல்" },
      { id: "ta_palli", display: "பள்ளி" },
      { id: "ta_nanban", display: "நண்பன்" },
      { id: "ta_unavu", display: "உணவு" },
      { id: "ta_panam", display: "பணம்" },
      { id: "ta_magizhchi", display: "மகிழ்ச்சி" }
    ]
  },

  // ── TELUGU CONTENT ───────────────────────────────────────────────
  te: {
    alphabets: [
      { id: "te_a", display: "అ" }, { id: "te_aa", display: "ఆ" }, { id: "te_i", display: "ఇ" },
      { id: "te_ee", display: "ఈ" }, { id: "te_u", display: "ఉ" }, { id: "te_oo", display: "ఊ" },
      { id: "te_e", display: "ఎ" }, { id: "te_ae", display: "ఏ" }, { id: "te_ai", display: "ఐ" },
      { id: "te_o", display: "ఒ" }, { id: "te_oa", display: "ఓ" }, { id: "te_au", display: "ఔ" },
      { id: "te_ka", display: "క" }, { id: "te_ga", display: "గ" }, { id: "te_cha", display: "చ" },
      { id: "te_ja", display: "జ" }, { id: "te_ta", display: "త" }, { id: "te_da", display: "ద" },
      { id: "te_na", display: "న" }, { id: "te_pa", display: "ప" }, { id: "te_ma", display: "మ" },
      { id: "te_ya", display: "య" }, { id: "te_ra", display: "ర" }, { id: "te_la", display: "ల" }
    ],
    numbers: [
      { id: "te_0", display: "౦" }, { id: "te_1", display: "౧" }, { id: "te_2", display: "౨" },
      { id: "te_3", display: "౩" }, { id: "te_4", display: "౪" }, { id: "te_5", display: "౫" },
      { id: "te_6", display: "౬" }, { id: "te_7", display: "౭" }, { id: "te_8", display: "౮" },
      { id: "te_9", display: "౯" }
    ],
    commonWords: [
      { id: "te_namaskaram", display: "నమస్కారం" },
      { id: "te_neellu", display: "నీళ్లు" },
      { id: "te_illu", display: "ఇల్లు" },
      { id: "te_amma", display: "అమ్మ" },
      { id: "te_pusthakam", display: "పుస్తకం" },
      { id: "te_badi", display: "బడి" },
      { id: "te_snehithudu", display: "స్నేహితుడు" },
      { id: "te_annam", display: "అన్నం" },
      { id: "te_dabbu", display: "డబ్బు" },
      { id: "te_santhosham", display: "సంతోషం" }
    ]
  },

  // ── KANNADA CONTENT ──────────────────────────────────────────────
  kn: {
    alphabets: [
      { id: "kn_a", display: "ಅ" }, { id: "kn_aa", display: "ಆ" }, { id: "kn_i", display: "ಇ" },
      { id: "kn_ee", display: "ಈ" }, { id: "kn_u", display: "ಉ" }, { id: "kn_oo", display: "ಊ" },
      { id: "kn_e", display: "ಎ" }, { id: "kn_ae", display: "ಏ" }, { id: "kn_ai", display: "ಐ" },
      { id: "kn_o", display: "ಒ" }, { id: "kn_oa", display: "ಓ" }, { id: "kn_au", display: "ಔ" },
      { id: "kn_ka", display: "ಕ" }, { id: "kn_ga", display: "ಗ" }, { id: "kn_cha", display: "ಚ" },
      { id: "kn_ja", display: "ಜ" }, { id: "kn_ta", display: "ತ" }, { id: "kn_da", display: "ದ" },
      { id: "kn_na", display: "ನ" }, { id: "kn_pa", display: "ಪ" }, { id: "kn_ma", display: "ಮ" },
      { id: "kn_ya", display: "ಯ" }, { id: "kn_ra", display: "ರ" }, { id: "kn_la", display: "ಲ" }
    ],
    numbers: [
      { id: "kn_0", display: "೦" }, { id: "kn_1", display: "೧" }, { id: "kn_2", display: "೨" },
      { id: "kn_3", display: "೩" }, { id: "kn_4", display: "೪" }, { id: "kn_5", display: "೫" },
      { id: "kn_6", display: "೬" }, { id: "kn_7", display: "೭" }, { id: "kn_8", display: "೮" },
      { id: "kn_9", display: "೯" }
    ],
    commonWords: [
      { id: "kn_namaskara", display: "ನಮಸ್ಕಾರ" },
      { id: "kn_neeru", display: "ನೀರು" },
      { id: "kn_mane", display: "ಮನೆ" },
      { id: "kn_amma", display: "ಅಮ್ಮ" },
      { id: "kn_pusthaka", display: "ಪುಸ್ತಕ" },
      { id: "kn_shaale", display: "ಶಾಲೆ" },
      { id: "kn_snehitha", display: "ಸ್ನೇಹಿತ" },
      { id: "kn_oota", display: "ಊಟ" },
      { id: "kn_hana", display: "ಹಣ" },
      { id: "kn_santhosha", display: "ಸಂತೋಷ" }
    ]
  },

  // ── BENGALI CONTENT ──────────────────────────────────────────────
  bn: {
    alphabets: [
      { id: "bn_a", display: "অ" }, { id: "bn_aa", display: "আ" }, { id: "bn_i", display: "ই" },
      { id: "bn_ee", display: "ঈ" }, { id: "bn_u", display: "উ" }, { id: "bn_oo", display: "ঊ" },
      { id: "bn_e", display: "এ" }, { id: "bn_ai", display: "ঐ" }, { id: "bn_o", display: "ও" },
      { id: "bn_au", display: "ঔ" }, { id: "bn_ka", display: "ক" }, { id: "bn_kha", display: "খ" },
      { id: "bn_ga", display: "গ" }, { id: "bn_gha", display: "ঘ" }, { id: "bn_cha", display: "চ" },
      { id: "bn_ja", display: "জ" }, { id: "bn_ta", display: "ত" }, { id: "bn_da", display: "দ" },
      { id: "bn_na", display: "ন" }, { id: "bn_pa", display: "প" }, { id: "bn_ma", display: "ম" },
      { id: "bn_ra", display: "র" }, { id: "bn_la", display: "ল" }, { id: "bn_sa", display: "স" }
    ],
    numbers: [
      { id: "bn_0", display: "০" }, { id: "bn_1", display: "১" }, { id: "bn_2", display: "২" },
      { id: "bn_3", display: "৩" }, { id: "bn_4", display: "৪" }, { id: "bn_5", display: "৫" },
      { id: "bn_6", display: "৬" }, { id: "bn_7", display: "৭" }, { id: "bn_8", display: "৮" },
      { id: "bn_9", display: "৯" }
    ],
    commonWords: [
      { id: "bn_nomoshkar", display: "নমস্কার" },
      { id: "bn_jol", display: "জল" },
      { id: "bn_bari", display: "বাড়ি" },
      { id: "bn_maa", display: "মা" },
      { id: "bn_boi", display: "বই" },
      { id: "bn_biddaloy", display: "বিদ্যালয়" },
      { id: "bn_bondhu", display: "বন্ধু" },
      { id: "bn_khabar", display: "খাবার" },
      { id: "bn_taka", display: "টাকা" },
      { id: "bn_anondo", display: "আনন্দ" }
    ]
  },

  // ── MARATHI CONTENT ──────────────────────────────────────────────
  mr: {
    alphabets: [
      { id: "mr_a", display: "अ" }, { id: "mr_aa", display: "आ" }, { id: "mr_i", display: "इ" },
      { id: "mr_ee", display: "ई" }, { id: "mr_u", display: "उ" }, { id: "mr_oo", display: "ऊ" },
      { id: "mr_e", display: "ए" }, { id: "mr_ai", display: "ऐ" }, { id: "mr_o", display: "ओ" },
      { id: "mr_au", display: "औ" }, { id: "mr_ka", display: "क" }, { id: "mr_kha", display: "ख" },
      { id: "mr_ga", display: "ग" }, { id: "mr_gha", display: "घ" }, { id: "mr_cha", display: "च" },
      { id: "mr_ja", display: "ज" }, { id: "mr_ta", display: "त" }, { id: "mr_da", display: "द" },
      { id: "mr_na", display: "न" }, { id: "mr_pa", display: "प" }, { id: "mr_ma", display: "म" },
      { id: "mr_ya", display: "य" }, { id: "mr_ra", display: "र" }, { id: "mr_la", display: "ल" },
      { id: "mr_va", display: "व" }, { id: "mr_sa", display: "स" }, { id: "mr_laa", display: "ळ" }
    ],
    numbers: [
      { id: "mr_0", display: "०" }, { id: "mr_1", display: "१" }, { id: "mr_2", display: "२" },
      { id: "mr_3", display: "३" }, { id: "mr_4", display: "४" }, { id: "mr_5", display: "५" },
      { id: "mr_6", display: "६" }, { id: "mr_7", display: "७" }, { id: "mr_8", display: "८" },
      { id: "mr_9", display: "९" }
    ],
    commonWords: [
      { id: "mr_namaskar", display: "नमस्कार" },
      { id: "mr_paani", display: "पाणी" },
      { id: "mr_ghar", display: "घर" },
      { id: "mr_aai", display: "आई" },
      { id: "mr_pustak", display: "पुस्तक" },
      { id: "mr_shala", display: "शाळा" },
      { id: "mr_mitra", display: "मित्र" },
      { id: "mr_jevan", display: "जेवण" },
      { id: "mr_paise", display: "पैसे" },
      { id: "mr_anand", display: "आनंद" }
    ]
  }
};
