import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCalendarEvents } from "../src/hooks/useCalendarEvents";

describe("useCalendarEvents", () => {
  it("starts in loading state", () => {
    const { result } = renderHook(() => useCalendarEvents());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.events).toEqual([]);
  });

  it("exposes reload", () => {
    const { result } = renderHook(() => useCalendarEvents());
    expect(typeof result.current.reload).toBe("function");
  });
});
