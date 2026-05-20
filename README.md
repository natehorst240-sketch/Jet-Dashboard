# Jet Fleet Maintenance Dashboard
**DUAL ENGINE TURBOPROP**

Live dashboard: https://natehorst240-sketch.github.io/Jet-Dashboard/

## Repository layout
```
Jet-Dashboard/
├── data/
│   ├── jet-daily-due-list.csv               ← Flightdocs daily export
│   └── jet_flight_hours_history.json        ← auto-generated snapshot history
├── public/
│   └── index.html                           ← static dashboard shell
├── src/
│   ├── build_dashboard.py                   ← CSV → dashboard.json + calendar_events.json
│   ├── inspection_calendar.py               ← projected next-due math
│   └── web/calendar-app.tsx                 ← WorksCalendar React widget
├── scripts/
│   └── fetch-jet-due-list.ts                ← Playwright Flightdocs scraper
├── vite.config.ts                           ← bundles the calendar widget
└── .github/workflows/                       ← daily fetch + Pages deploy
```

## Setup

### 1. GitHub Actions permissions
Settings → Actions → General → Workflow permissions → **Read and write**

### 2. GitHub Pages
Settings → Pages → Source: **GitHub Actions** (not "Deploy from a branch").

### 3. Flightdocs credentials
Add `FLIGHTDOCS_USERNAME` and `FLIGHTDOCS_PASSWORD` as repository secrets so the
scheduled `Fetch Jet Due List` workflow can pull the daily export.

### 4. Local dev
```
npm ci
npm run build:web       # bundles the calendar widget into dist/web/
python src/build_dashboard.py
```

## Inspections tracked

Inspection rows whose `ATA and Code` matches one of these prefixes are tracked:

| ATA code   | Name        |
|------------|-------------|
| `05 12-13` | Document 13 |
| `05 12-11` | Document 11 |
| `05 12-07` | Document 7  |
| `05 12-19` | Document 19 |
| `05 12-26` | Document 26 |
| `04 12-MI` | Document MI |
| `05 12-25` | Document 25 |
| `04 12-MA` | Document MA |
| `05 12-23` | Document 23 |
| `05 12-34` | Document 34 |
| `05 12-21` | Document 21 |
| `04 12-MM` | Document MM |

## Inspections tab top chart
Per-aircraft horizontal bar chart of **hours remaining until the next
inspection due**, sorted least → most, color-coded by severity (overdue / critical
/ coming / OK).

## Calendar tab
Projected maintenance calendar rendered by [`works-calendar`](https://www.npmjs.com/package/works-calendar).
Due dates project from whichever limit hits first — flight-hours remaining ÷
average daily hours, or calendar-remaining days. Aircraft with no utilization
history yet still project from calendar-based intervals; hours-based projections
light up once the daily-fetch workflow has logged ≥2 snapshots.
