# services/language_gate.py
# Temporary stopgap: the Hindi and Marathi textbook text stored in
# pdf_chunks is corrupted (pypdf mis-extracts Devanagari), and the
# English-only embedding model can't search it meaningfully anyway. Until
# that's fixed, NidhiAI must never answer using Hindi/Marathi content:
#   1. questions containing Devanagari, or asked under a Hindi/Marathi
#      subject, are refused outright (no LLM call);
#   2. chunks from Hindi/Marathi PDFs are dropped from retrieval, so an
#      English question can't pull corrupted chunks either.
# Remove this module (and its call sites) once the text is re-ingested.

import re
import time

from database import supabase

LANGUAGE_GATE_MESSAGE = (
    "Hindi and Marathi questions are temporarily unavailable while we fix "
    "the textbook data. Please ask about another subject."
)

# Devanagari block, U+0900-U+097F (Hindi, Marathi, Sanskrit, ...).
_DEVANAGARI_RE = re.compile("[ऀ-ॿ]")

GATED_SUBJECT_NAMES = ("hindi", "marathi")

# Subject/PDF ids rarely change (admin uploads), so cache the lookup for
# a few minutes instead of querying Supabase on every question.
_CACHE_TTL_SECONDS = 300
_cache: dict = {"at": 0.0, "subject_ids": set(), "pdf_ids": set()}


def contains_devanagari(text: str | None) -> bool:
    return bool(text) and _DEVANAGARI_RE.search(text) is not None


def _is_gated_subject_name(name: str | None) -> bool:
    return bool(name) and name.strip().lower() in GATED_SUBJECT_NAMES


def _load_gated_ids() -> dict:
    """Subject ids and PDF ids that belong to a Hindi/Marathi subject."""
    now = time.monotonic()
    if _cache["at"] and now - _cache["at"] < _CACHE_TTL_SECONDS:
        return _cache
    if supabase is None:
        return _cache

    subjects = supabase.table("subjects").select("id,name").execute().data or []
    subject_ids = {s["id"] for s in subjects if _is_gated_subject_name(s["name"])}

    pdf_ids: set[str] = set()
    if subject_ids:
        docs = (
            supabase.table("pdf_documents")
            .select("id")
            .in_("subject_id", list(subject_ids))
            .execute()
            .data
            or []
        )
        pdf_ids = {d["id"] for d in docs}

    _cache.update(at=now, subject_ids=subject_ids, pdf_ids=pdf_ids)
    return _cache


def gated_pdf_ids() -> set[str]:
    """ids of PDFs that must never be used for retrieval."""
    return _load_gated_ids()["pdf_ids"]


def check_language_gate(
    text: str, subject: str | None = None, subject_id: str | None = None
) -> str | None:
    """Returns the reason the request must be refused, or None if it may
    proceed. Logs every block. Never logs the question text itself."""
    reason = None
    if contains_devanagari(text):
        reason = "question contains Devanagari characters"
    elif _is_gated_subject_name(subject):
        reason = f"selected subject is {subject.strip()}"
    elif subject_id and subject_id in _load_gated_ids()["subject_ids"]:
        reason = "selected subject_id belongs to a Hindi/Marathi subject"

    if reason:
        print(f"[language-gate] blocked: {reason}")
    return reason
