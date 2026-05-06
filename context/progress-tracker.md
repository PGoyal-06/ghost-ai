# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 07: Wire Editor Home

## Current Goal

- Wire the editor sidebar and dialogs to real project data and API.

## Completed

- 01-design-system: shadcn/ui initialized (Tailwind v4); Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea installed to `components/ui/`; `lib/utils.ts` cn() helper in place; `globals.css` defines full dark theme tokens (project CSS vars + shadcn semantic vars, no light mode).
- 02-editor: `components/editor/editor-navbar.tsx` — fixed-height navbar with `isSidebarOpen`/`onToggleSidebar` props, PanelLeftOpen/Close icon swap, dark bg with bottom border. `components/editor/project-sidebar.tsx` — fixed overlay, slides from left, Projects header + close button, My Projects / Shared tabs (empty placeholder states), full-width New Project button. Dialog pattern ready via existing `components/ui/dialog.tsx` + globals.css tokens.
- 03-auth: `proxy.ts` at project root using `clerkMiddleware` + `createRouteMatcher` — denylist strategy, all routes protected except `/sign-in(.*)` and `/sign-up(.*)`. `ClerkProvider` wraps root layout with `@clerk/ui` dark theme and CSS variable overrides (no hardcoded colors). `app/page.tsx` redirects authenticated users to `/editor`, unauthenticated to `/sign-in`. `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` — minimal two-panel layout (left: logo + tagline + feature list, hidden on small screens; right: Clerk form). `UserButton` added to `editor-navbar.tsx` right section.

- 04-project-dialogs: Build the `/editor` home screen and add project dialogs/sidebar actions.

- 05-prisma: `prisma/models/project.prisma` — `Project` and `ProjectCollaborator` models with indexes and cascade delete. `lib/prisma.ts` — cached singleton branching on Accelerate vs. direct PG adapter. Migration applied.

- 06-project-apis: `app/api/projects/route.ts` — `GET` (list owner's projects) and `POST` (create, default name "Untitled Project"). `app/api/projects/[projectId]/route.ts` — `PATCH` (rename, owner-only) and `DELETE` (owner-only). 401 for unauthenticated, 403 for non-owner mutations. Build passes.

- 07-wire-editor-home: `lib/projects.ts` — `getProjects()` fetches owned + shared projects server-side via `currentUser()` + Prisma. `hooks/use-project-actions.ts` — `create` (POST → router.push to new workspace), `rename` (PATCH → refresh), `remove` (DELETE → redirect if active, otherwise refresh). `app/editor/layout.tsx` — async server component, fetches projects and passes to `EditorShell`. Context refactored: removes mock data, accepts `ownedProjects`/`sharedProjects` props from layout. Dialogs wired to real API with room ID preview in create dialog. Sidebar navigates to `/editor/[id]` on project click. Build passes.

## In Progress

- None.

## Next Up

- None.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- Add context needed to resume work in the next session.
