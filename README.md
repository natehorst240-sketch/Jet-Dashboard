# Beechcraft King Air Fleet Maintenance Dashboard
**DUAL ENGINE TURBOPROP**

Live dashboard: https://natehorst240-sketch.github.io/King-Air-Dashboard/

## Repository layout
```
King-Air-Dashboard/
├── data/
│   ├── king-air-daily-due-list.csv          ← Flightdocs daily export
│   └── king_air_flight_hours_history.json   ← auto-generated snapshot history
├── public/
│   └── index.html                           ← static dashboard shell
├── src/
│   ├── build_dashboard.py                   ← CSV → dashboard.json + calendar_events.json
│   ├── inspection_calendar.py               ← projected next-due math
│   └── web/calendar-app.tsx                 ← WorksCalendar React widget
├── scripts/
│   └── fetch-king-air-due-list.ts           ← Playwright Flightdocs scraper
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
scheduled `Fetch King Air Due List` workflow can pull the daily export.

### 4. Local dev
```
npm ci
npm run build:web       # bundles the calendar widget into dist/web/
python src/build_dashboard.py
```

## Inspections tracked

Phase Operation Package inspections, normalized across the three ATA schemes
the Flightdocs export uses:

| Phase | `05 00X0` scheme | `05 -25-0X` scheme |
|-------|------------------|--------------------|
| 1     | `05 0010`        | `05 -25-01`        |
| 2     | `05 0020`        | `05 -25-02`        |
| 3     | `05 0030`        | `05 -25-03`        |
| 4     | `05 0040`        | `05 -25-04`        |

## Inspections tab top chart
Per-aircraft horizontal bar chart of **hours remaining until the next Phase
inspection due**, sorted least → most, color-coded by severity (overdue / critical
/ coming / OK).

## Calendar tab
Projected maintenance calendar rendered by [`works-calendar`](https://www.npmjs.com/package/works-calendar).
Due dates project from whichever limit hits first — flight-hours remaining ÷
average daily hours, or calendar-remaining days. Aircraft with no utilization
history yet still project from calendar-based intervals; hours-based projections
light up once the daily-fetch workflow has logged ≥2 snapshots.
