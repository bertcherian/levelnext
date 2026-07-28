import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { simSessions } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import type { SimTurn, SimDebrief, SimBehaviourScore } from "../../drizzle/schema";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SimMission = {
  id: string;
  platform: "leadership" | "manager" | "career" | "young";
  title: string;
  capability: string;
  description: string;
  context: string;
  stakes: string;
  difficulty: "Foundation" | "Developing" | "Advanced" | "Expert";
  estimatedMinutes: number;
  character: {
    name: string;
    role: string;
    personality: string;
    communicationStyle: string;
    motivation: string;
    stressBehaviour: string;
  };
  userRole: string;
  desiredOutcome: string;
  successCriteria: string[];
  behaviourDimensions: string[];
  coachingPersona: string;
  openingLine: string;
  tags: string[];
};

// ── Mission Library ───────────────────────────────────────────────────────────

export const MISSIONS: SimMission[] = [
  // ── LEADERSHIP INTELLIGENCE (5 missions) ──────────────────────────────────
  {
    id: "li_board_presentation",
    platform: "leadership",
    title: "Presenting to the Board",
    capability: "Executive Presence",
    description: "Present a strategic initiative to a sceptical board member who is questioning ROI and timeline.",
    context: "You are presenting a digital transformation initiative to the board. One board member, Vikram Nair, is known for challenging assumptions and demanding hard numbers. He has already questioned two previous initiatives this year.",
    stakes: "Board approval determines whether the initiative gets funded. Your credibility as a strategic leader is on the line.",
    difficulty: "Advanced",
    estimatedMinutes: 12,
    character: {
      name: "Vikram Nair",
      role: "Independent Board Director",
      personality: "Analytical, sceptical, direct",
      communicationStyle: "Data-driven, asks probing questions, interrupts when unconvinced",
      motivation: "Protect shareholder value, ensure capital is deployed wisely",
      stressBehaviour: "Becomes more aggressive with questions, dismisses vague answers",
    },
    userRole: "Business Head / SVP",
    desiredOutcome: "Secure board approval and Vikram's support for the initiative",
    successCriteria: [
      "Addresses ROI concerns with specific numbers",
      "Acknowledges risks while demonstrating mitigation plans",
      "Maintains composure under pressure",
      "Uses strategic framing, not operational detail",
    ],
    behaviourDimensions: ["Executive Presence", "Strategic Framing", "Question Handling", "Composure Under Pressure", "Clarity of Thinking"],
    coachingPersona: "Executive Coach",
    openingLine: "Before we proceed, I want to understand the financial case here. What exactly is the return on this investment, and by when?",
    tags: ["board", "strategy", "influence", "executive"],
  },
  {
    id: "li_leading_change",
    platform: "leadership",
    title: "Leading Organisational Change",
    capability: "Managing Change",
    description: "A senior leader on your team is resistant to a major restructuring you are leading.",
    context: "You are leading a business unit restructuring that will change reporting lines and eliminate some roles. Priya Menon, a VP who has been with the company 12 years, is openly resistant and influencing others.",
    stakes: "If Priya remains resistant, she will undermine the change with her team. You need her aligned or you risk the entire restructuring.",
    difficulty: "Advanced",
    estimatedMinutes: 10,
    character: {
      name: "Priya Menon",
      role: "VP, Operations",
      personality: "Experienced, loyal to old ways, politically aware",
      communicationStyle: "Indirect, uses history as argument, builds coalitions",
      motivation: "Protect her team, preserve her influence, avoid disruption",
      stressBehaviour: "Becomes passive-aggressive, references past failures",
    },
    userRole: "SVP / Business Head",
    desiredOutcome: "Gain Priya's genuine commitment to the change, not just compliance",
    successCriteria: [
      "Listens to Priya's concerns without becoming defensive",
      "Acknowledges what is being lost, not just what is gained",
      "Creates a role for Priya in the change process",
      "Sets clear expectations without threatening",
    ],
    behaviourDimensions: ["Empathy", "Influence", "Listening", "Strategic Framing", "Conflict Navigation"],
    coachingPersona: "Executive Coach",
    openingLine: "I appreciate you agreeing to meet. I want to be honest — I've heard you have some concerns about the restructuring, and I'd rather hear them directly from you.",
    tags: ["change", "resistance", "influence", "restructuring"],
  },
  {
    id: "li_stakeholder_alignment",
    platform: "leadership",
    title: "Stakeholder Alignment Conversation",
    capability: "Influence",
    description: "Align a peer leader who controls a critical resource you need for your initiative.",
    context: "You need Rahul Sharma's engineering team for 6 weeks to build a critical feature. Rahul has his own roadmap pressures and has already said no once informally.",
    stakes: "Without Rahul's team, your Q3 launch is at risk. But pushing too hard could damage a relationship you need long-term.",
    difficulty: "Developing",
    estimatedMinutes: 8,
    character: {
      name: "Rahul Sharma",
      role: "VP, Engineering",
      personality: "Busy, protective of his team, results-oriented",
      communicationStyle: "Direct, numbers-focused, values reciprocity",
      motivation: "Deliver his own roadmap, protect his team from overload",
      stressBehaviour: "Becomes transactional, looks for what he gets in return",
    },
    userRole: "VP, Product",
    desiredOutcome: "Secure 6 weeks of engineering support with Rahul's genuine buy-in",
    successCriteria: [
      "Acknowledges Rahul's constraints before making the ask",
      "Frames the request in terms of shared business outcomes",
      "Offers something of value in return",
      "Agrees on specific terms, not vague commitments",
    ],
    behaviourDimensions: ["Influence", "Listening", "Strategic Framing", "Negotiation", "Relationship Building"],
    coachingPersona: "Executive Coach",
    openingLine: "I know you're stretched. I wouldn't be here if this wasn't genuinely important. Can I take 10 minutes?",
    tags: ["influence", "peers", "negotiation", "resources"],
  },
  {
    id: "li_difficult_feedback",
    platform: "leadership",
    title: "Giving Difficult Feedback to a Senior Leader",
    capability: "Feedback",
    description: "Give honest performance feedback to a high-performing leader whose behaviour is damaging team culture.",
    context: "Anand Krishnan is your strongest performer by numbers, but his team has a 40% attrition rate. Three people have cited him in exit interviews. You need to address this directly.",
    stakes: "If Anand's behaviour doesn't change, you will lose more talent. But if handled badly, you risk losing Anand too.",
    difficulty: "Advanced",
    estimatedMinutes: 10,
    character: {
      name: "Anand Krishnan",
      role: "Director, Sales",
      personality: "High-performer, confident, slightly defensive",
      communicationStyle: "Justifies with results, deflects with data",
      motivation: "Recognition, autonomy, advancement",
      stressBehaviour: "Becomes defensive, cites numbers, questions the source",
    },
    userRole: "SVP / Business Head",
    desiredOutcome: "Anand understands the impact of his behaviour and commits to specific changes",
    successCriteria: [
      "Opens with specific observable behaviour, not character judgment",
      "Acknowledges Anand's contributions before addressing the issue",
      "Holds the position when Anand deflects with results",
      "Ends with a specific commitment and follow-up plan",
    ],
    behaviourDimensions: ["Feedback Quality", "Composure", "Empathy", "Directness", "Listening"],
    coachingPersona: "Executive Coach",
    openingLine: "Anand, I wanted to speak with you privately. I want to start by saying your numbers this quarter were outstanding. And I also need to share something important.",
    tags: ["feedback", "performance", "culture", "difficult conversations"],
  },
  {
    id: "li_innovation_pitch",
    platform: "leadership",
    title: "Presenting Innovation to a Risk-Averse Leader",
    capability: "Innovation",
    description: "Pitch a bold new business model to a CEO who is known for preferring incremental change.",
    context: "You are pitching a platform business model that would require a 2-year investment before revenue. Your CEO, Suresh Iyer, has rejected two innovation proposals this year for being 'too risky'.",
    stakes: "If you don't get this approved, a competitor will launch first. But if you push too hard, you damage your relationship with the CEO.",
    difficulty: "Expert",
    estimatedMinutes: 12,
    character: {
      name: "Suresh Iyer",
      role: "CEO",
      personality: "Cautious, experienced, values proven models",
      communicationStyle: "Asks about downside, wants proof of concept, references past failures",
      motivation: "Protect the business, deliver consistent results, avoid board scrutiny",
      stressBehaviour: "Becomes dismissive, references what has worked before",
    },
    userRole: "Business Head / SVP",
    desiredOutcome: "Get CEO approval for a pilot, not the full investment",
    successCriteria: [
      "Frames the proposal as a pilot, not a full commitment",
      "Addresses downside risk proactively",
      "Uses analogies from other industries the CEO respects",
      "Asks for a small decision, not a big one",
    ],
    behaviourDimensions: ["Strategic Framing", "Influence", "Executive Presence", "Question Handling", "Innovation Thinking"],
    coachingPersona: "Executive Coach",
    openingLine: "I appreciate the time. I want to share something I've been working on, and I'd like your honest reaction — even if it's sceptical.",
    tags: ["innovation", "CEO", "pitch", "risk"],
  },

  // ── MANAGER EFFECTIVENESS (5 missions) ────────────────────────────────────
  {
    id: "me_feedback_underperformer",
    platform: "manager",
    title: "Feedback Conversation with an Underperformer",
    capability: "Feedback",
    description: "Give clear, honest feedback to a team member who is consistently missing deadlines.",
    context: "Deepa has missed three consecutive deadlines. She is technically capable but seems disengaged. Other team members have noticed and are starting to resent the inconsistency.",
    stakes: "If this continues, team morale will suffer. But if handled badly, Deepa may disengage further or resign.",
    difficulty: "Developing",
    estimatedMinutes: 8,
    character: {
      name: "Deepa Nair",
      role: "Senior Analyst",
      personality: "Capable but disengaged, slightly defensive",
      communicationStyle: "Explains circumstances, minimises impact",
      motivation: "Avoid conflict, maintain self-image as a good performer",
      stressBehaviour: "Becomes quiet, gives one-word answers, looks for escape",
    },
    userRole: "Manager",
    desiredOutcome: "Deepa understands the impact and commits to a specific improvement plan",
    successCriteria: [
      "States the specific behaviour, not a character judgment",
      "Asks what is getting in the way before giving solutions",
      "Agrees on a specific, measurable commitment",
      "Ends with support, not threat",
    ],
    behaviourDimensions: ["Feedback Quality", "Empathy", "Listening", "Coaching Questions", "Clarity"],
    coachingPersona: "Manager Coach",
    openingLine: "Deepa, thanks for making time. I wanted to check in with you — how are you feeling about the last few weeks?",
    tags: ["feedback", "underperformance", "one-on-one", "accountability"],
  },
  {
    id: "me_delegation",
    platform: "manager",
    title: "Delegating a Stretch Assignment",
    capability: "Delegation",
    description: "Delegate a high-visibility project to a team member who lacks confidence.",
    context: "You need to delegate the Q3 client presentation to Arjun, who is technically ready but lacks confidence. He has turned down stretch assignments before.",
    stakes: "This is a development opportunity for Arjun, but if he fails, it reflects on you and the team.",
    difficulty: "Foundation",
    estimatedMinutes: 7,
    character: {
      name: "Arjun Mehta",
      role: "Analyst",
      personality: "Capable but self-doubting, needs reassurance",
      communicationStyle: "Asks many questions, looks for permission to say no",
      motivation: "Avoid failure, maintain safety",
      stressBehaviour: "Lists all the reasons it won't work",
    },
    userRole: "Manager",
    desiredOutcome: "Arjun accepts the assignment with genuine confidence, not reluctant compliance",
    successCriteria: [
      "Explains why Arjun specifically was chosen",
      "Clarifies what support is available",
      "Sets clear expectations without micromanaging",
      "Ends with Arjun's own words of commitment",
    ],
    behaviourDimensions: ["Delegation Quality", "Coaching Questions", "Empathy", "Clarity", "Motivation"],
    coachingPersona: "Manager Coach",
    openingLine: "Arjun, I've been thinking about the Q3 client presentation and I want to talk to you about it.",
    tags: ["delegation", "development", "confidence", "stretch"],
  },
  {
    id: "me_conflict",
    platform: "manager",
    title: "Managing Conflict Between Two Team Members",
    capability: "Conflict Resolution",
    description: "Mediate a conflict between two team members that is affecting the whole team.",
    context: "Sanjay and Meera have been in open conflict for two weeks over ownership of a project. The team has taken sides. You are meeting with Sanjay first.",
    stakes: "If unresolved, the conflict will damage team performance and may result in one person leaving.",
    difficulty: "Developing",
    estimatedMinutes: 8,
    character: {
      name: "Sanjay Verma",
      role: "Senior Developer",
      personality: "Frustrated, feels wronged, wants validation",
      communicationStyle: "Vents, uses absolutes ('always', 'never'), wants you to take sides",
      motivation: "Be heard, get justice, protect his contribution",
      stressBehaviour: "Escalates, threatens to go to HR",
    },
    userRole: "Engineering Manager",
    desiredOutcome: "Sanjay feels heard and agrees to a structured resolution process",
    successCriteria: [
      "Listens fully before responding",
      "Does not take sides or validate the narrative",
      "Redirects from blame to impact and resolution",
      "Agrees on next steps that include both parties",
    ],
    behaviourDimensions: ["Listening", "Empathy", "Conflict Navigation", "Neutrality", "Coaching Questions"],
    coachingPersona: "Manager Coach",
    openingLine: "Sanjay, I appreciate you coming in. I want to hear your perspective — take me through what's been happening from your side.",
    tags: ["conflict", "team", "mediation", "interpersonal"],
  },
  {
    id: "me_performance_review",
    platform: "manager",
    title: "Delivering a Difficult Performance Review",
    capability: "Feedback",
    description: "Deliver a below-expectations performance rating to a team member who expected a promotion.",
    context: "Kavitha has been expecting a promotion for 6 months. Her performance this year has been solid but not exceptional. You are giving her a 'Meets Expectations' rating, not 'Exceeds'.",
    stakes: "Kavitha may resign if she feels the rating is unfair. But giving an inflated rating would be dishonest and unfair to others.",
    difficulty: "Advanced",
    estimatedMinutes: 10,
    character: {
      name: "Kavitha Rao",
      role: "Product Manager",
      personality: "Ambitious, hardworking, emotionally invested",
      communicationStyle: "Challenges the rating with examples, compares herself to peers",
      motivation: "Advancement, recognition, fairness",
      stressBehaviour: "Becomes emotional, questions your judgment",
    },
    userRole: "Senior Manager",
    desiredOutcome: "Kavitha understands the rating, feels respected, and has a clear path forward",
    successCriteria: [
      "Explains the rating criteria, not just the outcome",
      "Acknowledges Kavitha's genuine contributions",
      "Holds the rating position without becoming defensive",
      "Creates a specific development plan for the next cycle",
    ],
    behaviourDimensions: ["Feedback Quality", "Empathy", "Composure", "Clarity", "Coaching Questions"],
    coachingPersona: "Manager Coach",
    openingLine: "Kavitha, I want to start by saying how much I value your work this year. And I also want to be honest with you about the rating.",
    tags: ["performance review", "promotion", "feedback", "difficult"],
  },
  {
    id: "me_one_on_one",
    platform: "manager",
    title: "Running an Effective One-on-One",
    capability: "Coaching",
    description: "Transform a status-update one-on-one into a genuine coaching conversation.",
    context: "Your weekly one-on-one with Rohan has become a status update meeting. He is capable but not growing. You want to shift the dynamic.",
    stakes: "If Rohan doesn't grow, he will plateau and eventually leave. This is an opportunity to change the relationship.",
    difficulty: "Foundation",
    estimatedMinutes: 7,
    character: {
      name: "Rohan Gupta",
      role: "Business Analyst",
      personality: "Reliable, task-focused, not used to being coached",
      communicationStyle: "Gives status updates, waits for direction",
      motivation: "Complete tasks well, avoid surprises",
      stressBehaviour: "Becomes confused when asked open questions",
    },
    userRole: "Manager",
    desiredOutcome: "Rohan leaves the conversation with a genuine development insight and a self-chosen action",
    successCriteria: [
      "Asks at least 3 open coaching questions",
      "Resists the urge to give advice before asking",
      "Helps Rohan identify his own insight",
      "Ends with Rohan's own commitment, not a task assigned",
    ],
    behaviourDimensions: ["Coaching Questions", "Listening", "Empathy", "Delegation Quality", "Motivation"],
    coachingPersona: "Manager Coach",
    openingLine: "Rohan, before we go through the updates — how are you doing? Not the work, you personally.",
    tags: ["one-on-one", "coaching", "development", "listening"],
  },

  // ── CAREER TRANSITION INTELLIGENCE (5 missions) ───────────────────────────
  {
    id: "ct_executive_interview",
    platform: "career",
    title: "Executive Job Interview",
    capability: "Career Positioning",
    description: "Navigate a senior-level job interview with a hiring manager who is testing your strategic thinking.",
    context: "You are interviewing for a VP role at a mid-size tech company. The hiring manager, Nisha Kapoor, is known for asking tough strategic questions and testing how candidates handle ambiguity.",
    stakes: "This is your top-choice role. You have two other offers but this one is the best fit. How you perform here determines whether you get an offer.",
    difficulty: "Advanced",
    estimatedMinutes: 12,
    character: {
      name: "Nisha Kapoor",
      role: "Chief People Officer",
      personality: "Sharp, strategic, tests for depth not surface answers",
      communicationStyle: "Asks follow-up questions, probes for specifics, comfortable with silence",
      motivation: "Find someone who can operate at VP level from day one",
      stressBehaviour: "Becomes more probing when answers are vague",
    },
    userRole: "Senior Professional seeking VP role",
    desiredOutcome: "Leave the interview with Nisha's genuine interest and a clear next step",
    successCriteria: [
      "Uses specific examples with measurable outcomes",
      "Demonstrates strategic thinking, not just execution",
      "Asks insightful questions about the role and organisation",
      "Handles ambiguous questions without becoming defensive",
    ],
    behaviourDimensions: ["Executive Presence", "Career Storytelling", "Strategic Framing", "Question Handling", "Clarity"],
    coachingPersona: "Career Coach",
    openingLine: "Tell me about yourself — but skip the resume. I want to understand how you think about your career and what you're really looking for.",
    tags: ["interview", "executive", "career", "positioning"],
  },
  {
    id: "ct_salary_negotiation",
    platform: "career",
    title: "Salary Negotiation",
    capability: "Negotiation",
    description: "Negotiate a compensation package that reflects your market value after receiving an offer.",
    context: "You have received an offer for a Director role. The base salary is 15% below your target. The recruiter has said 'this is our best offer' but you know the market rate is higher.",
    stakes: "Every rupee you negotiate now compounds over your career. But push too hard and you risk the offer.",
    difficulty: "Developing",
    estimatedMinutes: 8,
    character: {
      name: "Pooja Sharma",
      role: "Senior Recruiter",
      personality: "Friendly but firm, has a budget ceiling",
      communicationStyle: "Uses anchoring, appeals to non-cash benefits, creates urgency",
      motivation: "Close the hire within budget, maintain relationship",
      stressBehaviour: "Becomes more firm, references other candidates",
    },
    userRole: "Senior Professional",
    desiredOutcome: "Negotiate a package that closes the gap, or understand exactly what is and isn't possible",
    successCriteria: [
      "States the ask clearly with market data",
      "Does not accept the first 'no' as final",
      "Explores the full package, not just base salary",
      "Maintains warmth and enthusiasm throughout",
    ],
    behaviourDimensions: ["Negotiation", "Executive Presence", "Clarity", "Composure Under Pressure", "Strategic Framing"],
    coachingPersona: "Career Coach",
    openingLine: "I'm really excited about this opportunity. I do want to talk about the compensation — can we discuss that?",
    tags: ["negotiation", "salary", "offer", "career"],
  },
  {
    id: "ct_networking_conversation",
    platform: "career",
    title: "Strategic Networking Conversation",
    capability: "Networking",
    description: "Have a genuine networking conversation with a senior leader in your target company.",
    context: "You have a 20-minute coffee meeting with Arun Patel, a VP at your target company. You were introduced through a mutual contact. You want to explore opportunities without being transactional.",
    stakes: "Arun is well-connected. If this goes well, he could refer you internally. If it feels transactional, he will not help.",
    difficulty: "Foundation",
    estimatedMinutes: 8,
    character: {
      name: "Arun Patel",
      role: "VP, Strategy",
      personality: "Generous but busy, values genuine curiosity",
      communicationStyle: "Tells stories, tests whether you've done your homework",
      motivation: "Help people who are genuinely curious and well-prepared",
      stressBehaviour: "Becomes polite but disengaged when conversation feels transactional",
    },
    userRole: "Senior Professional in transition",
    desiredOutcome: "Leave with a genuine connection and a clear next step (referral, introduction, or follow-up)",
    successCriteria: [
      "Asks thoughtful questions about Arun's experience",
      "Shares your own story concisely and authentically",
      "Does not ask for a job directly",
      "Ends with a specific, low-ask next step",
    ],
    behaviourDimensions: ["Networking", "Career Storytelling", "Listening", "Executive Presence", "Relationship Building"],
    coachingPersona: "Career Coach",
    openingLine: "Thanks for making time. I've been following your work on the platform strategy — I had a few questions I was hoping to ask you.",
    tags: ["networking", "relationship", "career", "exploration"],
  },
  {
    id: "ct_ask_for_promotion",
    platform: "career",
    title: "Asking for a Promotion",
    capability: "Career Positioning",
    description: "Make the case for your promotion to your manager in a direct, confident conversation.",
    context: "You have been performing at the next level for 8 months. Your manager Vivek has not raised the topic. You decide to initiate the conversation.",
    stakes: "If you don't ask, you won't get it. But if you come across as entitled or poorly prepared, it could backfire.",
    difficulty: "Developing",
    estimatedMinutes: 8,
    character: {
      name: "Vivek Iyer",
      role: "Senior Director",
      personality: "Fair but non-committal, avoids difficult conversations",
      communicationStyle: "Gives vague timelines, references process, deflects with 'let's see'",
      motivation: "Avoid conflict, maintain team stability",
      stressBehaviour: "Becomes more vague, references budget cycles",
    },
    userRole: "Manager / Senior Professional",
    desiredOutcome: "A clear commitment or a clear timeline with specific criteria",
    successCriteria: [
      "Opens with evidence, not emotion",
      "Asks for a specific decision or timeline, not a vague conversation",
      "Handles deflection without backing down",
      "Ends with a written follow-up commitment",
    ],
    behaviourDimensions: ["Career Positioning", "Directness", "Executive Presence", "Composure Under Pressure", "Clarity"],
    coachingPersona: "Career Coach",
    openingLine: "Vivek, I wanted to have a direct conversation about my career progression. I've been thinking about this for a while.",
    tags: ["promotion", "career", "assertiveness", "manager"],
  },
  {
    id: "ct_career_pivot",
    platform: "career",
    title: "Explaining a Career Pivot",
    capability: "Career Storytelling",
    description: "Articulate your career transition story to a sceptical hiring manager.",
    context: "You are moving from a technical role to a business role. The hiring manager, Sunita Rao, has expressed concern about your lack of direct business experience.",
    stakes: "Your story needs to reframe your technical background as an asset, not a liability. If you can't do this, you won't get the role.",
    difficulty: "Developing",
    estimatedMinutes: 8,
    character: {
      name: "Sunita Rao",
      role: "VP, Business Development",
      personality: "Direct, results-focused, sceptical of career changers",
      communicationStyle: "Asks pointed questions, challenges assumptions",
      motivation: "Hire someone who can deliver results from day one",
      stressBehaviour: "Becomes more direct, references the risk of hiring someone without experience",
    },
    userRole: "Professional making a career pivot",
    desiredOutcome: "Sunita sees your transition as a strength, not a risk",
    successCriteria: [
      "Tells a coherent narrative that connects past to future",
      "Uses specific examples that transfer across roles",
      "Addresses the experience gap directly, not defensively",
      "Demonstrates genuine understanding of the new domain",
    ],
    behaviourDimensions: ["Career Storytelling", "Executive Presence", "Clarity", "Composure Under Pressure", "Strategic Framing"],
    coachingPersona: "Career Coach",
    openingLine: "I'll be honest with you — I see your technical background, but I'm not sure how that translates to what we need here. Help me understand.",
    tags: ["career pivot", "storytelling", "interview", "transition"],
  },

  // ── YOUNG TALENT PLATFORM (5 missions) ────────────────────────────────────
  {
    id: "yt_first_feedback",
    platform: "young",
    title: "Receiving Difficult Feedback Gracefully",
    capability: "Learning Agility",
    description: "Receive critical feedback from your manager without becoming defensive.",
    context: "Your manager Preethi has called you in to give feedback on a presentation you gave last week. You thought it went well. She has some significant concerns.",
    stakes: "How you receive this feedback will determine whether Preethi sees you as coachable and ready for more responsibility.",
    difficulty: "Foundation",
    estimatedMinutes: 6,
    character: {
      name: "Preethi Subramaniam",
      role: "Manager",
      personality: "Caring but direct, wants you to grow",
      communicationStyle: "Uses specific examples, checks for understanding",
      motivation: "Develop her team, give honest feedback",
      stressBehaviour: "Becomes more direct if you become defensive",
    },
    userRole: "Early-career professional",
    desiredOutcome: "Leave the conversation with clear understanding and a commitment to improve",
    successCriteria: [
      "Listens without interrupting",
      "Asks clarifying questions, not defensive questions",
      "Acknowledges the feedback genuinely",
      "Commits to a specific change",
    ],
    behaviourDimensions: ["Listening", "Learning Agility", "Empathy", "Composure", "Clarity"],
    coachingPersona: "Young Talent Mentor",
    openingLine: "I wanted to talk to you about last week's presentation. I think there are some things that went well, and some things I want to share with you honestly.",
    tags: ["feedback", "early career", "listening", "growth"],
  },
  {
    id: "yt_first_client",
    platform: "young",
    title: "First Client Meeting",
    capability: "Professional Communication",
    description: "Handle your first client meeting professionally when the client is demanding and impatient.",
    context: "You are representing your company in a client meeting for the first time. The client, Mr. Krishnamurthy, is senior, impatient, and has already complained about the service.",
    stakes: "If you handle this well, you build confidence and credibility. If you handle it badly, the client may escalate.",
    difficulty: "Foundation",
    estimatedMinutes: 7,
    character: {
      name: "Mr. Krishnamurthy",
      role: "Senior Client",
      personality: "Impatient, demanding, tests junior professionals",
      communicationStyle: "Interrupts, asks rapid questions, uses status",
      motivation: "Get results, feel respected",
      stressBehaviour: "Escalates, threatens to go to senior management",
    },
    userRole: "Junior Professional",
    desiredOutcome: "Client feels heard and confident that the issue will be resolved",
    successCriteria: [
      "Stays calm under pressure",
      "Acknowledges the client's frustration without apologising for things outside your control",
      "Sets realistic expectations",
      "Commits to a specific follow-up",
    ],
    behaviourDimensions: ["Professional Communication", "Composure Under Pressure", "Listening", "Clarity", "Empathy"],
    coachingPersona: "Young Talent Mentor",
    openingLine: "I've been waiting for 20 minutes and no one told me you were running late. Is this how your company operates?",
    tags: ["client", "communication", "pressure", "early career"],
  },
  {
    id: "yt_ask_for_help",
    platform: "young",
    title: "Asking for Help Without Looking Incompetent",
    capability: "Workplace Intelligence",
    description: "Ask your senior colleague for help on a task you are struggling with, without damaging your credibility.",
    context: "You have been stuck on a data analysis task for two days. You are worried that asking for help will make you look incompetent. Your colleague Ravi is an expert.",
    stakes: "If you don't ask, you will miss the deadline. If you ask badly, you may confirm the fear that you are not ready for this role.",
    difficulty: "Foundation",
    estimatedMinutes: 6,
    character: {
      name: "Ravi Shankar",
      role: "Senior Analyst",
      personality: "Helpful but busy, values preparation",
      communicationStyle: "Direct, asks what you've tried before helping",
      motivation: "Help people who have tried first, not people who want shortcuts",
      stressBehaviour: "Becomes impatient if you haven't tried anything",
    },
    userRole: "Junior Professional",
    desiredOutcome: "Get the help you need while demonstrating that you have tried and thought about the problem",
    successCriteria: [
      "Shows what you have already tried",
      "Asks a specific question, not a vague one",
      "Frames it as learning, not rescue",
      "Thanks Ravi and confirms the next step",
    ],
    behaviourDimensions: ["Workplace Intelligence", "Professional Communication", "Learning Agility", "Clarity", "Confidence"],
    coachingPersona: "Young Talent Mentor",
    openingLine: "Ravi, do you have a few minutes? I've been working on something and I wanted to get your perspective.",
    tags: ["help-seeking", "early career", "communication", "learning"],
  },
  {
    id: "yt_managing_expectations",
    platform: "young",
    title: "Managing Up — Setting Expectations with Your Manager",
    capability: "Managing Expectations",
    description: "Tell your manager you cannot meet a deadline without damaging your credibility.",
    context: "You have been given three urgent tasks simultaneously. You cannot complete all three by Friday. You need to tell your manager Ananya before the deadline, not after.",
    stakes: "If you say nothing and miss the deadline, trust is damaged. If you communicate well, you demonstrate maturity and professionalism.",
    difficulty: "Foundation",
    estimatedMinutes: 6,
    character: {
      name: "Ananya Krishnan",
      role: "Manager",
      personality: "Busy, values proactive communication",
      communicationStyle: "Direct, wants solutions not just problems",
      motivation: "Manage her team's output, avoid surprises",
      stressBehaviour: "Becomes frustrated if you bring problems without options",
    },
    userRole: "Early-career professional",
    desiredOutcome: "Ananya knows the situation, has agreed on priorities, and trusts you to deliver",
    successCriteria: [
      "Raises the issue early, not at the deadline",
      "Comes with options, not just the problem",
      "Asks for guidance on prioritisation",
      "Commits to a revised plan",
    ],
    behaviourDimensions: ["Managing Expectations", "Professional Communication", "Workplace Intelligence", "Clarity", "Confidence"],
    coachingPersona: "Young Talent Mentor",
    openingLine: "Ananya, I wanted to speak with you before the end of day. I have a concern about the Friday deadline.",
    tags: ["managing up", "expectations", "communication", "early career"],
  },
  {
    id: "yt_professional_presence",
    platform: "young",
    title: "Speaking Up in a Senior Meeting",
    capability: "Confidence",
    description: "Contribute your perspective in a meeting where everyone else is more senior.",
    context: "You are in a cross-functional meeting with directors and VPs. You have a relevant insight that no one has mentioned. You have been quiet for 20 minutes.",
    stakes: "If you speak up well, you build visibility. If you stay quiet, you become invisible. If you speak badly, you may embarrass yourself.",
    difficulty: "Foundation",
    estimatedMinutes: 6,
    character: {
      name: "Deepak Malhotra",
      role: "Director, Strategy",
      personality: "Experienced, tests ideas rigorously",
      communicationStyle: "Asks follow-up questions, challenges assumptions",
      motivation: "Find the best idea, not the most senior voice",
      stressBehaviour: "Becomes impatient with vague or unprepared contributions",
    },
    userRole: "Early-career professional",
    desiredOutcome: "Your contribution is heard, respected, and builds your visibility",
    successCriteria: [
      "States the point clearly and concisely",
      "Connects it to what was already said",
      "Handles a follow-up question without retreating",
      "Ends with a clear, actionable suggestion",
    ],
    behaviourDimensions: ["Confidence", "Professional Communication", "Executive Presence", "Clarity", "Strategic Framing"],
    coachingPersona: "Young Talent Mentor",
    openingLine: "I want to build on what Deepak just said — I think there's an angle we haven't considered yet.",
    tags: ["speaking up", "meetings", "visibility", "early career"],
  },
];

// ── Behaviour Dimensions per Platform ────────────────────────────────────────

const BEHAVIOUR_DIMENSIONS: Record<string, string[]> = {
  leadership: ["Executive Presence", "Strategic Framing", "Influence", "Composure Under Pressure", "Listening"],
  manager: ["Feedback Quality", "Coaching Questions", "Empathy", "Listening", "Clarity"],
  career: ["Career Storytelling", "Executive Presence", "Negotiation", "Composure Under Pressure", "Clarity"],
  young: ["Professional Communication", "Listening", "Confidence", "Learning Agility", "Clarity"],
};

// ── Coach Personas ────────────────────────────────────────────────────────────

const COACH_PERSONAS: Record<string, string> = {
  "Executive Coach": "You are a seasoned executive coach with 20 years of experience working with C-suite and senior leaders. You are direct, strategic, and challenge assumptions. You observe leadership behaviour with precision.",
  "Manager Coach": "You are a management effectiveness coach who has trained thousands of managers. You focus on observable behaviours, practical tools, and the human side of management.",
  "Career Coach": "You are a career transition specialist who has helped hundreds of senior professionals navigate career changes, interviews, and negotiations. You are strategic, practical, and outcome-focused.",
  "Young Talent Mentor": "You are a mentor and coach for early-career professionals. You are warm, encouraging, and practical. You help young professionals build confidence and workplace intelligence.",
};

// ── System Prompt Builder ─────────────────────────────────────────────────────

function buildCharacterPrompt(mission: SimMission, userName: string): string {
  const { character, context, desiredOutcome, successCriteria, behaviourDimensions } = mission;
  return `You are ${character.name}, ${character.role}.

PERSONALITY: ${character.personality}
COMMUNICATION STYLE: ${character.communicationStyle}
MOTIVATION: ${character.motivation}
STRESS BEHAVIOUR: ${character.stressBehaviour}

SCENARIO CONTEXT:
${context}

The person you are speaking with is ${userName}. They are playing the role of: ${mission.userRole}.

YOUR OPENING LINE (use this to start the conversation):
"${mission.openingLine}"

IMPORTANT RULES:
- Stay in character at all times. Never break character.
- Respond naturally as ${character.name} would in this situation.
- React authentically to what ${userName} says — if they handle it well, respond positively; if they handle it poorly, respond as your character would under stress.
- Keep responses concise — 2-4 sentences maximum per turn.
- Do NOT provide coaching, feedback, or meta-commentary. You are the character, not the coach.
- The conversation should feel real, not like a training exercise.
- After 8-12 exchanges, you may naturally bring the conversation to a close.

DESIRED OUTCOME FOR THIS CONVERSATION: ${desiredOutcome}`;
}

function buildDebriefPrompt(mission: SimMission, transcript: SimTurn[], userName: string): string {
  const transcriptText = transcript
    .map((t) => `${t.role === "user" ? userName : mission.character.name}: ${t.content}`)
    .join("\n");

  const dimensions = mission.behaviourDimensions;
  const coachPersona = COACH_PERSONAS[mission.coachingPersona] || COACH_PERSONAS["Executive Coach"];

  return `${coachPersona}

You have just observed ${userName} complete a leadership simulation. Here is the full transcript:

---
${transcriptText}
---

MISSION: ${mission.title}
CAPABILITY FOCUS: ${mission.capability}
SUCCESS CRITERIA:
${mission.successCriteria.map((c) => `- ${c}`).join("\n")}

BEHAVIOUR DIMENSIONS TO ASSESS:
${dimensions.join(", ")}

Generate a structured debrief in this EXACT JSON format:
{
  "overallScore": <number 0-100>,
  "headline": "<one sentence summary of how they did>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "growthAreas": ["<area 1>", "<area 2>"],
  "behaviourScores": [
    ${dimensions.map((d) => `{"dimension": "${d}", "score": <0-100>, "observation": "<specific observation from the transcript>", "tip": "<one actionable tip>"}`).join(",\n    ")}
  ],
  "coachingNote": "<2-3 sentence personalised coaching insight for ${userName}>",
  "turningPoints": [
    {"turnIndex": <index>, "note": "<what happened at this moment>"}
  ],
  "missedOpportunities": ["<opportunity 1>", "<opportunity 2>"],
  "alternativeResponses": [
    {"original": "<what they said>", "better": "<a stronger alternative>"}
  ],
  "retryRecommended": <true|false>,
  "nextMissionId": "<id of a logical next mission or null>"
}

Be specific, honest, and constructive. Reference actual lines from the transcript. Do not be generic.
Return ONLY the JSON object. No markdown, no explanation.`;
}

// ── Router ────────────────────────────────────────────────────────────────────

export const simulatorRouter = router({
  // Get all missions (optionally filtered by platform)
  getMissions: protectedProcedure
    .input(z.object({ platform: z.enum(["leadership", "manager", "career", "young"]).optional() }))
    .query(({ input }) => {
      if (input.platform) {
        return MISSIONS.filter((m) => m.platform === input.platform);
      }
      return MISSIONS;
    }),

  // Get a single mission by ID
  getMission: protectedProcedure
    .input(z.object({ missionId: z.string() }))
    .query(({ input }) => {
      const mission = MISSIONS.find((m) => m.id === input.missionId);
      if (!mission) throw new Error("Mission not found");
      return mission;
    }),

  // Start a new simulation session
  startSession: protectedProcedure
    .input(z.object({
      missionId: z.string(),
      voiceEnabled: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const mission = MISSIONS.find((m) => m.id === input.missionId);
      if (!mission) throw new Error("Mission not found");

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await db
        .insert(simSessions)
        .values({
          userId: ctx.user.id,
          platform: mission.platform,
          missionId: mission.id,
          missionTitle: mission.title,
          capability: mission.capability,
          difficulty: mission.difficulty,
          voiceEnabled: input.voiceEnabled,
          characterName: mission.character.name,
          characterRole: mission.character.role,
          transcript: [],
          status: "active",
        })
        .$returningId();

      return { sessionId: session.id, mission };
    }),

  // Send a message in the simulation (get character response)
  sendMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      userMessage: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const sessionRows = await db.select().from(simSessions)
        .where(and(eq(simSessions.id, input.sessionId), eq(simSessions.userId, ctx.user.id)))
        .limit(1);
      const session = sessionRows[0];
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      if (session.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Session is not active" });

      const mission = MISSIONS.find((m) => m.id === session.missionId);
      if (!mission) throw new Error("Mission not found");

      const userName = ctx.user.name || "the professional";
      const currentTranscript: SimTurn[] = (session.transcript as SimTurn[]) || [];

      // Add user message
      const userTurn: SimTurn = {
        role: "user",
        content: input.userMessage,
        timestamp: Date.now(),
      };
      const updatedTranscript = [...currentTranscript, userTurn];

      // Build conversation history for LLM
      const systemPrompt = buildCharacterPrompt(mission, userName);
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
      ];

      // Add conversation history
      for (const turn of updatedTranscript) {
        messages.push({
          role: turn.role === "user" ? "user" : "assistant",
          content: turn.content,
        });
      }

      // Get character response
      const response = await invokeLLM({
        messages,
        model: "gpt-4o-mini",
        maxTokens: 200,
      });

      const rawChar = response.choices[0]?.message?.content ?? "...";
      const characterResponse = typeof rawChar === "string" ? rawChar : (rawChar as any[]).map((c: any) => c.text ?? "").join("");

      const characterTurn: SimTurn = {
        role: "character",
        content: characterResponse,
        timestamp: Date.now(),
      };

      const finalTranscript = [...updatedTranscript, characterTurn];

      // Save updated transcript
      await db
        .update(simSessions)
        .set({ transcript: finalTranscript, updatedAt: new Date() })
        .where(eq(simSessions.id, input.sessionId));

      return { characterResponse, turnCount: finalTranscript.length };
    }),

  // End session and generate debrief
  endSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const sessionRows2 = await db.select().from(simSessions)
        .where(and(eq(simSessions.id, input.sessionId), eq(simSessions.userId, ctx.user.id)))
        .limit(1);
      const session = sessionRows2[0];
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const mission = MISSIONS.find((m) => m.id === session.missionId);
      if (!mission) throw new Error("Mission not found");

      const transcript = (session.transcript as SimTurn[]) || [];
      if (transcript.length < 2) {
        throw new Error("Not enough conversation to generate a debrief");
      }

      const userName = ctx.user.name || "the professional";
      const debriefPrompt = buildDebriefPrompt(mission, transcript, userName);

      const response = await invokeLLM({
        messages: [{ role: "user", content: debriefPrompt }],
        model: "gpt-4o",
        maxTokens: 2000,
      });

      let debrief: SimDebrief;
      try {
        const rawContent = response.choices[0]?.message?.content ?? "{}";
        const rawStr = typeof rawContent === "string" ? rawContent : (rawContent as any[]).map((c: any) => c.text ?? "").join("");
        const cleaned = rawStr.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        debrief = JSON.parse(cleaned);
      } catch {
        debrief = {
          overallScore: 70,
          headline: "Good effort — review the transcript for specific insights.",
          strengths: ["Engaged with the character", "Completed the simulation"],
          growthAreas: ["Review the transcript for specific opportunities"],
          behaviourScores: mission.behaviourDimensions.map((d) => ({
            dimension: d,
            score: 70,
            observation: "See transcript for details",
            tip: "Review your responses and consider alternative approaches",
          })),
          coachingNote: "Complete the simulation with more exchanges to receive a detailed debrief.",
          turningPoints: [],
          missedOpportunities: [],
          alternativeResponses: [],
          retryRecommended: false,
        };
      }

      await db
        .update(simSessions)
        .set({
          debrief,
          overallScore: debrief.overallScore,
          status: "complete",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(simSessions.id, input.sessionId));

      return debrief;
    }),

  // Get session history for the user
  getHistory: protectedProcedure
    .input(z.object({ platform: z.enum(["leadership", "manager", "career", "young"]).optional(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = [eq(simSessions.userId, ctx.user.id)];
      if (input.platform) {
        conditions.push(eq(simSessions.platform, input.platform));
      }
      return db.select().from(simSessions)
        .where(and(...conditions))
        .orderBy(desc(simSessions.createdAt))
        .limit(input.limit);
    }),

  // Get a specific session with full transcript
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(simSessions)
        .where(and(eq(simSessions.id, input.sessionId), eq(simSessions.userId, ctx.user.id)))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return rows[0];
    }),
});
