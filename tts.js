/**
 * tts.js — Text-to-Speech Manager
 *
 * Provides a floating 🔊 button on every page that reads content aloud.
 * Uses Google Cloud Text-to-Speech API with fallback to browser SpeechSynthesis.
 *
 * Features:
 * - Floating TTS button (bottom-right corner)
 * - Click to read main page content
 * - Can speak specific text on demand
 * - Supports all Indian languages
 */

// ─── Language Code Mapping for Google Cloud TTS ───────────────
const ttsLanguageCodes = {
  en: { code: "en-IN", name: "en-IN-Standard-A" },
  hi: { code: "hi-IN", name: "hi-IN-Standard-A" },
  ta: { code: "ta-IN", name: "ta-IN-Standard-A" },
  te: { code: "te-IN", name: "te-IN-Standard-A" },
  kn: { code: "kn-IN", name: "kn-IN-Standard-A" },
  bn: { code: "bn-IN", name: "bn-IN-Standard-A" },
  mr: { code: "mr-IN", name: "mr-IN-Standard-A" }
};

// ─── TTS Manager Class ───────────────────────────────────────

class TextToSpeechManager {
  constructor() {
    this.isPlaying = false;
    this.currentAudio = null;
    this.button = null;
    this.tooltip = null;
    this.init();
  }

  /**
   * Initialize TTS Manager (floating button disabled per user request)
   */
  init() {
    // Floating TTS button disabled per user request
    return;
  }

  /**
   * Get the main readable content of the current page
   */
  getPageContent() {
    const pageId = document.body.id;
    let text = "";

    if (pageId === "page-index") {
      text = this.getTextFromSelector("h1, .logo-subtitle");
    } else if (pageId === "page-register") {
      text = this.getTextFromSelector(".logo-title, .logo-subtitle, label");
    } else if (pageId === "page-login") {
      text = this.getTextFromSelector(".logo-title, .logo-subtitle, label");
    } else if (pageId === "page-assessment") {
      // Read question text and options
      const questionText = document.getElementById("question-text");
      if (questionText && questionText.textContent !== "Loading question...") {
        text = questionText.textContent;
        document.querySelectorAll(".option-btn span").forEach(opt => {
          text += ". " + opt.textContent;
        });
      } else {
        text = this.getTextFromSelector(".logo-title, .logo-subtitle, p");
      }
    } else if (pageId === "page-dashboard") {
      text = this.getTextFromSelector(".dash-greeting h1, .dash-greeting p");
    } else if (pageId === "page-lesson") {
      text = this.getTextFromSelector(".lesson-content-text, .lesson-title, .question-text");
    } else {
      // Generic fallback
      text = this.getTextFromSelector("h1, h2, p, label");
    }

    return text.trim();
  }

  /**
   * Get text content from CSS selectors
   */
  getTextFromSelector(selectors) {
    let text = "";
    document.querySelectorAll(selectors).forEach(el => {
      if (el.offsetParent !== null) { // Only visible elements
        text += el.textContent.trim() + ". ";
      }
    });
    return text;
  }

  /**
   * Speak the main page content
   */
  speakPageContent() {
    const text = this.getPageContent();
    if (text) {
      this.speak(text);
    }
  }

  /**
   * Speak specific text using Google Cloud TTS or browser fallback
   */
  async speak(text, langCode) {
    if (this.isPlaying) {
      this.stop();
    }

    const lang = langCode || (typeof selectedLang !== 'undefined' ? selectedLang : 'en');
    this.setPlayingState(true);

    // Try Google Cloud TTS first
    const success = await this.speakWithGoogleTTS(text, lang);

    if (!success) {
      // Fallback to browser Speech Synthesis
      this.speakWithBrowserTTS(text, lang);
    }
  }

  /**
   * Speak using Google Cloud Text-to-Speech API
   * FIXED: this function had the STT request body mistakenly pasted into it
   * (wrong URL, wrong request shape, references to undefined variables).
   * Restored to the correct TTS request shape below.
   */
  async speakWithGoogleTTS(text, lang) {
    const langConfig = ttsLanguageCodes[lang] || ttsLanguageCodes.en;

    // Show loading state
    this.setLoadingState(true);

    try {
      const currentUser = firebase.auth()?.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : "";
      const headers = { "Content-Type": "application/json" };
      if (idToken) headers["Authorization"] = "Bearer " + idToken;

      const response = await fetch(APP_CONFIG.CLOUD_FN_TTS, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          input: { text: text.substring(0, 5000) }, // API limit
          voice: {
            languageCode: langConfig.code,
            name: langConfig.name,
            ssmlGender: "FEMALE"
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.9,
            pitch: 0
          }
        })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.audioContent) {
        throw new Error("No audio content in response");
      }

      // Play the audio
      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
      this.currentAudio = new Audio(audioSrc);

      this.currentAudio.onended = () => {
        this.setPlayingState(false);
      };

      this.currentAudio.onerror = () => {
        this.setPlayingState(false);
      };

      this.setLoadingState(false);
      await this.currentAudio.play();
      return true;

    } catch (error) {
      console.error("Google TTS error:", error);
      this.setLoadingState(false);
      return false;
    }
  }

  /**
   * Fallback: Speak using browser's built-in Speech Synthesis
   */
  speakWithBrowserTTS(text, lang) {
    if (!('speechSynthesis' in window)) {
      console.warn("Speech synthesis not supported");
      this.setPlayingState(false);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text.substring(0, 3000));

    // Map language codes
    const langMap = {
      en: "en-IN",
      hi: "hi-IN",
      ta: "ta-IN",
      te: "te-IN",
      kn: "kn-IN",
      bn: "bn-IN",
      mr: "mr-IN"
    };

    utterance.lang = langMap[lang] || "en-IN";
    utterance.rate = 0.85;
    utterance.pitch = 1;

    utterance.onend = () => {
      this.setPlayingState(false);
    };

    utterance.onerror = () => {
      this.setPlayingState(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stop current playback
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.setPlayingState(false);
  }

  /**
   * Update button UI for playing/stopped state
   */
  setPlayingState(playing) {
    this.isPlaying = playing;
    if (!this.button) return;

    const speakerIcon = this.button.querySelector(".tts-icon-speaker");
    const stopIcon = this.button.querySelector(".tts-icon-stop");
    const loadingRing = this.button.querySelector(".tts-loading-ring");

    if (!speakerIcon || !stopIcon || !loadingRing) return;

    if (playing) {
      speakerIcon.classList.add("hidden");
      stopIcon.classList.remove("hidden");
      loadingRing.classList.add("hidden");
      this.button.classList.add("playing");
    } else {
      speakerIcon.classList.remove("hidden");
      stopIcon.classList.add("hidden");
      loadingRing.classList.add("hidden");
      this.button.classList.remove("playing");
    }
  }

  /**
   * Show loading spinner on button
   */
  setLoadingState(loading) {
    if (!this.button) return;

    const speakerIcon = this.button.querySelector(".tts-icon-speaker");
    const loadingRing = this.button.querySelector(".tts-loading-ring");

    if (!speakerIcon || !loadingRing) return;

    if (loading) {
      speakerIcon.classList.add("hidden");
      loadingRing.classList.remove("hidden");
    } else {
      loadingRing.classList.add("hidden");
    }
  }
}

// ─── Global TTS Helper ───────────────────────────────────────
// Expose a global function to speak specific text (used by lesson pages etc.)
let ttsManager = null;

function speakText(text, lang) {
  if (!ttsManager) {
    ttsManager = new TextToSpeechManager();
  }
  ttsManager.speak(text, lang);
}

function stopSpeaking() {
  if (ttsManager) {
    ttsManager.stop();
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  ttsManager = new TextToSpeechManager();
});

// ─── STT Helper ──────────────────────────────────────────────
let mediaRecorder;
let audioChunks = [];

async function processAudioData(audioBlob) {
  if (!audioBlob) return null;
  
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      resolve(base64Audio);
    };
    reader.onerror = reject;
  });
}

function startSpeechToText(lang, onResult, onError) {
  const langMap = { en: "en-IN", hi: "hi-IN", ta: "ta-IN", te: "te-IN", kn: "kn-IN", bn: "bn-IN", mr: "mr-IN" };
  const languageCode = langMap[lang] || "en-IN";

  // Google Cloud STT
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    // Explicit mimeType — relying on the browser default is inconsistent
    // across browsers and can silently mismatch the "WEBM_OPUS" encoding
    // declared below.
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    audioChunks = [];

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = async () => {
      // Always release the mic, regardless of how recording stopped.
      stream.getTracks().forEach(t => t.stop());

      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        try {
          const idToken = await firebase.auth().currentUser.getIdToken();
          const response = await fetch(APP_CONFIG.CLOUD_FN_STT, {
            method: 'POST',
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + idToken },
            body: JSON.stringify({
              config: {
                languageCode: languageCode,
                encoding: "WEBM_OPUS",
                model: "latest_short",             // tuned for short utterances — much better for these exercises than the default model
                enableAutomaticPunctuation: true    // cleaner transcripts, helps matching too
                // NOTE: useEnhanced: true was intentionally left out — it's
                // a paid-tier feature and not required for the accuracy gain
                // from "latest_short" alone. Add it back if you confirm your
                // project has enhanced models enabled and want the extra boost.
              },
              audio: { content: base64Audio }
            })
          });

          const data = await response.json();

          // Surface real API errors instead of silently treating them as
          // "no speech detected" — Google returns { error: {...} } on
          // failure, which previously fell through to onResult("").
          if (data.error) {
            throw new Error(data.error.message || "Google STT API error");
          }

          if (data.results && data.results.length > 0) {
            onResult(data.results[0].alternatives[0].transcript);
          } else {
            onResult("");
          }
        } catch (err) {
          console.error("Google Cloud STT error:", err);
          if (onError) onError(err);
        }
      };
    };

    mediaRecorder.start();

    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }, 5000);
  }).catch(err => {
    if (onError) onError(err);
  });
}