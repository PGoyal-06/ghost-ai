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

# [ghost-ai] recent context, 2026-05-06 1:35pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (17,699t read) | 635,459t work | 97% savings

### May 3, 2026
S4 Implement Feature 01: Design System — shadcn/ui setup, UI primitives, cn() utility, and dark theme CSS tokens (May 3, 7:31 PM)
S5 Push ghost-ai project to GitHub after completing Feature 01 design system implementation (May 3, 8:06 PM)
S7 Implement Feature 02 Editor Chrome: create editor navbar and project sidebar base components for Ghost AI (May 3, 9:09 PM)
S6 Implement Feature 02: Editor Chrome — create editor navbar and project sidebar base components for Ghost AI (May 3, 10:35 PM)
S11 Update sign-in/sign-up UI to match screenshot — 50/50 layout with colored left panel and correct Geist fonts per UI guidelines (May 3, 10:36 PM)
86 11:01p 🔵 @clerk/ui Exports a ui Object That Must Be Passed to ClerkProvider's ui Prop
87 " 🔵 Clerk v7 Appearance Type Has theme Property for Prebuilt Themes
90 " 🟣 Clerk Auth Feature Implemented: proxy.ts, ClerkProvider, Sign-in/Sign-up Pages, Landing Page
91 11:04p ✅ .env.local Clerk Redirect Vars Switched to AFTER_SIGN_IN/UP_URL from FALLBACK_REDIRECT_URL
92 11:05p ✅ proxy.ts Route Protection Strategy Changed to Denylist (Protect All Except Public Routes)
93 " 🟣 app/layout.tsx Finalized: ClerkProvider Outside html Tag with Ghost AI Design Token Variables
94 " ✅ Landing Page Simplified to Pure Redirect — No Static Landing Page Content
### May 5, 2026
119 12:23p 🔵 Ghost AI Project Architecture and Standards Established
120 12:24p 🔵 Ghost AI Pre-Auth State: Clerk Installed But Not Integrated
121 " 🔵 Next.js 16 Renamed middleware.ts to proxy.ts
122 " 🔵 Clerk Integration Pattern for Next.js 16 with Dark Theme
123 " 🔵 Clerk UI Integration: ui Object + Missing Redirect Env Vars
124 " 🔵 Clerk Appearance Variables Enable Dark Theme Color Customization
125 " 🔵 globals.css Fully Configured with Dark Token System and shadcn Mapping
126 12:25p 🔵 Clerk auth().protect() Available for RSC Route Protection
127 " ✅ Added Clerk Redirect URL Env Vars to .env.local
128 12:26p 🟣 Clerk Route Protection Implemented in proxy.ts
129 " 🟣 ClerkProvider Added to Root Layout with Dark Theme Variables
130 12:27p 🟣 Root Route Redirects Based on Auth State
131 " 🟣 Sign-In and Sign-Up Pages Created with Split-Panel Layout
132 " 🟣 UserButton Import Added to EditorNavbar
134 " ✅ Feature 03 Auth Marked Complete in Progress Tracker
135 " 🟣 Auth Feature Passes Production Build — All Routes Verified
133 " 🟣 UserButton Rendered in EditorNavbar Right Slot
S12 Update sign-in/sign-up UI to match screenshot — 50/50 split with colored left panel and correct Geist fonts; both pages redesigned and progress tracker updated (May 5, 12:28 PM)
S9 Implement Ghost AI auth feature (03-auth.md) using Clerk — proxy.ts, ClerkProvider, sign-in/sign-up pages, route protection, and UserButton in editor navbar (May 5, 12:28 PM)
S10 Update sign-in/sign-up UI to match a screenshot — 50/50 split layout with colored left panel and correct Geist fonts per UI guidelines (May 5, 12:28 PM)
136 12:45p ✅ Sign-In Page Redesigned with Colored Left Panel and Layered Background
137 " ✅ Sign-Up Page Updated to Match Sign-In Layout with Colored Left Panel
138 12:46p ✅ Sign-In/Sign-Up UI Redesign Verified by Clean Production Build
S13 Implement backend project API routes (Feature 06) as specified in context/feature-specs/06-project-apis.md and update progress tracker (May 5, 12:46 PM)
### May 6, 2026
139 11:21a 🔵 ghost-ai Project Structure and API Implementation Spec Discovered
140 " 🔵 Prisma Schema and Migration Already Complete for ghost-ai
141 11:22a 🔵 Clerk Auth Pattern and Next.js RouteContext Type Helper Confirmed
142 " 🔵 TypeScript Path Alias: @/* Maps to Project Root
143 " 🟣 Project List and Create API Routes Implemented
144 " 🟣 Project Rename and Delete API Routes Implemented with Owner Enforcement
145 " 🟣 Project API Routes Pass Production Build — Feature Spec 06 Complete
146 11:23a ✅ Progress Tracker Updated to Feature 06: Project APIs
147 " ✅ Progress Tracker Marks Features 05 and 06 Complete
148 11:25a 🔵 Editor Home Pre-Wire State: Mock APIs and Client-Only Architecture
149 " 🔵 Project API Routes Already Fully Implemented
150 11:26a 🔵 Project Model Has No Slug Field — roomId Must Equal Project UUID
151 " 🟣 Feature 07: Wire Editor Home to Real Project Data
S14 Feature 07: Wire Editor Home — connect editor sidebar and dialogs to real project data and API (May 6, 11:35 AM)
152 1:16p 🔵 Ghost AI Project Overview — Real-Time Collaborative System Design Workspace
153 1:17p 🔵 Ghost AI Feature Progress: Features 01–07 Complete, Feature 08 Starting
154 " 🔵 Ghost AI Editor Shell Architecture — Existing Component Contracts Before Feature 08
155 " 🔵 Feature 08 Prerequisites Confirmed Missing — access-denied, project-access, and roomId Route All Absent
156 " 🔵 Ghost AI Dependency Stack — Next.js 16, Clerk 7, Prisma 7, React 19, Tailwind 4
157 " 🔵 Next.js 16 Dynamic Route Params Are Promises — Must Be Awaited in Page Components
158 " 🔵 Button Component Uses @base-ui/react Primitive, Not Standard Radix/shadcn
159 1:18p 🔄 ProjectDialogs Component Decomposition in ghost-ai Editor
160 1:22p 🟣 Protected Workspace Route and Editor Shell AI Panel
161 " 🔴 ESLint react-hooks/set-state-in-effect Violation Fixed in ProjectDialogs

Access 635k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>