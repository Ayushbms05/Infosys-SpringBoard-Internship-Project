/**
 * auth.js — All Firebase Authentication and Firestore logic.
 *
 * This file contains the core functions:
 *   1. registerUser()         — creates a new account + saves profile to Firestore
 *   2. loginUser()            — signs in an existing user
 *   3. logoutUser()           — signs out the current user
 *   4. getCurrentUser()       — returns the currently signed-in user
 *   5. getUserProfile(uid)    — fetches profile from Firestore
 *   6. getUserProgress(uid)   — fetches profile + progress data
 *   7. saveAssessmentResults() — saves assessment score/level
 *   8. updateUserProgress()   — updates learning progress fields
 *   9. updateStreak()         — checks and updates daily streak
 *   10. addXP()               — adds practice points
 *   11. completeLesson()      — marks a lesson as completed
 *   12. updateUserProfile()   — updates editable profile fields (Profile page)
 *   13. awardBadge()          — adds a badge to the user's badgesEarned array
 *   14. savePracticeDay()     — records today's date in practiceDays array
 *   15. mapFirebaseError()    — translates Firebase error codes
 *
 * IMPORTANT: This file depends on firebase-config.js being loaded FIRST
 * (in the HTML <script> tags), because it uses the `auth` and `db`
 * variables that firebase-config.js creates.
 */


// ────────────────────────────────────────────────────────────────
// registerUser(fullName, email, password, preferredLang, motherTongue, ageGroup, literacyLevel)
// ────────────────────────────────────────────────────────────────
// WHAT: Creates a brand-new user account with Firebase Authentication,
//       then saves extra profile info into Cloud Firestore.
//
// WHY two steps?
//   Firebase Auth only stores email + password. We need Firestore to
//   save the user's name, language preference, literacy level, etc.
//
// NOTE: The field is now "literacyLevel" (not "educationLevel").
//       This stores functional literacy self-assessment:
//       neverLearned, canRecognize, canReadSimple, canReadComfort, preferNot
//
// RETURNS: A Promise that resolves on success or rejects with an error.
// ────────────────────────────────────────────────────────────────
function registerUser(fullName, email, password, preferredLang, targetLang, motherTongue, ageGroup, literacyLevel) {
  return auth.createUserWithEmailAndPassword(email, password)
    .then(function (userCredential) {
      var user = userCredential.user;
      return db.collection("users").doc(user.uid).set({
        uid:               user.uid,
        fullName:          fullName,
        email:             email,
        preferredLanguage: preferredLang,
        targetLanguage:    targetLang || "",
        motherTongue:      motherTongue || "",
        ageGroup:          ageGroup || "",
        literacyLevel:     literacyLevel || "",
        badgesEarned:      [],
        practiceDays:      [],
        inventory:         [],
        activeTheme:       "default",
        streakFreezes:     0,
        gamesCompleted:    0,
        coins:             0,
        dailyQuests:       [],
        questDate:         "",
        createdAt:         firebase.firestore.FieldValue.serverTimestamp()
      });
    });
}


// ────────────────────────────────────────────────────────────────
// loginUser(email, password)
// ────────────────────────────────────────────────────────────────
// WHAT: Signs in an existing user with their email and password.
//
// WHY: Firebase checks the email/password combo on its servers.
//      If correct, it returns the user object; if not, it throws an error.
//
// RETURNS: A Promise that resolves with the userCredential on success,
//          or rejects with an error (wrong password, user not found, etc.).
// ────────────────────────────────────────────────────────────────
function loginUser(email, password) {
  return auth.signInWithEmailAndPassword(email, password).then(function (userCredential) {
    var user = userCredential.user;
    return db.collection("users").doc(user.uid).get().then(function (doc) {
      if (!doc.exists) {
        // User was deleted from Firestore (e.g. by admin) but Auth still exists.
        // We must clean up the Auth session and reject so the user sees an error.
        var cleanupErr = new Error("Your account has been deleted. Please register again.");
        cleanupErr.code = "auth/user-not-found";

        // Try to fully delete the orphaned Auth account.
        // If that fails, just sign out so they aren't stuck authenticated.
        var cleanup = user.delete().catch(function () {
          return auth.signOut();
        });

        return cleanup.then(function () {
          return Promise.reject(cleanupErr);
        });
      }

      if (doc.data().isBanned === true) {
        return auth.signOut().then(function () {
          var err = new Error("This account has been suspended.");
          err.code = "auth/user-disabled";
          return Promise.reject(err);
        });
      }
      return userCredential;
    });
  });
}


// ────────────────────────────────────────────────────────────────
// logoutUser()
// ────────────────────────────────────────────────────────────────
// WHAT: Signs the current user out of Firebase.
// WHY:  We call this from the dashboard "Logout" button.
// ────────────────────────────────────────────────────────────────
function logoutUser() {
  return auth.signOut();
}


// ────────────────────────────────────────────────────────────────
// getCurrentUser()
// ────────────────────────────────────────────────────────────────
// WHAT: Returns the currently signed-in user, or null if nobody is signed in.
// WHY:  The dashboard page uses this to check if someone is actually logged in.
// ────────────────────────────────────────────────────────────────
function getCurrentUser() {
  return auth.currentUser;
}


// ────────────────────────────────────────────────────────────────
// getUserProfile(uid)
// ────────────────────────────────────────────────────────────────
// WHAT: Fetches the user's profile document from the Firestore "users" collection.
// WHY:  Firebase Auth only knows email + uid. To get the full name,
//       preferred language, etc., we need to read from Firestore.
//
// NOTE: Handles migration from old "educationLevel" field to new "literacyLevel".
//       If user has educationLevel but no literacyLevel, maps it automatically.
//
// RETURNS: A Promise that resolves with the document data object,
//          or null if no document was found.
// ────────────────────────────────────────────────────────────────
function getUserProfile(uid) {
  return db.collection("users").doc(uid).get()
    .then(function (doc) {
      // doc.exists is true if a document with that uid was found
      if (doc.exists) {
        var data = doc.data();

        // ─── Migration: educationLevel → literacyLevel ─────────
        // If user registered before the literacy level update,
        // they'll have educationLevel but no literacyLevel.
        // Auto-map the old values to the closest new equivalents.
        if (!data.literacyLevel && data.educationLevel) {
          var migrationMap = {
            none:      "neverLearned",    // No formal education → never learned
            primary:   "canRecognize",    // Primary school → can recognize some
            middle:    "canReadSimple",   // Middle school → can read simple sentences
            high:      "canReadComfort",  // High school → comfortable reading
            higherSec: "canReadComfort",  // Higher secondary → comfortable
            graduate:  "canReadComfort"   // Graduate → comfortable
          };
          data.literacyLevel = migrationMap[data.educationLevel] || "preferNot";

          // Save the migrated value back to Firestore (fire-and-forget)
          db.collection("users").doc(uid).update({
            literacyLevel: data.literacyLevel
          }).catch(function() { /* silent */ });
        }

        // Ensure new fields exist with defaults
        if (!data.badgesEarned) data.badgesEarned = [];
        if (!data.practiceDays) data.practiceDays = [];

        return data;
      } else {
        return null; // No profile found (shouldn't happen, but just in case)
      }
    });
}


// ────────────────────────────────────────────────────────────────
// saveAssessmentResults(uid, scorePercent, level)
// ────────────────────────────────────────────────────────────────
// WHAT: Updates the user's document in Firestore to indicate they
//       completed the assessment, and saves their score/level.
// ────────────────────────────────────────────────────────────────
function saveAssessmentResults(uid, scorePercent, level) {
  return db.collection("users").doc(uid).update({
    assessmentCompleted: true,
    assessmentScore: scorePercent,
    assessmentLevel: level,
    assessmentDate: firebase.firestore.FieldValue.serverTimestamp()
  });
}


// ────────────────────────────────────────────────────────────────
// mapFirebaseError(errorCode, langCode)
// ────────────────────────────────────────────────────────────────
// WHAT: Converts Firebase's internal error codes (like "auth/email-already-in-use")
//       into our own friendly, TRANSLATED error message keys.
//
// WHY:  Firebase error codes are in English and technical. Our users may
//       not read English, so we map each code to a key in translations.js
//       and then call getTranslation() to get the right language string.
//
// RETURNS: A human-readable, translated error string.
// ────────────────────────────────────────────────────────────────
function mapFirebaseError(errorCode, langCode) {
  // Map Firebase error codes → our translation keys
  var errorMap = {
    "auth/email-already-in-use":  "errEmailInUse",
    "auth/weak-password":         "errWeakPassword",
    "auth/user-not-found":        "errUserNotFound",
    "auth/wrong-password":        "errWrongPassword",
    "auth/invalid-email":         "errEmailInvalid",
    "auth/user-disabled": "errAccountSuspended",
    "auth/invalid-credential":    "errWrongPassword",  // Firebase v9+ uses this for bad credentials
  };

  // Look up the error code; if we don't recognize it, use the generic message
  var translationKey = errorMap[errorCode] || "errGeneric";

  // Return the translated string (this function is in translations.js)
  return getTranslation(langCode, translationKey);
}


// ────────────────────────────────────────────────────────────────
// updateUserProgress(uid, data)
// ────────────────────────────────────────────────────────────────
// WHAT: Updates learning progress fields in the user's Firestore document.
// WHY:  Dashboard tracks practice points, streaks, lesson completions, curriculum state.
// ────────────────────────────────────────────────────────────────
function updateUserProgress(uid, data) {
  return db.collection("users").doc(uid).update(data);
}


// ────────────────────────────────────────────────────────────────
// getUserProgress(uid)
// ────────────────────────────────────────────────────────────────
// WHAT: Fetches the user's full profile including progress data.
// WHY:  Dashboard needs practice points, streak, curriculum state, completed lessons.
//
// NOTE: Now reads "literacyLevel" instead of the old "educationLevel".
//       Also returns badgesEarned and practiceDays for calendar/badges.
// ────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────
// getUserProgress(uid)
// ────────────────────────────────────────────────────────────────
function getUserProgress(uid) {
  return db.collection("users").doc(uid).get()
    .then(function (doc) {
      if (doc.exists) {
        var data = doc.data();

        // Handle migration from old educationLevel field
        var literacy = data.literacyLevel || "";
        if (!literacy && data.educationLevel) {
          var migrationMap = {
            none: "neverLearned", primary: "canRecognize",
            middle: "canReadSimple", high: "canReadComfort",
            higherSec: "canReadComfort", graduate: "canReadComfort"
          };
          literacy = migrationMap[data.educationLevel] || "preferNot";
        }

        return {
          xp: data.xp || 0,
          streak: data.streak || 0,
          lastActiveDate: data.lastActiveDate || null,
          completedLessons: data.completedLessons || [],
          currentLevel: data.currentLevel || data.assessmentLevel || "beginner",
          curriculum: data.curriculum || null,
          assessmentScore: data.assessmentScore || 0,
          assessmentLevel: data.assessmentLevel || "beginner",
          assessmentCompleted: data.assessmentCompleted || false,
          fullName: data.fullName || "User",
          email: data.email || "",
          preferredLanguage: data.preferredLanguage || "en",
          targetLanguage: data.targetLanguage || data.preferredLanguage || "en",
          motherTongue: data.motherTongue || "",
          ageGroup: data.ageGroup || "",
          literacyLevel: literacy,
          inventory: data.inventory || [],
          activeTheme: data.activeTheme || "default",
          streakFreezes: data.streakFreezes || 0,
          badgesEarned: data.badgesEarned || [],
          practiceDays: data.practiceDays || [],
          createdAt: data.createdAt || null,
          gamesCompleted: data.gamesCompleted || 0,
          // FIX: Explicitly pass the Gemini analysis through to the dashboard
          geminiAnalysis: data.geminiAnalysis || null,
          coins: data.coins || 0,                 // NEW
          dailyQuests: data.dailyQuests || [],    // NEW
          questDate: data.questDate || "",        // NEW
          studyGroupIds: data.studyGroupIds || [],
          handwritingProgress: data.handwritingProgress || [],
          currentLeague: data.currentLeague || "bronze",
          weeklyLeagueXP: data.weeklyLeagueXP || 0,
          lastLeagueWeek: data.lastLeagueWeek || "",
          leagueGroupId: data.leagueGroupId || ""
        };
      }
      return null;
    });
}


// ────────────────────────────────────────────────────────────────
// updateUserProfile(uid, data)
// ────────────────────────────────────────────────────────────────
// WHAT: Updates editable profile fields in the user's Firestore document.
// WHY:  The Profile page allows users to change their name, language,
//       age group, and literacy level. Uses Firestore's updateDoc()
//       to merge changes into the SAME users/{uid} document.
//
// ALLOWED FIELDS: fullName, preferredLanguage, ageGroup, literacyLevel
// ────────────────────────────────────────────────────────────────
function updateUserProfile(uid, data) {
  // Only allow specific fields to be updated for security
  var allowedFields = ["fullName", "preferredLanguage", "targetLanguage", "ageGroup", "literacyLevel"];
  var safeData = {};

  allowedFields.forEach(function(field) {
    if (data[field] !== undefined) {
      safeData[field] = data[field];
    }
  });

  return db.collection("users").doc(uid).update(safeData);
}


// ────────────────────────────────────────────────────────────────
// updateStreak(uid)
// ────────────────────────────────────────────────────────────────
// WHAT: Checks and updates the user's daily streak.
// WHY:  Motivation — consecutive days of learning shown as "X days of practice".
//
// NOTE: Also saves today's date into the practiceDays array for the
//       monthly calendar visualization.
// ────────────────────────────────────────────────────────────────
function updateStreak(uid) {
  return getUserProfile(uid).then(function (profile) {
    if (!profile) return;

    var today = new Date().toISOString().split('T')[0];
    var lastActive = profile.lastActiveDate;
    var currentStreak = profile.streak || 0;

    if (lastActive === today) {
      return currentStreak;
    }

    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActive === yesterdayStr) {
      // Consecutive day! Increment streak
      currentStreak += 1;
    } else if (lastActive && (profile.streakFreezes || 0) > 0) {
      // NEW: A day (or more) was missed, but the user owns a Streak
      // Freeze — spend one automatically to protect the streak instead
      // of resetting it to 1. This is the entire point of the item
      // existing in the shop; without this, it was cosmetic-only.
      currentStreak = currentStreak; // preserved, not reset
      return db.collection("users").doc(uid).update({
        lastActiveDate: today,
        streakFreezes: firebase.firestore.FieldValue.increment(-1),
        practiceDays: firebase.firestore.FieldValue.arrayUnion(today)
      }).then(function () {
        return currentStreak;
      });
    } else {
      // Streak broken, no freeze available — reset to 1
      currentStreak = 1;
    }

    return db.collection("users").doc(uid).update({
      streak: currentStreak,
      lastActiveDate: today,
      practiceDays: firebase.firestore.FieldValue.arrayUnion(today)
    }).then(function () {
      return currentStreak;
    });
  });
}


// ────────────────────────────────────────────────────────────────
// addXP(uid, amount)
// ────────────────────────────────────────────────────────────────
// WHAT: Adds practice points to the user's profile.
// WHY:  Tracks learning activity — reframed as "Practice Points"
//       rather than gamified "XP" to be respectful of adult learners.
// ────────────────────────────────────────────────────────────────
function addXP(uid, amount) {
  return db.collection("users").doc(uid).update({
    xp: firebase.firestore.FieldValue.increment(amount),
    weeklyLeagueXP: firebase.firestore.FieldValue.increment(amount)
  });
}


// ────────────────────────────────────────────────────────────────
// completeLesson(uid, level, unit, lessonIndex)
// ────────────────────────────────────────────────────────────────
// WHAT: Marks a lesson as completed and updates curriculum progress.
// WHY:  Tracks which lessons in which units have been done.
// ────────────────────────────────────────────────────────────────
async function completeLesson(uid, level, skillType, unit, lessonIndex, accuracy) {
  const lessonId = level + "_" + skillType + "_" + unit + "_" + lessonIndex;
  const profile = await getUserProfile(uid);
  if (!profile) return { leveledUp: false, newLevel: null };

  const completedLessons = profile.completedLessons || [];
  if (completedLessons.indexOf(lessonId) === -1) completedLessons.push(lessonId);

  const curriculum = profile.curriculum || {};
  let leveledUp = false, newLevel = null;

  if (curriculum[level] && curriculum[level][skillType]) {
    const skillData = curriculum[level][skillType];
    skillData.lessonsCompleted = (skillData.lessonsCompleted || 0) + 1;

    // Only mark "completed" once BOTH volume and quality thresholds are
    // met — 5+ lessons AND a genuine 60%+ average accuracy for this
    // skill at this level, pulled from real lessonHistory. This is what
    // makes mastery mean something, instead of just showing up 5 times.
    if (skillData.lessonsCompleted >= skillData.totalLessons) {
      const historySnap = await db.collection("users").doc(uid)
        .collection("lessonHistory")
        .where("level", "==", level)
        .where("type", "==", skillType)
        .get();
      const accuracies = historySnap.docs.map(d => d.data().accuracy || 0);
      const avgAccuracy = accuracies.length
        ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
        : 0;

      skillData.status = avgAccuracy >= 60 ? 'completed' : 'needsReview';
    }

    // Level up once every one of the 5 skills is genuinely completed
    const skills = ['reading', 'writing', 'listening', 'speaking', 'pronunciation'];
    const levels = ['beginner', 'intermediate', 'advanced'];
    const allDone = skills.every(s => curriculum[level][s].status === 'completed');

    if (allDone) {
      const levelIdx = levels.indexOf(level);
      if (levelIdx < levels.length - 1) {
        newLevel = levels[levelIdx + 1];
        skills.forEach(s => { curriculum[newLevel][s].status = 'available'; });
        leveledUp = true;
      }
    }
  }

  const updateData = { completedLessons, curriculum };
  if (leveledUp) updateData.currentLevel = newLevel;

  await db.collection("users").doc(uid).update(updateData);
  return { leveledUp, newLevel };
}


// ────────────────────────────────────────────────────────────────
// awardBadge(uid, badgeId)
// ────────────────────────────────────────────────────────────────
// WHAT: Adds a badge to the user's badgesEarned array.
// WHY:  Achievement system — badges like "firstLesson", "streak5",
//       "alphabetMaster", "assessmentDone", "gameWinner".
//
// NOTE: Uses arrayUnion so the same badge can't be added twice.
// ────────────────────────────────────────────────────────────────
function awardBadge(uid, badgeId) {
  return db.collection("users").doc(uid).update({
    badgesEarned: firebase.firestore.FieldValue.arrayUnion(badgeId)
  });
}


// ────────────────────────────────────────────────────────────────
// savePracticeDay(uid)
// ────────────────────────────────────────────────────────────────
// WHAT: Records today's date in the user's practiceDays array.
// WHY:  The monthly calendar on the dashboard shows which days
//       the user practiced — this populates that data.
//
// NOTE: Uses arrayUnion so the same date is only added once.
// ────────────────────────────────────────────────────────────────
function savePracticeDay(uid) {
  var today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return db.collection("users").doc(uid).update({
    practiceDays: firebase.firestore.FieldValue.arrayUnion(today)
  });
}


// ────────────────────────────────────────────────────────────────
// checkAndAwardBadges(uid, profile)
// ────────────────────────────────────────────────────────────────
// WHAT: Checks if the user has earned any new badges and awards them.
// WHY:  Called after key actions (lesson complete, streak update,
//       assessment done, game complete) to auto-award badges.
//
// BADGE DEFINITIONS:
//   firstLesson    — completedLessons.length >= 1
//   streak5        — streak >= 5
//   streak10       — streak >= 10
//   alphabetMaster — beginner/alphabets unit completed
//   assessmentDone — assessmentCompleted === true
//   gameWinner     — first word-match game completed (set externally)
// ────────────────────────────────────────────────────────────────
function checkAndAwardBadges(uid, profile) {
  if (!profile) return Promise.resolve([]);
  const earned = profile.badgesEarned || [];
  const newlyEarned = [];
  const promises = [];

  function tryAward(id, condition) {
    if (earned.indexOf(id) === -1 && condition) {
      newlyEarned.push(id);
      promises.push(awardBadge(uid, id));
    }
  }

  const curriculum = profile.curriculum || {};
  const skills = ['reading', 'writing', 'listening', 'speaking', 'pronunciation'];
  function levelFullyMastered(lvl) {
    return curriculum[lvl] && skills.every(s => curriculum[lvl][s]?.status === 'completed');
  }

  tryAward("assessmentDone", !!profile.assessmentCompleted);
  tryAward("firstLesson", (profile.completedLessons || []).length >= 1);

  // Level-graduate badges — replace the old single "alphabetMaster"
  tryAward("beginnerGraduate", levelFullyMastered('beginner'));
  tryAward("intermediateGraduate", levelFullyMastered('intermediate'));
  tryAward("advancedGraduate", levelFullyMastered('advanced'));

  // Streak tiers
  tryAward("streak5", (profile.streak || 0) >= 5);
  tryAward("streak10", (profile.streak || 0) >= 10);
  tryAward("streak30", (profile.streak || 0) >= 30);

  // Game tiers — no longer instant on lesson one
  tryAward("gameWinner", (profile.gamesCompleted || 0) >= 1);
  tryAward("gameChampion", (profile.gamesCompleted || 0) >= 10);

  return Promise.all(promises).then(() => newlyEarned);
}

// ─── Daily Quest Progress Engine ───
async function updateQuestProgress(uid, questType, amount) {
  if (!uid) return;
  try {
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();
    if (!doc.exists) return;
    
    const data = doc.data();
    const today = new Date().toISOString().split('T')[0];
    
    // Only update if quests are initialized for today
    if (data.questDate === today && data.dailyQuests) {
      let quests = data.dailyQuests;
      let coinsToAdd = 0;
      let modified = false;
      
      quests.forEach(q => {
        if (q.type === questType && !q.completed) {
          q.progress += amount;
          if (q.progress >= q.target) {
            q.progress = q.target;
            q.completed = true;
            coinsToAdd += q.reward; // Award coins if target reached
          }
          modified = true;
        }
      });
      
      // Save progress and safely increment coins in the database
      if (modified) {
        await userRef.update({
          dailyQuests: quests,
          coins: firebase.firestore.FieldValue.increment(coinsToAdd)
        });
      }
    }
  } catch (e) {
    console.error("Error updating quest:", e);
  }
}
// ────────────────────────────────────────────────────────────────
// determineLevel(score, literacyLevel)
// ────────────────────────────────────────────────────────────────
// WHAT: The single, shared source of truth for converting an assessment
//       score + self-reported literacy level into a starting level and
//       unit. Used by BOTH assessment.js (to set currentLevel/curriculum
//       right after the assessment) and dashboard.js (to render the
//       recommendation card) — so they can never disagree with each
//       other again.
// ────────────────────────────────────────────────────────────────
function determineLevel(score, literacyLevel) {
  const s = score || 0;
  const lit = literacyLevel || 'preferNot';

  // Score is now the ONLY thing that decides level — an objective,
  // freshly-measured result should never be capped by a self-reported
  // answer from registration day. This fixes the bug where several
  // literacyLevel rows mapped to the same level across every score band.
  let level;
  if (s <= 40) level = 'beginner';
  else if (s <= 75) level = 'intermediate';
  else level = 'advanced';

  // literacyLevel now ONLY picks which unit to start on WITHIN that level
  // — e.g. two people who both score 70% both land in "intermediate,"
  // but someone who self-reported as barely able to recognize letters
  // starts more gently (alphabets) than someone comfortable reading
  // (sentences), even at the same level.
  const unitByLiteracy = {
    neverLearned:   'alphabets',
    canRecognize:   'words',
    canReadSimple:  'sentences',
    canReadComfort: 'paragraphs',
    preferNot:      'alphabets'
  };
  const unit = unitByLiteracy[lit] || 'alphabets';

  return { level, unit };
}