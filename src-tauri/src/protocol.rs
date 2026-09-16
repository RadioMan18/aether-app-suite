use std::path::{Path, PathBuf};
use tauri::{Manager, UriSchemeContext};

static FALLBACK_HTML: &str = r#"
<!DOCTYPE html>
<html>
<head><title>Plugin Not Found</title></head>
<body>
  <h1>Plugin Not Found</h1>
  <p>The requested plugin asset could not be served.</p>
</body>
</html>
"#;

pub struct PluginProtocol;

impl PluginProtocol {
    pub const SCHEME: &'static str = "plugin";

    pub fn handler<R: tauri::Runtime>(
        ctx: UriSchemeContext<'_, R>,
        request: tauri::http::Request<Vec<u8>>,
    ) -> tauri::http::Response<Vec<u8>> {
        let plugins_dir = Self::dev_plugins_dir()
            .or_else(Self::workspace_plugins_dir)
            .or_else(|| Self::plugins_dir(ctx))
            .unwrap_or_else(|| PathBuf::from("plugins"));

        let path = request.uri().path();
        let relative_path = path.strip_prefix('/').unwrap_or(path);
        log::info!(
            "Plugin request: uri={}, base={}, relative={}",
            request.uri(),
            plugins_dir.display(),
            relative_path
        );

        if relative_path.is_empty() || relative_path.ends_with('/') {
            return Self::not_found("Directory listing not allowed");
        }

        let candidate = Self::asset_path(&plugins_dir, relative_path);
        let resolved = match std::fs::canonicalize(&candidate) {
            Ok(p) => p,
            Err(_) => {
                log::warn!("Plugin asset missing: candidate={}", candidate.display());
                return Self::not_found("Plugin asset not found");
            }
        };

        log::info!("Plugin asset resolved: {}", resolved.display());

        let allowed_base = plugins_dir.canonicalize().unwrap_or(plugins_dir);
        if !resolved.starts_with(&allowed_base) {
            return Self::forbidden("Path traversal detected");
        }

        if !resolved.is_file() {
            return Self::not_found("Plugin asset not found");
        }

        match std::fs::read(&resolved) {
            Ok(data) => {
                let mime = Self::mime_type(&resolved);
                tauri::http::Response::builder()
                    .status(tauri::http::StatusCode::OK)
                    .header(tauri::http::header::CONTENT_TYPE, mime)
                    .header(tauri::http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                    .header("Content-Security-Policy", "default-src 'none'; script-src 'self' http://plugin.localhost plugin://localhost; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'none';")
                    .body(data)
                    .unwrap_or_else(|_| Self::not_found("Failed to build response"))
            }
            Err(_) => Self::not_found("Failed to read plugin asset"),
        }
    }

    fn plugins_dir<R: tauri::Runtime>(ctx: UriSchemeContext<'_, R>) -> Option<PathBuf> {
        let app_data = ctx.app_handle().path().app_data_dir().ok()?;
        let plugins_dir = app_data.join("plugins");
        std::fs::create_dir_all(&plugins_dir).ok()?;
        Some(plugins_dir)
    }

    fn asset_path(plugins_dir: &Path, relative_path: &str) -> PathBuf {
        let source_path = plugins_dir.join(relative_path);
        let mut segments = relative_path.splitn(2, '/');
        let plugin_id = segments.next().unwrap_or_default();
        let asset_path = segments.next().unwrap_or_default();
        let dist_dir = plugins_dir.join(plugin_id).join("dist");

        if !asset_path.is_empty() && dist_dir.is_dir() {
            dist_dir.join(asset_path)
        } else {
            source_path
        }
    }

    fn dev_plugins_dir() -> Option<PathBuf> {
        std::env::var("NIDUS_PLUGIN_DIR").ok().map(PathBuf::from)
    }

    fn workspace_plugins_dir() -> Option<PathBuf> {
        if !cfg!(debug_assertions) {
            return None;
        }

        let plugins_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../plugins");
        plugins_dir.is_dir().then_some(plugins_dir)
    }

    fn not_found(message: &str) -> tauri::http::Response<Vec<u8>> {
        let body = format!("<html><body><h1>404</h1><p>{}</p></body></html>", message);
        tauri::http::Response::builder()
            .status(tauri::http::StatusCode::NOT_FOUND)
            .header(tauri::http::header::CONTENT_TYPE, "text/html")
            .body(body.into_bytes())
            .unwrap_or_else(|_| Self::internal_error())
    }

    fn forbidden(message: &str) -> tauri::http::Response<Vec<u8>> {
        let body = format!("<html><body><h1>403</h1><p>{}</p></body></html>", message);
        tauri::http::Response::builder()
            .status(tauri::http::StatusCode::FORBIDDEN)
            .header(tauri::http::header::CONTENT_TYPE, "text/html")
            .body(body.into_bytes())
            .unwrap_or_else(|_| Self::internal_error())
    }

    fn internal_error() -> tauri::http::Response<Vec<u8>> {
        tauri::http::Response::builder()
            .status(tauri::http::StatusCode::INTERNAL_SERVER_ERROR)
            .header(tauri::http::header::CONTENT_TYPE, "text/html")
            .body(FALLBACK_HTML.as_bytes().to_vec())
            .unwrap_or_else(|_| {
                tauri::http::Response::builder()
                    .status(tauri::http::StatusCode::INTERNAL_SERVER_ERROR)
                    .body(Vec::new())
                    .unwrap()
            })
    }

    fn mime_type(path: &Path) -> &'static str {
        match path.extension().and_then(|e| e.to_str()) {
            Some("html") | Some("htm") => "text/html",
            Some("js") | Some("mjs") => "application/javascript",
            Some("css") => "text/css",
            Some("json") => "application/json",
            Some("png") => "image/png",
            Some("jpg") | Some("jpeg") => "image/jpeg",
            Some("svg") => "image/svg+xml",
            Some("ico") => "image/x-icon",
            Some("woff") => "font/woff",
            Some("woff2") => "font/woff2",
            Some("ttf") => "font/ttf",
            Some("wasm") => "application/wasm",
            _ => "application/octet-stream",
        }
    }
}
