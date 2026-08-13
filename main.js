/**
 * main.js — Page-specific logic: form validation, event listeners, language switching.
 *
 * This file runs on EVERY page. It checks which page is currently loaded
 * (by looking at the <body> tag's id) and then sets up the right behavior:
 *   - index.html    → language selection buttons
 *   - register.html → registration form validation + Firebase signup
 *   - login.html    → login form validation + Firebase sign-in
 *   - dashboard.html → display user info + logout button
 *
 * IMPORTANT: This file depends on translations.js, firebase-config.js,
 * and auth.js being loaded BEFORE it in the HTML <script> tags.
 */


// ────────────────────────────────────────────────────────────────
// GLOBAL: selectedLang
// ────────────────────────────────────────────────────────────────
var selectedLang = localStorage.getItem("saksharLang") || "en";


// ────────────────────────────────────────────────────────────────
// Wait for the page to fully load, then run setup
// ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  initPageTransitions();
  var pageId = document.body.id;

  applyTranslations(selectedLang);

  // Setup password toggles (Only once!)
  document.querySelectorAll(".password-toggle").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var input = this.previousElementSibling;
      if (input.type === "password") {
        input.type = "text";
        this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>';
      } else {
        input.type = "password";
        this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>';
      }
    });
  });

  if (pageId === "page-index") {
    setupLanguageSelection();
  } else if (pageId === "page-register") {
    setupRegistrationForm();
  } else if (pageId === "page-login") {
    setupLoginForm();
  } else if (pageId === "page-dashboard") {
    setupDashboard();
  }
});


// ════════════════════════════════════════════════════════════════
//  INDEX PAGE
// ════════════════════════════════════════════════════════════════
function setupLanguageSelection() {
  var langButtons = document.querySelectorAll(".lang-btn, .index-lang-card");
  var savedLang = localStorage.getItem("saksharLang") || "en";

  langButtons.forEach(function (btn) {
    var langCode = btn.getAttribute("data-lang");
    if (langCode === savedLang) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }

    btn.addEventListener("click", function () {
      var langCode = btn.getAttribute("data-lang");

      selectedLang = langCode;
      localStorage.setItem("saksharLang", langCode);
      
      langButtons.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      if (typeof applyTranslations === "function") {
        applyTranslations(langCode);
      }

      setTimeout(function () {
        smoothNavigateTo("landing.html");
      }, 200);
    });
  });
}


// ════════════════════════════════════════════════════════════════
//  REGISTRATION PAGE
// ════════════════════════════════════════════════════════════════
function setupRegistrationForm() {
  var form            = document.getElementById("register-form");
  var fullNameInput   = document.getElementById("fullName");
  var emailInput      = document.getElementById("email");
  var passwordInput   = document.getElementById("password");
  var confirmPwInput  = document.getElementById("confirmPassword");
  var langSelect      = document.getElementById("preferredLang");
  var targetLangSelect = document.getElementById("target-language"); // NEW
  var motherTongue    = document.getElementById("motherTongue");
  var ageGroup        = document.getElementById("ageGroup");
  var literacyLevel   = document.getElementById("literacyLevel");
  var submitBtn       = document.getElementById("register-btn");
  var statusMsg       = document.getElementById("status-message");

  if (langSelect) {
    langSelect.value = selectedLang;

    // NEW: populate the target-language dropdown on page load, excluding
    // whatever known language is currently selected
    populateTargetLanguageOptions(langSelect.value);

    langSelect.addEventListener("change", function () {
      selectedLang = langSelect.value;
      localStorage.setItem("saksharLang", selectedLang);
      applyTranslations(selectedLang);

      // NEW: refresh target-language options so the known language can
      // never also be picked as the target language
      populateTargetLanguageOptions(langSelect.value);
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearAllErrors();
    hideStatus(statusMsg);

    var isValid = true;

    if (!fullNameInput.value.trim()) {
      showFieldError(fullNameInput, getTranslation(selectedLang, "errRequired"));
      isValid = false;
    }

    if (!emailInput.value.trim()) {
      showFieldError(emailInput, getTranslation(selectedLang, "errRequired"));
      isValid = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
      showFieldError(emailInput, getTranslation(selectedLang, "errEmailInvalid"));
      isValid = false;
    }

    if (!passwordInput.value) {
      showFieldError(passwordInput, getTranslation(selectedLang, "errRequired"));
      isValid = false;
    } else if (passwordInput.value.length < 6) {
      showFieldError(passwordInput, getTranslation(selectedLang, "errPasswordShort"));
      isValid = false;
    }

    if (!confirmPwInput.value) {
      showFieldError(confirmPwInput, getTranslation(selectedLang, "errRequired"));
      isValid = false;
    } else if (confirmPwInput.value !== passwordInput.value) {
      showFieldError(confirmPwInput, getTranslation(selectedLang, "errPasswordMismatch"));
      isValid = false;
    }

    if (!isValid) return;

    // Validate new required fields
    if (!motherTongue.value.trim()) {
      showFieldError(motherTongue, getTranslation(selectedLang, "errRequired"));
      isValid = false;
    }

    if (!literacyLevel || !literacyLevel.value) {
      showFieldError(literacyLevel, getTranslation(selectedLang, "errRequired"));
      isValid = false;
    }

    if (!ageGroup || !ageGroup.value) {
      showFieldError(ageGroup, getTranslation(selectedLang, "errRequired"));
      isValid = false;
    }

    // NEW: target language is required too
    if (!targetLangSelect || !targetLangSelect.value) {
      showFieldError(targetLangSelect, getTranslation(selectedLang, "errRequired"));
      isValid = false;
    }

    if (!isValid) return;

    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    registerUser(
      fullNameInput.value.trim(),
      emailInput.value.trim(),
      passwordInput.value,
      langSelect.value,
      targetLangSelect.value, // NEW — inserted here, matching auth.js's new parameter order
      motherTongue.value.trim(),
      ageGroup.value,
      literacyLevel ? literacyLevel.value : ""
    )
      .then(function () {
        showStatus(statusMsg, "success", getTranslation(selectedLang, "successRegister"));
        // Auto-login and redirect to assessment (not login page)
        setTimeout(function () {
          smoothNavigateTo("assessment.html");
        }, 1500);
      })
      .catch(function (error) {
        var msg = mapFirebaseError(error.code, selectedLang);
        showStatus(statusMsg, "error", msg);
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
      });
  });
}

// ────────────────────────────────────────────────────────────────
// populateTargetLanguageOptions(knownLang)
// ────────────────────────────────────────────────────────────────
// WHAT: Fills the #target-language dropdown with every supported
//       language EXCEPT whichever one is currently selected as the
//       known/preferred language — someone can't "learn" the language
//       they already told us they know.
// ────────────────────────────────────────────────────────────────
function populateTargetLanguageOptions(knownLang) {
  var languageNames = { en: "English", hi: "हिन्दी", ta: "தமிழ்", te: "తెలుగు", kn: "ಕನ್ನಡ", bn: "বাংলা", mr: "मराठी" };
  var select = document.getElementById("target-language");
  if (!select) return;

  var previousValue = select.value; // preserve selection across refreshes if still valid

  select.innerHTML = Object.keys(languageNames)
    .filter(function (code) { return code !== knownLang; })
    .map(function (code) { return '<option value="' + code + '">' + languageNames[code] + '</option>'; })
    .join('');

  if (previousValue && previousValue !== knownLang) {
    select.value = previousValue;
  }
}


// ════════════════════════════════════════════════════════════════
//  LOGIN PAGE
// ════════════════════════════════════════════════════════════════
function setupLoginForm() {
  var form       = document.getElementById("login-form");
  var emailInput = document.getElementById("login-email");
  var pwInput    = document.getElementById("login-password");
  var submitBtn  = document.getElementById("login-btn");
  var statusMsg  = document.getElementById("status-message");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearAllErrors();
    hideStatus(statusMsg);

    var isValid = true;

    if (!emailInput.value.trim()) {
      showFieldError(emailInput, getTranslation(selectedLang, "errRequired"));
      isValid = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
      showFieldError(emailInput, getTranslation(selectedLang, "errEmailInvalid"));
      isValid = false;
    }

    if (!pwInput.value) {
      showFieldError(pwInput, getTranslation(selectedLang, "errRequired"));
      isValid = false;
    }

    if (!isValid) return;

    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    loginUser(emailInput.value.trim(), pwInput.value)
      .then(function (userCredential) {
        showStatus(statusMsg, "success", getTranslation(selectedLang, "successLogin"));

        // Check admin status FIRST, then assessment status, to determine routing
        getUserProfile(userCredential.user.uid).then(profile => {
          if (!profile) {
            // Firestore profile was deleted (e.g. by admin) but Auth still exists.
            // Sign out, clean up the orphaned Auth account if possible, and show error.
            var currentUser = auth.currentUser;
            var cleanupPromise = currentUser ? currentUser.delete().catch(function () {
              return auth.signOut();
            }) : auth.signOut();

            cleanupPromise.then(function () {
              showStatus(statusMsg, "error", "Your account has been deleted. Please register again.");
              submitBtn.classList.remove("loading");
              submitBtn.disabled = false;
            });
            return;
          }

          setTimeout(function () {
            // NEW: admins skip the assessment check entirely and go
            // straight to the admin dashboard — admin.js itself will
            // re-verify isAdmin on load as a second layer of defense.
            if (profile.isAdmin === true) {
              smoothNavigateTo("admin.html");
            } else if (profile.assessmentCompleted) {
              smoothNavigateTo("dashboard.html");
            } else {
              smoothNavigateTo("assessment.html");
            }
          }, 1500);
        }).catch(err => {
          setTimeout(() => { smoothNavigateTo("dashboard.html"); }, 1500);
        });
      })
      .catch(function (error) {
        var msg = mapFirebaseError(error.code, selectedLang);
        showStatus(statusMsg, "error", msg);
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
      });
  });
}


// ════════════════════════════════════════════════════════════════
//  DASHBOARD PAGE
// ════════════════════════════════════════════════════════════════
function setupDashboard() {
  auth.onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in — fetch their full profile including progress
      getUserProgress(user.uid).then(function (profile) {
        if (!profile) return;

        // Redirect to assessment if not completed
        if (!profile.assessmentCompleted && !profile.curriculum) {
          getUserProfile(user.uid).then(fullProfile => {
            if (!fullProfile || !fullProfile.assessmentCompleted) {
              window.location.href = "assessment.html";
              return;
            }
            // Has assessment but getUserProgress didn't catch it
            showDashboard(fullProfile, user.uid);
          });
          return;
        }

        showDashboard(profile, user.uid);
      }).catch(err => {
        console.error("Error loading dashboard:", err);
        // Try with basic profile
        getUserProfile(user.uid).then(function (profile) {
          if (profile) showDashboard(profile, user.uid);
        });
      });
    } else {
      smoothNavigateTo("login.html");
    }
  });
}

function showDashboard(profile, uid) {
  // Apply Language
  if (profile.preferredLanguage) {
    selectedLang = profile.preferredLanguage;
    localStorage.setItem("saksharLang", selectedLang);
    applyTranslations(selectedLang);
  }

  // Show dashboard
  document.getElementById("dashboard-content").classList.remove("hidden");
  document.getElementById("loading-overlay").classList.add("hidden");

  // Fill profile section data
  const profileAvatar = document.getElementById("profile-avatar");
  if (profileAvatar) profileAvatar.textContent = profile.fullName.charAt(0).toUpperCase();
  
  const profileName = document.getElementById("profile-name");
  if (profileName) profileName.textContent = profile.fullName;

  const profileEmail = document.getElementById("profile-email");
  if (profileEmail) profileEmail.textContent = profile.email || '';

  const profileXP = document.getElementById("profile-xp");
  if (profileXP) profileXP.textContent = profile.xp || 0;

  const profileStreak = document.getElementById("profile-streak");
  if (profileStreak) profileStreak.textContent = profile.streak || 0;

  const profileLessons = document.getElementById("profile-lessons");
  if (profileLessons) {
    const completedCount = (profile.completedLessons || []).length;
    profileLessons.textContent = completedCount;
  }

  // Handle Score Ring
  const score = profile.assessmentScore || 0;
  const scoreVal = document.getElementById("dash-score-value");
  if (scoreVal) scoreVal.textContent = score;

  const circle = document.getElementById("dash-score-circle");
  if (circle) {
    const circumference = 2 * Math.PI * 34; // r=34
    const offset = circumference - (score / 100) * circumference;
    setTimeout(() => {
      circle.style.strokeDasharray = `${circumference}`;
      circle.style.strokeDashoffset = offset;
    }, 300);
  }

  // Initialize Duolingo-style dashboard
  if (typeof initDashboard === 'function') {
    initDashboard(profile);
  }
}


// ════════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════
function isValidEmail(email) {
  var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

function showFieldError(inputElement, message) {
  inputElement.classList.add("input-error");
  var errorSpan = inputElement.parentElement.parentElement.querySelector(".error-text");
  if (!errorSpan) {
    errorSpan = inputElement.parentElement.querySelector(".error-text");
  }
  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.classList.add("visible");
    errorSpan.style.display = "block";
  }
}

function clearAllErrors() {
  document.querySelectorAll(".input-error").forEach(function (el) {
    el.classList.remove("input-error");
  });
  document.querySelectorAll(".error-text").forEach(function (el) {
    el.classList.remove("visible");
    el.textContent = "";
    el.style.display = "none";
  });
}

function showStatus(element, type, message) {
  if (!element) return;
  element.className = "status-message visible " + type;
  
  var icon = "";
  if (type === "success") {
    icon = '<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
  } else if (type === "error") {
    icon = '<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>';
  }
  
  element.innerHTML = icon + '<span>' + message + '</span>';
}

function hideStatus(element) {
  if (!element) return;
  element.className = "status-message";
  element.innerHTML = "";
}

// ════════════════════════════════════════════════════════════════
//  UNIVERSAL SMOOTH PAGE TRANSITION SYSTEM
// ════════════════════════════════════════════════════════════════
function initPageTransitions() {
  document.body.classList.remove("page-is-leaving");
  document.body.classList.add("page-is-entering");

  // Intercept internal link and button clicks for seamless transition
  document.addEventListener("click", function (e) {
    var target = e.target.closest("a[href], [data-href]");
    if (!target) return;

    var href = target.getAttribute("href") || target.getAttribute("data-href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:") || target.getAttribute("target") === "_blank") {
      return;
    }

    try {
      var targetUrl = new URL(href, window.location.href);
      if (targetUrl.origin !== window.location.origin) return;
    } catch (err) {
      return;
    }

    e.preventDefault();
    smoothNavigateTo(href);
  });

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      document.body.classList.remove("page-is-leaving");
      document.body.classList.add("page-is-entering");
    }
  });
}

function smoothNavigateTo(targetUrl) {
  if (!targetUrl) return;

  var currentPath = window.location.pathname;
  if (currentPath.endsWith(targetUrl) || (currentPath === "/" && targetUrl === "index.html")) return;

  if (document.startViewTransition) {
    document.startViewTransition(function () {
      window.location.href = targetUrl;
    });
  } else {
    document.body.classList.remove("page-is-entering");
    document.body.classList.add("page-is-leaving");
    setTimeout(function () {
      window.location.href = targetUrl;
    }, 220);
  }
}