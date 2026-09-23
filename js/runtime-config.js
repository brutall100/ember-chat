/*
 * Runtime mode.
 * On GitHub Pages this static file is served as-is, so the app runs in DEMO mode
 * (messages live in your browser). When you run `npm start`, server.js answers
 * this same URL with { mode: "live" } and the app switches to real-time chat.
 */
window.EMBER_CONFIG = { mode: "demo", storage: "browser" };
