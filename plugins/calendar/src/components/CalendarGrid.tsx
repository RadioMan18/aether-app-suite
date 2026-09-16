import { useMemo } from "react";
import type { CalendarEvent } from "../hooks/useCalendarEvents";

interface CalendarGridProps {
  current: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  onToday: () => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarGrid({ current, eventsByDate, onToday }: CalendarGridProps) {
  const days = useMemo(() => {
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push({ date: d, isCurrentMonth: d.getMonth() === month });
    }
    return cells;
  }, [current]);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: "1px solid #2e2f32",
        }}
      >
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            style={{
              padding: "8px 0",
              textAlign: "center",
              fontSize: 12,
              color: "#6b6b6b",
              borderRight: "1px solid #2e2f32",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          flex: 1,
        }}
      >
        {days.map((cell, idx) => {
          const key = cell.date.toISOString().slice(0, 10);
          const dayEvents = eventsByDate.get(key) ?? [];
          const isToday = key === todayStr;

          return (
            <div
              key={idx}
              onClick={isToday ? onToday : undefined}
              style={{
                minHeight: 80,
                padding: 8,
                borderRight: "1px solid #2e2f32",
                borderBottom: "1px solid #2e2f32",
                background: cell.isCurrentMonth ? "#040506" : "#0a0a0c",
                color: cell.isCurrentMonth ? "#f0f0f0" : "#6b6b6b",
                cursor: isToday ? "pointer" : "default",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: isToday ? 600 : 400,
                  marginBottom: 4,
                }}
              >
                {cell.date.getDate()}
                {isToday && (
                  <span
                    style={{
                      marginLeft: 4,
                      fontSize: 10,
                      color: "#55b3ff",
                    }}
                  >
                    Today
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      fontSize: 10,
                      color: ev.type === "task" ? "#55b3ff" : "#ff5f5f",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={ev.title}
                  >
                    • {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: 10, color: "#6b6b6b" }}>
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
