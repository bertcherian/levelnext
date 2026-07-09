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
