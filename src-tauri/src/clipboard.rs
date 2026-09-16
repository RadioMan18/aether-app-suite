use super::database::Database;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

const CF_UNICODETEXT: u32 = 13;

extern "system" {
    fn OpenClipboard(hwnd: *const std::ffi::c_void) -> i32;
    fn CloseClipboard() -> i32;
    fn GetClipboardData(uFormat: u32) -> *mut std::ffi::c_void;
    fn GlobalLock(hMem: *mut std::ffi::c_void) -> *mut std::ffi::c_void;
    fn GlobalUnlock(hMem: *mut std::ffi::c_void) -> i32;
    fn GlobalSize(hMem: *mut std::ffi::c_void) -> u32;
}

unsafe fn read_clipboard_text() -> Option<String> {
    if OpenClipboard(std::ptr::null()) != 0 {
        let handle = GetClipboardData(CF_UNICODETEXT);
        if !handle.is_null() {
            let ptr = GlobalLock(handle);
            if !ptr.is_null() {
                let size = GlobalSize(handle) as usize;
                if size >= 2 {
                    let slice = std::slice::from_raw_parts(ptr as *const u16, size / 2);
                    let len = slice.iter().position(|&c| c == 0).unwrap_or(slice.len());
                    let text = String::from_utf16_lossy(&slice[..len]);
                    GlobalUnlock(handle);
                    CloseClipboard();
                    return Some(text);
                }
                GlobalUnlock(handle);
            }
        }
        CloseClipboard();
    }
    None
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardPayload {
    pub text: Option<String>,
    pub html: Option<String>,
    pub timestamp: String,
}

pub struct ClipboardService {
    app: AppHandle,
    active_plugin: Arc<Mutex<Option<String>>>,
    running: Arc<Mutex<bool>>,
}

impl ClipboardService {
    pub fn new(app: AppHandle) -> Self {
        Self {
            app,
            active_plugin: Arc::new(Mutex::new(None)),
            running: Arc::new(Mutex::new(false)),
        }
    }

    pub fn set_active_plugin(&self, plugin_id: Option<String>) {
        let mut active = self.active_plugin.lock().unwrap();
        *active = plugin_id;
    }

    pub fn start(&self, app_data_dir: PathBuf) {
        let mut running = self.running.lock().unwrap();
        if *running {
            return;
        }
        *running = true;
        drop(running);

        let app = self.app.clone();
        let active_plugin = self.active_plugin.clone();
        let running = self.running.clone();

        std::thread::spawn(move || {
            let db = match Database::open(app_data_dir) {
                Ok(db) => db,
                Err(e) => {
                    log::error!("Clipboard service failed to open database: {}", e);
                    return;
                }
            };

            let mut last_text: Option<String> = None;
            let mut last_html: Option<String> = None;

            loop {
                if !*running.lock().unwrap() {
                    break;
                }

                std::thread::sleep(std::time::Duration::from_millis(300));

                let active_id = {
                    let active = active_plugin.lock().unwrap();
                    active.clone()
                };

                let should_emit = if let Some(ref plugin_id) = active_id {
                    db.get_plugin_permissions(plugin_id)
                        .map(|perms| perms.contains(&"clipboard:subscribe".to_string()))
                        .unwrap_or(false)
                } else {
                    false
                };

                if !should_emit {
                    last_text = None;
                    last_html = None;
                    continue;
                }

                let text = unsafe { read_clipboard_text() };
                let html = None;

                let mut changed = false;
                let mut payload_text = None;
                let mut payload_html = None;

                if text.as_ref() != last_text.as_ref() {
                    if text.is_some() {
                        payload_text = text.clone();
                        last_text = text.clone();
                        changed = true;
                    } else {
                        last_text = None;
                    }
                }

                if html.as_ref() != last_html.as_ref() {
                    if html.is_some() {
                        payload_html = html.clone();
                        last_html = html.clone();
                        changed = true;
                    } else {
                        last_html = None;
                    }
                }

                if changed {
                    let payload = ClipboardPayload {
                        text: payload_text,
                        html: payload_html,
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    };
                    let _ = app.emit("clipboard:changed", payload);
                }
            }
        });
    }
}
