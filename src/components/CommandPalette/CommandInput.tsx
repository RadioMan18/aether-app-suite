import { Search } from "lucide-react";

interface CommandInputProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function CommandInput({ query, onQueryChange }: CommandInputProps) {
  return (
    <div className="flex items-center gap-3 border-b border-aether-border px-4 py-3">
      <Search className="h-4 w-4 shrink-0 text-aether-text-muted" />
      <input
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Type a command or search..."
        className="flex-1 bg-transparent text-sm text-aether-text placeholder:text-aether-text-muted outline-none"
        autoFocus
      />
      <kbd className="hidden rounded border border-aether-border bg-surface-2 px-1.5 py-0.5 text-xs text-aether-text-muted md:inline-block">
        ESC
      </kbd>
    </div>
  );
}
