# SINDAPARKA

Growth monitoring for posyandu cadres. Record a child's weight and height, get WHO z-scores and a plain-language result straight away, and follow each child's curve over time.

SINDAPARKA started as a PHP/MySQL stunting diagnosis system for posyandu cadres in Parakan Kauman, Temanggung, a team project in collaboration with BKKBN. The original code is kept on the [`legacy-php`](../../tree/legacy-php) branch. This version is a full rewrite with a new interface and new features.

> The demo runs entirely on synthetic data stored in your browser. It is a screening aid for cadres, not a medical diagnosis tool.

## What it does

- **WHO growth standards.** Height-for-age, weight-for-age and weight-for-length/height z-scores from the official WHO 2006 LMS tables (0 to 60 months). Classification uses the Indonesian cut-offs (Permenkes 2/2020).
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
- The immunization list is a condensed basic schedule. Always check the child's KIA book.

## Current limits

- Demo mode stores data in `localStorage`. There is no server yet, so "sync" only clears the pending flag. A Supabase adapter is the next step.
- Roles are a demo switch, not real authentication.
- All names and measurements are generated. No real child data is in this repository.
