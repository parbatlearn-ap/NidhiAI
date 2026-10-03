# services/pdf_ingest.py
# Turns an uploaded PDF into searchable pieces: extract text per
# page, split it into smaller chunks, embed each chunk, and hand
# back rows ready to insert into pdf_chunks.

from services.embeddings import embed_texts
from services.pdf_text import extract_pages

# Roughly how many characters per chunk. Small enough that each
# chunk stays focused on one idea, big enough to keep the total
# number of chunks (and embedding calls) reasonable for a textbook -
# this matters because Gemini's free tier paces embedding requests,
# so fewer chunks means faster ingestion.
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 150


def _split_into_chunks(text: str) -> list[str]:
    """Splits one page's text into overlapping chunks of roughly
    CHUNK_SIZE characters, breaking on whitespace so words aren't cut
    in half."""
    text = " ".join(text.split())  # normalize whitespace
    if not text:
        return []

    chunks = []
    start = 0
    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        if end < len(text):
            # Prefer to break at the last space before the limit,
            # so we don't split a word across two chunks.
            last_space = text.rfind(" ", start, end)
            if last_space > start:
                end = last_space

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break
        start = end - CHUNK_OVERLAP
    return chunks


def build_chunks_with_embeddings(pdf_bytes: bytes) -> tuple[int, list[dict]]:
    """Extracts text, chunks it per page, and embeds every chunk.

    Returns (total_pages, chunk_rows), where each chunk_row is
    {"content": ..., "page_number": ..., "embedding": [...]}, ready
    to attach a pdf_id and insert into pdf_chunks.
    """
    pages = extract_pages(pdf_bytes)

    pending_content: list[str] = []
    pending_pages: list[int] = []
    for page_number, page_text in enumerate(pages, start=1):
        for chunk_text in _split_into_chunks(page_text):
            pending_content.append(chunk_text)
            pending_pages.append(page_number)

    if not pending_content:
        return len(pages), []

    embeddings = embed_texts(pending_content)

    chunk_rows = [
        {"content": content, "page_number": page_number, "embedding": embedding}
        for content, page_number, embedding in zip(pending_content, pending_pages, embeddings)
    ]
    return len(pages), chunk_rows
