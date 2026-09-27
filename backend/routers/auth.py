# routers/auth.py
# Account creation and login. Uses Supabase Auth to actually manage
# passwords and sessions - we never see or store raw passwords
# ourselves, just hand them to Supabase.

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from database import supabase

router = APIRouter(prefix="/auth", tags=["auth"])

# Roles a person can pick for themselves when signing up. "admin" is
# deliberately excluded - admin accounts are created separately (e.g.
# directly in Supabase), not self-assigned through public signup.
SELF_SERVE_ROLES = {"student", "parent"}


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "student"


class LoginRequest(BaseModel):
    email: str
    password: str


def _require_supabase():
    if supabase is None:
        raise HTTPException(status_code=503, detail="Supabase is not configured. Check your .env file.")


@router.post("/signup")
def signup(request: SignupRequest):
    _require_supabase()

    if request.role not in SELF_SERVE_ROLES:
        raise HTTPException(status_code=400, detail=f"role must be one of {sorted(SELF_SERVE_ROLES)}.")

    try:
        created = supabase.auth.admin.create_user(
            {
                "email": request.email,
                "password": request.password,
                "email_confirm": True,  # skip email verification for now - no email sending set up yet
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not create account: {exc}") from exc

    user_id = created.user.id

    try:
        supabase.table("profiles").insert(
            {"id": user_id, "full_name": request.full_name, "role": request.role}
        ).execute()
    except Exception as exc:
        # Roll back the auth user so a failed signup doesn't leave an
        # orphaned account with no profile.
        supabase.auth.admin.delete_user(user_id)
        raise HTTPException(status_code=400, detail=f"Could not create profile: {exc}") from exc

    return {"id": user_id, "email": request.email, "full_name": request.full_name, "role": request.role}


@router.post("/login")
def login(request: LoginRequest):
    _require_supabase()

    try:
        session = supabase.auth.sign_in_with_password(
            {"email": request.email, "password": request.password}
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Incorrect email or password.") from exc

    return {
        "access_token": session.session.access_token,
        "refresh_token": session.session.refresh_token,
        "user_id": session.user.id,
    }


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user
