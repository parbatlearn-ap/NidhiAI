# main.py
# This is the entry point for the NidhiAI backend server.
# FastAPI is the web framework we use to build the API.

from fastapi import FastAPI

from config import check_required_settings
from database import supabase
from routers import subjects, infographics, ask, pdf_documents, auth

# Warn on startup if .env is missing expected values (doesn't crash
# the server, just prints a message in the terminal).
check_required_settings()

# Create the FastAPI application instance.
# This "app" object is what uvicorn runs to start the server.
app = FastAPI(title="NidhiAI Backend")

# Register the /auth, /subjects, /infographics, /ask, and /pdf-documents endpoints.
app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(infographics.router)
app.include_router(ask.router)
app.include_router(pdf_documents.router)


# A simple test endpoint at the root URL ("/").
# Visiting http://127.0.0.1:8000/ in a browser will show this message.
@app.get("/")
def read_root():
    return {"message": "NidhiAI backend is running"}


# A "health check" endpoint, commonly used to confirm the server is alive.
# It also reports whether the Supabase client was set up successfully,
# so we can tell at a glance if .env is configured correctly.
# Visiting http://127.0.0.1:8000/health will show this message.
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "supabase_configured": supabase is not None,
    }
