#!/usr/bin/env python3
"""Generate scripts/seed_demo.sql: fictional demo data for all 15 Parakan Kauman
posyandu under the demo puskesmas. Everything is flagged is_demo=true so the admin
"Hapus data uji coba" button removes it all. Pins are APPROXIMATE demo locations
around Parakan Kauman village - not surveyed coordinates.
Deterministic (fixed seed). Re-runnable: deletes rows it previously created."""
import json, math, random, uuid

random.seed(20261019)
who = json.load(open("src/lib/who.json"))
TODAY = (2026, 10, 19)
ADMIN = "fc1cde53-2303-4285-aea9-71f59f2af719"
PK = "5f04d88d-2a0c-4b9a-987b-1638a5cf3492"  # demo puskesmas
CENTER = (-7.2850, 110.1050)  # approx village center, Parakan Kauman, Temanggung

POSYANDU = [
    ("Candrarini 1", "Tejosari/I"), ("Candrarini 2", "Sidorejo/II"), ("Candrarini 3", "Jetis Lor/III"),
    ("Candrarini 4", "Jetis Kidul/IV"), ("Candrarini 5", "Karangsari/V"), ("Candrarini 6", "Karangsari/VI"),
    ("Candrarini 7", "Besaran/VII"), ("Candrarini 89", "Jogomertan/VIII dan IX"), ("Candrarini 10", "Klewogan/X"),
    ("Candrarini 11", "Karangtengah/XI"), ("Candrarini 12", "Jetis Kauman/XII"), ("Candrarini 13", "Coyudan Selatan/XIII"),
    ("Candrarini 14", "Coyudan Utara/XIV"), ("Candrarini 15", "Sekrikil/XV"), ("Candrarini 16", "Situk/XVI"),
]

def table_row(key, x):
    t = who[key]
    best = min(t, key=lambda r: abs(r[0] - x))
    return best

def val(key, x, z):
    _, L, M, S = table_row(key, x)
    return M * math.exp(S * z) if L == 0 else M * (1 + L * S * z) ** (1 / L)

def zscore(key, x, y):
    _, L, M, S = table_row(key, x)
    z = (math.log(y / M) / S) if L == 0 else ((y / M) ** L - 1) / (L * S)
    return max(-6, min(6, z))

def months_between(y1, m1, y2, m2):
    return (y2 - y1) * 12 + (m2 - m1)

VACC = [("hb0",0),("bcg",1),("polio1",1),("dpt1",2),("polio2",2),("pcv1",2),("rota1",2),
        ("dpt2",3),("polio3",3),("pcv2",3),("rota2",3),("dpt3",4),("polio4",4),("ipv1",4),
        ("rota3",4),("mr1",9),("ipv2",9),("pcv3",12)]

# Per-posyandu archetype mixes so the map shows every prevalence band:
# ~5% (green), ~12% (yellow), ~25% (orange), ~38% (red), ~50% (dark red)
PROFILES = [
    ["normal"]*7 + ["pendek"],                                       # ~8%  -> green
    ["normal"]*6 + ["pendek", "pendek"],                             # ~17% -> yellow
    ["normal"]*4 + ["pendek", "pendek", "sangat_pendek", "overdue"], # ~27% -> orange
    ["normal"]*3 + ["pendek", "pendek", "sangat_pendek", "falling", "overdue"],  # ~36% -> red
    ["normal"]*4 + ["pendek", "sangat_pendek", "falling", "overdue"],            # ~27% -> orange
]

# Fictional common Indonesian names (random combinations, not real identifiable people)
BOY = ["Aditya","Bima","Rafi","Dimas","Farhan","Galih","Rizky","Fajar","Ilham","Danu","Arka","Banyu","Satria","Yoga","Aldo","Raka","Naufal","Zidan","Bagas","Daffa","Haidar","Kevin","Rehan","Pradana","Gibran","Darren","Fathan"]
GIRL = ["Ayu","Kirana","Nadia","Putri","Zahra","Aisyah","Dewi","Ratri","Sinta","Wulan","Cahaya","Laras","Naura","Safa","Kayla","Anisa","Bella","Citra","Fira","Gita","Hana","Indah","Meisya","Nayla","Raisa","Salma","Tania"]
SECOND = ["Pratama","Prasetyo","Saputra","Wijaya","Nugraha","Firmansyah","Hidayat","Kurniawan","Santoso","Ramadhan","Akbar","Maulana","Setyawan","Anggraini","Lestari","Puspitasari","Rahmawati","Wulandari","Ningsih","Safitri","Maharani","Oktaviani","Permatasari"]
ADULT = ["Joko","Bambang","Agus","Slamet","Dedi","Eko","Herman","Wahyu","Supriyanto","Rudi","Siti","Sri","Endang","Rina","Yuni","Ratna","Sutrisno","Painem","Legiman","Sarwono","Ngatiyem","Warsito","Sumarno","Karsini","Lasmi","Puji","Teguh","Ambar"]

children, measurements, immunizations = [], [], []
n = 0
for pi, (pname, dusun) in enumerate(POSYANDU):
    for ci in range(12):
        n += 1
        prof = PROFILES[pi % len(PROFILES)]
        arch = prof[(ci + pi) % len(prof)]
        sex = "L" if (n % 2 == 1) else "P"
        age_now = random.choice([4, 7, 11, 14, 18, 22, 26, 31, 36, 42, 48, 54])
        by = TODAY[0] - age_now // 12
        bm = TODAY[1] - age_now % 12
        if bm <= 0: by -= 1; bm += 12
        bd = random.randint(2, 25)
        birth = f"{by:04d}-{bm:02d}-{bd:02d}"
        cid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"sindaparka-demo-child-{n}"))
        cname = f"{random.choice(BOY if sex == 'L' else GIRL)} {random.choice(SECOND)}"
        gname = f"{random.choice(ADULT)} {random.choice(SECOND)}"
        children.append((cid, pname, sex, birth, arch, cname, gname))

        # z trajectory
        if arch == "normal": base = random.uniform(-0.8, 0.5); drift = 0
        elif arch == "pendek": base = random.uniform(-2.5, -2.1); drift = 0
        elif arch == "sangat_pendek": base = random.uniform(-3.4, -3.05); drift = 0
        elif arch == "falling": base = -1.0; drift = -0.45  # per recent visit
        else: base = random.uniform(-1.2, 0.0); drift = 0  # overdue
        wbase = base + random.uniform(-0.4, 0.6)

        hist = []
        for k in range(7, -1, -1):  # last 8 monthly visits
            my, mm = TODAY[0], TODAY[1] - k
            if mm <= 0: my -= 1; mm += 12
            age_m = months_between(by, bm, my, mm)
            if age_m < 0 or age_m > 60: continue
            if arch == "overdue" and (my, mm) > (2026, 8): continue  # last visit Aug 2026
            zh = base + drift * max(0, 4 - k) + random.uniform(-0.08, 0.08)
            zw = wbase + drift * max(0, 4 - k) * 0.8 + random.uniform(-0.08, 0.08)
            h = round(val(f"hfa_{sex}", age_m, zh) * 2) / 2
            w = round(val(f"wfa_{sex}", age_m, zw) * 10) / 10
            if not (40 <= h <= 125 and 1.5 <= w <= 30): continue
            day = min(28, 3 + pi)  # posyandu visit day
            if (my, mm) == (by, bm): day = max(day, bd)  # not before the birth date
            lying = age_m <= 24
            hist.append((f"{my:04d}-{mm:02d}-{day:02d}", age_m, w, h, lying))
        for date, age_m, w, h, lying in hist:
            mid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"sindaparka-demo-meas-{cid}-{date}"))
            zh = zscore(f"hfa_{sex}", age_m, h)
            zw = zscore(f"wfa_{sex}", age_m, w)
            xkey = ("wfl_" if age_m <= 24 else "wfh_") + sex
            zwfh = zscore(xkey, round(h * 2) / 2, w)
            bmi = w / ((h / 100) ** 2)
            zbfa = zscore(f"bfa_{sex}", age_m, bmi)
            measurements.append((mid, cid, date, w, h, lying, round(zh,2), round(zw,2), round(zwfh,2), round(zbfa,2)))
        # immunizations due by current age
        for code, dm in VACC:
            if dm > age_now: continue
            if arch != "normal" and random.random() < 0.15: continue  # some missed doses
            gy, gm = by, bm + dm
            if gm > 12: gy += 1; gm -= 12
            gd = min(bd, 28)
            if (gy, gm, gd) > TODAY: continue  # not in the future
            given = f"{gy:04d}-{gm:02d}-{gd:02d}"
            iid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"sindaparka-demo-imm-{cid}-{code}"))
            immunizations.append((iid, cid, code, given))

lines = []
lines.append("begin;")
DEMO_KIDS = "(select c.id from public.children c left join public.posyandu p on c.posyandu_id = p.id where c.is_demo and (p.puskesmas_id = '%s' or c.name like 'Anak Uji %%'))" % PK
lines.append(f"delete from public.immunizations where child_id in {DEMO_KIDS};")
lines.append(f"delete from public.measurements where child_id in {DEMO_KIDS};")
lines.append(f"delete from public.children where id in {DEMO_KIDS};")
lines.append(f"delete from public.posyandu where is_demo and puskesmas_id = '{PK}' and name like 'Candrarini %';")
for pi, (pname, dusun) in enumerate(POSYANDU):
    pid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"sindaparka-demo-posyandu-{pname}"))
    lat = round(CENTER[0] + ((pi % 4) - 1.5) * 0.004 + ((pi * 7) % 3 - 1) * 0.0015, 6)
    lng = round(CENTER[1] + ((pi // 4) - 1.5) * 0.0045 + ((pi * 5) % 3 - 1) * 0.0015, 6)
    lines.append(f"insert into public.posyandu (id, puskesmas_id, name, dusun, latitude, longitude, visit_day, is_demo) values "
                 f"('{pid}', '{PK}', '{pname}', '{dusun}', {lat}, {lng}, {3 + (pi % 25)}, true);")
    for (cid, cp, sex, birth, arch, cname, gname) in [c for c in children if c[1] == pname]:
        lines.append(f"insert into public.children (id, posyandu_id, name, sex, birth_date, guardian_name, consent_at, created_by, is_demo) values "
                     f"('{cid}', '{pid}', '{cname}', '{sex}', '{birth}', "
                     f"'{gname}', '{birth}', '{ADMIN}', true);")
def batch(table, cols, rows, per=100):
    for i in range(0, len(rows), per):
        vals = ",\n".join("(" + ", ".join(r) + ")" for r in rows[i:i+per])
        lines.append(f"insert into public.{table} ({cols}) values\n{vals};")

batch("measurements", "id, child_id, measured_on, weight_kg, length_height_cm, lying, z_hfa, z_wfa, z_wfh, z_bfa, created_by, is_demo",
      [[f"'{mid}'", f"'{cid}'", f"'{date}'", str(w), str(h), str(lying).lower(), str(zh), str(zw), str(zwfh), str(zbfa), f"'{ADMIN}'", "true"]
       for (mid, cid, date, w, h, lying, zh, zw, zwfh, zbfa) in measurements])
batch("immunizations", "id, child_id, vaccine, given_on, created_by",
      [[f"'{iid}'", f"'{cid}'", f"'{code}'", f"'{given}'", f"'{ADMIN}'"] for (iid, cid, code, given) in immunizations])
lines.append("commit;")
open("scripts/seed_demo.sql", "w").write("\n".join(lines) + "\n")
print(f"children={len(children)} measurements={len(measurements)} immunizations={len(immunizations)} posyandu=15")
from collections import Counter
print(Counter(c[4] for c in children))
