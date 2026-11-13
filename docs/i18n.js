/* Precursor Chemical ID – English / French switch.
   Static page text is translated by looking up its English HTML in window.I18N_FR.static; the text the app builds
   at run time (search results, label checks, map panel...) is translated as it appears, using window.I18N_FR.exact
   (whole text) and .rules (fragments). Nothing is sent anywhere; the choice is kept in localStorage ("pci-lang"). */
(function () {
  "use strict";
  var D = window.I18N_FR || { static: {}, exact: {}, country: {}, subregion: {}, rules: [] };
  var root = document.documentElement;
  var INLINE = { A: 1, B: 1, I: 1, U: 1, CODE: 1, SPAN: 1, SMALL: 1, BR: 1, EM: 1, STRONG: 1, KBD: 1 };
  /* parts of the page the app fills in itself: translated text-node by text-node */
  var DYN = "#results,#l-result,#m-panel,#b-table tbody,#u-list,#kpis,#m-listbox,#m-legend,#tc-meta,#meta,#count,#b-count,#m-count,#f-drug,#u-msg,#r-cas-msg,#r-msg";
  /* these are never part of the static pass (they are dynamic, or have their own translation) */
  var SKIP = DYN + ",#examples,#r-sheet,#byteBtn,#byteNudge,#byteModal,#byteSay";
  var ATTRS = ["placeholder", "aria-label", "title", "alt"];

  var lang = window.PCI_LANG === "fr" ? "fr" : "en";
  var statics = [];   /* [element, original innerHTML] */
  var attrs = [];     /* [element, attribute, original] */
  var texts = [];     /* [text node, original] */
  var mo = null;
  var enTitle = document.title, enDesc = "";
  var descEl = document.querySelector('meta[name="description"]');
  if (descEl) enDesc = descEl.getAttribute("content") || "";

  function norm(s) { return s.replace(/\s+/g, " ").trim(); }

  /* ---------- text (dynamic) ---------- */
  function trText(s) {
    var core = s.trim();
    if (!core) return s;
    var lead = s.slice(0, s.indexOf(core)), trail = s.slice(s.indexOf(core) + core.length);
    if (Object.prototype.hasOwnProperty.call(D.exact, core)) return lead + D.exact[core] + trail;
    if (core.indexOf(", ") > 0) {
      var parts = core.split(", "), ok = true;
      for (var i = 0; i < parts.length; i++) if (!Object.prototype.hasOwnProperty.call(D.exact, parts[i])) { ok = false; break; }
      if (ok) return lead + parts.map(function (p) { return D.exact[p]; }).join(", ") + trail;
    }
    var out = s, R = D.rules;
    for (var j = 0; j < R.length; j++) {
      var r = R[j];
      if (typeof r[0] === "string") { if (out.indexOf(r[0]) >= 0) out = out.split(r[0]).join(r[1]); }
      else { r[0].lastIndex = 0; if (r[0].test(out)) { r[0].lastIndex = 0; out = out.replace(r[0], r[1]); } }
    }
    return out;
  }
  /* translate arbitrary English text (used by extras.js for the report sheet etc.) */
  function t(s) {
    if (lang !== "fr" || s == null) return s;
    return Object.prototype.hasOwnProperty.call(D.exact, s) ? D.exact[s] : trText(String(s));
  }
  function textNodes(el, fn) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(fn);
  }
  function dynNode(n) {
    var v = n.nodeValue;
    if (!v || !v.trim()) return;
    var r = trText(v);
    if (r !== v) { texts.push([n, v]); n.nodeValue = r; }
  }
  function dynAttrs(el) {
    var els = [el].concat([].slice.call(el.querySelectorAll("[aria-label],[title],[placeholder]")));
    els.forEach(function (e) {
      if (e.nodeType !== 1) return;
      ["aria-label", "title", "placeholder"].forEach(function (a) {
        var v = e.getAttribute(a);
        if (v) { var r = trText(v); if (r !== v) { attrs.push([e, a, v]); e.setAttribute(a, r); } }
      });
    });
  }
  function dynTree(node) {
    if (node.nodeType === 3) { if (node.parentElement && node.parentElement.closest(DYN)) dynNode(node); return; }
    if (node.nodeType !== 1) return;
    if (node.closest && node.closest(DYN)) { textNodes(node, dynNode); dynAttrs(node); return; }
    var inner = node.querySelectorAll ? node.querySelectorAll(DYN) : [];
    [].forEach.call(inner, function (c) { textNodes(c, dynNode); dynAttrs(c); });
  }

  /* ---------- static page text ---------- */
  function staticPass() {
    var all = document.body.querySelectorAll("*"), i, el, k, fr;
    for (i = 0; i < all.length; i++) {
      el = all[i];
      if (!el.isConnected) continue;
      var tag = el.tagName;
      if (tag === "SCRIPT" || tag === "STYLE") continue;
      if (el.closest(SKIP)) continue;
      if (el.parentElement && el.parentElement.closest("[data-i18n]")) continue;
      var ok = true;
      for (var c = 0; c < el.children.length; c++) if (!INLINE[el.children[c].tagName]) { ok = false; break; }
      if (ok) {
        var hasText = false;
        for (var m = 0; m < el.childNodes.length; m++) if (el.childNodes[m].nodeType === 3 && el.childNodes[m].textContent.trim()) { hasText = true; break; }
        if (hasText) {
          k = norm(el.innerHTML);
          fr = Object.prototype.hasOwnProperty.call(D.static, k) ? D.static[k] : null;
          if (fr != null) { statics.push([el, el.innerHTML]); el.setAttribute("data-i18n", "1"); el.innerHTML = fr; }
        }
      }
      for (var a = 0; a < ATTRS.length; a++) {
        var v = el.getAttribute(ATTRS[a]);
        if (v && !el.hasAttribute("data-i18n-a-" + ATTRS[a])) {
          var fa = D.static["@" + v];
          if (fa != null) { attrs.push([el, ATTRS[a], v]); el.setAttribute(ATTRS[a], fa); el.setAttribute("data-i18n-a-" + ATTRS[a], "1"); }
        }
      }
    }
    var tf = D.static["#title"], df = D.static["#desc"];
    if (tf) document.title = tf;
    if (descEl && df) descEl.setAttribute("content", df);
  }
  function restore() {
    statics.forEach(function (p) { if (p[0].isConnected) { p[0].innerHTML = p[1]; p[0].removeAttribute("data-i18n"); } });
    attrs.forEach(function (p) {
      p[0].setAttribute(p[1], p[2]);
      p[0].removeAttribute("data-i18n-a-" + p[1]);
    });
    texts.forEach(function (p) { if (p[0].isConnected) p[0].nodeValue = p[1]; });
    statics = []; attrs = []; texts = [];
    document.title = enTitle;
    if (descEl) descEl.setAttribute("content", enDesc);
  }

  function watch() {
    if (mo || !window.MutationObserver) return;
    mo = new MutationObserver(function (list) {
      if (lang !== "fr") return;
      list.forEach(function (m) { [].forEach.call(m.addedNodes, dynTree); });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function paintSwitch() {
    [].forEach.call(document.querySelectorAll("#lang-switch button[data-lang]"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === lang ? "true" : "false");
    });
  }

  /* ---------- Byte (help helper) ---------- */
  function byteConfig() { return lang === "fr" && window.BYTE_CONFIG_FR ? window.BYTE_CONFIG_FR : window.BYTE_CONFIG; }
  function rebootByte() {
    if (!window.__byteRun) return;
    if (window.__byteStop) { try { window.__byteStop(); } catch (e) {} }
    ["byteBtn", "byteNudge", "byteModal", "byteSay", "byteStyle"].forEach(function (id) { var e = document.getElementById(id); if (e && e.parentNode) e.parentNode.removeChild(e); });
    window.__byteRun();
  }

  /* ---------- switching ---------- */
  function apply() {
    root.lang = lang;
    paintSwitch();
    restore();
    if (lang === "fr") {
      staticPass();
      var dyn = document.querySelectorAll(DYN);
      [].forEach.call(dyn, function (c) { textNodes(c, dynNode); dynAttrs(c); });
    }
    if (window.PCI && window.PCI.onLang) window.PCI.onLang(lang);
    rebootByte();
    var tb = document.getElementById("theme-toggle");
    if (tb && window.PCI && window.PCI.refreshTheme) window.PCI.refreshTheme();
    try { document.dispatchEvent(new CustomEvent("pci-lang", { detail: lang })); } catch (e) {}
  }
  function setLang(l, save) {
    l = l === "fr" ? "fr" : "en";
    if (save) { try { localStorage.setItem("pci-lang", l); } catch (e) {} }
    if (l === lang && statics.length + texts.length + attrs.length > 0) { paintSwitch(); return; }
    lang = l;
    window.PCI_LANG = l;
    apply();
  }

  /* names of countries in the current language (null = keep the English name) */
  function country(iso) { return lang === "fr" ? (D.country[iso] || null) : null; }
  function subregion(s) { return lang === "fr" && D.subregion[s] ? D.subregion[s] : s; }

  /* strings still in English on the page - used by the tests */
  function missing() {
    var out = [];
    var all = document.body.querySelectorAll("*");
    [].forEach.call(all, function (el) {
      if (el.closest(SKIP) || el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.closest("svg")) return;
      if (el.parentElement && el.parentElement.closest("[data-i18n]")) return;
      var ok = true;
      for (var c = 0; c < el.children.length; c++) if (!INLINE[el.children[c].tagName]) { ok = false; break; }
      if (!ok) return;
      var hasText = false;
      for (var m = 0; m < el.childNodes.length; m++) if (el.childNodes[m].nodeType === 3 && el.childNodes[m].textContent.trim()) { hasText = true; break; }
      if (!hasText || el.hasAttribute("data-i18n")) return;
      var k = norm(el.innerHTML);
      if (/[A-Za-z]{3,}/.test(k.replace(/<[^>]+>/g, "")) && !Object.prototype.hasOwnProperty.call(D.static, k)) out.push(k);
    });
    return out;
  }

  window.PCI_I18N = { get lang() { return lang; }, t: t, setLang: setLang, country: country, subregion: subregion, byteConfig: byteConfig, missing: missing, trText: trText };

  function boot() {
    watch();
    [].forEach.call(document.querySelectorAll("#lang-switch button[data-lang]"), function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-lang"), true); });
    });
    if (lang === "fr") apply(); else paintSwitch();
  }
  boot();
})();
