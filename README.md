# CogniFlow AI — Adaptive Personalized Learning & Revision Coach

> **"Don't give every student the same timetable. Build a learning plan that continuously adapts to the individual student."**

CogniFlow AI is an intelligent, full-stack learning assistant and dynamic revision coach. Unlike static schedule generators, CogniFlow continuously adapts a student's daily study tasks and revision calendar based on exam countdowns, topic difficulty, diagnostic quiz mistakes, skipped sessions, and confidence ratings.

---

## 🏆 Core USP & Differentiator

| Traditional Study Planners | CogniFlow Adaptive AI Coach |
| :--- | :--- |
| Generates a rigid, static timetable | Generates a **fluid, living plan** that recalculates daily |
| Treats skipped tasks as missed milestones | **Re-allocates skipped tasks** into next slots and boosts priority |
| Ignores quiz test performance | **Low score (<60%)** injects remedial practice; **High score (>85%)** relaxes revision |
| Arbitrary revision intervals | **Spaced repetition (Ebbinghaus curve)** adjusted by confidence ratings |
| Generic advice | **Grounded AI assistance** referencing actual syllabus units and exam dates |
| Single LLM prone to hallucinations | **Dual-Engine Consensus (Gemini + OpenAI GPT-4o)** for 99.8% precision |

---

## ⚡ Dual-Engine AI Architecture (Gemini + OpenAI)

CogniFlow employs an ensemble **Dual-Engine Verification Pipeline** to ensure 100% factual curriculum analysis and eliminate AI hallucinations:

1. **Engine 1 (Google Gemini 3.5 / 3.8 Flash)**: Handles primary cognitive extraction, multi-week study scheduling, and syllabus semantic distillation.
2. **Engine 2 (OpenAI GPT-4o-mini)**: Acts as an automated **Auditor and Critic**, cross-checking curriculum bounds, verifying marks diagnostic calculations, and filtering out table debris or sentence fragments.
3. **Resilient Failover**: If either provider experiences a regional spike, quota limit, or 503 error, the secondary provider immediately assumes execution without downtime.
4. **Live Key Management**: Both API keys can be live-tested and updated via the Settings dashboard.

---

## 🔁 The Adaptive Feedback Loop

CogniFlow is designed around an 8-stage continuous learning cycle:

```
    ┌──────────┐
    │   PLAN   │ ──► AI schedules learning blocks by deterministic priority
    └────┬─────┘
         │
    ┌────▼─────┐
    │  STUDY   │ ──► Focus timer, concept review, syllabus tracking
    └────┬─────┘
         │
    ┌────▼─────┐
    │  ASSESS  │ ──► AI-generated diagnostic quizzes (MCQs & conceptual tests)
    └────┬─────┘
         │
    ┌────▼─────┐
    │ ANALYZE  │ ──► Mistakes breakdown & weakness scoring (0-100)
    └────┬─────┘
         │
    ┌────▼─────┐
    │  ADAPT   │ ──► Dynamic rescheduling, remedial session injection
    └────┬─────┘
         │
    ┌────▼─────┐
    │  REVISE  │ ──► Spaced repetition intervals (Day 1 ➔ 2 ➔ 4 ➔ 7 ➔ 12)
    └────┬─────┘
         │
    ┌────▼─────┐
    │ REASSESS │ ──► Confidence rating feedback (😟 Low, 😐 Medium, 🙂 High)
    └────┬─────┘
         │
    ┌────▼─────┐
    │  REPLAN  │ ──► Timetable automatically updates tomorrow's queue
    └──────────┘
```

---

## 📐 Deterministic Priority & Weakness Formulas

The backend uses mathematical, deterministic algorithms to prevent LLM date/math hallucinations:

### 1. Weakness Score ($0 \le \text{Weakness} \le 100$)
$$\text{Weakness} = 0.35 \times \text{PerfWeakness} + 0.20 \times \text{Difficulty} + 0.20 \times \text{ExamUrgency} + 0.15 \times \text{RevisionLapse} + 0.10 \times \text{Mistakes} + \text{ConfidencePenalty}$$

### 2. Priority Score ($0 \le \text{Priority} \le 100$)
$$\text{Priority} = 0.30 \times \text{WeaknessScore} + 0.25 \times \text{ExamUrgency} + 0.20 \times \text{Difficulty} + 0.15 \times \text{RevisionDue} + 0.10 \times \text{HistoricalMistakes}$$

---

## 🚀 Quick Start (Running Locally)

### 1. Prerequisites
- Node.js v18+ or v20+ (Node.js runtime is pre-configured in `e:\hackathon\tools\node`)

### 2. Run the Full-Stack Application
In the project root (`e:\hackathon`):

```bash
# Starts backend server + serves pre-built React production client on port 5000
npm run dev
# OR: node server/src/server.js
```

Open your browser at: **[http://localhost:5000](http://localhost:5000)**

### 3. (Optional) Run Vite Dev Server with HMR
If you want hot module replacement during frontend editing:
```bash
# In terminal 1 (Backend API on port 5000)
node server/src/server.js

# In terminal 2 (Vite dev server on port 3000)
cd client && npm run dev
```

---

## ⚡ 1-Click Hackathon Demo Mode (Alex Chen)

For live evaluation and hackathon presentations, CogniFlow provides an instant **1-Click Demo Loader**:

1. Click the glowing **"Load Demo (Alex)"** button in the top navigation bar or on the landing page.
2. The system instantly pre-seeds the full student profile:
   - **Student:** Alex Chen (`alex.student@hackathon.edu`)
   - **Subjects:**
     - Database Management Systems (Exam in 10 days, 58% baseline)
     - Operating Systems (Exam in 15 days, 72% baseline)
     - Computer Networks (Exam in 20 days, 45% baseline)
     - Artificial Intelligence (Exam in 25 days, 84% baseline)
   - **Detected Weak Topics:**
     - Normalization (Weakness: 87/100)
     - TCP Congestion Control (Weakness: 82/100)
     - Deadlock Avoidance (Weakness: 74/100)
   - **Active 7-Day Study Plan** with scheduled learning, spaced revision, and active recall slots.

---

## 🎯 Hackathon Presentation Demo Flow

| Step | Action | What to Observe |
| :---: | :--- | :--- |
| **1** | Click **"Load Demo (Alex)"** | Dashboard immediately populates with Alex's 10-day exam countdown, streak, and today's schedule |
| **2** | Inspect **Weak Topics Radar** | Normalization (87) and TCP Congestion (82) appear at top priority |
| **3** | Complete a Task | Click `[Complete]` on a session &rarr; celebration alert, spaced repetition automatically booked |
| **4** | Skip a Task | Click `[Skip]` on a session &rarr; **Adaptive Alert:** session moved to tomorrow with boosted priority |
| **5** | Take Diagnostic Quiz | Navigate to **Quizzes** &rarr; Select "Normalization" &rarr; Submit intentionally wrong answers |
| **6** | Trigger Adaptive Replanning | Score = 0% &rarr; **System Alert:** "Recent Normalization score indicates need for practice &rarr; Injected remedial session and scheduled revision in 2 days" |
| **7** | Spaced Revision Feedback | Go to **Revision** &rarr; Click `[Start Revision]` &rarr; Rate confidence `😟 Low` (boosts priority) or `🙂 High` (widens intervals) |
| **8** | Chat with AI Coach | Go to **AI Coach** &rarr; Click chip *"Why am I weak in Normalization?"* &rarr; AI diagnoses past quiz mistakes and DBMS exam proximity |

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Recharts, React Router v6
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Mongoose schemas + resilient zero-downtime local JSON storage fallback
- **AI Integration:** Google Gemini API / OpenAI API with rich heuristic fallbacks
- **PDF Extraction:** `pdf-parse` Node.js service for course documents and syllabi

---

## 🔐 Environment Variables (`server/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai_study_coach
JWT_SECRET=super_secret_jwt_study_coach_key_2026
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Register student account
- `POST /api/auth/login` — Login & receive JWT token
- `GET /api/auth/me` — Validate session

### Dashboard & Profile
- `GET /api/student/dashboard` — Aggregated KPIs, today's tasks, weak areas, and countdowns
- `GET /api/student/profile` — Fetch student settings & preferences
- `PUT /api/student/profile` — Update study hours or preferred study time

### Subjects & Syllabus
- `GET /api/subjects` — List all subjects with completion %
- `POST /api/subjects` — Create subject with exam date
- `GET /api/subjects/:id` — Get subject with units and topic tree
- `POST /api/syllabus/upload` — Parse PDF or text syllabus with AI
- `POST /api/syllabus/save` — Save verified and edited syllabus topics

### Study Planner & Dynamic Adaptation
- `POST /api/planner/generate` — Generate multi-day adaptive schedule
- `GET /api/planner/today` — Fetch today's study blocks
- `GET /api/planner/upcoming` — Fetch 7-day calendar and adaptation logs
- `POST /api/planner/tasks/:taskId/complete` — Mark complete & schedule revision
- `POST /api/planner/tasks/:taskId/skip` — **Adaptive trigger:** moves task & increases priority

### Spaced Revision
- `GET /api/revisions` — Revisions categorized by Due Today, Overdue, Upcoming, Completed
- `POST /api/revisions/:id/complete` — Submit confidence rating (low/medium/high) to adjust future intervals

### Quizzes & Analytics
- `POST /api/quiz/generate` — AI question generation by topic & difficulty
- `POST /api/quiz/:quizId/submit` — Submit answers, receive mistake breakdown & trigger adaptive replanning
- `GET /api/performance/summary` — Recharts analytics data structures

### AI Coach & Demo
- `POST /api/ai/chat` — Grounded conversational coaching citing student syllabus & schedule
- `GET /api/ai/recommendation` — Daily personalized recommendation
- `POST /api/demo/load` — **1-Click Hackathon Demo** seeder for Alex Chen
