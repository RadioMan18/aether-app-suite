import { useEffect, useMemo, useState } from "react";
import { db } from "../../sdk/src/index.ts";
import { invoke } from "@tauri-apps/api/core";
import NoteList from "./components/NoteList";
import Editor from "./components/Editor";
import GraphView from "./components/GraphView";

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Backlink {
  source_note_id: string;
  source_title: string;
  target_note_id: string;
}

type ViewMode = "editor" | "graph";

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("editor");
  const [isAuthReady, setIsAuthReady] = useState(false);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  const loadNotes = async () => {
    try {
      setError(null);
      const rows = await db.query<Note>(
        "SELECT id, title, content, created_at, updated_at FROM notes ORDER BY updated_at DESC",
      );
      setNotes(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function authenticate() {
      try {
        const result = await invoke<{ success: boolean; message: string }>(
          "invoke_biometric_challenge",
          { message: "Unlock Notes" },
        );

        if (!result.success) {
          setError(result.message || "Biometric authentication failed");
          return;
        }

        await invoke("unlock_partition", { name: "notes", message: "Unlock Notes" });
        if (!cancelled) {
          setIsAuthReady(true);
          loadNotes();
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setIsLoading(false);
        }
      }
    }

    authenticate();

    return () => {
      cancelled = true;
      invoke("lock_partition", { name: "notes" }).catch(() => {});
    };
  }, []);

  const handleCreateNote = async () => {
    try {
      setError(null);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.execute(
        "INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        [id, "New Note", "", now, now],
      );
      await loadNotes();
      setSelectedNoteId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleUpdateNote = async (updates: Partial<Note>) => {
    if (!selectedNoteId) return;
    try {
      setError(null);
      const now = new Date().toISOString();
      const note = notes.find((n) => n.id === selectedNoteId);
      if (!note) return;

      const title = updates.title ?? note.title;
      const content = updates.content ?? note.content;

      await db.execute(
        "UPDATE notes SET title = ?1, content = ?2, updated_at = ?3 WHERE id = ?4",
        [title, content, now, selectedNoteId],
      );
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNoteId ? { ...n, title, content, updated_at: now } : n,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      setError(null);
      await db.execute("DELETE FROM notes WHERE id = ?1", [id]);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const backlinks = useMemo<Backlink[]>(() => {
    if (!selectedNote) return [];
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    const results: Backlink[] = [];

    for (const note of notes) {
      if (note.id === selectedNote.id) continue;
      let match;
      while ((match = linkRegex.exec(note.content)) !== null) {
        if (match[1] === selectedNote.title) {
          results.push({
            source_note_id: note.id,
            source_title: note.title,
            target_note_id: selectedNote.id,
          });
        }
      }
    }
    return results;
  }, [notes, selectedNote]);

  const graphData = useMemo(() => {
    const nodes = notes.map((n) => ({ id: n.id, label: n.title }));
    const edges: { source: string; target: string }[] = [];
    const linkRegex = /\[\[([^\]]+)\]\]/g;

    const titleToId = new Map(notes.map((n) => [n.title, n.id]));

    for (const note of notes) {
      let match;
      while ((match = linkRegex.exec(note.content)) !== null) {
        const targetTitle = match[1];
        const targetId = titleToId.get(targetTitle);
        if (targetId) {
          edges.push({ source: note.id, target: targetId });
        }
      }
    }

    return { nodes, edges };
  }, [notes]);

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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: "#f0f0f0",
              }}
            >
              Notes
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "#6b6b6b",
              }}
            >
              Linked notes
            </p>
          </div>
          <button
            onClick={handleCreateNote}
            style={{
              background: "#55b3ff",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            New
          </button>
        </div>

        <NoteList
          notes={notes}
          selectedNoteId={selectedNoteId}
          onSelect={setSelectedNoteId}
          onDelete={handleDeleteNote}
        />
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
            Authenticating...
          </div>
        ) : !isAuthReady ? (
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
            Authentication required
          </div>
        ) : selectedNote ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div
              style={{
                padding: "12px 24px",
                borderBottom: "1px solid #2e2f32",
                display: "flex",
                gap: 8,
              }}
            >
              <button
                onClick={() => setView("editor")}
                style={{
                  background: view === "editor" ? "#55b3ff" : "transparent",
                  color: view === "editor" ? "#fff" : "#6b6b6b",
                  border: "1px solid #2e2f32",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Editor
              </button>
              <button
                onClick={() => setView("graph")}
                style={{
                  background: view === "graph" ? "#55b3ff" : "transparent",
                  color: view === "graph" ? "#fff" : "#6b6b6b",
                  border: "1px solid #2e2f32",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Graph
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto" }}>
              {view === "editor" ? (
                <Editor
                  note={selectedNote}
                  onSave={handleUpdateNote}
                  backlinks={backlinks}
                />
              ) : (
                <GraphView graphData={graphData} />
              )}
            </div>
          </div>
        ) : (
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
            Select a note or create a new one
          </div>
        )}
      </div>
    </div>
  );
}
