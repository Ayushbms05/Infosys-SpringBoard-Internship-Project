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
    return questions;
  }

  // 2. Fallback to English pack if language missing
  const enPack = (window.CURRICULUM_LESSONS_CONTENT && window.CURRICULUM_LESSONS_CONTENT["en"]) ||
                 window.CURRICULUM_LESSONS_EN || {};
  const enQuestions = enPack[lvlKey]?.[skillKey]?.[lIdx];
  if (enQuestions && Array.isArray(enQuestions) && enQuestions.length > 0) {
    return enQuestions;
  }

  // 3. Fallback to default questions generator
  return [];
}

window.getCurriculumLessonExercises = getCurriculumLessonExercises;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getCurriculumLessonExercises };
}
