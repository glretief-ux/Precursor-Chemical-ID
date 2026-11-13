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

setTimeout(() => {
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

  // counts
  const t1 = (d.getElementById("results") && 0);
  ok(w.CHEMICALS.length === 104, "104 chemicals loaded");
  console.log(fail ? `\n${fail} FAILED` : "\nALL PASSED");
  process.exit(fail ? 1 : 0);
}, 100);
