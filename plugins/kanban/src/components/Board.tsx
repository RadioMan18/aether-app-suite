import type { KanbanTask } from "../hooks/useKanbanBoard";
import Column from "./Column";

interface ColumnDefinition {
  id: "todo" | "in_progress" | "done";
  title: string;
  tasks: KanbanTask[];
}

interface BoardProps {
  columns: ColumnDefinition[];
  onDrop: (taskId: string, column: "todo" | "in_progress" | "done") => void;
}

export default function Board({ columns, onDrop }: BoardProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: 16,
        height: "100%",
        overflowX: "auto",
      }}
    >
      {columns.map((column) => (
        <Column
          key={column.id}
          title={column.title}
          tasks={column.tasks}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
}
