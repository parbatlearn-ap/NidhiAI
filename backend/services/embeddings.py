# services/embeddings.py
# Turns text into vectors (lists of numbers) so we can later find
# which textbook chunks are relevant to a student's question by
# comparing vectors.
#
# Runs locally (sentence-transformers' all-MiniLM-L6-v2 model) rather
# than calling a cloud API. Two reasons: it has no rate limits or
# daily quota - important since embedding a full textbook needs
# thousands of calls - and it outputs 384-dimension vectors, which is
# exactly the "vector(384)" column type already defined on
# pdf_chunks.embedding in Supabase.
#
# The same model must be used to embed both the textbook chunks
# (when uploading a PDF) and the student's question (when searching
# it in services/retrieval.py) - otherwise the vectors aren't
# comparable. Don't switch one without the other.

from sentence_transformers import SentenceTransformer

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384

# Loaded once and reused - loading the model from disk takes a
# second or two, so we don't want to repeat that for every request.
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model


def embed_text(text: str) -> list[float]:
    """Embeds a single piece of text (e.g. a student's question)."""
    model = _get_model()
    return model.encode(text, normalize_embeddings=True).tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embeds many pieces of text (e.g. all chunks of a PDF)."""
    if not texts:
        return []
    model = _get_model()
    return model.encode(texts, normalize_embeddings=True, show_progress_bar=False).tolist()
