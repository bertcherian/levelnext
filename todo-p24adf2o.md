# Professional Effectiveness Intelligence — MVP Build TODO

## Schema & Backend
- [x] Add PEI schema tables to drizzle/schema.ts (peProfiles, peCalendarIntegrations, peCalendarEvents, peAssessmentSessions, peAssessmentResults, peDailyBriefs, peCoachSessions, peCoachMessages, pePracticeSessions, peCommitments, peTeamMetrics)
- [x] Generate and apply migration SQL
- [x] Create shared/modules/peiData.ts (Professional Effectiveness Index diagnostic data)
- [x] Create server/routers/pei.ts (full tRPC router)
- [x] Register peiRouter in server/routers.ts

## Frontend Layout & Navigation
- [x] Create client/src/components/PELayout.tsx (responsive sidebar)
- [x] Add PEI routes to client/src/App.tsx

## Frontend Pages
- [x] Create PEOnboarding page (profile setup wizard)
- [x] Create PEHome page (morning briefing dashboard)
- [x] Create PECoach page (AI coach chat interface)
- [x] Create PEAssessment page (Professional Effectiveness Index)
- [x] Create PEPractice page (practice partner)
- [x] Create PEProgress page (progress tracking)
- [x] Create PESettings page (calendar integration, voice, white-label)

## Testing
- [x] Write vitest tests for PEI router
- [x] Run tests and verify (11 tests passed)
