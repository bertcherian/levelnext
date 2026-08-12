# Launch Intelligence Dark Mode Neon Neo-Brutalism Redesign — Session TODO

## Phase 1: Foundation

- [x] Add Google Fonts (Space Grotesk + Manrope) to index.html
- [x] Add `.launch-dark` CSS design tokens to `client/src/index.css` (colors, typography, spacing, shadows, animations, glassmorphic cards, bottom nav, accessibility)
- [x] Add launch_user_preferences table to drizzle/schema.ts
- [x] Generate and apply migration SQL for launch_user_preferences
- [x] Add launchUserPreferences tRPC router (getPreferences, updateAccentColor, updateAvatar, updateNotifications, updateAccessibility)
- [x] Register launchUserPreferences router in server/routers.ts
- [x] Write vitest tests for launchUserPreferences router (7 tests, all passing)

## Phase 2: Components

- [x] Build LaunchDarkLayout component (glassmorphic top nav, XP progress bar, mobile bottom-sheet nav, settings/accessibility integration)
- [x] Refactor LaunchDashboard to use dark-mode design system (LaunchDarkLayout, neon cards, XP charts, mission progress, stats)
- [x] Build LaunchSettings page (accent color picker, avatar selection, notification toggles, accessibility controls)
- [x] Add /launch/settings route to App.tsx
- [x] Build AchievementUnlockedModal component (celebration + share buttons)
- [x] Build Leaderboard page and components

## Phase 3: Integration

- [x] Refactor remaining Launch pages to use LaunchDarkLayout through backward-compatible shared-shell adapters (LaunchHome, LaunchJourneyMap, LaunchApplicationTracker, Career Compass, Interview, Negotiation, Resume, Skill Sprint, and Story Builder)
- [x] Add achievement sharing integration
- [x] Replace simulated leaderboard content with live, privacy-preserving tRPC rankings and real weekly activity aggregates
- [x] Centralize daily-mission XP awards in the server, add a ledger entry, update level/streak state, and show unlocked achievement celebrations
- [x] Add XP progression regression tests (4 tests)
- [x] Visually verify the Interview Intelligence and Negotiation Simulator setup journeys render as dark neon experiences through the shared shell
- [x] Re-verify full-width mobile dark-shell rendering after overflow hardening
  - Evidence: manual review of the repaired 375×812 dashboard capture confirmed that the dark surface fills the viewport with no blank canvas or horizontal overflow.
- [x] Complete responsive verification after fixing the desktop bottom-navigation regression
  - Evidence: desktop navigation passes at 1280px with no mobile bottom bar; tablet uses a compact header at 768px without a collision; and final 375px captures show the mobile bottom navigation, a full-width dark shell, and a readable “Earn XP to rank” helper next to the compact CTA.

## Phase 4: Polish

- [x] Accessibility audit and fixes (reduced-motion and high-contrast preferences, labelled customization controls, semantic navigation, and visible keyboard focus)
- [x] Performance optimization (route-level lazy loading and branded Suspense boundary for Launch Intelligence journeys)
- [x] Reconcile documented WebKit cross-browser smoke validation for the settings page
  - Evidence: Chromium breakpoint reviews passed at 1280px, 768px, and 375px. Firefox desktop smoke captures passed for dashboard, leaderboard, and settings. Playwright WebKit (Safari-equivalent) passed for dashboard, leaderboard, and settings. Settings renders correctly after its normal initial data-load window.
- [x] Save checkpoint and publish

## Phase 5: Engagement Gamification

- [x] Define mission-history timeline data contract backed by real XP events and mission-completion records
- [x] Add opt-in weekly peer challenge schema, enrollment, progress, and privacy-preserving ranking procedures
- [x] Add deterministic on-demand weekly challenge rollover using ISO week keys, so no background scheduler is required
- [x] Build the personal mission-history timeline page and navigation entry
- [x] Build the weekly challenge panel, opt-in flow, progress indicator, and leaderboard context
- [x] Add dynamic XP bursts, progress transitions, and achievement-unlock micro-interactions that respect reduced-motion preferences
- [x] Fix achievement copy sharing when the Clipboard API is unavailable or rejects the write request
- [x] Add regression tests for timeline, challenge enrollment/progress, and XP-celebration behavior
- [x] Complete responsive and accessibility validation for the new engagement experiences
- [x] Package the engagement-gamification implementation workflow as a reusable skill
- [x] Add client-side regression coverage for XP celebration rendering and clipboard fallback behavior
- [x] Perform and document keyboard, focus, live-region, and reduced-motion accessibility validation for History and Challenges
- [x] Verify History live-region and Challenge keyboard focus/reduced-motion behavior in browser-like interaction tests
- [x] Save checkpoint and publish engagement release

## Phase 6: Personalized Engagement

- [x] Define the career-goal source of truth and deterministic rotating challenge-variant rules
- [x] Add schema and protected API contracts for personalized challenge assignment and optional mission reflections
- [x] Build an optional accessible reflection prompt in the post-mission completion flow
- [x] Add a private weekly progress recap contract and learner-dashboard section for XP, missions, and completed challenges
- [x] Update weekly challenges to show the goal-aware rotating variant without exposing personal goal data to peers
- [x] Add regression coverage for variant selection, reflections, and private recap aggregation
- [x] Validate the new flows across desktop/mobile and reduced-motion/keyboard accessibility modes
- [x] Package the personalized-engagement workflow into the reusable Launch gamification skill
- [x] Show the optional reflection prompt only after successful mission completion and preserve per-mission loading state
- [x] Add explicit reflection-prompt and weekly-recap keyboard, reduced-motion, desktop, and mobile validation
- [x] Verify the weekly recap’s non-interactive/retry states remain keyboard-safe and meaningful with reduced motion enabled
- [x] Save checkpoint and publish personalized engagement release
