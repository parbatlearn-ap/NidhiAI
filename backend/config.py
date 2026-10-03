# config.py
# Loads settings (like API keys and URLs) from the .env file so the
# rest of the app can use them without hardcoding secrets in code.

import os
from pathlib import Path
from dotenv import load_dotenv

# The .env file lives in the project root (one level above this
# "backend" folder), so we point load_dotenv() at it directly.
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Read the values we need. os.getenv() returns None if a variable
# is missing, which is useful for the startup check below.
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Optional: only used for small, well-defined tasks (see
# services/infographic_content.py). If it's missing, that one task
# falls back to Groq instead of failing the whole server.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# Minimum cosine similarity the best-matching textbook chunk must reach
# before the AI is allowed to answer at all (see services/retrieval.py).
# Overridable via .env so it can be tuned without a code change.
RELEVANCE_THRESHOLD = float(os.getenv("RELEVANCE_THRESHOLD", "0.75"))


def check_required_settings():
    """
    Warn (rather than crash) if expected settings are missing from
    .env. This keeps the server usable while you're still setting
    things up, but makes it obvious what's not configured yet.
    """
    missing = []
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not SUPABASE_SERVICE_KEY:
        missing.append("SUPABASE_SERVICE_KEY")

    if missing:
        print(f"[config] Warning: missing settings in .env: {', '.join(missing)}")
