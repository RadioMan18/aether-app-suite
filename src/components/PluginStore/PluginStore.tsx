import { useMemo } from "react";
import { Input } from "@/lib/design-system/components";
import { Search } from "lucide-react";
import { usePluginStore } from "@/hooks/usePluginStore";
import type { StoreItem, StoreCategory, StoreTab } from "@/types/plugin-store";
import { PluginCard } from "./PluginCard";
import { PluginDetail } from "./PluginDetail";

const CATEGORIES: { value: StoreCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "productivity", label: "Productivity" },
  { value: "security", label: "Security" },
  { value: "integration", label: "Integration" },
  { value: "developer-tools", label: "Developer Tools" },
];

const TABS: { value: StoreTab; label: string }[] = [
  { value: "discover", label: "Discover" },
  { value: "installed", label: "Installed" },
  { value: "updates", label: "Updates" },
];

interface PluginStoreProps {
  items: StoreItem[];
  installPlugin: (item: StoreItem) => Promise<void>;
  uninstallPlugin: (id: string) => Promise<void>;
  error: string | null;
}

export function PluginStore({ items, installPlugin, uninstallPlugin, error }: PluginStoreProps) {
  console.log("[PluginStore] render, items:", items.map((i) => i.id + ":" + i.installed).join(","));

  const {
    query,
    setQuery,
    category,
    setCategory,
    tab,
    setTab,
    filteredItems,
    selectedItem,
    setSelectedItem,
  } = usePluginStore(items);

  const updatesCount = useMemo(
    () => items.filter((item) => item.updateAvailable).length,
    [items]
  );

  const handleInstall = async (id: string) => {
    console.log("[PluginStore] handleInstall:", id);
    const item = items.find((i) => i.id === id);
    if (!item) return;

    try {
      await installPlugin(item);
    } catch {
      // error handled by hook
    }
  };

  const handleUninstall = async (id: string) => {
    console.log("[PluginStore] handleUninstall:", id);
    try {
      await uninstallPlugin(id);
    } catch {
      // error handled by hook
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-aether-border px-6 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-aether-text">Plugin Store</h1>
            <p className="text-sm text-aether-text-muted">
              Discover and manage plugins for Nidus
            </p>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aether-text-muted" />
            <Input
              type="search"
              placeholder="Search plugins..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={[
                  "rounded-md px-3 py-1.5 text-sm transition-colors duration-150",
                  category === cat.value
                    ? "bg-aether-primary/10 text-aether-primary"
                    : "text-aether-text-muted hover:bg-surface-2 hover:text-aether-text",
                ].join(" ")}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-aether-border bg-aether-surface p-1">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={[
                  "relative rounded-md px-3 py-1.5 text-sm transition-colors duration-150",
                  t.value === tab
                    ? "text-aether-text"
                    : "text-aether-text-muted hover:text-aether-text",
                ].join(" ")}
              >
                {t.label}
                {t.value === "updates" && updatesCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-aether-primary px-1.5 py-0.5 text-xs text-aether-bg">
                    {updatesCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {error && (
            <div className="mb-4 rounded-lg border border-aether-error/30 bg-aether-error/10 px-4 py-3 text-sm text-aether-error">
              {error}
            </div>
          )}
          {filteredItems.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-aether-text">No plugins found</p>
                <p className="mt-1 text-sm text-aether-text-muted">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <PluginCard
                  key={item.id}
                  item={item}
                  onSelect={() => setSelectedItem(item)}
                  onInstall={() => handleInstall(item.id)}
                  onUninstall={() => handleUninstall(item.id)}
                  isSelected={selectedItem?.id === item.id}
                />
              ))}
            </div>
          )}
        </div>

        {selectedItem && (
          <div className="w-96 border-l border-aether-border bg-aether-surface overflow-y-auto scrollbar-thin">
            <PluginDetail
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onInstall={() => handleInstall(selectedItem.id)}
              onUninstall={() => handleUninstall(selectedItem.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
