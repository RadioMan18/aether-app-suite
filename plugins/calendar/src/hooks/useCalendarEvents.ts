import { useEffect, useState } from "react";
import { broker, db } from "../../../sdk/src/index.ts";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "task" | "goal" | "event";
  status?: string;
}

export interface TodoTask {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
}

export interface GoalMilestone {
  id: string;
  title: string;
  target_date: string | null;
  status: string;
}

export interface LocalCalendarEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  status: string;
}

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setError(null);
      const [tasksRes, goalsRes, localRes] = await Promise.all([
        broker.request<TodoTask[]>({
          targetPluginId: "todo",
          action: "todo:get_tasks",
        }),
        broker.request<GoalMilestone[]>({
          targetPluginId: "goals",
          action: "goals:get_milestones",
        }),
        db.query<LocalCalendarEvent>("SELECT id, title, date, type, status FROM calendar_events ORDER BY date ASC"),
      ]);

      const taskEvents: CalendarEvent[] = (tasksRes.data ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        date: task.due_date ?? "",
        type: "task",
        status: task.completed ? "completed" : "open",
      }));

      const goalEvents: CalendarEvent[] = (goalsRes.data ?? []).map((goal) => ({
        id: goal.id,
        title: goal.title,
        date: goal.target_date ?? "",
        type: "goal",
        status: goal.status,
      }));

      const localEvents: CalendarEvent[] = (localRes ?? []).map((ev) => ({
        id: ev.id,
        title: ev.title,
        date: ev.date,
        type: ev.type as CalendarEvent["type"],
        status: ev.status,
      }));

      setEvents([...taskEvents, ...goalEvents, ...localEvents]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const addLocalEvent = async (title: string, date: string) => {
    try {
      setError(null);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.execute(
        "INSERT INTO calendar_events (id, title, date, type, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        [id, title, date, "event", "scheduled", now, now]
      );
      await loadEvents();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return { events, isLoading, error, reload: loadEvents, addLocalEvent };
}
