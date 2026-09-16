import { useTimer } from "./hooks/useTimer";
import { useNotificationSound } from "./hooks/useNotificationSound";
import TimerDisplay from "./components/TimerDisplay";
import SessionControls from "./components/SessionControls";

export default function App() {
  const notificationSound = useNotificationSound();

  const timer = useTimer({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStart: false,
    onSessionComplete: (mode) => {
      console.log(`[Pomodoro] Session complete: ${mode}`);
      notificationSound.play();
    },
  });

  return (
    <div style={{ display: "flex", height: "100vh", background: "#040506" }}>
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
            Pomodoro
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: "#6b6b6b",
            }}
          >
            Focus timer
          </p>
        </div>

        <div
          style={{
            padding: "16px 20px",
            fontSize: 13,
            color: "#6b6b6b",
            lineHeight: 1.5,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: "#ff5f5f" }}>●</span> Work: 25 min
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: "#4ade80" }}>●</span> Short break: 5 min
          </div>
          <div>
            <span style={{ color: "#55b3ff" }}>●</span> Long break: 15 min
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <TimerDisplay
          mode={timer.mode}
          timeLeft={timer.timeLeft}
          sessionsCompleted={timer.sessionsCompleted}
        />
        <SessionControls
          isRunning={timer.isRunning}
          onStart={timer.start}
          onPause={timer.pause}
          onReset={timer.reset}
          onSkip={timer.skip}
        />
      </div>
    </div>
  );
}
