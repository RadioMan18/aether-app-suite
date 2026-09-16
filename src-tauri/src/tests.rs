use crate::database::Database;
use crate::ipc::{PluginBroker, PluginRequest};
use crate::rss::RssService;
use serde_json::json;

fn setup_test_db() -> Database {
    let unique_dir = std::env::temp_dir().join(format!(
        "nidus-test-cat001-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let db = Database::initialize_new(unique_dir).expect("Failed to create test database");
    db.with_connection(|conn| {
        conn.execute_batch(include_str!("schema.sql"))
            .map_err(|e| e.to_string())
    })
    .expect("Failed to run schema");
    db
}

#[test]
fn test_todo_get_tasks_schema_valid() {
    let db = setup_test_db();
    let broker = PluginBroker::new(&db);

    db.register_plugin("test-plugin", "Test", "1.0.0", &["db:read".to_string()])
        .expect("Failed to register test plugin");

    let request = PluginRequest {
        id: "1".to_string(),
        plugin_id: "test-plugin".to_string(),
        request_type: "todo:get_tasks".to_string(),
        payload: json!({
            "completed": true,
            "limit": 10
        }),
    };

    let response = broker.handle("test-plugin", request);
    assert!(response.is_ok());
    let resp = response.unwrap();
    assert!(resp.success);
    assert!(resp.error.is_none());
    assert!(resp.data.is_some());
}

#[test]
fn test_todo_get_tasks_schema_invalid() {
    let db = setup_test_db();
    let broker = PluginBroker::new(&db);

    db.register_plugin("test-plugin", "Test", "1.0.0", &["db:read".to_string()])
        .expect("Failed to register test plugin");

    let request = PluginRequest {
        id: "1".to_string(),
        plugin_id: "test-plugin".to_string(),
        request_type: "todo:get_tasks".to_string(),
        payload: json!({
            "completed": "not_a_boolean"
        }),
    };

    let response = broker.handle("test-plugin", request);
    assert!(response.is_ok());
    let resp = response.unwrap();
    assert!(!resp.success);
    assert!(resp.error.is_some());
    assert!(resp.error.unwrap().contains("Invalid payload"));
}

#[test]
fn test_goals_get_milestones_schema_valid() {
    let db = setup_test_db();
    let broker = PluginBroker::new(&db);

    db.register_plugin("test-plugin", "Test", "1.0.0", &["db:read".to_string()])
        .expect("Failed to register test plugin");

    let request = PluginRequest {
        id: "1".to_string(),
        plugin_id: "test-plugin".to_string(),
        request_type: "goals:get_milestones".to_string(),
        payload: json!({
            "status": "active"
        }),
    };

    let response = broker.handle("test-plugin", request);
    assert!(response.is_ok());
    let resp = response.unwrap();
    assert!(resp.success);
    assert!(resp.error.is_none());
    assert!(resp.data.is_some());
}

#[test]
fn test_goals_get_milestones_schema_invalid() {
    let db = setup_test_db();
    let broker = PluginBroker::new(&db);

    db.register_plugin("test-plugin", "Test", "1.0.0", &["db:read".to_string()])
        .expect("Failed to register test plugin");

    let request = PluginRequest {
        id: "1".to_string(),
        plugin_id: "test-plugin".to_string(),
        request_type: "goals:get_milestones".to_string(),
        payload: json!({
            "status": "invalid_status"
        }),
    };

    let response = broker.handle("test-plugin", request);
    assert!(response.is_ok());
    let resp = response.unwrap();
    assert!(!resp.success);
    assert!(resp.error.is_some());
    assert!(resp.error.unwrap().contains("Invalid payload"));
}

#[tokio::test]
async fn test_rss_add_feed_and_list() {
    let db = setup_test_db();
    let service = RssService::new(&db);

    let mut mock_server = mockito::Server::new_async().await;
    let feed_url = mock_server.url() + "/feed.xml";
    let feed_xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>https://example.com</link>
    <description>Test description</description>
    <item>
      <title>Item 1</title>
      <link>https://example.com/item1</link>
      <description>Summary 1</description>
      <author>Author 1</author>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>"#;
    mock_server
        .mock("GET", "/feed.xml")
        .with_status(200)
        .with_body(feed_xml)
        .create();

    let feed = service.add_feed(&feed_url).await;
    assert!(feed.is_ok());
    let feed = feed.unwrap();
    assert_eq!(feed.title, Some("Test Feed".to_string()));

    let feeds = service.list_feeds().unwrap();
    assert_eq!(feeds.len(), 1);
    assert_eq!(feeds[0].id, feed.id);

    let items = service.list_items(Some(&feed.id), false, None).unwrap();
    assert_eq!(items.len(), 1);
    assert_eq!(items[0].title, Some("Item 1".to_string()));
}

#[tokio::test]
async fn test_rss_mark_read_and_starred() {
    let db = setup_test_db();
    let service = RssService::new(&db);

    let mut mock_server = mockito::Server::new_async().await;
    let feed_url = mock_server.url() + "/feed.xml";
    let feed_xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>https://example.com</link>
    <item>
      <title>Item 1</title>
      <link>https://example.com/item1</link>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>"#;
    mock_server
        .mock("GET", "/feed.xml")
        .with_status(200)
        .with_body(feed_xml)
        .create();

    let feed = service.add_feed(&feed_url).await.unwrap();
    let items = service.list_items(Some(&feed.id), false, None).unwrap();
    let item_id = &items[0].id;

    service.mark_item_read(item_id, true).unwrap();
    let updated = service.list_items(Some(&feed.id), false, None).unwrap();
    assert!(updated[0].is_read);

    service.mark_item_starred(item_id, true).unwrap();
    let starred = service.list_items(Some(&feed.id), false, None).unwrap();
    assert!(starred[0].is_starred);
}
