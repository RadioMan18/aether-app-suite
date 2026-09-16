# Skill: Plugin Build

## Overview

This skill captures the lessons learned from building the Nidus plugin system, including the plugin SDK, React template, journal plugin, and the Tauri host integration. Use this as a reference when creating new plugins or extending the plugin runtime.

---

## 1. Plugin Directory Layout

Plugins live outside the host `src/` tree in a dedicated `plugins/` workspace:

```
plugins/
├── sdk/                    # Plugin SDK package
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── types.ts       # TypeScript interfaces
│       ├── bridge.ts      # postMessage bridge with correlation IDs
│       └── index.ts       # Public API: db.query, db.execute, broker.request
├── template/              # React template for new plugins
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       └── App.tsx
└── journal/               # Example plugin
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── Editor.tsx
        └── components/
            └── EntryList.tsx
```

---

## 2. Plugin Registration & Permissions

### 2.1 Registration Methods

Plugins must be registered in the SQLCipher `plugins` table before IPC works. Use one of:

| Method | Use Case |
|--------|----------|
| `seed_builtin_plugins` | Register built-in plugins (journal, todo, goals) on app startup |
| `register_plugin` | Register a single plugin dynamically |
| `install_plugin` | Register + extract plugin zip during installation |

### 2.2 Permission Format

Permissions are stored as a JSON array of strings:

```typescript
["db:read", "db:write"]
```

### 2.3 Permission Validation

The `PluginBroker` in `src-tauri/src/ipc.rs` validates permissions before executing requests:
- `db:query` requires `db:read`
- `db:execute` requires `db:write`
- `broker:request` uses custom permission logic

---

## 3. Plugin SDK Usage

### 3.1 Importing the SDK

```typescript
import { db, broker } from "../sdk/src/index.ts";
```

### 3.2 Database Queries

```typescript
// Read query
const rows = await db.query<{ id: string; name: string }>(
  "SELECT id, name FROM users WHERE id = ?1",
  [userId]
);

// Write query
const result = await db.execute(
  "INSERT INTO users (name) VALUES (?1)",
  [name]
);
```

### 3.3 Broker Requests

```typescript
const response = await broker.request<{ tasks: Task[] }>({
  targetPluginId: "todo",
  action: "list_tasks",
  payload: { filter: "active" }
});
```

---

## 4. Plugin Protocol & Serving

### 4.1 Default Serving Location

The `plugin://` URI scheme serves files from:
```
%APPDATA%/nidus/plugins/{plugin-id}/
```

### 4.2 Development Override

During development, set the `NIDUS_PLUGIN_DIR` environment variable to serve plugins from the project directory:

```bat
:: open-ui.bat
set NIDUS_PLUGIN_DIR=%~dp0plugins
npm run tauri dev
```

### 4.3 Protocol Security

The protocol handler enforces:
- Path canonicalization to prevent directory traversal
- No directory listings
- CSP headers: `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'none';`
- MIME type detection for common asset types

---

## 5. Plugin UI Patterns

### 5.1 Dark Theme

All plugins should use the dark theme defined in the host's CSS tokens:
```css
body {
  background: #040506;
  color: #f0f0f0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

### 5.2 Layout Structure

```tsx
<div style={{ display: "flex", height: "100vh", background: "#040506" }}>
  {/* Sidebar / List */}
  <div style={{ width: 280, borderRight: "1px solid #2e2f32", background: "#111214" }}>
    {/* ... */}
  </div>
  
  {/* Main Content */}
  <div style={{ flex: 1, overflow: "hidden" }}>
    {/* ... */}
  </div>
</div>
```

### 5.3 Editor Pattern

For text editing:
- Use `<textarea>` with transparent background
- Auto-save on blur
- Support Cmd/Ctrl+S for manual save
- Show save status indicator

---

## 6. Common Pitfalls

### 6.1 Unregistered Plugins

**Problem:** IPC calls fail with permission errors.

**Solution:** Ensure plugins are registered via `seed_builtin_plugins` or `register_plugin` before IPC is used.

### 6.2 Dev Plugin Loading

**Problem:** Plugins show 404 in development.

**Solution:** Set `NIDUS_PLUGIN_DIR` environment variable to the `plugins/` directory path.

### 6.3 React Hook Dependencies

**Problem:** ESLint warnings about missing dependencies.

**Solution:** Use refs for one-time initialization flags instead of state variables in useEffect dependencies.

### 6.4 postMessage Origin

**Problem:** Cross-origin messages not received.

**Solution:** The `PluginSandbox` uses `"*"` as target origin for simplicity. For production, validate `event.origin`.

---

## 7. Building a New Plugin

### 7.1 Create Plugin Structure

```bash
mkdir -p plugins/my-plugin/src/components
```

### 7.2 Create Entry Point

Create `plugins/my-plugin/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Plugin</title>
    <style>
      body { margin: 0; padding: 0; background: #040506; color: #f0f0f0; font-family: system-ui, sans-serif; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 7.3 Create React App

Create `plugins/my-plugin/src/main.tsx`:
```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### 7.4 Register Plugin

Add the plugin to `src/App.tsx` `MOCK_PLUGINS` array:
```typescript
{
  id: "my-plugin",
  name: "My Plugin",
  version: "1.0.0",
  icon: "🔌",
  ui: { activityBar: true, sidebarSection: "My Plugin" },
  permissions: ["db:read"],
  sandboxed: true,
}
```

### 7.5 Implement Plugin Logic

Use the SDK for all data operations:
```typescript
const { db } = await import("../sdk/src/index.ts");
const rows = await db.query("SELECT * FROM my_table");
```

---

## 8. Checklist

- [ ] Plugin directory created under `plugins/`
- [ ] `index.html` entry point created
- [ ] `src/main.tsx` React entry point created
- [ ] Plugin registered in `src/App.tsx` `MOCK_PLUGINS`
- [ ] Plugin permissions defined in manifest
- [ ] All data operations use SDK (`db.query`, `db.execute`, `broker.request`)
- [ ] No plaintext data in localStorage or logs
- [ ] Dark theme styles applied
- [ ] Plugin tested in sandboxed iframe
- [ ] `NIDUS_PLUGIN_DIR` set in `open-ui.bat` for development
