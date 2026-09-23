/*
 * Loaded in <head> before the CSS paints, so the saved theme is applied
 * immediately and the page never flashes the wrong colours.
 */
(function () {
  var root = document.documentElement;
  var saved = null;

  try {
    saved = localStorage.getItem("ember-chat:theme");
  } catch (e) {
    /* storage blocked – fall back to prefers-color-scheme */
  }

  if (saved === "light" || saved === "dark") {
    root.setAttribute("data-theme", saved);
  }

  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var isDark = saved ? saved === "dark" : prefersDark;

  root.classList.add("js");
  root.classList.toggle("is-dark", isDark);
})();
