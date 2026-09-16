# Nidus — Technical Architecture Specification

## 1. Executive Summary & Requirements

Nidus is a world-class, secure, extensible Windows 11 desktop application built with **Tauri v2** and **React**. It features a sandboxed plugin architecture with a polished, keyboard-first UI inspired by VS Code, Obsidian, Backstage, Raycast, Linear, Notion, Figma, and Arc Browser.

### Core Requirements

- **UI Foundation:** shadcn/ui + Tailwind CSS + CSS custom properties as design token API
- **Three-Pane Shell:** Activity Bar, Sidebar, Main Content, Status Bar (VS Code + Linear pattern)
- **Plugin Sandbox:** Plugins run in sandboxed iframes via custom `plugin://` URI scheme
- **Command Palette:** Universal `Cmd+K` search and command execution (Raycast + Linear pattern)
- **Plugin Store:** Discovery and one-click installation experience
- **Biometric Security:** Windows Hello integration for database key release
- **Encrypted Storage:** SQLCipher (AES-256-GCM) via rusqlite bundled-sqlcipher
- **Data Broker:** Permission-gated IPC bridge for secure cross-plugin communication
- **Plugin Workspace:** Plugins are developed in a dedicated `plugins/` workspace outside the host `src/` tree

---

## 2. Task Decomposition & Dependency Graph (DAG)

The project is decomposed into 16 discrete tasks.

### Task Node Registry

| Task ID | Task Name | Est. Hours | Complexity | Risk | Weight | Prerequisites | Phase |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **TSK-001** | Design System Foundation | 12 | 1.2 | 1.0 | **14.40** | None | 🟢 Construction |
| **TSK-002** | Three-Pane Shell | 14 | 1.5 | 1.0 | **21.00** | None | 🟢 Construction |
| **TSK-003** | Command Palette & Keyboard-First Nav | 10 | 1.3 | 1.0 | **13.00** | None | 🟢 Construction |
| **TSK-004** | Plugin Store UI | 8 | 1.2 | 1.0 | **9.60** | None | 🟢 Construction |
| **TSK-005** | Tauri Host Setup & Shell Integration | 12 | 1.5 | 1.0 | **18.00** | TSK-001, TSK-002 | 🟢 Construction |
| **TSK-006** | SQLCipher Database Integration | 16 | 2.0 | 1.8 | **57.60** | None | 🟢 Construction |
| **TSK-007** | Windows Hello Biometric Integration | 14 | 2.2 | 2.0 | **61.60** | None | 🟢 Construction |
| **TSK-008** | Secure Key Release & DB Decryption | 10 | 2.0 | 1.5 | **30.00** | TSK-006, TSK-007 | 🟢 Construction |
| **TSK-009** | Custom URI Scheme & Sandboxed Iframe | 15 | 2.5 | 1.5 | **56.25** | TSK-005 | 🟢 Construction |
| **TSK-010** | Secure IPC Bridge & Data Broker | 20 | 2.5 | 1.8 | **90.00** | TSK-009 | 🟢 Construction |
| **TSK-011** | Plugin Installer & Manager | 12 | 1.8 | 1.2 | **25.92** | TSK-005, TSK-006 | 🟢 Construction |
| **TSK-012** | Core Plugin SDK & React Template | 10 | 1.5 | 1.2 | **18.00** | TSK-010 | 🟢 Construction |
| **TSK-013** | Journaling Plugin | 16 | 1.8 | 1.2 | **34.56** | TSK-008, TSK-012 | 🟢 Construction |
| **TSK-014** | Todo List Plugin | 10 | 1.2 | 1.0 | **12.00** | TSK-012 | 🟢 Construction |
| **TSK-015** | Goals Tracker Plugin | 14 | 2.0 | 1.5 | **42.00** | TSK-012, TSK-014 | 🟢 Construction |
| **TSK-016** | Windows Installer Packaging | 8 | 1.5 | 1.2 | **14.40** | TSK-011, TSK-013, TSK-015 | 🟡 Operations |

### Dependency Graph (DAG)

```mermaid
graph TD
    TSK-001[TSK-001: Design System] --> TSK-005[TSK-005: Tauri Host]
    TSK-002[TSK-002: Three-Pane Shell] --> TSK-005
    TSK-003[TSK-003: Command Palette] --> TSK-005
    TSK-004[TSK-004: Plugin Store UI] --> TSK-011[TSK-011: Plugin Manager]
    TSK-005 --> TSK-009[TSK-009: URI Scheme]
    TSK-006[TSK-006: SQLCipher] --> TSK-008[TSK-008: Key Release]
    TSK-007[TSK-007: Windows Hello] --> TSK-008
    TSK-009 --> TSK-010[TSK-010: IPC Bridge]
    TSK-010 --> TSK-012[TSK-012: Plugin SDK]
    TSK-008 --> TSK-013[TSK-013: Journaling]
    TSK-012 --> TSK-013
    TSK-012 --> TSK-014[TSK-014: Todo List]
    TSK-014 --> TSK-015[TSK-015: Goals Tracker]
    TSK-012 --> TSK-015
    TSK-011 --> TSK-016[TSK-016: Windows Installer]
    TSK-013 --> TSK-016
    TSK-015 --> TSK-016
```

---

## 3. Critical Path & Graph Analysis

### Critical Path Analysis

The critical path represents the sequence of dependent tasks that determines the minimum possible duration.

$$\text{Critical Path: } \text{TSK-001} \rightarrow \text{TSK-002} \rightarrow \text{TSK-003} \rightarrow \text{TSK-005} \rightarrow \text{TSK-010} \rightarrow \text{TSK-012} \rightarrow \text{TSK-016}$$

- **Total Weighted Duration:** **286.15 weighted hours** (approx. 95 actual development hours).
- **Strategic Directive:** Tasks on this path have zero float. The IPC Bridge (TSK-010) and Plugin SDK (TSK-012) must be prioritized.

### Parallel Tracks & Float (Slack)

- **Security Track (TSK-006, TSK-007 → TSK-008):** Runs in parallel with UI track. TSK-008 has float of **56.00 weighted hours**.
- **Plugin Store UI (TSK-004):** Can be built in parallel with shell. Float of **140.15 weighted hours**.
- **Journaling Plugin (TSK-013):** Has float of **0 weighted hours** on critical path via TSK-008.

### Bottleneck Nodes

- **TSK-010 (Secure IPC Bridge):** Highest weight (90.00). Critical gateway for all plugin communication.
- **TSK-012 (Plugin SDK):** Out-degree of 3. All core plugins depend on this. API contract must be frozen early.
- **TSK-016 (Windows Installer):** Highest in-degree node, requiring Plugin Manager, Journaling, and Goals Tracker.

---

## 4. Module Breakdown & File Paths

```
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   └── plugin.ts
│   ├── components/
│   │   ├── Shell/
│   │   │   ├── ActivityBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MainContent.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   └── CustomTitleBar.tsx
│   │   ├── CommandPalette/
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── CommandInput.tsx
│   │   │   └── CommandResults.tsx
│   │   ├── PluginStore/
│   │   │   ├── PluginStore.tsx
│   │   │   ├── PluginCard.tsx
│   │   │   └── PluginDetail.tsx
│   │   └── PluginSandbox.tsx
│   └── hooks/
│       ├── useShellState.ts
│       ├── useCommandPalette.ts
│       └── usePluginStore.ts
├── plugins/
│   ├── journal/
│   │   └── index.html
│   ├── todo/
│   └── goals/
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json
    └── src/
        ├── lib.rs
        ├── commands.rs
        ├── database.rs
        ├── biometrics.rs
        ├── protocol.rs
        └── ipc.rs
```

---

## 5. Plugin Registration Contract

Plugins declare their integration points via `PluginManifest` in TypeScript:

```typescript
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  icon: string;
  ui?: {
    activityBar?: boolean;
    sidebarSection?: string;
    commands?: Array<{
      id: string;
      title: string;
      keybinding?: string;
    }>;
  };
  permissions?: string[];
  sandboxed?: boolean;
}
```

### Integration Points

| Integration | Manifest Key | Effect |
|-------------|--------------|--------|
| Activity Bar | `ui.activityBar: true` | Icon appears in Activity Bar |
| Sidebar | `ui.sidebarSection` | Section added to Sidebar |
| Commands | `ui.commands[]` | Commands appear in Command Palette |
| Permissions | `permissions[]` | Required for Data Broker access |
| Sandbox | `sandboxed: true` | Renders in sandboxed `plugin://` iframe |

---

## 6. IPC Message Schema

All messages traversing the `postMessage` boundary use the `nidus:` namespace:

```typescript
// Plugin -> Host
interface NidusRequest {
  type: "nidus:request";
  requestId: string;
  payload: {
    type: "db:query" | "db:execute";
    params?: Record<string, unknown>;
  };
}

// Host -> Plugin
interface NidusResponse {
  type: "nidus:response";
  requestId: string;
  result?: PluginResponse;
  error?: string;
}

interface PluginResponse {
  id: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}
```

### Rust IPC Types

```rust
pub struct PluginRequest {
    pub id: String,
    pub plugin_id: String,
    pub request_type: String,  // "db:query" | "db:execute"
    pub payload: serde_json::Value,
}

pub struct PluginResponse {
    pub id: String,
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
}
```

---

## 7. Design Token API

CSS custom properties exposed as public contract between host and plugins:

```css
:root {
  /* Surfaces */
  --canvas: #040506;
  --surface-1: #111214;
  --surface-2: #1b1c1e;
  --surface-3: #252628;
  --border: #2e2f32;

  /* Typography */
  --text-primary: #f0f0f0;
  --text-secondary: #a0a0a0;
  --text-muted: #6b6b6b;

  /* Accents */
  --accent: #55b3ff;
  --accent-hover: #7ac5ff;
  --success: #5fc992;
  --warning: #ffbc33;
  --danger: #ff5f5f;

  /* Spacing */
  --sidebar-width: 260px;
  --activity-bar-width: 64px;
  --status-bar-height: 24px;
}
```

Plugins inherit these automatically. Override allowed but theme preference should be respected.

---

## 8. Compliance & Security Guardrails

1. **Data Minimization:** Plugins only access their own namespace unless explicit cross-plugin permissions granted.
2. **Zero Plaintext Storage:** All sensitive data encrypted at rest via SQLCipher.
3. **Biometric Key Release:** DB key retrieved from Windows Credential Manager only after successful Windows Hello auth. Zeroized in memory via `zeroize` crate.
4. **Sandbox Isolation:** `plugin://` scheme enforces strict CSP. No external network requests (`connect-src 'none'`).
5. **Permission Gating:** All IPC broker requests validated against plugin manifest permissions.

---

## 9. Execution Strategy & HITL Gates

> **Phase Gate Policy:** Each phase concludes with a mandatory **Testing Gate**.
> The gate must return **ALL GREEN** (zero errors, zero warnings) before the next phase may begin.
> If any check fails, the current phase must be remediated and the gate re-run.

### Phase 1: UI Foundation & Design System ✅ COMPLETE

- **Focus:** Design tokens, shell, command palette, plugin store.
- **Tasks:** TSK-001, TSK-002, TSK-003, TSK-004
- **HITL Gate 1:** ✅ PASSED — TypeScript typecheck passes, ESLint 0 errors, Vite build succeeds, all files under 400 lines.

### Phase 2: Security & Plugin Runtime ✅ COMPLETE

- **Focus:** Tauri host, security, sandbox, IPC bridge, SDK.
- **Tasks:** TSK-005, TSK-006, TSK-007, TSK-008, TSK-009, TSK-010, TSK-011, TSK-012
- **HITL Gate 2:** ✅ PASSED — `cargo check` 0 errors, `cargo clippy -D warnings` 0 warnings, `cargo fmt` passes, TypeScript typecheck passes, ESLint 0 errors.
- **Implementation Notes:**
  - Plugins developed in dedicated `plugins/` workspace outside `src/`
  - Test plugin HTML deployed at `%APPDATA%/nidus/appsuite/plugins/journal/index.html`
  - IPC bridge uses `postMessage` with `invoke("plugin_ipc", ...)` from `PluginSandbox.tsx`
  - Permission validation implemented in Rust (`src-tauri/src/ipc.rs`), not TypeScript
  - Plugin registry stored in SQLCipher `plugins` table

### Phase 3: Plugin Implementation 🟡 IN PROGRESS

- **Focus:** Build three core plugins with native-feel UI.
- **Tasks:** TSK-013, TSK-014, TSK-015
- **HITL Gate 3:** Pending — all plugins must load, render, and share data via broker.

### Phase 4: Packaging & Release 🔵 PENDING

- **Focus:** Windows installer, clean install verification.
- **Tasks:** TSK-016
- **HITL Gate 4:** Pending — clean install on Windows 11 VM, biometrics, plugins, storage functional.

---

## 10. Reference Applications

| Application | UI Pattern Borrowed |
|-------------|---------------------|
| **VS Code** | Activity Bar, sidebar panels, command palette, status bar |
| **Obsidian** | CSS variable theming, plugin leaf system, local-first simplicity |
| **Backstage** | Plugin registration contract, consistent chrome, extension points |
| **Raycast** | Keyboard-first design, compact mode, action bar, extension store |
| **Linear** | Ultra-minimal dark UI, accent color, information density |
| **Notion** | Workspace sidebar, block-based plugin UI, template library |
| **Figma** | Plugin modal UI, community marketplace pattern |
| **Arc Browser** | Sidebar-first layout, command bar, translucent surfaces |
