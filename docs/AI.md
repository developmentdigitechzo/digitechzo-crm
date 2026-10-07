# DigiTechzo CRM — AI & Conversational Intelligence Specification

> **STATUS:** SPECIFICATION / PLANNING  
> **Architecture Classification:** **TARGET ARCHITECTURE / PROPOSED ADAPTER MODEL**  
> **MVP Priority:** **P2** (Advanced Intelligence & Assistant)  
> **Provider & Model Selection:** **TBD / OPEN** (Decoupled via `LlmAdapter` and `SttAdapter`)  
> **Phase:** Phase 0 — Documentation / Planning  
> **Core Principle:** Strict separation of verified facts from probabilistic inferences. Zero tolerance for hallucinated client commitments. Specific providers and models will be researched again immediately before implementation.

---

## 1. Target AI Architectural Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    Call Recording / Transcript              │
│               (Telephony Audio / WhatsApp Thread)           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         SttAdapter                          │
│         (Speech-to-Text Interface — Provider TBD)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ Raw Text Transcript
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         LlmAdapter                          │
│       (Structured Inference Engine — Provider/Model TBD)    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ System Prompt with Strict JSON Schema & Guardrails    │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Schema-Validated JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      AiExtractionService                    │
│   (Validates Schema -> Splits Facts vs Inferences -> Logs)  │
├──────────────────────────────┬──────────────────────────────┤
│  Stated Facts (Immutable)    │  Inferences & Recommendations│
│  • Explicitly stated budget  │  • Buyer intent & sentiment  │
│  • Explicit timeline         │  • Missing BANT fields       │
│  • Raised objections         │  • Suggested follow-up draft │
│  • Client questions asked    │  • BDE coaching observations │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Extraction Taxonomy & Fact vs. Inference Rules

To prevent AI hallucinations from corrupting CRM reporting or commercial agreements, the extraction schema strictly partitions output into two distinct categories:

### 2.1 Stated Facts (`statedFacts`)
*Criteria:* Must be explicitly uttered or written by the prospect.
- **Client Requirements:** Specific deliverables requested (e.g., "E-commerce store with ERP sync").
- **Target Service Line:** Primary domain (e.g., "Web Development", "Digital Marketing", "SEO").
- **Explicit Budget:** Stated currency and amount (e.g., "Our maximum approved budget is 3 Lakhs INR"). If the prospect did not state a specific number, this field is strictly `null`.
- **Explicit Timeline / Deadline:** Specific launch date or deadline mentioned by client (e.g., "Needs to go live before Diwali").
- **Specific Objections:** Explicit concerns voiced (e.g., "Pricing is higher than expected").
- **Direct Client Questions:** Explicit questions asked by the prospect awaiting answers.

### 2.2 Inferences & Recommendations (`inferences`)
*Criteria:* Probabilistic deductions made by the model for sales guidance.
- **Buyer Intent Level:** `HIGH`, `MEDIUM`, `LOW` (with reasoning).
- **Missing Qualification Items:** Highlights unaddressed BANT fields (e.g., "Decision maker authority level was not confirmed").
- **Recommended Next Action:** Suggested action type and target timeframe.
- **Suggested Follow-up Message Draft:** Context-aware personalized WhatsApp or email draft addressing client questions.
- **BDE Coaching Feedback:** Constructive tips on discovery depth, objection handling, or talk-to-listen ratio.

---

## 3. Strict Structured Output JSON Schema (Proposed Target)

The `LlmAdapter` enforces strict JSON schema generation. Sample schema structure:

```json
{
  "summary": "Brief 2-3 sentence overview of the discussion.",
  "statedFacts": {
    "serviceInterest": "Custom Web Application Development",
    "requirementsSummary": "Client needs a B2B ordering portal for wholesale distributors with ERP sync.",
    "explicitBudget": "500000",
    "budgetCurrency": "INR",
    "budgetStated": true,
    "explicitTimeline": "Launch expected in 60 days",
    "timelineStated": true,
    "objectionsRaised": [
      "Concerned about integration complexity with existing legacy ERP"
    ],
    "clientQuestions": [
      "Does DigiTechzo provide post-launch maintenance SLA?",
      "Can the database handle 50,000 monthly transactions?"
    ]
  },
  "inferences": {
    "intentScore": 85,
    "intentLevel": "HIGH",
    "missingBantCriteria": [
      "Decision maker authority level unconfirmed (caller mentioned needing partner approval)"
    ],
    "suggestedNextAction": {
      "actionType": "MEETING",
      "purpose": "Technical architecture review with Lead Solution Architect to address ERP integration",
      "suggestedDueDays": 2
    },
    "suggestedFollowupDraft": "Hi [Name], great speaking with you today. Regarding your question on legacy ERP integration, our lead architect will join our Thursday demo to walk through our connector approach.",
    "salesCoachingTips": [
      "Good job clarifying transaction volumes. Remember to confirm the final budget signing authority on the next call."
    ]
  }
}
```

---

## 4. Operational Guardrails & Feature Flags

1. **Feature Toggles:** All AI analysis triggers are controlled via system feature flags (`ENABLE_AI_TRANSCRIPTION`, `ENABLE_AI_CALL_SUMMARY`, `ENABLE_AI_COACHING`).
2. **Review & Edit:** AI-suggested fields never overwrite confirmed lead qualification data automatically; they are presented to the BDE as suggestions with a single-click "Accept / Apply" button.
3. **Data Privacy:** Client PII (passwords, payment numbers) is scrubbed prior to passing transcripts to external AI APIs.
4. **Provider Neutrality:** `LlmAdapter` and `SttAdapter` ensure the underlying model or provider can be swapped at runtime via environment configuration without modifying business logic.
