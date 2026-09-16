import { useState, useEffect } from "react";
import type { Contact } from "../App";

interface ContactFormProps {
  contact: Contact;
  onSave: (updates: Partial<Contact>) => void;
}

export default function ContactForm({ contact, onSave }: ContactFormProps) {
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email);
  const [phone, setPhone] = useState(contact.phone);
  const [company, setCompany] = useState(contact.company);
  const [notes, setNotes] = useState(contact.notes);
  const [tags, setTags] = useState(contact.tags);
  const [lastContactDate, setLastContactDate] = useState(contact.last_contact_date);

  useEffect(() => {
    setName(contact.name);
    setEmail(contact.email);
    setPhone(contact.phone);
    setCompany(contact.company);
    setNotes(contact.notes);
    setTags(contact.tags);
    setLastContactDate(contact.last_contact_date);
  }, [contact.id, contact.name, contact.email, contact.phone, contact.company, contact.notes, contact.tags, contact.last_contact_date]);

  const handleSave = () => {
    onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      notes: notes.trim(),
      tags: tags.trim(),
      last_contact_date: lastContactDate,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 600,
          color: "#f0f0f0",
        }}
      >
        {contact.name ? "Edit Contact" : "New Contact"}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Name *
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #2e2f32",
              background: "#040506",
              color: "#f0f0f0",
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #2e2f32",
              background: "#040506",
              color: "#f0f0f0",
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Phone
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #2e2f32",
              background: "#040506",
              color: "#f0f0f0",
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Company
          </span>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #2e2f32",
              background: "#040506",
              color: "#f0f0f0",
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Tags
          </span>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="client, vip, lead (comma-separated)"
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #2e2f32",
              background: "#040506",
              color: "#f0f0f0",
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Last Contact Date
          </span>
          <input
            type="date"
            value={lastContactDate}
            onChange={(e) => setLastContactDate(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #2e2f32",
              background: "#040506",
              color: "#f0f0f0",
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this contact..."
            rows={4}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #2e2f32",
              background: "#040506",
              color: "#f0f0f0",
              fontSize: 14,
              outline: "none",
              resize: "vertical",
            }}
          />
        </label>
      </div>

      <button
        onClick={handleSave}
        style={{
          alignSelf: "flex-start",
          background: "#55b3ff",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "8px 16px",
          fontSize: 13,
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        Save Contact
      </button>
    </div>
  );
}
