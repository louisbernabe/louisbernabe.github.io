/* ==========================================================================
   BLADE RUNNER LINKS
   Three small touches for links, in the manner of a terminal in a dark room:

   1. DECODE   Short text links scramble, then resolve letter by letter,
               on hover and on keyboard focus.
   2. FADE     Moving to another page of your site dims the screen while a
               thin line sweeps down it, like a scan.
   3. MARKER   Links to other sites get a small arrow, and rel="noopener".

   Usage (after your stylesheet):
     <script src="bladerunner-links.js" defer></script>

   Opt out on any link:
     data-no-scramble     skip the decode effect
     data-no-transition   skip the page fade

   Colours are read from your stylesheet's variables (--ochre / --amber,
   --ink / --void), so it matches both the neon and the sober edition.
   Visitors who prefer reduced motion get no scramble and no fade.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  function token(names, fallback) {
    var styles = getComputedStyle(root);
    for (var i = 0; i < names.length; i++) {
      var value = styles.getPropertyValue(names[i]).trim();
      if (value) return value;
    }
    return fallback;
  }

  var ACCENT = token(["--ochre", "--amber"], "#c48a4c");
  var BACKDROP = token(["--ink", "--void"], "#0f1112");

  /* ------------------------------------------------------------------
     1. DECODE
     ------------------------------------------------------------------ */
  var GLYPHS = "0123456789ABCDEF<>/\\_-=+*";
  var DURATION = 380;   // ms for the whole word to resolve
  var FRAME = 38;       // ms between scramble frames

  function scrambleLinks() {
    if (reduceMotion) return;

    var links = document.querySelectorAll(".site-nav a, .brand, a[data-scramble]");

    Array.prototype.forEach.call(links, function (link) {
      var original = link.textContent;
      // Only plain text links: leave anything with inner markup alone
      if (link.children.length > 0 || link.hasAttribute("data-no-scramble")) return;
      if (original.trim().length === 0 || original.length > 32) return;

      var timer = null;

      function stop() {
        if (timer) { clearInterval(timer); timer = null; }
        link.textContent = original;
        link.style.display = "";
        link.style.width = "";
        link.style.whiteSpace = "";
      }

      function start() {
        if (timer) clearInterval(timer);

        // Fix the width so the layout does not twitch while letters change
        var width = link.getBoundingClientRect().width;
        link.style.display = "inline-block";
        link.style.width = width + "px";
        link.style.whiteSpace = "nowrap";

        var begun = performance.now();

        timer = setInterval(function () {
          var progress = Math.min((performance.now() - begun) / DURATION, 1);
          var settled = Math.floor(progress * original.length);
          var out = "";

          for (var i = 0; i < original.length; i++) {
            var ch = original.charAt(i);
            if (i < settled || ch === " ") {
              out += ch;
            } else {
              out += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
            }
          }

          link.textContent = out;
          if (progress >= 1) stop();
        }, FRAME);
      }

      link.addEventListener("mouseenter", start);
      link.addEventListener("focus", start);
      link.addEventListener("mouseleave", stop);
      link.addEventListener("blur", stop);
    });
  }

  /* ------------------------------------------------------------------
     2. FADE: a scan line sweeps down while the page dims
     ------------------------------------------------------------------ */
  var leaving = false;
  var overlay = null;

  function isInternalPage(link) {
    if (link.hasAttribute("data-no-transition") || link.hasAttribute("download")) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.origin !== location.origin) return false;
    // Same-page anchors and query-only changes should behave normally
    if (link.pathname === location.pathname && link.search === location.search) return false;
    return true;
  }

  function leave(url) {
    leaving = true;

    overlay = document.createElement("div");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:9999;pointer-events:none;opacity:0;background:" + BACKDROP + ";";

    var line = document.createElement("div");
    line.style.cssText =
      "position:absolute;left:0;right:0;top:0;height:1px;background:" + ACCENT + ";" +
      "box-shadow:0 0 18px " + ACCENT + ";opacity:0.85;";

    overlay.appendChild(line);
    document.body.appendChild(overlay);

    overlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 340, easing: "ease-in", fill: "forwards" });
    line.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(100vh)" }],
      { duration: 340, easing: "ease-in", fill: "forwards" }
    );

    setTimeout(function () { window.location.assign(url); }, 340);
  }

  function pageTransitions() {
    if (reduceMotion || typeof Element.prototype.animate !== "function") return;

    document.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var link = event.target.closest ? event.target.closest("a[href]") : null;
      if (!link || leaving || !isInternalPage(link)) return;

      event.preventDefault();
      leave(link.href);
    });

    // Arriving: the new page comes up out of the dark
    document.body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: "ease-out" });

    // Back/forward cache: clear the overlay if the visitor returns to this page
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) {
        leaving = false;
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        overlay = null;
      }
    });
  }

  /* ------------------------------------------------------------------
     3. MARKER: arrow on links that leave your site
     ------------------------------------------------------------------ */
  function markExternalLinks() {
    var links = document.querySelectorAll("a[href^='http']");

    Array.prototype.forEach.call(links, function (link) {
      if (link.origin === location.origin) return;

      var rel = (link.getAttribute("rel") || "").split(/\s+/).filter(Boolean);
      ["noopener", "noreferrer"].forEach(function (value) {
        if (rel.indexOf(value) === -1) rel.push(value);
      });
      link.setAttribute("rel", rel.join(" "));

      // Skip links that hold images or other markup, and buttons
      if (link.children.length > 0 || link.classList.contains("btn")) return;

      var arrow = document.createElement("span");
      arrow.textContent = "\u2197";
      arrow.setAttribute("aria-hidden", "true");
      arrow.style.cssText =
        "display:inline-block;margin-left:0.3em;font-size:0.8em;opacity:0.55;" +
        "transition:transform 0.2s,opacity 0.2s,color 0.2s;";
      link.appendChild(arrow);

      function lift() {
        arrow.style.transform = "translate(2px,-2px)";
        arrow.style.opacity = "1";
        arrow.style.color = ACCENT;
      }
      function rest() {
        arrow.style.transform = "";
        arrow.style.opacity = "0.55";
        arrow.style.color = "";
      }

      link.addEventListener("mouseenter", lift);
      link.addEventListener("focus", lift);
      link.addEventListener("mouseleave", rest);
      link.addEventListener("blur", rest);
    });
  }

  /* ------------------------------------------------------------------ */
  function init() {
    scrambleLinks();
    pageTransitions();
    markExternalLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
