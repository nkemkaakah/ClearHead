# ClearHead — Product Specification

## What It Is

ClearHead is an **AI-supported student mental-health support navigator**.

It is not an AI therapist. It is not a diagnosis tool.

It turns a student's confusion and distress into a clear, trusted next step: university support, NHS Talking Therapies, GP/111, crisis resources, or a scheduled follow-up check-in.

> "ClearHead helps a student move from *I don't know what to do tonight* to *I have a plan, a message ready to send, and someone checking in on me.*"

---

## Problem

UK students hit mental health lows every day, but the system fails them at three points:

| Problem | What happens |
|---|---|
| **Access delay** | Average NHS wait: 304–392 days after referral |
| **Navigation confusion** | 8+ valid NHS pathways; students under stress can't choose |
| **Activation friction** | Students know they need help but can't write the first message |
| **Safety risk** | 550,610 children on waiting lists may turn to unsafe AI (RCPsych 2026) |
| **Continuity gap** | After first contact, students are largely alone for weeks/months |

**In one sentence:** When a UK student feels overwhelmed at 1am, they don't know if they need their uni counsellor, a GP, NHS Talking Therapies, or 999 — and no tool helps them figure that out calmly, quickly, and safely.

---

## Core User Flow

```
Warm Entry → Support Check (AI) → Urgency Band → Action Plan → Copy-Ready Message → Check-In
                                                                       ↑
                                              [Crisis Override fires at any point if triggered]
```

### Step 1 — Warm Entry

- Single screen. Calm tone. No clinical jargon.
- One CTA: **"Let's start"**
- No login. No signup. Session-based.
- Crisis line always visible in footer from the very first screen.

> *"Hey. Whatever's going on, you're in the right place. Let's figure out together what support you need."*

### Step 2 — AI Support Check (3–5 adaptive questions)

Short, progressive conversation. Each question adapts based on the previous answer. Progress bar shown throughout.

| Question | Purpose |
|---|---|
| "How are you feeling right now, in your own words?" | Free text — AI reads tone, urgency, risk signals |
| "How long have you been feeling this way?" | Duration signals severity |
| "Is it affecting your sleep, eating, or ability to attend uni?" | Functional impairment check |
| "Have you had thoughts of harming yourself or ending your life?" | Safety screening — mandatory |
| *(adaptive)* "Have you spoken to anyone about this yet?" | Identifies existing support |

AI assigns one of three urgency bands:

| Band | Signal | Typical next step |
|---|---|---|
| 🟡 Low | Stress, burnout, early signs | Self-help + uni counselling |
| 🟠 Moderate | Anxiety, low mood, functional impairment | GP + NHS Talking Therapies |
| 🔴 Urgent | Crisis signals, self-harm language | Immediate crisis override |

### Step 3 — Personalised Action Plan

AI generates a clean, prioritised plan based on the urgency band. Each step is concrete, linkable, and actionable tonight.

Example (Moderate band):
1. Contact university counselling service (with copy-ready message below)
2. Self-refer to NHS Talking Therapies (link to local service finder)
3. If things get worse tonight: Samaritans 116 123

### Step 4 — Copy-Ready Message

AI generates a first-contact message the student can paste and send immediately.

> *"Hi, I'm a [year] student at [university] and I've been struggling with low mood and anxiety for the past few weeks. It's starting to affect my sleep and attendance. I'd like to book a counselling appointment as soon as possible."*

One button: **Copy message**

### Step 5 — Wellbeing Check-In

- 3 days after: 3 quick sliders (mood / sleep / stress)
- **Stable or better** → small self-help resource
- **Worse** → short re-triage → updated signposting

### Step 6 — Crisis Override (always-on)

Fires at **any point** in the flow if high-risk language is detected. Bypasses all steps immediately.

> **"You mentioned something that concerns us. Please reach out right now."**
>
> 📞 999 — Emergency  
> 📞 116 123 — Samaritans (free, 24/7)  
> 💬 Text SHOUT to 85258 — free crisis text line

No delay. No extra questions. No AI involvement in the response.

---

## Language Rules

| ❌ Never say | ✅ Always say |
|---|---|
| AI mental-health triage | AI-supported support check |
| Diagnosis | Urgency signal / support route |
| Treatment plan | Next-step support plan |
| Crisis handled by AI | Crisis override to trusted emergency resources |
| AI therapist | Student support navigator |
| ChatGPT for mental health | Responsible support-routing system |

These are non-negotiable. Any UI copy, AI prompt, or API response must conform to this language.

---

## What ClearHead Is and Is Not

| ClearHead IS | ClearHead IS NOT |
|---|---|
| An AI-supported support navigator | An AI therapist |
| A signposting tool to NHS/uni services | A diagnosis tool |
| A friction-reducer for asking for help | A crisis handler |
| A continuity layer (check-ins) while waiting | A replacement for professional care |

---

## Architecture

| Layer | Role | Tool |
|---|---|---|
| **App** | Student-facing web app (end-to-end) | Next.js on Vercel |
| **Runtime agent** | Support workflow: intake summarisation, urgency routing, signposting, follow-up | Manus API |
| **Engineering agent** | Code generation, refactors, maintenance — not student-facing | Cursor SDK |

Manus orchestrates what students see and what advice they get. Cursor SDK helps build and maintain ClearHead — it is not the support navigator brain.

---

## Tech Stack

| Layer | Tool |
|---|---|
| App | Next.js (React) — full stack, deployed on Vercel |
| Runtime AI | Manus API (agents, tasks, skills, webhooks) |
| Engineering AI | Cursor SDK (`@cursor/sdk`) — build/refactor automation only |
| Auth | None — session-based, no database for MVP |

---

## Key Constraints

- **No login required** — the entire flow must work without an account
- **Crisis override is always-on** — it must fire regardless of current step
- **AI is routing only** — never diagnostic, never therapeutic
- **Copy-ready message is mandatory** — removing this step is removing core value
- **Check-in closes the loop** — students must not feel dropped after the flow ends
- **Language rules are enforced** — copy that violates the language table above must be rewritten
