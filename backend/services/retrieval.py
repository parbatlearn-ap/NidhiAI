# services/retrieval.py
# Given a student's question, finds the most relevant chunks of
# uploaded textbook PDFs (if any exist) using vector similarity
# search - this is the "R" (retrieval) in RAG (retrieval-augmented
# generation).

from config import RELEVANCE_THRESHOLD
from database import supabase
from services.embeddings import embed_text

MATCH_COUNT = 4
# Hard relevance gate. The "similarity" returned by match_pdf_chunks is
# the cosine similarity between the question embedding and the chunk
# embedding (-1..1). If even the best chunk is below this, the question
# is treated as not covered by the textbook and the LLM is never called
# (see routers/ask.py). Set via RELEVANCE_THRESHOLD in .env (default
# 0.75).
#
# NOTE: this model (all-MiniLM-L6-v2) scores genuinely relevant chunks
# fairly low - earlier measurements were ~0.42-0.50 for relevant and
# ~0.13-0.15 for irrelevant. A threshold of 0.75 may therefore reject
# valid questions; check real scores (logged below) and retune.
MIN_SIMILARITY = RELEVANCE_THRESHOLD


def find_relevant_chunks(question: str, subject_id: str | None = None) -> list[dict]:
    """Returns a list of {"content", "page_number", "similarity"} for
    the chunks relevant to the question. Returns an empty list - which
    the caller must treat as "refuse, don't call the LLM" - if the top
    match is below MIN_SIMILARITY, or if nothing could be searched
    (e.g. no PDFs uploaded yet)."""
    if supabase is None:
        return []

    query_embedding = embed_text(question)

    response = supabase.rpc(
        "match_pdf_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": MATCH_COUNT,
            "filter_subject_id": subject_id,
        },
    ).execute()

    rows = response.data or []
    if not rows:
        return []

    top_similarity = max(row["similarity"] for row in rows)
    print(f"[retrieval] top similarity {top_similarity:.3f} (threshold {MIN_SIMILARITY})")
    if top_similarity < MIN_SIMILARITY:
        return []

    return [row for row in rows if row["similarity"] >= MIN_SIMILARITY]
