import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { StoreCategory } from "@/types/plugin-store";

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  permissions: string[];
  installed_at: string;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  version: string;
  category: StoreCategory;
  rating: number;
  downloads: number;
  author: string;
  permissions: string[];
  installed: boolean;
  updateAvailable: boolean;
  downloadUrl: string;
  checksum: string;
  changelog?: string;
}

const CATALOG_URL = "https://raw.githubusercontent.com/RadioMan18/nidus-app-plugins/main/catalog.json";
const CACHE_KEY = "nidus-plugin-cache";
const CACHE_TTL_MS = 5 * 60 * 1000;

function semverCompare(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(hash);
  return "sha256:" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.slice().buffer as ArrayBuffer;
}

interface CachedCatalog {
  items: StoreItem[];
  fetchedAt: number;
}

export interface UsePluginManagerResult {
  catalogItems: StoreItem[];
  installedPlugins: PluginInfo[];
  installPlugin: (item: StoreItem) => Promise<void>;
  uninstallPlugin: (id: string) => Promise<void>;
  refreshPlugins: () => Promise<void>;
  refreshCatalog: () => Promise<StoreItem[]>;
  isLoading: boolean;
  error: string | null;
}

export function usePluginManager(): UsePluginManagerResult {
  const [rawCatalogItems, setRawCatalogItems] = useState<StoreItem[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<PluginInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogItems, setCatalogItems] = useState<StoreItem[]>([]);

  const refreshPlugins = useCallback(async () => {
    console.log("[PluginManager] refreshPlugins start");
    setIsLoading(true);
    setError(null);
    try {
      const plugins = await invoke<PluginInfo[]>("list_plugins");
      console.log("[PluginManager] refreshPlugins complete:", plugins.map((p) => p.id).join(","));
      setInstalledPlugins(plugins);
    } catch (e) {
      console.error("[PluginManager] refreshPlugins error:", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCatalog = useCallback(async (): Promise<StoreItem[]> => {
    console.log("[PluginManager] fetchCatalog start");
    setError(null);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed: CachedCatalog = JSON.parse(cached);
          if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
            console.log("[PluginManager] fetchCatalog cache hit");
            return parsed.items;
          }
        } catch {
          localStorage.removeItem(CACHE_KEY);
        }
      }

      const responseBase64 = await invoke<string>("fetch_remote_catalog", {
        url: CATALOG_URL,
      });
      const buffer = toArrayBuffer(decodeBase64(responseBase64));
      const text = new TextDecoder().decode(buffer);
      const data = JSON.parse(text);
      const items: StoreItem[] = data.plugins ?? [];
      localStorage.setItem(CACHE_KEY, JSON.stringify({ items, fetchedAt: Date.now() }));
      console.log("[PluginManager] fetchCatalog complete:", items.length, "items");
      return items;
    } catch (e) {
      console.error("[PluginManager] fetchCatalog error:", e);
      setError(e instanceof Error ? e.message : String(e));
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed: CachedCatalog = JSON.parse(cached);
          return parsed.items;
        } catch {
          return [];
        }
      }
      return [];
    }
  }, []);

  const refreshCatalog = useCallback(async (): Promise<StoreItem[]> => {
    console.log("[PluginManager] refreshCatalog start");
    setIsLoading(true);
    try {
      const items = await fetchCatalog();
      console.log("[PluginManager] refreshCatalog complete:", items.length, "raw items");
      setRawCatalogItems(items);
      return items;
    } finally {
      setIsLoading(false);
    }
  }, [fetchCatalog]);

  useEffect(() => {
    const installedMap = new Map(installedPlugins.map((p) => [p.id, p]));
    const merged = rawCatalogItems.map((item) => {
      const installed = installedMap.get(item.id);
      let updateAvailable = false;
      if (installed) {
        updateAvailable = semverCompare(item.version, installed.version) > 0;
      }
      return { ...item, installed: !!installed, updateAvailable };
    });
    console.log("[PluginManager] merge effect:", merged.map((i) => i.id + ":" + i.installed).join(","));
    setCatalogItems(merged);
  }, [rawCatalogItems, installedPlugins]);

  const installPlugin = async (item: StoreItem) => {
    console.log("[PluginManager] installPlugin start:", item.id);
    setIsLoading(true);
    setError(null);
    try {
      const responseBase64 = await invoke<string>("download_plugin_zip", {
        url: item.downloadUrl,
      });
      console.log("[PluginManager] download complete, bytes:", responseBase64.length);
      const buffer = toArrayBuffer(decodeBase64(responseBase64));

      if (item.checksum) {
        const actual = await sha256(buffer);
        if (actual !== item.checksum) {
          throw new Error(`Checksum mismatch: expected ${item.checksum}, got ${actual}`);
        }
      }

      const uint8Array = new Uint8Array(buffer);
      await invoke("install_plugin", {
        id: item.id,
        name: item.name,
        version: item.version,
        permissions: item.permissions,
        zipData: Array.from(uint8Array),
        checksum: item.checksum || null,
      });
      console.log("[PluginManager] install_plugin complete");

      await refreshPlugins();
      await refreshCatalog();
      console.log("[PluginManager] installPlugin done:", item.id);
    } catch (e) {
      console.error("[PluginManager] installPlugin error:", e);
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const uninstallPlugin = async (id: string) => {
    console.log("[PluginManager] uninstallPlugin start:", id);
    setIsLoading(true);
    setError(null);
    try {
      await invoke("uninstall_plugin", { id });
      console.log("[PluginManager] uninstall_plugin complete");

      await refreshPlugins();
      await refreshCatalog();
      console.log("[PluginManager] uninstallPlugin done:", id);
    } catch (e) {
      console.error("[PluginManager] uninstallPlugin error:", e);
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [plugins, items] = await Promise.all([
          invoke<PluginInfo[]>("list_plugins"),
          fetchCatalog(),
        ]);
        if (!cancelled) {
          setInstalledPlugins(plugins);
          setRawCatalogItems(items);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchCatalog]);

  return {
    catalogItems,
    installedPlugins,
    installPlugin,
    uninstallPlugin,
    refreshPlugins,
    refreshCatalog,
    isLoading,
    error,
  };
}
