const modeColors: Record<string, string> = {
  work: "#ff5f5f",
  shortBreak: "#4ade80",
  longBreak: "#55b3ff",
};

const modeLabels: Record<string, string> = {
  work: "Focus Time",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

export default function TimerDisplay({
  mode,
  timeLeft,
  sessionsCompleted,
}: {
  mode: string;
  timeLeft: number;
  sessionsCompleted: number;
}) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div
        style={{
          fontSize: 14,
          color: "#6b6b6b",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {modeLabels[mode] || mode}
      </div>
      <div
        style={{
          fontSize: 96,
          fontWeight: 200,
          color: modeColors[mode] || "#f0f0f0",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {timeString}
      </div>
      <div style={{ fontSize: 13, color: "#6b6b6b", marginTop: 8 }}>
        Sessions completed: {sessionsCompleted}
      </div>
    </div>
  );
}
