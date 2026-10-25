/* ==========================================================================
   LANGUAGE SWITCH SCRIPT (optional)
   Turns the single link in <li class="lang"> into a switch to the other
   language: it reads FR on an English page and EN on a French page, and
   leads to the same page in the other language.
   Without it the switch still works, if you write the link by hand.

   HTML (the same on every page):
     <li class="lang"><a href="#" data-lang-toggle>FR</a></li>

   Usage:
     <script src="bladerunner-lang.js" defer></script>

   Pick the structure that matches your site in SITE_STRUCTURE below:

     "folders"  one folder per language
                /en/about.html   <->   /fr/about.html
                /en/             <->   /fr/

     "suffix"   English files are plain, French files end in -fr
                /about.html      <->   /about-fr.html
                /                <->   /index-fr.html

   To keep the address you wrote yourself, add data-keep to the link: the
   label is still updated, the address is left alone.
   The page language is read from <html lang="en"> or <html lang="fr">;
   if that is missing, it is worked out from the address.
   ========================================================================== */

(function () {
  "use strict";

  var SITE_STRUCTURE = "folders";   // "folders" or "suffix"

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

  /* ---- The same page, in another language ---- */
  function addressFor(target) {
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

  Array.prototype.forEach.call(links, function (link) {
    link.textContent = other.toUpperCase();
    link.setAttribute("hreflang", other);
    link.setAttribute("lang", other);
    link.setAttribute("aria-label", NAMES[other]);
    link.removeAttribute("aria-current");

    if (!link.hasAttribute("data-keep")) link.setAttribute("href", addressFor(other));
  });
})();
