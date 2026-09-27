# routers/pdf_documents.py
# Lets an admin upload a textbook PDF for a subject. The file is
# stored in Supabase Storage, and its text is extracted, chunked,
# and embedded so /ask can later search it (see services/pdf_ingest.py
# and services/retrieval.py).

import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from database import supabase
from services.pdf_ingest import build_chunks_with_embeddings

router = APIRouter(prefix="/pdf-documents", tags=["pdf-documents"])

STORAGE_BUCKET = "pdf-documents"


def _require_supabase():
    if supabase is None:
        raise HTTPException(status_code=503, detail="Supabase is not configured. Check your .env file.")


@router.post("/upload")
async def upload_pdf(subject_id: str = Form(...), file: UploadFile = File(...)):
    _require_supabase()

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    storage_path = f"{subject_id}/{uuid.uuid4().hex}.pdf"

    try:
        supabase.storage.from_(STORAGE_BUCKET).upload(
            storage_path, file_bytes, {"content-type": "application/pdf"}
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to upload file to storage: {exc}") from exc

    doc_insert = (
        supabase.table("pdf_documents")
        .insert(
            {
                "subject_id": subject_id,
                "filename": file.filename,
                "storage_path": storage_path,
                "status": "processing",
            }
        )
        .execute()
    )
    document = doc_insert.data[0]
    document_id = document["id"]

    try:
        total_pages, chunk_rows = build_chunks_with_embeddings(file_bytes)

        for row in chunk_rows:
            row["pdf_id"] = document_id

        if chunk_rows:
            supabase.table("pdf_chunks").insert(chunk_rows).execute()

        supabase.table("pdf_documents").update(
            {"status": "ready", "total_pages": total_pages}
        ).eq("id", document_id).execute()

    except Exception as exc:
        supabase.table("pdf_documents").update({"status": "failed"}).eq("id", document_id).execute()
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {exc}") from exc

    return {
        "id": document_id,
        "filename": file.filename,
        "subject_id": subject_id,
        "total_pages": total_pages,
        "chunk_count": len(chunk_rows),
        "status": "ready",
    }
