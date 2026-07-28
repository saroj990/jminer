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

### Optional — local AI (Ollama)

1. Install [Ollama](https://ollama.com)
2. Pull a model:

```bash
ollama pull llama3.2
```

3. Keep Ollama running, then in `.env`:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
AI_DEFAULT_MODE=local
```

You can also leave `AI_DEFAULT_MODE=online` and switch to Local anytime in **Settings**.

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

## Features overview

- Auth with email verification  
- Master profile (experiences, education, projects, skills, …)  
- Multiple resumes and templates  
- Live preview + PDF / Word / JSON export  
- AI: tailor resume, ATS score, cover letter  
- AI providers: online fallback or local Ollama  

Product scope details live in `context.md`.

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
| AI fails (local) | Confirm Ollama is running and `ollama list` shows your model |
| Port 3000 in use | `npx next dev -p 3001` and update `AUTH_URL` |
