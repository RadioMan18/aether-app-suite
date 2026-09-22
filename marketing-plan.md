# Nidus Marketing Plan

## Positioning

Nidus is an **encrypted offline workspace** for sensitive information. It is not a productivity suite. It is not a competitor to Notion, Obsidian, or Todoist.

The core promise: **your most private data stays yours—encrypted, local, and biometric-gated.**

Everything in this plan flows from that promise. If a tactic does not reinforce it, cut it.

---

## 1-Month Plan: Foundation & Proof

**Goal:** Establish a credible public presence and validate that the security/privacy positioning resonates.

### Messaging
- Lead with: *"The encrypted desktop workspace that keeps your sensitive data offline and under your control."*
- Avoid: "plugin ecosystem," "productivity suite," "all-in-one workspace."

### Deliverables
- **Marketing site / landing page** (`/marketing` or separate repo):
  - One-page focused on the encrypted local-first story.
  - Clear comparison: Nidus vs. cloud-based tools (Notion, Evernote, Apple Notes) on the privacy dimension.
  - Screenshots showing biometric unlock and encrypted database.
  - No feature lists. Three use cases max: private notes, sensitive client data, personal health/financial records.
- **Blog / changelog seed content** (3 posts):
  1. "Why we built Nidus" — the privacy gap in modern productivity tools.
  2. "How SQLCipher + biometric gating work under the hood" — technical credibility for security-conscious users.
  3. "Plugin permissions: security by design" — explain the sandbox model as a privacy feature, not a developer feature.

### Distribution
- **Product Hunt launch** (timed with landing page live).
- **Reddit / Hacker News** post in r/privacy, r/selfhosted, r/encryption, and HN "Show HN" — focus on the technical implementation, not the feature set.
- **Twitter / X**: Thread on local-first encrypted apps, tagging relevant privacy/security accounts.

### Metrics
- Landing page conversion to download > 5%.
- 500+ signups / waitlist emails.
- Product Hunt upvotes > 100.

### Budget
- $0 paid acquisition this month.
- Time cost: landing page build, 3 blog posts, launch day monitoring.

---

## 3-Month Plan: Trust & Community

**Goal:** Convert early adopters into advocates and establish Nidus as a credible option in the encrypted local-first space.

### Messaging
- Shift from "what it is" to **"who it is for."**
- Target personas:
  - **Privacy-conscious professionals** (lawyers, consultants, therapists) handling client data.
  - **Journalers / personal archivists** who want private, offline notes.
  - **Security researchers / engineers** who care about local encryption and open architecture.

### Deliverables
- **Use-case landing pages** (separate pages, not separate products):
  - `/use-cases/legal` — client matter notes, offline, encrypted.
  - `/use-cases/journal` — private journaling with no cloud sync.
  - `/use-cases/health` — personal health/financial records, biometric-gated.
- **User-generated content program**:
  - Send early access to 20–50 users in target personas.
  - Ask for written or video testimonials specifically about privacy and offline access.
  - Publish case studies: "How [persona] uses Nidus to keep sensitive data local."
- **Plugin catalog curation**:
  - Release **3–4 plugins max**, chosen for security/privacy relevance:
    1. **Password / Secrets Vault** (CAT-009) — encrypted credential storage.
    2. **Clipboard Manager / Snippet Vault** (CAT-013) — local-only clipboard history with sensitive-data redaction.
    3. **Budget / Expense Tracker** (CAT-010) — financial data that never leaves the machine.
    4. **RSS Reader** (already built) — framed as "offline news reading without tracking."
  - Do **not** release generic plugins (generic calendar, generic kanban) as marketing assets. They dilute the story.

### Distribution
- **Guest posts** on privacy/security blogs (e.g., PrivacyGuides, self-hosted blog networks).
- **Podcast appearances** on privacy-focused podcasts.
- **Reddit AMA** in r/privacy after 2 months of active development.
- **Email newsletter** (monthly): product updates, security architecture deep-dives, privacy tips. No fluff.

### Metrics
- 1,000+ waitlist / email subscribers.
- 50+ active users providing testimonials or case studies.
- Plugin catalog drives 20%+ of new installs (proves ecosystem stickiness).

### Budget
- $200–$500 for landing page hosting, email tool (ConvertKit/Mailgun), and minor promotion.
- Time cost: use-case pages, case studies, podcast outreach.

---

## 6-Month Plan: Differentiation & Expansion

**Goal:** Establish Nidus as the go-to option for users who need encrypted offline workspaces, and expand the top-of-funnel through content and SEO.

### Messaging
- **Differentiation play:** Nidus is the *only* encrypted, offline-first, plugin-extendable desktop workspace with biometric gating.
- Own the phrase: **"Encrypted local workspace."** Make it synonymous with Nidus through content.

### Deliverables
- **SEO content program**:
  - 8–10 long-form articles targeting high-intent keywords:
    - "encrypted note-taking apps"
    - "offline-first password manager alternative"
    - "local-first personal knowledge base"
    - "biometric-gated desktop app for sensitive data"
  - Each article positions Nidus as the answer, with transparent pros/cons.
- **Plugin catalog launch** (public catalog, install-from-app):
  - Release 6–8 total plugins, prioritizing security/privacy use cases.
  - Publish "Plugin Development Guide" to attract third-party developers.
  - Sponsor 1–2 indie developers to build plugins outside the core team.
- **Security audit & transparency**:
  - Commission or self-publish a third-party security review of the SQLCipher + biometric implementation.
  - Publish a "Security Model" whitepaper.
  - This is a conversion asset for the privacy persona.

### Distribution
- **Content syndication** on Medium, Dev.to, and privacy forums.
- **Developer outreach**: post Plugin Development Guide on HN, Reddit r/programming, and Discord communities.
- **Comparison pages**: "Nidus vs. Obsidian (encryption)", "Nidus vs. local password managers" — own the comparison SEO real estate.

### Metrics
- 5,000+ email subscribers.
- 500+ active users.
- 10%+ conversion from landing page to active use.
- Third-party plugins built by community members (1–2).

### Budget
- $1,000–$2,000 for security audit, content promotion, and developer outreach.
- Time cost: SEO content, security review coordination, plugin developer relations.

---

## 12-Month Plan: Category Leadership

**Goal:** Make Nidus the default recommendation for encrypted offline workspaces and achieve sustainable organic growth.

### Messging
- **Category creation**: Nidus didn't enter the productivity market. It created the "encrypted local workspace" category.
- **Social proof-heavy**: testimonials, case studies, press mentions from privacy/security media.

### Deliverables
- **Annual "State of Local-First Privacy" report**:
  - Survey users on privacy concerns, cloud sync risks, local storage adoption.
  - Publish findings and position Nidus as the solution to the problems the report identifies.
- **Plugin ecosystem maturation**:
  - 15–20 plugins in catalog.
  - Plugin developer revenue share or sponsorship program.
  - Featured plugins on landing page.
- **Enterprise / team pilot**:
  - Offer Nidus for teams handling sensitive data (law firms, healthcare clinics, financial advisors).
  - Team features: shared encrypted vaults, admin biometric controls, audit logs.
  - This is the path to revenue if the consumer market is too slow.
- **Open-source core components** (optional but powerful):
  - Open-source the plugin SDK, sandbox model, and IPC protocol.
  - Community trust + developer adoption + press coverage.

### Distribution
- **PR push** to tech and privacy media (TechCrunch, The Verge, PrivacyGuides, Ars Technica).
- **Conference talks**: local-first, privacy, security conferences.
- **Partnerships**: integrate with or recommend alongside other privacy tools (e.g., Bitwarden, Proton, Mullvad).

### Metrics
- 20,000+ email subscribers.
- 2,000+ active users.
- 30%+ organic traffic from SEO.
- Enterprise pilot conversations with 5+ organizations.

### Budget
- $5,000–$10,000 for security audit, PR, content production, and potential enterprise feature development.
- Time cost: report production, PR management, enterprise sales conversations.

---

## What This Plan Does NOT Include

- **Generic productivity marketing.** No "get more done" messaging. That market is saturated and Nidus will lose on features.
- **Plugin count as a metric.** 50 plugins means nothing if they don't serve the core positioning. 3 well-chosen, security-relevant plugins are better than 20 generic ones.
- **Paid social ads** until month 6. The privacy audience is not efficiently reached through Facebook/Instagram ads. Earned media and SEO are the right channels.
- **Mobile app.** Desktop-only for the foreseeable future. The biometric + encrypted local story is strongest on desktop.

---

## Brutal Honesty: What Could Kill This Plan

1. **If the core product doesn't deliver on the privacy promise.** SQLCipher misconfiguration, biometric bypass, telemetry leaks—any of these destroy credibility permanently in this market.
2. **If plugins are generic.** If the plugin catalog looks like a random collection of productivity tools, Nidus becomes "yet another Electron app with extensions." Every plugin must reinforce the privacy/security story.
3. **If the team pivots again.** This plan requires 12 months of consistent execution on the "encrypted local workspace" positioning. Abandoning it for "productivity" or "AI" or any other trend will waste everything.
4. **If the UX is worse than alternatives for private data.** Users who care about privacy will tolerate some roughness, but not if it feels unsafe or unreliable. The biometric + encryption UX must be seamless.

---

## Addendum: Plugin Portfolio Analysis

**Date:** 2026-09-22  
**Inputs:** Currently built plugins, `docs/security-plugins.md` (planned security plugin set), marketing positioning ("encrypted offline workspace for sensitive information").

### Bottom line

The planned security plugins (`scanner`, `creds`, `pcap`, `pecheck`, `reports`) are a **distraction from your actual market**. Do not lead with them. Do not build them before you have users.

### Why the security plugin set fails as a launch story

1. **Wrong audience.** Those plugins target red-team and internal-IT workflows. That audience is small, skeptical, and already well-served by mature tools (Nmap, hashcat, Wireshark, Nessus). They don't need a Tauri wrapper.
2. **Wrong positioning.** Password cracking, network scanning, and privilege-escalation auditing invite legal and ethical scrutiny. They alienate the mainstream privacy audience you need for product-market fit.
3. **Wrong order.** You are building platform features before you have users who demand them. Plugin ecosystems grow from a core product that is indispensable, not from a speculative feature set.

### What to actually lead with

From your **currently built** plugins, these five serve the positioning:

| Rank | Plugin | Marketing role | Key message |
|------|--------|---------------|-------------|
| 1 | **Notes + Knowledge Graph** | Headliner | "Private notes with encrypted local storage and biometric unlock. No cloud, no accounts, no tracking." |
| 2 | **Mood / Wellness Tracker** | Health/privacy story | "Your health data stays on your machine, behind Windows Hello. Mood, weight, blood pressure, glucose—encrypted and private." |
| 3 | **Contacts / Mini-CRM** | Professional services | "Client contacts and interaction history, stored locally with encryption. GDPR-compliant by design, no cloud sync." |
| 4 | **Todo** | Supporting cast | "Task management without cloud sync. Your to-do list, encrypted locally." |
| 5 | **RSS Reader** | Privacy reinforcement | "Read your feeds without accounts, without tracking, without leaving a cloud trace." |

### What to exclude from launch marketing

- **Kanban, Pomodoro, Calendar, Goals** — generic productivity. They make Nidus look like "yet another Notion clone." Keep them as builtins if they are already built, but do not feature them in marketing.
- **All five security plugins** (`scanner`, `creds`, `pcap`, `pecheck`, `reports`) — park them. Revisit only if a specific enterprise customer asks for them.

### What to build first after launch

**Password / Secrets Vault (CAT-009)** is the highest-value next plugin. It extends the encrypted-local-workspace story with a feature users immediately understand and want: *"Your passwords, locally encrypted, biometric-gated, no cloud sync."*

The security plugins from `docs/security-plugins.md` should be deprioritized or cut from the roadmap unless you have a specific enterprise buyer. They are a feature trap.

### Decision rule

Every plugin in the catalog must answer: **"Does this reinforce the promise that sensitive data stays encrypted, local, and biometric-gated?"** If the answer is no, cut it from launch marketing and defer it until you have user demand.

---

## Addendum: Next Five Plugins

**Date:** 2026-09-22  
**Inputs:** Currently built plugins, planned plugins (`docs/security-plugins.md`, plugin catalog plan), local-first software market trends 2025–2026.

### Bottom line

Build these five next, in this order. They close the gaps in your positioning and align with what the 2026 local-first/privacy market is actually buying.

### The five to build next

#### 1. Password / Secrets Vault (CAT-009)
**Priority: Build first.**

Table stakes for a "secure workspace" in 2026. Every competitor in the encrypted-local space (Keepra, ZeroNote, Knot) already has a vault. You cannot credibly market Nidus as the place for sensitive data without one.

**Market as:** *"Your passwords, API keys, SSH keys, and secure notes—locally encrypted, biometric-gated, no cloud sync."*

#### 2. Encrypted Document Vault (NEW — not currently planned)
**Priority: Build second.**

Store, search, and organize sensitive PDFs, scans, and documents locally with OCR. The research shows that document-heavy privacy users (lawyers, therapists, healthcare patients) are underserved. Knotbook and Agency have PDF features, but neither is positioned as a general encrypted document vault.

**Market as:** *"Your sensitive documents stay on your machine. Search encrypted PDFs and scans without uploading them anywhere."*

#### 3. Private AI Chat (NEW — not currently planned)
**Priority: Build third.**

This is the single biggest trend in local-first software right now. KnotAI (Knotbook), Agency, Altretta, and Nexine are all building on-device AI that works with private data. The positioning is powerful: *"AI assistance without the cloud. Your notes, tasks, and documents never leave your machine."*

**Implementation path:**
- **Phase 1:** Connect to cloud AI providers (OpenAI, Anthropic) but filter/redact sensitive fields before sending, with explicit user consent per query.
- **Phase 2:** Add local LLM support via `llama.cpp` or similar for fully offline AI.

This is your best differentiation play. Cloud-first apps cannot honestly make this claim.

#### 4. Secure Clipboard & Snippet Vault (CAT-013)
**Priority: Build fourth.**

Developers and professionals handling sensitive data need a clipboard manager that respects privacy—automatic redaction of passwords, credit cards, and health data from clipboard history. Market it to developers and security-conscious users who currently use clipboard managers with no privacy guarantees.

**Market as:** *"Clipboard history with automatic sensitive-data redaction. Your copied passwords and credit cards never persist unencrypted."*

#### 5. Budget / Expense Tracker (CAT-010)
**Priority: Build fifth.**

Financial data is one of the three use cases in your marketing plan ("personal health/financial records"). A local encrypted budget tracker serves that promise directly.

**Market as:** *"Your financial data never leaves your machine. No bank connections, no accounts, no cloud sync—just encrypted local tracking."*

### What to cut or park

From your existing planned plugins, these should not be built or marketed:

- **Kanban, Pomodoro, Calendar (as generic productivity):** Keep them as builtins if already built, but do not feature them in marketing. They make Nidus look like a Notion clone. The Calendar plugin already exists and now shows todos/goals—keep it for functionality, but the marketing story is "Notes + Vault + AI," not "productivity suite."

- **Goals (builtin):** Redundant with Todo. Don't market it separately.

- **All five security plugins from `docs/security-plugins.md` (`scanner`, `creds`, `pcap`, `pecheck`, `reports`):** Cut them from the roadmap. They target a small, skeptical audience that already has mature tools. They introduce legal/ethical baggage and dilute your privacy positioning. Revisit only if a specific enterprise customer explicitly asks for them.

### The strategic logic

The 2026 local-first market is splitting into two categories:

1. **Collaborative productivity tools** (Linear, Notion-style) — competing on speed and sync.
2. **Privacy-sensitive offline tools** (Obsidian, Knot, Agency, Keepra) — competing on trust and data ownership.

Nidus must be in category 2. The five plugins above serve that category:

| Plugin | Serves which persona | Marketable promise |
|--------|---------------------|-------------------|
| Password / Secrets Vault | All | "Biometric-gated credentials, never leaves your machine" |
| Encrypted Document Vault | Legal, healthcare, finance | "Search sensitive PDFs locally, encrypted by default" |
| Private AI Chat | All | "AI that reads your data without sending it to the cloud" |
| Secure Clipboard & Snippets | Developers, professionals | "Clipboard history with automatic sensitive-data redaction" |
| Budget / Expense Tracker | Personal finance | "Financial tracking with no bank connections, no cloud" |

Every plugin answers the same question: **"Does this reinforce the promise that sensitive data stays encrypted, local, and biometric-gated?"** The five above pass. Kanban, Pomodoro, and the red-team security plugins do not.

---

*Last updated: 2026-09-22*
