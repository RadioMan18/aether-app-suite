import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandInput } from "./CommandInput";
import { CommandResults } from "./CommandResults";
import { useCommandPalette } from "@/hooks/useCommandPalette";

interface CommandPaletteProps {
  activePluginId: string | null;
  sidebarOpen: boolean;
  setActivePluginId: (pluginId: string | null) => void;
  toggleSidebar: () => void;
}

export function CommandPalette({
  activePluginId,
  sidebarOpen,
  setActivePluginId,
  toggleSidebar,
}: CommandPaletteProps) {
  const selectedRef = useRef(0);
  const {
    isOpen,
    close,
    query,
    setQuery,
    results,
    selectedIndex,
    setSelectedIndex,
    executeSelected,
    executeByIndex,
  } = useCommandPalette({
    activePluginId,
    sidebarOpen,
    setActivePluginId,
    toggleSidebar,
  });

  useEffect(() => {
    selectedRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = Math.min(selectedRef.current + 1, results.length - 1);
        setSelectedIndex(next);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        const next = Math.max(selectedRef.current - 1, 0);
        setSelectedIndex(next);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        executeSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results.length, setSelectedIndex, executeSelected]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-xl overflow-hidden rounded-lg border border-aether-border bg-aether-surface shadow-2xl"
          >
            <CommandInput query={query} onQueryChange={setQuery} />
            <CommandResults
              results={results}
              selectedIndex={selectedIndex}
              onSelect={executeByIndex}
              onHover={setSelectedIndex}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
