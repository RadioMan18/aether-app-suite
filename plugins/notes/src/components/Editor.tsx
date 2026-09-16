import { useEffect, useState } from "react";
import type { Note, Backlink } from "../App";

interface EditorProps {
  note: Note;
  onSave: (updates: Partial<Note>) => void;
  backlinks: Backlink[];
}

export default function Editor({ note, onSave, backlinks }: EditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id, note.title, note.content]);

  const handleSave = () => {
    onSave({
      title: title.trim() || "Untitled",
      content,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "0 24px", borderBottom: "1px solid #2e2f32" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          style={{
            width: "100%",
            padding: "16px 0",
            background: "transparent",
            border: "none",
            color: "#f0f0f0",
            fontSize: 20,
            fontWeight: 600,
            outline: "none",
          }}
        />
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write markdown here... Use [[note title]] to link to other notes."
            style={{
              width: "100%",
              height: "100%",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #2e2f32",
              background: "#040506",
              color: "#f0f0f0",
              fontSize: 14,
              lineHeight: 1.6,
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        {backlinks.length > 0 && (
          <div
            style={{
              width: 240,
              borderLeft: "1px solid #2e2f32",
              background: "#111214",
              padding: 16,
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: 12,
                fontWeight: 500,
                color: "#6b6b6b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Backlinks ({backlinks.length})
            </h3>
            {backlinks.map((link) => (
              <div
                key={link.source_note_id}
                style={{
                  padding: "8px 12px",
                  marginBottom: 8,
                  borderRadius: 6,
                  border: "1px solid #2e2f32",
                  background: "#040506",
                  fontSize: 13,
                  color: "#55b3ff",
                }}
              >
                {link.source_title}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "12px 24px", borderTop: "1px solid #2e2f32" }}>
        <button
          onClick={handleSave}
          style={{
            background: "#55b3ff",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Save Note
        </button>
      </div>
    </div>
  );
}
