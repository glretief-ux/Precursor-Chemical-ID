/* Precursor Chemical ID – theme toggle, menus, tool filters and the incident report sheet.
   Standalone: no data leaves the page and nothing is stored except the theme choice. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  var root = document.documentElement;
  function T(s) { return window.PCI_I18N ? window.PCI_I18N.t(s) : s; }

  /* ---------- light / dark mode ---------- */
  function setTheme(t, save) {
    root.setAttribute("data-theme", t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dark" ? "#0a111d" : "#16325a");
    var b = $("theme-toggle");
    if (b) {
      b.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
      b.setAttribute("aria-label", T(t === "dark" ? "Switch to light mode" : "Switch to dark mode"));
      b.title = T("Light / dark mode");
    }
    if (save) { try { localStorage.setItem("pci-theme", t); } catch (e) {} }
  }
  function stored() { try { var v = localStorage.getItem("pci-theme"); return v === "dark" || v === "light" ? v : null; } catch (e) { return null; } }
  setTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);
  window.PCI = window.PCI || {};
  window.PCI.refreshTheme = function () { setTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false); };
  if ($("theme-toggle")) $("theme-toggle").addEventListener("click", function () {
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
  });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var follow = function (e) { if (!stored()) setTheme(e.matches ? "dark" : "light", false); };
    if (mq.addEventListener) mq.addEventListener("change", follow); else if (mq.addListener) mq.addListener(follow);
  }

  /* ---------- training menu: close on outside click / Escape / navigation ---------- */
  var menu = $("train-menu");
  if (menu) {
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; var s = menu.querySelector("summary"); if (s) s.focus(); } });
  }

  /* ---------- intelligence & tools: category filter ---------- */
  var bar = $("tool-filters");
  if (bar) bar.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-cat]"); if (!b) return;
    var cat = b.getAttribute("data-cat");
    Array.prototype.forEach.call(bar.querySelectorAll("button"), function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    Array.prototype.forEach.call(document.querySelectorAll("#tool-grid .tool"), function (t) {
      t.hidden = !(cat === "all" || t.getAttribute("data-cat") === cat);
    });
  });

  /* ---------- incident report ---------- */
  var TEXT_FIELDS = [
    ["r-ref", "Reference"], ["r-date", "Date"], ["r-kind", "Type"], ["r-agency", "Agency"], ["r-place", "Place"],
    ["r-chem", "Chemical"], ["r-cas", "CAS"], ["r-un", "UN number"], ["r-hs", "HS code (declared)"], ["r-status", "Control status"],
    ["r-qty", "Quantity"], ["r-pack", "Packaging"], ["r-label", "Product name on label"], ["r-mfr", "Manufacturer on label"], ["r-lot", "Lot / batch"],
    ["r-cont", "Container / vehicle / parcel"], ["r-seal", "Seal"], ["r-bl", "B/L, AWB or CMR"], ["r-orig", "Origin"], ["r-transit", "Transit / transhipment"], ["r-dest", "Destination"],
    ["r-conceal", "Concealment"], ["r-decl", "Declared goods / HS on documents"],
    ["r-consignor", "Exporter / consignor"], ["r-consignee", "Consignee"], ["r-forwarder", "Forwarder / carrier"],
    ["r-test", "Field test / lab result"], ["r-chain", "Sample / exhibit reference"], ["r-notes", "Notes"]
  ];
  var SECTIONS = [
    ["INCIDENT", ["r-ref", "r-date", "r-kind", "r-agency", "r-place"]],
    ["CHEMICAL", ["r-chem", "r-cas", "r-un", "r-hs", "r-status"]],
    ["QUANTITY, PACKAGING, LABEL", ["r-qty", "r-pack", "r-label", "r-mfr", "r-lot"]],
    ["SHIPMENT AND ROUTE", ["r-cont", "r-seal", "r-bl", "r-orig", "r-transit", "r-dest", "r-conceal", "r-decl"]],
    ["COMPANIES ON THE DOCUMENTS", ["r-consignor", "r-consignee", "r-forwarder"]]
  ];
  var CHECKS = [
    ["Checks done", [["c-permit", "Import/export permit seen"], ["c-permit-ok", "Permit confirmed by issuing authority"], ["c-pen", "PEN trail checked with CNA"], ["c-label", "Label check run"], ["c-photo", "Photos taken"], ["c-field", "Field test done"], ["c-sample", "Samples taken under chain of custody"], ["c-lab", "Sent to laboratory"]]],
    ["Reported / shared", [["s-pics", "PICS"], ["s-ionics", "IONICS"], ["s-cen", "CENcomm / ContainerCOMM"], ["s-pp", "Prism / Cohesion focal point"], ["s-cna", "Competent National Authority"], ["s-police", "INTERPOL / Europol / partners"]]]
  ];
  var LABEL = {}; TEXT_FIELDS.forEach(function (f) { LABEL[f[0]] = f[1]; });

  function val(id) {
    var el = $(id); if (!el) return "";
    var v = (el.value || "").trim();
    if (id === "r-qty" && v) v += " " + $("r-unit").value;
    return v;
  }

  function casValid(cas) {
    if (!/^\d{2,7}-\d{2}-\d$/.test(cas)) return false;
    var d = cas.replace(/-/g, ""), body = d.slice(0, -1), chk = +d.slice(-1), t = 0;
    for (var i = 0; i < body.length; i++) t += (i + 1) * +body.charAt(body.length - 1 - i);
    return t % 10 === chk;
  }
  function findByCas(cas) {
    var list = window.CHEMICALS || [];
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.cas === cas) return c;
      var o = c.other_cas || [];
      for (var j = 0; j < o.length; j++) if (o[j].cas === cas) return c;
    }
    return null;
  }
  function casHint() {
    var cas = ($("r-cas").value || "").trim(), msg = $("r-cas-msg");
    if (!cas) { msg.textContent = ""; return; }
    if (!casValid(cas)) { msg.textContent = "This CAS number has an invalid check digit or format. Check it against the label."; return; }
    var c = findByCas(cas);
    if (!c) { msg.textContent = "Valid CAS number, not in this database. A chemical that is not listed can still be controlled nationally."; return; }
    var parts = [c.name + " (" + c.regime + ")"];
    msg.textContent = "In database: " + parts.join("") + ".";
    if (!$("r-chem").value.trim()) $("r-chem").value = c.name;
    if (!$("r-status").value.trim()) $("r-status").value = T(c.regime);
    if (!$("r-un").value.trim() && (c.un || []).length) $("r-un").value = c.un.join(", ");
    if (!$("r-hs").value.trim() && c.hs) $("r-hs").value = c.hs;
  }

  function build() {
    var data = { generated: new Date().toISOString(), tool: "Precursor Chemical ID – incident report sheet" };
    var lines = [T("INCIDENT REPORT SHEET – PRECURSOR / CHEMICAL"), T("Prepared with Precursor Chemical ID (reference aid, verify by laboratory analysis and national law)"), ""];
    SECTIONS.forEach(function (sec) {
      var rows = [];
      sec[1].forEach(function (id) { var v = val(id); if (v) { rows.push(T(LABEL[id]) + (window.PCI_I18N && window.PCI_I18N.lang === "fr" ? " : " : ": ") + v); data[LABEL[id]] = v; } });
      if (rows.length) { lines.push(T(sec[0])); rows.forEach(function (r) { lines.push("  " + r); }); lines.push(""); }
    });
    CHECKS.forEach(function (grp) {
      lines.push(T(grp[0]).toUpperCase());
      var done = {};
      grp[1].forEach(function (c) { var on = $(c[0]).checked; done[c[1]] = on; lines.push("  [" + (on ? "x" : " ") + "] " + T(c[1])); });
      data[grp[0]] = done;
      lines.push("");
    });
    ["r-test", "r-chain", "r-notes"].forEach(function (id) {
      var v = val(id); if (v) { lines.push(T(LABEL[id]).toUpperCase()); lines.push("  " + v.replace(/\n/g, "\n  ")); lines.push(""); data[LABEL[id]] = v; }
    });
    lines.push(T("Generated") + " " + new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC");
    return { text: lines.join("\n"), json: data };
  }

  var last = null;
  function show() {
    last = build();
    $("r-sheet").textContent = last.text;
    $("r-out").hidden = false;
    $("r-msg").textContent = "";
    if ($("r-out").scrollIntoView) $("r-out").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function download(name, mime, text) {
    var blob = new Blob([text], { type: mime + ";charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function fname(ext) {
    var ref = ($("r-ref").value || "").trim().replace(/[^\w.-]+/g, "_");
    var d = new Date().toISOString().slice(0, 10);
    return "incident-" + (ref || d) + "." + ext;
  }
  function msg(t) { $("r-msg").textContent = t; }

  if ($("r-make")) {
    $("r-make").addEventListener("click", show);
    $("r-clear").addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll("#panel-report input, #panel-report textarea"), function (el) { if (el.type === "checkbox") el.checked = false; else el.value = ""; });
      Array.prototype.forEach.call(document.querySelectorAll("#panel-report select"), function (el) { el.selectedIndex = 0; });
      $("r-out").hidden = true; $("r-cas-msg").textContent = ""; last = null;
    });
    $("r-cas").addEventListener("input", casHint);
    $("r-copy").addEventListener("click", function () {
      var t = $("r-sheet").textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { msg("Copied. Paste it into PICS, CENcomm or your national system."); }, function () { msg("Could not copy automatically. Select the text and copy it."); });
      else { var r = document.createRange(); r.selectNodeContents($("r-sheet")); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); msg("Text selected: press copy."); }
    });
    $("r-txt").addEventListener("click", function () { if (last) download(fname("txt"), "text/plain", last.text); });
    $("r-json").addEventListener("click", function () { if (last) download(fname("json"), "application/json", JSON.stringify(last.json, null, 2)); });
    $("r-print").addEventListener("click", function () {
      document.body.classList.add("print-report");
      var done = function () { document.body.classList.remove("print-report"); window.removeEventListener("afterprint", done); };
      window.addEventListener("afterprint", done);
      window.print();
      setTimeout(done, 1500);
    });
  }

  /* hook used by the "Add to incident report" button on search results */
  window.PCI = window.PCI || {};
  window.PCI.fillReport = function (c) {
    if (!c || !$("r-chem")) return;
    $("r-chem").value = c.name || ""; $("r-cas").value = c.cas || ""; $("r-un").value = c.un || ""; $("r-hs").value = c.hs || ""; $("r-status").value = c.status || "";
    casHint();
    var d = $("r-date"); if (d && !d.value) { try { d.value = new Date().toISOString().slice(0, 10); } catch (e) {} }
    var q = $("r-qty"); if (q) q.focus();
  };
})();
