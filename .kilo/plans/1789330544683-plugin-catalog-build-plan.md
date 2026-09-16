# Plugin Catalog Store — Build Plan

## Goal

Wire the existing Plugin Store UI to a real remote catalog hosted at `https://github.com/RadioMan18/aether-app-plugins`, with plugin zips delivered via GitHub Releases and installed through the existing `install_plugin` Rust command.

## Current Assets

- **Frontend UI:** `src/components/PluginStore/` — search, filters, tabs, cards, detail panel
- **Frontend hooks:** `usePluginStore.ts` (UI state), `usePluginManager.ts` (Tauri IPC wrapper)
- **Rust commands:** `install_plugin`, `uninstall_plugin`, `list_plugins` — already functional
- **Catalog repo:** https://github.com/RadioMan18/aether-app-plugins (empty, ready for `catalog.json` + releases)
- **Existing plugins:** `plugins/journal/`, `plugins/todo/`, `plugins/goals/` with Vite build output

## Decisions

1. **Catalog location:** `catalog.json` at root of `aether-app-plugins` repo, served via GitHub raw URL (`https://raw.githubusercontent.com/RadioMan18/aether-app-plugins/main/catalog.json`)
2. **Plugin delivery:** GitHub Releases — one release per plugin version, zip attached as release asset
3. **Zip structure:** Flat built output + top-level `plugin-manifest.json` inside the zip root
4. **Update detection:** Semantic version compare on the frontend against the installed version from `list_plugins`
5. **Scope:** Store + catalog + install only. No CAT-001–CAT-004 backend services (RSS, clipboard, biometric partitions, JSON schema validation). Those land later without changing the catalog architecture.
6. **Plugin evaluation gate:** Every catalog entry must pass a review before release: value add, no duplication, predicted demand.

## Task List

### T-1: Define manifest schemas

Create two schemas:

**`catalog.json`** (root of `aether-app-plugins` repo):
```json
{
  "catalogVersion": "1.0.0",
  "plugins": [
    {
      "id": "calendar-sync",
      "name": "Calendar Sync",
      "version": "1.0.0",
      "category": "integration",
      "icon": "📅",
      "description": "...",
      "author": "Aether",
      "permissions": ["network:outbound"],
      "downloadUrl": "https://github.com/RadioMan18/aether-app-plugins/releases/download/v1.0.0/calendar-sync.zip",
      "checksum": "sha256:...",
      "changelog": "Initial release."
    }
  ]
}
```

**`plugin-manifest.json`** (inside each plugin zip, at zip root):
```json
{
  "id": "calendar-sync",
  "name": "Calendar Sync",
  "version": "1.0.0",
  "permissions": ["network:outbound"],
  "entry": "index.html"
}
```

### T-2: Add plugin packaging script

Create `scripts/zip-plugin.mjs` at the repo root of each plugin:
- Reads plugin `package.json` for `id`, `name`, `version`
- Copies `dist/` contents into a temp dir
- Writes `plugin-manifest.json` into the temp dir root
- Zips the temp dir contents
- Outputs `plugins/{id}/{version}.zip` relative to plugin dir

Add `"dist:zip": "node ../../scripts/zip-plugin.mjs"` to each plugin's `package.json` scripts.

### T-3: Frontend — catalog fetch and install flow

Modify `src/hooks/usePluginManager.ts`:
- Add `fetchCatalog(): Promise<StoreItem[]>` — GET `catalog.json` from GitHub raw URL
- Add `downloadZip(url: string): Promise<ArrayBuffer>` — fetch zip bytes
- Add checksum verification: compute SHA-256 of downloaded bytes, compare to `checksum` field, reject on mismatch
- Modify `installPlugin` to accept catalog item, download zip, verify checksum, then invoke `install_plugin` with real zip bytes
- Add `refreshCatalog()` that merges catalog items with `list_plugins` installed state

### T-4: Frontend — merge catalog with installed state

Modify `src/hooks/usePluginStore.ts`:
- Accept merged catalog+installed items as a prop or via context instead of static `STORE_ITEMS`
- Compute `installed` and `updateAvailable` from merged data (semver compare: `catalog.version > installed.version`)
- Keep existing search/filter/tab/selection state

Modify `src/types/plugin-store.ts`:
- Add fields: `downloadUrl`, `checksum`, `changelog`, `author`

### T-5: Wire up App.tsx

Modify `src/App.tsx`:
- Pass `STORE_ITEMS` from `usePluginManager` merged catalog to `PluginStore` instead of static import
- Or keep `STORE_ITEMS` as fallback if catalog fetch fails

### T-6: Rust — checksum verification (optional but recommended)

Modify `src-tauri/src/commands.rs` `install_plugin`:
- Add optional `checksum: Option<String>` parameter
- If provided, compute SHA-256 of `zip_data`, compare to expected value, reject with error on mismatch
- Validate embedded `plugin-manifest.json` in zip matches requested `id`, `name`, `version`, `permissions`

### T-7: Populate catalog repo

In `https://github.com/RadioMan18/aether-app-plugins`:
- Add `catalog.json` with entries for `journal`, `todo`, `goals`
- Create GitHub Releases for each version with zip assets
- Verify raw `catalog.json` URL is accessible

### T-8: Plugin evaluation gate

Before any plugin is added to `catalog.json`, it must pass:
1. **Value add:** Does it solve a problem not already solved by journal/todo/goals?
2. **No duplication:** Does it overlap with existing or planned plugins?
3. **Demand:** Is there a predicted user need, or is it a tech demo?
4. **Security:** Permissions are minimal and justified
5. **Build:** `npm run build` succeeds, zip is under size limit

Document evaluation results in the plugin repo as a `README.md` per plugin folder.

## Out of Scope

- CAT-001: Data Broker API extension / JSON schema validation
- CAT-002: RSS background fetch service
- CAT-003: Clipboard streaming service
- CAT-004: Independent biometric challenge & per-plugin partitions
- CAT-005–CAT-014: New plugins (calendar, kanban, pomodoro, notes, vault, budget, mood, contacts, clipboard, rss)
- CAT-015: Integration smoke testing

These do not block the store/catalog/install pipeline and can be phased in later.

## Risks

- **GitHub raw rate limits:** Unauthenticated requests are limited to 60/hr. Mitigation: cache `catalog.json` locally, refresh on app launch, fail gracefully to empty store.
- **Zip path traversal:** `extract_plugin` uses `file.mangled_name()` which should be safe, but worth verifying.
- **Version skew:** If the catalog repo is updated while the app is running, the user won't see new plugins until restart. Acceptable for MVP.

## Validation

- `catalog.json` fetches successfully from GitHub raw
- Install button downloads zip, verifies checksum, invokes `install_plugin`, plugin appears in Installed tab
- Uninstall removes plugin files and DB row
- Update tab shows plugins where `catalog.version > installed.version`
- Offline: store shows empty state or cached data, no crash
