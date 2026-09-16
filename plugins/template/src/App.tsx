import { useEffect, useState } from "react";

export function App() {
  const [status, setStatus] = useState("Initializing...");
  const [tables, setTables] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setStatus("Querying database...");

        // Dynamically import SDK to avoid bundling issues in template
        const { db } = await import("../sdk/src/index.ts");

        const result = await db.query<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'");
        
        if (mounted) {
          setTables(result.map((row) => row.name));
          setError(null);
          setStatus("Connected");
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : String(e));
          setStatus("Error");
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, marginBottom: 16 }}>Nidus Plugin Template</h1>
      <div style={{ marginBottom: 16 }}>
        <span style={{ color: "#6b6b6b" }}>Status: </span>
        <span style={{ color: status === "Connected" ? "#5fc992" : status === "Error" ? "#ff5f5f" : "#f0f0f0" }}>
          {status}
        </span>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#2a1515", border: "1px solid #5f2a2a", borderRadius: 6, marginBottom: 16 }}>
          <div style={{ color: "#ff5f5f", fontSize: 14, marginBottom: 4 }}>Error</div>
          <div style={{ color: "#a0a0a0", fontSize: 12 }}>{error}</div>
        </div>
      )}

      {tables.length > 0 && (
        <div>
          <h2 style={{ fontSize: 14, marginBottom: 8, color: "#a0a0a0" }}>Database Tables</h2>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
            {tables.map((table) => (
              <li key={table}>{table}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
