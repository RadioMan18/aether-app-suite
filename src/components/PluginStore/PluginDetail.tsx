import { motion } from "framer-motion";
import { X, Download, Trash2, RefreshCw, Star, Shield } from "lucide-react";
import { Badge } from "@/lib/design-system/components";
import type { StoreItem } from "@/types/plugin-store";

interface PluginDetailProps {
  item: StoreItem;
  onClose: () => void;
  onInstall: () => void;
  onUninstall: () => void;
}

export function PluginDetail({ item, onClose, onInstall, onUninstall }: PluginDetailProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex h-full flex-col"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-text-primary">Plugin Details</h2>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text-primary"
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        <div className="flex items-center gap-4">
          <span className="text-4xl" role="img" aria-label={item.name}>
            {item.icon}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{item.name}</h3>
            <p className="text-sm text-text-secondary">
              v{item.version} by {item.author}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-text-secondary">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span>{item.rating}</span>
          </div>
          <span className="text-sm text-text-muted">
            {item.downloads.toLocaleString()} downloads
          </span>
          <Badge variant="secondary" className="capitalize">
            {item.category.replace("-", " ")}
          </Badge>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-text-primary">Description</h4>
          <p className="mt-1.5 text-sm text-text-secondary">{item.description}</p>
        </div>

        {item.changelog && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-text-primary">What&apos;s New</h4>
            <p className="mt-1.5 text-sm text-text-secondary">{item.changelog}</p>
          </div>
        )}

        <div className="mt-6">
          <h4 className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Shield className="h-4 w-4 text-text-muted" />
            Permissions
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.permissions.map((perm) => (
              <Badge key={perm} variant="secondary">
                {perm}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border px-5 py-4">
        {item.installed ? (
          <div className="flex items-center gap-3">
            {item.updateAvailable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("[PluginDetail] Update click:", item.id);
                  onInstall();
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas transition-colors duration-150 hover:bg-accent-hover"
              >
                <RefreshCw className="h-4 w-4" />
                Update Plugin
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log("[PluginDetail] Uninstall click:", item.id);
                onUninstall();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger/10 px-4 py-2 text-sm font-medium text-danger transition-colors duration-150 hover:bg-danger/20"
            >
              <Trash2 className="h-4 w-4" />
              Uninstall
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log("[PluginDetail] Install click:", item.id);
              onInstall();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas transition-colors duration-150 hover:bg-accent-hover"
          >
            <Download className="h-4 w-4" />
            Install Plugin
          </button>
        )}
      </div>
    </motion.div>
  );
}
