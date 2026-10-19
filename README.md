# SINDAPARKA

[![CI](https://github.com/hyderoo/SINDAPARKA/actions/workflows/ci.yml/badge.svg)](https://github.com/hyderoo/SINDAPARKA/actions/workflows/ci.yml) · [Latest Playwright report](https://hyderoo.github.io/SINDAPARKA/)

Growth monitoring for posyandu cadres. Record a child's weight and height, get WHO z-scores and a plain-language result straight away, and follow each child's curve over time.

SINDAPARKA started as a PHP/MySQL stunting diagnosis system for posyandu cadres in Parakan Kauman, Temanggung, a team project in collaboration with BKKBN. The original code is kept on the [`legacy-php`](../../tree/legacy-php) branch. This version is a full rewrite with a new interface and new features.

> The demo runs entirely on synthetic data stored in your browser. It is a screening aid for cadres, not a medical diagnosis tool.

## What it does

- **WHO growth standards.** Length/height-for-age, weight-for-age, weight-for-length/height and BMI-for-age z-scores from the official WHO 2006 LMS tables (0 to 60 months). Classification and category names follow Permenkes 2/2020 (Standar Antropometri Anak), including the 0.7 cm correction when length/height is measured in the non-standard position.
- **Growth chart per child** with the WHO -3, -2, median, +2, +3 SD curves and the child's own points.
- **Trend alert** when a child's height z-score drops 0.25 SD or more over the last four visits, even while still in the normal range.
- **Plain-language advice** for each result, written so a cadre can explain it to parents, with a referral flag when needed.
- **Dashboard** with stunting prevalence, a six-month trend, per-posyandu comparison and a priority list.
- **Offline-first PWA.** Entries are saved on the device, marked as waiting to sync, and the app shell is cached by a service worker.
- **Reminders** for monthly weighing, basic immunizations and vitamin A months, with a ready-to-send WhatsApp text (the cadre sends it).
- **Monthly report** per posyandu, as Excel-friendly CSV or print to PDF.
- **Roles.** Cadre sees their own posyandu; admin sees all and the combined report.
- **Indonesian and English** interface toggle for the main navigation and key labels.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS. Charts are hand-written SVG. No chart library.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # z-score and classification tests
npm run build
```

## Data and accuracy

- `src/lib/who.json` holds the WHO LMS tables, converted from the official expanded tables published by WHO.
- Weight-based z-scores use the WHO tail adjustment beyond +-3 SD. Height-for-age does not.
- Tests check that the median gives z = 0 and the published SD values give -3, -2, +2, +3.
- The immunization list follows the routine infant and toddler schedule published by Kemenkes (ayosehat.kemkes.go.id, "Jadwal Pemberian Imunisasi Rutin Lengkap"). Always check the child's KIA book.
- Vitamin A reminders: February and August, 6 to 59 months (Kemenkes, ayosehat.kemkes.go.id).

## Sources for the rules

- Permenkes No. 2 Tahun 2020 tentang Standar Antropometri Anak (enacted 2 Jan 2020): https://keslan.kemkes.go.id/unduhan/fileunduhan_1660187306_961415.pdf
- WHO Child Growth Standards: https://www.who.int/tools/child-growth-standards
- SSGI 2024 national stunting prevalence 19.8%, 2029 target 14.2%: https://kemkes.go.id/id/ssgi-2024-prevalensi-stunting-nasional-turun-menjadi-198

## Current limits

- Demo mode stores data in `localStorage`. There is no server yet, so "sync" only clears the pending flag. A Supabase adapter is the next step.
- Roles are a demo switch, not real authentication.
- All names and measurements are generated. No real child data is in this repository.

## Backend (Supabase)

- Auth: email + password (register, login, reset). New accounts are `kader` + `pending` and see nothing until an admin approves them and assigns a posyandu.
- Schema and Row Level Security: `supabase/migrations/*.sql`. No table is readable by `anon`. Kader see their posyandu, `nakes` see their puskesmas, `admin` sees all. Users cannot change their own role (trigger guard).
- No real data or secrets live in this repository. The project URL and publishable key in `src/lib/supabase.ts` are public by design; never add a `service_role` key to this app.
- Bootstrap the first admin after registering: `update public.profiles set role='admin', status='active' where id = (select id from auth.users where email = 'you@example.com');`
- `scripts/crosscheck-sample.mts` generates test points used to compare z-scores with the WHO igrowup port `pygrowup`.
