# NidhiAI Backend

This folder contains the backend server for NidhiAI, an AI tutoring
platform for Class 8-10 Maharashtra Board students.

Right now this is a basic skeleton built with **FastAPI** (a Python
web framework), with a starting connection to **Supabase** (our
database) so we can confirm both the server and the database wiring
work before adding real features.

## What's in this folder

- `main.py` — the FastAPI application. Registers all the endpoints
  below.
- `config.py` — loads settings (API keys, URLs) from the project's
  `.env` file
- `database.py` — creates the shared Supabase client using those
  settings
- `auth.py` — checks who's making a request. `get_current_user`
  requires any valid login; `require_admin` additionally requires
  `role = 'admin'`. Used as a dependency on protected endpoints.
- `.env.example` — a template showing which environment variables
  are needed (copy it to `.env` in the project root and fill in real
  values — never commit the real `.env` file)
- `requirements.txt` — the list of Python packages this project needs
- `routers/` — the API endpoints, grouped by feature:
  - `/` and `/health` (in `main.py`) — confirm the server is running,
    and whether Supabase is configured correctly (public, no login)
  - `auth.py` — `POST /auth/signup` (email + password + full_name;
    `role` defaults to `student`, and `admin` can't be self-assigned —
    promote an account to admin directly in Supabase), `POST
    /auth/login` (returns an access token), `GET /auth/me` (current
    user's profile). Passwords are handled entirely by Supabase Auth —
    this backend never stores them.
  - `subjects.py` — `GET /subjects` (any logged-in user) and `POST
    /subjects` (admins only), backed by the `subjects` table in
    Supabase
  - `infographics.py` — `POST /infographics/generate` (any logged-in
    user; give it a topic like "Photosynthesis", get back a
    hand-drawn-style infographic) and `GET /infographics/{id}/download`
    (download it as PNG or PDF)
  - `ask.py` — `POST /ask` (any logged-in user; send a question, get
    back a simple tutor-style explanation). If a relevant textbook
    PDF has been uploaded, the answer is grounded in it
    (`used_textbook: true`, plus which `source_pages` it used);
    otherwise it falls back to general knowledge.
  - `pdf_documents.py` — `POST /pdf-documents/upload` (admins only;
    multipart form: `subject_id` + `file`). Stores the PDF in
    Supabase Storage, extracts and chunks its text, and embeds each
    chunk so `/ask` can search it later.

Endpoints marked "admins only" or "any logged-in user" require an
`Authorization: Bearer <access_token>` header — get a token from
`POST /auth/login` first.
- `services/` — the AI logic behind the endpoints above:
  - `infographic_content.py` — turns a topic into a short title +
    key points. Uses Gemini if `GEMINI_API_KEY` is set (this is a
    small, well-defined task, so it's kept off Groq); falls back to
    Groq automatically if Gemini isn't configured.
  - `infographic_render.py` — draws those points as a sketchy,
    hand-drawn-style image using Pillow
  - `tutor.py` — asks Groq's AI to answer a student's question in
    simple language (the core tutoring feature stays on Groq),
    optionally grounded in textbook excerpts
  - `pdf_ingest.py` — extracts text from an uploaded PDF and splits
    it into overlapping ~800-character chunks
  - `embeddings.py` — turns text into vectors so chunks can be
    searched by meaning. Runs locally (fastembed running the
    all-MiniLM-L6-v2 model as ONNX, downloaded once and cached)
    rather than calling a cloud API - no rate limits or daily quota,
    which matters once you're embedding whole textbooks, and (unlike
    the PyTorch-based sentence-transformers library it replaced) a
    small enough memory footprint to run on a free-tier host
  - `scripts/ingest_textbooks.py` — bulk-uploads every PDF in a
    folder as one standard's textbooks in one go, e.g.
    `python scripts/ingest_textbooks.py "path\to\Class 9 Books_PDF" 9th`
  - `retrieval.py` — given a question, finds the most relevant
    textbook chunks via Supabase's vector search (the
    `match_pdf_chunks` Postgres function)
- `generated/` — infographic PNG/PDF files created at runtime (not
  committed to git — it's output, not source code)

## Setting up your `.env` file

The real `.env` file lives in the **project root** (`E:\NidhiAI\.env`,
one level above this `backend` folder), not inside `backend/`. This
keeps one shared set of secrets for the whole project (backend,
frontend, etc.) instead of duplicating them.

1. Look at `.env.example` in this folder to see which variables are
   needed.
2. Make sure the real `.env` file in the project root has real values
   for each one (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, etc.).
3. Never commit `.env` to git — it's already listed in the project's
   `.gitignore`, so `git status` should never show it as a change to
   commit. If it ever does, stop and double check before committing.

## How to run it locally

These steps assume you have Python 3.9+ installed. If you're not
sure, open a terminal and run `python --version` to check.

### 1. Open a terminal in this folder

Navigate to the `backend` folder in your terminal:

```bash
cd backend
```

### 2. Create a virtual environment (recommended)

A virtual environment keeps this project's Python packages separate
from other projects on your computer.

```bash
python -m venv venv
```

Activate it:

- On Windows (PowerShell):
  ```bash
  venv\Scripts\activate
  ```
- On Mac/Linux:
  ```bash
  source venv/bin/activate
  ```

You'll know it worked because your terminal prompt will show
`(venv)` at the start of the line.

### 3. Install the required packages

```bash
pip install -r requirements.txt
```

### 4. Start the server

```bash
python -m uvicorn main:app --reload
```

- `main` refers to the `main.py` file
- `app` refers to the FastAPI instance inside it
- `--reload` automatically restarts the server whenever you save a
  code change, which is handy while developing
- We use `python -m uvicorn` (not just `uvicorn`) so it always runs
  with the same Python that `pip install` used. If your computer has
  more than one Python installed (e.g. Anaconda and python.org, like
  this project's dev machine), a bare `uvicorn` command can silently
  pick the wrong one and fail to find packages you just installed.

### 5. Test that it works

Once the server is running, you should see a message like:

```
Uvicorn running on http://127.0.0.1:8000
```

Open your browser and visit:

- http://127.0.0.1:8000/ — should show
  `{"message": "NidhiAI backend is running"}`
- http://127.0.0.1:8000/health — should show
  `{"status": "ok", "supabase_configured": true}`. If
  `supabase_configured` is `false`, double check your `.env` file has
  real values for `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

You can also visit http://127.0.0.1:8000/docs to see FastAPI's
automatic interactive API documentation.

## Next steps

This is intentionally minimal for now — just enough to prove the
server starts, responds, and can reach Supabase. Features like
authentication and actual tutoring endpoints will be added in future
steps.
