# Security Plugin Catalog — Implementation Plan

## 1. Project Overview

Technical specification for expanding the Nidus plugin catalog with 5 security-focused plugins designed for internal IT operations, offline-first usage, GDPR/HIPAA compliance, and professional red team workflows.

**Technology Stack:**

- TypeScript
- React
- Tailwind CSS
- Tauri v2 (Rust host)
- SQLCipher (encrypted per-plugin partitions)
- jsonschema (Data Broker validation)

**Design Principles:**

- Offline-first: no outbound network requests from plugin iframes
- Host mediation: all sensitive operations proxied through Rust commands
- Vault as single source of truth: findings stored in encrypted vault partition
- Biometric gating: vault access requires Windows Hello / UserConsentVerifier
- Data minimization: no telemetry, no cloud sync, configurable retention

---

## 2. Data Broker Extension (CAT-SEC-001)

### 2.1 Objective

Extend the existing Data Broker (`src-tauri/src/ipc.rs`) with a `vault:*` namespace so security plugins can write findings to the vault, and the Report Generator can read them. This is the integration backbone for all 5 security plugins.

### 2.2 JSON Schemas

**`src-tauri/schemas/vault_add_finding.json`**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["plugin_id", "severity", "title", "description"],
  "properties": {
    "plugin_id": {
      "type": "string",
      "enum": ["scanner", "creds", "pcap", "pecheck"]
    },
    "severity": {
      "type": "string",
      "enum": ["info", "low", "medium", "high", "critical"]
    },
    "title": {
      "type": "string",
      "maxLength": 200
    },
    "description": {
      "type": "string",
      "maxLength": 5000
    },
    "cve_id": {
      "type": "string",
      "pattern": "^CVE-[0-9]{4}-[0-9]+$"
    },
    "cwe_id": {
      "type": "string",
      "pattern": "^CWE-[0-9]+$"
    },
    "target": {
      "type": "string",
      "maxLength": 500
    },
    "remediation": {
      "type": "string",
      "maxLength": 2000
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string",
        "maxLength": 50
      }
    },
    "engagement_id": {
      "type": "string",
      "maxLength": 100
    },
    "metadata": {
      "type": "object",
      "additionalProperties": {
        "type": "string"
      }
    }
  }
}
```

**`src-tauri/schemas/vault_get_findings.json`**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "severity": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["info", "low", "medium", "high", "critical"]
      }
    },
    "plugin_id": {
      "type": "string",
      "enum": ["scanner", "creds", "pcap", "pecheck"]
    },
    "engagement_id": {
      "type": "string"
    },
    "target": {
      "type": "string"
    },
    "cve_id": {
      "type": "string"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 1000
    },
    "offset": {
      "type": "integer",
      "minimum": 0
    }
  }
}
```

### 2.3 Database Schema

**`src-tauri/src/schema.sql` additions**

```sql
CREATE TABLE IF NOT EXISTS vault_findings (
    id TEXT PRIMARY KEY NOT NULL,
    plugin_id TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cve_id TEXT,
    cwe_id TEXT,
    target TEXT,
    remediation TEXT,
    tags TEXT NOT NULL DEFAULT '',
    engagement_id TEXT,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vault_findings_severity ON vault_findings(severity);
CREATE INDEX IF NOT EXISTS idx_vault_findings_plugin_id ON vault_findings(plugin_id);
CREATE INDEX IF NOT EXISTS idx_vault_findings_engagement_id ON vault_findings(engagement_id);
CREATE INDEX IF NOT EXISTS idx_vault_findings_created_at ON vault_findings(created_at);
```

### 2.4 Rust Command Extensions

**`src-tauri/src/ipc.rs` additions**

Add to `PluginBroker::handle()`:

```rust
"vault:add_finding" => self.handle_vault_add_finding(request),
"vault:get_findings" => self.handle_vault_get_findings(request),
```

Add to `required_permission()`:

```rust
"vault:add_finding" => "db:write",
"vault:get_findings" => "db:read",
```

Implement `handle_vault_add_finding` and `handle_vault_get_findings` following the same pattern as `handle_todo_get_tasks` and `handle_goals_get_milestones`, using the `vault_add_finding.json` and `vault_get_findings.json` schemas.

**Data mapping for `vault:add_finding`:**

| Payload Field | Column | Type |
|--------------|--------|------|
| `plugin_id` | `plugin_id` | TEXT |
| `severity` | `severity` | TEXT |
| `title` | `title` | TEXT |
| `description` | `description` | TEXT |
| `cve_id` | `cve_id` | TEXT |
| `cwe_id` | `cwe_id` | TEXT |
| `target` | `target` | TEXT |
| `remediation` | `remediation` | TEXT |
| `tags` | `tags` | JSON array as TEXT |
| `engagement_id` | `engagement_id` | TEXT |
| `metadata` | `metadata` | JSON object as TEXT |

**Return format for `vault:get_findings`:**

```json
{
  "columns": ["id", "plugin_id", "severity", "title", "description", "cve_id", "cwe_id", "target", "remediation", "tags", "engagement_id", "created_at", "updated_at"],
  "rows": [...]
}
```

### 2.5 Permission Model

| Request Type | Required Permission |
|-------------|-------------------|
| `vault:add_finding` | `db:write` |
| `vault:get_findings` | `db:read` |

Security plugins that write findings must declare `db:write` in their plugin manifest. The Report Generator only needs `db:read`.

---

## 3. Security Plugin Specifications

### 3.1 Network Scanner (`plugins/scanner`)

| Attribute | Value |
|-----------|-------|
| Category | `security` |
| Builtin | Yes |
| Permissions | `network:outbound` (host only), `db:write` |
| Dependencies | `CAT-SEC-001` |

**Objective:** Internal network reconnaissance—host discovery, port scanning, service fingerprinting.

**Technical Approach:**

The Rust host performs all network operations. The plugin iframe only renders topology maps and findings tables.

**Host-side Rust module (`src-tauri/src/scanner.rs`):**

- `scan_subnet(target: &str) -> Result<Vec<Host>, String>`: ARP/ping sweep using `port-scanner` and `ipnetwork` crates
- `scan_ports(host: &str, ports: &[u16]) -> Result<Vec<PortResult>, String>`: TCP connect scan with banner grabbing
- `resolve_hostname(ip: &str) -> Result<Option<String>, String>`: Reverse DNS via `trust-dns-resolver`

**Plugin frontend (`plugins/scanner/src/`):**

- Target input with CIDR validation
- Scan progress indicator
- Host list with expandable port details
- Severity classification based on open port heuristics
- "Push to Vault" button per finding

**Data flow:**

1. User enters target subnet (e.g., `10.0.0.0/24`)
2. Plugin calls `sendRequest({ type: "scanner:scan_subnet", params: { target } })`
3. Host executes scan, returns `Vec<HostScanResult>`
4. Plugin renders results, allows user to review
5. User clicks "Export to Vault" → plugin calls `vault:add_finding` for each finding
6. Findings stored in vault with `plugin_id: "scanner"`

**Host scan result schema:**

```typescript
interface HostScanResult {
  ip: string;
  hostname?: string;
  status: "up" | "down" | "filtered";
  ports: PortScanResult[];
  scanned_at: string;
}

interface PortScanResult {
  port: number;
  protocol: "tcp" | "udp";
  state: "open" | "closed" | "filtered";
  service?: string;
  banner?: string;
  severity: "info" | "low" | "medium" | "high";
}
```

**Acceptance Criteria:**

- [ ] Host scans a /24 subnet and returns all responsive hosts
- [ ] Port scan identifies top 1000 TCP ports with service/banner data
- [ ] Plugin renders results in sortable, filterable table
- [ ] Findings can be exported to vault with severity classification
- [ ] Plugin iframe has `connect-src 'none'`; all network ops are host-mediated

**Testing:**

- Unit tests for subnet parsing, CIDR validation
- Mock scan results for UI rendering tests
- Integration test verifying vault write path

---

### 3.2 Credential/Hash Auditor (`plugins/creds`)

| Attribute | Value |
|-----------|-------|
| Category | `security` |
| Builtin | Yes |
| Permissions | `db:write` |
| Dependencies | `CAT-SEC-001` |

**Objective:** Offline password strength analysis, hash type identification, and lightweight dictionary attacks.

**Technical Approach:**

No network operations. All cracking runs locally using bundled dictionaries and the `rust-crypto` crate family.

**Host-side Rust module (`src-tauri/src/creds.rs`):**

- `identify_hash(hash: &str) -> Result<HashType, String>`: Pattern matching for NTLM, SHA-512-crypt, bcrypt, MD5, etc.
- `crack_hash(hash: &str, hash_type: &str, wordlist: &[String]) -> Result<Option<String>, String>`: Dictionary attack
- `estimate_strength(password: &str) -> Result<PasswordStrength, String>`: Entropy calculation

**Plugin frontend (`plugins/creds/src/`):**

- Hash input with format auto-detection
- Password strength meter with entropy display
- Wordlist selector (bundled + custom file picker)
- Cracked credentials list with "Save to Vault" action
- Hash type reference table

**Data flow:**

1. User pastes NTLM hash or password hash
2. Plugin identifies hash type locally
3. User initiates dictionary attack
4. Host runs attack against bundled dictionaries
5. If cracked, result displayed with time-to-crack estimate
6. User clicks "Save to Vault" → finding written with `plugin_id: "creds"`

**Cracked credential schema:**

```typescript
interface CrackedCredential {
  hash: string;
  hash_type: string;
  plaintext?: string;
  cracked: boolean;
  crack_time_ms: number;
  source_system?: string;
  saved_to_vault?: boolean;
}
```

**GDPR/HIPAA note:** Plaintext passwords are only stored in the vault's encrypted partition with biometric gating. Failed crack attempts are not persisted.

**Acceptance Criteria:**

- [ ] Hash identification supports NTLM, SHA-512-crypt, bcrypt, MD5, SHA-256, SHA-1
- [ ] Dictionary attack completes against bundled wordlist in < 5s for typical NTLM hashes
- [ ] Password strength meter displays entropy bits and crack time estimate
- [ ] Cracked credentials can be saved to vault with metadata
- [ ] No network requests from plugin iframe

**Testing:**

- Unit tests for hash identification regex patterns
- Known-answer tests for dictionary attack
- UI tests for strength meter edge cases

---

### 3.3 PCAP/Traffic Analyzer (`plugins/pcap`)

| Attribute | Value |
|-----------|-------|
| Category | `security` |
| Builtin | Yes |
| Permissions | `network:capture` (host only), `db:write` |
| Dependencies | `CAT-SEC-001` |

**Objective:** Host captures live traffic; plugin renders protocol conversations and flags anomalies.

**Technical Approach:**

The Rust host captures packets using the `pcap` crate (Windows: Npcap, Linux: libpcap). Plugin iframe renders parsed protocol data and anomaly flags.

**Host-side Rust module (`src-tauri/src/pcap.rs`):**

- `start_capture(interface: &str, filter: &str) -> Result<CaptureHandle, String>`: Start live capture with BPF filter
- `stop_capture(handle: CaptureHandle) -> Result<(), String>`: Stop and write to BLOB
- `list_interfaces() -> Result<Vec<NetworkInterface>, String>`: Enumerate capture interfaces
- `parse_pcap(blob: &[u8]) -> Result<Vec<PacketSummary>, String>`: Offline parsing

**Plugin frontend (`plugins/pcap/src/`):**

- Interface selector
- Capture start/stop controls
- Protocol conversation view (grouped by 5-tuple)
- Anomaly panel (clear-text credentials, unusual DNS, large transfers)
- "Save Capture" and "Export Findings to Vault" actions

**Anomaly detection rules:**

| Rule | Trigger | Severity |
|------|---------|----------|
| Clear-text credentials | HTTP `Authorization` header, FTP `USER/PASS` | High |
| DNS tunneling | TXT queries > 200 chars, high entropy subdomains | Medium |
| Lateral movement | SMB/ RDP to non-standard ports | Medium |
| External beaconing | Periodic outbound to known C2 IPs | Critical |
| Large transfers | Single flow > 100MB | Low |

**Data flow:**

1. User selects capture interface and starts capture
2. Host streams packet metadata to plugin via Tauri events
3. Plugin renders real-time protocol view
4. User stops capture → host writes `.pcap` BLOB to plugin's encrypted partition
5. Anomalies flagged in UI
6. User clicks "Export to Vault" → findings written with `plugin_id: "pcap"`

**GDPR/HIPAA note:** PCAP data may contain PHI/PII in unencrypted application traffic. Retention policies enforced by host; access logged.

**Acceptance Criteria:**

- [ ] Host captures live traffic on selected interface
- [ ] Plugin displays real-time packet stream with protocol decoding
- [ ] Anomaly detection flags at least 5 rule classes
- [ ] Capture BLOBs stored in encrypted partition
- [ ] Findings exportable to vault

**Testing:**

- Unit tests for BPF filter compilation
- Mock packet stream for UI rendering tests
- Anomaly detection rule tests with synthetic traffic

---

### 3.4 Privilege Escalation Auditor (`plugins/pecheck`)

| Attribute | Value |
|-----------|-------|
| Category | `security` |
| Builtin | Yes |
| Permissions | `system:read` (host only), `db:write` |
| Dependencies | `CAT-SEC-001` |

**Objective:** Local privilege escalation checks—services, scheduled tasks, SUID binaries, sudo misconfigurations.

**Technical Approach:**

Host executes platform-specific audit commands and returns structured findings. Plugin renders risk-ranked findings with remediation guidance.

**Host-side Rust module (`src-tauri/src/pecheck.rs`):**

- `run_checks() -> Result<Vec<EscalationFinding>, String>`: Orchestrate all checks
- `check_windows_services() -> Result<Vec<ServiceFinding>, String>`: `sc.exe qc`, service permission checks
- `check_scheduled_tasks() -> Result<Vec<TaskFinding>, String>`: PowerShell `Get-ScheduledTask`
- `check_suid_binaries() -> Result<Vec<SuidFinding>, String>`: Linux `find / -perm -4000`
- `check_sudo_config() -> Result<Vec<SudoFinding>, String>`: Parse `/etc/sudoers`

**Plugin frontend (`plugins/pecheck/src/`):**

- "Run Audit" button with progress indicator
- Findings grouped by category (Services, Tasks, SUID, Sudo)
- Severity-sorted list with expandable details
- Remediation guidance per finding
- "Save to Vault" bulk action

**Finding schema:**

```typescript
interface EscalationFinding {
  id: string;
  category: "service" | "task" | "suid" | "sudo" | "kernel";
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  target: string;
  remediation: string;
  evidence: Record<string, string>;
  checked_at: string;
}
```

**Data flow:**

1. User clicks "Run Audit"
2. Host executes platform-specific checks
3. Findings returned to plugin
4. Plugin renders grouped, severity-ranked list
5. User reviews and clicks "Save All to Vault"
6. Findings written with `plugin_id: "pecheck"`

**Acceptance Criteria:**

- [ ] Windows checks identify unquoted service paths, weak service permissions, SYSTEM-run tasks
- [ ] Linux checks identify SUID binaries, NOPASSWD sudo rules, writable sudoers
- [ ] Findings include remediation guidance
- [ ] Results can be saved to vault in bulk
- [ ] Plugin respects `system:read` permission boundary

**Testing:**

- Unit tests for each check function with mock command output
- Cross-platform CI matrix (Windows + Linux)
- Integration test verifying vault write path

---

### 3.5 Report Generator (`plugins/reports`)

| Attribute | Value |
|-----------|-------|
| Category | `security` |
| Builtin | Yes |
| Permissions | `db:read` |
| Dependencies | `CAT-SEC-001` |

**Objective:** Reads findings from vault via Data Broker, generates professional pentest reports.

**Technical Approach:**

Read-only access to vault findings. Generates Markdown reports with optional PDF export via host-side conversion.

**Data Broker queries:**

```typescript
// Query findings by engagement
sendRequest<Finding[]>({
  type: "vault:get_findings",
  params: {
    engagement_id: "engagement-001",
    severity: ["high", "critical"],
    limit: 1000
  }
});

// Query all findings for a specific plugin
sendRequest<Finding[]>({
  type: "vault:get_findings",
  params: {
    plugin_id: "pecheck",
    limit: 100
  }
});
```

**Plugin frontend (`plugins/reports/src/`):**

- Engagement selector
- Date range filter
- Severity filter
- Report template selector (Executive Summary, Technical Detail, Full)
- Preview pane with rendered Markdown
- "Export Markdown" and "Export PDF" actions
- Report history stored in plugin's own partition

**Report sections:**

1. **Executive Summary** — High-level risk overview, finding count by severity, top 5 critical findings
2. **Scope & Methodology** — Engagement ID, date range, tools used
3. **Technical Findings** — Full finding details grouped by severity, mapped to CWE/CVE
4. **Remediation Timeline** — Prioritized remediation roadmap
5. **Appendix** — Raw finding data, tool versions, scan parameters

**Data flow:**

1. User selects engagement and report template
2. Plugin queries vault via `vault:get_findings`
3. Findings aggregated and sorted by severity
4. Markdown rendered in preview pane
5. User exports Markdown or PDF
6. Report metadata stored in plugin's partition for history

**GDPR/HIPAA note:** Reports may contain PHI/PII if systems process health data. Stored in plugin's encrypted partition, access controlled, retention configurable per engagement.

**Acceptance Criteria:**

- [ ] Queries vault for findings filtered by engagement, severity, plugin
- [ ] Generates Markdown report with all 5 sections
- [ ] Report preview renders correctly
- [ ] Markdown export functional
- [ ] PDF export via host-side conversion
- [ ] Plugin only uses `db:read` permission

**Testing:**

- Mock vault responses for report generation tests
- Template rendering tests for each report section
- Integration test verifying read-only data access

---

## 4. Phase Plan

### Phase 1: Data Broker Extension (`CAT-SEC-001`)

**Tasks:**
- `CAT-SEC-001a`: Create `vault_add_finding.json` and `vault_get_findings.json` schemas
- `CAT-SEC-001b`: Add `vault_findings` table to `schema.sql`
- `CAT-SEC-001c`: Implement `handle_vault_add_finding` and `handle_vault_get_findings` in `ipc.rs`
- `CAT-SEC-001d`: Add permission entries to `required_permission()`
- `CAT-SEC-001e`: Write unit tests for schema validation and query handlers

**Estimated Hours:** 8.0
**Complexity:** 1.5
**Risk:** 1.2
**Weight:** 14.40

**Acceptance Criteria:**
- [ ] `vault:add_finding` validates payload against schema and inserts finding
- [ ] `vault:get_findings` returns filtered, paginated results
- [ ] Permission checks enforce `db:write` for add, `db:read` for get
- [ ] Unit tests cover valid/invalid payloads for both endpoints

### Phase 2: Security Plugin Development

**Tasks:**
- `CAT-SEC-002`: Network Scanner plugin
- `CAT-SEC-003`: Credential/Hash Auditor plugin
- `CAT-SEC-004`: PCAP/Traffic Analyzer plugin
- `CAT-SEC-005`: Privilege Escalation Auditor plugin
- `CAT-SEC-006`: Report Generator plugin

**Estimated Hours:** 60.0 total
**Complexity:** 1.8 average
**Risk:** 1.4 average

### Phase 3: Integration & Verification

**Tasks:**
- `CAT-SEC-007`: Integration smoke tests
- `CAT-SEC-008`: Security audit (CSP, permission boundaries, vault access logging)
- `CAT-SEC-009`: GDPR/HIPAA compliance verification

---

## 5. GDPR/HIPAA Compliance Notes

### Data Classification

| Data Type | Classification | Storage | Retention |
|-----------|--------------|---------|-----------|
| Scan results (hostnames, ports) | Infrastructure metadata | Vault (encrypted) | Configurable, default 90 days |
| Cracked credentials | Access credentials | Vault (biometric-gated) | Configurable, default 30 days |
| PCAP captures | Network traffic (may contain PHI/PII) | Plugin partition (encrypted) | Configurable, default 7 days |
| System config findings | Infrastructure metadata | Vault (encrypted) | Configurable, default 90 days |
| Pentest reports | Security assessment data | Plugin partition (encrypted) | Per engagement |

### Audit Requirements

- All vault writes are logged with `plugin_id`, `timestamp`, and `engagement_id` where applicable
- Biometric access to vault is logged via Windows Hello event integration
- No telemetry or external data transmission
- Data minimization: failed crack attempts and intermediate scan states are not persisted

### Access Control

- Vault access requires biometric challenge (`invoke_biometric_challenge`)
- Individual plugins cannot read vault data written by other plugins except via Data Broker queries
- Report Generator is the only plugin with broad vault read access (`db:read`)

---

## 6. Deliverables

| ID | Name | Module |
|----|------|--------|
| CAT-SEC-001 | Data Broker Vault Extension | `src-tauri/src/ipc.rs`, `src-tauri/schemas/vault_*.json` |
| CAT-SEC-002 | Network Scanner | `plugins/scanner/` |
| CAT-SEC-003 | Credential/Hash Auditor | `plugins/creds/` |
| CAT-SEC-004 | PCAP/Traffic Analyzer | `plugins/pcap/` |
| CAT-SEC-005 | Privilege Escalation Auditor | `plugins/pecheck/` |
| CAT-SEC-006 | Report Generator | `plugins/reports/` |
