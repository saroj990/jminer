# portFolio

Resume CMS and AI-assisted resume builder. Maintain one master professional profile, create multiple resumes, export PDF/Word/JSON, and tailor applications with online or local AI.

---

## Requirements

Before you start, install:

| Tool | Version / notes |
|---|---|
| **Node.js** | 20.x or newer (LTS recommended) |
| **npm** | Comes with Node |
| **Git** | Optional, to clone the repo |

Optional (for full features):

| Tool | Needed for |
|---|---|
| **Ollama** | Local AI mode |
| **Resend account** or **SMTP** | Real verification emails (otherwise links print in the terminal) |
| Free API keys | Gemini / Cerebras / Groq for online AI |

---

## 1. Get the project

```bash
cd "/path/to/Resume Builder"
```

If cloning from Git:

```bash
git clone <your-repo-url>
cd <project-folder>
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at least:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-long-random-string"
AUTH_URL="http://localhost:3000"
```

Generate a secret:

```bash
openssl rand -base64 32
```

### Optional — email verification (production)

**Resend**

```env
RESEND_API_KEY=re_xxx
EMAIL_FROM="portFolio <onboarding@yourdomain.com>"
```

**Or SMTP**

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM="portFolio <noreply@yourdomain.com>"
```

Without Resend/SMTP, verification links are printed in the **server console** and shown on the “Check your email” page (fine for local development).

### Optional — online AI

```env
GEMINI_API_KEY=...
CEREBRAS_API_KEY=...
GROQ_API_KEY=...
AI_DEFAULT_MODE=online
```

Fallback order when mode is **online**: Gemini Flash → Cerebras → Groq.

---

## Local LLM setup (Ollama)

portFolio can run AI features entirely on your machine using **Ollama**. No cloud AI keys are required for local mode.

### Do I need a backend?

**Yes — but you already have one.** This app’s Next.js API routes (`/api/ai/*`) call the LLM. The browser never talks to Ollama directly.

For local AI you run **two processes**:

| Process | Role |
|---|---|
| **Next.js app** (`npm run dev`) | App UI + API (auth, profile, AI routes) |
| **Ollama** | Local LLM server on `http://127.0.0.1:11434` |

You do **not** need a separate custom backend, Python service, or GPU cloud. Ollama *is* the local model server.

Flow:

```
Browser → Next.js /api/ai/* → Ollama (localhost) → response → browser
```

- **Online mode:** Next.js → Gemini / Cerebras / Groq  
- **Local mode:** Next.js → Ollama only  
- Resume **PDF/DOCX import (Local extract)** does not use any LLM  

Sign-in is required for AI assistant features (tailor, ATS, cover letter, write-with-AI).

---

### Step 1 — Install Ollama

1. Download and install from [https://ollama.com](https://ollama.com) (macOS, Windows, or Linux).
2. Open a terminal and confirm it works:

```bash
ollama --version
```

3. Start Ollama if it is not already running (on macOS/Windows the app usually runs in the background).

Quick health check:

```bash
curl http://127.0.0.1:11434/api/tags
```

You should get JSON (even if the model list is empty).

---

### Step 2 — Choose and pull a model

**Default recommendation for 16 GB RAM:** `llama3.1:8b` (best balance of quality and speed for resume JSON tasks).

```bash
ollama pull llama3.1:8b
```

Verify:

```bash
ollama list
```

Optional smoke test:

```bash
ollama run llama3.1:8b "Reply with a short JSON object: {\"ok\": true}"
```

#### Model guide (what to use when)

| Hardware | Recommended model | Pull command | Notes |
|---|---|---|---|
| **16 GB RAM (default)** | **`llama3.1:8b`** | `ollama pull llama3.1:8b` | Best default for tailor / ATS / cover letter |
| 16 GB RAM, want faster | `llama3.2` or `qwen2.5:7b` | `ollama pull llama3.2` | Slightly lighter; still good |
| 8–12 GB RAM | `llama3.2:3b` or `phi3:mini` | `ollama pull llama3.2:3b` | Usable but weaker at strict JSON |
| 24 GB+ RAM / strong Apple Silicon | `llama3.1:8b` or `qwen2.5:14b` | `ollama pull qwen2.5:14b` | Better structure & rewriting |
| NVIDIA GPU 8 GB+ VRAM | `llama3.1:8b` | same | Much faster than CPU-only |
| NVIDIA GPU 16 GB+ VRAM | `qwen2.5:14b` / `llama3.1:70b` (quantized) | as needed | Highest quality local |

Tips:

- Prefer **instruct / chat** models (the tags above are fine with Ollama).
- Resume AI returns **JSON** — 7B–8B models are the sweet spot on 16 GB.
- If the app says local AI failed with empty/invalid JSON, try `llama3.1:8b` or `qwen2.5:7b` instead of a 3B model.

---

### Step 3 — Configure the application (`.env`)

In the project `.env`:

```env
# Local LLM (Ollama)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
AI_DEFAULT_MODE=local
```

| Variable | Meaning |
|---|---|
| `OLLAMA_BASE_URL` | Ollama HTTP API (default `http://127.0.0.1:11434`) |
| `OLLAMA_MODEL` | Exact name from `ollama list` (e.g. `llama3.1:8b`) |
| `AI_DEFAULT_MODE` | `local` = new users / default preference use Ollama; `online` = cloud fallback chain |

Notes:

- `OLLAMA_MODEL` must match a pulled model name exactly.
- You can keep cloud keys set and still use local mode; local mode does not call them.
- After changing `.env`, restart the Next.js server (`Ctrl+C`, then `npm run dev`).

Example `.env` block for local-first on a 16 GB machine:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-long-secret"
AUTH_URL="http://localhost:3000"

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
AI_DEFAULT_MODE=local
```

---

### Step 4 — Configure inside the app (Settings)

1. Start the app: `npm run dev`
2. Register / sign in
3. Open **Settings** (`/settings`)
4. Choose **Local** (Ollama)
5. Confirm the page shows your Ollama base URL and model (from env)
6. Open **Builder** → **AI** panel and run Tailor, ATS, or Cover letter  
   - Or use **Write with AI** under text fields  
   - Optional: set the AI panel override to **Force local** for one request

You can leave `AI_DEFAULT_MODE=online` in `.env` and still switch to Local anytime in Settings — Settings stores the preference per user in the database.

---

### Step 5 — Verify end-to-end

1. Ollama running + model listed: `ollama list`
2. App running: [http://localhost:3000](http://localhost:3000)
3. Signed in → Settings → **Local**
4. Builder → paste a short job description → **Tailor** or **ATS**
5. If it works, the response meta should mention **ollama** and your model name

---

### Local AI troubleshooting

| Issue | Fix |
|---|---|
| `Local AI failed` / connection error | Start Ollama; run `curl http://127.0.0.1:11434/api/tags` |
| Model not found | `ollama pull <name>` and set `OLLAMA_MODEL` to that exact name |
| Very slow on 16 GB | Use `llama3.1:8b` or `llama3.2`; close other heavy apps |
| Nonsense / invalid JSON | Switch to `llama3.1:8b` or `qwen2.5:7b`; avoid tiny 1–3B models for ATS/tailor |
| Works in terminal, not in app | Restart `npm run dev` after `.env` changes; confirm Settings is **Local** |
| Using Docker / remote machine | Point `OLLAMA_BASE_URL` at that host (and allow network access to port 11434) |

---

## 4. Set up the database

```bash
npx prisma migrate dev
```

This creates the SQLite database (`dev.db`) and applies migrations.

Useful extras:

```bash
npx prisma generate    # regenerate Prisma client
npm run db:studio      # open Prisma Studio GUI
```

---

## 5. Run the app (development)

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**.

---

## 6. First-time usage

1. Open `/register` and create an account  
2. Verify your email (inbox, or console/dev link)  
3. Sign in at `/login`  
4. Use **Dashboard**, **Master Profile**, **Resumes**, **Builder**, **Settings**

Guest path (no account): `/builder` still works for local editing/export; syncing and AI require sign-in.

---

## Production build

```bash
npm run build
npm start
```

Ensure `.env` has a strong `AUTH_SECRET` and a real `AUTH_URL` (your deployed URL). For Postgres later, change `DATABASE_URL` and the Prisma `provider`, then re-run migrations.

---

## npm scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm start` | Run production server |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema without migration files |
| `npm run db:studio` | Open Prisma Studio |

---

## Main routes

| Route | Purpose |
|---|---|
| `/` | Landing |
| `/register` | Create account |
| `/login` | Sign in |
| `/verify-email` | Complete email verification |
| `/verify-email/pending` | Waiting for verification email |
| `/dashboard` | Stats and recent activity |
| `/profile` | Master professional profile |
| `/resumes` | Resume library and templates |
| `/builder` | Editor, preview, AI, export |
| `/settings` | AI online/local toggle |

---

## Features

### Accounts & security
- Email/password registration and sign-in (Auth.js)
- Email verification (Resend, SMTP, or console link in development)
- Protected dashboard, profile, resumes library, and settings routes
- Guest access to the builder for local editing and export

### Master profile & CMS
- Single master professional profile as the source of truth
- Sync builder content to the master profile
- Load master profile back into the builder
- Dashboard with profile stats and recent export activity
- Resume library: create, rename, delete, and pick templates
- Version snapshots on exports (when saved)

### Resume builder
- Editable sections: personal details, summary, experience, education, skills, portfolio
- Live preview that updates as you type
- Multiple templates (Classic, Modern, Minimal, ATS Friendly, Executive)
- Sample resume data for quick demos
- Local draft persistence (debounced browser storage)
- Month/year date pickers for roles and education
- “Write with AI” helpers on major text fields

### Experience management
- Add role at the **top** as the latest job when no role is marked current
- Add role at the **end** when a current role is already selected
- **Re-order Experience**: collapse cards to title / company / dates and drag-and-drop to reorder

### Import existing resumes
- Upload **PDF** or **DOCX** — text is extracted in the browser; the file is never stored
- **Local extract**: heuristic parse fills fields offline (no AI)
- **With AI**: open parse endpoint structures extracted text into resume fields
- Load from master profile or saved resume version snapshots

### Export
- PDF export (text-based, ATS-friendly layout)
- Word (DOCX) export
- JSON backup download
- Plain URL text in preview/export for better ATS parsing

### AI assistant
- Job-description resume tailoring
- ATS keyword score with matched / missing keywords and recommendations
- Cover letter generation
- Online mode with fallback: Gemini → Cerebras → Groq
- Local mode via Ollama
- Per-user AI mode preference in Settings (with optional per-request override)

### Product surface
- Marketing landing page
- App shell navigation for signed-in areas
- Responsive builder (edit / preview panes on mobile)

Product scope and future roadmap details live in `context.md`.

---

## Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS  
- **Backend:** Next.js API routes, Auth.js, Prisma, SQLite (default)  
- **Export:** jsPDF, docx  
- **AI:** Gemini, Cerebras, Groq, Ollama  

---

## Troubleshooting

| Issue | What to try |
|---|---|
| App won’t start | Confirm Node 20+, run `npm install`, check `.env` exists |
| DB errors | Run `npx prisma migrate dev` again |
| Can’t sign in | Verify email first; check server logs for the verify link in dev |
| AI fails (online) | Ensure at least one of `GEMINI_API_KEY` / `CEREBRAS_API_KEY` / `GROQ_API_KEY` is set |
| AI fails (local) | See **Local AI troubleshooting** above: Ollama running, `ollama list`, matching `OLLAMA_MODEL`, Settings → Local |
| Port 3000 in use | `npx next dev -p 3001` and update `AUTH_URL` |
