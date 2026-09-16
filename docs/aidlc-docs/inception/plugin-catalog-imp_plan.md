---
project_name: "Technical Architecture Plan: Nidus — Plugin Catalog Expansion"
critical_path: "CAT-004 → CAT-008 → CAT-015"
total_cost: 132.08
bottlenecks: "CAT-004, CAT-001, CAT-015"
shortest_path: "CAT-011 → CAT-015"
total_tasks: 15
phases: 3
---

# Technical Architecture Plan: Nidus — Plugin Catalog Expansion — Implementation Plan

## 1. Project Overview

Technical specification for Technical Architecture Plan: Nidus — Plugin Catalog Expansion.

**Technology Stack:**

- TypeScript
- React
- Tailwind CSS
- Mermaid.js
- ESLint
- Vite
- Requests
- Tauri

## 2. Graph-Based Task Analysis

### 2.1 Task Decomposition

The project is decomposed into 15 discrete tasks. Each task is assigned a weight using the formula:

$$\text{Weight} = \text{Estimated Hours} \times \text{Complexity Factor} \times \text{Risk Factor}$$

| Task ID | Task Name | Est. Hours | Complexity | Risk | Weight | Dependencies |
| --------- | --------- | ---------- | ---------- | ---- | ------ | ------------ |
| CAT-001 | Data Broker API Extension (JSON Schema Val... | 12.0 | 1.8 | 1.3 | 28.08 | None |
| CAT-002 | Host-Mediated RSS Background Fetch Service | 16.0 | 2.0 | 1.5 | 48.00 | None |
| CAT-003 | Host-Active Clipboard Streaming Service | 10.0 | 1.8 | 1.4 | 25.20 | None |
| CAT-004 | Independent Biometric Challenge & Auto-Rel... | 14.0 | 2.2 | 1.6 | 49.28 | None |
| CAT-005 | Calendar / Scheduler Plugin | 14.0 | 1.8 | 1.3 | 32.76 | CAT-001 |
| CAT-006 | Kanban / Project Board Plugin | 14.0 | 1.6 | 1.2 | 26.88 | CAT-001 |
| CAT-007 | Pomodoro / Focus Timer Plugin | 8.0 | 1.3 | 1.0 | 10.40 | None |
| CAT-008 | Linked Notes / Knowledge Graph Plugin | 18.0 | 2.2 | 1.5 | 59.40 | CAT-004 |
| CAT-009 | Password / Secrets Vault Plugin | 10.0 | 1.8 | 1.6 | 28.80 | CAT-004 |
| CAT-010 | Budget / Expense Tracker Plugin | 12.0 | 1.5 | 1.2 | 21.60 | CAT-001 |
| CAT-011 | Mood / Wellness Tracker Plugin | 8.0 | 1.2 | 1.0 | 9.60 | None |
| CAT-012 | Contacts / Mini-CRM Plugin | 10.0 | 1.4 | 1.0 | 14.00 | None |
| CAT-013 | Clipboard Manager / Snippet Vault Plugin | 9.0 | 1.6 | 1.3 | 18.72 | CAT-003 |
| CAT-014 | Read-It-Later / RSS Reader Plugin | 10.0 | 1.4 | 1.8 | 25.20 | CAT-002 |
| CAT-015 | Integration Smoke Testing & Verification | 12.0 | 1.5 | 1.3 | 23.40 | CAT-005, CAT-006, CAT-007, CAT-008, CAT-009, CAT-010, CAT-011, CAT-012, CAT-013, CAT-014 |

### 2.2 Critical Path Analysis (CPM)

The Critical Path determines the minimum project duration. It is the longest path through the DAG.

- **Critical Path:** CAT-004 → CAT-008 → CAT-015
- **Total Weighted Duration:** 132.08 hours
- **Bottleneck:** CAT-004, CAT-001, CAT-015

Using Dijkstra's algorithm to find the path of least resistance (minimum weight) to the integration milestone:

- **Shortest Path:** CAT-011 → CAT-015
- **Weighted Cost:** 33.00 hours

## 3. Execution Strategy

> **Phase Gate Policy:** Each phase concludes with a mandatory **Testing Gate**.
> The gate must return **ALL GREEN** (zero errors, zero warnings) before the next phase may begin.
> If any check fails, the current phase must be remediated and the gate re-run.

### Phase 1: Backend & Frontend (CAT-001 to CAT-012)

**Tasks:** CAT-001, CAT-002, CAT-003, CAT-004, CAT-007, CAT-011, CAT-012

#### `CAT-001`: Data Broker API Extension (JSON Schema Validation)

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 12.0 |
| Complexity | 1.8 |
| Risk | 1.3 |
| Weight | 28.08 |
| Module | `src-tauri/src/ipc.rs` |
| Dependencies | None |

**Objective:**

Extend the core Data Broker in the Tauri host to support a standardized, read-only query API for cross-plugin communication. Integrate the jsonschema crate to validate incoming query payloads against predefined schemas before execution.

**Technical Approach:**

Integrate the jsonschema crate in Rust. Define static JSON schemas for allowed cross-plugin queries (e.g., todo:get_tasks, goals:get_milestones) in src-tauri/schemas/. Intercept incoming IPC requests in ipc.rs. Validate the payload against the corresponding schema before executing the query. Reject invalid payloads with descriptive, non-sensitive error messages.

**Files to Create/Modify:**

- `src-tauri/src/ipc.rs`
- `src-tauri/schemas/todo_get_tasks.json`
- `src-tauri/schemas/goals_get_milestones.json`
- `src-tauri/src/tests.rs`

**Acceptance Criteria:**

- [x] Host successfully parses and validates incoming query payloads against JSON schemas.
- [x] Malformed payloads are rejected immediately with a 400 Bad Request equivalent IPC error.
- [x] Authorized, valid queries successfully return read-only datasets to the requesting plugin.

**Testing Requirements:**

Write unit tests in `src-tauri/src/tests.rs` to verify validation of valid and invalid payloads. Ensure that unauthorized queries are blocked and return appropriate error codes. Target 85% code coverage for the validation module.

**Implementation Notes:**

- Added `jsonschema = "0.33.0"` to `src-tauri/Cargo.toml`.
- Added `todo:get_tasks` and `goals:get_milestones` typed endpoints with schema validation.
- Tests cover valid and invalid payloads for both endpoints. Gate 1 passes.

No upstream dependencies — this is a foundational task.

#### `CAT-002`: Host-Mediated RSS Background Fetch Service

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 16.0 |
| Complexity | 2.0 |
| Risk | 1.5 |
| Weight | 48.00 |
| Module | `src-tauri/src/rss.rs` |
| Dependencies | None |

**Objective:**

Implement a secure, background RSS fetch service on the Rust host that reads feed URLs from a user-editable configuration file, fetches them, and writes them directly to the plugin's encrypted SQLCipher partition.

**Technical Approach:**

Create a background thread/worker in Rust using tokio and reqwest. Read feed URLs from a user-editable configuration file (feeds.json) located in the local app data directory (%APPDATA%/nidus/feeds.json). Fetch XML feeds, parse them into a structured JSON format, and write them directly to the RSS plugin's SQLCipher database partition. Ensure the plugin iframe's CSP remains strictly set to connect-src 'none'.

**Files to Create/Modify:**

- `src-tauri/src/rss.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/src/commands.rs`
- `src-tauri/src/schema.sql`
- `src-tauri/src/tests.rs`

**Acceptance Criteria:**

- [x] Background service successfully reads URLs and writes parsed feed data to the encrypted SQLCipher partition without blocking the main thread.
- [x] RSS Reader frontend can list feeds, view items, mark read/starred, and trigger refreshes via Tauri commands.

**Testing Requirements:**

Write unit tests in `src-tauri/src/tests.rs` using `mockito` and `feed-rs` to verify feed fetching, parsing, dedup, and state transitions. Target 80% coverage for `rss.rs`.

**Implementation Notes:**

- Added `tokio`, `feed-rs`, `reqwest` (with `rustls` feature), `mockito`, and `base64` dependencies.
- Added `rss_feeds` and `rss_items` tables with indexes to `schema.sql`.
- Added 8 Tauri commands for feed/item management (`rss_add_feed`, `rss_list_feeds`, `rss_list_items`, `rss_refresh_feed`, `rss_refresh_all_feeds`, `rss_mark_item_read`, `rss_mark_item_starred`, `rss_delete_feed`).
- Added `seed_builtin_plugins` command that registers journal, todo, goals, and plugin-store as builtins. RSS is not seeded as a builtin; it is installed from the catalog like other plugins.
- Added `fetch_remote_catalog` and `download_plugin_zip` Tauri commands in `commands.rs` that proxy HTTP through `reqwest`/`rustls` and return base64-encoded data to bypass CORS.

No upstream dependencies — this is a foundational task.

#### `CAT-003`: Host-Active Clipboard Streaming Service

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 10.0 |
| Complexity | 1.8 |
| Risk | 1.4 |
| Weight | 25.20 |
| Module | `src-tauri/src/clipboard.rs` |
| Dependencies | None |

**Objective:**

Implement a host-side clipboard listener that monitors the OS clipboard, filters for plain text/HTML, and actively streams changes to authorized plugins.

**Technical Approach:**

Use native Tauri clipboard APIs or a specialized crate (e.g., clipboard-master) to listen for OS clipboard changes. Filter out non-textual data (e.g., files, images, rich binary formats) to prevent performance degradation and security leaks. Stream plain text/HTML updates to the frontend via Tauri events. Expose a permission gate (clipboard:subscribe) in the plugin manifest.

**Files to Create/Modify:**

- `src-tauri/src/clipboard.rs`
- `src-tauri/src/ipc.rs`
- `src-tauri/src/commands.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/tests/clipboard_tests.rs`
- `src/App.tsx`
- `src/components/Shell/StatusBar.tsx`

**Acceptance Criteria:**

- [x] Host successfully detects clipboard changes and filters out non-text/HTML data.
- [x] Changes are streamed to the frontend only if the active plugin has the clipboard:subscribe permission.
- [x] A clear, non-intrusive visual notice is displayed to the user when clipboard streaming is active.

**Testing Requirements:**

Write unit tests in `src-tauri/src/clipboard_tests.rs` to verify filtering logic, permission checks, and payload serialization.

**Implementation Notes:**

- Added `clipboard.rs` with `ClipboardService` that polls the Windows clipboard via `OpenClipboard`/`GetClipboardData` in a background thread.
- Filters for plain text only; binary and non-text formats are ignored.
- Checks active plugin permissions via `db.get_plugin_permissions` before emitting `clipboard:changed` events.
- Added `start_clipboard_streaming` and `set_active_clipboard_plugin` Tauri commands.
- Added `clipboard:subscribe` to the IPC permission gate in `ipc.rs`.
- Frontend listens for `clipboard:changed` and displays a streaming notice in the status bar when active.

**Integration Notes:**

No upstream dependencies — this is a foundational task.

#### `CAT-004`: Independent Biometric Challenge & Auto-Relock

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 14.0 |
| Complexity | 2.2 |
| Risk | 1.6 |
| Weight | 49.28 |
| Module | `src-tauri/src/biometrics.rs` |
| Dependencies | None |

**Objective:**

Implement a dedicated biometric challenge handler for high-sensitivity plugins (Linked Notes, Password Vault). Ensure keys are zeroized and partitions are relocked immediately when the user leaves the plugin.

**Technical Approach:**

Extend biometrics.rs to support independent, named biometric challenges via Windows Hello (UserConsentVerifier). On successful verification, release the specific partition key from the Windows Credential Manager, unlock the SQLCipher partition, and hold the key in memory using the zeroize crate. Implement an explicit lock_partition command. Trigger this command from the frontend when the plugin iframe is unmounted, loses focus, or when the user switches active views. Zeroize the key buffer in memory immediately upon relocking.

**Files to Create/Modify:**

- `src-tauri/src/biometrics.rs`
- `src-tauri/src/database.rs`
- `src-tauri/tests/biometrics_tests.rs`

**Acceptance Criteria:**

- [x] Opening Linked Notes or Password Vault triggers a dedicated Windows Hello prompt.
- [x] Navigating away from the plugin immediately triggers the lock_partition command.
- [x] Memory inspection confirms the partition key is zeroized and the database connection is closed/invalidated upon relock.

**Testing Requirements:**

Write unit tests in `src-tauri/tests/biometrics_tests.rs` to verify that the zeroize crate successfully clears memory buffers. Mock the Windows Hello API to test success and failure flows.

**Implementation Notes:**

- Added `PartitionKey` wrapper using `zeroize::Zeroizing<String>` to hold encryption keys in memory.
- Added `Partition` struct with `lock`, `is_locked`, and `with_connection` methods.
- Added `PartitionManager` singleton (`OnceLock`) that tracks open partitions by name.
- Extended `CredentialManager` with `store_partition_key` and `retrieve_partition_key` using per-partition usernames.
- Extended `BiometricAuth` with `invoke_named_challenge` and `unlock_partition` methods.
- Added `unlock_partition` and `lock_partition` Tauri commands.
- Registered new commands and `biometrics_tests` module in `lib.rs`.
- Created `biometrics_tests.rs` with tests for partition open/lock, manager dedup, and credential manager round-trip.

**Integration Notes:**

No upstream dependencies — this is a foundational task.

#### `CAT-007`: Pomodoro / Focus Timer Plugin

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 8.0 |
| Complexity | 1.3 |
| Risk | 1.0 |
| Weight | 10.40 |
| Module | `plugins/pomodoro/src/index.tsx` |
| Dependencies | None |

**Objective:**

Build a lightweight, self-contained focus timer.

**Technical Approach:**

Implement a standard Pomodoro timer with customizable intervals using React state and standard Web APIs (setInterval). Broadcast session completion events to the Data Broker for other plugins to optionally consume.

**Files to Create/Modify:**

- `plugins/pomodoro/src/index.tsx`
- `plugins/pomodoro/src/hooks/useTimer.ts`
- `plugins/pomodoro/tests/pomodoro.test.tsx`

**Acceptance Criteria:**

- [ ] Timer counts down accurately and supports customizable intervals (work, short break, long break).
- [ ] Broadcasts session completion events to the Data Broker.
- [ ] Plays a non-intrusive audio notification or visual cue when a session ends.

**Testing Requirements:**

Write unit tests for the useTimer hook using Vitest. Fast-forward timers using fake timers to verify state transitions and event broadcasts.

**Integration Notes:**

No upstream dependencies — this is a foundational task.

#### `CAT-011`: Mood / Wellness Tracker Plugin

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 8.0 |
| Complexity | 1.2 |
| Risk | 1.0 |
| Weight | 9.60 |
| Module | `plugins/mood/src/index.tsx` |
| Dependencies | None |

**Objective:**

Build a self-contained daily wellness check-in tool.

**Technical Approach:**

Create a clean, visual interface for logging mood, sleep, energy levels, weight, blood pressure, and glucose. Persist data locally within its isolated SQLCipher partition. Render per-metric historical charts with Day, Week, and Month views.

**Data Model:**

Use separate tables per metric type:
- `mood_entries` — mood, sleep hours, energy levels
- `weight_entries` — weight value, unit (`lbs` or `kg`)
- `blood_pressure_entries` — systolic, diastolic, pulse
- `glucose_entries` — value, measurement datetime, time_of_day enum

**Files to Create/Modify:**

- `plugins/mood/src/index.tsx`
- `plugins/mood/src/components/MoodSelector.tsx`
- `plugins/mood/src/components/WeightEntry.tsx`
- `plugins/mood/src/components/BloodPressureEntry.tsx`
- `plugins/mood/src/components/GlucoseEntry.tsx`
- `plugins/mood/src/components/WellnessCharts.tsx`
- `plugins/mood/tests/mood.test.tsx`

**Acceptance Criteria:**

- [ ] Allows logging daily mood, sleep hours, and energy levels.
- [ ] Allows logging weight in lbs or kg with a unit toggle, defaulting to lbs.
- [ ] Allows logging blood pressure (systolic 60–250, diastolic 40–150) and pulse.
- [ ] Allows logging glucose (20–600 mg/dL) with date/time and time-of-day dropdown: Out of Bed, Before Breakfast, After Breakfast, Before Lunch, After Lunch, Before Dinner, After Dinner, After Snack, Before Bed.
- [ ] Persists data locally within its isolated SQLCipher partition.
- [ ] Renders per-metric historical charts with Day, Week, and Month views.
- [ ] User can edit past entries on a unified check-in screen.

**Testing Requirements:**

Write component tests to verify that mood selections, weight, blood pressure, and glucose entries are correctly saved to the local database. Test rendering of trend charts with mock historical data for each metric type.

**Integration Notes:**

No upstream dependencies — this is a foundational task.

#### `CAT-012`: Contacts / Mini-CRM Plugin

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 10.0 |
| Complexity | 1.4 |
| Risk | 1.0 |
| Weight | 14.00 |
| Module | `plugins/contacts/src/index.tsx` |
| Dependencies | None |

**Objective:**

Build a lightweight contact and relationship manager.

**Technical Approach:**

Implement contact CRUD operations with tagging and interaction logging. Create a clean, two-pane interface with a searchable contact list and a detail view for editing contacts and viewing interaction history. Persist all data locally within its isolated SQLCipher partition.

**Data Model:**

Use separate tables for contacts and interactions:
- `contacts` — id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, email TEXT, phone TEXT, company TEXT, notes TEXT, tags TEXT, last_contact_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
- `interactions` — id TEXT PRIMARY KEY NOT NULL, contact_id TEXT NOT NULL, interaction_type TEXT NOT NULL, notes TEXT, interacted_at TEXT NOT NULL DEFAULT (datetime('now')), created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE

**Files to Create/Modify:**

- `plugins/contacts/src/index.tsx`
- `plugins/contacts/src/components/ContactList.tsx`
- `plugins/contacts/src/components/ContactForm.tsx`
- `plugins/contacts/src/components/InteractionLog.tsx`
- `plugins/contacts/tests/contacts.test.tsx`

**Acceptance Criteria:**

- [ ] Supports full CRUD operations for contacts.
- [ ] Allows tagging contacts and logging interaction history.
- [ ] Persists data locally within its isolated SQLCipher partition.

**Testing Requirements:**

Write integration tests for contact creation, updating, and deletion. Verify that tags are correctly associated and queried.

**Implementation Notes:**

- Added `contacts` and `interactions` tables to `schema.sql`.
- Built ContactList, ContactForm, and InteractionLog components.
- Plugin uses `db:read` and `db:write` permissions.
- No upstream dependencies — this is a foundational task.

> **GATE 1 — Validation**
>
> | Check | Tool | Pass Criteria |
> | ----- | ---- | -------------- |
> | Rust Lint | `cargo clippy --all-targets --all-features` | Zero warnings |
> | Rust Format | `cargo fmt -- --check` | No unformatted files |
> | Rust Tests | `cargo test` | 100% pass rate |
> | Frontend Typecheck | `npm run typecheck` | Zero type errors |
>
> **Status:** 🟢 PASSED

### Phase 2: Frontend & Finalization (CAT-005 to CAT-014)

**Tasks:** CAT-005, CAT-006, CAT-008, CAT-009, CAT-010, CAT-013, CAT-014

#### `CAT-005`: Calendar / Scheduler Plugin — depends on CAT-001

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 14.0 |
| Complexity | 1.8 |
| Risk | 1.3 |
| Weight | 32.76 |
| Module | `plugins/calendar/src/index.tsx` |
| Dependencies | `CAT-001` |

**Objective:**

Build a calendar interface that aggregates tasks and goals from other plugins using the Data Broker's read-only query API.

**Technical Approach:**

Implemented inline-style React components using the established plugin pattern. Queries `todo:get_tasks` and `goals:get_milestones` via the Data Broker using `broker.request`. Provides three view modes: month (dot indicators), week (7-day card view), and work week (Mon–Fri card view). Navigation includes previous/next buttons and a Today shortcut. Data reloads on mount and whenever the user navigates to a new period.

**Files to Create/Modify:**

- `plugins/calendar/src/main.tsx`
- `plugins/calendar/src/App.tsx`
- `plugins/calendar/src/components/CalendarGrid.tsx`
- `plugins/calendar/src/components/WeekView.tsx`
- `plugins/calendar/src/hooks/useCalendarEvents.ts`
- `plugins/calendar/tests/calendar.test.tsx`

**Acceptance Criteria:**

- [x] Successfully queries and aggregates tasks and goals from other plugins via the Data Broker.
- [x] Renders month, week, and work week views with inline styles.
- [x] Month view shows event indicators; week/work week views render event cards.
- [x] Navigation updates the displayed period and reloads events.
- [x] Correctly handles empty states and loading states when fetching data.

**Testing Requirements:**

Wrote Vitest tests for the `useCalendarEvents` hook covering initial loading state and reload behavior.

**Implementation Notes:**

- Built with inline styles for consistency and stability across the existing plugin suite.
- Uses `broker.request` to query `todo:get_tasks` and `goals:get_milestones`, normalizing results into `CalendarEvent` records.
- `CalendarGrid` renders a 6-row month grid with colored dots for task/goal dates.
- `WeekView` renders day columns with event cards showing title, type, and status.
- Plugin uses `db:read` permission for Data Broker queries.
- No upstream UI framework dependencies added.

#### `CAT-006`: Kanban / Project Board Plugin — depends on CAT-001

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 14.0 |
| Complexity | 1.6 |
| Risk | 1.2 |
| Weight | 26.88 |
| Module | `plugins/kanban/src/index.tsx` |
| Dependencies | `CAT-001` |

**Objective:**

Build a visual Kanban board that shares the todo namespace.

**Technical Approach:**

Implemented inline-style React components using HTML5 native drag-and-drop. Reads tasks from the todo plugin via `broker.request` with `todo:get_tasks`. Persists column assignments in a new `kanban_columns` table to avoid modifying the shared `todos` schema. Dragging a task to Done updates `completed` in the shared todo namespace; other moves update local column state. Writes are performed per-drop with the shared broker, avoiding excessive database traffic.

**Files to Create/Modify:**

- `plugins/kanban/src/main.tsx`
- `plugins/kanban/src/App.tsx`
- `plugins/kanban/src/components/Board.tsx`
- `plugins/kanban/src/components/Column.tsx`
- `plugins/kanban/src/hooks/useKanbanBoard.ts`
- `plugins/kanban/tests/kanban.test.tsx`
- `src-tauri/src/schema.sql` — added `kanban_columns` table

**Acceptance Criteria:**

- [x] Renders columns for Todo, In Progress, and Done.
- [x] Allows dragging and dropping tasks between columns, updating the shared todo namespace.
- [x] Persists task column state across reloads via `kanban_columns`.

**Testing Requirements:**

Wrote Vitest tests for the `useKanbanBoard` hook covering initial loading state and hook API exposure.

**Implementation Notes:**

- Built with inline styles for consistency and stability across the existing plugin suite.
- Uses HTML5 native drag-and-drop (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) to avoid adding external DnD dependencies.
- `useKanbanBoard` loads todos via `broker.request`, groups them into columns, and exposes `saveColumn(taskId, column)`.
- Column persistence uses a dedicated `kanban_columns` table so the shared `todos` schema remains untouched.
- Done state sets `completed = 1` in the shared todo namespace; other columns keep `completed = 0`.
- Plugin uses `db:read` and `db:write` permissions.

#### `CAT-008`: Linked Notes / Knowledge Graph Plugin — depends on CAT-004

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 18.0 |
| Complexity | 2.2 |
| Risk | 1.5 |
| Weight | 59.40 |
| Module | `plugins/notes/src/index.tsx` |
| Dependencies | `CAT-004` |

**Objective:**

Build an Obsidian-style markdown note-taking tool with backlinking and an animated SVG knowledge graph view.

**Technical Approach:**

Implemented inline-style React components with markdown editing and backlink detection. Added biometric challenge on mount via `invoke("invoke_biometric_challenge", ...)` followed by `invoke("unlock_partition", { name: "notes" })`. On unmount, calls `invoke("lock_partition", { name: "notes" })`. Backlinks are computed by scanning note content for `[[wiki-style links]]`. The knowledge graph uses a custom force-directed layout rendered in SVG with spring forces, node repulsion, center gravity, damping, and drag interaction — no D3 dependency.

**Files to Create/Modify:**

- `plugins/notes/src/main.tsx`
- `plugins/notes/src/App.tsx`
- `plugins/notes/src/components/NoteList.tsx`
- `plugins/notes/src/components/Editor.tsx`
- `plugins/notes/src/components/GraphView.tsx`
- `plugins/notes/src/hooks/useNotes.ts`
- `plugins/notes/tests/notes.test.tsx`
- `src-tauri/src/schema.sql` — added `notes` table

**Acceptance Criteria:**

- [x] Triggers biometric challenge on load and locks partition on unmount.
- [x] Parses markdown and correctly indexes backlinks between notes.
- [x] Renders an interactive, animated SVG knowledge graph representing note connections.

**Testing Requirements:**

Wrote Vitest tests for the `useNotes` hook covering initial loading state and hook API exposure.

**Implementation Notes:**

- Built with inline styles for consistency and stability across the existing plugin suite.
- Uses `invoke` from `@tauri-apps/api/core` for biometric challenge and partition lock/unlock.
- `Editor` supports markdown input with `[[link]]` syntax; backlinks are shown in a sidebar panel.
- `GraphView` implements a force-directed simulation: spring force along edges, O(n²) repulsion, center gravity, velocity damping, and pointer-based drag.
- `NoteList` provides searchable note selection with delete support.
- Plugin uses `db:read` and `db:write` permissions for note CRUD.

#### `CAT-009`: Password / Secrets Vault Plugin — depends on CAT-004

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 10.0 |
| Complexity | 1.8 |
| Risk | 1.6 |
| Weight | 28.80 |
| Module | `plugins/vault/src/index.tsx` |
| Dependencies | `CAT-004` |

**Objective:**

Build a secure credential and secrets manager.

**Technical Approach:**

Implement secure password generation, category filtering, and search. Enforce strict clipboard write-only permissions via the Data Broker. Ensure biometric challenge on load and immediate relock on unmount.

**Files to Create/Modify:**

- `plugins/vault/src/index.tsx`
- `plugins/vault/src/components/VaultList.tsx`
- `plugins/vault/tests/vault.test.tsx`

**Acceptance Criteria:**

- [ ] Triggers biometric challenge on load and locks partition on unmount.
- [ ] Generates secure passwords with customizable length and character sets.
- [ ] Enforces strict clipboard write-only permissions via the Data Broker.

**Testing Requirements:**

Write unit tests for the password generator. Mock the clipboard API and verify that passwords can be copied to the clipboard but not read back by the plugin.

**Integration Notes:**

Depends on completion of `CAT-004` (CAT-004). This task's output must be compatible with those modules before proceeding.

#### `CAT-010`: Budget / Expense Tracker Plugin — depends on CAT-001

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 12.0 |
| Complexity | 1.5 |
| Risk | 1.2 |
| Weight | 21.60 |
| Module | `plugins/budget/src/index.tsx` |
| Dependencies | `CAT-001` |

**Objective:**

Build a personal finance tracker that links spending limits to savings goals.

**Technical Approach:**

Implement expense logging and category budgeting. Query the Goals Tracker plugin via the Data Broker to display progress toward linked savings goals.

**Files to Create/Modify:**

- `plugins/budget/src/index.tsx`
- `plugins/budget/src/components/BudgetSummary.tsx`
- `plugins/budget/tests/budget.test.tsx`

**Acceptance Criteria:**

- [ ] Allows logging expenses and setting category budgets.
- [ ] Queries the Goals Tracker plugin via the Data Broker to display progress toward linked savings goals.
- [ ] Renders visual progress bars for budget limits.

**Testing Requirements:**

Write unit tests for budget calculation logic. Mock the Goals Tracker API response and verify that savings goals are correctly integrated into the UI.

**Integration Notes:**

Depends on completion of `CAT-001` (CAT-001). This task's output must be compatible with those modules before proceeding.

#### `CAT-013`: Clipboard Manager / Snippet Vault Plugin — depends on CAT-003

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 9.0 |
| Complexity | 1.6 |
| Risk | 1.3 |
| Weight | 18.72 |
| Module | `plugins/clipboard/src/index.tsx` |
| Dependencies | `CAT-003` |

**Objective:**

Build a clipboard history tracker and text snippet manager.

**Technical Approach:**

Subscribe to the host's clipboard stream. Display a persistent, non-intrusive notice to the user that clipboard monitoring is active. Store history securely in SQLCipher.

**Files to Create/Modify:**

- `plugins/clipboard/src/index.tsx`
- `plugins/clipboard/src/components/HistoryList.tsx`
- `plugins/clipboard/tests/clipboard_plugin.test.tsx`

**Acceptance Criteria:**

- [ ] Subscribes to the host's clipboard stream and displays history.
- [ ] Displays a persistent, non-intrusive notice to the user that clipboard monitoring is active.
- [ ] Stores history securely in SQLCipher.

**Testing Requirements:**

Write integration tests to verify that incoming clipboard stream events are appended to the history list. Ensure the active monitoring notice is visible when subscribed.

**Integration Notes:**

Depends on completion of `CAT-003` (CAT-003). This task's output must be compatible with those modules before proceeding.

#### `CAT-014`: Read-It-Later / RSS Reader Plugin — depends on CAT-002

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 10.0 |
| Complexity | 1.4 |
| Risk | 1.8 |
| Weight | 25.20 |
| Module | `plugins/rss/` |
| Dependencies | `CAT-002` |

**Objective:**

Build an offline-first RSS feed aggregator and article reader. The RSS plugin is a catalog-installed plugin with its own scaffold under `plugins/rss/` and a `catalog.json` entry; it is not seeded as a builtin.

**Technical Approach:**

Read pre-fetched feed data from the local SQLCipher partition via Tauri commands. Render articles in a clean, distraction-free reader view. No outbound network requests are made by the plugin iframe. The host-side RSS service runs with `network:outbound` permission; the plugin itself uses `db:read` to access feed data from its partition.

**Files to Create/Modify:**

- `plugins/rss/src/index.tsx`
- `plugins/rss/src/components/FeedList.tsx`
- `plugins/rss/tests/rss_plugin.test.tsx`

**Acceptance Criteria:**

- [x] Reads pre-fetched feed data from the local SQLCipher partition via Tauri commands.
- [x] Renders articles in a clean, distraction-free reader view.
- [x] Installable from the plugin catalog like other plugins; not seeded as a builtin.

**Testing Requirements:**

Write component tests to verify that feed items are correctly loaded from the database and rendered. Verify that clicking an article opens the reader view.

**Implementation Notes:**

- Plugin reads from SQLCipher via Tauri commands (`rss_list_feeds`, `rss_list_items`, etc.).
- Listed in `catalog.json` with `downloadUrl` and `checksum`; installable via the plugin store.
- Not included in `seed_builtin_plugins` or `MOCK_PLUGINS`.

**Integration Notes:**

Depends on completion of `CAT-002` (CAT-002). The RSS host service writes to the SQLCipher partition; the plugin frontend reads from it. This task's output must be compatible with those modules before proceeding.

> **GATE 2 — Validation**
>
> | Check | Tool | Pass Criteria |
> | ----- | ---- | -------------- |
> | Rust Lint | `cargo clippy --all-targets --all-features` | Zero warnings |
> | Rust Format | `cargo fmt -- --check` | No unformatted files |
> | Rust Tests | `cargo test` | 100% pass rate |
> | Frontend Lint | `npm run lint` | Zero errors |
> | Frontend Typecheck | `npm run typecheck` | Zero type errors |
>
> **Status:** ⬜ PENDING

### Phase 3: Testing (CAT-015)

**Tasks:** CAT-015

#### `CAT-015`: Integration Smoke Testing & Verification — depends on CAT-005, CAT-006, CAT-007, CAT-008, CAT-009, CAT-010, CAT-011, CAT-012, CAT-013, CAT-014

| Attribute | Value |
| --------- | ----- |
| Estimated Hours | 12.0 |
| Complexity | 1.5 |
| Risk | 1.3 |
| Weight | 23.40 |
| Module | `tests/integration_smoke.test.ts` |
| Dependencies | `CAT-005`, `CAT-006`, `CAT-007`, `CAT-008`, `CAT-009`, `CAT-010`, `CAT-011`, `CAT-012`, `CAT-013`, `CAT-014` |

**Objective:**

Conduct comprehensive integration testing, security audits, and performance verification of the entire expanded plugin catalog.

**Technical Approach:**

Verify that all 10 plugins load correctly within their sandboxed iframes. Audit CSP headers to ensure connect-src 'none' is strictly enforced and no external network leaks occur. Verify that the independent biometric gates successfully prompt and immediately relock/zeroize keys on plugin navigation. Verify that the host-side JSON Schema validation correctly blocks malformed cross-plugin queries. Verify that clipboard streaming and RSS background fetching operate within performance budgets without blocking the main thread.

**Files to Create/Modify:**

- `tests/integration_smoke.test.ts`
- `tests/security_audit.test.ts`
- `tests/performance.test.ts`

**Acceptance Criteria:**

- [ ] All plugins load, render, and function correctly within their sandboxed iframes.
- [ ] Security audit confirms zero plaintext leaks and strict sandbox isolation.
- [ ] Performance benchmarks confirm zero main-thread blocking during background operations.

**Testing Requirements:**

Write Playwright/Cypress end-to-end tests to automate loading each plugin, triggering biometric prompts, navigating away to verify relocking, and checking CSP violations in the console.

**Integration Notes:**

Depends on completion of `CAT-005` (CAT-005), `CAT-006` (CAT-006), `CAT-007` (CAT-007), `CAT-008` (CAT-008), `CAT-009` (CAT-009), `CAT-010` (CAT-010), `CAT-011` (CAT-011), `CAT-012` (CAT-012), `CAT-013` (CAT-013), `CAT-014` (CAT-014). This task's output must be compatible with those modules before proceeding.

> **GATE 3 — Validation**
>
> | Check | Tool | Pass Criteria |
> | ----- | ---- | -------------- |
> | Rust Lint | `cargo clippy --all-targets --all-features` | Zero warnings |
> | Rust Format | `cargo fmt -- --check` | No unformatted files |
> | Rust Tests | `cargo test` | 100% pass rate |
> | Frontend Lint | `npm run lint` | Zero errors |
> | Frontend Typecheck | `npm run typecheck` | Zero type errors |
> | Plugin Integration | Manual + Automated | All plugins load, run, and share data |
>
> **Status:** ⬜ PENDING

## 4. Technical Components

- **Backend:** Rust (Tauri v2), reqwest with rustls, base64 crate.
- **Plugin Catalog Commands:** `fetch_remote_catalog` and `download_plugin_zip` in `src-tauri/src/commands.rs` proxy HTTP requests through the Rust backend using `reqwest`/`rustls`, returning base64-encoded bytes to the frontend via `invoke()`. The `base64` crate (v0.22) handles encoding.
- **Frontend:** TypeScript, React, Tailwind CSS.
- **Plugin Store State (`usePluginManager`):** Two-state design — `rawCatalogItems` holds network/cache data; `catalogItems` holds the merged result (catalog + installed status). A `useEffect` recomputes `catalogItems` whenever `rawCatalogItems` or `installedPlugins` changes, eliminating stale closure bugs from the prior `refreshCatalog` implementation.
- **Activity Bar:** `App.tsx` computes `visiblePlugins` as React state by merging `MOCK_PLUGINS` (4 builtins: journal, todo, goals, plugin-store) with any installed catalog plugins. `visiblePlugins` is passed to `<ActivityBar>`.
- **PluginStore:** Receives `catalogItems` as `items` prop from `App.tsx`; does not call `usePluginManager` directly. `installPlugin`/`uninstallPlugin`/`error` are passed as props.
- **Backend Validation (`install_plugin`):** Only `id` and `version` from `plugin-manifest.json` are validated against catalog values. `name` and `permissions` mismatch checks were removed — permissions come from the catalog entry, not the zip.
- **RSS Plugin:** A catalog-installed plugin with its own scaffold at `plugins/rss/` and a `catalog.json` entry. It is not seeded as a builtin and is not in `MOCK_PLUGINS` or `seed_builtin_plugins`.
- **Plugin Zip Packaging:** `scripts/zip-plugin.mjs` reads `permissions` from each plugin's `package.json` (`pkg.permissions ?? []`) when writing `plugin-manifest.json` into the zip.
- **Infrastructure:** Vite, Tauri.
- **Tooling:** ESLint.

## 5. Deliverables

- `CAT-001`: Data Broker API Extension (JSON Schema Validation)
- `CAT-002`: Host-Mediated RSS Background Fetch Service
- `CAT-003`: Host-Active Clipboard Streaming Service
- `CAT-004`: Independent Biometric Challenge & Auto-Relock
- `CAT-005`: Calendar / Scheduler Plugin
- `CAT-006`: Kanban / Project Board Plugin
- `CAT-007`: Pomodoro / Focus Timer Plugin
- `CAT-008`: Linked Notes / Knowledge Graph Plugin
- `CAT-009`: Password / Secrets Vault Plugin
- `CAT-010`: Budget / Expense Tracker Plugin
- `CAT-011`: Mood / Wellness Tracker Plugin
- `CAT-012`: Contacts / Mini-CRM Plugin
- `CAT-013`: Clipboard Manager / Snippet Vault Plugin
- `CAT-014`: Read-It-Later / RSS Reader Plugin
- `CAT-015`: Integration Smoke Testing & Verification