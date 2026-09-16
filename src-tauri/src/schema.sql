CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 0,
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    target_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plugins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    permissions TEXT NOT NULL,
    installed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rss_feeds (
    id TEXT PRIMARY KEY NOT NULL,
    url TEXT NOT NULL UNIQUE,
    title TEXT,
    site_url TEXT,
    description TEXT,
    last_fetched_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rss_items (
    id TEXT PRIMARY KEY NOT NULL,
    feed_id TEXT NOT NULL,
    title TEXT,
    url TEXT NOT NULL,
    author TEXT,
    summary TEXT,
    content TEXT,
    published_at TEXT,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_read INTEGER NOT NULL DEFAULT 0,
    is_starred INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (feed_id) REFERENCES rss_feeds(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rss_items_feed_id ON rss_items(feed_id);
CREATE INDEX IF NOT EXISTS idx_rss_items_published_at ON rss_items(published_at);
CREATE INDEX IF NOT EXISTS idx_rss_items_is_read ON rss_items(is_read);

CREATE TABLE IF NOT EXISTS mood_entries (
    id TEXT PRIMARY KEY NOT NULL,
    mood INTEGER NOT NULL,
    sleep_hours REAL NOT NULL,
    energy_level INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS weight_entries (
    id TEXT PRIMARY KEY NOT NULL,
    weight_value REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'lbs',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blood_pressure_entries (
    id TEXT PRIMARY KEY NOT NULL,
    systolic INTEGER NOT NULL,
    diastolic INTEGER NOT NULL,
    pulse INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS glucose_entries (
    id TEXT PRIMARY KEY NOT NULL,
    value REAL NOT NULL,
    measured_at TEXT NOT NULL,
    time_of_day TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    notes TEXT,
    tags TEXT NOT NULL DEFAULT '',
    last_contact_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interactions (
    id TEXT PRIMARY KEY NOT NULL,
    contact_id TEXT NOT NULL,
    interaction_type TEXT NOT NULL,
    notes TEXT,
    interacted_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts(tags);

CREATE TABLE IF NOT EXISTS kanban_columns (
    todo_id TEXT PRIMARY KEY NOT NULL,
    column TEXT NOT NULL DEFAULT 'todo',
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kanban_columns_column ON kanban_columns(column);

UPDATE journal_entries SET id = lower(hex(randomblob(16))) WHERE id IS NULL;
UPDATE todos SET id = lower(hex(randomblob(16))) WHERE id IS NULL;
