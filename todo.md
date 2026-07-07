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
- [ ] Wire email delivery (Brevo SMTP)

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
- [ ] Seed mock ECI diagnostic report for Bert with realistic dimension scores and archetype
- [ ] Update Leadership Graph for Bert with ECI module data
- [ ] Update PDF export feature (Node-compatible, branded, Meta Results footer)
- [ ] Add Save to Favorites button to Guide chat messages
- [ ] Build favorites storage (DB table + tRPC procedures)
- [ ] Build Saved Insights panel in Guide home view
