const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// Define secrets
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const ttsApiKey = defineSecret("GOOGLE_CLOUD_TTS_API_KEY");
const sttApiKey = defineSecret("GOOGLE_CLOUD_STT_API_KEY");

// Middleware to verify Firebase Auth token
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Unauthorized");
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).send("Unauthorized");
  }
};

exports.callGemini = onRequest({ secrets: [geminiApiKey] }, (req, res) => {
  cors(req, res, () => {
    authenticate(req, res, async () => {
      try {
        const apiKey = geminiApiKey.value();
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  });
});

exports.callTextToSpeech = onRequest({ secrets: [ttsApiKey] }, (req, res) => {
  cors(req, res, () => {
    authenticate(req, res, async () => {
      try {
        const apiKey = ttsApiKey.value();
        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  });
});

exports.callSpeechToText = onRequest({ secrets: [sttApiKey] }, (req, res) => {
  cors(req, res, () => {
    authenticate(req, res, async () => {
      try {
        const apiKey = sttApiKey.value();
        const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  });
});
