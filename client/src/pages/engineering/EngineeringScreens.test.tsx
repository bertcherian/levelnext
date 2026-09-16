// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ENGINEERING_DIAGNOSTIC_QUESTIONS } from "../../../../shared/modules/engineeringIntelligence";

const navigate = vi.fn();
const invalidate = vi.fn();

const authState = {
  user: { id: 10, name: "Engineering Participant", role: "user" },
  isAuthenticated: true,
  loading: false,
};

const profileData = {
  profile: { id: 1, roleTitle: "Senior Software Engineer", discipline: "Platform engineering", engineeringLevel: "Senior", aspiration: "Build cross-team impact" },
  latestResult: {
    id: 4,
    impactPattern: "Systems builder",
    impactRadius: "system",
    growthEdge: { engine: "collaboration", statement: "Build greater range in collaboration through one practical workplace experiment." },
    engineScores: { self: 70, collaboration: 60, problem: 75, systems: 90, business: 70, human_ai_judgment: 85 },
    createdAt: new Date("2026-08-31T00:00:00.000Z"),
  },
  missions: [{ id: 9, title: "Clarify an architecture decision", description: "Ask one evidence-seeking question before committing to a design direction.", status: "recommended", dueAt: new Date("2026-09-07T00:00:00.000Z"), partnerVisible: false }],
  mirrors: [{ id: 7, primaryDimension: "courage", relevance: null, situation: "A difficult architecture review", analysis: { mirror: { whatWeAreNoticing: "A material concern was deferred." } } }],
};

const diagnosticState: any = {
  data: { questions: ENGINEERING_DIAGNOSTIC_QUESTIONS, session: null },
  isLoading: false,
  error: null,
};

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@/components/PlatformLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div data-testid="platform-layout">{children}</div> }));
vi.mock("wouter", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLocation: () => ["/engineering/diagnostic", navigate],
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ engineering: { getDiagnosticState: { invalidate }, getOperatingProfile: { invalidate } } }),
    engineering: {
      getDiagnosticState: { useQuery: () => diagnosticState },
      startDiagnostic: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      saveDiagnosticResponse: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      completeDiagnostic: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      getOperatingProfile: { useQuery: () => ({ data: profileData, isLoading: false, error: null }) },
      saveProfileContext: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      updateMission: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      analyseSelfLeadership: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false, data: null }) },
      rateSelfLeadership: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      getPartnerWorkspace: { useQuery: () => ({ data: { privacyBoundary: "Only participant-shared Mission context appears here.", participants: [] }, isLoading: false, error: null }) },
      generatePartnerNudges: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updatePartnerNudge: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      logPartnerCheckIn: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import EngineeringDiagnostic from "./EngineeringDiagnostic";
import EngineeringOperatingProfile from "./EngineeringOperatingProfile";
import EngineeringPartnerWorkspace from "./EngineeringPartnerWorkspace";

afterEach(() => {
  cleanup();
  diagnosticState.data = { questions: ENGINEERING_DIAGNOSTIC_QUESTIONS, session: null };
});

describe("Tech Intelligence protected screens", () => {
  it("renders the participant diagnostic start state with timing and privacy cues", () => {
    render(<EngineeringDiagnostic />);

    expect(screen.getByRole("heading", { name: "Tech Impact Diagnostic" })).toBeTruthy();
    expect(screen.getByText("12 reflective prompts · approximately 6 minutes")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Begin diagnostic" })).toBeTruthy();
    expect(screen.getByText("Your privacy boundary")).toBeTruthy();
    expect(screen.getByText(/raw responses are private/i)).toBeTruthy();
  });

  it("restores saved diagnostic progress with a dismissible post-login cue", () => {
    diagnosticState.data = {
      questions: ENGINEERING_DIAGNOSTIC_QUESTIONS,
      session: { id: 41, currentQuestionIndex: 2, answers: { self_reflection: 4, collaboration: 3 } },
    };

    render(<EngineeringDiagnostic />);

    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Welcome back — your diagnostic is saved.")).toBeTruthy();
    expect(screen.getByText(/restored 2 saved responses/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss saved diagnostic notice" }));

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders the Operating Profile with engine signals, Mission controls, and a private-reflection boundary", () => {
    render(<EngineeringOperatingProfile />);

    expect(screen.getByRole("heading", { name: "Systems builder" })).toBeTruthy();
    expect(screen.getByText("Tech Intelligence engines")).toBeTruthy();
    expect(screen.getByText("Human–AI judgment")).toBeTruthy();
    expect(screen.getByText("Clarify an architecture decision")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Accept this Mission/i })).toBeTruthy();
    expect(screen.getByText("Private Self-Leadership reflection")).toBeTruthy();
    expect(screen.getByText(/does not appear in your Partner workspace/i)).toBeTruthy();
  });

  it("renders a deliberate empty Success Partner state rather than exposing unsupported participant data", () => {
    render(<EngineeringPartnerWorkspace />);

    expect(screen.getByRole("heading", { name: "Success Partner Workspace" })).toBeTruthy();
    expect(screen.getByText(/Only participant-shared Mission context appears here/i)).toBeTruthy();
    expect(screen.getByText("No shared Mission focus yet")).toBeTruthy();
    expect(screen.getByText(/after an active assignment and an explicit choice/i)).toBeTruthy();
  });
});
