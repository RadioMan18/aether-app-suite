import { cn } from "@/lib/utils";
import type { PluginManifest } from "@/types/plugin";

interface ActivityBarProps {
  plugins: PluginManifest[];
  activePluginId: string | null;
  onPluginSelect: (pluginId: string) => void;
}

export function ActivityBar({ plugins, activePluginId, onPluginSelect }: ActivityBarProps) {
  return (
    <aside className="flex h-full w-[var(--activity-bar-width)] flex-col items-center border-r border-border bg-surface-1 py-3">
      <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <span className="text-lg font-bold">A</span>
      </div>

      <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto scrollbar-thin">
        {plugins.map((plugin) => {
          const isActive = activePluginId === plugin.id;
          return (
            <button
              key={plugin.id}
              title={plugin.name}
              onClick={() => onPluginSelect(plugin.id)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:bg-surface-2 hover:text-text-primary"
              )}
            >
              <span className="text-xl" role="img" aria-label={plugin.name}>
                {plugin.icon}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
