/**
 * curriculum-content.js — Unified Curriculum Content Registry
 *
 * Provides offline, zero-latency access to 5,250 hardcoded questions
 * across 7 languages, 3 levels, and 5 skill tracks.
 * Completely eliminates Gemini AI generation & Firestore caching.
 */

window.CURRICULUM_LESSONS_CONTENT = {
  en: window.CURRICULUM_LESSONS_EN || {},
  hi: window.CURRICULUM_LESSONS_HI || {},
  ta: window.CURRICULUM_LESSONS_TA || {},
  te: window.CURRICULUM_LESSONS_TE || {},
  kn: window.CURRICULUM_LESSONS_KN || {},
  bn: window.CURRICULUM_LESSONS_BN || {},
  mr: window.CURRICULUM_LESSONS_MR || {}
};

/**
 * Sanitizes and enriches MCQ exercises to guarantee realistic options,
 * no placeholder text ('Incorrect Option'), and proper option shuffling.
 */
function sanitizeCurriculumExercises(exerciseList, lang, level, skill) {
  if (!Array.isArray(exerciseList)) return exerciseList;

  return exerciseList.map((ex, qIdx) => {
    if ((skill === "reading" || skill === "listening") && Array.isArray(ex.options)) {
      const hasPlaceholder = ex.options.some(
        opt => typeof opt === "string" && (opt.toLowerCase().includes("incorrect option") || opt.toLowerCase().includes("wrong option"))
      );

      if (hasPlaceholder) {
        const correctText = ex.translation || ex.questionTranslation || ex.content;
        const otherPool = exerciseList
          .map(e => e.translation || e.questionTranslation || e.content)
          .filter(t => t && t !== correctText);

        const uniqueOthers = Array.from(new Set(otherPool));
        const dist1 = uniqueOthers[0] || "The sun rises in the east";
        const dist2 = uniqueOthers[1] || "She reads good books daily";
        const dist3 = uniqueOthers[2] || "We all drink clean water daily";

        const rawOpts = [correctText, dist1, dist2, dist3];
        // Deterministic pseudo-random shuffle based on index so it stays consistent
        const order = [(qIdx * 3 + 1) % 4, (qIdx * 3 + 2) % 4, (qIdx * 3 + 3) % 4, (qIdx * 3) % 4];
        const seen = new Set();
        const shuffled = [];
        for (const idx of order) {
          if (!seen.has(idx) && rawOpts[idx]) {
            seen.add(idx);
            shuffled.push(rawOpts[idx]);
          }
        }
        rawOpts.forEach((opt, idx) => {
          if (!seen.has(idx)) shuffled.push(opt);
        });

        const newAnsIdx = Math.max(0, shuffled.indexOf(correctText));

        return {
          ...ex,
          question: skill === "reading" ? "What is the meaning of this sentence?" : "What did the speaker say?",
          options: shuffled,
          answerIndex: newAnsIdx,
          explanation: `The correct meaning is: '${correctText}'.`
        };
      }
    }
    return ex;
  });
}

/**
 * getCurriculumLessonExercises(lang, level, skill, lessonIndex)
 * Retrieves the 10 hardcoded exercises for the requested lesson slot.
 */
function getCurriculumLessonExercises(lang, level, skill, lessonIndex) {
  const langKey = lang || "en";
  const lvlKey = level || "beginner";
  const skillKey = skill || "reading";
  const lIdx = parseInt(lessonIndex, 10) || 1;

  // 1. Try requested language pack
  const pack = (window.CURRICULUM_LESSONS_CONTENT && window.CURRICULUM_LESSONS_CONTENT[langKey]) ||
               (window[`CURRICULUM_LESSONS_${langKey.toUpperCase()}`]) || {};
  const questions = pack[lvlKey]?.[skillKey]?.[lIdx];
  if (questions && Array.isArray(questions) && questions.length > 0) {
    return sanitizeCurriculumExercises(questions, langKey, lvlKey, skillKey);
  }

  // 2. Fallback to English pack if language missing
  const enPack = (window.CURRICULUM_LESSONS_CONTENT && window.CURRICULUM_LESSONS_CONTENT["en"]) ||
                 window.CURRICULUM_LESSONS_EN || {};
  const enQuestions = enPack[lvlKey]?.[skillKey]?.[lIdx];
  if (enQuestions && Array.isArray(enQuestions) && enQuestions.length > 0) {
    return sanitizeCurriculumExercises(enQuestions, "en", lvlKey, skillKey);
  }

  // 3. Fallback to default questions generator
  return [];
}

window.getCurriculumLessonExercises = getCurriculumLessonExercises;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getCurriculumLessonExercises };
}
