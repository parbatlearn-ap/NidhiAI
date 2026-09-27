# routers/ask.py
# The core tutoring endpoint: a student asks a question in plain
# English (or their own words) and gets back a simple explanation.
#
# If relevant textbook content has been uploaded (see
# routers/pdf_documents.py), the answer is grounded in it via
# services/retrieval.py. Otherwise it falls back to the AI's general
# knowledge.

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.retrieval import find_relevant_chunks
from services.tutor import generate_answer

router = APIRouter(tags=["ask"])


class AskRequest(BaseModel):
    question: str
    subject: str | None = None
    subject_id: str | None = None
    standard: str | None = None


class AskResponse(BaseModel):
    answer: str
    used_textbook: bool
    source_pages: list[int]


@router.post("/ask", response_model=AskResponse)
def ask_question(request: AskRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    chunks = find_relevant_chunks(question, subject_id=request.subject_id)
    excerpts = [chunk["content"] for chunk in chunks]
    source_pages = sorted({chunk["page_number"] for chunk in chunks if chunk.get("page_number")})

    try:
        answer = generate_answer(
            question,
            subject=request.subject,
            standard=request.standard,
            textbook_excerpts=excerpts,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return AskResponse(answer=answer, used_textbook=bool(excerpts), source_pages=source_pages)
