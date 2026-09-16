# Operations: Deploy and Monitor

## Objective

Package, distribute, and maintain the Nidus AppSuite application for Windows 11.

## Packaging

- Build release artifacts using `npm run tauri build`
- Generate NSIS installer via Tauri bundler
- Verify installer registers `plugin://` protocol and installs default plugins
- Test clean install on Windows 11 VM

## Distribution

- Publish release artifacts to GitHub Releases
- Maintain changelog aligned with git tags

## Monitoring

- Collect crash reports via Tauri's built-in crash handler
- Monitor plugin install/uninstall events for failure patterns
- Track biometric authentication success/failure rates

## Maintenance

- Update Rust and Node dependencies quarterly
- Re-audit dependencies after each update
- Rotate Windows Credential Manager keys on major version bumps
