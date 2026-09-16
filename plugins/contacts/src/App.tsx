import { useEffect, useState, useMemo } from "react";
import { db } from "../../sdk/src/index.ts";
import ContactList from "./components/ContactList";
import ContactForm from "./components/ContactForm";
import InteractionLog from "./components/InteractionLog";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  tags: string;
  last_contact_date: string;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  contact_id: string;
  interaction_type: string;
  notes: string;
  interacted_at: string;
  created_at: string;
}

type Tab = "details" | "interactions";

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<Tab>("details");

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId) ?? null,
    [contacts, selectedContactId],
  );

  const loadContacts = async () => {
    try {
      setError(null);
      const rows = await db.query<Contact>(
        "SELECT id, name, email, phone, company, notes, tags, last_contact_date, created_at, updated_at FROM contacts ORDER BY name ASC",
      );
      setContacts(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const loadInteractions = async (contactId: string) => {
    try {
      const rows = await db.query<Interaction>(
        "SELECT id, contact_id, interaction_type, notes, interacted_at, created_at FROM interactions WHERE contact_id = ?1 ORDER BY interacted_at DESC",
        [contactId],
      );
      setInteractions(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedContactId) {
      loadInteractions(selectedContactId);
    } else {
      setInteractions([]);
    }
  }, [selectedContactId]);

  const handleCreateContact = async () => {
    try {
      setError(null);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.execute(
        "INSERT INTO contacts (id, name, email, phone, company, notes, tags, last_contact_date, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        [id, "", "", "", "", "", "", now, now, now],
      );
      const rows = await db.query<Contact>(
        "SELECT id, name, email, phone, company, notes, tags, last_contact_date, created_at, updated_at FROM contacts ORDER BY created_at DESC LIMIT 1",
      );
      if (rows.length > 0) {
        setContacts((prev) => [rows[0], ...prev]);
        setSelectedContactId(rows[0].id);
        setView("details");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleUpdateContact = async (updates: Partial<Contact>) => {
    if (!selectedContactId) return;
    try {
      setError(null);
      const now = new Date().toISOString();
      const contact = contacts.find((c) => c.id === selectedContactId);
      if (!contact) return;

      const name = updates.name ?? contact.name;
      const email = updates.email ?? contact.email;
      const phone = updates.phone ?? contact.phone;
      const company = updates.company ?? contact.company;
      const notes = updates.notes ?? contact.notes;
      const tags = updates.tags ?? contact.tags;
      const lastContactDate = updates.last_contact_date ?? contact.last_contact_date;

      await db.execute(
        "UPDATE contacts SET name = ?1, email = ?2, phone = ?3, company = ?4, notes = ?5, tags = ?6, last_contact_date = ?7, updated_at = ?8 WHERE id = ?9",
        [name, email, phone, company, notes, tags, lastContactDate, now, selectedContactId],
      );
      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedContactId ? { ...c, ...updates, updated_at: now } : c,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      setError(null);
      await db.execute("DELETE FROM contacts WHERE id = ?1", [id]);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (selectedContactId === id) {
        setSelectedContactId(null);
        setView("details");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleAddInteraction = async (interaction: Omit<Interaction, "id" | "created_at">) => {
    if (!selectedContactId) return;
    try {
      setError(null);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.execute(
        "INSERT INTO interactions (id, contact_id, interaction_type, notes, interacted_at, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        [id, selectedContactId, interaction.interaction_type, interaction.notes, interaction.interacted_at, now],
      );
      await loadContacts();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) => {
      const searchable = [contact.name, contact.email, contact.phone, contact.company, contact.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [contacts, searchQuery]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#040506" }}>
      {error && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            background: "#2a1515",
            border: "1px solid #5f2a2a",
            borderRadius: 8,
            color: "#ff5f5f",
            fontSize: 13,
            zIndex: 1000,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          width: 300,
          borderRight: "1px solid #2e2f32",
          background: "#111214",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #2e2f32",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: "#f0f0f0",
              }}
            >
              Contacts
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "#6b6b6b",
              }}
            >
              Mini CRM
            </p>
          </div>
          <button
            onClick={handleCreateContact}
            style={{
              background: "#55b3ff",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            New Contact
          </button>
        </div>

        <div style={{ padding: "12px 16px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #2e2f32",
              background: "#040506",
              color: "#f0f0f0",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        <ContactList
          contacts={filteredContacts}
          selectedContactId={selectedContactId}
          onSelect={setSelectedContactId}
          onDelete={handleDeleteContact}
        />
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {isLoading ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b6b6b",
              fontSize: 14,
            }}
          >
            Loading contacts...
          </div>
        ) : selectedContact ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #2e2f32",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <button
                onClick={() => setView("details")}
                style={{
                  background: view === "details" ? "#55b3ff" : "transparent",
                  color: view === "details" ? "#fff" : "#6b6b6b",
                  border: "1px solid #2e2f32",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Details
              </button>
              <button
                onClick={() => setView("interactions")}
                style={{
                  background: view === "interactions" ? "#55b3ff" : "transparent",
                  color: view === "interactions" ? "#fff" : "#6b6b6b",
                  border: "1px solid #2e2f32",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Interactions
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto" }}>
              {view === "details" ? (
                <div style={{ maxWidth: 720, padding: 24 }}>
                  <ContactForm contact={selectedContact} onSave={handleUpdateContact} />
                </div>
              ) : (
                <InteractionLog
                  contactId={selectedContact.id}
                  interactions={interactions}
                  onAddInteraction={handleAddInteraction}
                />
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b6b6b",
              fontSize: 14,
            }}
          >
            Select a contact or create a new one
          </div>
        )}
      </div>
    </div>
  );
}
