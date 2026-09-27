# services/embeddings.py
# Turns text into vectors (lists of numbers) so we can later find
# which textbook chunks are relevant to a student's question by
# comparing vectors.
#
# Runs locally (fastembed, running the same all-MiniLM-L6-v2 model as
# an ONNX file) rather than calling a cloud API. Reasons: it has no
# rate limits or daily quota - important since embedding a full
# textbook needs thousands of calls - it outputs 384-dimension
# vectors, which is exactly the "vector(384)" column type already
# defined on pdf_chunks.embedding in Supabase, and unlike the
# sentence-transformers/PyTorch version we started with, it doesn't
# need PyTorch at runtime - which matters on a memory-limited host
# like Render's free tier, where PyTorch alone was enough to run out
# of the available 512MB. (Verified the two give effectively
# identical vectors - cosine similarity ~0.999999998 on a sample
# sentence - so chunks already embedded with the old model stay
# usable; no re-embedding needed.)
#
# The same model must be used to embed both the textbook chunks
# (when uploading a PDF) and the student's question (when searching
# it in services/retrieval.py) - otherwise the vectors aren't
# comparable. Don't switch one without the other.

from fastembed import TextEmbedding

EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM = 384

# Loaded once and reused - loading the model from disk takes a
# second or two, so we don't want to repeat that for every request.
_model: TextEmbedding | None = None


def _get_model() -> TextEmbedding:
    global _model
    if _model is None:
        _model = TextEmbedding(model_name=EMBEDDING_MODEL_NAME)
    return _model


def embed_text(text: str) -> list[float]:
    """Embeds a single piece of text (e.g. a student's question)."""
    model = _get_model()
    return next(model.embed([text])).tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embeds many pieces of text (e.g. all chunks of a PDF)."""
    if not texts:
        return []
    model = _get_model()
    return [vec.tolist() for vec in model.embed(texts)]
