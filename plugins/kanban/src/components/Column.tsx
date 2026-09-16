import type { KanbanTask } from "../hooks/useKanbanBoard";

interface ColumnProps {
  title: string;
  tasks: KanbanTask[];
  onDrop: (taskId: string, column: "todo" | "in_progress" | "done") => void;
}

export default function Column({ title, tasks, onDrop }: ColumnProps) {
  const columnId = title === "Todo" ? "todo" : title === "In Progress" ? "in_progress" : "done";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    onDrop(taskId, columnId);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        flex: 1,
        minWidth: 260,
        background: "#111214",
        border: "1px solid #2e2f32",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        maxHeight: "100%",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #2e2f32",
          fontSize: 13,
          fontWeight: 500,
          color: "#a0a0a0",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
        <span
          style={{
            marginLeft: 8,
            fontSize: 11,
            color: "#6b6b6b",
          }}
        >
          {tasks.length}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        {tasks.length === 0 ? (
          <div
            style={{
              padding: 24,
              color: "#6b6b6b",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            Drop tasks here
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: KanbanTask;
}

function TaskCard({ task }: TaskCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        padding: "10px 12px",
        borderRadius: 6,
        border: "1px solid #2e2f32",
        background: "#040506",
        cursor: "grab",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#f0f0f0",
          marginBottom: 4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {task.title}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#6b6b6b",
        }}
      >
        <span>P{task.priority}</span>
        {task.due_date && <span>{task.due_date}</span>}
      </div>
    </div>
  );
}
