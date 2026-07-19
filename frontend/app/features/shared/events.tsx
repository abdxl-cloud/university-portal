/* Scheduled dean/HOD events shown on student and staff timetables. */
import { Icon } from "../../components/icons";
import type { EventRec, Store } from "../../store/types";

/** Which timetable is being viewed. Matches the event audience values, minus "both". */
export type EventAudience = "students" | "staff";

/** Events visible to `who` (their own audience, plus "both"). */
export function portalEvents(store: Store, who: EventAudience): EventRec[] {
  return (store.events || []).filter((e) => e.audience === "both" || e.audience === who);
}

/** Events for `who` landing in a specific day/period slot. */
export function eventsAt(store: Store, who: EventAudience, day: string, start: string): EventRec[] {
  return portalEvents(store, who).filter((e) => e.day === day && e.start === start);
}

export function EventChip({ ev }: { ev: EventRec }) {
  const clash = ev.clashes && ev.clashes.length > 0;
  return (
    <div className="u-tt__ev" style={{
      background: "var(--accent-soft)", color: "var(--accent-soft-fg)",
      border: clash ? "1.5px dashed var(--danger)" : "1.5px dashed var(--accent)",
      marginTop: 4,
    }}>
      <span className="c" style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon name="calendar" size={11} /> {ev.title}</span>
      <span className="r">{ev.venue}{clash ? " · clash" : ""}</span>
    </div>
  );
}
