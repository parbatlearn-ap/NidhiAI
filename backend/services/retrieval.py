# services/retrieval.py
# Given a student's question, finds the most relevant chunks of
# uploaded textbook PDFs (if any exist) using vector similarity
# search - this is the "R" (retrieval) in RAG (retrieval-augmented
# generation).

from database import supabase
from services.embeddings import embed_text

MATCH_COUNT = 4
# Cosine similarity ranges roughly -1..1. This threshold is tuned
# for the all-MiniLM-L6-v2 model specifically (see services/
# embeddings.py) - measured against real textbook content, genuinely
# relevant chunks scored ~0.42-0.50 and irrelevant ones ~0.13-0.15,
# so 0.35 sits safely in the gap. Retune if the embedding model ever
# changes.
MIN_SIMILARITY = 0.35


def find_relevant_chunks(question: str, subject_id: str | None = None) -> list[dict]:
    """Returns a list of {"content", "page_number", "similarity"} for
    the chunks most relevant to the question, or an empty list if
    nothing relevant was found (e.g. no PDFs uploaded yet)."""
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

    return [row for row in response.data if row["similarity"] >= MIN_SIMILARITY]
