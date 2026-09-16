import { useMemo, useState } from "react";
import { useCalendarEvents, type CalendarEvent } from "./hooks/useCalendarEvents";
import CalendarGrid from "./components/CalendarGrid";
import WeekView from "./components/WeekView";

type ViewMode = "month" | "week" | "workweek";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function startOfWorkWeek(date: Date) {
  const d = startOfWeek(date);
  const day = d.getDay();
  if (day === 0) {
    d.setDate(d.getDate() + 1);
  } else if (day === 6) {
    d.setDate(d.getDate() + 2);
  }
  return d;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addWeeks(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount * 7);
  return result;
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [current, setCurrent] = useState(() => startOfMonth(new Date()));
  const { events, isLoading, error } = useCalendarEvents();

  const periodStart = useMemo(() => {
    if (viewMode === "month") return startOfMonth(current);
    if (viewMode === "workweek") return startOfWorkWeek(current);
    return startOfWeek(current);
  }, [viewMode, current]);

  const periodLabel = useMemo(() => {
    if (viewMode === "month") {
      return current.toLocaleString(undefined, { month: "long", year: "numeric" });
    }
    const end = new Date(periodStart);
    if (viewMode === "workweek") {
      end.setDate(end.getDate() + 4);
    } else {
      end.setDate(end.getDate() + 6);
    }
    const fmt = (d: Date) =>
      d.toLocaleString(undefined, { month: "short", day: "numeric" });
    return `${fmt(periodStart)} – ${fmt(end)} ${periodStart.getFullYear()}`;
  }, [viewMode, current, periodStart]);

  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrent((c) => addMonths(c, -1));
    } else {
      setCurrent((c) => addWeeks(c, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrent((c) => addMonths(c, 1));
    } else {
      setCurrent((c) => addWeeks(c, 1));
    }
  };

  const handleToday = () => {
    setCurrent(viewMode === "month" ? startOfMonth(new Date()) : startOfWeek(new Date()));
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setCurrent(viewMode === "month" && mode !== "month" ? startOfWeek(new Date()) : current);
  };

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((ev) => {
      if (!ev.date) return;
      const key = ev.date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    });
    return map;
  }, [events]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#040506" }}>
      {error && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            background: "#2a1515",
            border: "1px solid #5f2a2a",
            borderRadius: 8,
            color: "#ff5f5f",
            fontSize: 13,
            zIndex: 1000,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          width: 280,
          borderRight: "1px solid #2e2f32",
          background: "#111214",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #2e2f32",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: "#f0f0f0",
            }}
          >
            Calendar
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: "#6b6b6b",
            }}
          >
            Tasks & goals
          </p>
        </div>

        <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {(["month", "week", "workweek"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleViewModeChange(mode)}
              style={{
                background: viewMode === mode ? "#55b3ff" : "transparent",
                color: viewMode === mode ? "#fff" : "#6b6b6b",
                border: "1px solid #2e2f32",
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: 13,
                cursor: "pointer",
                textAlign: "left",
                textTransform: "capitalize",
              }}
            >
              {mode === "workweek" ? "Work Week" : mode}
            </button>
          ))}
        </div>

        <div style={{ padding: "12px 20px", display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={handlePrev}
            style={{
              background: "transparent",
              color: "#f0f0f0",
              border: "1px solid #2e2f32",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            ◀ Prev
          </button>
          <button
            onClick={handleToday}
            style={{
              background: "transparent",
              color: "#f0f0f0",
              border: "1px solid #2e2f32",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Today
          </button>
          <button
            onClick={handleNext}
            style={{
              background: "transparent",
              color: "#f0f0f0",
              border: "1px solid #2e2f32",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Next ▶
          </button>
        </div>

        <div
          style={{
            padding: "4px 20px 12px",
            fontSize: 13,
            color: "#a0a0a0",
          }}
        >
          {periodLabel}
        </div>

        <div style={{ padding: "0 20px 16px", display: "flex", gap: 8, fontSize: 11, color: "#6b6b6b" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#55b3ff" }} />
            Task
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f5f" }} />
            Goal
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {isLoading ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b6b6b",
              fontSize: 14,
            }}
          >
            Loading calendar...
          </div>
        ) : viewMode === "month" ? (
          <CalendarGrid
            current={current}
            eventsByDate={eventsByDate}
            onToday={handleToday}
          />
        ) : (
          <WeekView
            periodStart={periodStart}
            viewMode={viewMode}
            eventsByDate={eventsByDate}
          />
        )}
      </div>
    </div>
  );
}
