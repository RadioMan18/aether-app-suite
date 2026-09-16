import { useState, useEffect, useMemo } from "react";
import { Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function CustomTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const windowRef = useMemo(() => {
    try {
      return getCurrentWindow();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!windowRef) return;

    let unlisten: (() => void) | undefined;

    const setup = async () => {
      try {
        const maximized = await windowRef.isMaximized();
        setIsMaximized(maximized);
      } catch {
        // ignore during web-only dev
      }

      unlisten = await windowRef.onResized(() => {
        windowRef.isMaximized().then(setIsMaximized).catch(() => {});
      });
    };

    setup();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [windowRef]);

  const handleMinimize = async () => {
    if (!windowRef) return;
    await windowRef.minimize();
  };

  const handleMaximize = async () => {
    if (!windowRef) return;
    if (isMaximized) {
      await windowRef.unmaximize();
    } else {
      await windowRef.maximize();
    }
  };

  const handleClose = async () => {
    if (!windowRef) return;
    try {
      await windowRef.close();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  };

  return (
    <div
      data-tauri-drag-region
      className="flex h-8 w-full select-none items-center justify-between border-b border-border bg-surface-1"
    >
      <div className="flex items-center gap-2 px-3" data-tauri-drag-region>
        <span className="text-sm font-medium text-text-primary">Nidus</span>
      </div>

      <div className="flex items-center">
        <button
          onClick={handleMinimize}
          className="flex h-8 w-10 items-center justify-center text-text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text-primary"
          aria-label="Minimize"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="flex h-8 w-10 items-center justify-center text-text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text-primary"
          aria-label={isMaximized ? "Restore" : "Maximize"}
        >
          <Square className="h-3 w-3" />
        </button>
        <button
          onClick={handleClose}
          className="flex h-8 w-10 items-center justify-center text-text-muted transition-colors duration-150 hover:bg-danger hover:text-white"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
