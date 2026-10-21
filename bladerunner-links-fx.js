/* ==========================================================================
   BLADE RUNNER LINKS: FX
   A second set of touches for links. It works on its own or alongside
   bladerunner-links.js (decode, page scan, outbound arrow).

   1. READOUT  Hover or focus a link and a small terminal label types out
               where it leads:  LOCAL /about   EXTERNAL example.com
   2. LIGHT    A soft pale light follows the pointer across buttons, nav
               links and linked panels, like a lamp moving behind glass.
   3. RIPPLE   Clicking a link sends two rings outward, like raindrops
               landing on a wet street.

   Usage (after your stylesheet):
     <script src="bladerunner-links-fx.js" defer></script>

   Opt out on any link:
     data-no-readout   no label        data-no-ripple   no rings
     data-no-glow      no light        data-glow        add light to any link

   Colours and fonts come from your stylesheet's variables, so it suits
   both the neon and the sober edition. Visitors who prefer reduced motion
   get the readout without typing, and no light or rings. Touch devices
   get the rings only.
   ========================================================================== */

(function () {
  "use strict";

  if (window.__brLinkFX) return;   // safe if the script is included twice
  window.__brLinkFX = true;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var canAnimate = typeof Element.prototype.animate === "function";

  var ACCENT = "var(--ochre, var(--amber, #c48a4c))";
  var GLOW_SELECTOR =
    ".btn:not([data-no-glow]), .site-nav a:not([data-no-glow]), a.panel:not([data-no-glow]), a[data-glow]";

  /* ------------------------------------------------------------------
     Styles for the readout and the light (injected, nothing to add to CSS)
     ------------------------------------------------------------------ */
  var style = document.createElement("style");
  style.textContent =
    ".br-readout{position:fixed;left:0;top:0;z-index:9998;pointer-events:none;" +
      "max-width:min(92vw,420px);padding:.3rem .7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" +
      "font:12px/1.5 var(--font-data,'Courier New',monospace);letter-spacing:.04em;" +
      "color:" + ACCENT + ";background:var(--ink,var(--void,#0f1112));" +
      "border:1px solid var(--line,var(--steel-line,#34393a));border-left:2px solid " + ACCENT + ";" +
      "opacity:0;transform:translateY(4px);transition:opacity .18s,transform .18s}" +
    ".br-readout.is-on{opacity:1;transform:none}" +
    ".br-readout b{font-weight:400;margin-right:.75em;color:var(--dim,#8b867b)}" +
    ".br-readout i{display:inline-block;width:.55em;height:1em;margin-left:.2em;vertical-align:-.15em;" +
      "background:currentColor;animation:br-blink 1s steps(1) infinite}" +
    "@keyframes br-blink{50%{opacity:0}}" +

    ".btn:not([data-no-glow]),.site-nav a:not([data-no-glow]),a.panel:not([data-no-glow]),a[data-glow]{position:relative}" +
    ".btn:not([data-no-glow])::after,.site-nav a:not([data-no-glow])::after," +
    "a.panel:not([data-no-glow])::after,a[data-glow]::after{content:'';position:absolute;inset:0;" +
      "pointer-events:none;opacity:0;transition:opacity .3s;" +
      "background:radial-gradient(circle 90px at var(--mx,50%) var(--my,50%),rgba(255,255,255,.2),transparent 70%)}" +
    ".btn:not([data-no-glow]):hover::after,.site-nav a:not([data-no-glow]):hover::after," +
    "a.panel:not([data-no-glow]):hover::after,a[data-glow]:hover::after{opacity:1}" +

    "@media (prefers-reduced-motion:reduce){.br-readout{transition:none}.br-readout i{animation:none}}";
  document.head.appendChild(style);

  function linkFrom(target) {
    return target && target.closest ? target.closest("a[href]") : null;
  }

  /* ------------------------------------------------------------------
     1. READOUT
     ------------------------------------------------------------------ */
  var readout = null;
  var typing = null;

  function describe(link) {
    var href = link.getAttribute("href") || "";

    if (/^mailto:/i.test(href)) return ["MAIL", href.replace(/^mailto:/i, "").split("?")[0]];
    if (/^tel:/i.test(href)) return ["TEL", href.replace(/^tel:/i, "")];
    if (link.hasAttribute("download")) return ["FILE", link.pathname.split("/").pop() || href];
    if (href.charAt(0) === "#") return ["ANCHOR", href];
    if (link.origin === location.origin) return ["LOCAL", link.pathname + link.search + link.hash];
    if (link.protocol === "http:" || link.protocol === "https:") {
      var path = link.pathname === "/" ? "" : link.pathname;
      return ["EXTERNAL", link.hostname.replace(/^www\./, "") + path];
    }
    return null;
  }

  function placeReadout(link) {
    var rect = link.getBoundingClientRect();
    var width = readout.offsetWidth;
    var height = readout.offsetHeight;
    var left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    var top = rect.bottom + 8;
    if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 8);
    readout.style.left = left + "px";
    readout.style.top = top + "px";
  }

  function hideReadout() {
    if (typing) { clearInterval(typing); typing = null; }
    if (readout) readout.classList.remove("is-on");
  }

  function showReadout(link) {
    var info = describe(link);
    if (!info) return;

    if (typing) { clearInterval(typing); typing = null; }

    var tag = document.createElement("b");
    tag.textContent = info[0];
    var text = document.createElement("span");

    readout.textContent = "";
    readout.appendChild(tag);
    readout.appendChild(text);
    if (!reduceMotion) readout.appendChild(document.createElement("i"));

    var full = info[1].length > 44 ? info[1].slice(0, 43) + "\u2026" : info[1];

    text.textContent = full;       // measure at full size, then place
    placeReadout(link);
    readout.classList.add("is-on");

    if (reduceMotion) return;

    var count = 0;
    text.textContent = "";
    typing = setInterval(function () {
      count += 2;
      text.textContent = full.slice(0, count);
      if (count >= full.length) { clearInterval(typing); typing = null; }
    }, 18);
  }

  function setupReadout() {
    if (!canHover) return;

    readout = document.createElement("div");
    readout.className = "br-readout";
    readout.setAttribute("aria-hidden", "true");
    document.body.appendChild(readout);

    document.addEventListener("mouseover", function (event) {
      var link = linkFrom(event.target);
      if (!link || link.hasAttribute("data-no-readout")) return;
      if (event.relatedTarget && link.contains(event.relatedTarget)) return;
      showReadout(link);
    });

    document.addEventListener("mouseout", function (event) {
      var link = linkFrom(event.target);
      if (!link) return;
      if (event.relatedTarget && link.contains(event.relatedTarget)) return;
      hideReadout();
    });

    document.addEventListener("focusin", function (event) {
      var link = linkFrom(event.target);
      if (link && !link.hasAttribute("data-no-readout")) showReadout(link);
    });

    document.addEventListener("focusout", hideReadout);
    document.addEventListener("click", hideReadout);
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") hideReadout(); });
    window.addEventListener("scroll", hideReadout, { passive: true });
  }

  /* ------------------------------------------------------------------
     2. LIGHT: the pointer position is handed to the stylesheet
     ------------------------------------------------------------------ */
  function setupLight() {
    if (!canHover || reduceMotion) return;

    var frame = null;
    var last = null;

    document.addEventListener("pointermove", function (event) {
      var el = event.target.closest ? event.target.closest(GLOW_SELECTOR) : null;
      if (!el) return;

      last = { el: el, x: event.clientX, y: event.clientY };
      if (frame) return;

      frame = requestAnimationFrame(function () {
        frame = null;
        var rect = last.el.getBoundingClientRect();
        last.el.style.setProperty("--mx", (last.x - rect.left) + "px");
        last.el.style.setProperty("--my", (last.y - rect.top) + "px");
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     3. RIPPLE: two rings, a beat apart
     ------------------------------------------------------------------ */
  function ring(x, y, delay) {
    var drop = document.createElement("div");
    drop.setAttribute("aria-hidden", "true");
    drop.style.cssText =
      "position:fixed;left:" + x + "px;top:" + y + "px;width:14px;height:14px;margin:-7px 0 0 -7px;" +
      "border:1px solid " + ACCENT + ";border-radius:50%;pointer-events:none;z-index:10000;opacity:0;";
    document.body.appendChild(drop);

    var animation = drop.animate(
      [
        { transform: "scale(0.4)", opacity: 0,   offset: 0 },
        { transform: "scale(0.9)", opacity: 0.9, offset: 0.1 },
        { transform: "scale(5)",   opacity: 0,   offset: 1 }
      ],
      { duration: 620, delay: delay, easing: "cubic-bezier(0.2, 0.6, 0.3, 1)", fill: "both" }
    );
    animation.onfinish = function () { drop.remove(); };
  }

  function setupRipple() {
    if (reduceMotion || !canAnimate) return;

    document.addEventListener("click", function (event) {
      var el = event.target.closest ? event.target.closest("a[href], .btn") : null;
      if (!el || el.hasAttribute("data-no-ripple")) return;

      var x = event.clientX;
      var y = event.clientY;

      // Keyboard activation has no pointer position: use the link's centre
      if (!x && !y) {
        var rect = el.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }

      ring(x, y, 0);
      ring(x, y, 110);
    });
  }

  /* ------------------------------------------------------------------ */
  function init() {
    setupReadout();
    setupLight();
    setupRipple();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
