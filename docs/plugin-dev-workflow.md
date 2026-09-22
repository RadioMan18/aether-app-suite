# Plugin Development Workflow

## Overview

This document describes how to build, test, and release plugins for Nidus without disturbing existing users.

The core principle: **`catalog.json` is a release manifest, not a development tool.** Never add a plugin to the public catalog until it is fully tested and ready to ship.

---

## Architecture

- **`aether-app-suite`** — app core + plugin source code (where you build)
- **`nidus-app-plugins`** — public repo with release zips + `catalog.json` (what clients see)
- **`catalog.json`** — write-only during development; only updated when shipping

---

## Local Plugin Development

### Prerequisites

- Plugin source code lives in `plugins/<plugin-id>/`
- App is running in dev mode (`npm run tauri dev`)

### Step 1: Build the plugin

```bash
cd plugins/<plugin-id>
npm run build
```

This creates the production bundle in `plugins/<plugin-id>/dist/`.

### Step 2: Package the plugin

```bash
# From the plugin directory
node ../../scripts/zip-plugin.mjs
```

This creates `plugins/<plugin-id>/<plugin-id>-<version>.zip`.

### Step 3: Install the plugin locally

In the running app:

1. Open the Plugin Manager
2. Click **"Install Local Plugin"** (or use the equivalent UI action)
3. Select the zip file from the file picker

The app calls `install_local_plugin(path)` which:
- Reads the zip from disk
- Extracts `plugin-manifest.json` to get `id`, `name`, `version`, `permissions`
- Registers the plugin in the local database
- Extracts the plugin files to the app data directory
- Refreshes the plugin list

### Step 4: Test the plugin

- The plugin appears in the installed list immediately
- Navigate to it via the sidebar or plugin selector
- Test all functionality
- Check the dev console for errors forwarded from the plugin iframe (`nidus:plugin-error`)

### Step 5: Iterate

Make code changes, rebuild (`npm run build`), repackage (`node ../../scripts/zip-plugin.mjs`), and reinstall via **"Install Local Plugin"**.

**Do not** add the plugin to `catalog.json` during iteration.

---

## Release Workflow

When the plugin is fully tested and ready to ship:

### Step 1: Tag a release in `nidus-app-plugins`

```bash
cd <path-to-nidus-app-plugins>
git checkout main
git pull

# Create a release tag (e.g., v0.2.0 for the plugin version)
git tag v0.2.0
git push origin v0.2.0
```

Or create a GitHub Release in the `nidus-app-plugins` repo.

### Step 2: Upload the zip as a release asset

Upload `plugins/<plugin-id>/<plugin-id>-<version>.zip` as an asset to the GitHub Release.

### Step 3: Update `catalog.json`

Edit `catalog.json` in `nidus-app-plugins` and add the plugin entry:

```json
{
  "id": "<plugin-id>",
  "name": "<Plugin Name>",
  "version": "<version>",
  "category": "<category>",
  "icon": "<emoji>",
  "description": "<description>",
  "author": "Nidus",
  "permissions": ["db:read", "db:write"],
  "downloadUrl": "https://github.com/RadioMan18/nidus-app-plugins/releases/download/v<version>/<plugin-id>-<version>.zip",
  "checksum": "sha256:<computed-checksum>",
  "rating": 0,
  "downloads": 0,
  "changelog": "Initial release."
}
```

### Step 4: Commit and push

```bash
git add catalog.json
git commit -m "Add <plugin-name> v<version> to catalog"
git push origin main
```

### Step 5: Clients see the update

Clients refresh their catalog cache (5-minute TTL) and the new plugin appears in the store.

---

## Plugin Update Workflow

When releasing an updated version of an existing plugin:

1. Bump the version in `plugins/<plugin-id>/package.json`
2. Build and package the new zip
3. Upload as a new GitHub Release asset in `nidus-app-plugins`
4. Update the existing entry in `catalog.json` with the new version and `downloadUrl`
5. The app shows `updateAvailable: true` for users who have the older version installed
6. Users click **Update** to download and install the new version

---

## Builtin vs Catalog Plugins

### Builtin Plugins

Ship with the app. Changes require an app update. Examples: `todo`, `goals`, `mood`, `contacts`.

- Source: `plugins/<plugin-id>/`
- Registered in `src-tauri/src/database.rs` via `seed_builtin_plugins`
- No catalog entry needed
- No user install step

### Catalog Plugins

Installed by users from the plugin store. Independent of app releases. Examples: `pomodoro`, `kanban`, `notes`, `rss`, `calendar`.

- Source: `plugins/<plugin-id>/` (development) → `nidus-app-plugins` (release)
- Packaged as zip with `plugin-manifest.json`
- Distributed via `catalog.json` + GitHub Releases
- Users install/update on their own schedule

---

## Security Rules

1. **Never** add a plugin to `catalog.json` that has not been fully tested.
2. **Never** ship a plugin with a mismatched `id` or `version` between `package.json` and `plugin-manifest.json`.
3. **Always** include a `checksum` in the catalog entry. Compute it with:
   ```bash
   node -e "const crypto=require('crypto'); const fs=require('fs'); const hash=crypto.createHash('sha256'); hash.update(fs.readFileSync('plugins/<plugin-id>/<plugin-id>-<version>.zip')); console.log('sha256:'+hash.digest('hex'));"
   ```
4. **Never** use the public `catalog.json` for development or beta testing.

---

## Beta Testing

To distribute a plugin to testers without publishing to the public catalog:

### Option A: Local install (recommended for 1-2 testers)

Share the zip file directly. Testers use **"Install Local Plugin"** in the app.

### Option B: Private catalog branch

1. Create a `beta` branch in `nidus-app-plugins`
2. Add beta plugins to `catalog.json` on that branch
3. Share the raw GitHub URL of the branch's `catalog.json` with testers
4. The app would need a way to point to a custom catalog URL (not yet implemented)

### Option C: Temporary catalog entry with `beta` flag

Not recommended — there is no `beta` flag in the current catalog schema, and testers would see the plugin alongside stable plugins.

---

## Troubleshooting

### Plugin installs but doesn't appear in the sidebar

- Check the browser console for `nidus:plugin-error` events
- Verify `plugin-manifest.json` has a valid `id` and `entry: "index.html"`
- Ensure the zip contains all files from `dist/`

### Plugin works locally but breaks after release

- Verify the `checksum` in `catalog.json` matches the released zip
- Check that all assets are included in the zip (no missing files from `dist/`)
- Verify `downloadUrl` points to the correct GitHub Release asset

### "Permission denied" errors

- Check the plugin's declared `permissions` in `plugin-manifest.json`
- Ensure the host capability file (`src-tauri/capabilities/default.json`) grants the required permissions
- The `db:read` and `db:write` permissions are handled by the broker; custom permissions must be added to `default.json`

---

## Quick Reference

| Action | Command |
|--------|---------|
| Build plugin | `cd plugins/<id> && npm run build` |
| Package plugin | `cd plugins/<id> && node ../../scripts/zip-plugin.mjs` |
| Install locally | Use "Install Local Plugin" in app UI |
| Compute checksum | `node -e "const c=require('crypto'),fs=require('fs');const h=c.createHash('sha256');h.update(fs.readFileSync('<zip>'));console.log('sha256:'+h.digest('hex'))"` |
| Release | Tag in `nidus-app-plugins`, upload zip, update `catalog.json` |

---

*Last updated: 2026-09-22*
