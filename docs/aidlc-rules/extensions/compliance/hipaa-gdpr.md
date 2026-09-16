# Compliance: HIPAA + GDPR Guardrails

## Scope

These guardrails apply to all construction and operations tasks in the Nidus project.

## HIPAA Requirements

- **No PHI Logging:** Do not log, cache, or transmit Protected Health Information (journal entries, personal goals) in plaintext.
- **Encryption at Rest:** All sensitive data must be encrypted using AES-256-GCM via SQLCipher before writing to disk.
- **Encryption in Transit:** All IPC communication between host and plugins uses postMessage within a sandboxed context; no external network requests are permitted from plugins (`connect-src 'none'`).
- **Access Control:** Windows Hello biometric verification is required before the database decryption key is released. Graceful degradation must warn users but never bypass encryption.

## GDPR Requirements

- **Data Minimization:** Collect only necessary data. Plugins operate within isolated namespaces unless explicit cross-plugin permissions are granted.
- **Right to Erasure:** Provide mechanisms to delete journal entries and user data completely.
- **Pseudonymization:** User-identifiable metadata must be minimized in database records.
- **Audit Trail:** All database read/write/delete operations must be logged in `docs/audit.md` with timestamps and actor identification.

## Enforcement

- All code reviews must verify compliance with these rules.
- Any violation must be flagged immediately and remediated before phase gate approval.
