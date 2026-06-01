[README (1).md](https://github.com/user-attachments/files/28462625/README.1.md)
<div align="center">

```
██╗███╗   ██╗████████╗███████╗██████╗ ██╗   ██╗██╗███████╗██╗    █████╗ ██╗
██║████╗  ██║╚══██╔══╝██╔════╝██╔══██╗██║   ██║██║██╔════╝██║   ██╔══██╗██║
██║██╔██╗ ██║   ██║   █████╗  ██████╔╝██║   ██║██║█████╗  ██║   ███████║██║
██║██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗╚██╗ ██╔╝██║██╔══╝  ██║   ██╔══██║██║
██║██║ ╚████║   ██║   ███████╗██║  ██║ ╚████╔╝ ██║███████╗██║██╗██║  ██║██║
╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝╚═╝╚═╝╚═╝  ╚═╝╚═╝
```

### AI-Powered Mock Interview Platform

**Hack2Hire 2026 · nsaidTalks**

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-Visit_App-8b5cf6?style=for-the-badge)](YOUR_DEPLOYED_URL)
[![GitHub](https://img.shields.io/badge/REPO-Public-10b981?style=for-the-badge)](YOUR_REPO_URL)
[![Built With](https://img.shields.io/badge/Built_With-VS_Code-007ACC?style=for-the-badge&logo=visualstudiocode)](https://code.visualstudio.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)

</div>

---

## 🎥 Demo

> Click below to watch the full walkthrough

**[▶ Watch Live Demo](YOUR_VIDEO_LINK)**

> The recording shows: persona selection, a live adaptive interview session, real-time difficulty escalation, the "Why This Score" breakdown, communication analysis, radar chart, and the hiring decision report.

---

<div align="center">

## What makes this different

| Other AI Interview Tools | InterviewAI |
|:-------------------------|:------------|
| One generic interviewer | 4 distinct interviewer personalities |
| Numbers only | "Why this score" with per-dimension reasoning |
| No memory between questions | Full session memory, AI references your prior answers |
| No communication tracking | Filler words, confidence, structure analysis |
| Basic score report | Radar chart, hiring decision, improvement roadmap |
| Static difficulty | Real-time adaptive difficulty with visible transitions |

</div>

---

## 🧠 The Engine

This is **not a chatbot wrapper.** It is a state-based adaptive interview intelligence engine with deterministic scoring rules, session memory, and termination logic modeled on real hiring processes.

```
Interview State Machine
────────────────────────────────────────────────
SETUP  ──▶  ANALYZING  ──▶  INTERVIEWING
                                  │
                            ┌─────▼─────┐
                            │ EVALUATING │
                            └─────┬─────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │       SCORE REVEAL         │
                    └──────┬───────────┬─────────┘
                           │           │
                    ┌──────▼──┐   ┌────▼──────┐
                    │CONTINUE │   │TERMINATED │
                    └──────┬──┘   └────┬──────┘
                           │           │
                    ┌──────▼───────────▼──────┐
                    │       FINAL REPORT       │
                    └─────────────────────────┘
```

---

## ⚡ 4 Interviewer Personalities

```
┌──────────────────┬────────────────────────────────────────────────────────┐
│  ⚡  FAANG       │  Google/Meta level. Optimal solutions, edge cases,     │
│                  │  scalability, system design. Uncompromising.           │
├──────────────────┼────────────────────────────────────────────────────────┤
│  🚀  Startup     │  Fast-paced, pragmatic. Values ownership and shipping   │
│                  │  mentality. Product-minded questions.                  │
├──────────────────┼────────────────────────────────────────────────────────┤
│  😊  Friendly    │  Warm, supportive, constructive. Encourages candidates │
│                  │  to show their best while staying technically sharp.   │
├──────────────────┼────────────────────────────────────────────────────────┤
│  🎯  Strict      │  Demanding. High standards. Immediately identifies     │
│                  │  vagueness, gaps, and incomplete reasoning.            │
└──────────────────┴────────────────────────────────────────────────────────┘
```

---

## 📊 Scoring System

Every answer is evaluated on **5 independent dimensions** (20 points each):

```
┌─────────────────────┬──────────────────────────────────────────────────┐
│  Dimension          │  What it measures                                │
├─────────────────────┼──────────────────────────────────────────────────┤
│  🎯 Accuracy        │  Factual and technical correctness               │
│  💬 Clarity         │  Structure, communication, ease of understanding │
│  🔬 Depth           │  Thoroughness, examples, edge case awareness      │
│  📌 Relevance       │  Directly addresses what was asked               │
│  ⚡ Time Efficiency │  Deterministic formula based on time used         │
└─────────────────────┴──────────────────────────────────────────────────┘

  Total per question: 100 pts
  Final score: weighted average (Easy x1.0, Medium x1.3, Hard x1.6)
```

> Time Efficiency is computed **client-side** using a deterministic formula. It is never delegated to AI, so it cannot be manipulated by prompt phrasing.

---

## 🔴 Termination Rules

The interview ends early if either condition is triggered (just like a real screening):

```
  Rule A:  2 consecutive answers score below 30/100
  Rule B:  3-question rolling average drops below 35/100
           (checked after every question, once 3+ answers exist)
```

---

## 🔼 Adaptive Difficulty

```
  Score >= 70  ──▶  ESCALATE  (Easy -> Medium -> Hard)
  Score 40-69  ──▶  MAINTAIN  (stay at current level)
  Score < 40   ──▶  REDUCE    (Hard -> Medium -> Easy)
```

A visible banner appears on screen whenever difficulty shifts, showing the exact score and threshold that triggered it.

---

## 💬 Communication Analysis

Tracked **client-side with zero extra API calls** using heuristic analysis:

```
  Word Count      Measures verbosity (too brief / good / verbose)
  Filler Words    Detects: um, uh, like, basically, you know, i guess...
  Structure Score Detects: first, however, therefore, for example...
  Confidence      Penalises: i think, maybe, not sure, i believe...
```

Shown per-question on the score reveal screen, and aggregated across all answers in the final report.

---

## 🔗 Session Memory

The AI receives the last 3 questions **and the candidate's actual answers** before generating each new question. When it references something from a previous response, a memory indicator appears:

```
  🔗 Memory reference: "Earlier you mentioned Redis for rate limiting..."
```

This makes the interview feel like a real conversation, not a list of disconnected questions.

---

## 📋 Final Report

The report is built to feel **recruiter-grade**:

```
  ┌─────────────────────────────────┐
  │   HIRING DECISION               │
  │   ✦ ✦ ✦  Strong Hire           │  <- most prominent element
  └─────────────────────────────────┘

  Score Dial (animated)    +    Skill Radar Chart (SVG pentagon)
  Skill Performance Bars (animated)
  Communication Analysis (aggregated)
  Strengths vs Areas to Improve
  Improvement Roadmap (priority-tagged: High / Medium / Low)
  Hiring Recommendation (written in the selected persona's voice)
  Question-by-Question Review (expandable, with Why Strong / Why Weak)
```

**Hiring Decision verdicts:**

| Score | Verdict |
|:-----:|:--------|
| 85+ | ✦✦✦ Strong Hire |
| 70-84 | ✦✦ Hire |
| 50-69 | ✦ Borderline |
| 35-49 | No Hire |
| Below 35 | No Hire |

---

## 🛠 Tech Stack

```
  Language:     JavaScript (React 18)
  Editor:       Visual Studio Code
  AI Model:     Claude Sonnet 4 via Anthropic API
  Charts:       Custom SVG (no chart libraries)
  Styling:      Inline React styles + injected CSS keyframes
  Fonts:        Space Grotesk + Inter (Google Fonts)
  Build:        Single HTML file (no bundler required)
  Hosting:      GitHub Pages / Vercel
```

---

## 🚀 Run It Locally

**Option 1: Open directly in browser (no setup)**

```bash
# Download InterviewAI.html and double-click it
# That is literally all you need to do
```

**Option 2: Run with Vite (for development)**

```bash
git clone https://github.com/YOUR_USERNAME/hack2hire-interviewai
cd hack2hire-interviewai
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## 📁 Project Structure

```
hack2hire-interviewai/
│
├── InterviewAI.html          Single-file deployable (open in browser)
│
├── src/
│   ├── App.jsx               Complete platform source (1039 lines)
│   └── main.jsx              React entry point
│
├── index.html                Vite entry point
├── package.json
├── vite.config.js
└── README.md
```

**Inside `App.jsx`:**

```
  PERSONAS         4 interviewer modes with distinct system prompts
  analyzeComm()    Client-side communication heuristics (no API call)
  getHiringDecision()  Score to hiring verdict mapping
  genQuestion()    Adaptive question generation with session memory
  evalAnswer()     5-dimension scoring + Why This Score breakdown
  genReport()      Full report with roadmap and hiring recommendation
  RadarChart       Custom SVG spider chart component
  CommCard         Communication metrics display component
  App              State machine + all render phases
```

---

## 👩‍💻 Built By

**[Your Name]** · [LinkedIn] · [Email]

Coded entirely in **Visual Studio Code**.

Submitted for **Hack2Hire 2026** by nsaidTalks.

---

<div align="center">

*"Not just another AI chatbot. A state-based adaptive interview intelligence engine."*

</div>
