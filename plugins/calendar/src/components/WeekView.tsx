import { useMemo } from "react";
import type { CalendarEvent } from "../hooks/useCalendarEvents";

interface WeekViewProps {
  periodStart: Date;
  viewMode: "week" | "workweek";
  eventsByDate: Map<string, CalendarEvent[]>;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeekView({ periodStart, viewMode, eventsByDate }: WeekViewProps) {
  const days = useMemo(() => {
    const count = viewMode === "workweek" ? 5 : 7;
    const start =
      viewMode === "workweek"
        ? (() => {
            const d = new Date(periodStart);
            const day = d.getDay();
            if (day === 0) d.setDate(d.getDate() + 1);
            else if (day === 6) d.setDate(d.getDate() + 2);
            return d;
          })()
        : periodStart;

    return Array.from({ length: count }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [periodStart, viewMode]);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${days.length}, 1fr)`,
        height: "100%",
      }}
    >
      {days.map((day) => {
        const key = day.toISOString().slice(0, 10);
        const dayEvents = eventsByDate.get(key) ?? [];
        const isCurrentDay = key === todayStr;

        return (
          <div
            key={key}
            style={{
              borderRight: "1px solid #2e2f32",
              borderBottom: "1px solid #2e2f32",
              background: "#040506",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #2e2f32",
                background: isCurrentDay ? "#1b1c1e" : "transparent",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#6b6b6b",
                  marginBottom: 2,
                }}
              >
                {DAY_LABELS[day.getDay()]}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: isCurrentDay ? 600 : 400,
                  color: isCurrentDay ? "#55b3ff" : "#f0f0f0",
                }}
              >
                {day.getDate()}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {dayEvents.length === 0 ? (
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b6b6b",
                    textAlign: "center",
                    marginTop: 16,
                  }}
                >
                  No events
                </div>
              ) : (
                dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #2e2f32",
                      background: "#111214",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: ev.type === "task" ? "#55b3ff" : "#ff5f5f",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#f0f0f0",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={ev.title}
                      >
                        {ev.title}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#6b6b6b",
                        textTransform: "capitalize",
                      }}
                    >
                      {ev.type}
                      {ev.status ? ` · ${ev.status}` : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
