import { Badge } from "@/lib/design-system/components";
import { Download, Trash2, RefreshCw, Star } from "lucide-react";
import type { StoreItem } from "@/types/plugin-store";

interface PluginCardProps {
  item: StoreItem;
  onSelect: () => void;
  onInstall: () => void;
  onUninstall: () => void;
  isSelected: boolean;
}

export function PluginCard({ item, onSelect, onInstall, onUninstall, isSelected }: PluginCardProps) {
  return (
    <div
      onClick={onSelect}
      className={[
        "group flex cursor-pointer flex-col rounded-lg border bg-surface-1 p-4 transition-all duration-150",
        isSelected
          ? "border-accent ring-1 ring-accent"
          : "border-border hover:border-text-muted/30 hover:bg-surface-2",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label={item.name}>
            {item.icon}
          </span>
          <div>
            <h3 className="text-sm font-medium text-text-primary">{item.name}</h3>
            <p className="text-xs text-text-muted">v{item.version} by {item.author}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-text-secondary">
          <Star className="h-3 w-3 fill-warning text-warning" />
          <span>{(item.rating ?? 0).toFixed(1)}</span>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-text-secondary">{item.description}</p>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {item.category.replace("-", " ")}
          </Badge>
          <span className="text-xs text-text-muted">
            {(item.downloads ?? 0).toLocaleString()} downloads
          </span>
        </div>

        <div className="flex items-center gap-2">
          {item.installed ? (
            <>
              {item.updateAvailable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("[PluginCard] Update click:", item.id);
                    onInstall();
                  }}
                  className="flex items-center gap-1.5 rounded-md bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent transition-colors duration-150 hover:bg-accent/20"
                >
                  <RefreshCw className="h-3 w-3" />
                  Update
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("[PluginCard] Remove click:", item.id);
                  onUninstall();
                }}
                className="flex items-center gap-1.5 rounded-md bg-danger/10 px-2.5 py-1.5 text-xs font-medium text-danger transition-colors duration-150 hover:bg-danger/20"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log("[PluginCard] Install click:", item.id);
                onInstall();
              }}
              className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-canvas transition-colors duration-150 hover:bg-accent-hover"
            >
              <Download className="h-3 w-3" />
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
