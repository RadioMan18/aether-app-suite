use crate::biometrics::{BiometricAuth, BiometricResult};
use crate::clipboard::ClipboardService;
use crate::database::{Database, PartitionManager, PluginInfo};
use crate::ipc::{PluginBroker, PluginRequest, PluginResponse};
use crate::rss::{Feed, FeedItem, RssService};
use base64::{Engine as _, engine::general_purpose};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize)]
pub struct GreetPayload {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GreetResponse {
    pub greeting: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseInfo {
    pub path: String,
    pub initialized: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InstalledPluginInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub permissions: Vec<String>,
    pub installed_at: String,
}

#[tauri::command]
pub fn greet(payload: GreetPayload) -> Result<GreetResponse, String> {
    Ok(GreetResponse {
        greeting: format!("Hello, {}! You have been greeted from Rust!", payload.name),
    })
}

#[tauri::command]
pub async fn fetch_remote_catalog(url: String) -> Result<String, String> {
    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("Catalog download failed: {}", e))?;
    if !response.status().is_success() {
        return Err(format!(
            "Catalog fetch failed: {} {}",
            response.status().as_u16(),
            response
                .status()
                .canonical_reason()
                .unwrap_or("Unknown")
        ));
    }
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read catalog bytes: {}", e))?
        .to_vec();
    Ok(general_purpose::STANDARD.encode(&bytes))
}

#[tauri::command]
pub async fn download_plugin_zip(url: String) -> Result<String, String> {
    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("Plugin download failed: {}", e))?;
    if !response.status().is_success() {
        return Err(format!(
            "Download failed: {} {}",
            response.status().as_u16(),
            response
                .status()
                .canonical_reason()
                .unwrap_or("Unknown")
        ));
    }
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read plugin zip bytes: {}", e))?
        .to_vec();
    Ok(general_purpose::STANDARD.encode(&bytes))
}

#[tauri::command]
pub fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[tauri::command]
pub fn initialize_database(app: AppHandle) -> Result<DatabaseInfo, String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::initialize_new(app_data_dir.clone()).map_err(|e| e.to_string())?;

    Ok(DatabaseInfo {
        path: db.db_path().to_string_lossy().to_string(),
        initialized: true,
    })
}

#[tauri::command]
pub fn ensure_database(app: AppHandle) -> Result<DatabaseInfo, String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db_path = app_data_dir.join("nidus.db");
    let _db = if db_path.exists() {
        Database::open(app_data_dir).map_err(|e| e.to_string())?
    } else {
        Database::initialize_new(app_data_dir).map_err(|e| e.to_string())?
    };

    Ok(DatabaseInfo {
        path: db_path.to_string_lossy().to_string(),
        initialized: true,
    })
}

#[tauri::command]
pub async fn unlock_database(app: AppHandle) -> Result<DatabaseInfo, String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db_path = app_data_dir.join("nidus.db");

    if !db_path.exists() {
        return Err("Database does not exist. Please initialize first.".to_string());
    }

    let auth = BiometricAuth::new();
    let biometric_result = auth
        .invoke_challenge("Unlock Nidus")
        .await
        .map_err(|e| format!("Biometric challenge failed: {}", e))?;

    if !biometric_result.success {
        return Err(format!(
            "Biometric verification failed: {}",
            biometric_result.message
        ));
    }

    let _db = Database::open(app_data_dir).map_err(|e| e.to_string())?;

    Ok(DatabaseInfo {
        path: db_path.to_string_lossy().to_string(),
        initialized: true,
    })
}

#[tauri::command]
pub fn get_database_info(app: AppHandle) -> Result<Option<DatabaseInfo>, String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db_path = app_data_dir.join("nidus.db");

    if !db_path.exists() {
        return Ok(None);
    }

    Ok(Some(DatabaseInfo {
        path: db_path.to_string_lossy().to_string(),
        initialized: true,
    }))
}

#[tauri::command]
pub async fn invoke_biometric_challenge(message: String) -> Result<BiometricResult, String> {
    let auth = BiometricAuth::new();
    auth.invoke_challenge(&message).await
}

#[tauri::command]
pub async fn unlock_partition(app: AppHandle, name: String, message: String) -> Result<(), String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let auth = BiometricAuth::new();
    auth.unlock_partition(&name, &message, app_data_dir).await
}

#[tauri::command]
pub fn lock_partition(name: String) -> Result<(), String> {
    PartitionManager::global().lock(&name)
}

#[tauri::command]
pub fn register_plugin(
    app: AppHandle,
    id: String,
    name: String,
    version: String,
    permissions: Vec<String>,
) -> Result<(), String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir).map_err(|e| e.to_string())?;
    db.register_plugin(&id, &name, &version, &permissions)
}

#[tauri::command]
pub fn plugin_ipc(app: AppHandle, request: PluginRequest) -> Result<PluginResponse, String> {
    log::info!(
        "Plugin IPC request: plugin={}, type={}, id={}",
        request.plugin_id,
        request.request_type,
        request.id
    );
    let app_data_dir = get_app_data_dir(&app)?;
    log::info!("Plugin IPC opening database: {}", app_data_dir.display());
    let db = Database::open(app_data_dir).map_err(|e| e.to_string())?;
    log::info!("Plugin IPC database opened: plugin={}", request.plugin_id);
    let broker = PluginBroker::new(&db);
    let plugin_id = request.plugin_id.clone();
    log::info!(
        "Plugin IPC handling request: plugin={}, type={}",
        plugin_id,
        request.request_type
    );
    let response = broker.handle(&plugin_id, request)?;
    log::info!(
        "Plugin IPC response: plugin={}, id={}, success={}, error={:?}",
        plugin_id,
        response.id,
        response.success,
        response.error
    );
    Ok(response)
}

#[tauri::command]
pub fn install_plugin(
    app: AppHandle,
    id: String,
    name: String,
    version: String,
    permissions: Vec<String>,
    zip_data: Vec<u8>,
    checksum: Option<String>,
) -> Result<(), String> {
    if let Some(expected) = checksum {
        let mut hasher = Sha256::new();
        hasher.update(&zip_data);
        let actual = format!("sha256:{}", hex::encode(hasher.finalize()));
        if actual != expected {
            return Err(format!(
                "Checksum mismatch: expected {}, got {}",
                expected, actual
            ));
        }
    }

    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir.clone()).map_err(|e| e.to_string())?;

    let cursor = std::io::Cursor::new(&zip_data);
    let mut archive =
        zip::ZipArchive::new(cursor).map_err(|e| format!("Failed to read plugin zip: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Failed to read zip entry: {}", e))?;
        if file.name() == "plugin-manifest.json" {
            let manifest_data: serde_json::Value = serde_json::from_reader(&mut file)
                .map_err(|e| format!("Failed to parse plugin-manifest.json: {}", e))?;
            if let Some(manifest_id) = manifest_data.get("id").and_then(|v| v.as_str()) {
                if manifest_id != id {
                    return Err(format!(
                        "Manifest id mismatch: expected {}, got {}",
                        id, manifest_id
                    ));
                }
            }
            if let Some(manifest_version) = manifest_data.get("version").and_then(|v| v.as_str()) {
                if manifest_version != version {
                    return Err(format!(
                        "Manifest version mismatch: expected {}, got {}",
                        version, manifest_version
                    ));
                }
            }
            break;
        }
    }

    db.register_plugin(&id, &name, &version, &permissions)?;
    db.extract_plugin(app_data_dir, &id, &zip_data).map(|_| ())
}

#[tauri::command]
pub fn install_local_plugin(app: AppHandle, path: String) -> Result<InstalledPluginInfo, String> {
    let zip_data = std::fs::read(&path).map_err(|e| format!("Failed to read plugin zip: {}", e))?;

    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir.clone()).map_err(|e| e.to_string())?;

    let cursor = std::io::Cursor::new(&zip_data);
    let mut archive =
        zip::ZipArchive::new(cursor).map_err(|e| format!("Failed to read plugin zip: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Failed to read zip entry: {}", e))?;
        if file.name() == "plugin-manifest.json" {
            let manifest_data: serde_json::Value = serde_json::from_reader(&mut file)
                .map_err(|e| format!("Failed to parse plugin-manifest.json: {}", e))?;
            let manifest_id = manifest_data.get("id").and_then(|v| v.as_str()).map(|s| s.to_string());
            let manifest_version = manifest_data
                .get("version")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            let permissions = manifest_data
                .get("permissions")
                .and_then(|v| v.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect::<Vec<_>>()
                })
                .unwrap_or_default();
            let name = manifest_data
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or(manifest_id.as_deref().unwrap_or(""))
                .to_string();
            let id = manifest_id.unwrap_or_else(|| {
                PathBuf::from(&path)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .map(|s| s.to_string())
                    .unwrap_or_default()
            });
            let version = manifest_version.unwrap_or_else(|| "0.1.0-dev".to_string());

            db.register_plugin(&id, &name, &version, &permissions)?;
            db.extract_plugin(app_data_dir, &id, &zip_data).map(|_| ())?;

            return Ok(InstalledPluginInfo {
                id,
                name,
                version,
                permissions,
                installed_at: chrono::Utc::now().to_rfc3339(),
            });
        }
    }

    Err("plugin-manifest.json not found in zip".to_string())
}

#[tauri::command]
pub fn list_plugins(app: AppHandle) -> Result<Vec<PluginInfo>, String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir).map_err(|e| e.to_string())?;
    db.list_plugins()
}

#[tauri::command]
pub fn uninstall_plugin(app: AppHandle, id: String) -> Result<(), String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir.clone()).map_err(|e| e.to_string())?;
    db.uninstall_plugin(&id)?;
    db.remove_plugin_files(app_data_dir, &id)
}

#[tauri::command]
pub fn seed_builtin_plugins(app: AppHandle) -> Result<(), String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir).map_err(|e| e.to_string())?;

    let builtins = [
        (
            "journal",
            "Journal",
            "1.0.0",
            vec!["db:read".to_string(), "db:write".to_string()],
        ),
        (
            "todo",
            "Todo List",
            "1.0.0",
            vec!["db:read".to_string(), "db:write".to_string()],
        ),
        (
            "goals",
            "Goals",
            "1.0.0",
            vec!["db:read".to_string(), "db:write".to_string()],
        ),
        (
            "plugin-store",
            "Plugin Store",
            "1.0.0",
            vec![],
        ),
    ];

    for (id, name, version, permissions) in builtins {
        db.register_plugin(id, name, version, &permissions)?;
    }

    Ok(())
}

static CLIPBOARD_SERVICE: Mutex<Option<Arc<ClipboardService>>> = Mutex::new(None);

#[tauri::command]
pub fn start_clipboard_streaming(app: AppHandle) -> Result<(), String> {
    let mut guard = CLIPBOARD_SERVICE.lock().unwrap();
    if guard.is_some() {
        return Ok(());
    }
    let app_data_dir = get_app_data_dir(&app)?;
    let service = ClipboardService::new(app);
    service.start(app_data_dir);
    *guard = Some(Arc::new(service));
    Ok(())
}

#[tauri::command]
pub fn set_active_clipboard_plugin(plugin_id: Option<String>) -> Result<(), String> {
    let guard = CLIPBOARD_SERVICE.lock().unwrap();
    if let Some(service) = guard.as_ref() {
        service.set_active_plugin(plugin_id);
    }
    Ok(())
}

#[tauri::command]
pub async fn rss_add_feed(app: AppHandle, url: String) -> Result<Feed, String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir).map_err(|e| e.to_string())?;
    let service = RssService::new(&db);
    service.add_feed(&url).await
}

#[tauri::command]
pub async fn rss_refresh_feed(app: AppHandle, feed_id: String) -> Result<(), String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir).map_err(|e| e.to_string())?;
    let service = RssService::new(&db);
    service.refresh_feed(&feed_id).await
}

#[tauri::command]
pub async fn rss_refresh_all_feeds(app: AppHandle) -> Result<usize, String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir).map_err(|e| e.to_string())?;
    let service = RssService::new(&db);
    service.refresh_all_feeds().await
}

#[tauri::command]
pub fn rss_list_feeds(app: AppHandle) -> Result<Vec<Feed>, String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir).map_err(|e| e.to_string())?;
    let service = RssService::new(&db);
    service.list_feeds()
}

#[tauri::command]
pub fn rss_list_items(
    app: AppHandle,
    feed_id: Option<String>,
    unread_only: bool,
    limit: Option<usize>,
) -> Result<Vec<FeedItem>, String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir).map_err(|e| e.to_string())?;
    let service = RssService::new(&db);
    service.list_items(feed_id.as_deref(), unread_only, limit)
}

#[tauri::command]
pub fn rss_mark_item_read(app: AppHandle, item_id: String, is_read: bool) -> Result<(), String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir).map_err(|e| e.to_string())?;
    let service = RssService::new(&db);
    service.mark_item_read(&item_id, is_read)
}

#[tauri::command]
pub fn rss_mark_item_starred(
    app: AppHandle,
    item_id: String,
    is_starred: bool,
) -> Result<(), String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir).map_err(|e| e.to_string())?;
    let service = RssService::new(&db);
    service.mark_item_starred(&item_id, is_starred)
}

#[tauri::command]
pub fn rss_delete_feed(app: AppHandle, feed_id: String) -> Result<(), String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let db = Database::open(app_data_dir).map_err(|e| e.to_string())?;
    let service = RssService::new(&db);
    service.delete_feed(&feed_id)
}

fn get_app_data_dir(_app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = dirs::data_dir()
        .ok_or_else(|| "Failed to determine app data directory".to_string())?
        .join("nidus");

    Ok(app_data_dir)
}
