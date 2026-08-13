# Self-Leadership Intelligence Engine — Implementation Blueprint

## Purpose

Self-Leadership Intelligence is a reusable Intelligence Core capability that helps each LevelNext Guide distinguish **knowing**, **seeing**, and **choosing** constraints in a real workplace situation. It is developmental and private by default; it does not diagnose personality, infer motives as facts, or act as performance surveillance.

## Core contract

The engine receives a user-owned situation, observable behaviour, career stage, contextual factors, and optional evidence. It returns a typed analysis: capability and judgement signals, one relevant self-leadership dimension, calibrated confidence, a hypothesis, a reflection question, a next choice, a micro-experiment, a follow-up signal, and the four-part private LevelNext Mirror.

## Reuse model

The canonical vocabulary and safeguards live in `shared/modules/selfLeadershipIntelligence.ts`. The server engine in `server/selfLeadershipIntelligence.ts` provides structured analysis with a deterministic fallback. `intelligenceCore.analyzeSelfLeadership` is the typed, protected entry point available to every LevelNext application. Guide, leadership-coach, and early-career coach prompts import the same directive so coaching conversations use the construct before they offer generic techniques.

## Safety and privacy

The engine treats one incident as evidence rather than a pattern, expresses low-confidence observations as questions, separates intention/behaviour/impact, and frames deeper causes only as hypotheses. It stores no private reflection content in audit events. The current user may request an analysis of their own supplied situation; organisational reporting should use aggregate themes only under explicit permission.

## Validation

Unit coverage checks the six-dimension vocabulary, career-stage calibration, guardrails, fallback analysis, private-mirror structure, and prompt integration across the three coaching pathways. A realistic Finance leader example demonstrates a reusable analysis request.
