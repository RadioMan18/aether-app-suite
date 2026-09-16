import { useEffect, useRef, useCallback, useState } from "react";

export type TimerMode = "work" | "shortBreak" | "longBreak";

export interface TimerOptions {
  workDuration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  longBreakInterval?: number;
  autoStart?: boolean;
  onSessionComplete?: (mode: TimerMode) => void;
}

export interface TimerState {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  sessionsCompleted: number;
}

export function useTimer(options: TimerOptions = {}): TimerState & {
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
} {
  const {
    workDuration = 25,
    shortBreakDuration = 5,
    longBreakDuration = 15,
    longBreakInterval = 4,
    autoStart = false,
    onSessionComplete,
  } = options;

  const [state, setState] = useState<TimerState>(() => ({
    mode: "work",
    timeLeft: workDuration * 60,
    isRunning: false,
    sessionsCompleted: 0,
  }));

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const transition = useCallback(
    (prev: TimerState): TimerState => {
      const nextMode =
        prev.mode === "work"
          ? prev.sessionsCompleted + 1 >= longBreakInterval
            ? "longBreak"
            : "shortBreak"
          : "work";

      const nextSessions = prev.mode === "work" ? prev.sessionsCompleted + 1 : prev.sessionsCompleted;

      const nextDuration =
        nextMode === "work"
          ? workDuration
          : nextMode === "shortBreak"
            ? shortBreakDuration
            : longBreakDuration;

      onSessionComplete?.(prev.mode);

      return {
        mode: nextMode,
        timeLeft: nextDuration * 60,
        isRunning: autoStart,
        sessionsCompleted: nextSessions,
      };
    },
    [workDuration, shortBreakDuration, longBreakDuration, longBreakInterval, autoStart, onSessionComplete],
  );

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.timeLeft <= 1) {
        return transition(prev);
      }
      return { ...prev, timeLeft: prev.timeLeft - 1 };
    });
  }, [transition]);

  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [state.isRunning, tick, clearTimer]);

  const start = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setState({
      mode: "work",
      timeLeft: workDuration * 60,
      isRunning: false,
      sessionsCompleted: 0,
    });
  }, [workDuration, clearTimer]);

  const skip = useCallback(() => {
    setState((prev) => {
      if (prev.timeLeft <= 1) {
        return prev;
      }
      return transition(prev);
    });
  }, [transition]);

  return {
    ...state,
    start,
    pause,
    reset,
    skip,
  };
}
