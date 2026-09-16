import { useEffect, useMemo, useState } from "react";
import { broker, db } from "../../../sdk/src/index.ts";

export interface TodoTask {
  id: string;
  title: string;
  completed: boolean;
  priority: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface KanbanTask extends TodoTask {
  column: "todo" | "in_progress" | "done";
}

type ColumnId = "todo" | "in_progress" | "done";

const COLUMNS: ColumnId[] = ["todo", "in_progress", "done"];

export function useKanbanBoard() {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, ColumnId>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = async () => {
    try {
      setError(null);
      const res = await broker.request<TodoTask[]>({
        targetPluginId: "todo",
        action: "todo:get_tasks",
      });

      const loaded = res.data ?? [];
      setTasks(loaded);

      const map: Record<string, ColumnId> = {};
      for (const task of loaded) {
        if (task.completed) {
          map[task.id] = "done";
        } else {
          map[task.id] = "todo";
        }
      }
      setColumnMap(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBoard();
  }, []);

  const columns = useMemo(() => {
    const grouped: Record<ColumnId, KanbanTask[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };

    for (const task of tasks) {
      const column = columnMap[task.id] ?? (task.completed ? "done" : "todo");
      grouped[column].push({ ...task, column });
    }

    return COLUMNS.map((id) => ({
      id,
      title: id === "todo" ? "Todo" : id === "in_progress" ? "In Progress" : "Done",
      tasks: grouped[id],
    }));
  }, [tasks, columnMap]);

  const saveColumn = async (taskId: string, column: ColumnId) => {
    setColumnMap((prev) => ({ ...prev, [taskId]: column }));

    try {
      const completed = column === "done" ? 1 : 0;
      await db.execute(
        "UPDATE todos SET completed = ?1, updated_at = ?2 WHERE id = ?3",
        [completed, new Date().toISOString(), taskId],
      );
      await db.execute(
        `INSERT INTO kanban_columns (todo_id, column, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(todo_id) DO UPDATE SET column = excluded.column, updated_at = excluded.updated_at`,
        [taskId, column, new Date().toISOString()],
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return { columns, isLoading, error, reload: loadBoard, saveColumn };
}
