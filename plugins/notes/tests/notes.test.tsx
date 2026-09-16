import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotes } from "../src/hooks/useNotes";

describe("useNotes", () => {
  it("starts in loading state", () => {
    const { result } = renderHook(() => useNotes());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.notes).toEqual([]);
  });

  it("exposes create and delete actions", () => {
    const { result } = renderHook(() => useNotes());
    expect(typeof result.current.createNote).toBe("function");
    expect(typeof result.current.deleteNote).toBe("function");
  });
});
