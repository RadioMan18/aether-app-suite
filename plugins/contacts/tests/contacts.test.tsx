import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ContactList from "../src/components/ContactList";
import ContactForm from "../src/components/ContactForm";
import type { Contact } from "../src/App";

const mockContact: Contact = {
  id: "1",
  name: "Alice Smith",
  email: "alice@example.com",
  phone: "+1 555-0100",
  company: "Acme Corp",
  notes: "VIP client",
  tags: "client,vip",
  last_contact_date: "2026-09-15",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-09-15T00:00:00Z",
};

describe("ContactList", () => {
  it("renders contacts", () => {
    render(
      <ContactList
        contacts={[mockContact]}
        selectedContactId={null}
        onSelect={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("Alice Smith")).toBeDefined();
    expect(screen.getByText("alice@example.com · Acme Corp")).toBeDefined();
  });

  it("calls onSelect when a contact is clicked", () => {
    let selectedId: string | null = null;
    render(
      <ContactList
        contacts={[mockContact]}
        selectedContactId={null}
        onSelect={(id) => { selectedId = id; }}
        onDelete={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("Alice Smith"));
    expect(selectedId).toBe("1");
  });

  it("calls onDelete when delete button is clicked", () => {
    let deletedId: string | null = null;
    render(
      <ContactList
        contacts={[mockContact]}
        selectedContactId={null}
        onSelect={() => {}}
        onDelete={(id) => { deletedId = id; }}
      />,
    );
    fireEvent.click(screen.getByLabelText("Delete contact"));
    expect(deletedId).toBe("1");
  });

  it("shows empty state when no contacts exist", () => {
    render(
      <ContactList
        contacts={[]}
        selectedContactId={null}
        onSelect={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("No contacts yet. Create your first contact.")).toBeDefined();
  });
});

describe("ContactForm", () => {
  it("renders contact fields", () => {
    render(<ContactForm contact={mockContact} onSave={() => {}} />);
    expect(screen.getByDisplayValue("Alice Smith")).toBeDefined();
    expect(screen.getByDisplayValue("alice@example.com")).toBeDefined();
    expect(screen.getByDisplayValue("+1 555-0100")).toBeDefined();
    expect(screen.getByDisplayValue("Acme Corp")).toBeDefined();
    expect(screen.getByDisplayValue("VIP client")).toBeDefined();
    expect(screen.getByDisplayValue("client,vip")).toBeDefined();
  });

  it("calls onSave with updated values", () => {
    let captured: Partial<Contact> | null = null;
    render(<ContactForm contact={mockContact} onSave={(updates) => { captured = updates; }} />);
    const nameInput = screen.getByDisplayValue("Alice Smith");
    fireEvent.change(nameInput, { target: { value: "Alice Johnson" } });
    fireEvent.click(screen.getByText("Save Contact"));
    expect(captured?.name).toBe("Alice Johnson");
  });

  it("shows New Contact title when contact name is empty", () => {
    render(<ContactForm contact={{ ...mockContact, name: "" }} onSave={() => {}} />);
    expect(screen.getByText("New Contact")).toBeDefined();
  });
});
