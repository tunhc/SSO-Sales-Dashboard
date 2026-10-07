"""
SSO Sales Dashboard — data loader (Supabase project jrajadhmnvvmytmufgjz).

Reads:
  --target    SSO_US_<Mon>_Target_Sales.html   SKU list, team, Final target (units/GMV),
                                                Bottom Up Ads/Promo, cost stack (CM3), stock, labels
  --pic-dinh  PIC team anh Dinh.xlsx           PIC / Leader / SEM PIC / product lines, Team Đồng Dinh
  --followup  Yes4all follow up.xlsx           PIC / product lines / stock, Team Cẩm Tú (sheet Tracking_0925)
  --daily     *daily.xlsx (one or more)        SKU x day sales history

Writes (to --out, never commit: real sales figures):
  01_skus.sql, 02_targets_<yyyy_mm>.sql, 03_demand.sql, 10_sales_NN.sql (≤ --max-part-kb each)
and, when SUPABASE_SERVICE_KEY is set in the environment, also upserts everything
straight into Supabase through the REST API (service_role key: keep it out of git).

Usage:
  python ingest_sso.py --out ./sql_out --target SSO_US_Oct_Target_Sales.html \
      --pic-dinh "PIC team anh Dinh.xlsx" --followup "Yes4all follow up.xlsx" \
      --daily "Yes4All data tusteam 2023-2024 daily.xlsx" "Yes4All data tusteam 2025 daily.xlsx"
  # optional direct load:
  SUPABASE_SERVICE_KEY=... python ingest_sso.py ... --push
"""
import argparse
import datetime as dt
import json
import math
import os
import re
import sys
import urllib.request
import warnings

import openpyxl

warnings.filterwarnings("ignore")
SUPABASE_URL = "https://jrajadhmnvvmytmufgjz.supabase.co"
CM3_FIELDS_MKT = {"Promo_4pct", "Ads_7pct", "Amex_Kickback"}  # replaced by actual Ads/Promo in the dashboard
ADS_NET = 0.985  # Ads less 1.5% Amex kickback
TEAM_LEADER = {"Team Cẩm Tú": "Quế Anh"}      # one leader for the whole team when the PIC file has none
LEADER_ALIAS = {"Tú ASC": "Quế Anh"}           # renamed leaders
NO_LEADER_TEAMS = {"Spreetail"}                # partner-managed, no leader
PIC_OVERRIDE = {"5DEI": "Nhi Diệp", "JUVN": "Nhi Diệp", "VU7D": "Nhi Diệp"}  # not in any PIC file (confirmed 07/10)


def short_name(v):
    """People are shown by their first two words (e.g. 'Trương Mai Thanh Tâm' -> 'Trương Mai'); '0' / blank -> None."""
    s = txt(v)
    if not s or s == "0":
        return None
    return " ".join(s.split()[:2])


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def txt(v):
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def num(v, default=0.0):
    try:
        f = float(v)
        return default if math.isnan(f) or math.isinf(f) else f
    except (TypeError, ValueError):
        return default


def lit(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        return str(v)
    if isinstance(v, float):
        if math.isnan(v) or math.isinf(v):
            return "null"
        r = round(v, 4)
        return str(int(r)) if r == int(r) else repr(r)
    if isinstance(v, (dt.date, dt.datetime)):
        return "'" + v.strftime("%Y-%m-%d") + "'"
    return "'" + str(v).replace("'", "''") + "'"


def upsert_sql(table, cols, rows, conflict):
    upd = ", ".join(f"{c} = excluded.{c}" for c in cols if c not in conflict)
    out = []
    for i in range(0, len(rows), 500):
        vals = ",\n".join("(" + ",".join(lit(r.get(c)) for c in cols) + ")" for r in rows[i:i + 500])
        out.append(f"insert into {table} ({', '.join(cols)}) values\n{vals}\non conflict ({', '.join(conflict)}) do update set {upd};")
    return "\n\n".join(out)


def write(out, name, body, header=""):
    path = os.path.join(out, name)
    with open(path, "w", encoding="utf-8") as f:
        f.write((header + "\n" if header else "") + body + "\n")
    print(f"  {name}: {os.path.getsize(path) / 1024:,.0f} KB")
    return path


def sheet_rows(path, sheet=None, header_row=1):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb[sheet] if sheet else wb.worksheets[0]
    it = ws.iter_rows(values_only=True)
    for _ in range(header_row - 1):
        next(it)
    head = [txt(h) for h in next(it)]
    for r in it:
        if r and any(v is not None for v in r):
            yield {h: (r[i] if i < len(r) else None) for i, h in enumerate(head) if h}


def norm_key(h):
    return re.sub(r"\s+", " ", str(h or "")).strip().lower()


def pick(row, *names):
    keys = {norm_key(k): k for k in row}
    for n in names:
        k = keys.get(norm_key(n))
        if k is not None and txt(row[k]) is not None:
            return row[k]
    return None


# ---------------------------------------------------------------------------
# 1) target HTML
# ---------------------------------------------------------------------------
def load_target(path):
    h = open(path, encoding="utf-8").read()
    p = json.loads(re.search(r'<script id="payload" type="application/json">(.*?)</script>', h, re.S).group(1))
    m = re.search(r'<script id="cm3-model" type="application/json">(.*?)</script>', h, re.S)
    cm3 = json.loads(m.group(1)) if m else {"fields": [], "costs": {}}
    return p, cm3


def cm3_base(sku, channel, cm3):
    """CM3 $/unit before Ads/Promo from the canonical cost stack (only when the cost lane = SKU channel)."""
    c = cm3["costs"].get(sku)
    if not c or c.get("lane") != channel or not (num(c.get("rev")) > 0):
        return None, None
    base = num(c["rev"]) + sum(num(v) for f, v in zip(cm3["fields"], c["costs"]) if f not in CM3_FIELDS_MKT)
    return round(base, 4), c["lane"]


# ---------------------------------------------------------------------------
# 2) PIC files
# ---------------------------------------------------------------------------
def load_pic_dinh(path):
    out = {}
    for r in sheet_rows(path):
        sku = txt(pick(r, "SKUs", "SKU"))
        if not sku:
            continue
        out[sku] = {
            "pic": txt(pick(r, "PIC New (By Prod Line)", "PIC New")), "leader": txt(pick(r, "Leader New (By Prod Line)", "Leader New")),
            "sem_pic": txt(pick(r, "SEM PIC")), "asin": txt(pick(r, "Main Asin")), "product_name": txt(pick(r, "Product name")),
            "sub_pl": txt(pick(r, "Old Product Line")), "main_pl": txt(pick(r, "New Product line")), "category": txt(pick(r, "Super Category")),
            "selling_type": txt(pick(r, "Selling types")), "lifecycle": txt(pick(r, "SKU Life Cycle")),
        }
    return out


def load_followup(path, sheet):
    out = {}
    for r in sheet_rows(path, sheet, header_row=4):
        sku = txt(pick(r, "SKU"))
        if not sku:
            continue
        out[sku] = {
            "pic": txt(pick(r, "PIC")), "asin": txt(pick(r, "ASIN")), "product_name": txt(pick(r, "Product Name")),
            "main_pl": txt(pick(r, "New Product line", "Main PL")), "sub_pl": txt(pick(r, "Old Product Line", "Sub-PL")),
            "category": txt(pick(r, "Category")), "lifecycle": txt(pick(r, "Lifecycle")), "selling_type": txt(pick(r, "Selling type")),
            "asin_status": txt(pick(r, "ASIN status")),
            "salable_y4a": num(pick(r, "SALABLE Y4A")), "salable_amz": num(pick(r, "SALABLE AMZ")),
        }
    return out


def load_inventory(path):
    """USA Inventory export, sheet 'report': row 2 = week start of each incoming column,
    row 4 = header. Y4A stock is per SKU (repeated on every ASIN row), AMZ stock is per ASIN.
    The first half of the incoming_* columns is Y4A, the second half AMZ."""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    rows = list(wb["report"].iter_rows(values_only=True))
    week_row, head = rows[1], [txt(h) for h in rows[3]]
    snap = week_row[5] if len(week_row) > 5 else None
    snapshot = snap.date() if isinstance(snap, dt.datetime) else dt.date.today()
    idx = {h: i for i, h in enumerate(head) if h and not h.startswith("incoming_")}
    inc_cols = [i for i, h in enumerate(head) if h and h.startswith("incoming_")]
    half = len(inc_cols) // 2
    y4a_cols, amz_cols = inc_cols[:half], inc_cols[half:]
    wk = lambda c: week_row[c].date() if isinstance(week_row[c], dt.datetime) else None
    stock, incoming = {}, {}
    for r in rows[4:]:
        sku = txt(r[idx["SKU"]]) if r else None
        if not sku:
            continue
        rec = stock.get(sku)
        if rec is None:  # first ASIN row of the SKU carries the Y4A numbers
            rec = stock[sku] = {"salable_y4a": num(r[idx["SALABLE Y4A"]]), "salable_amz": 0.0, "asin_status": None}
            for c in y4a_cols:
                if num(r[c]) and wk(c):
                    incoming.setdefault((sku, wk(c)), [0.0, 0.0])[0] += num(r[c])
        rec["salable_amz"] += num(r[idx["SALABLE AMZ"]])
        st = txt(r[idx["ASIN STATUS"]])
        if st == "active" or rec["asin_status"] is None:
            rec["asin_status"] = st
        for c in amz_cols:
            if num(r[c]) and wk(c):
                incoming.setdefault((sku, wk(c)), [0.0, 0.0])[1] += num(r[c])
    inc_rows = [{"sku": s, "week_start": w.isoformat(), "qty_y4a": q[0], "qty_amz": q[1], "snapshot_date": snapshot.isoformat()}
                for (s, w), q in incoming.items()]
    return snapshot, stock, inc_rows


# ---------------------------------------------------------------------------
# 3) daily sales
# ---------------------------------------------------------------------------
SALES_COLS = ["sku", "date", "units", "gmv", "ads", "promo", "ads_gmv", "ads_units", "total_clicks", "total_impressions",
              "glance_views", "ordered_revenue", "ordered_nmv", "sp_spend", "sb_spend", "sd_spend", "dsp_spend", "aff_spend",
              "promo_deal", "promo_coupon", "promo_discount", "category", "source_file"]


def load_daily(paths):
    agg = {}
    for p in paths:
        src = os.path.basename(p)
        n = 0
        for r in sheet_rows(p):
            d, sku = r.get("Day"), txt(r.get("SKU"))
            if not sku or not isinstance(d, (dt.datetime, dt.date)):
                continue
            if txt(r.get("Country")) not in (None, "USA"):
                continue
            g = lambda c: num(r.get(c))
            day = d.date() if isinstance(d, dt.datetime) else d
            x = agg.get((sku, day))
            if x is None:
                x = agg[(sku, day)] = {c: 0.0 for c in SALES_COLS[2:-2]}
                x.update(sku=sku, date=day, category=txt(r.get("product_line")), source_file=src)
            add = {
                "units": g("Ordered_units"), "gmv": g("Ordered GMV"), "ads": g("Total ADS"), "promo": g("Total Promo"),
                "ads_gmv": g("Sb_ordered_nmv") + g("Sd_ordered_nmv") + g("Sp_ordered_nmv"),
                "ads_units": g("Sb_ordered_units") + g("Sd_ordered_units") + g("Sp_ordered_units"),
                "total_clicks": g("Sb_clicks") + g("Sd_clicks") + g("Sp_clicks"),
                "total_impressions": g("Sb_impressions") + g("Sd_impressions") + g("Sp_impressions"),
                "glance_views": g("Glance_views"), "ordered_revenue": g("Ordered_revenue"), "ordered_nmv": g("Ordered_nmv"),
                "sp_spend": g("sp_spend"), "sb_spend": g("sb_spend"), "sd_spend": g("sd_spend"), "dsp_spend": g("dsp_spend"),
                "aff_spend": g("aff_spend"), "promo_deal": g("Best_deal_spend") + g("Lightning_deal_spend"),
                "promo_coupon": g("Coupon_spend"), "promo_discount": g("Price_discount_spend") + g("VM_promo_spend"),
            }
            for k, v in add.items():
                x[k] += v
            n += 1
        print(f"  {src}: {n:,} rows")
    rows = sorted(agg.values(), key=lambda r: (r["date"], r["sku"]))
    for r in rows:
        for c in SALES_COLS[2:-2]:
            r[c] = round(r[c], 2)
    return rows


# ---------------------------------------------------------------------------
# build
# ---------------------------------------------------------------------------
SKU_COLS = ["sku", "product_name", "asin", "team", "leader", "pic", "sem_pic", "main_pl", "sub_pl", "category", "lifecycle",
            "selling_type", "asin_status", "salable_y4a", "salable_amz", "inventory_as_of", "channel", "portfolio", "moc",
            "moc_band", "rrp", "normal_asp", "block_ads", "labels", "cm3_unit_base", "cm3_lane", "cm3_source"]
TGT_COLS = ["sku", "month", "target_units", "target_gmv", "ads_target", "promo_target", "cm3_target", "stretch_units", "stretch_gmv", "source"]


def build(a):
    print("target html")
    p, cm3 = load_target(a.target)
    month = p["octTargetMeta"]["month"] if "octTargetMeta" in p else p["months"][0]
    month_iso = month + "-01"
    bu = (p.get("bottomUp") or {}).get("records") or {}
    pic_d = load_pic_dinh(a.pic_dinh) if a.pic_dinh else {}
    fol = load_followup(a.followup, a.tracking_sheet) if a.followup else {}
    print(f"  {len(p['rows'])} target SKUs · Đồng Dinh PIC file {len(pic_d)} · follow up {len(fol)}")
    cm3_src = f"{cm3.get('source')} · as of {cm3.get('asof')}"

    skus, targets, demand = {}, [], []
    for r in p["rows"]:
        sku = r["s"]
        team = r.get("team")
        own = pic_d.get(sku) if team == "Team Đồng Dinh" else fol.get(sku) if team == "Team Cẩm Tú" else None
        own = own or pic_d.get(sku) or fol.get(sku) or {}
        price = (r.get("octTarget") or {}).get("price") or {}
        pools = r.get("stockPools") or {}
        base, lane = cm3_base(sku, r.get("ch"), cm3)
        if r.get("ch", "").startswith("SPT"):
            lane = "SPT"
        rec = {
            "sku": sku, "product_name": own.get("product_name") or r.get("n"), "asin": own.get("asin") or ((r.get("asins") or [None])[0]),
            "team": team, "leader": own.get("leader"), "pic": own.get("pic"), "sem_pic": own.get("sem_pic"),
            "main_pl": own.get("main_pl") or r.get("pl"), "sub_pl": own.get("sub_pl"), "category": own.get("category") or r.get("category"),
            "lifecycle": own.get("lifecycle"), "selling_type": own.get("selling_type"), "asin_status": own.get("asin_status"),
            "salable_y4a": num(pools.get("y4a")) if pools.get("y4a") is not None else own.get("salable_y4a", 0.0),
            "salable_amz": num(pools.get("amz")) if pools.get("amz") is not None else own.get("salable_amz", 0.0),
            "inventory_as_of": pools.get("avcDate") or r.get("stockDate"), "channel": r.get("ch"), "portfolio": r.get("pf"),
            "moc": r.get("moc"), "moc_band": r.get("band"), "rrp": num(price.get("latestRRP"), None), "normal_asp": num(price.get("normalASP"), None),
            "block_ads": (r.get("blockAds") or {}).get("status"), "labels": ", ".join(r.get("labels") or []) or None,
            "cm3_unit_base": base, "cm3_lane": lane if base is not None or lane == "SPT" else None,
            "cm3_source": cm3_src if base is not None else None,
        }
        if team == "Spreetail" and not rec["pic"]:
            rec["pic"] = "Spreetail"
        skus[sku] = rec

        st = r.get("octStretch") or {}
        b = ((bu.get(sku) or {}).get("months") or {}).get(month) or {}
        units = num(st.get("finalUnits"), None)
        units = units if units is not None else num(b.get("units"), 0.0)
        gmv = num(st.get("finalGMV"), None)
        gmv = gmv if gmv is not None else num(b.get("gmv"), 0.0)
        ads, promo = num(b.get("ads")), num(b.get("promo"))
        if units or gmv or ads or promo:
            targets.append({"sku": sku, "month": month_iso, "target_units": round(units, 2), "target_gmv": round(gmv, 2),
                            "ads_target": round(ads, 2), "promo_target": round(promo, 2),
                            "cm3_target": round(units * base - (0 if lane == "SPT" else ads * ADS_NET + promo), 2) if base is not None else None,
                            "stretch_units": num(st.get("units"), None), "stretch_gmv": num(st.get("gmv"), None),
                            "source": os.path.basename(a.target)})
        for mo, x in ((bu.get(sku) or {}).get("months") or {}).items():
            if mo > month and (x.get("units") or x.get("gmv")):
                demand.append({"sku": sku, "month": mo + "-01", "units": num(x.get("units")), "gmv": num(x.get("gmv")), "source": x.get("source")})

    # Team Cẩm Tú SKUs that are in the follow-up file but not in the target file
    for sku, own in fol.items():
        if sku not in skus:
            skus[sku] = {**{c: None for c in SKU_COLS}, **own, "sku": sku, "team": "Team Cẩm Tú"}
    for sku, own in pic_d.items():
        if sku not in skus:
            skus[sku] = {**{c: None for c in SKU_COLS}, **own, "sku": sku, "team": "Team Đồng Dinh"}

    for s in skus.values():
        s["pic"], s["sem_pic"] = short_name(s.get("pic")), short_name(s.get("sem_pic"))
        if not s["pic"] and s["sku"] in fol:  # e.g. PIC "0" in the Đồng Dinh file but owned in the follow-up file
            s["pic"] = short_name(fol[s["sku"]].get("pic"))
        s["pic"] = PIC_OVERRIDE.get(s["sku"], s["pic"])
        leader = short_name(s.get("leader"))
        leader = LEADER_ALIAS.get(leader, leader)
        if not leader and s.get("team") in TEAM_LEADER:
            leader = TEAM_LEADER[s["team"]]
        s["leader"] = None if s.get("team") in NO_LEADER_TEAMS else leader

    incoming = []
    if a.inventory:
        print("inventory")
        snapshot, stock, incoming = load_inventory(a.inventory)
        hit = 0
        for sku, v in stock.items():
            if sku in skus:
                skus[sku].update(salable_y4a=v["salable_y4a"], salable_amz=v["salable_amz"], inventory_as_of=snapshot.isoformat(),
                                 asin_status=v["asin_status"] or skus[sku].get("asin_status"))
                hit += 1
        incoming = [r for r in incoming if r["sku"] in skus]
        print(f"  snapshot {snapshot} · stock for {hit} SKUs · {len(incoming)} incoming rows")

    sales = []
    if a.daily:
        print("daily sales")
        sales = load_daily(a.daily)
        for s in {r["sku"] for r in sales} - set(skus):
            cat = next(r["category"] for r in sales if r["sku"] == s)
            skus[s] = {**{c: None for c in SKU_COLS}, "sku": s, "main_pl": cat}
    return month_iso, list(skus.values()), targets, demand, sales, incoming


# ---------------------------------------------------------------------------
# outputs
# ---------------------------------------------------------------------------
def push(table, rows, conflict, key, batch=2000):
    url = f"{SUPABASE_URL}/rest/v1/{table}?on_conflict={','.join(conflict)}"
    headers = {"apikey": key, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"}
    if key.startswith("eyJ"):  # legacy service_role JWT; new sb_secret_ keys go in apikey only
        headers["Authorization"] = "Bearer " + key
    for i in range(0, len(rows), batch):
        body = json.dumps(rows[i:i + batch], default=str).encode()
        req = urllib.request.Request(url, data=body, method="POST", headers=headers)
        try:
            urllib.request.urlopen(req, timeout=120).read()
        except urllib.error.HTTPError as e:
            sys.exit(f"\n{table}: HTTP {e.code} {e.reason}\n{e.read().decode(errors='replace')[:800]}\n"
                     f"(key starts with '{key[:8]}…', length {len(key)})")
        print(f"  {table}: {min(i + batch, len(rows)):,}/{len(rows):,}", end="\r")
    print()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--target", required=True)
    ap.add_argument("--pic-dinh")
    ap.add_argument("--followup")
    ap.add_argument("--tracking-sheet", default="Tracking_0925")
    ap.add_argument("--daily", nargs="*")
    ap.add_argument("--inventory", help="Yes4All US Inventory <date>.xlsx (sheet report)")
    ap.add_argument("--max-part-kb", type=int, default=900)
    ap.add_argument("--push", action="store_true", help="upsert into Supabase (needs SUPABASE_SERVICE_KEY)")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    month_iso, skus, targets, demand, sales, incoming = build(a)
    by_team = {}
    for s in skus:
        by_team[s.get("team")] = by_team.get(s.get("team"), 0) + 1
    print(f"SKUs {len(skus)} {by_team} · target rows {len(targets)} · demand rows {len(demand)} · sales rows {len(sales):,}")

    for s in skus:
        for c in SKU_COLS:
            s.setdefault(c, None)
    write(a.out, "01_skus.sql", upsert_sql("skus", SKU_COLS, skus, ["sku"]))
    tot = {k: round(sum(t[k] for t in targets)) for k in ("target_units", "target_gmv", "ads_target", "promo_target")}
    write(a.out, f"02_targets_{month_iso[:7].replace('-', '_')}.sql", upsert_sql("targets_monthly", TGT_COLS, targets, ["sku", "month"]),
          header=f"-- {len(targets)} SKUs · totals {tot}")
    if incoming:
        snap = incoming[0]["snapshot_date"]
        write(a.out, "04_incoming.sql", f"delete from incoming_weekly where snapshot_date = '{snap}';\n\n"
              + upsert_sql("incoming_weekly", ["sku", "week_start", "qty_y4a", "qty_amz", "snapshot_date"], incoming, ["sku", "week_start", "snapshot_date"]))
    write(a.out, "03_demand.sql", upsert_sql("demand_forecast_monthly", ["sku", "month", "units", "gmv", "source"], demand, ["sku", "month"]))
    if sales:
        part, size, n = [], 0, 1
        for r in sales:
            part.append(r)
            size += 190
            if size >= a.max_part_kb * 1000:
                write(a.out, f"10_sales_{n:02d}.sql", upsert_sql("sales_daily", SALES_COLS, part, ["sku", "date"]), header=f"-- {part[0]['date']} → {part[-1]['date']}")
                part, size, n = [], 0, n + 1
        if part:
            write(a.out, f"10_sales_{n:02d}.sql", upsert_sql("sales_daily", SALES_COLS, part, ["sku", "date"]), header=f"-- {part[0]['date']} → {part[-1]['date']}")

    if a.push:
        key = re.sub(r"[\s\"']", "", os.environ.get("SUPABASE_SERVICE_KEY") or "")  # drop stray spaces / quotes from `set`
        if key.startswith("eyJ"):
            try:  # the JWT payload says which role this key is
                seg = key.split(".")[1]
                role = json.loads(__import__("base64").urlsafe_b64decode(seg + "=" * (-len(seg) % 4))).get("role")
            except Exception:
                role = None
            if role and role != "service_role":
                sys.exit(f"This key is the '{role}' key. Use the service_role (secret) key from Settings -> API Keys.")
        if not key:
            sys.exit("--push needs SUPABASE_SERVICE_KEY in the environment")
        print("push to Supabase")
        push("skus", skus, ["sku"], key)
        push("targets_monthly", targets, ["sku", "month"], key)
        push("demand_forecast_monthly", demand, ["sku", "month"], key)
        if incoming:
            push("incoming_weekly", incoming, ["sku", "week_start", "snapshot_date"], key)
        if sales:
            push("sales_daily", [{**r, "date": r["date"].isoformat()} for r in sales], ["sku", "date"], key)
    print("done")


if __name__ == "__main__":
    main()
