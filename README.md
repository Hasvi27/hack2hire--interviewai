# InterviewAI — AI-Powered Mock Interview Platform
### Hack2Hire 2026 · Built by [Your Name]

> **State-Based Adaptive Interview Intelligence Engine** — not just another ChatGPT wrapper.

---

## 🎥 Demo Video

<!-- PASTE YOUR SCREEN RECORDING LINK HERE -->
**[▶ Watch Live Demo](YOUR_VIDEO_LINK_HERE)**

> _Screen recording shows: persona selection → live adaptive interview → real-time difficulty escalation → "Why This Score" breakdown → Communication Analysis → Radar chart + Hiring Decision report_

---

## 🚀 Live Demo

**[🔗 View Deployed App](YOUR_VERCEL_URL_HERE)**

---

## What It Does

InterviewAI is a complete mock interview simulation engine that:

- **Analyzes your resume + JD** to extract skills, gaps, and probe areas
- **Generates adaptive questions** across 4 types: Technical, Behavioral, Scenario, Conceptual
- **Enforces strict time limits** (90s/120s/150s) with auto-submit on timeout
- **Scores answers on 5 dimensions**: Accuracy, Clarity, Depth, Relevance, Time Efficiency
- **Adapts difficulty in real-time** based on your performance (Easy → Medium → Hard)
- **Terminates early** if rolling average drops below threshold (just like real interviews)
- **References your previous answers** through session memory
- **Analyzes your communication** — filler words, confidence, structure, verbosity
- **Produces a recruiter-grade report** with radar chart, hiring decision, and roadmap

---

## 4 Interviewer Personalities

| Mode | Style | Best For |
|------|-------|---------|
| ⚡ FAANG | Precision-focused, expects optimal solutions + edge cases | Big tech prep |
| 🚀 Startup | Fast-paced, pragmatic, product-minded | Startup roles |
| 😊 Friendly | Supportive, constructive, encouraging | First-time practice |
| 🎯 Strict | Demanding, no tolerance for vagueness | Competitive roles |

---

## Scoring Engine

```
Per Question (100 pts max):
  Accuracy        0–20  (factual/technical correctness)
  Clarity         0–20  (structured communication)
  Depth           0–20  (thoroughness + examples)
  Relevance       0–20  (stays on topic)
  Time Efficiency 0–20  (deterministic formula, never AI-subjective)

Final Score: weighted average (Easy×1.0, Medium×1.3, Hard×1.6)
```

### Termination Rules
- **Rule A**: 2 consecutive scores below 30/100
- **Rule B**: 3-question rolling average below 35/100

### Adaptive Logic
- Score ≥ 70 → escalate difficulty
- Score < 40 → reduce difficulty
- Score 40–69 → maintain

---

## Tech Stack

- **React 18** (single-component architecture, no backend needed)
- **Claude Sonnet 4** via Anthropic API (question generation, semantic scoring)
- **Client-side** communication analysis (zero extra API calls)
- **SVG** radar chart + circular timer (custom, no chart libraries)
- **Vite** for local dev and build

---

## Running Locally

```bash
git clone https://github.com/YOUR_USERNAME/hack2hire-interviewai
cd hack2hire-interviewai
npm install
npm run dev
```

Open `http://localhost:5173`

> The app uses the Anthropic API internally. No API key setup needed — it's handled by the Claude.ai artifact system.

---

## Project Structure

```
src/
  App.jsx          — Complete platform (1039 lines)
    §1  PERSONAS   — 4 interviewer modes with distinct prompts
    §2  analyzeComm — Client-side communication analysis
    §3  getHiringDecision — Score → hiring verdict mapping  
    §4  genQuestion — Adaptive question gen with session memory
    §5  evalAnswer  — 5-dim scoring + "Why This Score" breakdown
    §6  genReport   — Full report with roadmap + hiring rec
    §7  RadarChart  — SVG spider chart (custom)
    §8  CommCard    — Communication metrics display
    §9  App         — State machine + all render phases
```

---

## Key Differentiators vs Other Submissions

| Feature | Others | InterviewAI |
|---------|--------|-------------|
| Interviewer personality | ❌ | ✅ 4 distinct modes |
| "Why this score" | ❌ | ✅ Per-dimension explanations |
| Session memory | ❌ | ✅ References prior answers |
| Communication analysis | ❌ | ✅ Filler words, structure, confidence |
| Adaptation visibility | ❌ | ✅ Real-time banner |
| Radar chart dashboard | ❌ | ✅ SVG spider chart |
| Hiring decision | ❌ | ✅ Strong Hire / Hire / Borderline / No Hire |
| Improvement roadmap | ❌ | ✅ Priority-tagged action plan |

---

## Contact

**[Your Name]** · [your email] · [LinkedIn]

Built for Hack2Hire 2026 by nsaidTalks
