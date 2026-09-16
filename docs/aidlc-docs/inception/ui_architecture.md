# Nidus — UI Architecture & Design System

## 1. Design Philosophy

Nidus follows a **world-class plugin architecture** inspired by the best-in-class applications: VS Code, Obsidian, Backstage, Raycast, Linear, Notion, Figma, and Arc Browser.

### Core Principles

- **Consistent Chrome, Native-Feel Plugins**: Every plugin lives inside the same polished shell. Users never feel lost when switching contexts.
- **Keyboard-First**: All navigation, search, and actions are accessible via keyboard shortcuts. Raycast-inspired efficiency.
- **Information Density with Calm**: Linear’s approach — surface what matters, recede what doesn’t. High information density without visual noise.
- **Dark Mode First**: Security-focused, professional aesthetic. Near-black surfaces with high-contrast text and restrained accent colors.
- **Plugin as First-Class Citizen**: Each plugin is a viewport into the shell, not a separate island. Activity Bar icons, sidebar navigation, and status bar indicators are all plugin-aware.

---

## 2. Layout Architecture

### Three-Pane Shell

```
┌──────────┬──────────────────────────────────────────┬──────────┐
│ Activity │                                          │ Plugin   │
│ Bar      │   Main Content Area                      │ Details  │
│ (64px)   │   (Context-Aware Viewport)               │ Panel    │
│          │                                          │ (320px)  │
│          │                                          │          │
│          │                                          │          │
└──────────┴──────────────────────────────────────────┴──────────┘
```

| Region | Width | Purpose |
|--------|-------|---------|
| **Activity Bar** | 64px | Plugin icons, app launcher. Always visible. Collapses to icons only. |
| **Sidebar** | 260px (collapsible) | Context-aware navigation. Search, favorites, recent items, plugin-specific nav. |
| **Main Content** | Fluid | Active view. Command Palette overlay. Plugin iframe or native view. |
| **Plugin Panel** | 320px (optional) | Details/inspector. Shows context for selected item. Collapsible. |

### Status Bar (Bottom)

```
┌─────────────────────────────────────────────────────────────┐
│ 🔒 Encrypted  │  ⚡ Synced  │  📦 3 plugins  │  v1.0.0  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Visual Design System

### Color Palette (Dark Mode First)

Inspired by Raycast, Linear, and Arc Browser:

| Token | Value | Usage |
|-------|-------|-------|
| `--canvas` | `#040506` | App background |
| `--surface-1` | `#111214` | Sidebar, panels |
| `--surface-2` | `#1b1c1e` | Elevated cards, hover states |
| `--surface-3` | `#252628` | Active/focused elements |
| `--border` | `#2e2f32` | Subtle dividers |
| `--text-primary` | `#f0f0f0` | Headings, body |
| `--text-secondary` | `#a0a0a0` | Metadata, captions |
| `--text-muted` | `#6b6b6b` | Placeholder, disabled |
| `--accent` | `#55b3ff` | Primary actions, links |
| `--accent-hover` | `#7ac5ff` | Hover states |
| `--success` | `#5fc992` | Positive indicators |
| `--warning` | `#ffbc33` | Warnings |
| `--danger` | `#ff5f5f` | Errors, destructive actions |

### Typography

| Role | Font | Weight | Size | Line Height |
|------|------|--------|------|-------------|
| Display | Inter | 600 | 24px | 1.2 |
| H1 | Inter | 600 | 20px | 1.3 |
| H2 | Inter | 600 | 16px | 1.4 |
| Body | Inter | 400 | 14px | 1.5 |
| Caption | Inter | 400 | 12px | 1.4 |
| Mono | Geist Mono / ui-monospace | 400 | 13px | 1.5 |

**Key traits:**
- Positive letter-spacing on dark UI (+0.2px to +0.4px) for airy readability
- Weight 500 as baseline for body text
- OpenType features: calt, kern, liga enabled globally

### Spacing & Layout

- Base unit: 4px
- Border radius: 6px (buttons, inputs), 8px (cards, panels)
- Sidebar width: 260px (collapsible to 0)
- Activity Bar: 64px fixed
- Status Bar: 24px fixed
- Content padding: 16px-24px

---

## 4. Component Library

### Stack

- **shadcn/ui** — Component library built on Radix UI primitives
- **Tailwind CSS** — Utility-first styling
- **Lucide React** — Icon set (consistent stroke width, matches Raycast/Linear aesthetic)
- **Framer Motion** — Smooth transitions and micro-interactions

### Key Components

| Component | Pattern | Reference |
|-----------|---------|-----------|
| **ActivityBar** | Vertical icon rail, hover reveals label | VS Code |
| **Sidebar** | Collapsible, sections with headers, search at top | Linear, Raycast |
| **Command Palette** | `Cmd+K` overlay, fuzzy search, keyboard navigation | Raycast, Linear |
| **PluginCard** | Icon, name, description, status indicator | VS Code Marketplace |
| **StatusBar** | Left: system status, Right: notifications | VS Code |
| **Toast** | Bottom-right, stackable, actionable | Linear |
| **EmptyState** | Illustration, headline, action button | Linear |
| **PluginPanel** | Context-aware right panel, collapsible | VS Code Inspector |

---

## 5. Plugin Integration Points

### Registration Contract

Every plugin manifest declares its UI integration points:

```json
{
  "id": "com.nidus.journal",
  "name": "Journal",
  "version": "1.0.0",
  "icon": "📓",
  "ui": {
    "activityBar": true,
    "sidebarSection": "Journal",
    "commands": [
      { "id": "new-entry", "title": "New Journal Entry", "keybinding": "Cmd+Shift+N" }
    ]
  },
  "permissions": ["db:read", "db:write"]
}
```

### Activity Bar Integration

- Plugins with `activityBar: true` get an icon slot in the Activity Bar
- Active plugin is highlighted with accent color
- Hover reveals plugin name (tooltip)
- Clicking switches the main content to that plugin's view

### Sidebar Integration

- Plugins can register a sidebar section
- Sections appear below core navigation (Home, Search, Favorites)
- Collapsible sections with child items
- Context-aware: shows different items based on active plugin

### Command Palette Integration

- Plugins register commands in manifest
- Commands appear in `Cmd+K` palette
- Fuzzy search across all commands, files, and settings
- Keyboard shortcuts shown alongside commands
- Recent commands prioritized

---

## 6. Key Interaction Patterns

### Command Palette (`Cmd+K`)

The universal command center, inspired by Raycast and Linear:

- **Search**: Fuzzy search across all plugins, files, settings
- **Actions**: Execute any registered command
- **Navigation**: Jump to any view or plugin
- **Recent**: Previously executed commands
- **Keyboard**: Arrow keys, Enter to execute, Esc to dismiss

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+K` | Open Command Palette |
| `Cmd/Ctrl+P` | Quick switcher (recent files/views) |
| `Cmd/Ctrl+B` | Toggle Sidebar |
| `Cmd/Ctrl+Shift+N` | New Journal Entry |
| `Cmd/Ctrl+1-9` | Switch to plugin by Activity Bar position |
| `Cmd/Ctrl+,` | Open Settings |
| `Cmd/Ctrl+W` | Close current view |

### Plugin Switching

- Click Activity Bar icon OR use `Cmd+1` through `Cmd+9`
- Smooth transition between plugins (fade or slide)
- Each plugin retains its scroll position and state while inactive
- Active plugin indicated by accent color highlight

### Data Sharing Between Plugins

- Goals plugin shows active task count from Todo plugin
- Data flows through secure broker, not direct plugin-to-plugin
- UI shows data provenance: "Data from Todo plugin" with link
- Real-time updates via broker subscription model

---

## 7. Empty States & Onboarding

### First-Run Experience

1. **Welcome Screen**: Clean, centered layout with app name, tagline, and primary CTA
2. **Biometric Setup**: Guided Windows Hello enrollment (if not configured)
3. **Plugin Discovery**: Curated recommendations from Plugin Store
4. **Quick Start**: Pre-populated sample data to demonstrate capabilities

### Plugin Empty States

Each plugin shows a beautiful empty state when no data exists:

- **Journal**: "Start writing your first entry" with calming illustration
- **Todo**: "No tasks yet. Add your first to-do" with + button
- **Goals**: "Set your first goal" with suggested templates

### Onboarding Tooltips

- First-time hover over Activity Bar icons reveals tooltip with plugin description
- Command Palette shows "Tip: Use ↑↓ to navigate, Enter to execute" on first open
- Sidebar sections animate in sequentially on first launch

---

## 8. Theme System

### CSS Custom Properties as Public API

Following Obsidian's pattern, the theme system exposes CSS variables as a contract between the host and plugins:

```css
:root {
  /* Surfaces */
  --canvas: #040506;
  --surface-1: #111214;
  --surface-2: #1b1c1e;
  --surface-3: #252628;
  --border: #2e2f32;

  /* Typography */
  --text-primary: #f0f0f0;
  --text-secondary: #a0a0a0;
  --text-muted: #6b6b6b;

  /* Accents */
  --accent: #55b3ff;
  --accent-hover: #7ac5ff;
  --success: #5fc992;
  --warning: #ffbc33;
  --danger: #ff5f5f;

  /* Spacing */
  --sidebar-width: 260px;
  --activity-bar-width: 64px;
  --status-bar-height: 24px;
}
```

Plugins inherit these variables automatically. They can override for their own components but should respect the host theme.

### Theme Customization

- **Built-in themes**: Dark (default), Light, High Contrast
- **Accent color picker**: Users choose their primary accent
- **Plugin themes**: Plugins can register custom color schemes that respect the host's light/dark preference

---

## 9. Notification System

### Toast Notifications

- Bottom-right corner, stackable
- Types: info, success, warning, error
- Action buttons: "Undo", "Retry", "Dismiss"
- Auto-dismiss after 5s with pause on hover
- Smooth enter/exit animations

### Status Bar Indicators

- **Encryption**: Lock icon (green = encrypted, red = error)
- **Sync**: Cloud icon with spinner when syncing
- **Plugins**: Plug icon showing count of active plugins
- **Notifications**: Bell icon with badge count

---

## 10. Plugin Store UI

### Discovery Experience

- **Grid layout**: Cards with plugin icon, name, description, rating
- **Categories**: Productivity, Security, Integration, Developer Tools
- **Search**: Real-time filtering as user types
- **Detail View**: Expanded view with screenshots, permissions, install button
- **One-Click Install**: Install button triggers download, extraction, and registration

### Plugin Management

- **Installed Tab**: List of installed plugins with enable/disable toggle
- **Updates Tab**: Available updates with changelog
- **Permissions View**: Clear display of what each plugin can access

---

## 11. Responsive Behavior

### Window Sizing

- **Compact** (< 800px width): Sidebar auto-collapses, Activity Bar remains
- **Standard** (800-1200px): Full three-pane layout
- **Wide** (> 1200px): Plugin Panel auto-expands

### Panel Behavior

- Plugin Panel auto-shows when an item is selected
- Auto-hides when selection is cleared
- User can pin panel open

---

## 12. Motion & Animation

### Principles (Inspired by Linear & Arc)

- **Purposeful**: Every animation serves a function (feedback, continuity, delight)
- **Fast**: 150-300ms for micro-interactions, 300-500ms for view transitions
- **Subtle**: No bouncy or playful easings — ease-out for enter, ease-in for exit
- **Consistent**: Same timing functions across all components

### Key Animations

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Command Palette open/close | 200ms | ease-out |
| Sidebar collapse/expand | 250ms | ease-out |
| Toast enter | 300ms | ease-out |
| Toast exit | 200ms | ease-in |
| Plugin switch | 200ms | fade |
| Button hover | 150ms | ease-out |

---

## 13. Accessibility

- **Keyboard Navigation**: Full app navigable without mouse
- **Focus Management**: Visible focus rings, logical tab order
- **Screen Reader**: ARIA labels on all interactive elements
- **Color Contrast**: WCAG AA compliant (4.5:1 for text)
- **Reduced Motion**: Respect `prefers-reduced-motion`

---

## 14. Implementation Priority

### Phase 1: Foundation (Inception)
1. Design System Foundation (TSK-001)
2. Three-Pane Shell (TSK-002)
3. Command Palette (TSK-003)
4. Plugin Store UI (TSK-004)

### Phase 2: Runtime (Construction)
5. Tauri Host Setup (TSK-005)
6. Security & Storage (TSK-006, TSK-007, TSK-008)
7. Plugin Runtime (TSK-009, TSK-010, TSK-011)
8. Plugin SDK (TSK-012)

### Phase 3: Plugins (Construction)
9. Journaling Plugin (TSK-013)
10. Todo Plugin (TSK-014)
11. Goals Plugin (TSK-015)

### Phase 4: Release (Operations)
12. Windows Installer (TSK-016)

---

## 15. Reference Applications

| Application | What We Borrow |
|-------------|----------------|
| **VS Code** | Activity Bar, sidebar panels, command palette, status bar |
| **Obsidian** | CSS variable theming, plugin leaf system, local-first simplicity |
| **Backstage** | Plugin registration contract, consistent chrome, extension points |
| **Raycast** | Keyboard-first design, compact mode, action bar, extension store |
| **Linear** | Ultra-minimal dark UI, purple accent, information density, command palette |
| **Notion** | Workspace sidebar, block-based plugin UI, template library |
| **Figma** | Plugin modal UI, community marketplace pattern |
| **Arc Browser** | Sidebar-first layout, spaces, command bar, translucent surfaces |
