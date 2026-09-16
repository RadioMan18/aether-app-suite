# Rebrand Plan: Aether App Suite → Nidus

**New name:** Nidus (Latin for "nest")  
**Scope:** Full ecosystem rebrand across host app, plugins, SDK, catalog, and branding assets  
**Constraint:** App is not yet deployed to consumers — no backward-compat or data-migration requirements.

---

## Naming Conventions

| Old | New |
|-----|-----|
| Package: `aether-app-suite` | `nidus` |
| Plugin packages: `aether-plugin-*` | `nidus-plugin-*` |
| SDK package: `@aether/plugin-sdk` | `@nidus/plugin-sdk` |
| Plugin template: `aether-plugin-template` | `nidus-plugin-template` |
| Tauri `productName`: `Aether App Suite` | `Nidus` |
| Tauri `identifier`: `com.aether.appsuite` | `com.nidus.app` |
| IPC namespace: `aether:` | `nidus:` |
| AppData path: `%APPDATA%/aether/appsuite/` | `%APPDATA%/nidus/` |
| DB filename: `aether.db` | `nidus.db` |
| Credential service: `aether-app-suite` | `nidus` |
| Catalog author: `Aether` | `Nidus` |
| Catalog repo (GitHub): `aether-app-plugins` | `nidus-app-plugins` |
| Catalog cache key: `aether-plugin-cache` | `nidus-plugin-cache` |
| Catalog URLs: `RadioMan18/aether-app-plugins` | `RadioMan18/nidus-app-plugins` |
| Plugin IDs in docs: `com.aether.*` | `com.nidus.*` |

---

## Execution Order

Work top-down through layers. Each step is independent within its layer.

### Layer 1 — Rust / Tauri Config (backend identity)
Files to change:
- `src-tauri/tauri.conf.json` — `productName`, `identifier`, window title
- `src-tauri/src/database.rs` — AppData path (`aether` → `nidus`), DB filename (`aether.db` → `nidus.db`), credential service name
- `src-tauri/src/commands.rs` — plugin install directory path (`aether` → `nidus`)

Validation: `npx tauri build` completes without path errors.

### Layer 2 — TypeScript / Frontend (UI strings, imports, IPC)
Files to change:
- `package.json` — `"name"`: `aether-app-suite` → `nidus`
- `index.html` — `<title>`
- `src/lib/commands/` — any command files referencing `aether`
- `src/hooks/usePluginManager.ts` — catalog URL, cache key
- `src/components/PluginSandbox.tsx` — `postMessage` namespace (`aether:` → `nidus:`), event listener names
- All plugin `main.tsx` files under `plugins/*/src/` — `postMessage` namespace and event names

Validation: `npm run typecheck` passes; `npm run dev` launches with no console errors.

### Layer 3 — Package Metadata (npm names)
Files to change:
- Root `package.json` — already handled in Layer 2
- Every `plugins/*/package.json` — rename `aether-plugin-*` → `nidus-plugin-*`
- `plugins/sdk/package.json` — rename `@aether/plugin-sdk` → `@nidus/plugin-sdk`
- `plugins/template/package.json` — rename `aether-plugin-template` → `nidus-plugin-template`

Validation: All 13 `package.json` files inspected; grep for old names returns zero results.

### Layer 4 — Catalog Manifest
Files to change:
- `catalog.json` — `"author"` field on all entries, download URLs pointing to new repo name

Validation: `catalog.json` parses as valid JSON; all URLs use `nidus-app-plugins`.

### Layer 5 — Documentation
Files to change:
- `README.md` — all product references, repo URLs
- `docs/push-plugins.md` — publishing workflow references
- `docs/plugin-manifest-schemas.md` — catalog references
- `docs/skill-plugin-build.md` — AppData path references
- `docs/audit.md` — credential service and path references
- `docs/aidlc-docs/inception/*.md` — all tech specs, plugin IDs, protocol references

Validation: `grep -ri "aether" docs/` returns zero results.

### Layer 6 — Branding Assets
Actions:
- Replace or regenerate icons/logos under `src-tauri/icons/` with Nidus branding
- Update favicon if a custom one exists beyond `vite.svg`

Validation: Visual inspection; no remaining "Aether" references in asset files.

### Layer 7 — Workspace / Meta Files
Files to change:
- `aether-app-suite.code-workspace` — rename to `nidus.code-workspace` and update internal paths
- Any `.kilo/plans/*.md` references (historical plans need not be renamed, but cross-references in new plans should use `nidus`)

Validation: VS Code opens workspace without path errors.

---

## Validation Checklist (end-to-end)

- [ ] `grep -ri "aether" src/ plugins/ src-tauri/` → zero results
- [ ] `grep -ri "aether" docs/` → zero results
- [ ] `grep -ri "aether" package.json catalog.json` → zero results
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npx tauri build` succeeds
- [ ] `npx tauri dev` launches with title "Nidus"
- [ ] All 13 `package.json` files have new names

---

## Out of Scope
- Renaming the GitHub organization/user `RadioMan18` — stays the same, only the repo name changes
- `node_modules/`, `.cache/`, lockfiles, build artifacts — these are regenerated
- npm publishing — not yet active
