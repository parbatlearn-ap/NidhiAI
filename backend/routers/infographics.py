# routers/infographics.py
# Lets a student type a topic (e.g. "Photosynthesis") and get back a
# simple hand-drawn-style infographic explaining it, downloadable as
# a PNG image or a PDF.

import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from services.infographic_content import generate_infographic_content
from services.infographic_render import render_infographic

router = APIRouter(prefix="/infographics", tags=["infographics"])

# Where generated PNG/PDF files are written. Not committed to git -
# these are created on demand, not source content.
GENERATED_DIR = Path(__file__).resolve().parent.parent / "generated"


class InfographicRequest(BaseModel):
    topic: str
    standard: str | None = None


class InfographicResponse(BaseModel):
    id: str
    title: str
    points: list[str]
    png_url: str
    pdf_url: str


@router.post("/generate", response_model=InfographicResponse)
def generate_infographic(request: InfographicRequest):
    topic = request.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic must not be empty.")

    try:
        content = generate_infographic_content(topic, standard=request.standard)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    file_id = uuid.uuid4().hex
    render_infographic(content["title"], content["points"], GENERATED_DIR, file_id)

    return InfographicResponse(
        id=file_id,
        title=content["title"],
        points=content["points"],
        png_url=f"/infographics/{file_id}/download?format=png",
        pdf_url=f"/infographics/{file_id}/download?format=pdf",
    )


@router.get("/{file_id}/download")
def download_infographic(file_id: str, format: str = "png"):
    if format not in ("png", "pdf"):
        raise HTTPException(status_code=400, detail="format must be 'png' or 'pdf'.")

    # file_id comes from uuid4().hex (our own generator), but we
    # still guard against path traversal since it's a URL parameter.
    if not file_id.isalnum():
        raise HTTPException(status_code=400, detail="Invalid file id.")

    file_path = GENERATED_DIR / f"{file_id}.{format}"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Infographic not found. It may have expired.")

    media_type = "image/png" if format == "png" else "application/pdf"
    return FileResponse(
        file_path,
        media_type=media_type,
        filename=f"nidhiai-infographic.{format}",
    )
