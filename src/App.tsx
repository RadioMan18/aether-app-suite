import { useMemo, useEffect, useState } from "react";
import { ActivityBar } from "@/components/Shell/ActivityBar";
import { Sidebar } from "@/components/Shell/Sidebar";
import { MainContent } from "@/components/Shell/MainContent";
import { StatusBar } from "@/components/Shell/StatusBar";
import { CommandPalette } from "@/components/CommandPalette/CommandPalette";
import { CustomTitleBar } from "@/components/Shell/CustomTitleBar";
import { PluginStore } from "@/components/PluginStore/PluginStore";
import { useShellState } from "@/hooks/useShellState";
import type { PluginManifest } from "@/types/plugin";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { usePluginManager } from "@/hooks/usePluginManager";

const MOCK_PLUGINS: PluginManifest[] = [
  {
    id: "journal",
    name: "Journal",
    version: "1.0.0",
    icon: "📓",
    ui: { activityBar: true, sidebarSection: "Journal" },
    permissions: ["db:read", "db:write"],
    sandboxed: true,
    builtin: true,
  },
  {
    id: "todo",
    name: "Todo List",
    version: "1.0.0",
    icon: "✅",
    ui: { activityBar: true, sidebarSection: "Todo" },
    permissions: ["db:read", "db:write"],
    sandboxed: true,
    builtin: true,
  },
  {
    id: "goals",
    name: "Goals",
    version: "1.0.0",
    icon: "🎯",
    ui: { activityBar: true, sidebarSection: "Goals" },
    permissions: ["db:read", "db:write"],
    sandboxed: true,
    builtin: true,
  },
  {
    id: "plugin-store",
    name: "Plugin Store",
    version: "1.0.0",
    icon: "🧩",
    ui: { activityBar: true },
    permissions: [],
    builtin: true,
  },
];

function App() {
  const shell = useShellState(MOCK_PLUGINS);
  const { catalogItems, installedPlugins, installPlugin, uninstallPlugin, error } = usePluginManager();
  const [clipboardStreaming, setClipboardStreaming] = useState(false);
  const [visiblePlugins, setVisiblePlugins] = useState<PluginManifest[]>([...MOCK_PLUGINS]);

  useEffect(() => {
    const installedIds = new Set(installedPlugins.map((p) => p.id));
    const catalogMap = new Map(catalogItems.map((item) => [item.id, item]));
    const plugins: PluginManifest[] = [...MOCK_PLUGINS];

    for (const id of installedIds) {
      if (!plugins.some((p) => p.id === id)) {
        const catalogItem = catalogMap.get(id);
        if (catalogItem) {
          plugins.push({
            id: catalogItem.id,
            name: catalogItem.name,
            version: catalogItem.version,
            icon: catalogItem.icon,
            ui: { activityBar: true },
            sandboxed: true,
          });
        }
      }
    }

    setVisiblePlugins(plugins);
  }, [installedPlugins, catalogItems]);

  useEffect(() => {
    const seed = async () => {
      try {
        await invoke("ensure_database");
        await invoke("seed_builtin_plugins");
        await invoke("start_clipboard_streaming");

        const unlisten = await listen("clipboard:changed", () => {
          setClipboardStreaming(true);
        });

        return unlisten;
      } catch {
        return undefined;
      }
    };

    const unlistenPromise = seed();

    return () => {
      unlistenPromise.then((unlisten) => {
        if (unlisten) unlisten();
      });
    };
  }, []);

  useEffect(() => {
    const plugin = visiblePlugins.find((plugin) => plugin.id === shell.activePluginId);
    const hasPermission = plugin?.permissions?.includes("clipboard:subscribe") ?? false;
    invoke("set_active_clipboard_plugin", {
      pluginId: hasPermission ? shell.activePluginId : null,
    }).catch(() => {
      // ignore clipboard backend errors
    });
  }, [shell.activePluginId, visiblePlugins]);

  const activePlugin = useMemo(
    () => visiblePlugins.find((plugin) => plugin.id === shell.activePluginId) ?? null,
    [shell.activePluginId, visiblePlugins]
  );

  const storeItems = catalogItems.length > 0 ? catalogItems : [];
  console.log("[App] render storeItems:", storeItems.map((i) => i.id + ":" + i.installed).join(","));

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-aether-bg text-aether-text">
      <CustomTitleBar />
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar
          key={visiblePlugins.map((p) => p.id).join(",")}
          plugins={visiblePlugins}
          activePluginId={shell.activePluginId}
          onPluginSelect={shell.setActivePluginId}
        />
        <Sidebar
          isOpen={shell.sidebarOpen}
          isCompact={shell.isCompact}
          onToggle={shell.toggleSidebar}
          onPluginSelect={shell.setActivePluginId}
          activePluginId={shell.activePluginId}
          plugins={visiblePlugins}
        />
        {activePlugin?.id === "plugin-store" ? (
          <PluginStore
            key={storeItems.map((i) => i.id + ":" + i.installed).join(",")}
            items={storeItems}
            installPlugin={installPlugin}
            uninstallPlugin={uninstallPlugin}
            error={error}
          />
        ) : (
          <MainContent activePlugin={activePlugin} />
        )}
      </div>
      <StatusBar shell={shell} clipboardStreaming={clipboardStreaming} />
      <CommandPalette
        activePluginId={shell.activePluginId}
        sidebarOpen={shell.sidebarOpen}
        setActivePluginId={shell.setActivePluginId}
        toggleSidebar={shell.toggleSidebar}
      />
    </div>
  );
}

export default App;
