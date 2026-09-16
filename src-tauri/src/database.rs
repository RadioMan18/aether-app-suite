use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock};
use zeroize::Zeroize;

pub struct Database {
    #[allow(dead_code)]
    conn: Mutex<rusqlite::Connection>,
    db_path: PathBuf,
}

impl Database {
    pub fn open(app_data_dir: PathBuf) -> Result<Self, String> {
        std::fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;

        let db_path = app_data_dir.join("nidus.db");
        log::info!("Database open retrieving encryption key");
        let key = CredentialManager::retrieve_key().map_err(|e| {
            format!(
                "Failed to retrieve encryption key from credential manager: {}",
                e
            )
        })?;
        log::info!("Database key retrieved; opening SQLCipher database");

        Self::open_with_key(db_path, key)
    }

    pub fn initialize_new(app_data_dir: PathBuf) -> Result<Self, String> {
        std::fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;

        let db_path = app_data_dir.join("nidus.db");
        let mut key = [0u8; 32];
        rand::rng().fill(&mut key);

        let mut key_hex = hex::encode(key);
        CredentialManager::store_key(&key_hex).map_err(|e| {
            format!(
                "Failed to store encryption key in credential manager: {}",
                e
            )
        })?;

        let result = Self::open_with_key(db_path, key_hex.clone());
        key.zeroize();
        key_hex.zeroize();
        result
    }

    pub fn db_path(&self) -> &PathBuf {
        &self.db_path
    }

    #[allow(dead_code)]
    pub fn with_connection<F, R>(&self, f: F) -> Result<R, String>
    where
        F: FnOnce(&rusqlite::Connection) -> Result<R, String>,
    {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("Failed to acquire database lock: {}", e))?;
        f(&conn)
    }

    fn open_with_key(db_path: PathBuf, key: String) -> Result<Self, String> {
        log::info!("Database opening file: {}", db_path.display());
        let conn = rusqlite::Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;

        log::info!("Database applying SQLCipher key");
        conn.execute_batch(&format!("PRAGMA key = '{}';", key))
            .map_err(|e| format!("Failed to set encryption key: {}", e))?;

        log::info!("Database probing decrypted schema");
        conn.query_row("SELECT count(*) FROM sqlite_master", [], |_row| Ok(()))
            .map_err(|e| format!("Failed to open encrypted database: {}", e))?;

        Self::initialize_schema(&conn)
            .map_err(|e| format!("Failed to initialize schema: {}", e))?;

        Ok(Self {
            conn: Mutex::new(conn),
            db_path,
        })
    }

    fn initialize_schema(conn: &rusqlite::Connection) -> Result<(), String> {
        conn.execute_batch(include_str!("schema.sql"))
            .map_err(|e| format!("Failed to initialize schema: {}", e))?;
        Ok(())
    }

    pub fn register_plugin(
        &self,
        id: &str,
        name: &str,
        version: &str,
        permissions: &[String],
    ) -> Result<(), String> {
        self.with_connection(|conn| {
            let permissions_json = serde_json::to_string(permissions)
                .map_err(|e| format!("Failed to serialize permissions: {}", e))?;
            conn.execute(
                "INSERT OR REPLACE INTO plugins (id, name, version, permissions) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![id, name, version, permissions_json],
            )
            .map_err(|e| e.to_string())?;
            Ok(())
        })
    }

    pub fn get_plugin_permissions(&self, plugin_id: &str) -> Result<Vec<String>, String> {
        self.with_connection(|conn| {
            let mut stmt = conn
                .prepare("SELECT permissions FROM plugins WHERE id = ?1")
                .map_err(|e| e.to_string())?;
            let permissions_json: String = stmt
                .query_row(rusqlite::params![plugin_id], |row| row.get(0))
                .map_err(|e| e.to_string())?;
            let permissions: Vec<String> =
                serde_json::from_str(&permissions_json).map_err(|e| e.to_string())?;
            Ok(permissions)
        })
    }

    pub fn list_plugins(&self) -> Result<Vec<PluginInfo>, String> {
        self.with_connection(|conn| {
            let mut stmt = conn
                .prepare("SELECT id, name, version, permissions, installed_at FROM plugins")
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map([], |row| {
                    Ok(PluginInfo {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        version: row.get(2)?,
                        permissions: serde_json::from_str(&row.get::<_, String>(3)?)
                            .unwrap_or_default(),
                        installed_at: row.get(4)?,
                    })
                })
                .map_err(|e| e.to_string())?;
            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())
        })
    }

    pub fn uninstall_plugin(&self, plugin_id: &str) -> Result<(), String> {
        self.with_connection(|conn| {
            conn.execute(
                "DELETE FROM plugins WHERE id = ?1",
                rusqlite::params![plugin_id],
            )
            .map_err(|e| e.to_string())?;
            Ok(())
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PluginInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub permissions: Vec<String>,
    pub installed_at: String,
}

impl Database {
    pub fn plugins_dir(app_data_dir: &Path) -> Result<PathBuf, String> {
        let plugins_dir = app_data_dir.join("plugins");
        std::fs::create_dir_all(&plugins_dir)
            .map_err(|e| format!("Failed to create plugins directory: {}", e))?;
        Ok(plugins_dir)
    }

    pub fn extract_plugin(
        &self,
        app_data_dir: PathBuf,
        plugin_id: &str,
        zip_data: &[u8],
    ) -> Result<PathBuf, String> {
        let plugins_dir = Self::plugins_dir(&app_data_dir)?;
        let plugin_dir = plugins_dir.join(plugin_id);
        std::fs::create_dir_all(&plugin_dir)
            .map_err(|e| format!("Failed to create plugin directory: {}", e))?;

        let cursor = std::io::Cursor::new(zip_data);
        let mut archive = zip::ZipArchive::new(cursor)
            .map_err(|e| format!("Failed to read plugin zip: {}", e))?;

        for i in 0..archive.len() {
            let mut file = archive
                .by_index(i)
                .map_err(|e| format!("Failed to read zip entry: {}", e))?;
            let out_path = plugin_dir.join(file.mangled_name().as_path());
            if file.is_dir() {
                std::fs::create_dir_all(&out_path)
                    .map_err(|e| format!("Failed to create directory: {}", e))?;
            } else {
                if let Some(parent) = out_path.parent() {
                    std::fs::create_dir_all(parent)
                        .map_err(|e| format!("Failed to create parent directory: {}", e))?;
                }
                let mut outfile = std::fs::File::create(&out_path)
                    .map_err(|e| format!("Failed to create file: {}", e))?;
                std::io::copy(&mut file, &mut outfile)
                    .map_err(|e| format!("Failed to write file: {}", e))?;
            }
        }

        Ok(plugin_dir)
    }

    pub fn remove_plugin_files(
        &self,
        app_data_dir: PathBuf,
        plugin_id: &str,
    ) -> Result<(), String> {
        let plugins_dir = Self::plugins_dir(&app_data_dir)?;
        let plugin_dir = plugins_dir.join(plugin_id);
        if plugin_dir.exists() {
            std::fs::remove_dir_all(&plugin_dir)
                .map_err(|e| format!("Failed to remove plugin directory: {}", e))?;
        }
        Ok(())
    }
}

pub struct PartitionKey(zeroize::Zeroizing<String>);

#[allow(dead_code)]
impl PartitionKey {
    pub fn new(key: String) -> Self {
        Self(zeroize::Zeroizing::new(key))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[allow(dead_code)]
pub struct Partition {
    name: String,
    key: Option<PartitionKey>,
    conn: Option<Mutex<rusqlite::Connection>>,
    db_path: PathBuf,
}

impl Partition {
    pub fn open(name: &str, db_path: PathBuf) -> Result<Self, String> {
        let key = CredentialManager::retrieve_partition_key(name)?;
        let key_for_pragma = key.clone();

        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create partition directory: {}", e))?;
        }

        let conn = rusqlite::Connection::open(&db_path)
            .map_err(|e| format!("Failed to open partition database: {}", e))?;

        conn.execute_batch(&format!("PRAGMA key = '{}';", key_for_pragma))
            .map_err(|e| format!("Failed to set partition encryption key: {}", e))?;

        conn.query_row("SELECT count(*) FROM sqlite_master", [], |_row| Ok(()))
            .map_err(|e| format!("Failed to open encrypted partition: {}", e))?;

        Ok(Self {
            name: name.to_string(),
            key: Some(PartitionKey::new(key)),
            conn: Some(Mutex::new(conn)),
            db_path,
        })
    }

    pub fn lock(&mut self) {
        self.conn = None;
        self.key = None;
    }

    pub fn is_locked(&self) -> bool {
        self.conn.is_none()
    }

    #[allow(dead_code)]
    pub fn with_connection<F, R>(&self, f: F) -> Result<R, String>
    where
        F: FnOnce(&rusqlite::Connection) -> Result<R, String>,
    {
        let conn = self
            .conn
            .as_ref()
            .ok_or("Partition is locked")?
            .lock()
            .map_err(|e| format!("Failed to acquire partition lock: {}", e))?;
        f(&conn)
    }
}

#[allow(dead_code)]
pub struct PartitionManager {
    partitions: Mutex<HashMap<String, Arc<Mutex<Partition>>>>,
}

impl PartitionManager {
    pub fn global() -> &'static Self {
        static INSTANCE: OnceLock<PartitionManager> = OnceLock::new();
        INSTANCE.get_or_init(|| Self {
            partitions: Mutex::new(HashMap::new()),
        })
    }

    pub fn get_or_open(
        &self,
        name: &str,
        app_data_dir: PathBuf,
    ) -> Result<Arc<Mutex<Partition>>, String> {
        let mut partitions = self.partitions.lock().unwrap();
        if let Some(partition) = partitions.get(name) {
            return Ok(partition.clone());
        }

        let db_path = app_data_dir.join("plugins").join(name).join("data.db");
        let partition = Partition::open(name, db_path)?;
        let arc = Arc::new(Mutex::new(partition));
        partitions.insert(name.to_string(), arc.clone());
        Ok(arc)
    }

    pub fn lock(&self, name: &str) -> Result<(), String> {
        let partitions = self.partitions.lock().unwrap();
        if let Some(partition) = partitions.get(name) {
            let mut p = partition.lock().unwrap();
            p.lock();
        }
        Ok(())
    }

    #[allow(dead_code)]
    pub fn is_locked(&self, name: &str) -> bool {
        let partitions = self.partitions.lock().unwrap();
        partitions.get(name).map_or(true, |p| {
            let p = p.lock().unwrap();
            p.is_locked()
        })
    }
}

pub struct CredentialManager;

#[allow(dead_code)]
impl CredentialManager {
    const SERVICE: &'static str = "nidus";
    const MAIN_USERNAME: &'static str = "db-encryption-key";

    pub fn store_key(key: &str) -> Result<(), String> {
        let entry = keyring::Entry::new(Self::SERVICE, Self::MAIN_USERNAME)
            .map_err(|e| format!("Failed to create credential manager entry: {}", e))?;
        entry
            .set_password(key)
            .map_err(|e| format!("Failed to store encryption key: {}", e))?;
        Ok(())
    }

    pub fn retrieve_key() -> Result<String, String> {
        let entry = keyring::Entry::new(Self::SERVICE, Self::MAIN_USERNAME)
            .map_err(|e| format!("Failed to create credential manager entry: {}", e))?;
        entry
            .get_password()
            .map_err(|e| format!("Failed to retrieve encryption key: {}", e))
    }

    pub fn store_partition_key(partition: &str, key: &str) -> Result<(), String> {
        let entry = keyring::Entry::new(Self::SERVICE, &format!("partition-{}-key", partition))
            .map_err(|e| format!("Failed to create credential manager entry: {}", e))?;
        entry
            .set_password(key)
            .map_err(|e| format!("Failed to store partition encryption key: {}", e))?;
        Ok(())
    }

    pub fn retrieve_partition_key(partition: &str) -> Result<String, String> {
        let entry = keyring::Entry::new(Self::SERVICE, &format!("partition-{}-key", partition))
            .map_err(|e| format!("Failed to create credential manager entry: {}", e))?;
        entry
            .get_password()
            .map_err(|e| format!("Failed to retrieve partition encryption key: {}", e))
    }
}
