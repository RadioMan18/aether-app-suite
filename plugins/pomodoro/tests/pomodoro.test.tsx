import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimer } from "../src/hooks/useTimer";

describe("useTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("starts with work mode and correct time", () => {
    const { result } = renderHook(() => useTimer({ workDuration: 25 }));
    expect(result.current.mode).toBe("work");
    expect(result.current.timeLeft).toBe(25 * 60);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.sessionsCompleted).toBe(0);
  });

  it("counts down when running", async () => {
    const { result } = renderHook(() => useTimer({ workDuration: 1 }));
    act(() => {
      result.current.start();
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.timeLeft).toBe(59);
    expect(result.current.isRunning).toBe(true);
  });

  it("pauses the timer", async () => {
    const { result } = renderHook(() => useTimer({ workDuration: 1 }));
    act(() => {
      result.current.start();
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      result.current.pause();
    });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.timeLeft).toBe(59);
  });

  it("resets to initial state", async () => {
    const { result } = renderHook(() => useTimer({ workDuration: 1 }));
    act(() => {
      result.current.start();
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.mode).toBe("work");
    expect(result.current.timeLeft).toBe(60);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.sessionsCompleted).toBe(0);
  });

  it("transitions to short break after work session", async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useTimer({
        workDuration: 1,
        shortBreakDuration: 2,
        longBreakDuration: 3,
        longBreakInterval: 4,
        autoStart: false,
        onSessionComplete: onComplete,
      }),
    );

    act(() => {
      result.current.start();
    });
    await act(async () => {
      vi.advanceTimersByTime(60 * 1000);
    });

    expect(result.current.mode).toBe("shortBreak");
    expect(result.current.timeLeft).toBe(2 * 60);
    expect(result.current.sessionsCompleted).toBe(1);
    expect(result.current.isRunning).toBe(false);
    expect(onComplete).toHaveBeenCalledWith("work");
  });

  it("transitions to long break after longBreakInterval sessions", async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useTimer({
        workDuration: 1,
        shortBreakDuration: 2,
        longBreakDuration: 3,
        longBreakInterval: 2,
        autoStart: false,
        onSessionComplete: onComplete,
      }),
    );

    act(() => {
      result.current.start();
    });

    await act(async () => {
      vi.advanceTimersByTime(60 * 1000);
    });
    expect(result.current.mode).toBe("shortBreak");
    expect(result.current.timeLeft).toBe(2 * 60);
    expect(result.current.sessionsCompleted).toBe(1);

    act(() => {
      result.current.skip();
    });
    expect(result.current.mode).toBe("work");
    expect(result.current.timeLeft).toBe(1 * 60);
    expect(result.current.sessionsCompleted).toBe(1);

    act(() => {
      result.current.start();
    });

    await act(async () => {
      vi.advanceTimersByTime(60 * 1000);
    });
    expect(result.current.mode).toBe("longBreak");
    expect(result.current.timeLeft).toBe(3 * 60);
    expect(result.current.sessionsCompleted).toBe(2);
    expect(onComplete).toHaveBeenCalledWith("work");
  });

  it("skips the current session", async () => {
    const { result } = renderHook(() => useTimer({ workDuration: 1, shortBreakDuration: 2 }));
    act(() => {
      result.current.start();
    });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.timeLeft).toBe(60);

    act(() => {
      result.current.skip();
    });
    expect(result.current.mode).toBe("shortBreak");
    expect(result.current.timeLeft).toBe(2 * 60);
  });
});
