import { useMemo } from "react";
import { Input } from "@/lib/design-system/components";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PluginManifest } from "@/types/plugin";

interface SidebarProps {
  isOpen: boolean;
  isCompact: boolean;
  onToggle: () => void;
  onPluginSelect: (pluginId: string) => void;
  activePluginId: string | null;
  plugins: PluginManifest[];
}

export function Sidebar({ isOpen, isCompact, onToggle, onPluginSelect, activePluginId, plugins }: SidebarProps) {
  const sidebarContent = useMemo(() => {
    const activePlugin = plugins.find((p) => p.id === activePluginId);
    const sectionTitle = activePlugin?.ui?.sidebarSection ?? "Navigation";

    return (
      <>
        <div className="flex items-center justify-between px-3 py-3">
          <span className="text-sm font-semibold text-aether-text">{sectionTitle}</span>
          <button
            onClick={onToggle}
            className="flex h-7 w-7 items-center justify-center rounded-md text-aether-text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-aether-text"
            aria-label="Collapse sidebar"
          >
            <CollapseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2">
          <div className="mb-4">
            <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-aether-text-muted">
              Favorites
            </h3>
            <nav className="space-y-0.5">
              <SidebarItem label="Journal" icon="📓" onClick={() => onPluginSelect("journal")} />
              <SidebarItem label="Todo List" icon="✅" onClick={() => onPluginSelect("todo")} />
              <SidebarItem label="Goals" icon="🎯" onClick={() => onPluginSelect("goals")} />
            </nav>
          </div>

          <div className="mb-4">
            <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-aether-text-muted">
              Recent
            </h3>
            <nav className="space-y-0.5">
              <SidebarItem label="Morning Reflection" icon="📝" />
              <SidebarItem label="Q4 Planning" icon="📋" />
            </nav>
          </div>
        </div>
      </>
    );
  }, [activePluginId, onPluginSelect, onToggle, plugins]);

  const MotionAside = motion.aside as React.ComponentType<
    React.HTMLAttributes<HTMLElement> & {
      initial?: { width: number; opacity: number };
      animate?: { width: string; opacity: number };
      exit?: { width: number; opacity: number };
      transition?: { duration: number; ease: string };
    }
  >;

  return (
    <AnimatePresence mode="wait">
      {isOpen && !isCompact && (
        <MotionAside
          key="sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "var(--sidebar-width)", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex h-full flex-col border-r border-aether-border bg-aether-surface overflow-hidden"
        >
          <div className="flex items-center gap-2 px-3 py-3">
            <Search className="h-4 w-4 shrink-0 text-aether-text-muted" />
            <Input
              type="search"
              placeholder="Search..."
              className="h-8 border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          {sidebarContent}
        </MotionAside>
      )}
    </AnimatePresence>
  );
}

function SidebarItem({ label, icon, onClick }: { label: string; icon: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-aether-text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-aether-text"
    >
      <span className="text-base">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function CollapseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10.5 3L6 8L10.5 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
