# Nidus — Plugin Catalog Expansion

*Reference notes from planning conversation, based on `tech_spec.md` and `implementation_plan.md`*

---

## 1. Context

The base architecture (from `tech_spec.md`) defines Nidus as a Tauri v2 + React desktop app with a sandboxed plugin system:

- Plugins run in sandboxed iframes via a custom `plugin://` URI scheme
- SQLCipher (AES-256-GCM) encrypted storage, gated by Windows Hello biometric key release
- A permission-gated IPC "Data Broker" for cross-plugin communication
- Initial plugin set: **Journal** (TSK-013), **Todo List** (TSK-014), **Goals Tracker** (TSK-015)
- Sandbox CSP guardrail: `connect-src 'none'` — no external network requests from plugins

This document extends that catalog with 10 additional plugin candidates.

---

## 2. Candidate Plugins, Ranked by Perceived Popularity Online

Scale: 1–10, fractional allowed. Popularity reflects the general app category (app-store rankings, GitHub star counts for comparable OSS tools, search interest) — not any specific branded product.

| Rank | Plugin | Notes |
|---|---|---|
| **9.5** | Calendar / Scheduler | Huge category (Google Calendar, Fantastical, Cron). Natural cross-plugin link with Goals and Todo via the IPC broker. |
| **9.2** | Kanban / Project Board | Trello/Linear-style board; Linear is already a named UI reference for the suite. Could share `db:read`/`db:write` permissions with Todo. |
| **8.7** | Pomodoro / Focus Timer | Popular category (Forest, Be Focused). Distinct interaction model from NidusTimeTracker (active session timer vs. passive tracking). |
| **8.3** | Linked Notes / Knowledge Graph | Obsidian-style backlinking + graph view. Strong fit — could reuse existing animated SVG knowledge-graph assets for the graph view. |
| **7.6** | Password / Secrets Vault | TSK-006/007/008 already build SQLCipher + Windows Hello key release, so a vault plugin is a small incremental lift. |
| **7.4** | Budget / Expense Tracker | High app-store demand (YNAB-style tools). Could tie into Goals Tracker for savings-goal cross-plugin data. |
| **6.8** | Mood / Wellness Tracker | Adjacent to Habits but a distinct data shape (daily check-in + notes vs. streaks). |
| **6.2** | Contacts / Mini-CRM | Steady utility category; needs its own namespace, minimal permissions. |
| **5.7** | Clipboard Manager / Snippet Vault | Power-user favorite (Raycast, Alfred snippets); fits the keyboard-first design language directly. |
| **5.1** | Read-It-Later / RSS Reader | Smaller but durable niche (Pocket, Feedly). Good "polish" addition. |

**Direction notes from discussion:**
- Some overlap with the existing standalone apps (NidusHabits, NidusTimeTracker, NidusNotes) is acceptable, since the plugin suite has its own manifest/permission model.
- Priority for new plugins: a mix of personal productivity, security/utility, and creative/knowledge tools (no single category prioritized).

---

## 3. DAG Task Nodes (continuing TSK-016)

Weight = Hours × Complexity × Risk (consistent with the existing spec's formula).

| Task ID | Task Name | Est. Hours | Complexity | Risk | Weight | Prerequisites | Phase |
|---|---|:---:|:---:|:---:|:---:|---|---|
| **TSK-017** | Calendar / Scheduler Plugin | 14 | 1.8 | 1.3 | **32.76** | TSK-012, TSK-014, TSK-015 | 🟠 Catalog Expansion |
| **TSK-018** | Kanban / Project Board Plugin | 14 | 1.6 | 1.2 | **26.88** | TSK-012, TSK-014 | 🟠 Catalog Expansion |
| **TSK-019** | Pomodoro / Focus Timer Plugin | 8 | 1.3 | 1.0 | **10.40** | TSK-012 | 🟠 Catalog Expansion |
| **TSK-020** | Linked Notes / Knowledge Graph Plugin | 18 | 2.2 | 1.5 | **59.40** | TSK-008, TSK-012 | 🟠 Catalog Expansion |
| **TSK-021** | Password / Secrets Vault Plugin | 10 | 1.8 | 1.6 | **28.80** | TSK-008, TSK-012 | 🟠 Catalog Expansion |
| **TSK-022** | Budget / Expense Tracker Plugin | 12 | 1.5 | 1.2 | **21.60** | TSK-012, TSK-015 | 🟠 Catalog Expansion |
| **TSK-023** | Mood / Wellness Tracker Plugin | 8 | 1.2 | 1.0 | **9.60** | TSK-012 | 🟠 Catalog Expansion |
| **TSK-024** | Contacts / Mini-CRM Plugin | 10 | 1.4 | 1.0 | **14.00** | TSK-012 | 🟠 Catalog Expansion |
| **TSK-025** | Clipboard Manager / Snippet Vault Plugin | 9 | 1.6 | 1.3 | **18.72** | TSK-005, TSK-003, TSK-012 | 🟠 Catalog Expansion |
| **TSK-026** | Read-It-Later / RSS Reader Plugin | 10 | 1.4 | 1.8 | **25.20** | TSK-012 | 🟠 Catalog Expansion |

### Sizing & dependency notes

- All 10 depend on **TSK-012 (Plugin SDK)** as the common entry point for any new plugin.
- **TSK-017 (Calendar)** and **TSK-022 (Budget)** also pull in TSK-014/TSK-015 for cross-plugin linking (events↔goals, spending↔savings goals) — same pattern as the existing Goals↔Todo dependency.
- **TSK-020 (Knowledge Graph)** and **TSK-021 (Vault)** depend on **TSK-008 (Secure Key Release)** since both want encrypted-at-rest storage behind the Windows Hello gate, same as Journaling.
- **TSK-025 (Clipboard Manager)** additionally needs **TSK-005 (Tauri Host)** and **TSK-003 (Command Palette)** since clipboard capture requires host-level OS access outside the sandbox, and it's meant to be keyboard-triggered.
- **TSK-026 (RSS Reader)** carries a higher risk score (1.8) than its complexity alone would suggest. This flags a conflict with the spec's guardrail #4 (`connect-src 'none'` in the plugin sandbox CSP): an RSS/read-it-later plugin needs *some* outbound fetch capability. Two resolution paths:
  1. A new host-mediated `NETWORK_FETCH` IPC message type with its own permission gate, or
  2. A scheduled background fetch done entirely on the Rust host side, with pre-fetched data handed to the plugin.
  This should be resolved in the spec before scoping the task.
- None of TSK-017–026 are wired as prerequisites into **TSK-016 (Windows Installer)** — they're treated as post-v1 catalog additions unless a specific one should gate release.

---

*Generated from a planning conversation — treat rankings and hour estimates as a starting sketch, not a committed schedule.*
