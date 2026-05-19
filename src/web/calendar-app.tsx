import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { WorksCalendar, type WorksCalendarEvent } from 'works-calendar';
import 'works-calendar/styles';
import 'works-calendar/styles/aviation';

type ProjectedEvent = {
  tail: string;
  interval: string | number;
  intervalLabel: string;
  dueDate: string;
  durationDays: number;
  remLabel: string;
  color: string;
};

const EVENTS_URL = 'data/calendar_events.json';

function addDays(ymd: string, deltaDays: number): Date {
  const d = new Date(ymd + 'T00:00:00');
  d.setDate(d.getDate() + deltaDays);
  return d;
}

function toWorksCalendarEvent(ev: ProjectedEvent): WorksCalendarEvent {
  const duration = Math.max(1, Number(ev.durationDays) || 1);
  return {
    id: `proj-${ev.tail}-${String(ev.intervalLabel).replace(/\s+/g, '_')}-${ev.dueDate}`,
    title: `${ev.tail} — ${ev.intervalLabel}`,
    start: new Date(ev.dueDate + 'T00:00:00'),
    end: addDays(ev.dueDate, duration),
    allDay: true,
    color: ev.color,
    category: 'projected',
    visualPriority: 'muted',
    status: 'tentative',
    lifecycle: 'pending',
    meta: {
      tail: ev.tail,
      intervalLabel: ev.intervalLabel,
      remLabel: ev.remLabel,
      dueDate: ev.dueDate,
    },
  };
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; events: WorksCalendarEvent[]; projected: ProjectedEvent[] }
  | { kind: 'error'; message: string };

function CalendarApp() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch(`${EVENTS_URL}?t=${Date.now()}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as ProjectedEvent[];
        if (cancelled) return;
        setState({
          kind: 'ready',
          projected: Array.isArray(data) ? data : [],
          events: (Array.isArray(data) ? data : []).map(toWorksCalendarEvent),
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sidebar = useMemo(() => {
    if (state.kind !== 'ready') return null;
    if (!state.projected.length) {
      return <div className="cal-side-empty">No projected inspection dates yet.</div>;
    }
    const grouped = new Map<string, ProjectedEvent[]>();
    [...state.projected]
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.tail.localeCompare(b.tail))
      .forEach((ev) => {
        const key = ev.dueDate || 'Unknown';
        const bucket = grouped.get(key) ?? [];
        bucket.push(ev);
        grouped.set(key, bucket);
      });
    return (
      <div className="cal-side-list">
        {Array.from(grouped.entries()).map(([date, evs]) => (
          <div key={date} className="cal-date-group">
            <div className="cal-date-title">{formatDate(date)}</div>
            <div className="cal-date-sub">
              {evs.length} projected event{evs.length === 1 ? '' : 's'}
            </div>
            {evs.map((ev) => (
              <div
                key={`${ev.tail}-${ev.intervalLabel}-${ev.dueDate}`}
                className="cal-ev"
                style={{ borderLeftColor: ev.color || '#4a5568' }}
              >
                <div className="cal-ev-title">
                  {ev.tail} · {ev.intervalLabel}
                </div>
                <div className="cal-ev-sub">{ev.remLabel}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }, [state]);

  return (
    <div className="cal-shell">
      <div className="cal-shell-main">
        {state.kind === 'loading' && <div className="cal-side-empty">Loading projections…</div>}
        {state.kind === 'error' && (
          <div className="cal-side-empty">Failed to load projection: {state.message}</div>
        )}
        {state.kind === 'ready' && (
          <WorksCalendar
            events={state.events}
            initialView="month"
            theme="aviation"
            role="viewer"
            devMode={false}
          />
        )}
      </div>
      <aside className="cal-shell-aside">
        <div className="section-label">Estimated Inspection Dates</div>
        {sidebar}
      </aside>
    </div>
  );
}

function formatDate(ymd: string): string {
  const d = new Date(ymd + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const rootEl = document.getElementById('works-calendar-root');
if (rootEl) {
  createRoot(rootEl).render(<CalendarApp />);
}
