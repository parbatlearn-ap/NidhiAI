# scripts/ingest_textbooks.py
# Bulk-uploads every PDF in a folder as a textbook for a given
# standard (class), e.g. all of Class 9's books at once. Reuses the
# same pipeline as the /pdf-documents/upload endpoint, just without
# going through the API one file at a time.
#
# Usage (run from the backend/ folder):
#   python scripts/ingest_textbooks.py "E:\NidhiAI\Books_PDF\Class 9 Books_PDF" 9th
#
# Files named like "Maths Part 1.pdf" and "Maths Part 2.pdf" are
# treated as two documents under the same "Maths" subject, since the
# trailing "Part N" is stripped from the subject name.

import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import supabase  # noqa: E402
from services.pdf_ingest import build_chunks_with_embeddings  # noqa: E402

STORAGE_BUCKET = "pdf-documents"
CHUNK_INSERT_BATCH_SIZE = 200


def subject_name_from_filename(filename: str) -> str:
    stem = Path(filename).stem
    return re.sub(r"\s*Part\s*\d+\s*$", "", stem, flags=re.IGNORECASE).strip()


def get_or_create_subject(name: str, standard: str) -> str:
    existing = supabase.table("subjects").select("id").eq("name", name).eq("standard", standard).execute()
    if existing.data:
        return existing.data[0]["id"]
    created = supabase.table("subjects").insert({"name": name, "standard": standard}).execute()
    return created.data[0]["id"]


def ingest_file(path: Path, standard: str) -> None:
    subject_name = subject_name_from_filename(path.name)
    subject_id = get_or_create_subject(subject_name, standard)
    print(f"[{path.name}] subject='{subject_name}' ({standard}) id={subject_id}", flush=True)

    file_bytes = path.read_bytes()
    storage_path = f"{subject_id}/{path.stem.replace(' ', '_')}_{int(time.time())}.pdf"
    supabase.storage.from_(STORAGE_BUCKET).upload(storage_path, file_bytes, {"content-type": "application/pdf"})

    document = (
        supabase.table("pdf_documents")
        .insert(
            {
                "subject_id": subject_id,
                "filename": path.name,
                "storage_path": storage_path,
                "status": "processing",
            }
        )
        .execute()
        .data[0]
    )
    document_id = document["id"]

    start = time.time()
    try:
        total_pages, chunk_rows = build_chunks_with_embeddings(file_bytes)
        for row in chunk_rows:
            row["pdf_id"] = document_id

        for i in range(0, len(chunk_rows), CHUNK_INSERT_BATCH_SIZE):
            supabase.table("pdf_chunks").insert(chunk_rows[i : i + CHUNK_INSERT_BATCH_SIZE]).execute()

        supabase.table("pdf_documents").update(
            {"status": "ready", "total_pages": total_pages}
        ).eq("id", document_id).execute()

        elapsed = time.time() - start
        print(
            f"[{path.name}] done: {total_pages} pages, {len(chunk_rows)} chunks, {elapsed:.0f}s",
            flush=True,
        )
    except Exception as exc:
        supabase.table("pdf_documents").update({"status": "failed"}).eq("id", document_id).execute()
        print(f"[{path.name}] FAILED: {exc}", flush=True)


def main():
    if len(sys.argv) != 3:
        print("Usage: python scripts/ingest_textbooks.py <folder_of_pdfs> <standard e.g. 9th>")
        sys.exit(1)

    folder = Path(sys.argv[1])
    standard = sys.argv[2]
    pdf_files = sorted(folder.glob("*.pdf"))
    print(f"Found {len(pdf_files)} PDFs in {folder}", flush=True)

    for path in pdf_files:
        ingest_file(path, standard)

    print("All done.", flush=True)


if __name__ == "__main__":
    main()
