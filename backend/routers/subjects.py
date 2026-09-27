# routers/subjects.py
# Endpoints for working with the "subjects" table in Supabase
# (e.g. "Math - 10th", "Science - 9th").

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user, require_admin
from database import supabase

# A router groups related endpoints together. main.py "includes" this
# router so these endpoints become part of the app, all starting with
# the prefix "/subjects".
router = APIRouter(prefix="/subjects", tags=["subjects"])


# Defines the shape of data expected when creating a new subject.
# FastAPI uses this to validate incoming requests automatically.
class SubjectCreate(BaseModel):
    name: str
    standard: str = "10th"
    description: str | None = None


def _require_supabase():
    """Raises a clear error if Supabase isn't configured, instead of
    letting the request crash with a confusing error."""
    if supabase is None:
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured. Check your .env file.",
        )


# GET /subjects - list all subjects. Any logged-in user can browse.
@router.get("")
def list_subjects(current_user: dict = Depends(get_current_user)):
    _require_supabase()
    response = supabase.table("subjects").select("*").order("created_at").execute()
    return response.data


# POST /subjects - create a new subject. Admins only.
@router.post("", status_code=201)
def create_subject(subject: SubjectCreate, current_user: dict = Depends(require_admin)):
    _require_supabase()
    response = supabase.table("subjects").insert(subject.model_dump()).execute()
    return response.data[0]
