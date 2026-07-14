# LevelNext — The Leadership Intelligence Platform
## Project TODO

### Phase 1: Brand Design System & Foundation
- [x] Upload LevelNext logo to CDN and configure VITE_APP_LOGO
- [x] Apply brand design system: Executive Navy (#12345A), Chrome Yellow (#F2B705), Inter typography
- [x] Configure index.css with LevelNext CSS variables and global theme
- [x] Update client/index.html with Google Fonts (Inter) and correct title
- [x] Build persistent PlatformLayout with LevelNext sidebar (Home, My Edge, Guide, Insights, Diagnostics, Progress, Organisation, Settings)

### Phase 2: Database Schema
- [x] Extend schema with tenants table (multi-tenant)
- [x] Extend schema with tenant_users table (roles: owner, admin, member)
- [x] Extend schema with leadership_graph table
- [x] Extend schema with assessment_sessions table
- [x] Extend schema with unified reports table (moduleType: ECI | LII | GCC)
- [x] Extend schema with daily_missions table
- [x] Run migration and apply SQL

### Phase 3: Auth & Multi-Tenant Onboarding
- [x] Build Onboarding page (create or join organisation)
- [x] Build tenant creation flow
- [x] Build tenant join flow (invite code)
- [x] Wire auth gate: redirect unauthenticated users to login
- [x] Wire onboarding gate: redirect users without tenant to /onboard

### Phase 4: Daily Home Screen
- [x] Build Home page with personalised greeting
- [x] Build Today's Focus card (driven by Leadership Graph)
- [x] Build Today's Mission card
- [x] Build Edge summary widget (cross-diagnostic)
- [x] Build Guide recommendation panel

### Phase 5: Unified Assessment Engine
- [x] Copy eciData.ts from eci-diagnostic repo to shared/modules/
- [x] Copy lii-data.ts from leadership-influence-intelligence repo to shared/modules/
- [x] Copy gccData.ts from gcc-readiness repo to shared/modules/
- [x] Build unified assessment router (server) with moduleType routing
- [x] Build dynamic Assessment page (client) routing by moduleType
- [x] Wire /diagnostics/eci, /diagnostics/lii, /diagnostics/gcc routes
- [x] Build Diagnostics hub page listing all three modules
- [x] Strip all payment gate logic (no isPaid, no funnelMode, no Pricing page)

### Phase 6: Leadership Graph Engine
- [x] Build server-side Leadership Graph aggregator (fires on report completion)
- [x] Build leadershipGraph tRPC procedures (get, update)
- [x] Ensure Leadership Graph is cumulative and cross-diagnostic

### Phase 7: Guide AI Coach
- [x] Build Guide chat interface
- [x] Wire Leadership Graph context injection into Guide LLM prompt
- [x] Build Guide page at /guide
- [x] Implement suggested prompts and daily coaching flow

### Phase 8: Report Pages (no payment gate)
- [x] Build unified Report page (renders by moduleType)
- [x] Build shareable report by slug (/report/:slug)
- [x] Wire PDF generation (server-side)
- [x] Wire email delivery (Brevo SMTP)

### Phase 9: My Edge Dashboard
- [x] Build My Edge page at /my-edge
- [x] Build module cards with Edge scores
- [x] Build Edge profile waiting state (pre-diagnostic)
- [x] Build Edge evolution timeline chart (post first diagnostic)

### Phase 10: Admin & Organisation Dashboard
- [x] Build Organisation page at /organisation
- [x] Build tenant Edge heatmap by module
- [x] Build bench strength indicators
- [x] Build diagnostic completion tracking
- [x] Gate admin features to owner/admin roles only

### Phase 11: Settings & Progress
- [x] Build Settings page at /settings
- [x] Build Progress page at /progress (with bar chart, radar chart, archetype summary)
- [x] Build Insights page at /insights (with dimension scores, archetype, report links)

### Phase 12: Quality & Delivery
- [x] Verify all brand language: Edge not score, Insight not assessment, Mission not task, Guide not bot
- [x] Verify no payment gates anywhere in the codebase
- [x] Write vitest tests for core procedures (auth.logout passes)
- [x] Final screenshot review of all pages
- [x] Save checkpoint and deliver to Bert

### Phase 13: ECI Full Integration
- [x] Upgrade Assessment page with ECI pillar groupings and pillar progress indicator
- [x] Build rich ECI completion screen with pillar scores, archetype card (strengths/risks), zone description
- [x] Build full ECI Report page with pillar breakdown, dimension scores, archetype narrative
- [x] Fix Assessment page — remove stale LOGO_URL reference, replace with wordmark

### Phase 14: Guide Daily Coaching Interface
- [x] Redesign Guide page with daily rhythm panel (Today's Focus, Today's Mission)
- [x] Add ECI-context-aware suggested prompts after diagnostic completion
- [x] Add "Daily Session" framing — Guide opens with a coaching question, not a blank screen
- [x] Ensure Guide never uses words: AI Coach, bot, chatbot, score, assessment
- [x] Wire Guide opening message to Leadership Graph (personalised to ECI archetype if available)

### Phase 15: LII Integration, ECI Enhancement, Guide Features, Skill Packaging

- [x] Integrate LII diagnostic — full scoring, archetypes, zone, rich completion screen
- [x] Enhance ECI results/completion page — pillar breakdown, archetype card, zone narrative, report actions
- [x] Add Guide features — session history panel, mission tracking, post-diagnostic coaching prompt
- [x] Package diagnostic integration process as a reusable Manus skill

### Phase 16: PDF Spinner, Unified Dashboard, Guide Follow-ups
- [x] PDF export: multi-step loading spinner with status text (Generating narrative → Building PDF → Uploading → Ready)
- [x] Unified user dashboard (My Edge): archetype cards per module, completion progress ring, composite Edge, next recommended diagnostic
- [x] Guide: generate context-aware follow-up questions after diagnostic completion, surfaced as tappable prompts
- [x] Guide: fetch latest report and inject specific dimension scores into follow-up prompt suggestions

### Phase 17: Mock Data, PDF Update, Guide Favorites
- [x] Seed mock ECI diagnostic report for Bert with realistic dimension scores and archetype
- [x] Update Leadership Graph for Bert with ECI module data
- [x] Update PDF export feature (Node-compatible, client-side jspdf + html2canvas, branded)
- [x] Add Save to Favorites button to Guide chat messages (bookmark icon on hover)
- [x] Build favorites storage (localStorage, max 20 saved, persists across sessions)
- [x] Build Saved Insights panel in Guide home view (shows up to 3 with delete, count badge)

### Phase 18: Mock Data Population & Composite Edge Ring
- [x] Seed mock LII diagnostic report for Bert (Strategic Influencer, Edge 82)
- [x] Update Leadership Graph with LII module data (completedModules: ECI + LII)
- [x] Update composite Edge ring to reflect two completed modules (compositeEdge: 80)
- [x] Seed mock GCC diagnostic report for Bert (Strategic Partner, Edge 76)
- [x] Update Leadership Graph with all three modules (compositeEdge: 79)
- [x] Fix archetype labels to show human-readable names across all pages (Insights, Progress, Home, MyEdge)
- [x] Add modules property to LeadershipGraph TypeScript type
- [x] Add staleTime: 0 to leadershipGraph.get queries for fresh data on mount

### Phase 19: Onboarding Page Redesign
- [x] Redesign Onboarding page with split-panel layout (navy left brand panel + ivory right form panel)
- [x] Left panel: LevelNext logo, value proposition headline, three platform pillars with checkmarks, Meta Results footer
- [x] Right panel Choose mode: white cards with icons, arrow indicators, privacy note
- [x] Right panel Create mode: Organisation Name (required), Industry (optional), Team Size selector grid, CTA button
- [x] Right panel Join mode: invite code input, "What happens next" info box, CTA button
- [x] Back navigation on Create and Join forms
- [x] Mobile-responsive (left panel hidden on small screens, mobile logo shown)

### Phase 20: My Edge ↔ Growth Profile Integration
- [x] Add Practice Activity section to My Edge (last 3 sessions, current commitment, practice score trend)
- [x] Update Growth Profile 30-day plan to reference lowest diagnostic dimension and frame goals around closing that gap
- [x] Verify Coach home diagnostic recommendations are wired to leadershipGraph data

### Phase 21: Mobile-Responsive Redesign & PWA

- [x] PWA manifest.json with LevelNext icon, theme colour, standalone display
- [x] Service worker with offline caching for shell and static assets
- [x] Mobile install banner component (iOS/Android smart prompt)
- [x] PlatformLayout: bottom tab bar on mobile (Home, My Edge, Coach, Insights, More)
- [x] PlatformLayout: hamburger slide-in drawer for full nav on mobile
- [x] Home page: mobile-first layout (stacked cards, full-width Edge ring)
- [x] My Edge page: mobile-optimised archetype cards and insight history
- [x] Diagnostics page: full-screen step flow on mobile
- [x] AI Practice Coach: mobile chat UI, full-screen role play
- [x] Growth Profile: mobile-optimised stats and 30-day plan
- [x] Insights, Progress, Guide, Organisation, Settings: mobile layout audit and fixes
- [x] Touch-friendly tap targets (min 44px) across all interactive elements
- [x] Viewport meta tag and no horizontal scroll on 375px screens

### Phase 22: Code Review & Dead Code Cleanup
- [x] Remove unused Users icon import from DashboardLayout.tsx
- [x] Remove unused title destructure from PlatformLayout function signature
- [x] Remove unused MODULE_COLORS constant from Home.tsx
- [x] Remove unused reportsLoading from Organisation.tsx
- [x] Remove unused onGrowthProfile prop from PracticeCoach HomeScreen
- [x] Remove unused visibleChips variable from PracticeCoach HomeScreen
- [x] Prefix unused onBack with _onBack in RolePlayScreen
- [x] Remove unused IVORY constant from Report.tsx
- [x] Delete unreferenced ComponentShowcase.tsx dev scaffold page
- [x] Remove LOCAL_HOSTS, isIpAddress, and commented-out dead block from cookies.ts
- [x] Remove unused protectedProcedure import from routers.ts
- [x] Remove unused users and GCC_MODULE_MAP imports from assessment.ts
- [x] Remove unused practiceAttempts import from leadershipCoach.ts
- [x] Remove unused ctx from detectBlindSpots mutation in leadershipCoach.ts
- [x] Remove unused and import from report.ts
- [x] Remove unused and import from tenant.ts
- [x] TypeScript check passes with zero errors
- [x] All vitest tests pass

### Phase 23: Typing Indicator, PDF Export Button, Skill Packaging
- [x] Add animated typing indicator (three bouncing dots) to RolePlayScreen while avatar is responding
- [x] Show typing indicator immediately on user message send, hide on avatar response received
- [x] Verify/improve PDF export button visibility and placement on Report page
- [x] Package code review process as a reusable Manus skill (skills/levelnext-code-review/SKILL.md)

### Phase 24: Progressive Diagnostic Unlock System
- [x] Schema: diagnostic_unlock_progress table and guide_sessions table added and migrated
- [x] Server: unlock eligibility engine — time gate (21 days), mission gate (5 module-specific), guide session gate (3), commitment gate (growth plan set)
- [x] Server: tRPC unlock.getStatus — returns per-module lock state, countdown days, all gate progress
- [x] Server: tRPC unlock.getNarrativeUnlock — LLM-generated Guide narrative when all gates pass
- [x] Server: Guide router records guide_sessions row (once per calendar day) on sendMessage
- [x] Client: Diagnostics hub — locked/not_started/unlocked/completed card states with visual distinction
- [x] Client: Diagnostics hub — 21-day countdown on locked cards
- [x] Client: Diagnostics hub — expandable gate progress panel (4 GateBars) on locked cards
- [x] Client: Diagnostics hub — NarrativeBanner (Guide says you are ready) shown once when all gates pass
- [x] Client: Diagnostics hub — "Why progressive unlocking?" philosophy note at bottom

### Phase 25: Diagnostics UX Improvements
- [x] Diagnostics hub: "View as new user" toggle that simulates a fresh account (ECI unlocked, LII/GCC locked with gate progress at zero)
- [x] PlatformLayout nav: notification badge on Guide nav item (shows count of unread Guide messages or pending unlock notifications)
- [x] Diagnostics hub NarrativeBanner: "Discuss with Guide" button that navigates to /guide with the unlock context pre-loaded

### Phase 26: Leadership Time Intelligence (TII) Diagnostic
- [x] shared/modules/tiiData.ts — 5 dimensions, 30 questions (6 per dimension), scoring engine, 5 zones, 6 archetypes
- [x] drizzle/schema.ts — add TII to all enum columns and LeadershipGraph type
- [x] Run pnpm drizzle-kit generate and apply migration SQL
- [x] server/routers/assessment.ts — import TII scorer, add TII to moduleType z.enum, add scoreTii branch
- [x] server/routers/pdfReport.ts — add TII to MODULE_META and DIMENSION_LABELS
- [x] server/routers/leadershipGraph.ts — add TII to moduleType union
- [x] server/routers/unlock.ts — update UNLOCK_SEQUENCE to ECI → TII → LII → GCC
- [x] client/src/pages/Diagnostics.tsx — add TII module card, preview mode, z.enum casts
- [x] client/src/pages/Report.tsx — add TII to DIMENSION_LABELS and MODULE_LABELS
- [x] client/src/pages/Home.tsx — add TII to MODULE_LABELS and module arrays
- [x] client/src/pages/MyEdge.tsx — add TII module card
- [x] client/src/pages/Progress.tsx — add TII to MODULE_LABELS, MODULE_COLORS, bar data
- [x] client/src/pages/Insights.tsx — add TII to MODULE_LABELS and MODULE_DESCRIPTIONS
- [x] TypeScript check + vitest + screenshot + checkpoint

### Phase 27: Leadership Derailment Intelligence (LDI) Diagnostic
- [x] shared/modules/ldiData.ts — 10 dimensions, 30 questions with reverse-score flags, 8 archetypes, 5 risk bands, scoreLdi() function
- [x] drizzle/schema.ts — add LDI to all 6 enum columns and LeadershipGraph type
- [x] Schema migration applied via webdev_execute_sql
- [x] server/routers/assessment.ts — import scoreLdi, LDI_QUESTIONS, LDI_DIMENSIONS; add LDI to z.enum calls and getQuestions/submit branches
- [x] server/routers/pdfReport.ts — add LDI to MODULE_META and DIMENSION_LABELS (10 dimensions)
- [x] server/routers/leadershipGraph.ts — add LDI to moduleType union
- [x] server/routers/unlock.ts — add LDI to MODULE_SEQUENCE, UNLOCK_MAP (GCC→LDI, LDI→null), z.enum calls, narrative labels
- [x] client/src/pages/Diagnostics.tsx — add LDI module card, preview mode entry, z.enum casts
- [x] client/src/pages/Report.tsx — add LDI MODULE_LABELS, DIMENSION_LABELS (10 dims), topDerailmentRisks and topStabilizers sections
- [x] client/src/pages/Assessment.tsx — add LDI to MODULE_META type casts
- [x] client/src/pages/Home.tsx — add LDI to MODULE_LABELS and module arrays
- [x] client/src/pages/MyEdge.tsx — add LDI module card with ⚠️ icon
- [x] client/src/pages/Progress.tsx — add LDI to MODULE_LABELS, MODULE_COLORS, bar data
- [x] client/src/pages/Insights.tsx — add LDI to MODULE_LABELS and MODULE_DESCRIPTIONS
- [x] TypeScript check + vitest + screenshot + checkpoint

### Phase 28 — ECI PDF Import (Self-Serve)
- [x] DB schema: add source_type, source_file_url, source_uploaded_at, extraction_confidence, original_report_date columns to assessments table
- [x] Schema migration applied via webdev_execute_sql
- [x] server/routers/eciImport.ts — uploadEciPdf procedure: accept PDF upload, extract text via pdf-parse, parse scores deterministically, LLM normalise ambiguous fields, return structured preview
- [x] server/routers/eciImport.ts — confirmEciImport procedure: persist extracted data as completed ECI assessment with pdf_import provenance
- [x] client/src/pages/ImportEci.tsx — full import flow UI: upload → processing → review/confirm → success
- [x] Diagnostics.tsx — add Import Existing ECI Report card (only shown when ECI not yet completed)
- [x] App.tsx — add /import-eci route
- [x] TypeScript check + vitest + screenshot + checkpoint

### Phase 29 — ChatGPT Conversation Import (Option A: process-and-delete)
- [x] conversation_intelligence table added to drizzle/schema.ts
- [x] Migration generated and applied
- [x] server/routers/chatgptImport.ts — parseChatgptZip procedure (upload ZIP → parse JSON → filter leadership convos → LLM synthesis → delete raw file → return structured themes)
- [x] server/routers/chatgptImport.ts — confirmChatgptImport procedure (persist approved themes to conversation_intelligence table)
- [x] chatgptImportRouter registered in server/routers.ts
- [x] client/src/pages/ImportChatgpt.tsx — 4-step flow: privacy modal → upload → processing → review/confirm → success
- [x] Route /import-chatgpt added to App.tsx
- [x] Entry point added to Diagnostics page (Import AI Conversations card/button)
- [x] Guide context builder updated to include conversation_intelligence themes
- [x] TypeScript check + vitest + screenshot + checkpoint

### Phase 30 — STI (Strategic Thinking Intelligence) Module + Option C Progression
- [x] shared/modules/stiData.ts — 10 dimensions, 30 questions, 4 bands, scoreSti()
- [x] drizzle/schema.ts — add STI to all 6 enum columns
- [x] Schema migration applied via webdev_execute_sql
- [x] server/routers/assessment.ts — add STI to getQuestions/submit/scoring branches
- [x] server/routers/pdfReport.ts — add STI to MODULE_META and DIMENSION_LABELS
- [x] server/routers/leadershipGraph.ts — add STI to moduleType union
- [x] server/routers/unlock.ts — add STI to MODULE_SEQUENCE, UNLOCK_MAP, narrative labels
- [x] client/src/pages/Diagnostics.tsx — Option C progression model (guided path + informed override)
- [x] client/src/pages/Assessment.tsx — add STI to MODULE_META type casts and completion screen
- [x] client/src/pages/Report.tsx — add STI DIMENSION_LABELS and Strategic Leadership Risks section
- [x] client/src/pages/Home.tsx — add STI to module arrays
- [x] client/src/pages/MyEdge.tsx — add STI module card
- [x] client/src/pages/Progress.tsx — add STI to MODULE_LABELS, MODULE_COLORS, barData
- [x] client/src/pages/Insights.tsx — add STI to MODULE_LABELS, MODULE_DESCRIPTIONS, tooltips
- [x] TypeScript check + vitest + screenshot + checkpoint

### Career Intelligence — Product Layer (Phase 1)
- [x] Extend DB schema: products, product_modules, user_product_enrollments tables
- [x] Widen moduleType enums across 6 tables to include CPI, CRS, CMK, CST, CAO, AIR
- [x] Run migration (0018_big_archangel.sql) and apply to DB
- [x] Seed products table: Leadership Intelligence + Career Intelligence with coach prompts
- [x] Seed product_modules: LI sequence (ECI→TII→LII→GCC→LDI→STI) + CI sequence (CPI→CRS→CMK→CST→CAO→AIR)
- [x] Build productsRouter: getAll, getModules, getEnrolledProducts, getActiveProduct, switchProduct, admin procedures
- [x] Make unlock router product-aware: reads module sequence from product_modules table
- [x] Wire productsRouter into routers.ts

### Career Intelligence — Phase 2 (next)
- [x] Build careerData.ts: 6 CI diagnostics with questions, dimensions, scoring bands, archetypes
- [x] Extend assessment router to handle CI module codes
- [x] Build CI report scoring functions

### Career Intelligence — Phase 3 (next)
- [x] Make Guide system prompt product-aware (reads coachPrompt from active product)
- [x] Make Practice Coach product-aware (reads practiceCoachPrompt from active product)

### Career Intelligence — Phase 4 (next)
- [x] Product switcher UI in sidebar
- [x] Career Intelligence Home dashboard
- [x] Career Intelligence navigation (product-aware labels)
- [x] Career Intelligence onboarding (3-question intake)

### Career Intelligence — Phase 5 (next)
- [x] Admin Product Enrollments page at /admin/enrollments

### Career Intelligence — Phase 6 (next)
- [x] Career Intelligence landing page at /career
- [x] Update LevelNext home to present both products

## Career Intelligence — Phase 2 (Diagnostics Data Layer)
- [x] careerData.ts: 6 CI modules (CPI, CRS, CMK, CST, CAO, AIR) with questions, dimensions, scoring, zones, archetypes
- [x] assessment router: extended getQuestions, startSession, submit to handle CI module codes
- [x] pdfReport router: CI module metadata and dimension labels added
- [x] TypeScript: zero errors across full project

## Career Intelligence — Phase 3 (Coach Identity)
- [x] guide.ts: Career Strategist system prompt added (CAREER_STRATEGIST_PROMPT)
- [x] guide.ts: sendMessage detects active product, switches to Career Strategist for CI users
- [x] practice.ts: CI_COACH_SYSTEM_PROMPT and CI_SCENARIO_GENERATOR_PROMPT added
- [x] practice.ts: sendCoachMessage and generateScenario detect active product, use CI prompts for CI users
- [x] CI scenario types: 15 career-specific conversation types (Salary Negotiation, Promotion, Interview, etc.)
- [x] TypeScript: zero errors across full project

## Career Intelligence — Phase 4 (UI)
- [x] CareerHome dashboard page at /career
- [x] ProductSwitcher component in sidebar (only visible when enrolled in 2+ products)
- [x] CI_NAV_ITEMS — product-aware navigation in PlatformLayout
- [x] Route /career wired in App.tsx
- [x] Zero TypeScript errors

## Career Intelligence — Phase 5 (Admin Enrollment)
- [x] AdminProductEnrollments page at /admin/enrollments
- [x] Enroll / unenroll users per product with one click
- [x] Stats cards (total users, LI count, CI count, both)
- [x] Search by name/email + filter by product
- [x] Sortable columns (name, email, joined, enrollments)
- [x] CSV export
- [x] Product Enrollments nav item in desktop sidebar and mobile drawer
- [x] Route wired in App.tsx
- [x] Zero TypeScript errors

## Career Intelligence — Phase 6 (Landing Page)
- [x] CareerLanding page at /career-intelligence
- [x] Hero with Career Edge Score visual mockup and indigo/violet CI identity
- [x] "For Who" section with 6 audience profiles
- [x] 6 CI diagnostics section (CPI, CRS, CMK, CST, CAO, AIR) with cards
- [x] "What makes it different" section (4 differentiators)
- [x] 5-stage Career Intelligence Journey section
- [x] Cross-link to Leadership Intelligence landing
- [x] Final CTA with Apply for Early Access and Book a Discovery Call
- [x] Footer with Meta Results copyright
- [x] "Career Intelligence" nav link added to main Landing page header
- [x] Route wired in App.tsx
- [x] Zero TypeScript errors

## CPI Diagnostic — Full Build (Phase 1-5)
- [x] Upgraded CPI data: 6 dimensions, 30 behaviour-based questions, 7 archetypes, 5 score bands
- [x] CPI LLM report engine: generateAnalysis procedure with 8 structured JSON sections
- [x] CPI Report UI page at /cpi-report/:slug with all 8 sections
- [x] AI Coach configuration: CPI llmAnalysis (coachFocusAreas, blindSpots, coachChallengeQuestion) feeds into Career Strategist
- [x] CPI route wired in App.tsx, Assessment.tsx routes CPI completions to /cpi-report/:slug

## Assessment Intro Screen — Premium Restyling
- [x] Add Playfair Display Google Font (700/800 weight, italic) to client/index.html
- [x] Add .font-playfair and .text-gradient-gold CSS utilities to index.css
- [x] Restyle Assessment.tsx intro screen: Playfair Display hero headline, two-line treatment (bold ivory + italic gold gradient last word), gold-bordered badge pill, bullet-list "What to expect" box, rounded-full CTA button
- [x] Add CI module entries (CPI, CRS, CMK, CST, CAO, AIR) to MODULE_META with labels and taglines
- [x] Zero TypeScript errors

## Magic Link Email Authentication
- [x] DB schema: magic_link_tokens table (id, token, email, userId, expiresAt, usedAt, inviteToken, createdAt)
- [x] Run migration and apply SQL
- [x] Server: emailAuth router — requestMagicLink (generate token, send email), verifyMagicLink (validate token, create session, return cookie)
- [x] Server: register /api/auth/magic-link/verify GET route in Express (sets cookie, redirects to app)
- [x] Client: /login page — email input form, "check your inbox" state, handles ?token= param for auto-verify
- [x] Client: /login?invite=TOKEN — auto-fills email from invite record, shows personalised message
- [x] Server: auto-accept platform invite on magic link first login if inviteToken present
- [x] Landing page: update Sign In button to go to /login (magic link) instead of Manus OAuth directly; keep Manus OAuth as secondary option
- [x] PlatformLayout: update unauthenticated redirect to /login
- [x] useAuth: update getLoginUrl fallback to /login
- [x] TypeScript check: zero errors
- [x] Configure SMTP secrets (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM) — Brevo verified
- [x] Save checkpoint

## Invite System Improvements (Jul 14)
- [x] Personalise invite email subject line with client first name (e.g. "Priya, your LevelNext access is ready")
- [x] Add Copy Link button next to Resend icon on each invite row
- [x] Bulk invite via CSV upload — server bulkInvite procedure + UI dialog with file picker, preview table, send all
- [x] TypeScript check: zero errors
- [x] Save checkpoint

## Phase 31 — CI Diagnostics Fix, NII Unlock, NII PDF, Sample PDF Links (Jul 15)
- [x] Diagnostics.tsx: make page product-aware — CI users see CPI/CRS/CMK/CST/CAO/AIR with no gate (coach-guided selection)
- [x] unlock.ts: add NII to FALLBACK_MODULE_SEQUENCE and DB product_modules for leadership_intelligence (after STI)
- [x] NiiReport.tsx: add PDF export button (same pattern as Report.tsx — jsPDF client-side)
- [x] Report.tsx + CpiReport.tsx + NiiReport.tsx: wire sample PDF CDN links as "View Sample Report" CTAs
