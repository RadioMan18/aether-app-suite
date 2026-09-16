use crate::database::{CredentialManager, Partition, PartitionManager};
use std::path::PathBuf;

fn setup_test_dir() -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "nidus-test-biometrics-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn test_partition_key_creation() {
    let key = crate::database::PartitionKey::new("test-key".to_string());
    assert_eq!(key.as_str(), "test-key");
}

#[test]
fn test_partition_open_and_lock() {
    let dir = setup_test_dir();
    let db_path = dir.join("data.db");

    CredentialManager::store_partition_key("test-partition", "test-key-123").unwrap();

    let mut partition = Partition::open("test-partition", db_path).unwrap();
    assert!(!partition.is_locked());

    partition.with_connection(|_conn| Ok(())).unwrap();

    partition.lock();
    assert!(partition.is_locked());

    let result = partition.with_connection(|_conn| Ok(()));
    assert!(result.is_err());
}

#[test]
fn test_partition_manager_get_or_open() {
    let dir = setup_test_dir();
    let app_data_dir = dir.join("app");
    std::fs::create_dir_all(&app_data_dir).unwrap();

    CredentialManager::store_partition_key("pm-test", "pm-key").unwrap();

    let manager = PartitionManager::global();
    let p1 = manager
        .get_or_open("pm-test", app_data_dir.clone())
        .unwrap();
    let p2 = manager.get_or_open("pm-test", app_data_dir).unwrap();

    assert!(std::sync::Arc::ptr_eq(&p1, &p2));
}

#[test]
fn test_partition_manager_lock() {
    let dir = setup_test_dir();
    let app_data_dir = dir.join("app");
    std::fs::create_dir_all(&app_data_dir).unwrap();

    CredentialManager::store_partition_key("pm-lock-test", "pm-lock-key").unwrap();

    let manager = PartitionManager::global();
    let partition = manager.get_or_open("pm-lock-test", app_data_dir).unwrap();

    {
        let p = partition.lock().unwrap();
        assert!(!p.is_locked());
    }

    manager.lock("pm-lock-test").unwrap();

    {
        let p = partition.lock().unwrap();
        assert!(p.is_locked());
    }
}

#[test]
fn test_credential_manager_partition_keys() {
    let partition = "biometrics-test";
    let key = "super-secret-key";

    CredentialManager::store_partition_key(partition, key).unwrap();
    let retrieved = CredentialManager::retrieve_partition_key(partition).unwrap();
    assert_eq!(retrieved, key);
}
