/* ==========================================================================
   LANGUAGE SWITCH SCRIPT (optional)
   Fills in the links of the EN | FR switch so that each one leads to the
   same page in the other language, and highlights the language you are in.
   Without it the switch still works, if you write the links by hand.

   Usage:
     <script src="bladerunner-lang.js" defer></script>

   Pick the structure that matches your site in SITE_STRUCTURE below:

     "folders"  one folder per language
                /en/about.html   <->   /fr/about.html
                /en/             <->   /fr/

     "suffix"   English files are plain, French files end in -fr
                /about.html      <->   /about-fr.html
                /                <->   /index-fr.html

   Links that should be left exactly as you wrote them: add data-keep.
   The page language is read from <html lang="en"> or <html lang="fr">;
   if that is missing, it is worked out from the address.
   ========================================================================== */

(function () {
  "use strict";

  var SITE_STRUCTURE = "folders";   // "folders" or "suffix"

  var switches = document.querySelectorAll("li.lang");
  if (!switches.length) return;

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

  Array.prototype.forEach.call(switches, function (item) {
    Array.prototype.forEach.call(item.querySelectorAll("a[data-lang]"), function (link) {
      var lang = link.getAttribute("data-lang");

      if (!link.hasAttribute("data-keep")) link.setAttribute("href", addressFor(lang));
      link.setAttribute("hreflang", lang);
      link.setAttribute("lang", lang);

      if (lang === here) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  });
})();
