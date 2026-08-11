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

- [ ] Refactor remaining Launch pages to use LaunchDarkLayout (LaunchHome, LaunchOnboarding, LaunchJourneyMap, LaunchApplicationTracker, etc.)
- [ ] Add achievement sharing integration
- [ ] Responsive design testing across breakpoints

## Phase 4: Polish

- [ ] Accessibility audit and fixes (contrast, keyboard nav, screen reader)
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] Cross-browser testing
- [ ] Save checkpoint and publish
