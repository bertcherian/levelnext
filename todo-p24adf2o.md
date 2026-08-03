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

## Enhancement: Voice I/O for Practice Partner
- [x] Add TTS mutation to pei router (reuse simulator pattern with OpenAI + Sarvam)
- [x] Add voice input (Web Speech API) to PEPractice session view
- [x] Add voice output (TTS playback) for counterpart messages
- [x] Add voice toggle controls and voice provider selection in session

## Enhancement: Calendar-Connected Morning Briefing
- [x] Fix calendar events query in generateDailyBrief to use user's actual integrations
- [x] Add getUpcomingEvents data to PEHome dashboard
- [x] Render calendar events section in Morning Briefing
- [x] Add commitment reminders from active commitments to the brief

## Enhancement: Interactive Charts for Progress & Assessment
- [x] Add radar chart for PEI dimension scores in Assessment results
- [x] Add line chart for assessment score history in Progress page
- [x] Add bar chart for practice session ratings in Progress page
- [x] Add 90-day development plan timeline visualization in Assessment results

## Enhancement Testing & Verification
- [x] All 16 vitest tests pass (including TTS, calendar events, brief snapshot, results history)
- [x] Zero TypeScript compilation errors
- [x] Server running cleanly after restart
