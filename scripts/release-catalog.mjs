/* eslint-env node */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CATALOG_REPO = "https://github.com/RadioMan18/nidus-app-plugins.git";
const CATALOG_DIR = path.resolve(ROOT, ".cache", "nidus-app-plugins");
const CATALOG_BRANCH = "main";

function exec(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: "pipe", ...opts }).toString().trim();
  } catch (e) {
    const msg = e.stderr?.toString() || e.message || String(e);
    throw new Error(`Command failed: ${cmd}\n${msg}`);
  }
}

function discoverPlugins() {
  const pluginsDir = path.join(ROOT, "plugins");
  if (!fs.existsSync(pluginsDir)) {
    throw new Error(`plugins directory not found at ${pluginsDir}`);
  }

  const plugins = [];
  for (const entry of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pluginDir = path.join(pluginsDir, entry.name);
    const pkgPath = path.join(pluginDir, "package.json");
    if (!fs.existsSync(pkgPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const { id, version } = pkg;
    if (!id || !version) {
      console.warn(`Skipping ${entry.name}: missing id or version in package.json`);
      continue;
    }

    plugins.push({
      dir: pluginDir,
      id,
      name: pkg.name || id,
      version,
      zipName: `${id}-${version}.zip`,
      zipPath: path.join(pluginDir, `${id}-${version}.zip`),
    });
  }

  if (plugins.length === 0) {
    throw new Error("No plugins found with valid id/version in package.json");
  }

  return plugins;
}

function buildPlugin(plugin) {
  console.log(`\n==> Building ${plugin.name}@${plugin.version}`);
  exec(`npm run build --prefix "${plugin.dir}"`);
}

function zipPlugin(plugin) {
  console.log(`==> Packaging ${plugin.name}@${plugin.version}`);
  const scriptPath = path.join(ROOT, "scripts", "zip-plugin.mjs");
  exec(`node "${scriptPath}"`, { cwd: plugin.dir });
}

function ensureCatalogRepo() {
  if (fs.existsSync(path.join(CATALOG_DIR, ".git"))) {
    console.log(`\n==> Updating catalog repo at ${CATALOG_DIR}`);
    exec(`git -C "${CATALOG_DIR}" fetch origin`, { cwd: ROOT });
    exec(`git -C "${CATALOG_DIR}" checkout ${CATALOG_BRANCH}`, { cwd: ROOT });
    exec(`git -C "${CATALOG_DIR}" pull --rebase origin ${CATALOG_BRANCH}`, { cwd: ROOT });
  } else {
    console.log(`\n==> Cloning catalog repo to ${CATALOG_DIR}`);
    fs.mkdirSync(path.dirname(CATALOG_DIR), { recursive: true });
    exec(`git clone ${CATALOG_REPO} "${CATALOG_DIR}"`);
    exec(`git -C "${CATALOG_DIR}" checkout ${CATALOG_BRANCH}`);
  }
}

function syncToCatalog(plugins) {
  console.log(`\n==> Syncing artifacts to catalog repo`);

  for (const plugin of plugins) {
    const destZip = path.join(CATALOG_DIR, path.basename(plugin.zipPath));
    fs.copyFileSync(plugin.zipPath, destZip);
    console.log(`  Copied ${path.basename(plugin.zipPath)}`);
  }

  const localCatalog = path.join(ROOT, "catalog.json");
  if (fs.existsSync(localCatalog)) {
    const destCatalog = path.join(CATALOG_DIR, "catalog.json");
    fs.copyFileSync(localCatalog, destCatalog);
    console.log("  Copied catalog.json");
  } else {
    console.warn("  Warning: local catalog.json not found; skipping");
  }
}

function commitAndPushCatalog() {
  console.log(`\n==> Committing and pushing catalog repo`);
  exec(`git -C "${CATALOG_DIR}" add .`);
  const status = exec(`git -C "${CATALOG_DIR}" status --porcelain`);
  if (!status) {
    console.log("  No changes to commit");
    return false;
  }

  exec(`git -C "${CATALOG_DIR}" commit -m "Release plugins ${new Date().toISOString().slice(0, 10)}"`);
  exec(`git -C "${CATALOG_DIR}" push origin ${CATALOG_BRANCH}`);
  return true;
}

function createGitHubReleases(plugins) {
  console.log(`\n==> Creating GitHub Releases`);
  for (const plugin of plugins) {
    const tag = `v${plugin.version}`;
    const title = `${plugin.name} ${plugin.version}`;
    const assetPath = path.join(CATALOG_DIR, path.basename(plugin.zipPath));

    const existing = exec(`gh release view "${tag}" --repo RadioMan18/nidus-app-plugins --json tagName -q .tagName 2>NUL || echo "__MISSING__"`).trim();
    if (existing === tag) {
      console.log(`  Release ${tag} already exists, uploading asset`);
      exec(`gh release upload "${tag}" "${assetPath}" --repo RadioMan18/nidus-app-plugins --clobber`);
    } else {
      console.log(`  Creating release ${tag}`);
      exec(`gh release create "${tag}" "${assetPath}" --repo RadioMan18/nidus-app-plugins --title "${title}" --notes "Initial release of ${plugin.name} v${plugin.version}."`);
    }
  }
}

function main() {
  console.log("Plugin Catalog Release Helper");
  console.log("==============================");

  const plugins = discoverPlugins();
  console.log(`Found plugins: ${plugins.map((p) => `${p.name}@${p.version}`).join(", ")}`);

  for (const plugin of plugins) {
    buildPlugin(plugin);
    zipPlugin(plugin);
  }

  ensureCatalogRepo();
  syncToCatalog(plugins);

  const didCommit = commitAndPushCatalog();
  if (didCommit) {
    createGitHubReleases(plugins);
  } else {
    console.log(`\n==> Skipping release creation because there were no catalog changes`);
  }

  console.log(`\nDone. Catalog repo: ${CATALOG_DIR}`);
}

main();
