# Habit Garden OpenWiki

This wiki is the compact repo map for coding agents working in Habit Garden. Use it when you need project context that is too detailed for `AGENTS.md` or `CLAUDE.md`.

## Start Here

- [Project Map](./project-map.md) - product shape, stack, directory map, and core conventions.
- [Architecture](./architecture.md) - App Router, provider tree, Supabase boundary, payments, mobile, and cron.
- [Data Flow](./data-flow.md) - how server data, contexts, optimistic updates, and mutations move through the app.
- [Domain Model](./domain-model.md) - plants, goals, mood, progression, economy, inventory, and subscription concepts.
- [Garden UI](./garden-ui.md) - the isometric garden, canvas-first rendering, edit mode, zoom/pan, and visual constraints.
- [Server Actions](./server-actions.md) - mutation rules, auth, ownership checks, and feature action files.
- [Database And Migrations](./database-and-migrations.md) - Supabase schema sources, RLS expectations, and migration workflow.
- [Testing And Verification](./testing-and-verification.md) - unit, e2e, Storybook, and build commands.
- [Guided Habit Sessions](./guided-habit-sessions.md) - persistent focus sessions, daily progress, completion, and deterministic Growth Plans.
- [Agent Playbook](./agent-playbook.md) - practical rules for future agents before editing this repo.

## OpenWiki Contract

This directory is durable repo context. Keep pages short, source-backed, and linked to code paths. When changing architecture, domain behavior, or major workflows, update the relevant page in the same task.

Do not paste this whole wiki into an instruction file. Agents should retrieve only the page needed for the task.
