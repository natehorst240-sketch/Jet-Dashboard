"""
Projected Inspection Calendar — pure-data projection module
============================================================

Computes the next projected due date for each inspection interval on each
aircraft, using whichever limit (hours-remaining or calendar-remaining)
hits first. Returns a JSON-friendly list of event dicts that the WorksCalendar
React component consumes.

Inputs
------
aircraft_list: list of dicts. Each entry:
    {
        'tail':         'N251HC',
        'airframe_hrs': 1234.5,             # None to skip the aircraft
        'intervals':    {                   # keyed by interval_key(iv)
            50:   {'rem_hrs': 12.3,  'rem_days': None, 'rem_months': None},
            100:  {'rem_hrs': 47.8,  'rem_days': None, 'rem_months': None},
            ...
        },
    }

flight_hours_stats: dict keyed by tail. Each entry:
    { 'avg_daily': 1.7 }                    # average flight hrs / day

interval_cfg: list of dicts (typically from configs/<aircraft>.json):
    [
        {'label': '50 Hr', 'hours': 50, 'days': None,
         'color': '#00897b', 'calendar_duration_days': 1},
        ...
    ]
"""

from datetime import datetime, timedelta


def interval_key(iv):
    """Canonical dict key for an interval: hours int when available, else 'd{days}', else label."""
    if iv.get('hours') is not None:
        return iv['hours']
    if iv.get('days') is not None:
        return f"d{iv['days']}"
    return iv.get('label') or 'unknown'


def _months_days_label(td):
    mo = int(td) // 30
    dy = int(abs(td)) % 30
    if td < 0:
        return f'{abs(int(td))} days PAST LIMIT'
    if mo > 0 and dy > 0:
        return f'~{mo} mo {dy} days remaining'
    if mo > 0:
        return f'~{mo} month{"s" if mo != 1 else ""} remaining'
    return f'~{dy} days remaining'


def compute_projected_events(aircraft_list, flight_hours_stats, interval_cfg=None):
    """Return a list of projected-maintenance event dicts ready for the WorksCalendar UI.

    Each event has shape:
        {
            'tail':          'N251HC',
            'interval':      <key>,
            'intervalLabel': '50 HR',
            'dueDate':       'YYYY-MM-DD',
            'durationDays':  1,
            'remLabel':      'X.X hrs remaining (~Y.Y days)',
            'color':         '#hex',
        }
    """
    today = datetime.today().date()

    if interval_cfg:
        INTERVAL_COLOR = {interval_key(iv): iv.get('color', '#4a5568') for iv in interval_cfg}
        INTERVAL_LABEL = {interval_key(iv): iv.get('label', str(interval_key(iv))) for iv in interval_cfg}
        INTERVAL_DURATION_DAYS = {
            interval_key(iv): max(1, int(iv.get('calendar_duration_days', 1) or 1))
            for iv in interval_cfg
        }
    else:
        INTERVAL_COLOR = {
            50:   '#00897b',
            100:  '#1e88e5',
            200:  '#8e24aa',
            400:  '#e53935',
            800:  '#fb8c00',
            2400: '#43a047',
            3200: '#6d4c41',
        }
        INTERVAL_LABEL = {k: f"{k} HR" for k in INTERVAL_COLOR}
        INTERVAL_DURATION_DAYS = {
            50: 1, 100: 1, 200: 3, 400: 4, 800: 4, 2400: 7, 3200: 21,
        }

    events = []
    for ac in aircraft_list:
        tail = ac['tail']
        if ac['airframe_hrs'] is None:
            continue
        avg_daily = (flight_hours_stats.get(tail) or {}).get('avg_daily')
        if not avg_daily or avg_daily <= 0:
            continue

        for interval in list(INTERVAL_COLOR.keys()):
            v = ac['intervals'].get(interval)
            if v is None:
                continue
            rem_hrs    = v.get('rem_hrs')
            rem_days   = v.get('rem_days')
            rem_months = v.get('rem_months')

            if rem_months is not None or rem_days is not None:
                total_days = (rem_months or 0) * 30 + (rem_days or 0)
            else:
                total_days = None

            if rem_hrs is None and total_days is None:
                continue

            due_candidates = []
            due_reasons = []

            if rem_hrs is not None:
                if rem_hrs < 0:
                    due_candidates.append(today)
                    due_reasons.append(('hours_past_due', rem_hrs, 0.0))
                else:
                    days_away = rem_hrs / avg_daily
                    due_candidates.append(today + timedelta(days=days_away))
                    due_reasons.append(('hours_remaining', rem_hrs, days_away))

            if total_days is not None:
                due_candidates.append(today + timedelta(days=total_days))
                due_reasons.append(('days_remaining', total_days, total_days))

            due_idx = min(range(len(due_candidates)), key=lambda idx: due_candidates[idx])
            due = due_candidates[due_idx]
            due = due.date() if isinstance(due, datetime) else due
            reason_kind, reason_value, reason_days = due_reasons[due_idx]

            if reason_kind == 'hours_past_due':
                rem_label = f'{abs(reason_value):.1f} hrs PAST LIMIT'
            elif reason_kind == 'days_remaining':
                rem_label = _months_days_label(reason_value)
                if rem_hrs is not None and rem_hrs >= 0:
                    rem_label += f' · {rem_hrs:.1f} hrs remaining'
            else:
                rem_label = f'{reason_value:.1f} hrs remaining (~{reason_days:.1f} days)'
                if total_days is not None and total_days >= 0:
                    rem_label += f' · earlier than {_months_days_label(total_days)}'

            events.append({
                'tail':          tail,
                'interval':      interval,
                'intervalLabel': INTERVAL_LABEL.get(interval, f'{interval} HR'),
                'dueDate':       due.isoformat(),
                'durationDays':  INTERVAL_DURATION_DAYS.get(interval, 1),
                'remLabel':      rem_label,
                'color':         INTERVAL_COLOR.get(interval, '#4a5568'),
            })

    return events
