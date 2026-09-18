import { useState, useEffect } from "react";
import { sendRequest } from "../../sdk/src/bridge.ts";

interface Feed {
  id: string;
  url: string;
  title?: string;
  site_url?: string;
  description?: string;
  last_fetched_at?: string;
  created_at: string;
  updated_at: string;
}

interface FeedItem {
  id: string;
  feed_id: string;
  title?: string;
  url: string;
  author?: string;
  summary?: string;
  content?: string;
  published_at?: string;
  fetched_at: string;
  is_read: boolean;
  is_starred: boolean;
}

export default function App() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [feedUrl, setFeedUrl] = useState("");
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeeds = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await sendRequest<Feed[]>({
        type: "rss:list_feeds",
        params: {},
      });
      setFeeds(result ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (feedId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await sendRequest<FeedItem[]>({
        type: "rss:list_items",
        params: {
          feed_id: feedId ?? null,
          unread_only: false,
          limit: 100,
        },
      });
      setItems(result ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeds();
  }, []);

  useEffect(() => {
    if (selectedFeedId) {
      loadItems(selectedFeedId);
    }
  }, [selectedFeedId]);

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await sendRequest({
        type: "rss:add_feed",
        params: { url: feedUrl.trim() },
      });
      setFeedUrl("");
      await loadFeeds();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      if (selectedFeedId) {
        await sendRequest({
          type: "rss:refresh_feed",
          params: { feed_id: selectedFeedId },
        });
      } else {
        await sendRequest({
          type: "rss:refresh_all_feeds",
          params: {},
        });
      }
      await loadFeeds();
      if (selectedFeedId) {
        await loadItems(selectedFeedId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (itemId: string, isRead: boolean) => {
    try {
      await sendRequest({
        type: "rss:mark_item_read",
        params: { item_id: itemId, is_read: isRead },
      });
      await loadItems(selectedFeedId ?? undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    try {
      await sendRequest({
        type: "rss:delete_feed",
        params: { feed_id: feedId },
      });
      if (selectedFeedId === feedId) {
        setSelectedFeedId(null);
        setItems([]);
      }
      await loadFeeds();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div style={{ padding: 24, color: "#e0e0e0" }}>
      <h2 style={{ marginTop: 0 }}>RSS Reader</h2>

      <form onSubmit={handleAddFeed} style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={feedUrl}
          onChange={(e) => setFeedUrl(e.target.value)}
          placeholder="https://example.com/feed.xml"
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
          Add Feed
        </button>
        <button type="button" onClick={handleRefresh} disabled={loading} style={{ marginLeft: 8, padding: "8px 16px" }}>
          Refresh
        </button>
      </form>

      {error && <div style={{ color: "#ff6b6b", marginBottom: 12 }}>{error}</div>}

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ width: 260, flexShrink: 0 }}>
          <h4 style={{ margin: "0 0 8px" }}>Feeds</h4>
          {feeds.length === 0 && <div style={{ color: "#888", fontSize: 12 }}>No feeds yet.</div>}
          {feeds.map((feed) => (
            <div
              key={feed.id}
              onClick={() => setSelectedFeedId(feed.id)}
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #2e2f32",
                cursor: "pointer",
                background: selectedFeedId === feed.id ? "#1b1c1e" : "transparent",
              }}
            >
              <div style={{ fontWeight: 500 }}>{feed.title || feed.url}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                {feed.last_fetched_at ? new Date(feed.last_fetched_at).toLocaleString() : "Not fetched"}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFeed(feed.id);
                }}
                style={{ marginTop: 6, background: "transparent", border: "none", color: "#ff6b6b", cursor: "pointer" }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <h4 style={{ margin: "0 0 8px" }}>Items</h4>
          {!selectedFeedId && <div style={{ color: "#888", fontSize: 12 }}>Select a feed to view items.</div>}
          {items.length === 0 && selectedFeedId && <div style={{ color: "#888", fontSize: 12 }}>No items yet.</div>}
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid #2e2f32",
                opacity: item.is_read ? 0.7 : 1,
              }}
            >
              <div style={{ fontWeight: 500 }}>{item.title || "Untitled"}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                {item.author ? `By ${item.author}` : ""}
                {item.published_at ? ` • ${new Date(item.published_at).toLocaleString()}` : ""}
              </div>
              {item.summary && (
                <div style={{ fontSize: 12, color: "#bbb", marginTop: 6 }}>{item.summary}</div>
              )}
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Open</a>
                <button
                  onClick={() => handleMarkRead(item.id, !item.is_read)}
                  style={{ background: "transparent", border: "none", color: "#55b3ff", cursor: "pointer", fontSize: 12 }}
                >
                  {item.is_read ? "Mark unread" : "Mark read"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
