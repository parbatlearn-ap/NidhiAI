# NidhiAI Frontend

This is the website students and parents actually use — built with
**React**, **TypeScript**, and **Vite** (a fast dev server/bundler),
styled with **Tailwind CSS**, and animated with **Framer Motion**.

## What's in this folder

- `src/pages/` — one file per page:
  - `Landing.tsx` — the public marketing homepage
  - `Login.tsx` / `Signup.tsx` — authentication
  - `Dashboard.tsx` — the logged-in home screen, with quick actions
    and a preview of available subjects
  - `AskTutor.tsx` — the chat-style tutoring screen (calls `POST /ask`)
  - `Infographics.tsx` — generate and download hand-drawn infographics
    (calls `POST /infographics/generate` and the download endpoint)
  - `Subjects.tsx` — browse subjects; admins also get an "Add subject"
    button here
- `src/components/layout/AppShell.tsx` — the sidebar + top bar shown
  on every logged-in page
- `src/components/ui/` — reusable building blocks (buttons, inputs,
  cards, the animated background, and a `Markdown` component that
  renders the AI's formatted answers properly instead of showing raw
  `**bold**`/tables)
- `src/lib/api.ts` — every backend API call lives here, plus a shared
  axios client that automatically attaches the login token
- `src/lib/auth-store.ts` — remembers who's logged in (using
  `zustand`, saved to the browser's local storage so refreshing the
  page doesn't log you out)
- `src/App.tsx` — routing, and protects `/app/*` pages so only logged
  in users can see them

## Setting up your `.env` file

Copy `.env.example` to `.env` in this folder if you need to point at a
backend that isn't running on `http://127.0.0.1:8000` (for example,
once the backend is deployed somewhere). For local development you
usually don't need a `.env` file at all — it defaults to
`http://127.0.0.1:8000`.

## How to run it locally

### 1. Install dependencies (first time only)

```bash
cd frontend
npm install
```

### 2. Make sure the backend is running

The frontend needs the backend (see `../backend/README.md`) running
at `http://127.0.0.1:8000` — start that first in its own terminal.

### 3. Start the dev server

```bash
npm run dev
```

Visit the URL it prints (usually `http://localhost:5173`). The page
auto-reloads whenever you save a change.

### 4. Build for production

```bash
npm run build
```

This creates an optimized `dist/` folder (not committed to git — it's
a build output, not source code) that can be deployed to any static
host (Netlify, Vercel, etc.) once you're ready to go live.

## Notes

- CORS: the backend (`backend/main.py`) allows requests from any
  origin during development, so the dev server can talk to it without
  extra setup.
- Login sessions are stored in the browser's local storage. Signing
  out clears them; they also don't sync between different browsers or
  devices (a real "remember me across devices" system would need the
  backend to issue refresh tokens the frontend rotates automatically
  — not needed yet at this stage).
