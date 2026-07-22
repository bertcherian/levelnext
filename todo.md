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

## Phase 32 — Shared CI Report Page (Jul 15)
- [x] Build server/routers/ciReport.ts — shared router for all 6 CI modules
- [x] Build client/src/pages/CiReport.tsx — shared report page with module-aware content, jsPDF export, sample PDF CTAs
- [x] Register /ci-report/:moduleCode/:slug route in App.tsx
- [x] Register ciReport router in server/routers.ts
- [x] Update Diagnostics.tsx CI module cards to link to /ci-report/:moduleCode/:slug
- [x] CpiReport.tsx kept as-is for backwards compat; Assessment.tsx now routes all CI modules to /ci-report/:moduleCode/:slug
- [x] Save checkpoint and publish

## Phase 34 — Shared LI Report Page (Jul 15)
- [x] Build server/routers/liReport.ts — shared router for all 7 LI modules (ECI, TII, LII, GCC, LDI, STI, NII)
- [x] Build client/src/pages/LiReport.tsx — shared report page matching CiReport.tsx design
- [x] Register /li-report/:moduleCode/:slug route in App.tsx
- [x] Register liReport router in server/routers.ts
- [x] Update Assessment.tsx to route all LI modules to /li-report/:moduleCode/:slug
- [x] NII sample PDF not yet generated (pending); LiReport.tsx hides sample CTA for placeholder URLs
- [x] Save checkpoint

## Phase 35 — NII & GCC Sample PDFs (Jul 15)
- [x] Write gen_nii_gcc_reports.py with full NII and GCC sample report configs
- [x] Generate NII sample PDF (721 KB) at /home/ubuntu/sample_reports/nii_sample_report.pdf
- [x] Generate GCC sample PDF (722 KB) at /home/ubuntu/sample_reports/gcc_sample_report.pdf
- [x] Upload both to CDN: /manus-storage/nii_sample_report_2a0eed48.pdf and /manus-storage/gcc_sample_report_4fe3df81.pdf
- [x] Update LiReport.tsx SAMPLE_PDF_URLS for NII and GCC with real CDN paths
- [x] TypeScript clean, dev server running
- [x] Save checkpoint

## Phase 36 — LI Report Test, Landing Lead Magnet, CI Progress Page (Jul 15)
- [x] Verify LiReport.tsx router procedure and data flow are correct end-to-end (getReport + getAnalysis + generateAnalysis all confirmed)
- [x] Add sample PDF download lead magnet section with email capture to Landing.tsx (ECI/LII/STI selector, name + email form, auto-download on submit)
- [x] Build lead_captures DB table + migration applied
- [x] Build server/routers/leads.ts with captureEmail (public) and listLeads (admin) procedures
- [x] Register leadsRouter in server/routers.ts
- [x] Build client/src/pages/CareerProgress.tsx — CI progress summary page with composite score banner, journey stage grouping, module cards, coach guidance note
- [x] Register /career/progress route in App.tsx
- [x] Update CI_NAV_ITEMS Progress link to /career/progress in PlatformLayout.tsx
- [x] TypeScript clean (zero errors)
- [x] Save checkpoint

## Phase 37 — Infinity Logo Loading Animation (Jul 15)
- [x] Build InfinityLoader component with CSS animation (draw-on stroke, pulse glow, fade-in/out)
- [x] Wire into LiReport.tsx loading state (replace Loader2 spinner)
- [x] Wire into CiReport.tsx loading state (replace Loader2 spinner)
- [x] Save checkpoint

## Phase 38 — Leader Playbook Phase 1: DB + Server Router (Jul 15)
- [x] Add playbook_sessions table to drizzle/schema.ts
- [x] Add playbook_reflections table to drizzle/schema.ts
- [x] Add playbook_patterns table to drizzle/schema.ts
- [x] Generate migration SQL (0022_supreme_patriot.sql) and apply via webdev_execute_sql
- [x] Build server/routers/playbookRouter.ts with classify procedure (LLM classification engine)
- [x] Build generate procedure (13-section LLM playbook generator with personalisation from Leadership Graph)
- [x] Build getSession, listSessions, markDone, saveChecklist, saveScript, saveReflection, getPatterns procedures
- [x] Register playbookRouter in server/routers.ts as trpc.playbook.*
- [x] TypeScript clean (zero errors)
- [x] Save checkpoint

## Phase 39 — Leader Playbook Phase 2: UI (Jul 15)
- [x] Build client/src/pages/LeaderPlaybook.tsx — situation input screen with InfinityLoader classification state
- [x] Build PlaybookSession view — 13-section accordion with interactive checklist, script editor, reflection form
- [x] Build PlaybookHistory sidebar — list of past sessions with situation summary and playbook type
- [x] Register /playbook route in App.tsx
- [x] Add "Leader Playbook" nav item to PlatformLayout LI sidebar (BookOpen icon, between Practice Coach and Growth Profile)
- [x] TypeScript clean (zero errors)
- [x] Save checkpoint

## Phase 40 — Guide → Leader Playbook Wiring (Jul 15)
- [x] Read Guide.tsx and guide server router to understand chat flow
- [x] Add playbookSignal field to guide.ts sendMessage return (keyword heuristic, no extra LLM call, LI-only)
- [x] Track playbookCTAIndexes and lastUserMessage state in Guide.tsx
- [x] Render inline Playbook CTA card after assistant reply when playbookSignal fires (gold border, BookOpen icon, navy CTA button)
- [x] LeaderPlaybook.tsx: read ?situation= query param on mount and pre-fill textarea + auto-focus
- [x] TypeScript clean (zero errors)
- [x] Save checkpoint

## Phase 41 — Playbook → Practice Coach Integration (Jul 15)
- [x] Read PracticeCoach.tsx to understand session setup form and how to inject pre-loaded context
- [x] Update PracticeCoach.tsx screen initializer to detect ?playbook_issue param and jump to scenario-setup
- [x] Update PracticeCoach.tsx issue useState initializer to pre-fill from ?playbook_issue param
- [x] Add "Practice this conversation →" purple CTA button to LeaderPlaybook.tsx Role-Play Setup section
- [x] Button navigates to /practice?playbook_issue=...&playbook_persona=...&playbook_context=... with encoded params
- [x] TypeScript clean (zero errors)
- [x] Save checkpoint

## Phase 42 — Playbook Home Card, Admin Stats, Patterns Page (Jul 15)
- [x] Add Leader Playbook entry card to Home.tsx dashboard
- [x] Add Playbook usage stats to AdminDashboard.tsx (session count per user, top situation types)
- [x] Add getPlaybookStats admin procedure to adminStats.ts (per-user session counts, top situation types)
- [x] Build client/src/pages/PlaybookPatterns.tsx — patterns page with recurring situations, avoided situations, competency signals
- [x] Register /playbook/patterns route in App.tsx
- [x] Add Patterns nav item to PlatformLayout LI sidebar under Leader Playbook
- [x] TypeScript clean (zero errors)
- [x] Save checkpoint

## Career Access Intelligence™ — Sprint 1

- [x] DB schema: career_profiles table (intake data, career graph)
- [x] DB schema: opportunity_universe table (scored organisations)
- [x] DB schema: career_strategy_statements table (AI-generated strategy)
- [x] Backend: careerAccess router with saveCareerProfile procedure
- [x] Backend: generateCareerStrategy procedure (AI, pulls CI diagnostic scores)
- [x] Backend: generateOpportunityUniverse procedure (AI, categorised + scored orgs)
- [x] Backend: getCareerProfile, getCareerStrategy, getOpportunityUniverse procedures
- [x] Frontend: CareerAccess page with multi-step intake form (5 sections)
- [x] Frontend: Career Strategy Statement view (AI-generated, exportable)
- [x] Frontend: Opportunity Universe view (categorised cards with 10-dimension scores)
- [x] Wire Career Access into CI sidebar navigation
- [x] Wire CI diagnostic scores into Career Graph context for AI prompts

## Career Access Intelligence™ — Sprint 3: Outreach Engine (Jul 16)
- [x] DB schema: brand_strategies table (AI-generated personal brand strategy)
- [x] DB schema: outreach_drafts table (per-contact outreach messages, conversation prep)
- [x] Run pnpm drizzle-kit generate and apply migration SQL
- [x] Backend: outreachEngine router — generateBrandStrategy procedure (AI, pulls career profile + CI scores)
- [x] Backend: outreachEngine router — getBrandStrategy procedure
- [x] Backend: outreachEngine router — generateOutreachDraft procedure (per-contact, per-channel)
- [x] Backend: outreachEngine router — listOutreachDrafts, updateOutreachDraft, deleteOutreachDraft procedures
- [x] Backend: outreachEngine router — generateConversationPrep procedure (per-contact meeting prep)
- [x] Frontend: OutreachEngine page at /career/brand with 2 tabs: Brand Strategy, Outreach Drafts
- [x] Brand Strategy tab: LinkedIn headline/summary, thought leadership pillars, content calendar, visibility plan
- [x] Outreach Drafts tab: per-contact message drafts (LinkedIn, email, warm intro), status tracking, conversation prep inline
- [x] Wire /career/brand route in App.tsx
- [x] Add Outreach Engine nav item to CI sidebar in PlatformLayout.tsx
- [x] TypeScript clean (zero errors)
- [x] Save checkpoint

## Open Self-Registration (Jul 16)
- [x] Add optional `name` field to `requestMagicLink` procedure (emailAuth router)
- [x] Personalise sign-in email with first name greeting
- [x] Build client/src/pages/Signup.tsx — open registration page at /signup
- [x] Signup page: name + email form, value proposition, benefits list, social proof, what-you-get checklist
- [x] Register /signup route in App.tsx
- [x] Update Landing page nav: replace "Apply for a Pilot" CTA with "Sign Up Free" primary CTA
- [x] Update Landing page hero: Sign Up Free as primary CTA button
- [x] TypeScript clean (zero errors)
- [x] Save checkpoint

## Platform Enrollment Gating (Jul 16)
- [x] Read platform switcher component and products router
- [x] Update products router: getEnrolledProducts already returns correct data — no backend change needed
- [x] Update platform switcher: filter dropdown to enrolled products only (non-admin users)
- [x] Hide dropdown entirely when user has exactly one enrolled product — show static label instead
- [x] Admin users (role = admin) bypass filter and always see all platforms
- [x] TypeScript clean (zero errors)
- [x] Save checkpoint

## Manager Effectiveness Platform — Sprint 1 (Jul 16)
- [x] DB schema: mep_diagnostic_results table (10 diagnostics, dimension scores, LLM analysis)
- [x] DB schema: manager_guide_sessions + manager_guide_messages tables (AI Guide chat)
- [x] DB schema: manager_playbook_sessions table (situation → AI playbook)
- [x] DB schema: behaviour_commitments table (commitment tracking + check-ins)
- [x] DB schema: mep_daily_briefs table (daily management brief)
- [x] DB schema: mep_practice_sessions table (AI practice partner)
- [x] Run migration and apply SQL
- [x] Backend: mepDiagnostics router (10 diagnostics, submit + get results)
- [x] Backend: managerGuide router (AI chat with full manager context)
- [x] Backend: managerPlaybook router (situation → structured playbook)
- [x] Backend: behaviourEngine router (commitments + check-ins)
- [x] Backend: mepDailyBrief router (generate daily management brief)
- [x] Backend: mepPractice router (AI practice partner sessions)
- [x] Shared: mepData.ts (10 diagnostic question sets + scoring)
- [x] Frontend: /manager/home — MEP Home dashboard
- [x] Frontend: /manager/diagnostics — Diagnostics hub (10 diagnostics)
- [x] Frontend: /manager/guide — AI Manager Guide (chat interface)
- [x] Frontend: /manager/playbook — Manager Playbook (situation → AI response)
- [x] Frontend: /manager/brief — Daily Management Brief
- [x] Frontend: /manager/practice — AI Practice Partner
- [x] Frontend: /manager/team — Team Intelligence dashboard
- [x] Frontend: /manager/commitments — Behaviour Change Engine
- [x] Add manager_effectiveness product to PRODUCT_CONFIG in ProductSwitcher
- [x] Add MEP_NAV_ITEMS to PlatformLayout
- [x] Register all /manager/* routes in App.tsx
- [x] Seed manager_effectiveness product row in DB
- [x] Enroll admin user in manager_effectiveness product for testing
- [x] TypeScript clean (zero errors)
- [x] Save checkpoint

## Manager Effectiveness Platform (MEP) — Sprint 1 (Jul 16)
- [x] DB schema: mep_diagnostic_results, manager_guide_sessions, manager_guide_messages, manager_playbook_sessions, behaviour_commitments, mep_daily_briefs, mep_practice_sessions, manager_team_members tables
- [x] Run drizzle-kit generate and apply all migrations
- [x] Shared data module: shared/modules/mepData.ts with 10 diagnostics, questions, scoring
- [x] Backend: mep router with all 6 layers (diagnostics, guide, playbook, daily brief, practice partner, behaviour engine, team intelligence)
- [x] Frontend: ManagerHome at /manager
- [x] Frontend: ManagerDiagnostics at /manager/diagnostics
- [x] Frontend: ManagerGuide at /manager/guide
- [x] Frontend: ManagerPlaybook at /manager/playbook
- [x] Frontend: ManagerBrief at /manager/brief
- [x] Frontend: ManagerPractice at /manager/practice
- [x] Frontend: ManagerCommitments at /manager/commitments
- [x] Frontend: TeamIntelligence at /manager/team
- [x] Wire MEP into ProductSwitcher PRODUCT_CONFIG
- [x] Wire MEP nav into PlatformLayout MEP_NAV_ITEMS
- [x] Wire all 8 routes into App.tsx
- [x] Seed manager_effectiveness product in DB
- [x] Enroll admin user in manager_effectiveness product
- [x] Update PostLoginProductActivator to redirect MEP users to /manager
- [x] TypeScript clean (zero errors)
- [x] Save checkpoint

## MEP UX Bug Fixes (Jul 17)
- [x] Fix Manager Guide chat: user message text invisible (dark text on navy bubble) — add explicit color: white to the p inside user message bubble
- [x] Fix ManagerDiagnostics results screen: "Back to Diagnostics" button renamed to "Back to Home" and navigates to /manager
- [x] Add Today's Focus card to MEP ManagerHome page — shows priorityFocus from getTodayBriefSnapshot (or default prompt if no brief yet), links to /manager/brief

## MEP Feature Batch (Jul 17 #2)
- [x] Fix playbook generation error: replaced invalid gpt-4o-mini model name with gpt-5-mini across all server routers
- [x] Add persistent sidebar nav to MEP pages: created MEPLayout.tsx with collapsible sidebar, wrapped all /manager/* routes
- [x] Add LevelNext logo to MEP diagnostic report page: logo shown in results header card and reflection modal
- [x] Auto-generate Daily Brief on first login: ManagerHome silently calls getDailyBrief mutation when todayBrief is null
- [x] Add post-diagnostic reflection: modal overlay with coachQuestion shown when user clicks Back to Home after completing a diagnostic

## MEP & CI Feature Batch (Jul 17 #3)
- [x] Add mobile hamburger menu to MEPLayout sidebar (slide-in drawer on mobile)
- [x] Build Past Playbooks history view in ManagerPlaybook.tsx
- [x] Add loading indicator on ManagerHome while Daily Brief is being auto-generated
- [x] Create downloadable A4 Career Intelligence Executive Brief PDF (4 pages, logo, graphics, Career Access AI section) — uploaded and linked on CareerLanding.tsx

## MEP Landing Page (Jul 17)
- [x] Create ManagerEffectivenessLanding.tsx at /manager-effectiveness route
- [x] Register route in App.tsx

## MEP Executive Brief PDF (Jul 17)
- [x] Generate A4 MEP Executive Brief PDF (4 pages, LevelNext logo, ME Score visual, AI coaching section)
- [x] Upload to webdev static assets and link on /manager-effectiveness landing page

## Four New MEP Diagnostics (Jul 17)
- [x] Build PST (Psychological Safety & Trust) diagnostic — 16 questions, 6 dimensions, scoring, LLM analysis, results view
- [x] Build PFM (Performance Management) diagnostic — 15 questions, 6 dimensions, scoring, LLM analysis, results view
- [x] Build CFI (Cross-functional Influence) diagnostic — 15 questions, 6 dimensions, scoring, LLM analysis, results view
- [x] Build MRW (Manager Resilience & Wellbeing) diagnostic — 15 questions, 6 dimensions, scoring, LLM analysis, results view
- [x] Remove 'coming soon' state from all four in ManagerEffectivenessLanding.tsx; ManagerDiagnostics.tsx auto-discovers all diagnostics from server

## MEP Polish Batch (Jul 17)
- [x] Add tailored LLM system prompts for PST, PFM, CFI, MRW diagnostics in mep router (14 expert personas total)
- [x] Add 10/10 diagnostic completion progress ring to MEP home page hero (SVG ring, live count)
- [x] Regenerate MEP Executive Brief PDF with all 10 active diagnostics — uploaded and linked on /manager-effectiveness

## Career Access Intelligence™ — Phase 1 (Jul 17)

### DB Schema
- [x] career_access_profiles table (goals, target roles, industries, resume URL, LinkedIn URL, preferences)
- [x] career_strategy table (strategy statement, value proposition, career narrative, positioning canvas, decision criteria)
- [x] opportunity_pipeline table (company, stage, probability, notes, next_action, relationships, momentum)
- [x] career_access_scores table (12-dimension score snapshots with timestamps)
- [x] opportunity_radar_signals table (signal type, company, description, recommended action, dismissed)
- [x] relationship_contacts table (name, category, strength, trust, recency, strategic_importance)
- [x] Run migration and apply SQL

### Server — tRPC Procedures
- [x] careerAccess.getProfile / upsertProfile (pull from CI profile if exists)
- [x] careerAccess.generateStrategy (LLM: strategy statement, value prop, narrative, canvas)
- [x] careerAccess.getStrategy / saveStrategy
- [x] careerAccess.getCRMPipeline / addOpportunity / updateOpportunity / dismissOpportunity
- [x] careerAccess.suggestCompanies (LLM: AI suggests 5-10 companies based on profile)
- [x] careerAccess.getCareerAccessScore / computeScore (12-dimension scoring)
- [x] careerAccess.getDailyBriefing (AI Chief of Staff: pipeline health, follow-ups, today's action)

### Client — Pages
- [x] /career-access — Home page with AI Chief of Staff daily briefing + Career Access Score ring
- [x] /career-access/strategy — Career Strategy Engine (generate + view strategy)
- [x] /career-access/pipeline — Opportunity CRM (AI suggestions + approve/dismiss + pipeline board)
- [x] /career-access/score — Career Access Score™ (12-dimension breakdown + trend chart)
- [x] CareerAccessLayout.tsx — persistent sidebar nav for all /career-access/* pages
- [x] Platform switcher: Career Intelligence ↔ Career Access links in both sidebars

### Integration
- [x] TypeScript check (zero errors)
- [x] Save checkpoint

## Six MEP Playbook Types (Jul 17)
- [x] Design six playbook types: Difficult Conversation, Performance Gap, Delegation Breakdown, Team Conflict, Motivation & Engagement, Feedback Resistance
- [x] Update server generatePlaybook with six tailored LLM system prompts (one per type)
- [x] Update ManagerPlaybook UI: playbook type selector cards, structured output sections per type
- [x] Wire Past Playbooks to show playbook type label and icon

## Bug Fixes & Features (Jul 17 — Batch 2)
- [x] Fix Daily Debrief: debrief generates successfully but does not display (query not refetching after mutation)
- [x] Playbook Reflection flow: post-play outcome form (what happened, what worked, outcome: win/partial/loss), LLM reflection insight, show reflection on session view
- [x] MEP Home: Recent Play widget showing last playbook type, situation, and quick "New Play" CTA
- [x] Opportunity Pipeline: Kanban board view (Identified → Researching → Targeting → Active → Paused) with click-to-expand cards, move buttons, and notes

## MEP Enhancements (Jul 17 — Batch 3)
- [x] AI-suggested commitments: "Suggest commitments for me" button on Commitments page, LLM generates 3 personalised suggestions based on MEP diagnostic scores
- [x] Weekly check-in nudge: widget on MEP Home ("Have you practised your commitments this week?") linking to Commitments page
- [x] Commitment streak tracker: show streak count on each active CommitmentCard
- [x] Team Intelligence example: example team member card on empty state showing what a complete member profile looks like

## Executive Opportunity System — Phase 1: Relationship Intelligence (Jul 17)
- [x] Review relationship_contacts schema and existing server procedures (getRelationships, addRelationship, updateRelationship, deleteRelationship, scoreRelationship)
- [x] Build RelationshipIntelligence view in CareerAccess: contact list with 7-dimension AI score bars
- [x] Add/edit contact form: name, company, role, relationship type, how we know each other, shared history, notes, key connector flag
- [x] AI relationship scoring: scoreRelationship procedure generates 7-dimension scores + composite score + recommended action
- [x] Weekly activation picks: top 3 contacts sorted by composite score with recommended action
- [x] Wire Relationship Intelligence nav card on CareerAccess home
- [x] TypeScript check (0 errors) and checkpoint save

## Executive Opportunity System — Phase 2 (Jul 17)
- [x] Access Path Generator: nav card on Career Access home (gated until Opportunity Universe has approved companies), links to /career/access-paths
- [x] Relationship → Pipeline link: show matched contacts on each Kanban expanded card ("Your Connections Here" section)
- [x] Career Access Score Dashboard: computeCareerAccessScore procedure wired to UI, 12-dimension radar chart (recharts), composite score hero, dimension breakdown bars, top priority actions, score history
- [x] TypeScript check (0 errors) and checkpoint save

## Executive Opportunity System — Phase 3 (Jul 17)
- [x] Chief of Staff Daily Briefing: wire getDailyBriefing to Career Access home — AI morning brief with pipeline follow-ups, relationship nudges, one priority action
- [x] Access Path status tracking: add status toggle (Not Started / In Progress / Activated) to each Access Path card in AccessPaths.tsx
- [x] Score improvement tips: after computing Career Access Score, show "How to improve your weakest 3 dimensions" panel with specific actionable steps
- [x] TypeScript check (0 errors) and checkpoint save

## Executive Opportunity System — Phase 4 (Jul 17)
- [x] Chief of Staff briefing history: getBriefingHistory procedure + collapsible history panel on Career Access home (last 30 days, click to expand each brief)
- [x] Access Path activation tracker: logAccessPathActivation procedure + activation log modal in AccessPaths.tsx (what you did, action type, notes) — intercepts "Activated" status click
- [x] Career Access Score gating: getScoreImprovement procedure + green banner on Career Access home when latest score > previous score
- [x] TypeScript check (0 errors) and checkpoint save

## Executive Opportunity System — Phase 5 (Jul 17)
- [x] Activation → Pipeline auto-update: logAccessPathActivation now auto-advances matched company to "Active" stage when outcome is had_call/got_intro/applied; toast confirms auto-advance
- [x] Relationship follow-up date: date picker added to activation modal, stored in activation log entry, Chief of Staff nudge text added
- [x] Weekly Executive Opportunity Report: generateWeeklyReport server procedure + WeeklyReportSection component on Career Access home — 4-stat grid (Active Opps, Paths Activated, High-Value Contacts, Score Change) + 5-sentence AI narrative
- [x] TypeScript check (0 errors) and checkpoint save

## Executive Opportunity System — Priority 1: Executive Brand Engine
- [x] Server: getBrandStrategy, saveBrandStrategy, generateBrandStrategy (LLM: LinkedIn headline/summary/about, brand statement, UVP, thought leadership pillars, content calendar, elevator pitch, executive bio)
- [x] UI: Brand Engine nav card on Executive Opportunity System home
- [x] UI: Brand Profile intake (current LinkedIn, target audience, 3 strengths, tone preference)
- [x] UI: AI Brand Strategy Generator — one-click generate all brand assets
- [x] UI: LinkedIn Rewrite section (headline + summary + about with copy button)
- [x] UI: Thought Leadership Pillars (3 pillars with content ideas and hashtags)
- [x] UI: 4-week Content Calendar (week, content type, topic, hook, format, CTA)
- [x] UI: Elevator Pitch + Executive Bio sections
- [x] TypeScript check and checkpoint save

## Executive Opportunity System — Priority 2: Outreach Engine
- [x] Server: getOutreachDrafts, generateOutreachDraft (LLM: LinkedIn message, email, warm intro request, follow-up, meeting agenda, talking points, questions to ask, things to avoid)
- [x] Server: updateOutreachStatus, markResponseReceived
- [x] UI: Outreach Engine nav card on Executive Opportunity System home
- [x] UI: Per-contact outreach generator (select contact → generate all message types)
- [x] UI: Conversation Prep module (meeting agenda, talking points, questions to ask, things to avoid)
- [x] UI: Follow-up tracker (sent → response received → outcome logged)
- [x] TypeScript check and checkpoint save

## Executive Opportunity System — Priority 3: Opportunity Radar Signals
- [x] Server: getRadarSignals, generateRadarSignals (LLM: scan target companies, generate signals by type), dismissSignal
- [x] Server: getTopSignals for Chief of Staff briefing integration
- [x] UI: Radar Signals nav card on Executive Opportunity System home
- [x] UI: Radar Feed view (card-based, sorted by urgency, dismiss actions)
- [x] UI: Signal type icons and urgency badges
- [x] TypeScript check and checkpoint save

## Executive Opportunity System — Priority 4: Interview Preparation Module
- [x] Schema: interview_prep_sessions table (role, company, interview type, job description, background, prepData JSON)
- [x] Migration applied
- [x] Server: generatePrep (LLM: role research, likely questions, suggested answers, STAR story bank, key messages, questions to ask)
- [x] Server: getLatestPrep, listPreps, deletePrep
- [x] UI: Interview Prep nav card on Executive Opportunity System home
- [x] UI: Role Research view (company context, likely priorities, interviewer mindset)
- [x] UI: Likely Questions with expandable suggested answers
- [x] UI: STAR Story Bank (expandable per story, competency badges)
- [x] UI: Key Messages and Questions to Ask sections
- [x] TypeScript check and checkpoint save

## Executive Opportunity System — Priority 5: Negotiation Intelligence
- [x] Schema: negotiation_sessions table (offer details, market context, leverage, strategyData JSON)
- [x] Migration applied
- [x] Server: generateStrategy (LLM: offer analysis, negotiation strategy, counter-offer scripts, decision framework)
- [x] Server: getLatestSession, listSessions, deleteSession
- [x] UI: Negotiation Intelligence nav card on Executive Opportunity System home
- [x] UI: Offer Analysis (compensation score, market position, negotiation room)
- [x] UI: Negotiation Strategy (what to ask for, what to accept, walk-away points)
- [x] UI: Counter-offer Scripts (expandable per scenario)
- [x] UI: Decision Framework (5-dimension scoring with progress bars)
- [x] TypeScript check and checkpoint save

## Diagnostic Rationalisation — Pareto Reduction (Jul 18)

### Phase 1: Remove / Hide diagnostics
- [x] Diagnostics.tsx: Remove TII, CRS, CST from CI_MODULES and LI_MODULES lists
- [x] Diagnostics.tsx: Move GCC to a "coming soon" locked card with Organisation Intelligence label
- [x] Guide/Growth Profile: Remove references to removed modules

### Phase 2: Merge LII + NII → Unified LII
- [x] liiData.ts: Add 5 NII dimensions (Political Navigation, Decision Pathway, Timing & Judgment, Org Awareness, Reputation & Credibility) as new LII dimensions
- [x] liiData.ts: Add 10 NII questions (2 per new dimension) to LII question set
- [x] Update LII label to "Leadership Influence & Navigation Intelligence"
- [x] Update Diagnostics.tsx LII entry with merged description
- [x] Remove NII from Diagnostics.tsx

### Phase 3: Merge CMK + CAO → Unified CMK
- [x] Update CMK label to "Career Marketability & Optionality Intelligence"
- [x] Update Diagnostics.tsx CMK entry with merged description
- [x] Remove CAO from Diagnostics.tsx

### Phase 4: Organisation Intelligence placeholder
- [x] Create /org-intelligence placeholder page
- [x] Add Organisation Intelligence route to App.tsx
- [x] GCC card links to /org-intelligence with "Coming Soon" state

### Steps 1–3 (Executive Opportunity System)
- [x] Step 1: History view for Interview Prep (past sessions drawer with delete)
- [x] Step 1: History view for Negotiation Intelligence (past sessions drawer with delete)
- [x] Step 2: Radar signal card → "Draft Outreach" button → pre-fills Outreach Engine with company + context banner
- [x] Step 3: Wire top Radar signals into Chief of Staff daily briefing (radarAlerts section)
- [x] TypeScript check (0 errors) and checkpoint save

## Next Steps (Jul 18 — Session 2)

### Step 1: Unlock Sequence DB Sync
- [x] Update product_modules table rows for leadership_intelligence product to ECI → LII → LDI → STI (remove TII, GCC, NII rows)
- [x] Verify unlock.ts DB path returns correct 4-module sequence

### Step 2: Organisation Intelligence Waitlist
- [x] Schema: org_intelligence_waitlist table (userId, email, name, orgName, role, useCase, createdAt)
- [x] Migration applied
- [x] Server: joinWaitlist procedure (upsert by userId), getWaitlistStatus procedure, listWaitlist (admin only)
- [x] UI: Email capture form on /org-intelligence page with success confirmation state

### Step 3: Radar → Interview Prep Deep-Link
- [x] RadarSignals.tsx: Add "Prep for Interview" button on hiring signal cards
- [x] Button deep-links to /career/interview-prep?company=X&context=Y
- [x] InterviewPrep.tsx: Read company/context query params, auto-opens form, pre-fills targetCompany, shows Radar context banner

## Career Intelligence Landing Page Redesign (Jul 18)
- [x] Rewrite CareerLanding.tsx: EOS-first hero, 5-engine showcase, intelligence loop, rationalised diagnostics section, CTA
- [x] Update nav links to include Executive Opportunity System anchor
- [x] Update Executive Brief download link to new PDF (uploaded to CDN)
- [x] TypeScript check (0 errors) and checkpoint save

## Executive Brief v2 with QR Code (Jul 18)
- [x] Generate gold-on-navy QR code for levelnext.coach/career-intelligence
- [x] Embed QR code on cover page bottom-right with "Scan to access" label
- [x] Recompile Typst brief with QR code
- [x] Upload final PDF to CDN: /manus-storage/LevelNext_Career_Intelligence_Executive_Brief_5a0cfaae.pdf
- [x] Update BRIEF_URL in CareerLanding.tsx to new PDF
- [x] TypeScript check (0 errors) and checkpoint save

### Phase 50: Coach View Portal
- [ ] Add `coaches` table (id, userId, name, email, bio, specialisation, createdAt)
- [ ] Add `coach_assignments` table (id, coachId, clientUserId, assignedAt, notes)
- [ ] Add `coach` role to users.role enum
- [ ] Run DB migration for coach tables
- [ ] Server: coachRouter — getMyClients, getClientBrief, generateCoachPrep (LLM)
- [ ] Server: adminCoachRouter — listCoaches, createCoach, assignClient, removeAssignment
- [ ] Frontend: /coach route — CoachLayout with coach-specific sidebar
- [ ] Frontend: /coach/clients — client roster page with activity signals
- [ ] Frontend: /coach/clients/:userId — pre-call brief page (diagnostics, commitments, activity, AI prep)
- [ ] Frontend: /admin/coaches — admin page to manage coaches and assignments
- [ ] Admin sidebar: add "Coaches" link under ADMIN section

## Next Chapter — Identity & Leadership OS (Phase 1, Jul 22)
- [x] Schema: next_chapter_profiles table (userId, currentStage, currentModule, completedModules JSON, startedAt, lastActiveAt)
- [x] Schema: next_chapter_deliverables table (userId, moduleNumber, deliverableType, content JSON, generatedAt, version)
- [x] Schema: next_chapter_messages table (userId, sessionId, moduleNumber, role, content, createdAt)
- [x] Schema: identity_experiments table (userId, moduleNumber, experiment, reflection, completedAt)
- [x] Run drizzle-kit generate and apply migration SQL
- [x] Server: nextChapterRouter — startSession, sendMessage (streaming AI with Next Chapter persona), completeModule, saveDeliverable, getProfile, getPortfolio, getMessages
- [x] Server: inject Next Chapter mega prompt as AI persona system prompt
- [x] Frontend: /next-chapter route — NextChapter page with chat UI + 6-stage / 16-module progress bar
- [x] Frontend: Stage/module progress sidebar (Discover, Design, Build, Practice, Lead, Reflect)
- [x] Frontend: Module 1 (Understanding Today) — conversation flow with deliverable generation
- [x] Frontend: Module 2 (Enterprise Context) — conversation flow with deliverable generation
- [x] Frontend: Deliverable cards — Current Identity Profile, Future Leadership Context Map
- [x] Frontend: Portfolio view at /next-chapter/portfolio — list of all completed deliverables
- [ ] Onboarding gate: redirect new users to /next-chapter before /home (first-time only) [deferred to Phase 2]
- [x] Coach View: expose Next Chapter portfolio in pre-call brief for assigned coaches
- [x] Add Next Chapter nav item to PlatformLayout sidebar (Leadership Intelligence product)
- [x] TypeScript check (zero errors)
- [x] Save checkpoint

## Next Chapter — Expert Panel Implementation

### Phase 1 — Fix the Action Loop
- [x] Update AI system prompt: surface module experiment as commitment prompt after 3+ exchanges
- [x] Add AI follow-up on previous module's experiment at start of each new session (in startSession)
- [x] Schema: next_chapter_experiment_commitments table (userId, moduleNumber, experiment, acknowledgedAt, reflectionNote)
- [x] Apply migration for experiment_commitments table
- [x] Experiment commitment card in Next Chapter chat UI (appears after 3 user messages, "I'll do it" CTA)
- [x] acknowledgeExperiment, submitExperimentReflection, getExperimentCommitment tRPC procedures
- [ ] Heartbeat: weekly email nudge (5 days after last session) with direct link to current module [deferred]
- [ ] Stage completion celebration modal in Next Chapter UI [deferred]
- [ ] Coach view notification trigger when coach accesses Coach Portal client brief [deferred]

### Phase 2 — Build the Measurement Story
- [x] Schema: identity_assessments table (userId, assessmentType, stageNumber, scores JSON, completedAt)
- [x] Apply migration for identity_assessments table
- [x] Build Identity Clarity Assessment UI (15-item Likert, 5 dimensions) at /next-chapter/identity-assessment
- [x] submitIdentityAssessment and getIdentityAssessments tRPC procedures
- [ ] Wire ICA to appear before Module 1 and after each stage boundary [deferred]
- [ ] Calculate Identity Shift Score (delta: baseline vs current across 5 dimensions) [deferred]
- [ ] Add radar chart to Portfolio page (baseline vs current ICA scores) [deferred]
- [ ] Coach Portal: cohort-level aggregate view (avg shift scores, completion rates) [deferred]
- [ ] Impact Report: PDF-generatable per-leader report combining platform data + identity shift [deferred]

### Phase 3 — Pilot Cohort Infrastructure
- [ ] Schema: pilot_cohort_members table (userId, cohortId, enrolledAt, status)
- [ ] Admin: tag users as pilot participants
- [ ] Instrumentation dashboard (admin): per-participant module completion, experiment rate, ICA scores
- [ ] Case study export: generate anonymised case study doc per participant
- [ ] Aggregate pilot report page (admin only)

### Phase 2 — UX Improvements (Jul 22)
- [x] Wire ICA auto-trigger: NextChapter page checks for baseline assessment on mount, redirects to /next-chapter/identity-assessment if none found
- [x] ICA completion: after submitting, redirect back to /next-chapter to start Module 1
- [x] Portfolio page: Identity Shift Score radar chart (baseline vs latest ICA scores across 5 dimensions)
- [x] ICA UX: animated progress bar with stage label transitions
- [x] ICA UX: smooth slide-in/slide-out transitions between questions (CSS transform)
- [x] ICA UX: completion celebration screen with confetti-style animation
- [x] TypeScript check (zero errors)
- [ ] Save checkpoint
