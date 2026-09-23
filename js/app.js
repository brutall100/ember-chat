/*
 * Ember Chat – browser code
 * LIVE mode (npm start): Socket.IO + MySQL on the server.
 * DEMO mode (GitHub Pages): letters are kept in localStorage and Alex Doe writes back.
 */
(function () {
  "use strict";

  const config = window.EMBER_CONFIG || { mode: "demo", storage: "browser" };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const KEYS = {
    theme: "ember-chat:theme",
    author: "ember-chat:author",
    letters: "ember-chat:letters",
  };
  const MAX_BODY = 500;
  const BOT_NAME = "Alex Doe";

  const $ = (id) => document.getElementById(id);
  const els = {
    root: document.documentElement,
    embers: $("embers"),
    themeToggle: $("theme-toggle"),
    statusPill: $("status-pill"),
    statusText: $("status-text"),
    author: $("author-input"),
    paper: $("paper"),
    letters: $("letters"),
    typing: $("typing"),
    typingText: $("typing-text"),
    form: $("composer"),
    message: $("message-input"),
    charCount: $("char-count"),
    send: $("send-button"),
    clear: $("clear-button"),
    error: $("form-error"),
    statLetters: $("stat-letters"),
    statOnline: $("stat-online"),
    statWords: $("stat-words"),
  };

  /* ---------- Safe storage helpers ---------- */

  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    },
  };

  /* ---------- Theme ---------- */

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    const forced = els.root.getAttribute("data-theme");
    if (forced) return forced;
    return darkQuery.matches ? "dark" : "light";
  }

  function paintThemeToggle() {
    const isDark = currentTheme() === "dark";
    els.root.classList.toggle("is-dark", isDark);
    els.themeToggle.setAttribute("aria-pressed", String(isDark));
    els.themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  }

  els.themeToggle.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    els.root.setAttribute("data-theme", next);
    storage.set(KEYS.theme, next);
    paintThemeToggle();
  });
  darkQuery.addEventListener("change", paintThemeToggle);
  paintThemeToggle();

  /* ---------- Living background ---------- */

  function spawnEmbers() {
    if (reduceMotion) return;
    const count = window.innerWidth < 600 ? 14 : 26;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const ember = document.createElement("span");
      ember.className = "ember";
      ember.style.left = `${Math.random() * 100}%`;
      ember.style.setProperty("--size", `${3 + Math.random() * 5}px`);
      ember.style.setProperty("--duration", `${10 + Math.random() * 12}s`);
      ember.style.setProperty("--delay", `${-Math.random() * 20}s`);
      ember.style.setProperty("--sway", `${(Math.random() - 0.5) * 120}px`);
      fragment.appendChild(ember);
    }
    els.embers.appendChild(fragment);
  }
  spawnEmbers();

  /* ---------- Reveal on scroll ---------- */

  const revealTargets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i, 4) * 60}ms`;
      observer.observe(el);
    });
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Buttons: ripple + flying envelope ---------- */

  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("pointerdown", (event) => {
      if (reduceMotion) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  });

  function flyEnvelope() {
    const envelope = els.send.querySelector(".envelope");
    envelope.classList.remove("is-flying");
    void envelope.getBoundingClientRect(); // restart the animation
    envelope.classList.add("is-flying");
  }

  /* ---------- Counters ---------- */

  function countTo(el, target) {
    const start = Number(el.dataset.value) || 0;
    el.dataset.value = String(target);
    if (reduceMotion || start === target) {
      el.textContent = target.toLocaleString("en");
      return;
    }
    const duration = 900;
    const began = performance.now();
    function tick(now) {
      const t = Math.min((now - began) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(start + (target - start) * eased).toLocaleString("en");
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const state = { letters: [], online: 0 };

  function updateStats() {
    const words = state.letters.reduce((sum, l) => sum + l.body.split(/\s+/).filter(Boolean).length, 0);
    countTo(els.statLetters, state.letters.length);
    countTo(els.statOnline, state.online);
    countTo(els.statWords, words);
  }

  /* ---------- Rendering ---------- */

  const SVG_NS = "http://www.w3.org/2000/svg";
  const SEAL_PATH = "M32 3c4 0 6 3 9 4s7-1 10 2 1 6 3 9 5 5 5 9-3 6-4 9 1 7-2 10-6 1-9 3-5 5-9 5-6-3-9-4-7 1-10-2-1-6-3-9-5-5-5-9 3-6 4-9-1-7 2-10 6-1 9-3 5-5 9-5z";

  function initials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || "?").slice(0, 2);
    return letters.toUpperCase();
  }

  // A wax-seal avatar made from the author's initials – no real photos.
  function sealAvatar(name) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 64 64");
    svg.setAttribute("class", "seal");
    svg.setAttribute("aria-hidden", "true");

    const wax = document.createElementNS(SVG_NS, "path");
    wax.setAttribute("class", "seal-wax");
    wax.setAttribute("d", SEAL_PATH);

    const ring = document.createElementNS(SVG_NS, "circle");
    ring.setAttribute("class", "seal-ring");
    ring.setAttribute("cx", "32");
    ring.setAttribute("cy", "32");
    ring.setAttribute("r", "20");

    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", "32");
    text.setAttribute("y", "32");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.setAttribute("font-size", "20");
    text.textContent = initials(name);

    svg.append(wax, ring, text);
    return svg;
  }

  const timeFormat = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" });

  function renderLetter(letter) {
    const own = letter.author === els.author.value.trim();
    const li = document.createElement("li");
    li.className = `letter ${own ? "letter--own" : "letter--other"}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const head = document.createElement("div");
    head.className = "bubble-head";
    const who = document.createElement("strong");
    who.textContent = letter.author;
    const when = document.createElement("time");
    when.dateTime = letter.createdAt;
    when.textContent = timeFormat.format(new Date(letter.createdAt));
    head.append(who, when);

    const body = document.createElement("p");
    body.textContent = letter.body; // textContent keeps HTML from being injected

    bubble.append(head, body);
    li.append(sealAvatar(letter.author), bubble);
    return li;
  }

  function renderAll() {
    els.letters.replaceChildren();
    if (state.letters.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "The desk is empty. Write the first letter.";
      els.letters.append(empty);
    } else {
      const fragment = document.createDocumentFragment();
      state.letters.forEach((l) => fragment.append(renderLetter(l)));
      els.letters.append(fragment);
    }
    scrollToBottom();
    updateStats();
  }

  function appendLetter(letter) {
    if (state.letters.some((l) => l.id === letter.id)) return;
    const wasEmpty = state.letters.length === 0;
    state.letters.push(letter);
    if (wasEmpty) {
      renderAll();
      return;
    }
    els.letters.append(renderLetter(letter));
    scrollToBottom();
    updateStats();
  }

  function scrollToBottom() {
    els.paper.scrollTo({ top: els.paper.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function setStatus(stateName, text) {
    els.statusPill.dataset.state = stateName;
    els.statusText.textContent = text;
  }

  function showError(text) {
    els.error.textContent = text || "";
  }

  /* ---------- Author name ---------- */

  const savedAuthor = storage.get(KEYS.author);
  els.author.value = savedAuthor || `Guest ${Math.floor(1000 + Math.random() * 9000)}`;
  els.author.addEventListener("change", () => {
    const name = els.author.value.replace(/\s+/g, " ").trim().slice(0, 40);
    els.author.value = name;
    if (name) storage.set(KEYS.author, name);
    renderAll(); // re-check which letters are "yours"
  });

  /* ---------- Composer ---------- */

  function updateCharCount() {
    els.charCount.textContent = `${els.message.value.length} / ${MAX_BODY}`;
  }
  els.message.addEventListener("input", () => {
    updateCharCount();
    showError("");
  });
  els.message.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      els.form.requestSubmit();
    }
  });
  updateCharCount();

  let transport = null;

  els.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!transport) return; // still connecting
    const author = els.author.value.replace(/\s+/g, " ").trim();
    const body = els.message.value.trim();

    if (!author) {
      showError("Please write your name first.");
      els.author.focus();
      return;
    }
    if (!body) {
      showError("An empty letter is hard to read – write something first.");
      els.message.focus();
      return;
    }

    storage.set(KEYS.author, author);
    els.send.disabled = true;
    flyEnvelope();

    const result = await transport.send(author, body.slice(0, MAX_BODY));
    els.send.disabled = false;

    if (result.ok) {
      els.message.value = "";
      updateCharCount();
      showError("");
    } else {
      showError(result.error || "The letter got lost. Please try again.");
    }
    els.message.focus();
  });

  /* ---------- Transport: LIVE (Socket.IO) ---------- */

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  }

  async function startLive() {
    setStatus("connecting", "Connecting…");
    await loadScript("socket.io/socket.io.js");
    const socket = window.io();

    socket.on("connect", () => {
      setStatus("live", config.storage === "mysql" ? "Live · MySQL" : "Live · memory");
    });
    socket.on("disconnect", () => setStatus("connecting", "Reconnecting…"));
    socket.on("presence", (count) => {
      state.online = count;
      updateStats();
    });
    socket.on("message:new", appendLetter);

    try {
      const response = await fetch("api/messages", { cache: "no-store" });
      state.letters = response.ok ? await response.json() : [];
    } catch (e) {
      state.letters = [];
    }
    renderAll();

    return {
      send(author, body) {
        return new Promise((resolve) => {
          socket.timeout(5000).emit("message:send", { author, body }, (err, reply) => {
            resolve(err ? { ok: false, error: "The server did not answer in time." } : reply);
          });
        });
      },
    };
  }

  /* ---------- Transport: DEMO (browser only) ---------- */

  const BOT_REPLIES = [
    "What a lovely letter! The candle burns a little brighter now.",
    "Received and sealed. In live mode this would reach everyone in the room instantly.",
    "Tip: run `npm start` locally and open two tabs – you will see letters fly between them.",
    "I read every word twice. Tell me more?",
    "The ink is still wet on this one. Thank you for writing!",
    "Demo mode keeps our letters in your browser only. Nobody else can read them.",
  ];

  function startDemo() {
    setStatus("demo", "Demo · browser");
    els.clear.hidden = false;

    let saved = [];
    try {
      saved = JSON.parse(storage.get(KEYS.letters) || "[]");
    } catch (e) {
      saved = [];
    }
    if (!Array.isArray(saved) || saved.length === 0) {
      saved = [{
        id: `seed-${Date.now()}`,
        author: BOT_NAME,
        body: "Welcome to Ember Chat! This is the demo desk – write me a letter and I will answer.",
        createdAt: new Date().toISOString(),
      }];
    }
    state.letters = saved;
    state.online = 2;
    renderAll();

    const persist = () => storage.set(KEYS.letters, JSON.stringify(state.letters.slice(-100)));
    persist();

    let replyIndex = Math.floor(Math.random() * BOT_REPLIES.length);
    let replyTimer = null;

    function botReply() {
      clearTimeout(replyTimer);
      els.typingText.textContent = `${BOT_NAME} is writing…`;
      els.typing.hidden = false;
      replyTimer = setTimeout(() => {
        els.typing.hidden = true;
        appendLetter({
          id: `demo-${Date.now()}`,
          author: BOT_NAME,
          body: BOT_REPLIES[replyIndex++ % BOT_REPLIES.length],
          createdAt: new Date().toISOString(),
        });
        persist();
      }, 1400);
    }

    els.clear.addEventListener("click", () => {
      clearTimeout(replyTimer);
      els.typing.hidden = true;
      storage.remove(KEYS.letters);
      state.letters = [];
      renderAll();
      showError("");
    });

    return {
      send(author, body) {
        appendLetter({
          id: `demo-${Date.now()}`,
          author,
          body,
          createdAt: new Date().toISOString(),
        });
        persist();
        if (author !== BOT_NAME) botReply();
        return Promise.resolve({ ok: true });
      },
    };
  }

  /* ---------- Start ---------- */

  (async function start() {
    if (config.mode === "live") {
      try {
        transport = await startLive();
        return;
      } catch (e) {
        console.warn("Live mode failed, switching to demo.", e);
      }
    }
    transport = startDemo();
  })();
})();
