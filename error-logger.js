/**
 * error-logger.js — Captures client-side JS errors on the dashboard and
 * logs them to Firestore so admins can see real user-facing failures.
 *
 * Scope: dashboard.html only, deliberately (per your earlier choice).
 * Fails silently and never throws itself — a logging bug must never
 * cause more errors.
 */
(function () {
  function logError(payload) {
    try {
      var user = (typeof auth !== "undefined") ? auth.currentUser : null;
      if (!user) return; // only log for signed-in users (matches Firestore rules)

      db.collection("errorLogs").add({
        uid: user.uid,
        email: user.email || "",
        message: payload.message || "Unknown error",
        stack: payload.stack || "",
        url: window.location.href,
        userAgent: navigator.userAgent,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(function () { /* silent — never let logging failures cascade */ });
    } catch (e) { /* silent */ }
  }

  window.addEventListener("error", function (e) {
    logError({
      message: e.message,
      stack: e.error && e.error.stack ? e.error.stack : ""
    });
  });

  window.addEventListener("unhandledrejection", function (e) {
    var reason = e.reason;
    logError({
      message: "Unhandled promise rejection: " + (reason && reason.message ? reason.message : String(reason)),
      stack: reason && reason.stack ? reason.stack : ""
    });
  });
})();