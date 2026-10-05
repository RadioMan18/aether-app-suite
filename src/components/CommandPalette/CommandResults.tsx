import { type Command } from "@/lib/commands/registry";

interface CommandResultsProps {
  results: Command[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
}

export function CommandResults({ results, selectedIndex, onSelect, onHover }: CommandResultsProps) {
  if (results.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-aether-text-muted">
        No commands found.
      </div>
    );
  }

  return (
    <div className="max-h-[50vh] overflow-y-auto scrollbar-thin p-2">
      {results.map((command, index) => (
        <button
          key={command.id}
          onClick={() => onSelect(index)}
          onMouseEnter={() => onHover(index)}
          className={[
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors duration-150",
            index === selectedIndex
              ? "bg-aether-primary/10 text-aether-text"
              : "text-aether-text-muted hover:bg-surface-2 hover:text-aether-text",
          ].join(" ")}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-2 text-lg">
            {command.icon ?? "📄"}
          </span>
          <span className="flex-1 truncate">
            <span className="block text-sm font-medium">{command.title}</span>
            {command.subtitle && (
              <span className="block text-xs text-aether-text-muted">{command.subtitle}</span>
            )}
          </span>
          {command.keybinding && (
            <kbd className="hidden rounded border border-aether-border bg-surface-2 px-1.5 py-0.5 text-xs text-aether-text-muted md:inline-block">
              {command.keybinding}
            </kbd>
          )}
        </button>
      ))}
    </div>
  );
}
