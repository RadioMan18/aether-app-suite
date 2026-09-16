/* eslint-env node */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const pluginDir = path.resolve(process.cwd());
const pkgPath = path.join(pluginDir, "package.json");

if (!fs.existsSync(pkgPath)) {
  console.error("package.json not found. Run this script from a plugin directory.");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const { id, name, version } = pkg;

if (!id || !version) {
  console.error("package.json must contain 'id' and 'version' fields.");
  process.exit(1);
}

const distDir = path.join(pluginDir, "dist");
if (!fs.existsSync(distDir)) {
  console.error(`dist directory not found at ${distDir}. Run 'npm run build' first.`);
  process.exit(1);
}

const tempDir = path.join(pluginDir, `.zip-temp-${Date.now()}`);
fs.mkdirSync(tempDir, { recursive: true });

try {
  const copyRecursive = (src, dest) => {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      for (const entry of fs.readdirSync(src)) {
        copyRecursive(path.join(src, entry), path.join(dest, entry));
      }
    } else {
      fs.copyFileSync(src, dest);
    }
  };

  copyRecursive(distDir, tempDir);

  const manifest = {
    id,
    name: name || id,
    version,
    permissions: pkg.permissions ?? [],
    entry: "index.html",
  };

  fs.writeFileSync(
    path.join(tempDir, "plugin-manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  const outFile = path.join(pluginDir, `${id}-${version}.zip`);

  if (process.platform === "win32") {
    const psScriptPath = path.join(tempDir, "zip.ps1");
    const psScript = [
      "$ErrorActionPreference = 'Stop'",
      "if (Test-Path -LiteralPath '" + outFile.replace(/'/g, "''") + "') {",
      "  Remove-Item -LiteralPath '" + outFile.replace(/'/g, "''") + "' -Force",
      "}",
      "Compress-Archive -Path '" + tempDir.replace(/'/g, "''") + "\\*' -DestinationPath '" + outFile.replace(/'/g, "''") + "' -Force",
    ].join("\n");
    fs.writeFileSync(psScriptPath, psScript);
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}"`, {
      cwd: pluginDir,
      stdio: "pipe",
    });
    fs.rmSync(psScriptPath, { force: true });
  } else {
    execSync(`zip -r "${outFile}" .`, {
      cwd: tempDir,
      stdio: "pipe",
    });
  }

  console.log(`Packaged ${name || id} v${version} -> ${outFile}`);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
