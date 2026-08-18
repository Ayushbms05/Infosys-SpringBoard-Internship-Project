/**
 * landing.js — GSAP + ScrollTrigger Animation Orchestrator
 * Standalone landing page script for AksharGyan.
 * Features: Silky Smooth Gradual Scroll-Scrub Entrance (0% bottom -> 100% solid in view).
 */

document.addEventListener("DOMContentLoaded", function () {
  // 0. Apply Selected Language Translation
  var selectedLang = localStorage.getItem("saksharLang") || "en";
  if (typeof applyTranslations === "function") {
    applyTranslations(selectedLang);
  }

  // 1. Register GSAP ScrollTrigger Plugin & Initialize Animations
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    initGSAPAnimations();
    init3DTiltEffects();
  }

  // 2. Scroll Progress Bar & Navbar Scroll State
  initScrollListeners();

  // 3. Interactive Audio Lab & Speech Synthesis
  initInteractiveAudioLab();

  // 4. FAQ Accordion Interactivity
  initFAQAccordion();

  // 5. Floating Back-to-Top Button
  initBackToTop();

  // 6. Mobile Navigation Drawer Controller
  initMobileNav();

  // 7. Optional Auth Redirection (Safely Wrapped)
  try {
    if (typeof firebase !== "undefined" && firebase.auth) {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          window.location.href = "dashboard.html";
        }
      });
    }
  } catch (err) {
    console.warn("[landing.js] Auth state check skipped:", err);
  }
});

// Refresh ScrollTrigger when window finishes loading fonts/images
window.addEventListener("load", function () {
  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.refresh();
  }
});

// ── GSAP & ScrollTrigger Animations ──────────────────────────────
function initGSAPAnimations() {
  // 1. HERO SECTION ENTRANCE & FADE OUT ON SCROLL TOP
  const heroTl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.9 } });

  heroTl
    .from("#hero-badge", { opacity: 0, y: -20, delay: 0.2 })
    .from("#hero-title", { opacity: 0, y: 35 }, "-=0.6")
    .from("#hero-subtitle", { opacity: 0, y: 25 }, "-=0.6")
    .from("#hero-cta-group", { opacity: 0, y: 20 }, "-=0.6")
    .from("#hero-mockup-card", { opacity: 0, y: 40, scale: 0.96 }, "-=0.7")
    .from(".hero-floating-badge", { opacity: 0, scale: 0.8, stagger: 0.2, ease: "back.out(1.7)" }, "-=0.4");

  // Hero Section Scroll-Out Fade (100% center -> 0% leaving top)
  gsap.to("#hero .hero-grid", {
    opacity: 0,
    y: -60,
    scale: 0.94,
    ease: "power1.in",
    scrollTrigger: {
      trigger: "#hero",
      start: "center center",
      end: "bottom top",
      scrub: 1.2
    }
  });

  // Parallax Floating Objects in Hero
  gsap.to(".hero-floating-badge", {
    y: "-15px",
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    stagger: 0.5
  });

  // Parallax Scroll for Background Orbs
  const parallaxOrbs = document.querySelectorAll(".parallax-orb");
  parallaxOrbs.forEach(orb => {
    const speed = parseFloat(orb.getAttribute("data-speed")) || 0.05;
    gsap.to(orb, {
      y: () => (window.innerHeight * speed * 3),
      ease: "none",
      scrollTrigger: {
        trigger: orb.parentElement,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true
      }
    });
  });

  // 2. SECTION HEADERS: Silky Smooth Gradual Entry Scrub
  const sectionHeaders = document.querySelectorAll(".section-header");
  sectionHeaders.forEach((header) => {
    // Skip the languages section header — handled separately below
    if (header.closest("#languages")) return;

    gsap.fromTo(header,
      { opacity: 0, y: 45, scale: 0.93 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: header,
          start: "top 95%",
          end: "top 45%",
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      }
    );
  });

  // 2b. LANGUAGES SECTION HEADER: Dedicated trigger using #languages
  const langSectionHeader = document.querySelector("#languages .section-header");
  if (langSectionHeader) {
    gsap.fromTo(langSectionHeader,
      { opacity: 0, y: 50, scale: 0.93 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#languages",
          start: "top 85%",
          end: "top 35%",
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      }
    );
  }

  // 3. MISSION / PROBLEM CARDS: Gradual Entry Scrub
  const missionCards = document.querySelectorAll(".mission-card");
  missionCards.forEach((card) => {
    gsap.fromTo(card,
      { opacity: 0, y: 55, scale: 0.86, rotateX: 14 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 95%",
          end: "top 50%",
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      }
    );
  });

  // 3b. HOW IT WORKS CARDS
  const hiwCards = document.querySelectorAll(".hiw-card");
  if (hiwCards.length > 0) {
    gsap.fromTo(hiwCards,
      { opacity: 0, y: 50, scale: 0.88 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#how-it-works",
          start: "top 75%",
          end: "center 45%",
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      }
    );
  }

  // 4. FEATURES HORIZONTAL SCROLL (Desktop Pin & Scrub)
  ScrollTrigger.matchMedia({
    "(min-width: 769px)": function () {
      const track = document.getElementById("features-track");
      const wrapper = document.getElementById("features-pin-wrapper");

      if (track && wrapper) {
        gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth + 120),
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => "+=" + (track.scrollWidth - window.innerWidth + 350),
            invalidateOnRefresh: true,
            anticipatePin: 1
          }
        });
      }
    }
  });

  // Features Header Gradual Scroll Entry Scrub
  const featuresHeader = document.querySelector(".features-header-wrap");
  if (featuresHeader) {
    gsap.fromTo(featuresHeader,
      { opacity: 0, y: 45, scale: 0.93 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: featuresHeader,
          start: "top 95%",
          end: "top 45%",
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      }
    );
  }

  // 4b. INTERACTIVE AUDIO LAB CARD
  const audioLabCard = document.querySelector(".audio-lab-card");
  if (audioLabCard) {
    gsap.fromTo(audioLabCard,
      { opacity: 0, y: 60, scale: 0.92 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#interactive-demo",
          start: "top 75%",
          end: "center 45%",
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      }
    );
  }

  // 4c. CURRICULUM SHOWCASE CARDS
  const currCards = document.querySelectorAll(".curriculum-card");
  if (currCards.length > 0) {
    gsap.fromTo(currCards,
      { opacity: 0, y: 45, scale: 0.88 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#curriculum",
          start: "top 75%",
          end: "center 45%",
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      }
    );
  }

  // 5. LANGUAGES SUPPORTED
  const langCards = document.querySelectorAll(".lang-card");
  if (langCards.length > 0) {
    const langCardsTl = gsap.timeline({
      scrollTrigger: {
        trigger: "#languages",
        start: "top 60%",
        end: "center 30%",
        scrub: 1.2,
        invalidateOnRefresh: true
      }
    });

    langCardsTl.fromTo(langCards,
      { opacity: 0, y: 45, scale: 0.86 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "power2.out",
        stagger: 0.08
      }
    );
  }

  // 5b. TESTIMONIALS CARDS
  const testCards = document.querySelectorAll(".testimonial-card");
  if (testCards.length > 0) {
    gsap.fromTo(testCards,
      { opacity: 0, y: 45, scale: 0.88 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#testimonials",
          start: "top 75%",
          end: "center 45%",
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      }
    );
  }

  // 6. STATS COUNTER: Gradual Entry Scrub + Count-Up
  const statItems = document.querySelectorAll(".stat-item");
  statItems.forEach((item) => {
    const statNumber = item.querySelector(".stat-number");
    
    gsap.fromTo(item,
      { opacity: 0, y: 45, scale: 0.86 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: item,
          start: "top 95%",
          end: "top 50%",
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      }
    );

    if (statNumber) {
      const target = parseInt(statNumber.getAttribute("data-target"), 10);
      const suffix = statNumber.getAttribute("data-suffix") || "";
      const counterObj = { val: 0 };

      ScrollTrigger.create({
        trigger: item,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(counterObj, {
            val: target,
            duration: 2,
            ease: "power1.out",
            onUpdate: () => {
              statNumber.textContent = Math.floor(counterObj.val).toLocaleString() + suffix;
            }
          });
        }
      });
    }
  });

  // 6b. FAQ ACCORDION ITEMS
  const faqItems = document.querySelectorAll(".faq-item");
  if (faqItems.length > 0) {
    gsap.fromTo(faqItems,
      { opacity: 0, y: 35, scale: 0.94 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#faq",
          start: "top 75%",
          end: "center 45%",
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      }
    );
  }

  // 7. FINAL CTA BANNER
  const ctaBox = document.getElementById("cta-box");
  if (ctaBox) {
    gsap.fromTo(ctaBox,
      { opacity: 0, y: 50, scale: 0.92 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ctaBox,
          start: "top 95%",
          end: "top 45%",
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      }
    );
  }

  // Force ScrollTrigger refresh
  setTimeout(() => {
    ScrollTrigger.refresh();
  }, 100);
}

// ── Interactive 3D Mouse Tilt Effect ──────────────────────────────
function init3DTiltEffects() {
  const tiltCards = document.querySelectorAll(".mission-card, .hiw-card, .curriculum-card, .testimonial-card, .feature-card-horizontal, .lang-card, .hero-mockup-card, .audio-phrase-card");
  tiltCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const rotX = (-y / rect.height) * 8;
      const rotY = (x / rect.width) * 8;

      gsap.to(card, {
        rotateX: rotX,
        rotateY: rotY,
        transformPerspective: 1000,
        ease: "power1.out",
        duration: 0.35
      });
    });

    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        ease: "power2.out",
        duration: 0.5
      });
    });
  });
}

// ── Interactive Multi-Sensory Audio Lab Logic ─────────────────────
function initInteractiveAudioLab() {
  const phraseCards = document.querySelectorAll(".audio-phrase-card");
  if (phraseCards.length === 0) return;

  phraseCards.forEach((card) => {
    card.addEventListener("click", function () {
      const textToSpeak = this.getAttribute("data-text");
      const langCode = this.getAttribute("data-lang") || "hi-IN";

      // Visual playing indicator
      phraseCards.forEach(c => c.classList.remove("playing"));
      this.classList.add("playing");

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel(); // Stop ongoing speech

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = langCode;
        utterance.rate = 0.88; // Gentle, clear speed for learners
        utterance.pitch = 1.0;

        utterance.onend = () => {
          this.classList.remove("playing");
        };
        utterance.onerror = () => {
          this.classList.remove("playing");
        };

        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => {
          this.classList.remove("playing");
        }, 1500);
      }
    });
  });
}

// ── FAQ Accordion Interactivity ───────────────────────────────────
function initFAQAccordion() {
  const faqQuestions = document.querySelectorAll(".faq-question");
  faqQuestions.forEach((btn) => {
    btn.addEventListener("click", function () {
      const item = this.closest(".faq-item");
      if (!item) return;

      const wasActive = item.classList.contains("active");

      // Optional: Close other FAQs for a clean accordion experience
      document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("active"));

      if (!wasActive) {
        item.classList.add("active");
      }

      // Refresh ScrollTrigger after height change
      if (typeof ScrollTrigger !== "undefined") {
        setTimeout(() => {
          ScrollTrigger.refresh();
        }, 320);
      }
    });
  });
}

// ── Floating Back-To-Top Button ───────────────────────────────────
function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;

  window.addEventListener("scroll", function () {
    if (window.scrollY > 400) {
      btn.classList.add("visible");
    } else {
      btn.classList.remove("visible");
    }
  });

  btn.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

// ── Scroll Progress & Navbar Listeners ─────────────────────────────
function initScrollListeners() {
  const progressBar = document.getElementById("scroll-progress-bar");
  const nav = document.getElementById("landing-nav");

  window.addEventListener("scroll", function () {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (progressBar) {
      progressBar.style.width = scrolled + "%";
    }

    if (nav) {
      if (scrollTop > 50) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    }
  });
}

// ── Mobile Navigation Drawer Controller ───────────────────────────
function initMobileNav() {
  const toggleBtn = document.getElementById("mobile-nav-toggle");
  const closeBtn = document.getElementById("mobile-nav-close");
  const backdrop = document.getElementById("mobile-nav-backdrop");
  const drawer = document.getElementById("mobile-nav-drawer");

  if (!toggleBtn || !drawer) return;

  function openDrawer() {
    drawer.classList.add("active");
    if (backdrop) backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    drawer.classList.remove("active");
    if (backdrop) backdrop.classList.remove("active");
    document.body.style.overflow = "";
    drawer.setAttribute("aria-hidden", "true");
  }

  toggleBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    openDrawer();
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closeDrawer();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeDrawer);
  }

  // Close when clicking any nav link
  const drawerLinks = drawer.querySelectorAll("a");
  drawerLinks.forEach(link => {
    link.addEventListener("click", function () {
      closeDrawer();
    });
  });

  // Close on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.classList.contains("active")) {
      closeDrawer();
    }
  });
}

