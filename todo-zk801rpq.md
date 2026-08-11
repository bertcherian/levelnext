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
- [ ] Save checkpoint and publish
