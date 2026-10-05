import { motion, AnimatePresence } from "framer-motion";
import { PluginSandbox } from "@/components/PluginSandbox";
import type { PluginManifest } from "@/types/plugin";

function pluginUrl(pluginId: string) {
  if (import.meta.env.DEV) {
    return `http://localhost:1420/plugins/${pluginId}/dist/index.html`;
  }
  return `plugin://localhost/${pluginId}/index.html`;
}

interface MainContentProps {
  activePlugin: PluginManifest | null;
}

const MotionDiv = motion.div as React.ComponentType<
  React.HTMLAttributes<HTMLDivElement> & {
    initial?: { opacity: number; y?: number };
    animate?: { opacity: number; y?: number };
    exit?: { opacity: number; y?: number };
    transition?: { duration: number; ease: string };
  }
>;

export function MainContent({ activePlugin }: MainContentProps) {
  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto scrollbar-thin bg-aether-bg">
      <AnimatePresence mode="wait">
        {activePlugin ? (
          <MotionDiv
            key={activePlugin.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex h-full w-full flex-col"
          >
            <div className="flex items-center gap-3 border-b border-aether-border px-6 py-4">
              <span className="text-2xl" role="img" aria-label={activePlugin.name}>
                {activePlugin.icon}
              </span>
              <div>
                <h1 className="text-xl font-semibold text-aether-text">{activePlugin.name}</h1>
                <p className="text-sm text-aether-text-muted">v{activePlugin.version}</p>
              </div>
            </div>
            <div className="min-h-0 min-w-0 flex-1 p-6">
              {activePlugin.sandboxed ? (
                <div className="h-full min-h-[480px] w-full overflow-hidden rounded-lg border border-aether-border">
                  <PluginSandbox
                    src={pluginUrl(activePlugin.id)}
                    title={activePlugin.name}
                    plugin={activePlugin}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-aether-border bg-aether-surface p-6">
                  <p className="text-aether-text-muted">
                    Plugin content for <span className="font-medium text-aether-text">{activePlugin.name}</span> will be
                    rendered here.
                  </p>
                </div>
              )}
            </div>
          </MotionDiv>
        ) : (
          <MotionDiv
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-full items-center justify-center"
          >
            <div className="text-center">
              <h1 className="mb-2 text-2xl font-semibold text-aether-text">Welcome to Nidus</h1>
              <p className="text-aether-text-muted">Select a plugin from the Activity Bar to get started.</p>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </main>
  );
}
