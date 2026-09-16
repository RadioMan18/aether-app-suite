# How to Push a Plugin to the Public Catalog Repo

This document describes the end-to-end process for adding a new plugin to the public catalog repository: `https://github.com/RadioMan18/aether-app-plugins`

## Prerequisites

- You have write access to `https://github.com/RadioMan18/aether-app-plugins`
- The plugin is implemented and registered locally under `plugins/<id>/`
- The plugin passes the evaluation gate in `docs/plugin-evaluation-gate.md`
- **Windows note:** If you clone the catalog repo into a directory on a filesystem that does not record ownership, Git may block operations with `detected dubious ownership`. Fix it once with:
  ```powershell
  git config --global --add safe.directory D:/src/aether-app-suite/.cache/aether-app-plugins
  ```

---

## Step 1: Build and Zip the Plugin

From the repo root (`D:\src\aether-app-suite`), run:

```bash
npm run build --prefix plugins/<id>
npm run dist:zip --prefix plugins/<id>
```

This produces:
- `plugins/<id>/dist/` — built Vite assets
- `plugins/<id>/<id>-<version>.zip` — distributable plugin package

---

## Step 2: Compute the SHA256 Checksum

Run this PowerShell command:

```powershell
Get-FileHash "plugins\<id>\<id>-<version>.zip" -Algorithm SHA256
```

Copy the hash value. You will need it for `catalog.json`.

---

## Step 3: Create a GitHub Release

1. Open: `https://github.com/RadioMan18/aether-app-plugins/releases/new`
2. Click **"Choose a tag"**, type `v<version>`, then **"Create new tag"**
   - Example: `v0.1.0`
3. Fill in:
   - **Release title:** `<Plugin Name> <version>`
   - **Description:** `Initial release of <Plugin Name> v<version>.`
4. Under **"Attach binaries"**, upload:
   - `plugins/<id>/<id>-<version>.zip`
5. Click **"Publish release"**

After publishing, the asset URL will be:
```
https://github.com/RadioMan18/aether-app-plugins/releases/download/v<version>/<id>-<version>.zip
```

---

## Step 4: Add the Plugin to `catalog.json`

Edit `D:\src\aether-app-suite\catalog.json` and add a new entry to the `plugins` array:

```json
{
  "id": "<id>",
  "name": "<Plugin Name>",
  "version": "<version>",
  "category": "productivity",
  "icon": "🍅",
  "description": "<Brief description of the plugin>.",
  "author": "Aether",
  "permissions": [],
  "downloadUrl": "https://github.com/RadioMan18/aether-app-plugins/releases/download/v<version>/<id>-<version>.zip",
  "checksum": "sha256:<computed-hash>",
  "changelog": "Initial plugin catalog release."
}
```

Notes:
- `permissions` must match the array declared in the plugin's `plugin-manifest.json` or frontend manifest
- `downloadUrl` must match the GitHub Release asset URL exactly
- `checksum` must be the lowercase SHA256 hash from Step 2

---

## Step 5: Commit and Push `catalog.json` to the Catalog Repo

The `catalog.json` file must be pushed to the **public plugins catalog repo**, not the main app repo.

1. If you haven't already, clone the catalog repo from the repo root:
   ```bash
   git clone https://github.com/RadioMan18/aether-app-plugins.git .cache/aether-app-plugins
   ```

2. Copy your updated `catalog.json` into the catalog repo:
   ```bash
   # Git Bash / WSL / macOS
   cp catalog.json .cache/aether-app-plugins/catalog.json
   ```
   ```powershell
   # PowerShell
   Copy-Item "D:\src\aether-app-suite\catalog.json" ".cache\aether-app-plugins\catalog.json"
   ```

3. Commit and push from the catalog repo:
   ```bash
   cd .cache/aether-app-plugins
   git add catalog.json
   git commit -m "Add <plugin-name> to catalog"
   git push
   ```

This ensures the public catalog at `https://github.com/RadioMan18/aether-app-plugins` is updated, which is what the Plugin Store reads at runtime.

---

## Step 6: Verify the Plugin is Live

1. Confirm the release exists at: `https://github.com/RadioMan18/aether-app-plugins/releases`
2. Confirm the zip asset is downloadable
3. Confirm `catalog.json` is updated on GitHub
4. Run the main app and verify the plugin appears in the Plugin Store

---

## Quick Reference

| Step | Action | Command / URL |
|------|--------|---------------|
| 1 | Build plugin | `npm run build --prefix plugins/<id>` |
| 1 | Zip plugin | `npm run dist:zip --prefix plugins/<id>` |
| 2 | Get checksum | `Get-FileHash plugins\<id>\<id>-<version>.zip -Algorithm SHA256` |
| 3 | Create GitHub Release | `https://github.com/RadioMan18/aether-app-plugins/releases/new` |
| 4 | Update catalog | Edit `catalog.json` |
| 5 | Push catalog to plugins repo | `cd .cache/aether-app-plugins && git add catalog.json && git commit -m "Add <plugin-name> to catalog" && git push` |
| 6 | Verify | Open release page and test in app |

---

## Automated Alternative

For bulk releases of multiple plugins, use:

```bash
node scripts/release-catalog.mjs
```

This script will:
1. Build all plugins
2. Zip them
3. Clone/update the catalog repo at `.cache/aether-app-plugins`
4. Copy zips and `catalog.json` into the catalog repo
5. Commit, push, and create GitHub Releases via `gh` CLI

Requires `gh` CLI to be installed and authenticated.
