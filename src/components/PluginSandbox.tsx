import { useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PluginManifest } from "@/types/plugin";

interface PluginSandboxProps {
  src: string;
  title: string;
  plugin: PluginManifest;
}

export function PluginSandbox({ src, title, plugin }: PluginSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => console.info(`[PluginSandbox] loaded ${src}`);
    const handleError = () => console.error(`[PluginSandbox] failed to load ${src}`);
    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);

    const handleMessage = async (event: MessageEvent) => {
      const message = event.data;
      if (!message || typeof message !== "object") return;
      if (message.type === "nidus:plugin-mounted") {
        console.info(`[PluginSandbox:${plugin.id}] React root mounted`, message.details);
        return;
      }
      if (message.type === "nidus:plugin-error") {
        console.error(`[PluginSandbox:${plugin.id}]`, message.error);
        return;
      }
      if (message.type !== "nidus:request") return;

      const { requestId, payload } = message;

      try {
        const response = await invoke<PluginResponse>("plugin_ipc", {
          plugin_id: plugin.id,
          request: {
            id: requestId,
            plugin_id: plugin.id,
            request_type: payload.type,
            payload: payload.params || {},
          },
        });

        iframe.contentWindow?.postMessage(
          {
            type: "nidus:response",
            requestId,
            result: response,
          },
          "*"
        );
      } catch (error) {
        iframe.contentWindow?.postMessage(
          {
            type: "nidus:response",
            requestId,
            error: error instanceof Error ? error.message : String(error),
          },
          "*"
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
      window.removeEventListener("message", handleMessage);
    };
  }, [plugin.id, src]);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={title}
      sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation-to-custom-protocols"
      className="block h-full min-h-[480px] min-w-full w-full border-0 bg-aether-bg"
      allow="clipboard-write"
    />
  );
}

interface PluginResponse {
  id: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}
