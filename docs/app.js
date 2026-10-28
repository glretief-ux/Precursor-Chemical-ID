/* Precursor Chemical ID – search app (no dependencies, works offline) */
(function () {
  "use strict";

  var CHEMS = window.CHEMICALS || [];
  var BASE_COMPANIES = window.COMPANIES || [];
  var META = window.META || {};
  var LS_KEY = "pcid_user_companies_v1";

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function norm(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }
  function compact(s) { return norm(s).replace(/ /g, ""); }

  function casValid(cas) {
    if (!/^\d{2,7}-\d{2}-\d$/.test(cas)) return false;
    var d = cas.replace(/-/g, "");
    var body = d.slice(0, -1), check = parseInt(d.slice(-1), 10), sum = 0;
    for (var i = 0; i < body.length; i++) sum += (i + 1) * parseInt(body.charAt(body.length - 1 - i), 10);
    return sum % 10 === check;
  }

  function regimeKey(c) {
    if (c.regime.indexOf("Table II") >= 0) return "T2";
    if (c.regime.indexOf("Table I") >= 0) return "T1";
    return "NS";
  }
  var REGIME_LABEL = { T1: "INCB Table I", T2: "INCB Table II", NS: "Not scheduled" };
  var REGIME_CLASS = { T1: "b-t1", T2: "b-t2", NS: "b-ns" };

  var TRADE = {
    T1: "Licence/registration to make or trade; export and import authorisation; pre-export notification; customer declarations; records. <a href=\"#\" data-goto=\"controls\">See permits</a>",
    T2: "Registration/licensing varies by country; pre-export notification where the importing country requires it; records and correct customs documents. <a href=\"#\" data-goto=\"controls\">See permits</a>",
    NS: "No international licence requirement; may be nationally controlled. Check national law."
  };
  var DRUGS = [
    ["Heroin", /heroin/i], ["Cocaine", /cocaine/i], ["Methamphetamine", /methamphetamine/i],
    ["Amphetamine-type (incl. meth)", /amphetamine/i], ["MDMA / ecstasy", /mdma|mda\b|mdea/i],
    ["LSD", /lsd/i], ["Fentanyl & analogues", /fentanyl/i], ["Methaqualone", /methaqualone|mecloqualone/i],
    ["PCP", /pcp/i], ["GHB", /ghb/i], ["Cathinones / mephedrone", /cathinone|mephedrone/i]
  ];

  /* ---------- index ---------- */
  CHEMS.forEach(function (c) {
    c._key = regimeKey(c);
    c._names = [c.name].concat(c.synonyms || []).map(norm);
    c._namesC = [c.name].concat(c.synonyms || []).map(compact);
    c._allCas = (c.cas ? [c.cas] : []).concat((c.other_cas || []).map(function (o) { return o.cas; }));
    c._drugText = (c.drugs || []).join(" | ");
    c._hs = (c.hs || "").replace(".", "");
  });

  function chemByCas(cas) {
    for (var i = 0; i < CHEMS.length; i++) if (CHEMS[i]._allCas.indexOf(cas) >= 0) return CHEMS[i];
    return null;
  }

  /* ---------- chemical search ---------- */
  function searchChems(raw, filters) {
    var q = raw.trim();
    var out = [];
    var qn = norm(q), qc = compact(q);
    var isCas = /^\d[\d-]*$/.test(q) && q.indexOf("-") > 0;
    var unm = q.match(/^(?:un\s*)?(\d{4})$/i);
    var hsm = q.match(/^(\d{4})\.(\d{1,2})$/) || q.match(/^(\d{6})$/);

    CHEMS.forEach(function (c) {
      if (filters.regime && c._key !== filters.regime) return;
      if (filters.drug && !filters.drug.test(c._drugText)) return;
      var score = 0;
      if (!q) { score = 1; }
      else if (isCas) {
        c._allCas.forEach(function (cas) {
          if (cas === q) score = Math.max(score, 100);
          else if (cas.indexOf(q) === 0) score = Math.max(score, 70);
          else if (cas.indexOf(q) >= 0) score = Math.max(score, 40);
        });
      } else if (unm) {
        var un = "UN" + unm[1];
        if ((c.un || []).indexOf(un) >= 0) score = 100;
      } else if (hsm) {
        var hs = hsm.length === 3 ? hsm[1] + (hsm[2].length === 1 ? hsm[2] + "0" : hsm[2]) : hsm[1];
        if (c._hs === hs) score = 100;
        else if (c._hs.indexOf(hs) === 0) score = 60;
      } else {
        for (var i = 0; i < c._names.length; i++) {
          var n = c._names[i], nc = c._namesC[i];
          if (n === qn || nc === qc) score = Math.max(score, i === 0 ? 100 : 90);
          else if (n.indexOf(qn) === 0 || nc.indexOf(qc) === 0) score = Math.max(score, i === 0 ? 80 : 70);
          else if (n.indexOf(qn) >= 0 || nc.indexOf(qc) >= 0) score = Math.max(score, i === 0 ? 60 : 50);
        }
        if (!score) { // all words present somewhere in names
          var words = qn.split(" ").filter(Boolean);
          var hay = c._names.join(" ");
          if (words.length > 1 && words.every(function (w) { return hay.indexOf(w) >= 0; })) score = 45;
        }
        if (!score && qn.length >= 3 && c._drugText && norm(c._drugText).indexOf(qn) >= 0) score = 20;
      }
      if (score) out.push({ c: c, s: score });
    });
    out.sort(function (a, b) { return b.s - a.s || a.c.name.localeCompare(b.c.name); });
    return out.map(function (x) { return x.c; });
  }

  /* ---------- companies ---------- */
  var LEGAL = { ltd: 1, limited: 1, inc: 1, llc: 1, gmbh: 1, ag: 1, sa: 1, bv: 1, nv: 1, co: 1, corp: 1, corporation: 1, company: 1, plc: 1, pvt: 1, private: 1, kg: 1, kgaa: 1, srl: 1, spa: 1, ltda: 1, sdn: 1, bhd: 1, the: 1, and: 1, group: 1, lp: 1, se: 1 };
  function coNorm(s) {
    return norm(s).split(" ").filter(function (w) { return w && !LEGAL[w]; }).join(" ");
  }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 1; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
    return d[m][n];
  }

  function loadUser() {
    try { var v = JSON.parse(localStorage.getItem(LS_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function saveUser(list) { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); return true; } catch (e) { return false; } }
  function allCompanies() {
    return BASE_COMPANIES.map(function (c) { return c; }).concat(loadUser().map(function (c) { c._user = true; return c; }));
  }

  /* returns array of {co, level} sorted by strength */
  function findCompanies(raw) {
    var q = coNorm(raw);
    if (q.length < 2) return [];
    var res = [];
    allCompanies().forEach(function (co) {
      var names = [co.name].concat(co.aliases || []).map(coNorm);
      var best = 0;
      names.forEach(function (n) {
        if (!n) return;
        if (n === q) best = Math.max(best, 3);
        else if (q.length >= 4 && (n.indexOf(q) >= 0 || (n.length >= 4 && q.indexOf(n) >= 0))) best = Math.max(best, 2);
        else {
          var qa = q.split(" "), na = n.split(" ");
          var ok = qa.some(function (w) {
            return w.length >= 5 && na.some(function (v) { return v.length >= 5 && lev(w, v) <= 1; });
          });
          if (ok) best = Math.max(best, 1);
        }
      });
      if (best) res.push({ co: co, level: best });
    });
    res.sort(function (a, b) { return b.level - a.level; });
    return res;
  }

  function companyVerdict(chem, raw) {
    var q = (raw || "").trim();
    if (!q) return "";
    var matches = findCompanies(q);
    if (!matches.length) {
      return '<div class="verdict v-warn"><b>Company not in database</b>"' + esc(q) + '" is not a known producer/supplier in this tool. This does not mean the product is fake – verify the company (registration, address, website, customs/CNA contacts) and ask for the authorisation and certificate of analysis' + (chem._key !== "NS" ? ' (this chemical is internationally scheduled).' : '.') + '</div>';
    }
    var top = matches[0].level;
    var rel = matches.filter(function (m) { return m.level === top; }).slice(0, 3);
    var parts = [];
    var anyOk = false;
    rel.forEach(function (m) {
      var has = m.co.cas.some(function (cas) { return chem._allCas.indexOf(cas) >= 0; });
      var fuzzy = m.level === 1 ? " (similar spelling – check exact name)" : "";
      if (has) {
        anyOk = true;
        parts.push("<li><b>" + esc(m.co.name) + "</b>" + fuzzy + " – recorded as <b>" + esc(m.co.type) + "</b> of this chemical" + (m.co.country ? " (" + esc(m.co.country) + ")" : "") + (m.co.source ? '<br><span class="small">' + esc(m.co.source) + "</span>" : "") + "</li>");
      } else {
        parts.push("<li><b>" + esc(m.co.name) + "</b>" + fuzzy + " is in the database, but <b>not recorded</b> as producing/supplying this chemical" + (m.co.country ? " (" + esc(m.co.country) + ")" : "") + ".</li>");
      }
    });
    var cls = anyOk ? (top === 1 ? "v-warn" : "v-ok") : "v-warn";
    var head = anyOk ? (top === 1 ? "Possible match – verify spelling" : "Match: company is known for this chemical") : "Company known, chemical not recorded for it";
    return '<div class="verdict ' + cls + '"><b>' + head + '</b><ul class="plain">' + parts.join("") + '</ul><span class="small">Indicative database only – a known name on a label does not prove the container is genuine. Verify with the company and shipping documents.</span></div>';
  }

  /* ---------- rendering ---------- */
  function idBadge(label, value, copyable) {
    if (!value) return "";
    return '<span class="badge b-id"><small>' + esc(label) + "</small> " + esc(value) +
      (copyable ? ' <button class="copy" type="button" data-copy="' + esc(value) + '" aria-label="Copy ' + esc(label) + '">copy</button>' : "") + "</span>";
  }

  function renderCard(c, companyRaw) {
    var h = '<article class="card res"><div class="res-head"><h2>' + esc(c.name) + "</h2><div class=\"badges\">";
    h += '<span class="badge ' + REGIME_CLASS[c._key] + '">' + REGIME_LABEL[c._key] + "</span>";
    h += c.cas ? idBadge("CAS", c.cas, true) : '<span class="badge b-id"><small>CAS</small> none assigned</span>';
    if ((c.un || []).length) c.un.forEach(function (u) { h += idBadge("UN", u, true); });
    else h += '<span class="badge b-id"><small>UN</small> none / not DG</span>';
    h += idBadge("HS", c.hs, true);
    h += "</div></div><div class=\"res-body\"><dl>";
    if (c.synonyms && c.synonyms.length) h += "<dt>Also known as</dt><dd>" + c.synonyms.map(esc).join(" · ") + "</dd>";
    if (c.other_cas && c.other_cas.length) h += "<dt>Other CAS</dt><dd>" + c.other_cas.map(function (o) { return esc(o.cas) + " <span class=\"small\">(" + esc(o.form) + ")</span>"; }).join("<br>") + "</dd>";
    if (c.adr) h += "<dt>Transport class</dt><dd>ADR/IMDG " + esc(c.adr) + "</dd>";
    if (c.hs_other) h += "<dt>HS (products)</dt><dd>" + esc(c.hs_other) + "</dd>";
    if (c.drugs && c.drugs.length) h += "<dt>Used for making</dt><dd>" + c.drugs.map(esc).join(", ") + "</dd>";
    if (c.role) h += "<dt>Role</dt><dd>" + esc(c.role) + "</dd>";
    if (c.legit) h += "<dt>Legitimate use</dt><dd>" + esc(c.legit) + "</dd>";
    if (c.appearance) h += "<dt>Appearance</dt><dd>" + esc(c.appearance) + "</dd>";
    h += "<dt>Trade control</dt><dd>" + TRADE[c._key] + "</dd>";
    if (c.added) h += "<dt>Scheduled</dt><dd>" + esc(c.added) + "</dd>";
    if (c.notes) h += "<dt>Notes</dt><dd>" + esc(c.notes) + "</dd>";
    var cl = CHEM_COUNTRIES[c.id];
    if (cl && cl.length) h += "<dt>Nationally controlled in</dt><dd><div class=\"chips\">" + countryChips(cl.filter(function (i, n) { return cl.indexOf(i) === n; })) + "</div></dd>";
    h += "</dl></div>" + companyVerdict(c, companyRaw) + "</article>";
    return h;
  }

  /* ---------- search tab ---------- */
  function currentFilters() {
    var di = $("f-drug").value;
    return { regime: $("f-regime").value, drug: di === "" ? null : DRUGS[parseInt(di, 10)][1] };
  }
  function runSearch() {
    var q = $("q").value, comp = $("company").value;
    var res = searchChems(q, currentFilters());
    var box = $("results");
    if (!q.trim() && !$("f-regime").value && !$("f-drug").value) {
      box.innerHTML = '<div class="card small">Type a chemical name, CAS number, UN number or HS code above. ' +
        CHEMS.length + " entries loaded (" + CHEMS.filter(function (c) { return c._key === "T1"; }).length + " Table I, " +
        CHEMS.filter(function (c) { return c._key === "T2"; }).length + " Table II, " +
        CHEMS.filter(function (c) { return c._key === "NS"; }).length + " non-scheduled).</div>";
      $("count").textContent = "";
      return;
    }
    $("count").textContent = res.length + (res.length === 1 ? " result" : " results");
    if (!res.length) {
      var msg = '<div class="card">No match in the database.';
      var asCas = $("q").value.trim();
      if (/^\d{2,7}-\d{2}-\d$/.test(asCas)) {
        msg += casValid(asCas) ? " The CAS number is formally valid but is not in this list – it may still be a salt, ester or national-list chemical; check the INCB Red List and national law."
                               : ' <b>The CAS check digit is invalid</b> – a typo, or a falsified label.';
      } else msg += " Try a synonym, a partial name, or the CAS number.";
      box.innerHTML = msg + "</div>";
      return;
    }
    box.innerHTML = res.slice(0, 60).map(function (c) { return renderCard(c, comp); }).join("") +
      (res.length > 60 ? '<p class="small">Showing first 60 – refine your search.</p>' : "");
  }

  /* ---------- label check ---------- */
  function check(cls, text) {
    var sym = { ok: "✓", warn: "!", bad: "✕", info: "i" }[cls];
    return '<li><span class="ic ' + cls + '">' + sym + '</span><div>' + text + "</div></li>";
  }
  function runLabel() {
    var name = $("l-name").value.trim(), cas = $("l-cas").value.trim(), un = $("l-un").value.trim().toUpperCase().replace(/\s+/g, ""), comp = $("l-company").value.trim();
    var out = [];
    var byCas = null, byName = null, byUn = [];

    if (!name && !cas && !un && !comp) { $("l-result").innerHTML = '<div class="card small">Enter at least one field from the label.</div>'; return; }

    if (cas) {
      if (!/^\d{2,7}-\d{2}-\d$/.test(cas)) out.push(check("bad", "<b>CAS format invalid:</b> “" + esc(cas) + "” is not in the form NNNN-NN-N. Possible typo or falsified label."));
      else if (!casValid(cas)) out.push(check("bad", "<b>CAS check digit invalid:</b> " + esc(cas) + " fails the CAS checksum – the number cannot exist. Typo or falsified label."));
      else {
        out.push(check("ok", "<b>CAS check digit valid:</b> " + esc(cas) + "."));
        byCas = chemByCas(cas);
        if (byCas) out.push(check(byCas._key === "NS" ? "info" : "warn", "<b>CAS identifies:</b> " + esc(byCas.name) + " – <span class=\"badge " + REGIME_CLASS[byCas._key] + '">' + REGIME_LABEL[byCas._key] + "</span>" + (cas !== byCas.cas && byCas.cas ? " (salt/form of CAS " + esc(byCas.cas) + ")" : "")));
        else out.push(check("info", "CAS " + esc(cas) + " is not in this database. It may be an ordinary chemical, or a salt/ester/national-list item – check the INCB Red List."));
      }
    }
    if (name) {
      var n = searchChems(name, {});
      byName = n.length ? n[0] : null;
      if (byName && searchChems(name, {})[0] && (norm(name).length >= 3)) {
        out.push(check("info", "<b>Name matches:</b> " + esc(byName.name) + (n.length > 1 ? " (+" + (n.length - 1) + " similar)" : "") + "."));
      } else out.push(check("info", "Product name “" + esc(name) + "” does not match any chemical in the database."));
    }
    if (un) {
      var u = un.replace(/^UN/, "");
      if (!/^\d{4}$/.test(u)) out.push(check("bad", "<b>UN number format invalid:</b> expected four digits (e.g. UN1090)."));
      else {
        byUn = CHEMS.filter(function (c) { return (c.un || []).indexOf("UN" + u) >= 0; });
        if (byUn.length) out.push(check("info", "<b>UN" + u + " is:</b> " + byUn.map(function (c) { return esc(c.name); }).join(", ") + "."));
        else out.push(check("info", "UN" + u + " is not assigned to any chemical in this database (it may still be a valid transport number for other goods)."));
      }
    }

    /* consistency */
    var ref = byCas || byName;
    if (byCas && byName && byCas !== byName) {
      out.push(check("bad", "<b>Name and CAS disagree:</b> the CAS belongs to <b>" + esc(byCas.name) + "</b> but the name suggests <b>" + esc(byName.name) + "</b>. Strong red flag for a mislabelled or falsified container."));
    } else if (byCas && byName) {
      out.push(check("ok", "Name and CAS describe the same chemical."));
    }
    if (un && /^(UN)?\d{4}$/.test(un) && ref) {
      var uu = "UN" + un.replace(/^UN/, "");
      if ((ref.un || []).length) {
        if (ref.un.indexOf(uu) >= 0) out.push(check("ok", "UN number is consistent with " + esc(ref.name) + "."));
        else out.push(check("bad", "<b>UN number does not fit:</b> " + esc(ref.name) + " normally travels as " + ref.un.map(esc).join(" / ") + ", not " + esc(uu) + ". Check the shipping paper and the container."));
      } else {
        out.push(check("warn", esc(ref.name) + " has no dedicated UN number in this database (often not dangerous goods). A UN number on the label should be checked against its safety data sheet."));
      }
    }

    /* company */
    if (comp) {
      if (ref) {
        var v = companyVerdict(ref, comp);
        var cls = /v-ok/.test(v) ? "ok" : (/v-bad/.test(v) ? "bad" : "warn");
        out.push(check(cls, v.replace(/^<div class="verdict [^"]*">/, "").replace(/<\/div>$/, "")));
      } else {
        var m = findCompanies(comp);
        if (m.length) out.push(check("info", "Company recognised: <b>" + esc(m[0].co.name) + "</b> (" + esc(m[0].co.type) + "). The chemical could not be identified, so supply status cannot be checked."));
        else out.push(check("warn", "Company “" + esc(comp) + "” is not in the database and the chemical could not be identified."));
      }
    }
    var html = '<div class="card"><h3>Result</h3><ul class="checks">' + out.join("") + "</ul></div>";
    if (ref) html += renderCard(ref, "");
    $("l-result").innerHTML = html;
  }

  /* ---------- browse ---------- */
  function browseRows() {
    var f = norm($("b-filter").value), rg = $("b-regime").value;
    return CHEMS.filter(function (c) {
      if (rg && c._key !== rg) return false;
      if (!f) return true;
      return c._names.join(" ").indexOf(f) >= 0 || c._allCas.join(" ").indexOf($("b-filter").value.trim()) >= 0 || (c.un || []).join(" ").toLowerCase().indexOf(f) >= 0 || c._hs.indexOf(f.replace(/ /g, "")) === 0;
    });
  }
  function renderBrowse() {
    var rows = browseRows();
    $("b-count").textContent = rows.length + " of " + CHEMS.length + " chemicals";
    $("b-table").querySelector("tbody").innerHTML = rows.map(function (c) {
      return '<tr class="click" data-id="' + esc(c.id) + '"><td>' + esc(c.name) + '</td><td class="num">' + esc(c.cas || "—") + '</td><td class="num">' + esc((c.un || []).join(", ") || "—") + '</td><td class="num">' + esc(c.hs || "—") + '</td><td><span class="badge ' + REGIME_CLASS[c._key] + '">' + REGIME_LABEL[c._key] + "</span></td></tr>";
    }).join("");
  }
  function csvCell(v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function downloadCsv() {
    var head = ["Name", "CAS", "Other CAS", "UN", "HS", "Status", "Category", "Used for", "Role", "Legitimate use", "Synonyms"];
    var lines = [head.join(",")];
    CHEMS.forEach(function (c) {
      lines.push([c.name, c.cas || "", (c.other_cas || []).map(function (o) { return o.cas + " (" + o.form + ")"; }).join("; "), (c.un || []).join("; "), c.hs || "", REGIME_LABEL[c._key], c.category || "", (c.drugs || []).join("; "), c.role || "", c.legit || "", (c.synonyms || []).join("; ")].map(csvCell).join(","));
    });
    var blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "precursor-chemicals.csv";
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- user companies ---------- */
  function renderUser() {
    var list = loadUser();
    $("u-list").innerHTML = list.length ? list.map(function (c, i) {
      return "<li><b>" + esc(c.name) + "</b> (" + esc(c.type) + (c.country ? ", " + esc(c.country) : "") + ") – CAS: " + esc(c.cas.join(", ")) +
        ' <button class="copy" type="button" data-del="' + i + '">remove</button></li>';
    }).join("") : '<li class="small">None saved yet.</li>';
  }
  function addUser() {
    var name = $("u-name").value.trim();
    var cas = $("u-cas").value.split(/[,;\s]+/).map(function (s) { return s.trim(); }).filter(Boolean);
    var msg = $("u-msg");
    if (!name) { msg.textContent = "Enter a company name."; return; }
    var bad = cas.filter(function (c) { return !casValid(c); });
    if (!cas.length || bad.length) { msg.textContent = cas.length ? "Invalid CAS number(s): " + bad.join(", ") : "Enter at least one CAS number."; return; }
    var list = loadUser();
    list.push({ id: "user-" + Date.now(), name: name, aliases: [], country: $("u-country").value.trim(), type: $("u-type").value, cas: cas, source: "Added locally by user" });
    if (!saveUser(list)) { msg.textContent = "Could not save (browser storage unavailable)."; return; }
    $("u-name").value = ""; $("u-cas").value = ""; $("u-country").value = "";
    msg.textContent = "Saved on this device."; renderUser();
  }
  function exportUser() {
    var blob = new Blob([JSON.stringify({ companies: loadUser() }, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "my-companies.json";
    document.body.appendChild(a); a.click(); a.remove();
  }


  /* ---------- world map ---------- */
  var WORLD = window.WORLD || { w: 960, h: 427, countries: [] };
  var CDATA = window.COUNTRIES || {};
  var CMETA = window.COUNTRY_META || {};
  var BYISO = {};
  WORLD.countries.forEach(function (c) { BYISO[c.i] = c; });
  var COV_LABEL = { verified: "Full national list read", partial: "Partial / may be out of date", none: "No public list found" };
  var CHEM_COUNTRIES = {};
  Object.keys(CDATA).forEach(function (iso) {
    (CDATA[iso].extras || []).forEach(function (e) {
      var ch = e.db ? CHEMS.filter(function (c) { return c.id === e.db; })[0] : (e.cas ? chemByCas(e.cas) : null);
      if (!ch) return;
      (CHEM_COUNTRIES[ch.id] = CHEM_COUNTRIES[ch.id] || []).push(iso);
    });
  });
  function covClass(iso) {
    var d = CDATA[iso];
    if (!d || d.coverage === "none") return "c-none";
    if (d.coverage === "partial") return "c-partial";
    return d.extras.length ? "c-extra" : "c-clear";
  }
  function countryChips(ids) {
    return ids.map(function (i) { return BYISO[i] ? '<button type="button" class="chip" data-country="' + i + '">' + esc(BYISO[i].l) + "</button>" : ""; }).join("");
  }
  var NS = "http://www.w3.org/2000/svg";
  var MAP = { region: "", k: 1, tx: 0, ty: 0, sel: null, ready: false, pending: false, moved: false };

  function mapScale() { var r = $("m-svg").getBoundingClientRect(); return r.width ? r.width / WORLD.w : 1; }
  function clampView() {
    var k = MAP.k, W = WORLD.w, H = WORLD.h;
    MAP.tx = Math.min(0, Math.max(W - W * k, MAP.tx));
    MAP.ty = Math.min(0, Math.max(H - H * k, MAP.ty));
  }
  function applyView() {
    clampView();
    $("m-vp").setAttribute("transform", "translate(" + MAP.tx + " " + MAP.ty + ") scale(" + MAP.k + ")");
    $("m-vp").style.setProperty("--k", MAP.k);
    if (!MAP.pending) { MAP.pending = true; (window.requestAnimationFrame || setTimeout)(function () { MAP.pending = false; drawLabels(); }); }
  }
  function zoomAt(f, px, py) {
    var nk = Math.min(40, Math.max(1, MAP.k * f)); f = nk / MAP.k;
    MAP.tx = px - (px - MAP.tx) * f; MAP.ty = py - (py - MAP.ty) * f; MAP.k = nk; applyView();
  }
  function drawLabels() {
    var g = $("m-lab"), r = mapScale(), fs = 10 / r, k = MAP.k, placed = [], out = "";
    var W = WORLD.w, H = WORLD.h;
    WORLD.countries.slice().sort(function (a, b) { return (b.bw * b.bh) - (a.bw * a.bh); }).forEach(function (c) {
      var x = c.x * k + MAP.tx, y = c.y * k + MAP.ty;
      if (x < 0 || y < 0 || x > W || y > H) return;
      var w = c.l.length * fs * 0.56, h = fs;
      if (!c.p && c.bw * k < w * 0.8 && c.bh * k < w * 0.8) return;
      var rc = [x - w / 2 - 1, y - h / 2, x + w / 2 + 1, y + h / 2];
      for (var i = 0; i < placed.length; i++) {
        var p = placed[i];
        if (rc[0] < p[2] && rc[2] > p[0] && rc[1] < p[3] && rc[3] > p[1]) return;
      }
      placed.push(rc);
      out += '<text x="' + x.toFixed(1) + '" y="' + (y + fs * 0.35).toFixed(1) + '" font-size="' + fs.toFixed(2) + '"' + (MAP.sel === c.i ? ' class="sel"' : "") + ">" + esc(c.l) + "</text>";
    });
    g.innerHTML = out;
  }
  function selectCountry(iso, zoom) {
    var c = BYISO[iso]; if (!c) return;
    var prev = document.querySelector("#m-vp .ctry.sel, #m-vp .dot.sel");
    if (prev) prev.classList.remove("sel");
    MAP.sel = iso;
    var el = document.querySelector('#m-vp [data-i="' + iso + '"]');
    if (el) { el.classList.add("sel"); el.parentNode.appendChild(el); }
    if (zoom) {
      var k = c.p ? 8 : Math.max(1, Math.min(8, 0.5 * WORLD.w / Math.max(c.bw, 1), 0.5 * WORLD.h / Math.max(c.bh, 1)));
      MAP.k = k; MAP.tx = WORLD.w / 2 - c.x * k; MAP.ty = WORLD.h / 2 - c.y * k;
    }
    applyView();
    renderCountryPanel(iso);
    $("m-search").value = c.n;
  }
  function renderCountryPanel(iso) {
    var c = BYISO[iso], d = CDATA[iso], h = "";
    h += "<h3>" + esc(c.n) + "</h3>";
    h += '<div class="badges"><span class="badge b-id"><small>ISO</small> ' + esc(iso) + "</span>";
    if (c.r) h += '<span class="badge b-id">' + esc(c.sr || c.r) + "</span>";
    if (c.dep) h += '<span class="badge b-id">Dependency / territory</span>';
    h += '<span class="badge cov-' + (d ? d.coverage : "none") + '">' + esc(COV_LABEL[d ? d.coverage : "none"]) + "</span></div>";
    if (!d || d.coverage === "none") {
      h += '<p class="hint2">No consolidated public list of nationally controlled chemicals could be found for this ' + (c.dep ? "territory" : "country") + '. This does <b>not</b> mean it has none: the INCB says about 50 countries control chemicals beyond Tables I and II but does not publish who. ';
      h += c.dep ? "A territory is often covered by the law of the state that administers it; check that state first. " : "";
      h += 'Ask the national competent authority (the INCB keeps the contact list in its <a href="https://www.incb.org/incb/en/precursors/index.html" target="_blank" rel="noopener">precursors area</a>).</p>';
      if (d) {
        if (d.basis) h += '<p class="small"><b>Legal basis:</b> ' + esc(d.basis) + "</p>";
        if (d.notes) h += '<p class="small"><b>Notes:</b> ' + esc(d.notes) + "</p>";
        if (d.sources && d.sources.length) h += '<p class="small"><b>Sources:</b></p><ul class="plain small">' + d.sources.map(function (x) { return '<li><a href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + esc(x[0]) + "</a></li>"; }).join("") + "</ul>";
      }
    } else {
      if (d.via) h += '<p class="hint2">Same list as ' + (BYISO[d.via] ? '<a href="#" data-country="' + d.via + '">' + esc(BYISO[d.via].n) + "</a>" : esc(d.via)) + ".</p>";
      if (d.basis) h += '<p class="small"><b>Basis:</b> ' + esc(d.basis) + "</p>";
      if (!d.extras.length) h += '<p class="v-ok verdict">No additional chemicals found: everything this country lists is already in INCB Table I or II.</p>';
      else {
        var groups = {}, order = [];
        d.extras.forEach(function (e) { var g = e.g || "Other"; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(e); });
        h += '<p class="count">' + d.extras.length + " additional chemical" + (d.extras.length === 1 ? "" : "s") + " (not in INCB Table I or II)" + (d.coverage === "partial" ? " – <b>incomplete list</b>" : "") + "</p>";
        order.forEach(function (g) {
          h += '<div class="table-wrap"><table><thead><tr><th>' + esc(g) + '</th><th>CAS</th><th></th></tr></thead><tbody>';
          groups[g].forEach(function (e) {
            h += "<tr><td>" + esc(e.n) + (e.note ? '<div class="small">' + esc(e.note) + "</div>" : "") + "</td><td class=\"num\">" + (e.cas ? esc(e.cas) + ' <button type="button" class="copy" data-copy="' + esc(e.cas) + '">copy</button>' : "–") + "</td><td>";
            var ch = e.db ? CHEMS.filter(function (x) { return x.id === e.db; })[0] : (e.cas ? chemByCas(e.cas) : null);
            if (ch) h += '<button type="button" class="chip" data-chem="' + esc(ch.id) + '">details</button>';
            h += "</td></tr>";
          });
          h += "</tbody></table></div>";
        });
      }
      if (d.notes) h += '<p class="small"><b>Notes:</b> ' + esc(d.notes) + "</p>";
      if (d.sources && d.sources.length) h += '<p class="small"><b>Sources:</b></p><ul class="plain small">' + d.sources.map(function (x) { return '<li><a href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + esc(x[0]) + "</a></li>"; }).join("") + "</ul>";
      h += '<p class="small">Data as of ' + esc(CMETA.asOf || "") + ". National lists change often; confirm with the competent authority before enforcement action.</p>";
    }
    $("m-panel").innerHTML = h;
  }
  function renderMapList() {
    var f = norm($("m-filter").value);
    var list = WORLD.countries.filter(function (c) { return !MAP.region || c.r === MAP.region; }).sort(function (a, b) { return a.n < b.n ? -1 : a.n > b.n ? 1 : 0; }).filter(function (c) { return !f || norm(c.n).indexOf(f) >= 0 || c.i.toLowerCase() === f; });
    $("m-list").innerHTML = list.map(function (c) { return '<button type="button" class="chip ' + covClass(c.i) + '" data-country="' + c.i + '">' + esc(c.n) + "</button>"; }).join("");
  }
  function focusRegion(reg) {
    MAP.region = reg || "";
    var set = WORLD.countries.filter(function (c) { return c.r === reg; });
    if (reg && set.length) {
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      set.forEach(function (c) { x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); y0 = Math.min(y0, c.y); y1 = Math.max(y1, c.y); });
      var w = Math.max(x1 - x0, 40) + 50, h = Math.max(y1 - y0, 40) + 40;
      MAP.k = Math.min(8, WORLD.w / w, WORLD.h / h);
      MAP.tx = WORLD.w / 2 - (x0 + x1) / 2 * MAP.k; MAP.ty = WORLD.h / 2 - (y0 + y1) / 2 * MAP.k;
    } else { MAP.k = 1; MAP.tx = 0; MAP.ty = 0; }
    $("m-africa").setAttribute("aria-pressed", reg === "Africa" ? "true" : "false");
    $("m-africa").textContent = reg === "Africa" ? "Show whole world" : "Focus on Africa";
    applyView(); renderMapList(); mapCount();
  }
  function mapCount() {
    var set = WORLD.countries.filter(function (c) { return !MAP.region || c.r === MAP.region; });
    var n = { verified: 0, partial: 0, none: 0, extra: 0 };
    set.forEach(function (c) { var d = CDATA[c.i]; n[d ? d.coverage : "none"]++; if (d && d.extras.length) n.extra++; });
    $("m-count").textContent = set.length + " countries and territories" + (MAP.region ? " in " + MAP.region : "") + ": " + n.verified + " with a full national list read, " + n.partial + " partial, " + n.none + " with no public list found. " + n.extra + " have chemicals beyond INCB Tables I and II.";
  }
  function initMap() {
    var svg = $("m-svg");
    if (!WORLD.countries.length) { $("panel-map").innerHTML = '<div class="card">Map data failed to load.</div>'; return; }
    svg.setAttribute("viewBox", "0 0 " + WORLD.w + " " + WORLD.h);
    var h = '<rect class="sea" width="' + WORLD.w + '" height="' + WORLD.h + '"/><g id="m-vp"><g transform="scale(.1)">';
    WORLD.countries.forEach(function (c) { if (c.d) h += '<path class="ctry ' + covClass(c.i) + '" data-i="' + c.i + '" d="' + c.d + '"><title>' + esc(c.n) + "</title></path>"; });
    h += '</g><g id="m-dots">';
    WORLD.countries.forEach(function (c) { if (c.p) h += '<circle class="dot ' + covClass(c.i) + '" data-i="' + c.i + '" cx="' + c.x + '" cy="' + c.y + '" r="1.6"><title>' + esc(c.n) + "</title></circle>"; });
    h += '</g></g><g id="m-lab" pointer-events="none"></g>';
    svg.innerHTML = h;
    mapCount();
    $("m-legend").innerHTML = [["c-extra", "Extra chemicals (list read)"], ["c-clear", "List read, no extras"], ["c-partial", "Partial list"], ["c-none", "No public list found"]].map(function (x) {
      return '<span><i class="sw ' + x[0] + '"></i>' + x[1] + "</span>";
    }).join("");
    $("m-names").innerHTML = WORLD.countries.map(function (c) { return '<option value="' + esc(c.n) + '">'; }).join("");
    renderMapList();
    $("m-panel").innerHTML = '<p class="hint2">Select a country on the map, in the search box or in the list below.</p>';

    var pts = {}, last = 0;
    function pos(e) { var r = svg.getBoundingClientRect(), s = WORLD.w / r.width; return [(e.clientX - r.left) * s, (e.clientY - r.top) * s]; }
    svg.addEventListener("wheel", function (e) { e.preventDefault(); var p = pos(e); zoomAt(e.deltaY < 0 ? 1.25 : 0.8, p[0], p[1]); }, { passive: false });
    svg.addEventListener("pointerdown", function (e) {
      pts[e.pointerId] = pos(e); MAP.moved = false; last = 0;
      try { svg.setPointerCapture(e.pointerId); } catch (x) {}
    });
    svg.addEventListener("pointermove", function (e) {
      if (!pts[e.pointerId]) return;
      var p = pos(e), ids = Object.keys(pts);
      if (ids.length === 2) {
        var o = pts[ids[0] == e.pointerId ? ids[1] : ids[0]], q = pts[e.pointerId];
        var d0 = Math.hypot(o[0] - q[0], o[1] - q[1]), d1 = Math.hypot(o[0] - p[0], o[1] - p[1]);
        if (d0 > 0) zoomAt(d1 / d0, (o[0] + p[0]) / 2, (o[1] + p[1]) / 2);
        MAP.moved = true;
      } else {
        var dx = p[0] - pts[e.pointerId][0], dy = p[1] - pts[e.pointerId][1];
        last += Math.abs(dx) + Math.abs(dy);
        if (last > 4) { MAP.moved = true; MAP.tx += dx; MAP.ty += dy; applyView(); }
      }
      pts[e.pointerId] = p;
    });
    function up(e) { delete pts[e.pointerId]; }
    svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", up);
    svg.addEventListener("click", function (e) {
      if (MAP.moved) { MAP.moved = false; return; }
      var t = e.target.closest("[data-i]"); if (t) selectCountry(t.getAttribute("data-i"), false);
    });
    $("m-in").addEventListener("click", function () { zoomAt(1.6, WORLD.w / 2, WORLD.h / 2); });
    $("m-out").addEventListener("click", function () { zoomAt(1 / 1.6, WORLD.w / 2, WORLD.h / 2); });
    $("m-reset").addEventListener("click", function () { focusRegion(""); });
    $("m-filter").addEventListener("input", renderMapList);
    $("m-africa").addEventListener("click", function () { focusRegion(MAP.region === "Africa" ? "" : "Africa"); });
    $("m-search").addEventListener("input", function () {
      var v = norm(this.value); if (!v) return;
      var c = WORLD.countries.filter(function (x) { return norm(x.n) === v || x.i.toLowerCase() === v; })[0];
      if (c) selectCountry(c.i, true);
    });
    window.addEventListener("resize", function () { if (!$("panel-map").hidden) drawLabels(); });
    MAP.ready = true;
  }

  /* ---------- tabs & wiring ---------- */
  function showTab(name) {
    ["search", "map", "label", "browse", "controls", "about"].forEach(function (t) {
      var on = t === name;
      $("tab-" + t).setAttribute("aria-selected", on ? "true" : "false");
      $("panel-" + t).hidden = !on;
    });
    if (name === "browse") renderBrowse();
    if (name === "map" && MAP.ready) applyView();
    window.scrollTo(0, 0);
  }

  function init() {
    DRUGS.forEach(function (d, i) { var o = document.createElement("option"); o.value = i; o.textContent = d[0]; $("f-drug").appendChild(o); });
    ["search", "map", "label", "browse", "controls", "about"].forEach(function (t) { $("tab-" + t).addEventListener("click", function () { showTab(t); }); });

    ["q", "company"].forEach(function (id) { $(id).addEventListener("input", runSearch); });
    ["f-regime", "f-drug"].forEach(function (id) { $(id).addEventListener("change", runSearch); });

    var ex = ["acetic anhydride", "103-79-7", "UN1090", "2939.42", "P2P", "ANPP", "red phosphorus", "safrole"];
    $("examples").innerHTML = ex.map(function (e) { return '<button class="chip" type="button" data-ex="' + esc(e) + '">' + esc(e) + "</button>"; }).join("");
    $("examples").addEventListener("click", function (e) {
      var b = e.target.closest("[data-ex]"); if (!b) return;
      $("q").value = b.getAttribute("data-ex"); runSearch(); $("q").focus();
    });

    $("l-run").addEventListener("click", runLabel);
    ["l-name", "l-cas", "l-un", "l-company"].forEach(function (id) { $(id).addEventListener("keydown", function (e) { if (e.key === "Enter") runLabel(); }); });

    $("b-filter").addEventListener("input", renderBrowse);
    $("b-regime").addEventListener("change", renderBrowse);
    $("b-csv").addEventListener("click", downloadCsv);
    $("b-table").addEventListener("click", function (e) {
      var tr = e.target.closest("tr[data-id]"); if (!tr) return;
      var c = CHEMS.filter(function (x) { return x.id === tr.getAttribute("data-id"); })[0];
      if (!c) return;
      $("q").value = c.cas || c.name; $("company").value = ""; showTab("search"); runSearch();
    });

    initMap();
    $("u-add").addEventListener("click", addUser);
    $("u-export").addEventListener("click", exportUser);
    $("u-list").addEventListener("click", function (e) {
      var b = e.target.closest("[data-del]"); if (!b) return;
      var list = loadUser(); list.splice(parseInt(b.getAttribute("data-del"), 10), 1); saveUser(list); renderUser();
    });

    document.addEventListener("click", function (e) {
      var cc = e.target.closest("[data-country]");
      if (cc) { e.preventDefault(); showTab("map"); selectCountry(cc.getAttribute("data-country"), true); return; }
      var cm = e.target.closest("[data-chem]");
      if (cm) { var ch = CHEMS.filter(function (x) { return x.id === cm.getAttribute("data-chem"); })[0]; if (ch) { $("q").value = ch.cas || ch.name; $("company").value = ""; showTab("search"); runSearch(); } return; }
      var g = e.target.closest("[data-goto]");
      if (g) { e.preventDefault(); showTab(g.getAttribute("data-goto")); return; }
      var b = e.target.closest("[data-copy]"); if (!b) return;
      var v = b.getAttribute("data-copy");
      try { navigator.clipboard.writeText(v); b.textContent = "copied"; setTimeout(function () { b.textContent = "copy"; }, 1200); } catch (err) { b.textContent = "select & copy"; }
    });

    var nT1 = CHEMS.filter(function (c) { return c._key === "T1"; }).length, nT2 = CHEMS.filter(function (c) { return c._key === "T2"; }).length, nNS = CHEMS.filter(function (c) { return c._key === "NS"; }).length;
    $("tc-meta").textContent = (META.redListEdition || "INCB Red List") + " | " + CHEMS.length + " chemicals tracked | " + BASE_COMPANIES.length + " companies in sticker check";
    $("tc-csv").addEventListener("click", function (e) { e.preventDefault(); downloadCsv(); });
    var kp = [["Scheduled chemicals", nT1 + nT2, "INCB Tables I + II", ""], ["Table I", nT1, "strictest controls", "T1"], ["Table II", nT2, "solvents, acids, others", "T2"], ["Monitored", nNS, "not scheduled", "NS"], ["Companies", BASE_COMPANIES.length, "for sticker check", ""]];
    $("kpis").innerHTML = kp.map(function (k) {
      return '<div class="kpi' + (k[3] ? " kpi-click" : "") + '"' + (k[3] ? ' data-kpi="' + k[3] + '" role="button" tabindex="0"' : "") + '><div class="kpi-l">' + esc(k[0]) + '</div><div class="kpi-v">' + k[1] + '</div><div class="kpi-s">' + esc(k[2]) + "</div></div>";
    }).join("");
    $("kpis").addEventListener("click", function (e) {
      var k = e.target.closest("[data-kpi]"); if (!k) return;
      var v = $("f-regime").value === k.getAttribute("data-kpi") ? "" : k.getAttribute("data-kpi");
      $("f-regime").value = v; runSearch();
    });
    $("meta").textContent = (META.redListEdition || "") + (META.built ? " · data built " + META.built : "") + " · " + CHEMS.length + " chemicals · " + (BASE_COMPANIES.length) + " companies";
    renderUser();
    runSearch();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
