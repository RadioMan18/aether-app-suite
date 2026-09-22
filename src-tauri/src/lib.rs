mod biometrics;
mod clipboard;
mod commands;
mod database;
mod ipc;
mod protocol;
mod rss;

#[cfg(test)]
mod biometrics_tests;
#[cfg(test)]
mod clipboard_tests;
#[cfg(test)]
mod tests;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .register_uri_scheme_protocol(
            protocol::PluginProtocol::SCHEME,
            protocol::PluginProtocol::handler,
        )
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::get_app_version,
            commands::fetch_remote_catalog,
            commands::download_plugin_zip,
            commands::initialize_database,
            commands::ensure_database,
            commands::unlock_database,
            commands::get_database_info,
            commands::invoke_biometric_challenge,
            commands::unlock_partition,
            commands::lock_partition,
            commands::register_plugin,
            commands::plugin_ipc,
            commands::install_plugin,
            commands::install_local_plugin,
            commands::list_plugins,
            commands::uninstall_plugin,
            commands::seed_builtin_plugins,
            commands::start_clipboard_streaming,
            commands::set_active_clipboard_plugin,
            commands::rss_add_feed,
            commands::rss_refresh_feed,
            commands::rss_refresh_all_feeds,
            commands::rss_list_feeds,
            commands::rss_list_items,
            commands::rss_mark_item_read,
            commands::rss_mark_item_starred,
            commands::rss_delete_feed
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
