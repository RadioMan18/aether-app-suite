import { useState } from "react";
import type { Interaction } from "../App";

interface InteractionLogProps {
  contactId: string;
  interactions: Interaction[];
  onAddInteraction: (interaction: Omit<Interaction, "id" | "created_at">) => void;
  onLoaded?: () => void;
}

export default function InteractionLog({ contactId, interactions, onAddInteraction }: InteractionLogProps) {
  const [interactionType, setInteractionType] = useState("call");
  const [notes, setNotes] = useState("");
  const [interactedAt, setInteractedAt] = useState(new Date().toISOString().slice(0, 10));

  const handleAdd = async () => {
    if (!interactionType.trim()) return;
    await onAddInteraction({
      contact_id: contactId,
      interaction_type: interactionType.trim(),
      notes: notes.trim(),
      interacted_at: new Date(`${interactedAt}T00:00:00`).toISOString(),
    });
    setNotes("");
    setInteractionType("call");
    setInteractedAt(new Date().toISOString().slice(0, 10));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720, padding: 24 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 600,
          color: "#f0f0f0",
        }}
      >
        Interaction History
      </h2>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
          padding: "12px 16px",
          borderRadius: 8,
          border: "1px solid #2e2f32",
          background: "#111214",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <span style={{ fontSize: 11, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Type
          </span>
          <select
            value={interactionType}
            onChange={(e) => setInteractionType(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #2e2f32",
              background: "#040506",
              color: "#f0f0f0",
              fontSize: 13,
              outline: "none",
            }}
          >
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="note">Note</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <span style={{ fontSize: 11, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Date
          </span>
          <input
            type="date"
            value={interactedAt}
            onChange={(e) => setInteractedAt(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #2e2f32",
              background: "#040506",
              color: "#f0f0f0",
              fontSize: 13,
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 2 }}>
          <span style={{ fontSize: 11, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Notes
          </span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What happened?"
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #2e2f32",
              background: "#040506",
              color: "#f0f0f0",
              fontSize: 13,
              outline: "none",
            }}
          />
        </label>

        <button
          onClick={handleAdd}
          style={{
            height: 36,
            padding: "0 14px",
            borderRadius: 6,
            border: "none",
            background: "#55b3ff",
            color: "#fff",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
            alignSelf: "flex-end",
          }}
        >
          Add
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {interactions.length === 0 ? (
          <div
            style={{
              padding: 24,
              color: "#6b6b6b",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            No interactions yet.
          </div>
        ) : (
          interactions.map((interaction) => (
            <div
              key={interaction.id}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid #2e2f32",
                background: "#111214",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#55b3ff",
                    textTransform: "capitalize",
                  }}
                >
                  {interaction.interaction_type}
                </span>
                <span style={{ fontSize: 11, color: "#6b6b6b" }}>
                  {new Date(interaction.interacted_at).toLocaleString()}
                </span>
              </div>
              {interaction.notes && (
                <div style={{ fontSize: 13, color: "#a0a0a0", lineHeight: 1.5 }}>
                  {interaction.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
