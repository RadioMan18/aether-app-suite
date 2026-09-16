import { useEffect, useState } from "react";
import { db } from "../../../sdk/src/index.ts";
import type { Note } from "../App";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    loadNotes();
  }, []);

  const createNote = async () => {
    try {
      setError(null);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.execute(
        "INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        [id, "New Note", "", now, now],
      );
      await loadNotes();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const deleteNote = async (id: string) => {
    try {
      setError(null);
      await db.execute("DELETE FROM notes WHERE id = ?1", [id]);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return { notes, isLoading, error, createNote, deleteNote, reload: loadNotes };
}
