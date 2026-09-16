import { useEffect, useState } from "react";
import { broker } from "../../../sdk/src/index.ts";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "task" | "goal";
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

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setError(null);
      const [tasksRes, goalsRes] = await Promise.all([
        broker.request<TodoTask[]>({
          targetPluginId: "todo",
          action: "todo:get_tasks",
        }),
        broker.request<GoalMilestone[]>({
          targetPluginId: "goals",
          action: "goals:get_milestones",
        }),
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

      setEvents([...taskEvents, ...goalEvents]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return { events, isLoading, error, reload: loadEvents };
}
