# routers/ask.py
# The core tutoring endpoint: a student asks a question in plain
# English (or their own words) and gets back a simple explanation.
#
# Answers are grounded in uploaded textbook content (see
# routers/pdf_documents.py) via services/retrieval.py. If no chunk
# clears the relevance threshold, the standard refusal is returned
# without calling the LLM.

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from services.retrieval import find_relevant_chunks
from services.tutor import (
    NOT_IN_TEXTBOOK_MESSAGE,
    OFF_TOPIC_MESSAGE,
    citations_are_grounded,
    generate_answer,
    is_on_topic,
)

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
def ask_question(request: AskRequest, current_user: dict = Depends(get_current_user)):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    off_topic = AskResponse(answer=OFF_TOPIC_MESSAGE, used_textbook=False, source_pages=[])
    not_in_textbook = AskResponse(
        answer=NOT_IN_TEXTBOOK_MESSAGE, used_textbook=False, source_pages=[]
    )

    # Hard relevance gate: runs before ANY LLM call. No chunk at or
    # above the similarity threshold means the textbook doesn't cover
    # this question, so refuse rather than let the AI answer from
    # general knowledge.
    chunks = find_relevant_chunks(question, subject_id=request.subject_id)
    if not chunks:
        return not_in_textbook

    try:
        if not is_on_topic(question):
            return off_topic
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    excerpts = [chunk["content"] for chunk in chunks]
    retrieved_pages = {chunk["page_number"] for chunk in chunks if chunk.get("page_number")}
    source_pages = sorted(retrieved_pages)

    try:
        answer = generate_answer(
            question,
            subject=request.subject,
            standard=request.standard,
            textbook_excerpts=excerpts,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    # Post-generation check: any page the answer cites must be one of
    # the pages actually retrieved for this query; otherwise block it.
    if not citations_are_grounded(answer, retrieved_pages):
        return not_in_textbook

    return AskResponse(answer=answer, used_textbook=True, source_pages=source_pages)
