import { useMemo, useState } from "react";
import { useKanbanBoard, type KanbanTask } from "./hooks/useKanbanBoard";
import Board from "./components/Board";

export interface ColumnDefinition {
  id: "todo" | "in_progress" | "done";
  title: string;
  tasks: KanbanTask[];
}

export default function App() {
  const { columns, isLoading, error, saveColumn } = useKanbanBoard();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const handleDrop = async (taskId: string, column: "todo" | "in_progress" | "done") => {
    setPendingIds((prev) => new Set(prev).add(taskId));
    await saveColumn(taskId, column);
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  };

  const columnDefinitions = useMemo<ColumnDefinition[]>(() => {
    return columns.map((col) => ({
      id: col.id,
      title: col.title,
      tasks: col.tasks.map((task) => ({
        ...task,
        column: pendingIds.has(task.id) ? task.column : col.id,
      })),
    }));
  }, [columns, pendingIds]);

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
            Kanban
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: "#6b6b6b",
            }}
          >
            Project board
          </p>
        </div>

        <div style={{ padding: "12px 20px", fontSize: 13, color: "#6b6b6b", lineHeight: 1.5 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: "#55b3ff" }}>●</span> Todo
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: "#ffb84d" }}>●</span> In Progress
          </div>
          <div>
            <span style={{ color: "#4ade80" }}>●</span> Done
          </div>
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
            Loading board...
          </div>
        ) : (
          <Board columns={columnDefinitions} onDrop={handleDrop} />
        )}
      </div>
    </div>
  );
}
