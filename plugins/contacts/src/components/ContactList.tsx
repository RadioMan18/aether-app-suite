import type { Contact } from "../App";

interface ContactListProps {
  contacts: Contact[];
  selectedContactId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ContactList({ contacts, selectedContactId, onSelect, onDelete }: ContactListProps) {
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {contacts.length === 0 ? (
        <div
          style={{
            padding: 24,
            color: "#6b6b6b",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          No contacts yet. Create your first contact.
        </div>
      ) : (
        contacts.map((contact) => {
          const isActive = contact.id === selectedContactId;
          const displayName = contact.name || "Unnamed Contact";
          const subtitle = [contact.email, contact.company].filter(Boolean).join(" · ") || "No details";

          return (
            <div
              key={contact.id}
              onClick={() => onSelect(contact.id)}
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid #2e2f32",
                cursor: "pointer",
                background: isActive ? "#1b1c1e" : "transparent",
                transition: "background 0.15s",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: isActive ? "#f0f0f0" : "#a0a0a0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b6b6b",
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {subtitle}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(contact.id);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#6b6b6b",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: "2px 4px",
                  flexShrink: 0,
                }}
                aria-label="Delete contact"
              >
                ×
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
