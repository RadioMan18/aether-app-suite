import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKanbanBoard } from "../src/hooks/useKanbanBoard";

describe("useKanbanBoard", () => {
  it("starts in loading state", () => {
    const { result } = renderHook(() => useKanbanBoard());
    expect(result.current.isLoading).toBe(true);
  });

  it("exposes columns and saveColumn", () => {
    const { result } = renderHook(() => useKanbanBoard());
    expect(Array.isArray(result.current.columns)).toBe(true);
    expect(typeof result.current.saveColumn).toBe("function");
  });
});
