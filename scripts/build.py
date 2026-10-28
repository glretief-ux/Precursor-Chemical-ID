#!/usr/bin/env python3
"""Validate the data files and build the web app bundles.

Usage:  python3 scripts/build.py          (validate + build)
        python3 scripts/build.py --check  (validate only; used in CI)

Outputs:
  docs/data/chemicals.js, docs/data/manufacturers.js   (loaded by docs/index.html)
  dist/precursor-chemical-id.html                       (single offline file for phone/tablet/USB)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAS_RE = re.compile(r"^\d{2,7}-\d{2}-\d$")
UN_RE = re.compile(r"^UN\d{4}$")
HS_RE = re.compile(r"^\d{4}\.\d{2}$")


def cas_ok(cas: str) -> bool:
    if not CAS_RE.match(cas):
        return False
    digits = cas.replace("-", "")
    body, check = digits[:-1], int(digits[-1])
    total = sum((i + 1) * int(d) for i, d in enumerate(reversed(body)))
    return total % 10 == check


def validate(chems, comps):
    errors = []
    seen_cas, seen_id = {}, set()
    for c in chems:
        for k in ("id", "name", "regime"):
            if not c.get(k):
                errors.append(f"{c.get('id', '?')}: missing {k}")
        if c["id"] in seen_id:
            errors.append(f"duplicate id {c['id']}")
        seen_id.add(c["id"])
        all_cas = ([c["cas"]] if c.get("cas") else []) + [o["cas"] for o in c.get("other_cas", [])]
        for cas in all_cas:
            if not cas_ok(cas):
                errors.append(f"{c['id']}: invalid CAS {cas}")
            if cas in seen_cas:
                errors.append(f"{c['id']}: CAS {cas} also used by {seen_cas[cas]}")
            seen_cas[cas] = c["id"]
        for u in c.get("un", []):
            if not UN_RE.match(u):
                errors.append(f"{c['id']}: bad UN {u}")
        if c.get("hs") and not HS_RE.match(c["hs"]):
            errors.append(f"{c['id']}: bad HS {c['hs']}")
    for co in comps:
        for cas in co.get("cas", []):
            if cas not in seen_cas:
                errors.append(f"company {co['id']}: CAS {cas} not in chemicals.json")
    return errors


def build_countries(chems):
    """Validate data/countries.json and resolve it into the structure the Map tab reads."""
    doc = json.loads((ROOT / "data" / "countries.json").read_text(encoding="utf-8"))
    world = (ROOT / "docs" / "data" / "world.js").read_text(encoding="utf-8")
    iso = set(re.findall(r'"i":"([A-Z]{3})"', world))
    byid = {c["id"]: c for c in chems}
    sched = {}
    for c in chems:
        if c["regime"].startswith("INCB Table"):
            for cas in ([c["cas"]] if c.get("cas") else []) + [o["cas"] for o in c.get("other_cas", [])]:
                sched[cas] = c["id"]
    errors = []

    def resolve_extras(label, extras):
        out, seen = [], set()
        for e in extras:
            e = dict(e)
            if e.get("db"):
                c = byid.get(e["db"])
                if not c:
                    errors.append(f"{label}: unknown db id {e['db']}")
                    continue
                if c["regime"].startswith("INCB Table"):
                    errors.append(f"{label}: {e['db']} is INCB-scheduled, not an extra")
                e.setdefault("n", c["name"])
                if c.get("cas"):
                    e.setdefault("cas", c["cas"])
            if not e.get("n"):
                errors.append(f"{label}: extra without name {e}")
                continue
            cas = e.get("cas")
            if cas:
                if not cas_ok(cas):
                    errors.append(f"{label}: invalid CAS {cas} ({e['n']})")
                if cas in sched:
                    errors.append(f"{label}: CAS {cas} ({e['n']}) is INCB-scheduled ({sched[cas]})")
                if cas in seen:
                    errors.append(f"{label}: duplicate CAS {cas}")
                seen.add(cas)
            out.append({k: e[k] for k in ("n", "cas", "g", "note", "db") if e.get(k)})
        return out

    regimes = {}
    for name, r in doc.get("regimes", {}).items():
        regimes[name] = dict(r, extras=resolve_extras("regime " + name, r.get("extras", [])))

    def build_one(code, v):
        if "regime" in v:
            base = regimes.get(v["regime"])
            if base is None:
                errors.append(f"{code}: unknown regime {v['regime']}")
                return None
            o = dict(base)
            o["via"] = v["regime"]
            if v.get("notes"):
                o["notes"] = (o.get("notes", "") + " " + v["notes"]).strip()
            return o
        o = {"coverage": v.get("coverage"), "basis": v.get("basis", ""),
             "extras": resolve_extras(code, v.get("extras", [])),
             "notes": v.get("notes", ""), "sources": v.get("sources", [])}
        if o["coverage"] not in ("verified", "partial", "none"):
            errors.append(f"{code}: bad coverage {o['coverage']}")
        return o

    out = {}
    for code, v in doc["countries"].items():
        if code not in iso:
            errors.append(f"{code}: not a country on the map")
            continue
        if "inherit" in v:
            continue
        o = build_one(code, v)
        if o:
            out[code] = o
    for code, v in doc["countries"].items():
        if "inherit" in v and code in iso:
            src = out.get(v["inherit"])
            if not src:
                errors.append(f"{code}: inherit target {v['inherit']} missing")
                continue
            o = dict(src)
            o["via"] = v["inherit"]
            if v.get("notes"):
                o["notes"] = v["notes"]
            out[code] = o
    for code, o in out.items():
        o["sources"] = [[x["t"], x["u"]] for x in o.get("sources", [])] if o.get("sources") and isinstance(o["sources"][0], dict) else o.get("sources", [])
    meta = doc.get("meta", {})
    return out, meta, errors


def main():
    chems = json.loads((ROOT / "data" / "chemicals.json").read_text(encoding="utf-8"))
    comps = json.loads((ROOT / "data" / "manufacturers.json").read_text(encoding="utf-8"))["companies"]
    errors = validate(chems, comps)
    if errors:
        print("VALIDATION FAILED:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    t1 = sum(1 for c in chems if c["regime"].startswith("INCB Table I "))
    t2 = sum(1 for c in chems if c["regime"].startswith("INCB Table II"))
    print(f"OK: {len(chems)} chemicals (Table I: {t1}, Table II: {t2}, other: {len(chems)-t1-t2}); {len(comps)} companies")
    countries, cmeta, cerr = build_countries(chems)
    if cerr:
        print("COUNTRY DATA FAILED:")
        for e in cerr:
            print(" -", e)
        sys.exit(1)
    cov = {k: sum(1 for v in countries.values() if v["coverage"] == k) for k in ("verified", "partial")}
    print(f"OK: {len(countries)} map countries with data (verified {cov['verified']}, partial {cov['partial']})")
    if "--check" in sys.argv:
        return

    meta = {
        "redListEdition": "INCB Red List, 23rd edition (July 2025)",
    }
    chem_js = "window.CHEMICALS=" + json.dumps(chems, ensure_ascii=False) + ";window.META=" + json.dumps(meta) + ";"
    comp_js = "window.COMPANIES=" + json.dumps(comps, ensure_ascii=False) + ";"
    cty_js = "window.COUNTRY_META=" + json.dumps(cmeta, ensure_ascii=False) + ";window.COUNTRIES=" + json.dumps(countries, ensure_ascii=False, separators=(",", ":")) + ";"
    out = ROOT / "docs" / "data"
    out.mkdir(parents=True, exist_ok=True)
    (out / "chemicals.js").write_text(chem_js, encoding="utf-8")
    (out / "manufacturers.js").write_text(comp_js, encoding="utf-8")
    (out / "countries.js").write_text(cty_js, encoding="utf-8")

    import hashlib
    h = hashlib.sha1()
    for f in ["styles.css", "app.js", "data/chemicals.js", "data/manufacturers.js", "data/countries.js", "data/world.js", "logo.png"]:
        h.update((ROOT / "docs" / f).read_bytes())
    ver = h.hexdigest()[:8]
    idx = ROOT / "docs" / "index.html"
    src = idx.read_text(encoding="utf-8")
    src = re.sub(r'(href="styles\.css|src="app\.js|src="data/chemicals\.js|src="data/manufacturers\.js|src="data/countries\.js|src="data/world\.js|src="logo\.png)(\?v=\w+)?"', lambda m: m.group(1) + "?v=" + ver + '"', src)
    idx.write_text(src, encoding="utf-8")
    html = src
    css = (ROOT / "docs" / "styles.css").read_text(encoding="utf-8")
    app = (ROOT / "docs" / "app.js").read_text(encoding="utf-8")
    html = re.sub(r'<link rel="stylesheet" href="styles\.css\?v=\w+">', lambda m: f"<style>\n{css}\n</style>", html)
    html = re.sub(r'<script src="data/chemicals\.js\?v=\w+"></script>', lambda m: f"<script>\n{chem_js}\n</script>", html)
    html = re.sub(r'<script src="data/manufacturers\.js\?v=\w+"></script>', lambda m: f"<script>\n{comp_js}\n</script>", html)
    world_js = (ROOT / "docs" / "data" / "world.js").read_text(encoding="utf-8")
    html = re.sub(r'<script src="data/countries\.js\?v=\w+"></script>', lambda m: f"<script>\n{cty_js}\n</script>", html)
    html = re.sub(r'<script src="data/world\.js\?v=\w+"></script>', lambda m: f"<script>\n{world_js}\n</script>", html)
    html = re.sub(r'<script src="app\.js\?v=\w+"></script>', lambda m: f"<script>\n{app}\n</script>", html)
    import base64
    logo = base64.b64encode((ROOT / "docs" / "logo.png").read_bytes()).decode()
    html = re.sub(r'src="logo\.png\?v=\w+"', lambda m: 'src="data:image/png;base64,' + logo + '"', html)
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    (dist / "precursor-chemical-id.html").write_text(html, encoding="utf-8")
    print("Built docs/data/*.js and dist/precursor-chemical-id.html")


if __name__ == "__main__":
    main()
