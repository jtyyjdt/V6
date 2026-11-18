/* =========================================================
   K & K — OUR FIRST ANNIVERSARY
   SCRIPT.JS — PART 1
   FOUNDATION & PAGE NAVIGATION
   ========================================================= */

"use strict";

/* ---------------------------------------------------------
   1. CORE CONFIGURATION
   --------------------------------------------------------- */

const KK_APP = {
  totalPages: 12,
  currentPage: 1,
  isTransitioning: false,
  initialized: false,
  transitionDuration: 650,
  reducedMotion: window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
};


/* ---------------------------------------------------------
   2. DOM REFERENCES
   --------------------------------------------------------- */

const KK_DOM = {
  app: document.querySelector(".app"),
  pages: Array.from(document.querySelectorAll(".page")),

  navigation: document.querySelector(".site-navigation"),
  previousButton: document.querySelector(".nav-prev"),
  nextButton: document.querySelector(".nav-next"),
  chapterIndicator: document.querySelector(".chapter-indicator"),

  transitionLayer: document.querySelector(".transition-layer"),
  transitionGlow: document.querySelector(".transition-glow"),

  musicControl: document.querySelector(".music-control"),

  toast: document.querySelector(".toast")
};


/* ---------------------------------------------------------
   3. GENERAL HELPERS
   --------------------------------------------------------- */

function kkGetElement(selector, parent = document) {
  return parent.querySelector(selector);
}

function kkGetElements(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

function kkClamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function kkWait(duration) {
  return new Promise(resolve => {
    window.setTimeout(resolve, duration);
  });
}

function kkSetText(element, text) {
  if (element) {
    element.textContent = text;
  }
}

function kkIsValidPage(pageNumber) {
  return (
    Number.isInteger(pageNumber) &&
    pageNumber >= 1 &&
    pageNumber <= KK_APP.totalPages
  );
}


/* ---------------------------------------------------------
   4. PAGE VALIDATION
   --------------------------------------------------------- */

function kkValidatePages() {
  if (KK_DOM.pages.length !== KK_APP.totalPages) {
    console.error(
      "[K&K] Expected 12 pages but found:",
      KK_DOM.pages.length
    );

    return false;
  }

  const ids = KK_DOM.pages.map(page => page.id);

  const missingIds = ids.some(id => !id);

  if (missingIds) {
    console.error(
      "[K&K] One or more page elements have no ID."
    );

    return false;
  }

  const duplicateIds = ids.filter(
    (id, index) => ids.indexOf(id) !== index
  );

  if (duplicateIds.length > 0) {
    console.error(
      "[K&K] Duplicate page IDs detected:",
      duplicateIds
    );

    return false;
  }

  return true;
}


/* ---------------------------------------------------------
   5. CHAPTER INDICATOR
   --------------------------------------------------------- */

function kkUpdateChapterIndicator(pageNumber) {
  if (!KK_DOM.chapterIndicator) {
    return;
  }

  const formattedCurrent = String(pageNumber).padStart(2, "0");
  const formattedTotal = String(KK_APP.totalPages).padStart(2, "0");

  kkSetText(
    KK_DOM.chapterIndicator,
    `${formattedCurrent} / ${formattedTotal}`
  );
}


/* ---------------------------------------------------------
   6. NAVIGATION BUTTONS
   --------------------------------------------------------- */

function kkUpdateNavigation(pageNumber) {
  const isFirstPage = pageNumber === 1;
  const isLastPage = pageNumber === KK_APP.totalPages;

  if (KK_DOM.previousButton) {
    KK_DOM.previousButton.disabled = isFirstPage;
    KK_DOM.previousButton.setAttribute(
      "aria-disabled",
      String(isFirstPage)
    );
  }

  if (KK_DOM.nextButton) {
    KK_DOM.nextButton.disabled = isLastPage;
    KK_DOM.nextButton.setAttribute(
      "aria-disabled",
      String(isLastPage)
    );
  }

  kkUpdateChapterIndicator(pageNumber);
}


/* ---------------------------------------------------------
   7. PAGE ACTIVATION
   --------------------------------------------------------- */

function kkActivatePage(pageNumber, options = {}) {
  if (!kkIsValidPage(pageNumber)) {
    console.warn(
      "[K&K] Invalid page number:",
      pageNumber
    );

    return false;
  }

  const { updateHistory = false } = options;

  KK_DOM.pages.forEach((page, index) => {
    const isActive = index === pageNumber - 1;

    page.classList.toggle("active", isActive);

    page.setAttribute(
      "aria-hidden",
      String(!isActive)
    );

    if (isActive) {
      page.scrollTop = 0;

      const scrollable = page.querySelector(
        ".cinematic-content, " +
        ".letter-content, " +
        ".promises-content, " +
        ".future-content, " +
        ".capsule-content"
      );

      if (scrollable) {
        scrollable.scrollTop = 0;
      }
    }
  });

  KK_APP.currentPage = pageNumber;

  kkUpdateNavigation(pageNumber);

  if (updateHistory) {
    try {
      window.history.pushState(
        { kkPage: pageNumber },
        "",
        `#${KK_DOM.pages[pageNumber - 1].id}`
      );
    } catch (error) {
      console.warn(
        "[K&K] Browser history could not be updated.",
        error
      );
    }
  }

  document.dispatchEvent(
    new CustomEvent("kk:pagechange", {
      detail: {
        page: pageNumber,
        pageId: KK_DOM.pages[pageNumber - 1].id
      }
    })
  );

  return true;
}


/* ---------------------------------------------------------
   8. PAGE TRANSITIONS
   --------------------------------------------------------- */

async function kkGoToPage(
  pageNumber,
  options = {}
) {
  if (!kkIsValidPage(pageNumber)) {
    return false;
  }

  if (KK_APP.isTransitioning) {
    return false;
  }

  if (pageNumber === KK_APP.currentPage) {
    return true;
  }

  const {
    updateHistory = true,
    instant = false
  } = options;

  if (
    instant ||
    KK_APP.reducedMotion ||
    !KK_DOM.transitionLayer
  ) {
    return kkActivatePage(pageNumber, {
      updateHistory
    });
  }

  KK_APP.isTransitioning = true;

  KK_DOM.transitionLayer.classList.add("active");

  if (KK_DOM.transitionGlow) {
    KK_DOM.transitionGlow.classList.add("active");
  }

  await kkWait(220);

  const activated = kkActivatePage(pageNumber, {
    updateHistory
  });

  if (!activated) {
    KK_APP.isTransitioning = false;

    KK_DOM.transitionLayer.classList.remove("active");

    if (KK_DOM.transitionGlow) {
      KK_DOM.transitionGlow.classList.remove("active");
    }

    return false;
  }

  await kkWait(180);

  KK_DOM.transitionLayer.classList.remove("active");

  if (KK_DOM.transitionGlow) {
    KK_DOM.transitionGlow.classList.remove("active");
  }

  await kkWait(250);

  KK_APP.isTransitioning = false;

  return true;
}


/* ---------------------------------------------------------
   9. NEXT / PREVIOUS NAVIGATION
   --------------------------------------------------------- */

function kkNextPage() {
  if (KK_APP.currentPage < KK_APP.totalPages) {
    return kkGoToPage(KK_APP.currentPage + 1);
  }

  return Promise.resolve(false);
}

function kkPreviousPage() {
  if (KK_APP.currentPage > 1) {
    return kkGoToPage(KK_APP.currentPage - 1);
  }

  return Promise.resolve(false);
}


/* ---------------------------------------------------------
   10. NAVIGATION EVENT LISTENERS
   --------------------------------------------------------- */

function kkBindNavigation() {
  if (KK_DOM.previousButton) {
    KK_DOM.previousButton.addEventListener(
      "click",
      kkPreviousPage
    );
  }

  if (KK_DOM.nextButton) {
    KK_DOM.nextButton.addEventListener(
      "click",
      kkNextPage
    );
  }

  document.addEventListener(
    "click",
    event => {
      const trigger = event.target.closest(
        "[data-go-page]"
      );

      if (!trigger) {
        return;
      }

      const pageNumber = Number(
        trigger.dataset.goPage
      );

      if (kkIsValidPage(pageNumber)) {
        kkGoToPage(pageNumber);
      }
    }
  );
}


/* ---------------------------------------------------------
   11. BROWSER BACK / FORWARD SUPPORT
   --------------------------------------------------------- */

function kkBindBrowserHistory() {
  window.addEventListener(
    "popstate",
    event => {
      const historyPage = event.state?.kkPage;

      if (kkIsValidPage(historyPage)) {
        kkGoToPage(historyPage, {
          updateHistory: false
        });
        return;
      }

      const hash = window.location.hash.slice(1);

      const matchingIndex = KK_DOM.pages.findIndex(
        page => page.id === hash
      );

      if (matchingIndex >= 0) {
        kkGoToPage(matchingIndex + 1, {
          updateHistory: false
        });
      }
    }
  );
}


/* ---------------------------------------------------------
   12. INITIALIZATION
   --------------------------------------------------------- */

function kkInitializeFoundation() {
  if (KK_APP.initialized) {
    return;
  }

  if (!KK_DOM.app) {
    console.error(
      "[K&K] App container .app was not found."
    );

    return;
  }

  if (!kkValidatePages()) {
    console.error(
      "[K&K] Foundation initialization stopped."
    );

    return;
  }

  kkBindNavigation();
  kkBindBrowserHistory();

  const initialHash = window.location.hash.slice(1);

  const hashIndex = KK_DOM.pages.findIndex(
    page => page.id === initialHash
  );

  const initialPage = hashIndex >= 0
    ? hashIndex + 1
    : 1;

  kkActivatePage(initialPage);

  KK_APP.initialized = true;

  console.info(
    "[K&K] Foundation initialized successfully."
  );
}


/* ---------------------------------------------------------
   13. START FOUNDATION
   --------------------------------------------------------- */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    kkInitializeFoundation,
    { once: true }
  );
} else {
  kkInitializeFoundation();
}


/* =========================================================
   END OF PART 1
   NEXT: MUSIC ENGINE & TRANSITION SUPPORT
   ========================================================= */
   /* =========================================================
   SCRIPT.JS — PART 2
   BACKGROUND MUSIC ENGINE
   ========================================================= */

const KK_MUSIC = {
  audio: null,
  started: false,
  muted: false,
  volume: 0.42,
  fadeTimer: null,
  listenersBound: false
};


/* ---------------------------------------------------------
   1. CREATE ONE AUDIO INSTANCE
   --------------------------------------------------------- */

function kkCreateMusic() {
  if (KK_MUSIC.audio) {
    return KK_MUSIC.audio;
  }

  const audio = new Audio("music.mp3");

  audio.loop = true;
  audio.preload = "auto";
  audio.volume = KK_MUSIC.volume;

  KK_MUSIC.audio = audio;

  audio.addEventListener("error", () => {
    console.warn(
      "[K&K] Music could not be loaded. Check music.mp3."
    );
  });

  audio.addEventListener("playing", () => {
    KK_MUSIC.started = true;
    kkUpdateMusicControl();
  });

  audio.addEventListener("pause", () => {
    kkUpdateMusicControl();
  });

  return audio;
}


/* ---------------------------------------------------------
   2. UPDATE MUSIC BUTTON
   --------------------------------------------------------- */

function kkUpdateMusicControl() {
  const button = KK_DOM.musicControl;

  if (!button) {
    return;
  }

  const audio = KK_MUSIC.audio;
  const isPlaying = Boolean(
    audio &&
    !audio.paused &&
    !audio.ended
  );

  button.classList.toggle("playing", isPlaying);
  button.classList.toggle("muted", KK_MUSIC.muted);

  button.setAttribute(
    "aria-label",
    KK_MUSIC.muted
      ? "Unmute music"
      : isPlaying
        ? "Pause music"
        : "Play music"
  );

  button.setAttribute(
    "aria-pressed",
    String(isPlaying && !KK_MUSIC.muted)
  );
}


/* ---------------------------------------------------------
   3. FADE MUSIC VOLUME
   --------------------------------------------------------- */

function kkFadeMusic(targetVolume, duration = 900) {
  const audio = KK_MUSIC.audio;

  if (!audio) {
    return Promise.resolve();
  }

  if (KK_MUSIC.fadeTimer !== null) {
    window.clearInterval(KK_MUSIC.fadeTimer);
    KK_MUSIC.fadeTimer = null;
  }

  const target = kkClamp(targetVolume, 0, 1);

  if (KK_APP.reducedMotion || duration <= 0) {
    audio.volume = target;
    return Promise.resolve();
  }

  const startVolume = audio.volume;
  const difference = target - startVolume;
  const steps = Math.max(1, Math.round(duration / 50));
  const stepDuration = duration / steps;

  let currentStep = 0;

  return new Promise(resolve => {
    KK_MUSIC.fadeTimer = window.setInterval(() => {
      currentStep += 1;

      const progress = Math.min(
        currentStep / steps,
        1
      );

      audio.volume = kkClamp(
        startVolume + difference * progress,
        0,
        1
      );

      if (progress >= 1) {
        window.clearInterval(KK_MUSIC.fadeTimer);
        KK_MUSIC.fadeTimer = null;
        resolve();
      }
    }, stepDuration);
  });
}


/* ---------------------------------------------------------
   4. START MUSIC
   --------------------------------------------------------- */

async function kkStartMusic() {
  const audio = kkCreateMusic();

  if (!audio.paused) {
    return true;
  }

  try {
    await audio.play();

    KK_MUSIC.started = true;

    if (KK_MUSIC.muted) {
      audio.volume = 0;
    } else {
      audio.volume = 0;
      await kkFadeMusic(KK_MUSIC.volume, 1000);
    }

    kkUpdateMusicControl();

    return true;
  } catch (error) {
    console.info(
      "[K&K] Autoplay was blocked. A user interaction is needed."
    );

    kkUpdateMusicControl();

    return false;
  }
}


/* ---------------------------------------------------------
   5. PAUSE MUSIC
   --------------------------------------------------------- */

async function kkPauseMusic() {
  const audio = KK_MUSIC.audio;

  if (!audio || audio.paused) {
    return;
  }

  await kkFadeMusic(0, 500);

  audio.pause();

  if (!KK_MUSIC.muted) {
    audio.volume = KK_MUSIC.volume;
  }

  kkUpdateMusicControl();
}


/* ---------------------------------------------------------
   6. TOGGLE MUTE
   --------------------------------------------------------- */

function kkToggleMute() {
  const audio = kkCreateMusic();

  KK_MUSIC.muted = !KK_MUSIC.muted;

  if (KK_MUSIC.muted) {
    audio.volume = 0;
  } else {
    audio.volume = KK_MUSIC.volume;
  }

  kkUpdateMusicControl();
}


/* ---------------------------------------------------------
   7. MUSIC BUTTON
   --------------------------------------------------------- */

function kkBindMusicControl() {
  if (KK_MUSIC.listenersBound) {
    return;
  }

  const button = KK_DOM.musicControl;

  if (button) {
    button.addEventListener("click", async () => {
      const audio = kkCreateMusic();

      if (audio.paused) {
        await kkStartMusic();
      } else {
        await kkPauseMusic();
      }
    });
  }

  KK_MUSIC.listenersBound = true;
}


/* ---------------------------------------------------------
   8. AUTOPLAY FALLBACK
   --------------------------------------------------------- */

function kkBindMusicFallback() {
  const startOnInteraction = async () => {
    if (!KK_MUSIC.audio) {
      await kkStartMusic();
    } else if (KK_MUSIC.audio.paused) {
      await kkStartMusic();
    }

    if (
      KK_MUSIC.audio &&
      !KK_MUSIC.audio.paused
    ) {
      document.removeEventListener(
        "pointerdown",
        startOnInteraction
      );

      document.removeEventListener(
        "keydown",
        startOnInteraction
      );

      document.removeEventListener(
        "touchstart",
        startOnInteraction
      );
    }
  };

  document.addEventListener(
    "pointerdown",
    startOnInteraction
  );

  document.addEventListener(
    "keydown",
    startOnInteraction
  );

  document.addEventListener(
    "touchstart",
    startOnInteraction,
    { passive: true }
  );
}


/* ---------------------------------------------------------
   9. INITIALIZE MUSIC
   --------------------------------------------------------- */

function kkInitializeMusic() {
  kkCreateMusic();
  kkBindMusicControl();
  kkBindMusicFallback();

  // Attempt autoplay; browsers may require user interaction.
  kkStartMusic();
}


/* ---------------------------------------------------------
   10. START MUSIC ENGINE AFTER FOUNDATION
   --------------------------------------------------------- */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    kkInitializeMusic,
    { once: true }
  );
} else {
  kkInitializeMusic();
}


/* =========================================================
   END OF PART 2
   NEXT: STORY & PAGE ANIMATIONS
   ========================================================= */
   /* =========================================================
   SCRIPT.JS — PART 3
   OPENING • OUR UNIVERSE • OUR BEGINNING
   ========================================================= */


/* ---------------------------------------------------------
   1. SHARED ANIMATION HELPERS
   --------------------------------------------------------- */

function kkRevealElements(elements, options = {}) {
  const {
    delay = 100,
    className = "visible"
  } = options;

  const validElements = Array.from(elements || [])
    .filter(Boolean);

  validElements.forEach((element, index) => {
    const reveal = () => {
      element.classList.add(className);
    };

    if (KK_APP.reducedMotion) {
      reveal();
    } else {
      window.setTimeout(reveal, index * delay);
    }
  });
}


function kkAnimateCounter(element, target, duration = 1200) {
  if (!element) {
    return;
  }

  const end = Math.max(0, Number(target) || 0);

  if (KK_APP.reducedMotion) {
    element.textContent = String(end);
    return;
  }

  const startTime = performance.now();

  function update(now) {
    const progress = Math.min(
      (now - startTime) / duration,
      1
    );

    const eased = 1 - Math.pow(1 - progress, 3);

    element.textContent = String(
      Math.round(end * eased)
    );

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}


/* ---------------------------------------------------------
   2. PAGE 1 — OPENING
   --------------------------------------------------------- */

function kkInitializeOpening() {
  const page = kkGetElement("#page-1");

  if (!page) {
    return;
  }

  const beginButton = kkGetElement(
    "#beginStoryBtn",
    page
  );

  if (
    beginButton &&
    !beginButton.dataset.kkBound
  ) {
    beginButton.dataset.kkBound = "true";

    beginButton.addEventListener("click", async () => {
      await kkStartMusic();
      await kkGoToPage(2);
    });
  }

  const openingContent = kkGetElement(
    ".opening-content",
    page
  );

  if (openingContent) {
    openingContent.classList.add("opening-ready");
  }
}


/* ---------------------------------------------------------
   3. PAGE 2 — UNIVERSE DISCOVERIES
   --------------------------------------------------------- */

function kkInitializeUniverse() {
  const page = kkGetElement("#page-2");

  if (!page) {
    return;
  }

  const cards = kkGetElements(
    ".discovery-card",
    page
  );

  cards.forEach(card => {
    if (card.dataset.kkBound) {
      return;
    }

    card.dataset.kkBound = "true";

    card.addEventListener("click", () => {
      const wasOpen = card.classList.contains("revealed");

      cards.forEach(otherCard => {
        otherCard.classList.remove("revealed");
        otherCard.setAttribute(
          "aria-expanded",
          "false"
        );
      });

      if (!wasOpen) {
        card.classList.add("revealed");
        card.setAttribute(
          "aria-expanded",
          "true"
        );
      }
    });
  });

  const reveal = kkGetElement(
    ".universe-reveal",
    page
  );

  if (reveal) {
    reveal.classList.add("universe-ready");
  }
}


/* ---------------------------------------------------------
   4. PAGE 3 — STORY TIMELINE
   --------------------------------------------------------- */

function kkInitializeBeginning() {
  const page = kkGetElement("#page-3");

  if (!page) {
    return;
  }

  const scenes = kkGetElements(
    ".story-scene",
    page
  );

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12
      }
    );

    scenes.forEach(scene => {
      observer.observe(scene);
    });
  } else {
    scenes.forEach(scene => {
      scene.classList.add("visible");
    });
  }
}


/* ---------------------------------------------------------
   5. PAGE 3 — CONFESSION MESSAGE REVEAL
   --------------------------------------------------------- */

function kkInitializeConfession() {
  const page = kkGetElement("#page-3");

  if (!page) {
    return;
  }

  const confession = kkGetElement(
    ".confession-scene",
    page
  );

  if (!confession) {
    return;
  }

  const messages = kkGetElements(
    ".chat-message",
    confession
  );

  if (!messages.length) {
    return;
  }

  messages.forEach(message => {
    message.classList.add("chat-pending");
  });

  const revealMessages = () => {
    messages.forEach((message, index) => {
      const show = () => {
        message.classList.remove("chat-pending");
        message.classList.add("chat-visible");
      };

      if (KK_APP.reducedMotion) {
        show();
      } else {
        window.setTimeout(show, index * 420);
      }
    });
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            revealMessages();
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.15
      }
    );

    observer.observe(confession);
  } else {
    revealMessages();
  }
}


/* ---------------------------------------------------------
   6. PAGE 3 — FINAL STORY REVEAL
   --------------------------------------------------------- */

function kkInitializeBeginningReveal() {
  const page = kkGetElement("#page-3");

  if (!page) {
    return;
  }

  const finalScene = kkGetElement(
    ".final-beginning-scene",
    page
  );

  if (!finalScene) {
    return;
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            finalScene.classList.add("visible");
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.2
      }
    );

    observer.observe(finalScene);
  } else {
    finalScene.classList.add("visible");
  }
}


/* ---------------------------------------------------------
   7. PAGE CHANGE ANIMATION ROUTER
   --------------------------------------------------------- */

function kkInitializePageAnimations() {
  kkInitializeOpening();
  kkInitializeUniverse();
  kkInitializeBeginning();
  kkInitializeConfession();
  kkInitializeBeginningReveal();
}


/* ---------------------------------------------------------
   8. REINITIALIZE VISIBLE PAGE
   --------------------------------------------------------- */

document.addEventListener(
  "kk:pagechange",
  event => {
    const pageNumber = event.detail?.page;

    if (!pageNumber) {
      return;
    }

    switch (pageNumber) {
      case 1:
        kkInitializeOpening();
        break;

      case 2:
        kkInitializeUniverse();
        break;

      case 3:
        kkInitializeBeginning();
        kkInitializeConfession();
        kkInitializeBeginningReveal();
        break;

      default:
        break;
    }
  }
);


/* ---------------------------------------------------------
   9. INITIALIZE PAGE 1–3 FEATURES
   --------------------------------------------------------- */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    kkInitializePageAnimations,
    { once: true }
  );
} else {
  kkInitializePageAnimations();
}


/* =========================================================
   END OF PART 3
   NEXT: 365 DAYS • LITTLE THINGS • LOVE LETTER
   ========================================================= */
   
/* =========================================================
   SCRIPT.JS — PART 4
   365 DAYS • LITTLE THINGS • LOVE LETTER
   ========================================================= */


/* ---------------------------------------------------------
   PAGE 5 — 365 DAYS
   --------------------------------------------------------- */

function kkInitialize365Days() {
  const page = kkGetElement("#page-5");

  if (!page || page.dataset.kk365Ready) {
    return;
  }

  page.dataset.kk365Ready = "true";

  const counter = kkGetElement(
    "#dayCounter",
    page
  );

  if (counter) {
    kkAnimateCounter(counter, 365, 1500);
  }

  const lightsContainer = kkGetElement(
    "#dayLights",
    page
  );

  if (lightsContainer && !lightsContainer.children.length) {
    const fragment = document.createDocumentFragment();
    const totalLights = KK_APP.reducedMotion ? 36 : 72;

    for (let i = 1; i <= totalLights; i++) {
      const light = document.createElement("span");

      light.className = "day-light";
      light.style.setProperty(
        "--light-index",
        String(i)
      );

      light.setAttribute("aria-hidden", "true");
      fragment.appendChild(light);
    }

    lightsContainer.appendChild(fragment);
  }

  const revealItems = kkGetElements(
    ".day-memory",
    page
  );

  kkRevealElements(revealItems, {
    delay: 140,
    className: "visible"
  });

  const revealButton = kkGetElement(
    "[data-reveal-days]",
    page
  );

  const hiddenMessage = kkGetElement(
    ".days-hidden-message",
    page
  );

  if (revealButton && hiddenMessage) {
    revealButton.addEventListener("click", () => {
      hiddenMessage.classList.toggle("visible");

      const isVisible =
        hiddenMessage.classList.contains("visible");

      revealButton.setAttribute(
        "aria-expanded",
        String(isVisible)
      );
    });
  }
}


/* ---------------------------------------------------------
   PAGE 6 — LITTLE THINGS
   --------------------------------------------------------- */

function kkInitializeLittleThings() {
  const page = kkGetElement("#page-6");
  if (!page || page.dataset.kkLittleThingsReady) return;
  page.dataset.kkLittleThingsReady = "true";

  // The actual markup uses .memory-card (not the old .little-thing-card selector).
  const cards = kkGetElements(".memory-card", page);
  cards.forEach((card, index) => {
    card.setAttribute("aria-expanded", "false");
    card.addEventListener("click", () => {
      const opening = !card.classList.contains("revealed");
      // Keep one expanded card at a time so the page stays tidy on mobile.
      cards.forEach(other => {
        other.classList.remove("revealed");
        other.setAttribute("aria-expanded", "false");
      });
      if (opening) {
        card.classList.add("revealed");
        card.setAttribute("aria-expanded", "true");
      }
    });
    card.style.setProperty("--card-order", String(index));
  });

  const secretHeart = kkGetElement("#secretHeart", page);
  const secretMessage = kkGetElement("#secretHeartMessage", page);
  if (secretHeart && secretMessage) {
    secretHeart.setAttribute("aria-expanded", "false");
    secretHeart.addEventListener("click", () => {
      secretMessage.classList.toggle("visible");
      secretHeart.setAttribute("aria-expanded", String(secretMessage.classList.contains("visible")));
    });
  }

  const revealTargets = [
    ...kkGetElements(".memory-card", page),
    ...kkGetElements(".things-i-love", page),
    ...kkGetElements(".secret-heart", page)
  ];
  if (KK_APP.reducedMotion) {
    revealTargets.forEach(el => el.classList.add("visible"));
  } else {
    revealTargets.forEach((el, i) => {
      el.classList.remove("visible");
      window.setTimeout(() => el.classList.add("visible"), 100 + i * 65);
    });
  }
}

/* ---------------------------------------------------------
   PAGE 7 — LOVE LETTER
   --------------------------------------------------------- */

function kkInitializeLoveLetter() {
  const page = kkGetElement("#page-7");
  if (!page || page.dataset.kkLetterReady) return;
  page.dataset.kkLetterReady = "true";
  const envelope = kkGetElement("#envelope", page);
  const letter = kkGetElement("#loveLetter", page);
  const hint = kkGetElement("#letterHint", page);
  if (!envelope || !letter) return;

  const openLetter = () => {
    if (envelope.classList.contains("opened")) return;
    envelope.classList.add("opened");
    envelope.setAttribute("aria-expanded", "true");
    if (hint) hint.classList.add("hidden");
    // Let the flap lift and paper slide out before the envelope leaves the scene.
    window.setTimeout(() => {
      envelope.classList.add("envelope-leaving");
    }, KK_APP.reducedMotion ? 0 : 760);
    window.setTimeout(() => {
      envelope.hidden = true;
      envelope.setAttribute("aria-hidden", "true");
      letter.classList.add("show");
      letter.setAttribute("aria-hidden", "false");
      page.classList.add("letter-revealed");
    }, KK_APP.reducedMotion ? 0 : 1180);
  };
  envelope.addEventListener("click", openLetter);
  envelope.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault(); openLetter();
    }
  });
}

/* ---------------------------------------------------------
   PAGE-SPECIFIC INITIALIZATION
   --------------------------------------------------------- */

function kkInitializeMemoryPages() {
  kkInitialize365Days();
  kkInitializeLittleThings();
  kkInitializeLoveLetter();
}


/* ---------------------------------------------------------
   PAGE CHANGE ROUTER
   --------------------------------------------------------- */

document.addEventListener("kk:pagechange", event => {
  const pageNumber = event.detail?.page;

  switch (pageNumber) {
    case 5:
      kkInitialize365Days();
      break;

    case 6:
      kkInitializeLittleThings();
      break;

    case 7:
      kkInitializeLoveLetter();
      break;

    default:
      break;
  }
});


/* ---------------------------------------------------------
   INITIALIZATION
   --------------------------------------------------------- */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    kkInitializeMemoryPages,
    { once: true }
  );
} else {
  kkInitializeMemoryPages();
}


/* =========================================================
   END OF PART 4
   NEXT: PROMISES • FUTURE • MEMORY CAPSULE
   ========================================================= */
   
/* =========================================================
   SCRIPT.JS — PART 5
   PROMISES • OUR FUTURE • MEMORY CAPSULE
   ========================================================= */


/* ---------------------------------------------------------
   PAGE 8 — PROMISES
   --------------------------------------------------------- */

function kkInitializePromises() {
  const page = kkGetElement("#page-8");

  if (!page || page.dataset.kkPromisesReady) {
    return;
  }

  page.dataset.kkPromisesReady = "true";

  const promiseCards = kkGetElements(
    ".promise-card",
    page
  );

  promiseCards.forEach(card => {
    card.addEventListener("click", () => {
      const isOpen = card.classList.contains("revealed");

      card.classList.toggle("revealed", !isOpen);

      card.setAttribute(
        "aria-expanded",
        String(!isOpen)
      );
    });
  });

  const specialPromise = kkGetElement(
    ".special-promise",
    page
  );

  const promiseButton = kkGetElement(
    "[data-reveal-promise]",
    page
  );

  if (specialPromise && promiseButton) {
    promiseButton.addEventListener("click", () => {
      const isOpen =
        specialPromise.classList.contains("visible");

      specialPromise.classList.toggle(
        "visible",
        !isOpen
      );

      promiseButton.setAttribute(
        "aria-expanded",
        String(!isOpen)
      );
    });
  }

  kkRevealElements(
    kkGetElements(".promise-intro", page),
    {
      delay: 160,
      className: "visible"
    }
  );
}


/* ---------------------------------------------------------
   PAGE 9 — OUR FUTURE
   --------------------------------------------------------- */

function kkInitializeFuture() {
  const page = kkGetElement("#page-9");

  if (!page || page.dataset.kkFutureReady) {
    return;
  }

  page.dataset.kkFutureReady = "true";

  const futureCards = kkGetElements(
    ".future-card",
    page
  );

  futureCards.forEach(card => {
    card.addEventListener("click", () => {
      const isOpen = card.classList.contains("revealed");

      card.classList.toggle("revealed", !isOpen);

      card.setAttribute(
        "aria-expanded",
        String(!isOpen)
      );
    });
  });

  const timelineItems = kkGetElements(
    ".future-timeline-item",
    page
  );

  kkRevealElements(timelineItems, {
    delay: 220,
    className: "visible"
  });

  const futureMessage = kkGetElement(
    ".future-final-message",
    page
  );

  const revealButton = kkGetElement(
    "[data-reveal-future]",
    page
  );

  if (futureMessage && revealButton) {
    revealButton.addEventListener("click", () => {
      futureMessage.classList.toggle("visible");

      revealButton.setAttribute(
        "aria-expanded",
        String(
          futureMessage.classList.contains("visible")
        )
      );
    });
  }
}


/* ---------------------------------------------------------
   PAGE 10 — MEMORY CAPSULE
   --------------------------------------------------------- */

function kkInitializeMemoryCapsule() {
  const page = kkGetElement("#page-10");
  if (!page || page.dataset.kkCapsuleReady) return;
  page.dataset.kkCapsuleReady = "true";
  const jar = kkGetElement("#memoryCapsule", page);
  const hint = kkGetElement("#capsuleHint", page);
  const chits = kkGetElements(".capsule-fragment", page);
  const chitsWrap = kkGetElement("#capsuleFragments", page);
  const seal = kkGetElement("#sealCapsuleBtn", page);
  const secret = kkGetElement("#capsuleSecret", page);
  if (!jar) return;

  const openJar = () => {
    if (jar.classList.contains("opened")) return;
    jar.classList.add("opened");
    jar.setAttribute("aria-expanded", "true");
    if (hint) hint.classList.add("hidden");
    if (chitsWrap) { chitsWrap.setAttribute("aria-hidden", "false"); chitsWrap.classList.add("show"); }
    chits.forEach((chit, index) => {
      window.setTimeout(() => chit.classList.add("visible"), KK_APP.reducedMotion ? 0 : 280 + index * 190);
    });
    if (seal) {
      window.setTimeout(() => { seal.disabled = false; seal.classList.add("ready"); }, KK_APP.reducedMotion ? 0 : 1500);
    }
  };
  jar.addEventListener("click", openJar);
  jar.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openJar(); }
  });
  if (seal) {
    seal.disabled = true;
    seal.addEventListener("click", () => {
      if (!jar.classList.contains("opened")) openJar();
      if (secret) secret.classList.add("show");
      seal.disabled = true;
      seal.querySelector("span")?.replaceChildren(document.createTextNode("Memories, safely kept"));
    });
  }
}

/* ---------------------------------------------------------
   PAGE CHANGE ROUTER
   --------------------------------------------------------- */

document.addEventListener("kk:pagechange", event => {
  const pageNumber = event.detail?.page;

  switch (pageNumber) {
    case 8:
      kkInitializePromises();
      break;

    case 9:
      kkInitializeFuture();
      break;

    case 10:
      kkInitializeMemoryCapsule();
      break;

    default:
      break;
  }
});


/* ---------------------------------------------------------
   INITIALIZATION
   --------------------------------------------------------- */

function kkInitializePromiseFutureCapsule() {
  kkInitializePromises();
  kkInitializeFuture();
  kkInitializeMemoryCapsule();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    kkInitializePromiseFutureCapsule,
    { once: true }
  );
} else {
  kkInitializePromiseFutureCapsule();
}


/* =========================================================
   END OF PART 5
   NEXT: FINAL MESSAGE • FIREWORKS FINALE
   ========================================================= */
   
/* =========================================================
   SCRIPT.JS — PART 6
   ONE LAST MESSAGE • GRAND FINALE
   ========================================================= */


/* ---------------------------------------------------------
   PAGE 11 — ONE LAST MESSAGE
   --------------------------------------------------------- */

let kkFinalMessageRunId = 0;
let kkFinaleRunId = 0;

function kkInitializeFinalMessage() {
  const page = kkGetElement("#page-11");
  if (!page || page.dataset.kkFinalMessageReady) return;
  page.dataset.kkFinalMessageReady = "true";
  const button = kkGetElement("#lightSkyBtn", page);
  const lines = kkGetElements("[data-message-line]", page);
  if (button) button.addEventListener("click", async () => {
    await kkStartMusic();
    await kkGoToPage(12);
  });
  page.addEventListener("kk:reveal-final-message", () => {
    const run = ++kkFinalMessageRunId;
    lines.forEach(line => line.classList.remove("visible"));
    if (button) button.classList.remove("show");
    const reveal = index => {
      if (run !== kkFinalMessageRunId || !page.classList.contains("active")) return;
      if (index >= lines.length) { if (button) button.classList.add("show"); return; }
      lines[index].classList.add("visible");
      window.setTimeout(() => reveal(index + 1), KK_APP.reducedMotion ? 0 : 1150);
    };
    window.setTimeout(() => reveal(0), KK_APP.reducedMotion ? 0 : 300);
  });
}

const KK_FIREWORKS = {
  canvas: null,
  context: null,
  animationFrame: 0,
  running: false,
  particles: [],
  rockets: [],
  lastFrame: 0,
  lastLaunch: 0,
  width: 0,
  height: 0,
  pixelRatio: 1,
  reduced: false
};


function kkResizeFireworks() {
  const canvas = KK_FIREWORKS.canvas;

  if (!canvas) {
    return;
  }

  const rect = canvas.getBoundingClientRect();

  KK_FIREWORKS.width = Math.max(1, rect.width);
  KK_FIREWORKS.height = Math.max(1, rect.height);

  KK_FIREWORKS.pixelRatio = Math.min(
    window.devicePixelRatio || 1,
    1.5
  );

  canvas.width = Math.round(
    KK_FIREWORKS.width * KK_FIREWORKS.pixelRatio
  );

  canvas.height = Math.round(
    KK_FIREWORKS.height * KK_FIREWORKS.pixelRatio
  );

  KK_FIREWORKS.context = canvas.getContext("2d");

  if (KK_FIREWORKS.context) {
    KK_FIREWORKS.context.setTransform(
      KK_FIREWORKS.pixelRatio,
      0,
      0,
      KK_FIREWORKS.pixelRatio,
      0,
      0
    );
  }
}


function kkLaunchFirework() {
  const engine = KK_FIREWORKS;

  if (!engine.running) {
    return;
  }

  const x = engine.width * (
    0.12 + Math.random() * 0.76
  );

  const targetY = engine.height * (
    0.12 + Math.random() * 0.48
  );

  engine.rockets.push({
    x,
    y: engine.height + 4,
    targetX: x + (Math.random() - 0.5) * 65,
    targetY,
    speed: 5 + Math.random() * 3,
    hue: Math.floor(Math.random() * 360)
  });
}


function kkExplodeFirework(x, y, hue) {
  const engine = KK_FIREWORKS;

  const count = engine.reduced ? 22 : 48;
  const shape = Math.random();

  for (let i = 0; i < count; i++) {
    const angle = (
      Math.PI * 2 * i / count
    ) + (Math.random() - 0.5) * 0.12;

    const speed = 1.2 + Math.random() * 4;

    engine.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.008 + Math.random() * 0.012,
      size: 1 + Math.random() * 2,
      hue: hue + Math.random() * 35,
      heart: shape > 0.82
    });
  }
}


function kkUpdateFireworks(delta) {
  const engine = KK_FIREWORKS;
  const ctx = engine.context;

  if (!ctx) {
    return;
  }

  ctx.fillStyle = "rgba(3, 4, 20, 0.20)";
  ctx.fillRect(
    0,
    0,
    engine.width,
    engine.height
  );

  const now = performance.now();

  if (now - engine.lastLaunch > (
    engine.reduced ? 1050 : 480
  )) {
    kkLaunchFirework();
    engine.lastLaunch = now;
  }

  engine.rockets = engine.rockets.filter(rocket => {
    const dx = rocket.targetX - rocket.x;
    const dy = rocket.targetY - rocket.y;
    const distance = Math.hypot(dx, dy);
    const step = rocket.speed * delta / 16.67;

    if (distance <= step + 3) {
      kkExplodeFirework(
        rocket.targetX,
        rocket.targetY,
        rocket.hue
      );

      return false;
    }

    rocket.x += dx / distance * step;
    rocket.y += dy / distance * step;

    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${rocket.hue}, 100%, 80%)`;
    ctx.fill();

    return true;
  });

  engine.particles = engine.particles.filter(particle => {
    particle.x += particle.vx * delta / 16.67;
    particle.y += particle.vy * delta / 16.67;

    particle.vx *= 0.99;
    particle.vy = particle.vy * 0.99 + 0.025;
    particle.life -= particle.decay * delta / 16.67;

    if (particle.life <= 0) {
      return false;
    }

    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.beginPath();

    ctx.arc(
      particle.x,
      particle.y,
      particle.size,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      `hsl(${particle.hue}, 100%, 70%)`;

    ctx.fill();

    return true;
  });

  ctx.globalAlpha = 1;

  const maximumParticles = engine.reduced ? 300 : 950;

  if (engine.particles.length > maximumParticles) {
    engine.particles.splice(
      0,
      engine.particles.length - maximumParticles
    );
  }
}


function kkFireworksFrame(now) {
  const engine = KK_FIREWORKS;

  if (!engine.running) {
    return;
  }

  const delta = Math.min(
    now - (engine.lastFrame || now),
    40
  );

  engine.lastFrame = now;

  kkUpdateFireworks(delta);

  engine.animationFrame = requestAnimationFrame(
    kkFireworksFrame
  );
}


function kkStartFireworks() {
  const engine = KK_FIREWORKS;

  if (engine.running) {
    return;
  }

  const page = kkGetElement("#page-12");

  if (!page) {
    return;
  }

  const canvas = kkGetElement(
    ".fireworks-canvas",
    page
  );

  if (!canvas) {
    console.warn(
      "Fireworks canvas not found on page 12."
    );
    return;
  }

  engine.canvas = canvas;
  engine.reduced = KK_APP.reducedMotion;
  engine.running = true;
  engine.lastFrame = 0;
  engine.lastLaunch = 0;
  engine.particles = [];
  engine.rockets = [];

  kkResizeFireworks();

  window.addEventListener(
    "resize",
    kkResizeFireworks
  );

  engine.animationFrame = requestAnimationFrame(
    kkFireworksFrame
  );
}


function kkStopFireworks() {
  const engine = KK_FIREWORKS;

  engine.running = false;

  if (engine.animationFrame) {
    cancelAnimationFrame(engine.animationFrame);
    engine.animationFrame = 0;
  }

  window.removeEventListener(
    "resize",
    kkResizeFireworks
  );
}


async function kkRunFinaleMessages() {
  const page = kkGetElement("#page-12");
  if (!page) return;
  const run = ++kkFinaleRunId;
  const messages = kkGetElements(".finale-message", page);
  const ready = kkGetElement("#finaleReady", page);
  const logo = kkGetElement("#finalKK", page);
  const ending = kkGetElement("#finalEnd", page);
  const replay = kkGetElement("#replayFinaleBtn", page);
  const loveBurst = kkGetElement("#fireworkLoveBurst", page);
  messages.forEach(node => node.classList.remove("visible"));
  [logo, ending, replay, loveBurst].forEach(node => node && node.classList.remove("visible", "burst-now"));
  if (loveBurst) loveBurst.setAttribute("aria-hidden", "true");
  if (ready) ready.classList.remove("done");
  kkStartFireworks();
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  await wait(KK_APP.reducedMotion ? 0 : 650);
  if (run !== kkFinaleRunId || !page.classList.contains("active")) return;
  if (ready) ready.classList.add("done");
  for (const node of messages) {
    await wait(KK_APP.reducedMotion ? 0 : 850);
    if (run !== kkFinaleRunId || !page.classList.contains("active")) return;
    node.classList.add("visible");
  }
  await wait(KK_APP.reducedMotion ? 0 : 350);
  // A coordinated centre-screen burst carries the final words.
  const engine = KK_FIREWORKS;
  if (engine.running && engine.context) {
    const cx = engine.width * 0.5;
    const cy = engine.height * 0.43;
    [18, 48, 205, 315].forEach((hue, i) => {
      window.setTimeout(() => kkExplodeFirework(cx + (i - 1.5) * 42, cy + (i % 2 ? 14 : -12), hue), i * 115);
    });
  }
  if (loveBurst) {
    loveBurst.setAttribute("aria-hidden", "false");
    loveBurst.classList.add("visible", "burst-now");
  }
  await wait(KK_APP.reducedMotion ? 0 : 900);
  if (logo) logo.classList.add("visible");
  await wait(KK_APP.reducedMotion ? 0 : 450);
  if (ending) ending.classList.add("visible");
  if (replay) replay.classList.add("visible");
}

function kkInitializeFinalPages() {
  kkInitializeFinalMessage();
  const replay = kkGetElement("#replayFinaleBtn");
  if (replay && !replay.dataset.kkReplayReady) {
    replay.dataset.kkReplayReady = "true";
    replay.addEventListener("click", () => kkRunFinaleMessages());
  }
  document.addEventListener("kk:pagechange", event => {
    const page = event.detail?.page;
    if (page === 11) {
      const target = kkGetElement("#page-11");
      if (target) target.dispatchEvent(new CustomEvent("kk:reveal-final-message"));
      kkStopFireworks();
    } else if (page === 12) {
      kkRunFinaleMessages();
    } else {
      kkStopFireworks();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", kkInitializeFinalPages, { once: true });
} else {
  kkInitializeFinalPages();
}

/* =========================================================
   END OF PART 6
   SCRIPT.JS PARTS 1–6 COMPLETE
   ========================================================= */
   