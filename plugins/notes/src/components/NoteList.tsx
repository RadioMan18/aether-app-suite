import type { Note } from "../App";

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NoteList({ notes, selectedNoteId, onSelect, onDelete }: NoteListProps) {
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {notes.length === 0 ? (
        <div
          style={{
            padding: 24,
            color: "#6b6b6b",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          No notes yet. Create your first note.
        </div>
      ) : (
        notes.map((note) => {
          const isActive = note.id === selectedNoteId;
          const preview = note.content.slice(0, 60).replace(/[#*\[\]]/g, "") || "Empty note";

          return (
            <div
              key={note.id}
              onClick={() => onSelect(note.id)}
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid #2e2f32",
                cursor: "pointer",
                background: isActive ? "#1b1c1e" : "transparent",
                transition: "background 0.15s",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: isActive ? "#f0f0f0" : "#a0a0a0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {note.title || "Untitled"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b6b6b",
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {preview}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#6b6b6b",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: "2px 4px",
                  flexShrink: 0,
                }}
                aria-label="Delete note"
              >
                ×
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
