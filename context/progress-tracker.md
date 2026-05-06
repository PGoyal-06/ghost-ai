# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 12: Shape Panel (complete)

## Current Goal

- Replace the canvas placeholder with a Liveblocks-backed React Flow canvas — collaborative state, shared types, and basic canvas rendering.

## Completed

- 01-design-system: shadcn/ui initialized (Tailwind v4); Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea installed to `components/ui/`; `lib/utils.ts` cn() helper in place; `globals.css` defines full dark theme tokens (project CSS vars + shadcn semantic vars, no light mode).
- 02-editor: `components/editor/editor-navbar.tsx` — fixed-height navbar with `isSidebarOpen`/`onToggleSidebar` props, PanelLeftOpen/Close icon swap, dark bg with bottom border. `components/editor/project-sidebar.tsx` — fixed overlay, slides from left, Projects header + close button, My Projects / Shared tabs (empty placeholder states), full-width New Project button. Dialog pattern ready via existing `components/ui/dialog.tsx` + globals.css tokens.
- 03-auth: `proxy.ts` at project root using `clerkMiddleware` + `createRouteMatcher` — denylist strategy, all routes protected except `/sign-in(.*)` and `/sign-up(.*)`. `ClerkProvider` wraps root layout with `@clerk/ui` dark theme and CSS variable overrides (no hardcoded colors). `app/page.tsx` redirects authenticated users to `/editor`, unauthenticated to `/sign-in`. `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` — minimal two-panel layout (left: logo + tagline + feature list, hidden on small screens; right: Clerk form). `UserButton` added to `editor-navbar.tsx` right section.

- 04-project-dialogs: Build the `/editor` home screen and add project dialogs/sidebar actions.

- 05-prisma: `prisma/models/project.prisma` — `Project` and `ProjectCollaborator` models with indexes and cascade delete. `lib/prisma.ts` — cached singleton branching on Accelerate vs. direct PG adapter. Migration applied.

- 06-project-apis: `app/api/projects/route.ts` — `GET` (list owner's projects) and `POST` (create, default name "Untitled Project"). `app/api/projects/[projectId]/route.ts` — `PATCH` (rename, owner-only) and `DELETE` (owner-only). 401 for unauthenticated, 403 for non-owner mutations. Build passes.

- 07-wire-editor-home: `lib/projects.ts` — `getProjects()` fetches owned + shared projects server-side via `currentUser()` + Prisma. `hooks/use-project-actions.ts` — `create` (POST → router.push to new workspace), `rename` (PATCH → refresh), `remove` (DELETE → redirect if active, otherwise refresh). `app/editor/layout.tsx` — async server component, fetches projects and passes to `EditorShell`. Context refactored: removes mock data, accepts `ownedProjects`/`sharedProjects` props from layout. Dialogs wired to real API with room ID preview in create dialog. Sidebar navigates to `/editor/[id]` on project click. Build passes.
- 08-editor-workspace-shell: `lib/project-access.ts` — shared Clerk identity + project access helpers for owner/collaborator checks. `components/editor/access-denied.tsx` — centered denied state with lock icon and link back to `/editor`. `app/editor/[roomId]/page.tsx` — server component route that redirects unauthenticated users to `/sign-in`, renders `AccessDenied` for missing/unauthorized projects, and shows the protected workspace shell for authorized users. `components/editor/editor-shell.tsx`, `editor-navbar.tsx`, and `project-sidebar.tsx` — split home/workspace shells, add active project highlighting, project title in navbar, share placeholder action, AI sidebar toggle, and right-side AI placeholder panel. `app/editor/layout.tsx` now provides shared project/dialog context only, and `app/editor/page.tsx` renders the home shell explicitly. `components/editor/project-dialogs.tsx` refactored to avoid effect-driven local state resets under React 19 lint rules. Lint and build pass.
- 08-editor-workspace-shell follow-up: `components/editor/project-sidebar.tsx` — owned project rows refactored so navigation and inline rename/delete actions are sibling controls instead of nested buttons, removing the invalid HTML/hydration defect while preserving active-row styling and behavior. `.env` and `.env.local` now use `sslmode=verify-full` for `DATABASE_URL`, which removes the pg SSL warning without runtime URL rewriting. `context/current-issues.md` annotated with the resolved app issues and the remaining browser-extension-only hydration noise note. `npm run lint`, `npm run build`, and a direct Prisma init check via `npx tsx` pass.
- 09-share-dialog: `app/api/projects/[projectId]/collaborators/route.ts` — `GET` lists collaborators for owners/collaborators and enriches emails with Clerk display names and avatars; `POST` invites collaborators by normalized email and is owner-only. `app/api/projects/[projectId]/collaborators/[collaboratorId]/route.ts` — owner-only `DELETE` removes collaborators. `lib/project-collaborators.ts` centralizes collaborator email normalization and Clerk user enrichment. `components/editor/share-dialog.tsx` adds the workspace share modal with owner invite/remove controls, read-only collaborator mode, and copy-link feedback. `components/editor/editor-shell.tsx`, `editor-navbar.tsx`, and `app/editor/[roomId]/page.tsx` now wire the active project ID/ownership into the workspace shell so the share dialog opens from the navbar for both owners and collaborators. `npm run lint` and `npm run build` pass.
- 07-wire-editor-home follow-up: `hooks/use-project-actions.ts` now tracks local action error state (`error`) and clears/sets it per create/rename/remove request lifecycle while preserving success-side effects and existing throw behavior.
- 10-liveblocks-setup: `liveblocks.config.ts` — Presence typed with `cursor` (nullable x/y) and `isThinking` boolean; UserMeta typed with `id`, `name`, `avatar`, and `cursorColor`. `lib/liveblocks.ts` — lazy-initialized cached Liveblocks node client singleton (`getLiveblocks()`) with `getCursorColor()` helper that deterministically maps user IDs to a 10-color palette. `app/api/liveblocks-auth/route.ts` — POST route: requires Clerk auth, verifies project access via `getAccessibleProject()`, calls `getOrCreateRoom()` to lazily provision the Liveblocks room, then issues an access token with user name, avatar, and cursor color via `prepareSession()`. Returns 401/400/403 for auth/input/access failures. `@liveblocks/node` installed. Also fixed pre-existing implicit `any` type errors in `lib/projects.ts` by adding explicit Prisma result type casts. `npm run lint` and `npm run build` pass.
- 11-base-canvas: `types/canvas.ts` — shared canvas types with `NODE_COLORS` (8-pair palette), `NODE_SHAPES` (6 shapes), `CanvasNodeData` interface (`label`, `color`, `shape`), and typed `CanvasNode`/`CanvasEdge` aliases. `components/editor/canvas-wrapper.tsx` — client component that wires `LiveblocksProvider` (auth endpoint), `RoomProvider` (room ID, initial presence), `ClientSideSuspense` (loading spinner), and an `ErrorBoundary` (connection error card) around a `CollaborativeCanvas` inner component. Canvas uses `useLiveblocksFlow` with `suspense: true` and empty initial nodes/edges, renders `ReactFlow` with loose connection mode, `fitView`, `Cursors`, `Background`, and `MiniMap`. `app/editor/[roomId]/page.tsx` — replaces the static placeholder with `<CanvasWrapper roomId={project.id} />`. `npm run lint` and `npm run build` pass.
- 12-shape-panel: `components/editor/shape-panel.tsx` — floating pill-shaped toolbar with `lucide-react` icons for shapes (rectangle, diamond, circle, pill, cylinder, hexagon), draggable buttons emitting custom JSON payloads with shape name and default dimensions. `components/editor/canvas-wrapper.tsx` — wrapped `CollaborativeCanvas` in `<ReactFlowProvider>` to enable `useReactFlow()`, added `onDragOver` and `onDrop` to handle payload, calculate position via `screenToFlowPosition`, and create nodes via Liveblocks' `onNodesChange` with deterministically generated unique IDs. `components/editor/canvas-node.tsx` — basic custom node renderer using `data.color` for background and a bordered container with target/source handles. `npm run build` passes.

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
