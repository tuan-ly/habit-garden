# React Components Rules

Path: `src/components/`

## Directory Map

| Directory | Contents |
|-----------|----------|
| `garden/` | Isometric garden, tiles, zoom, decorations |
| `plants/` | Plant visuals, cards, dialogs |
| `goals/` | Goal tracking UI |
| `game-ui/` | HUD, navigation, mood selector |
| `gamification/` | XP, levels, achievements UI |
| `identity/` | Identity system (PREMIUM) |
| `landing/` | Landing/marketing pages |
| `settings/` | User settings |
| `dev/` | Dev-only debug tools |

## Key Components

| Component | Role |
|-----------|------|
| `GentleWateringModal` | Main plant interaction — water, log activity |
| `IsometricGarden` | Primary garden view (isometric canvas) |
| `PlantDetailSheet` | Plant detail drawer/sheet |

## Performance Rules

- Prefer HTML5 Canvas for complex visuals or many moving parts.
- Minimize DOM CSS/JS animations — they cause lag.
- Performance and frame rate take priority over visual flair.

## Dev Components

Components in `dev/` are development-only:
- `DevDebugPanel` — toggled with `Ctrl+Shift+D`
- Never ship dev components in production code paths.
- Gate with `DevDebugProvider` context, not env checks inline.

## Archived / Removed Components

- `QuickLogModal` — ARCHIVED. File may still exist with "(archieved)" in name. Do not use or restore it.
- Do not add UI for the weed system (removed 2026-03).

## Context Providers (Dashboard Layout)

Order matters — do not reorder:
```
DashboardProviders
  ├── DevDebugProvider
  ├── SubscriptionProvider
  ├── MoodProvider
  └── GardenSettingsProvider
        └── PlantsProvider  (per-page, SSR initial data)
```

`WeedsProvider` was removed 2026-03-03. Do not re-add it.
