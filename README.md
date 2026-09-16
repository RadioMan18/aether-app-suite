# Nidus

A privacy-first, plugin-based desktop productivity suite built with Tauri, React, and SQLCipher.

## What's Inside

- **Host App (`src/`)** — Three-pane shell (Activity Bar, Sidebar, Main Content), Command Palette, and Plugin Store UI. Built with React 19, Tailwind CSS, and Vite.
- **Tauri Backend (`src-tauri/`)** — SQLCipher database, Windows Hello biometric auth, secure IPC broker, and plugin installer/uninstaller commands.
- **Plugins (`plugins/`)** — Standalone Vite React apps that run sandboxed inside the host. Each plugin declares permissions and communicates through the IPC broker.

### Built-in Plugins

| Plugin | Purpose |
|--------|---------|
| Journal | Encrypted daily journaling with markdown and native-feel UI |
| Todo List | Task management with priorities, due dates, and Activity Bar integration |
| Goals | Long-term goal tracking with milestones and cross-plugin progress sharing |

## Plugin Catalog

The app ships with a Plugin Store that fetches `catalog.json` from the companion catalog repository:

```
https://github.com/RadioMan18/nidus-app-plugins
```

Plugins are delivered as signed zip assets via GitHub Releases. Each zip contains a `plugin-manifest.json` that declares the plugin's identity, version, permissions, and entry point.

### Packaging a Plugin

1. Build the plugin: `npm run build --prefix plugins/<id>`
2. Package it: `npm run dist:zip --prefix plugins/<id>`
3. The zip is emitted as `plugins/<id>/<id>-<version>.zip`
4. Create a GitHub Release in the catalog repo and attach the zip as an asset
5. Add or update the plugin entry in `catalog.json` with the `downloadUrl` and `checksum`

### Plugin Evaluation Gate

Before any plugin is added to the catalog, it must pass the evaluation gate documented in [`docs/plugin-evaluation-gate.md`](docs/plugin-evaluation-gate.md).

## Getting Started

### Prerequisites

- Node.js 18+
- Rust 1.77+
- Windows (for biometric features)

### Development

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
npm run tauri
```

### Build Plugins

```bash
npm run build:plugins
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite
- **Desktop:** Tauri 2, Rust
- **Database:** SQLCipher via rusqlite
- **Auth:** Windows Hello biometrics
- **Security:** Permission-gated IPC broker, credential manager for DB encryption key

## Security Model

- All plugin data access is gated through the IPC broker
- Plugins declare required permissions at install time
- The database encryption key is stored in the OS credential manager
- Plugin zips are verified with SHA-256 checksums before extraction
- `plugin-manifest.json` inside each zip is validated against the catalog entry

## License

MIT
