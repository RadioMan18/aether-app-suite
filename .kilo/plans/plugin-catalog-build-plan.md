# Plugin Catalog Store — Build Plan

## Current State

**What exists:**
- Frontend Plugin Store UI: search, category filters, tabs (Discover/Installed/Updates), card grid, detail panel — all in `src/components/PluginStore/`
- Rust backend commands: `install_plugin`, `uninstall_plugin`, `list_plugins` — already wired to SQLCipher `plugins` table
- `usePluginManager` hook wraps these commands
- `usePluginStore` hook manages UI state from static mock data
- Empty catalog repo: https://github.com/RadioMan18/aether-app-plugins

**What's missing for a real store:**
- Remote catalog manifest and fetch flow
- Plugin zip packaging format
- Frontend wiring: replace mock data with real catalog + installed state merge
- Optional: checksum verification in Rust `install_plugin`

## What the Docs Say

The `plugin-catalog-tech_spec.md` and `plugin-catalog-imp_plan.md` describe a broader "Plugin Catalog Expansion" (CAT-001 through CAT-015) that includes:
- Data Broker API extension with JSON schema validation
- Host-mediated RSS background fetcher
- Host-active clipboard streaming
- Independent biometric challenge & auto-relock with per-plugin partitions
- 10 new plugins

These docs do NOT specify:
- The catalog manifest format
- The plugin zip layout
- The remote store URL/feed format
- How the existing Plugin Store UI connects to the catalog

## Proposed Scope: Store + Catalog + Install

Build the minimum viable store pipeline without the RSS/clipboard/biometric backend services. This covers:

1. **Catalog manifest format** — `catalog.json` at root of `aether-app-plugins` repo
2. **Plugin zip layout** — built `dist/` + embedded `manifest.json`
3. **Packaging script** — `scripts/zip-plugin.mjs` run after Vite build
4. **Frontend wiring** — `usePluginManager` fetches catalog, downloads zips, calls `install_plugin`; `usePluginStore` merges catalog items with installed state
5. **Rust checksum verification** — `install_plugin` verifies SHA-256 before extracting
6. **Release workflow** — GitHub Release per plugin version with zip asset; catalog updated per release

**Out of scope for this plan:**
- CAT-001 through CAT-004 backend services (RSS, clipboard, biometric partitions, JSON schema validation)
- CAT-005 through CAT-014 new plugins
- CAT-015 integration smoke testing

These can land later without changing the catalog/install architecture.

## Key Design Decisions Needed

1. **Catalog manifest format:** Exact schema for `catalog.json` and per-plugin `manifest.json`
2. **Zip structure:** What files are included, where does `manifest.json` live inside the zip
3. **Repo layout:** GitHub Releases with assets vs. versioned folders in repo tree
4. **Update detection:** Semantic version comparison, how `updateAvailable` is computed
5. **Cache/refresh strategy:** How often the app fetches `catalog.json`, local caching, offline behavior
6. **Scope confirmation:** Is "store + catalog + install" the right scope, or do you want the full expansion?

## Recommendation

Start with the store/catalog/install pipeline (scope above). The existing Rust commands and UI handle 80% of the work. The remaining 20% is the manifest format, zip packaging, and frontend wiring — all straightforward. The RSS/clipboard/biometric services are independent architectural bets that don't block plugin distribution.
