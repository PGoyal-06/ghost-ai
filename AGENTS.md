<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Application Building Context

Read the following files in order before implementing or making any architectural decision:

1. `context/project-overview.md` — product definition, goals, features, and scope
2. `context/architecture-context.md` — system structure, boundaries, storage model, and invariants
3. `context/ui-context.md` — theme, colors, typography, canvas design, and component conventions
4. `context/code-standards.md` — implementation rules and conventions
5. `context/ai-workflow-rules.md` — development workflow, scoping rules, and delivery approach
6. `context/progress-tracker.md` — current phase, completed work, open questions, and next steps

Update `context/progress-tracker.md` after each meaningful implementation change.

If implementation changes the architecture, scope, or standards documented in the context files, update the relevant file before continuing.

<claude-mem-context>
# Memory Context

# [ghost-ai] recent context, 2026-05-09 4:42pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (21,420t read) | 975,641t work | 98% savings

### May 7, 2026
S22 Implement Feature 24 (AI Presence State) — shared AI activity indicators in the ghost-ai collaborative canvas editor (May 7, 11:48 AM)
S23 Fix AI_NoObjectGeneratedError in design agent by replacing experimental Output.object() fallback with tool-calling approach (May 7, 11:09 PM)
S25 Fix "Design planner produced no tool calls. finishReason=stop" runtime error in design agent (May 7, 11:20 PM)
S24 Fix new runtime error "Design planner produced no tool calls. finishReason=stop" after removing Output.object() fallback (May 7, 11:20 PM)
S26 Fix "Design planner produced no tool calls. finishReason=stop" — investigating ai SDK v6.0.175 capabilities (May 7, 11:30 PM)
S27 Fix "Design planner produced no tool calls. finishReason=stop" — switched to single-step toolChoice: "required" (May 7, 11:31 PM)
S28 Implement feature 25-sidebar-chat-feed: add real-time room chat to AI sidebar using a separate Liveblocks ai-chat feed (May 7, 11:33 PM)
### May 8, 2026
S29 Feature Spec 26: Wire up AI sidebar for real-time AI run lifecycle — submit prompts, track runs, show status, update chat (May 8, 11:22 AM)
S30 Spec 26 (AI sidebar: real-time run tracking via Trigger.dev + Liveblocks) — implementation + runtime crash fix + build verification (May 8, 11:34 AM)
284 11:37a 🔵 useRealtimeRun Crashes with Empty String accessToken — Not a Safe No-op
285 " 🔴 Fixed useRealtimeRun Empty Token Error via RunTracker Child Component Pattern
286 4:12p 🔵 Trigger.dev Already Configured in ghost-ai Project
S31 Add trigger.dev to ghost-ai project — discovery that it was already installed (May 8, 4:12 PM)
287 4:13p 🔵 ghost-ai Project Context: No trigger-setup Skill Available
288 " 🔵 Ghost AI Architecture: Background Task Runner Is Missing — Trigger.dev Is the Fix
289 " 🔵 Trigger-setup Skill Found in Project-local .agents Directory
290 " 🔵 Ghost AI Progress State: Feature 21 Complete, AI Workflow Features Next
291 " 🔵 Trigger.dev Is Already Partially Configured: SDK Installed, Config Present, Cloud Project Live
292 " 🔵 Ghost AI Trigger.dev Integration Scope: Two Tasks, Two API Routes, One Prisma Model
293 4:14p 🔵 @trigger.dev/sdk/v3 Import Path Is Deprecated in v4; trigger.config.ts Uses the Old Path
294 " 🔵 trigger.config.ts Missing prismaExtension Build Config Needed for Database-Accessing Tasks
295 4:15p 🔵 TRIGGER_SECRET_KEY Missing from .env.local — Required for tasks.trigger() in Route Handlers
296 " 🔵 Prisma Schema Has No Models Yet — TaskRun and All Models in Separate Files
297 " 🔵 Ghost AI Must Use prismaExtension({ mode: "modern" }) — Prisma 7 with prisma-client Provider
298 4:16p ✅ trigger.config.ts Updated: Modern Prisma Extension Added, Import Path Fixed
299 " 🟣 First Trigger.dev Task Created: trigger-healthcheck in src/trigger/healthcheck.ts
300 " 🟣 Trigger.dev Foundation Complete: Architecture Docs and Progress Tracker Updated
301 4:17p 🟣 Trigger.dev Foundation Passes Lint and Build — API Routes for Design and Token Already Exist
302 4:28p 🔵 Ghost AI Project Overview and Architecture Goals
303 " 🔵 Feature 22 Implementation Gap: Design Agent Backend Not Yet Built
304 " 🔵 Ghost AI Progress State: 21 Features Complete, Starting Feature 22
305 " 🔵 Trigger.dev SDK API Surface Confirmed for Feature 22 Implementation
306 4:29p 🔵 Trigger.dev Token Scoping API and Prisma Multi-File Schema Config Confirmed
307 " 🔵 tasks.trigger() Return Shape Confirmed: RunHandle with id Property
309 " ✅ Feature 22 Implementation Phase Begun
308 " 🔵 Feature 22 API Contract: Trigger Route Must Return Both runId and publicToken
310 9:05p 🔵 Ghost AI Project Overview and Architecture
311 " 🔵 Ghost AI Full Tech Stack and System Boundaries
312 " 🔵 Ghost AI UI Design System Tokens and Canvas Schema
313 " 🔵 Ghost AI Progress State: Feature 22 Complete, Feature 23 Next
314 " 🟣 Feature 23 Spec: Full AI Design Agent Logic
315 9:06p 🔵 Design Agent Implementation Gap: Features 24-26 Are Prerequisites to Feature 23
316 " 🔵 Liveblocks Server API Surface for Agent Integration
317 9:26p 🔵 Design Agent Logic Requires GOOGLE_GENERATIVE_AI_API_KEY Env Var
318 " 🔵 Ghost AI Project State: Feature 23 Complete, Next is Feature 24
319 " 🔵 Root Cause: Env Var Name Mismatch — GOOGLE_AI_API_KEY vs GOOGLE_GENERATIVE_AI_API_KEY
320 " 🔵 src/trigger/healthcheck.ts Missing Despite Progress Tracker Claiming It Was Added
321 " 🔵 @ai-sdk/google SDK Docs Confirm GOOGLE_GENERATIVE_AI_API_KEY as the Required Env Var
322 9:27p 🔴 Design Agent Fixed to Accept Both GOOGLE_AI_API_KEY and GOOGLE_GENERATIVE_AI_API_KEY
323 " ✅ Progress Tracker Updated with 23-design-agent-logic Follow-Up Entry
324 " 🔴 npm run build Passes After Design Agent API Key Fix
### May 9, 2026
325 4:28p 🔵 Design Agent Fails With "No Tool Calls" Error After planDesignActions
326 4:29p 🔵 Ghost AI Project Architecture and Full Feature Completion State Confirmed
327 " 🔵 Root Cause of Design Agent "No Tool Calls" Error: Missing maxSteps in generateText
328 " 🔵 AI SDK v6 Confirms Output.object() Is the Correct Fix for planDesignActions
329 " 🔵 Repro Script for Design Agent Bug Fails Outside Project Directory
330 " 🔵 Live Repro Proves Tool Execute IS Called — Bug Is Schema Validation Mismatch, Not maxSteps
331 4:31p 🔵 Output.object() Approach Verified Working; Actual planDesignActions Import Hangs
332 4:32p 🔵 Production discriminatedUnion Schema Being Tested Live Against Gemini with Full Prompt
333 4:33p 🔵 Root Cause of "No Tool Calls" Bug Definitively Confirmed: Gemini Returns actions:[true] With discriminatedUnion Schema

Access 976k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>