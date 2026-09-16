const buttonBase: Record<string, string | number> = {
  border: "none",
  borderRadius: 8,
  padding: "10px 24px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  color: "#fff",
};

export default function SessionControls({
  isRunning,
  onStart,
  onPause,
  onReset,
  onSkip,
}: {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", padding: "0 20px 40px" }}>
      {!isRunning ? (
        <button onClick={onStart} style={{ ...buttonBase, background: "#4ade80" }}>
          Start
        </button>
      ) : (
        <button onClick={onPause} style={{ ...buttonBase, background: "#facc15" }}>
          Pause
        </button>
      )}
      <button onClick={onReset} style={{ ...buttonBase, background: "#6b6b6b" }}>
        Reset
      </button>
      <button onClick={onSkip} style={{ ...buttonBase, background: "#55b3ff" }}>
        Skip
      </button>
    </div>
  );
}
