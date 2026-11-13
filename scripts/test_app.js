// Smoke tests for the standalone app (run: cd scripts && npm i jsdom && node test_app.js)
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "dist", "precursor-chemical-id.html"), "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "http://localhost/" });
const w = dom.window, d = w.document;

let fail = 0;
function ok(cond, msg) { if (!cond) { fail++; console.log("FAIL:", msg); } else console.log("ok  :", msg); }
function type(id, v) { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new w.Event("input", { bubbles: true })); }
function titles() { return [...d.querySelectorAll("#results .res-head h2")].map(e => e.textContent); }

setTimeout(async () => {
  type("q", "108-24-7");
  ok(titles()[0] === "Acetic anhydride", "CAS 108-24-7 -> acetic anhydride");
  ok(d.getElementById("results").textContent.includes("UN1715"), "acetic anhydride shows UN1715");

  type("q", "UN1090");
  ok(titles()[0] === "Acetone", "UN1090 -> acetone");

  type("q", "1090");
  ok(titles()[0] === "Acetone", "1090 -> acetone");

  type("q", "p2p");
  ok(titles().some(t => t.includes("P2P")), "synonym P2P found");

  type("q", "2939.42");
  ok(titles()[0] === "Pseudoephedrine", "HS 2939.42 -> pseudoephedrine");

  type("q", "345-78-8");
  ok(titles()[0] === "Pseudoephedrine", "salt CAS 345-78-8 -> pseudoephedrine");

  type("q", "108-24-8");
  ok(d.getElementById("results").textContent.includes("check digit is invalid"), "invalid CAS flagged");

  type("q", "acetone"); type("company", "INEOS");
  ok(d.getElementById("results").textContent.includes("Match: company is known"), "INEOS makes acetone -> match");

  type("company", "Malladi");
  ok(d.getElementById("results").textContent.includes("not recorded"), "Malladi not recorded for acetone");

  type("company", "Totally Unknown Chem Co");
  ok(d.getElementById("results").textContent.includes("not in database"), "unknown company flagged");

  type("q", "acetic anhydride"); type("company", "Ineos Acetils");
  ok(d.getElementById("results").textContent.includes("INEOS Acetyls") && d.getElementById("results").textContent.includes("Match: company is known"), "INEOS Acetyls recognised for acetic anhydride");
  type("q", "toluene"); type("company", "Sigma Aldrch");
  ok(d.getElementById("results").textContent.includes("Possible match"), "misspelt Sigma-Aldrich -> fuzzy match");

  // label check
  const lab = (n, c, u, co) => { d.getElementById("l-name").value = n; d.getElementById("l-cas").value = c; d.getElementById("l-un").value = u; d.getElementById("l-company").value = co; d.getElementById("l-run").click(); return d.getElementById("l-result").textContent; };
  let r = lab("Acetone", "67-64-1", "UN1090", "INEOS Phenol");
  ok(r.includes("consistent") && r.includes("Match"), "genuine-looking acetone label passes");
  r = lab("Acetone", "108-24-7", "UN1090", "");
  ok(r.includes("Name and CAS disagree"), "name/CAS mismatch flagged");
  r = lab("Toluene", "108-88-3", "UN1090", "");
  ok(r.includes("UN number does not fit"), "wrong UN flagged");
  r = lab("", "67-64-2", "", "");
  ok(r.includes("check digit invalid"), "bad CAS on label flagged");

  // world map
  const paths = d.querySelectorAll("#m-svg path.ctry").length;
  ok(paths > 180, "map draws country shapes (" + paths + ")");
  ok(w.WORLD.countries.length >= 230, "map has " + w.WORLD.countries.length + " countries/territories");
  function pick(name) {
    const inp = d.getElementById("m-search");
    inp.value = name; inp.dispatchEvent(new w.Event("input", { bubbles: true }));
    const li = d.querySelector('#m-listbox li[data-i]');
    li.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  }
  d.querySelector('#m-svg [data-i="USA"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  let mp = d.getElementById("m-panel").textContent;
  ok(mp.includes("United States") && mp.includes("Ethylamine") && mp.includes("List I"), "clicking USA lists its extra chemicals");
  pick("India");
  mp = d.getElementById("m-panel").textContent;
  ok(mp.includes("India") && mp.includes("No additional chemicals"), "India shows list read, no extras");
  pick("France");
  ok(d.getElementById("m-panel").textContent.includes("EAPA"), "France shows EU extras");
  pick("Tuvalu");
  ok(d.getElementById("m-panel").textContent.includes("No consolidated public list"), "country with no data says so");
  ok(Object.keys(w.COUNTRIES).length >= 55, "country data loaded");
  type("q", "red phosphorus");
  ok(d.getElementById("results").textContent.includes("Nationally controlled in"), "chemical card lists countries that control it");


  // compact country dropdown
  type("q", ""); 
  const inp = d.getElementById("m-search");
  inp.value = "south"; inp.dispatchEvent(new w.Event("input", { bubbles: true }));
  ok(!d.getElementById("m-listbox").hidden && d.querySelectorAll("#m-listbox li[data-i]").length >= 3, "typing in the country box opens a filtered dropdown");
  ok(inp.getAttribute("aria-expanded") === "true", "combobox reports expanded");
  d.getElementById("m-region").value = "Africa"; d.getElementById("m-region").dispatchEvent(new w.Event("change", { bubbles: true }));
  ok([...d.querySelectorAll("#m-listbox li .rg")].every(e => e.textContent === "Africa"), "region filter narrows the dropdown");
  ok(!d.querySelector("#m-list"), "old chip wall of all countries is gone");
  d.getElementById("m-region").value = ""; d.getElementById("m-region").dispatchEvent(new w.Event("change", { bubbles: true }));

  // dark mode
  ok(["dark", "light"].includes(d.documentElement.getAttribute("data-theme")), "theme attribute set");
  const before = d.documentElement.getAttribute("data-theme");
  d.getElementById("theme-toggle").click();
  ok(d.documentElement.getAttribute("data-theme") !== before, "theme toggle switches light/dark");
  d.getElementById("theme-toggle").click();

  // tools + incident report
  d.getElementById("tab-tools").click();
  ok(!d.getElementById("panel-tools").hidden && d.getElementById("panel-tools").textContent.includes("PICS"), "Intelligence & tools tab lists PICS");
  d.querySelector('#tool-filters [data-cat="lab"]').click();
  ok([...d.querySelectorAll("#tool-grid .tool")].filter(t => !t.hidden).every(t => t.dataset.cat === "lab"), "tool category filter works");
  type("q", "acetic anhydride"); d.getElementById("tab-search").click();
  d.querySelector("#results [data-report]").click();
  ok(!d.getElementById("panel-report").hidden && d.getElementById("r-cas").value === "108-24-7", "Add to incident report fills the sheet");
  ok(d.getElementById("r-un").value.includes("UN1715"), "report gets the UN number");
  d.getElementById("r-qty").value = "200"; d.getElementById("r-make").click();
  const sheet = d.getElementById("r-sheet").textContent;
  ok(sheet.includes("Acetic anhydride") && sheet.includes("200 kg") && sheet.includes("PICS"), "report summary is generated");
  d.getElementById("r-cas").value = "108-24-8"; d.getElementById("r-cas").dispatchEvent(new w.Event("input", { bubbles: true }));
  ok(d.getElementById("r-cas-msg").textContent.includes("invalid"), "invalid CAS flagged in report");


  // ---- French version ----
  const tick = () => new Promise(r => setTimeout(r, 30));
  const txt = id => d.getElementById(id).textContent;
  const frBtn = d.querySelector('#lang-switch [data-lang="fr"]'), enBtn = d.querySelector('#lang-switch [data-lang="en"]');
  ok(!!frBtn && !!enBtn && enBtn.getAttribute("aria-pressed") === "true", "EN | FR switch is in the header, English active by default");
  type("q", "108-24-7");
  frBtn.click(); await tick();
  ok(d.documentElement.lang === "fr" && frBtn.getAttribute("aria-pressed") === "true", "switching to French sets lang and the pressed state");
  ok(d.getElementById("tab-map").textContent.trim() === "Carte du monde" && d.getElementById("tab-tools").textContent.includes("Renseignement"), "tabs are in French");
  ok(d.querySelector("h1").textContent === "Precursor Chemical ID" && d.querySelector(".tc-sub").textContent.startsWith("Identifiez un produit chimique"), "hero text is in French");
  ok(d.getElementById("q").getAttribute("placeholder").startsWith("p. ex."), "placeholders are in French");
  ok(d.title.includes("forces de l’ordre"), "page title is in French");
  const frMiss = w.PCI_I18N.missing();
  ok(frMiss.length === 0, "every static string on the page has a French translation" + (frMiss.length ? " - missing: " + JSON.stringify(frMiss.slice(0, 5)) : ""));
  const frRes = txt("results");
  ok(frRes.includes("Utilisé pour fabriquer") && frRes.includes("Tableau I de l’OICS") && frRes.includes("Agent d’acétylation") && frRes.includes("Contrôle du commerce"), "search result card is in French");
  ok(frRes.includes("Liquide incolore") && frRes.includes("Usage légitime") && frRes.includes("Héroïne"), "chemical descriptions, uses and drug names are in French");
  ok(!/\b(Role|Appearance|Legitimate use|Trade control)\b/.test(frRes), "no English labels left on the result card");
  type("q", "acetone"); type("company", "INEOS"); await tick();
  ok(txt("results").includes("Correspondance : l’entreprise est connue"), "company verdict is in French");
  type("company", "Totally Unknown Chem Co"); await tick();
  ok(txt("results").includes("n’est pas un producteur/fournisseur connu"), "unknown-company warning is in French");
  type("company", ""); type("q", "108-24-8"); await tick();
  ok(txt("results").includes("chiffre de contrôle CAS est invalide"), "invalid-CAS message is in French");
  type("q", "zzzzzz"); await tick();
  ok(txt("results").includes("Aucune correspondance") && txt("count").includes("0 résultat"), "no-match message and count are in French");
  type("q", "acetone"); await tick();
  ok(/^\d+ résultats?$/.test(txt("count")), "result count is in French");
  // label check
  d.getElementById("tab-label").click();
  type("l-name", "Acetone"); type("l-cas", "67-64-2"); type("l-un", "UN1170"); type("l-company", "INEOS");
  d.getElementById("l-run").click(); await tick();
  const frLr = txt("l-result");
  ok(frLr.includes("Résultat") && frLr.includes("invalide") && frLr.includes("ne convient pas"), "label check results are in French");
  ok(!/(does not fit|check digit|disagree|could not be)/.test(frLr), "label check has no English message left");
  // map
  d.getElementById("tab-map").click();
  pick("United States"); await tick();
  ok(txt("m-search") === "" && d.getElementById("m-search").value === "États-Unis", "country names are French (searchable in English too)");
  const frMp = txt("m-panel");
  ok(frMp.includes("Base :") && frMp.includes("produits chimiques supplémentaires") && frMp.includes("Sources :"), "country panel is in French");
  ok(frMp.includes("Amérique du Nord") || frMp.includes("Amériques"), "region names are in French");
  ok(txt("m-count").includes("pays et territoires"), "map summary is in French");
  pick("Colombia"); await tick();
  ok(txt("m-panel").includes("Base juridique") || txt("m-panel").includes("Base :"), "Colombia panel is in French");
  d.getElementById("m-search").value = "ital"; d.getElementById("m-search").dispatchEvent(new w.Event("input", { bubbles: true })); await tick();
  ok(txt("m-listbox").includes("Italie"), "country list shows French names");
  d.getElementById("m-search").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  // report in French
  d.getElementById("tab-search").click(); type("q", "acetic anhydride"); await tick();
  d.querySelector("#results [data-report]").click(); await tick();
  ok(d.getElementById("r-status").value.includes("Tableau I de l’OICS"), "report status is in French");
  d.getElementById("r-qty").value = "50"; d.getElementById("r-make").click(); await tick();
  const frSh = txt("r-sheet");
  ok(frSh.includes("FICHE DE RAPPORT D’INCIDENT") && frSh.includes("Quantité : 50 kg") && frSh.includes("Vérifications effectuées".toUpperCase()), "report summary is generated in French");
  d.getElementById("r-cas").value = "108-24-8"; d.getElementById("r-cas").dispatchEvent(new w.Event("input", { bubbles: true })); await tick();
  ok(txt("r-cas-msg").includes("invalide"), "report CAS hint is in French");
  // tools tab + byte
  d.getElementById("tab-tools").click();
  ok(txt("panel-tools").includes("Après une interception") && txt("panel-tools").includes("Gouvernements uniquement"), "tools tab is in French");
  ok(d.getElementById("byteBtn") && d.getElementById("byteBtn").textContent.includes("Besoin d’aide"), "Byte button is in French");
  d.getElementById("byteBtn").click();
  const bq = d.getElementById("byteQ"); bq.value = "comment vérifier une étiquette ?"; d.getElementById("byteForm").dispatchEvent(new w.Event("submit", { cancelable: true }));
  await new Promise(r => setTimeout(r, 900));
  ok(txt("byteLog").includes("Contrôle d’étiquette"), "Byte answers a French question in French");
  d.getElementById("byteClose").click();
  ok(w.localStorage.getItem("pci-lang") === "fr", "the language choice is remembered");
  // back to English
  enBtn.click(); await tick();
  ok(d.documentElement.lang === "en" && d.getElementById("tab-map").textContent.trim() === "World map", "switching back restores the English page");
  d.getElementById("tab-search").click(); type("q", "108-24-7"); await tick();
  ok(txt("results").includes("Used for making") && txt("results").includes("Acetylating agent"), "results are English again");
  ok(d.getElementById("byteBtn").textContent.includes("Need help"), "Byte is English again");
  d.getElementById("tab-map").click(); pick("United States");
  ok(d.getElementById("m-search").value === "United States", "country names are English again");
  ok(d.querySelectorAll("#byteBtn").length === 1, "only one Byte after switching languages");

  // opening with ?lang=fr
  const dom2 = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "http://localhost/?lang=fr" });
  await new Promise(r => setTimeout(r, 150));
  const d2 = dom2.window.document;
  ok(d2.documentElement.lang === "fr" && d2.getElementById("tab-label").textContent.trim() === "Contrôle d’étiquette", "?lang=fr opens the French page");
  ok(d2.getElementById("tc-meta").textContent.includes("produits chimiques suivis") && d2.getElementById("kpis").textContent.includes("Produits inscrits"), "French header counts and tiles on load");
  ok(d2.getElementById("f-drug").textContent.includes("Héroïne"), "drug filter options are in French on load");
  ok(d2.getElementById("results").textContent.includes("entrées chargées"), "start message is in French on load");

  // counts
  const t1 = (d.getElementById("results") && 0);
  ok(w.CHEMICALS.length === 104, "104 chemicals loaded");
  console.log(fail ? `\n${fail} FAILED` : "\nALL PASSED");
  process.exit(fail ? 1 : 0);
}, 100);
