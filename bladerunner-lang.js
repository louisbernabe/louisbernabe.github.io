/* ==========================================================================
   LANGUAGE SWITCH SCRIPT (optional)
   Turns the single link in <li class="lang"> into a switch to the other
   language: it reads FR on an English page and EN on a French page, and
   leads to that page's counterpart in the other language.

   HTML (the same on every page):
     <li class="lang"><a href="#" data-lang-toggle>FR</a></li>

   Usage:
     <script src="bladerunner-lang.js" defer></script>

   How a page's counterpart is found, first match wins:

     1. A tag in the page's <head> naming it (best: it also helps Google):
          <link rel="alternate" hreflang="fr" href="/a-propos.html">
        On each French page, the same tag with hreflang="en".

     2. The PAGES list below, for pages whose names differ:
          { en: "/about.html", fr: "/a-propos.html" }

     3. A naming rule, chosen in SITE_STRUCTURE below:
          "folders"  /en/about.html  <->  /fr/about.html
          "suffix"   /about.html     <->  /about-fr.html

   Pages are matched whatever the spelling of the address: "/", "/index.html"
   and "/index" lead to the same entry. To keep an address you wrote
   yourself, add data-keep to the link: the label is still updated.
   The page language is read from <html lang="en"> or <html lang="fr">;
   if that is missing, it is worked out from the address.
   ========================================================================== */

(function () {
  "use strict";

  var SITE_STRUCTURE = "folders";   // "folders" or "suffix": the fallback naming rule

  // Pages whose English and French names differ. Delete the examples and add yours.
  var PAGES = [
    // { en: "/",             fr: "/fr/" },
    // { en: "/about.html",   fr: "/a-propos.html" },
    // { en: "/contact.html", fr: "/contact-fr.html" }
  ];

  var NAMES = { en: "English", fr: "Fran\u00e7ais" };

  var links = document.querySelectorAll("li.lang a");
  if (!links.length) return;

  /* ---- Which language is this page in? ---- */
  function currentLanguage() {
    var declared = (document.documentElement.lang || "").slice(0, 2).toLowerCase();
    if (declared === "en" || declared === "fr") return declared;

    var path = location.pathname;
    if (SITE_STRUCTURE === "folders") {
      var folder = path.match(/(?:^|\/)(en|fr)(?=\/|$)/);
      return folder ? folder[1] : "en";
    }
    return /-fr(\.html?)?$/i.test(path) ? "fr" : "en";
  }

  /* ---- Making addresses comparable: "/a/index.html", "/a/" and "/a" are one page ---- */
  function normalise(path) {
    path = path.replace(/\/index(\.html?)?$/i, "/");
    if (path.length > 1) path = path.replace(/\/$/, "");
    return path || "/";
  }

  function pathOf(value) {
    try { return new URL(value, location.href).pathname; } catch (error) { return value; }
  }

  /* ---- 1. A <link rel="alternate" hreflang="..."> in the page ---- */
  function fromAlternateTag(target) {
    var tag = document.querySelector('link[rel~="alternate"][hreflang="' + target + '"]');
    return tag ? tag.href : null;
  }

  /* ---- 2. The PAGES list ---- */
  function fromPageList(here, target) {
    var current = normalise(location.pathname);

    for (var i = 0; i < PAGES.length; i++) {
      var entry = PAGES[i];
      if (entry[here] && entry[target] && normalise(pathOf(entry[here])) === current) {
        return entry[target];
      }
    }
    return null;
  }

  /* ---- 3. A naming rule ---- */
  function fromNamingRule(target) {
    var path = location.pathname;
    var rest = location.search + location.hash;

    if (SITE_STRUCTURE === "folders") {
      if (/(?:^|\/)(en|fr)(?=\/|$)/.test(path)) {
        return path.replace(/(^|\/)(en|fr)(?=\/|$)/, "$1" + target) + rest;
      }
      return "/" + target + "/" + rest;   // a page outside the language folders
    }

    // "suffix"
    var file = path.replace(/\/$/, "/index.html");
    if (target === "fr") {
      return file.replace(/(-fr)?(\.html?)$/i, "-fr$2") + rest;
    }
    return file.replace(/-fr(\.html?)$/i, "$1") + rest;
  }

  var here = currentLanguage();
  var other = here === "en" ? "fr" : "en";

  var address = fromAlternateTag(other) || fromPageList(here, other) || fromNamingRule(other);

  Array.prototype.forEach.call(links, function (link) {
    link.textContent = other.toUpperCase();
    link.setAttribute("hreflang", other);
    link.setAttribute("lang", other);
    link.setAttribute("aria-label", NAMES[other]);
    link.removeAttribute("aria-current");

    if (!link.hasAttribute("data-keep")) link.setAttribute("href", address);
  });
})();
