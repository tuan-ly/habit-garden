# Agent Playbook

## Before Editing

1. Read this wiki page set only as needed.
2. Check `git status --short`; do not overwrite user changes.
3. For garden work, read `docs/openwiki/garden-ui.md`.
4. For data mutation work, read `docs/openwiki/server-actions.md` and the target action file.
5. For schema work, read `docs/openwiki/database-and-migrations.md`.

## Change Boundaries

- Keep UI orchestration in components.
- Keep writes in server actions.
- Keep domain calculations in `src/lib/*` helpers when they are shared or testable.
- Keep context providers focused on client state, hydration, and optimistic behavior.
- Keep migrations in `supabase/migrations/`.

## Common Pitfalls

- Calling Supabase directly from client components.
- Reordering dashboard providers without checking dependency order.
- Using `select('*')` in hot paths.
- Treating `dead`/`dormant` as new UX states instead of legacy compatibility states.
- Adding DOM-heavy animation to the garden.
- Duplicating grid collision logic outside `grid-positioning.ts`.
- Updating plant/goal behavior without adjusting `PlantWithType` or the garden read model.

## Where To Look

- Plant fetch/read model: `src/lib/actions/plants.ts`.
- Garden state and modes: `src/components/garden/garden-view.tsx`.
- Isometric interactions: `src/components/garden/isometric-garden.tsx` and `src/components/garden/use-garden-interactions.ts`.
- Optimistic plant state: `src/lib/context/plants-context.tsx`.
- Goal math: `src/lib/goal-utils.ts` and `src/lib/goal-progress.ts`.
- Supabase auth helper: `src/lib/auth-cached.ts`.

## Updating The Wiki

When a task changes architecture, domain behavior, or a major workflow, update the relevant OpenWiki page before finishing. Prefer short source-backed notes over broad essays.
