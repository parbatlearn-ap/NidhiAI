# auth.py
# Checks who is making a request, using the "Authorization: Bearer
# <token>" header a logged-in client sends. Used as a FastAPI
# dependency on any endpoint that should require login (or a
# specific role).
#
# The token itself comes from POST /auth/login (see routers/auth.py)
# and is verified here by asking Supabase Auth whether it's still
# valid - we don't try to decode/verify the JWT ourselves.

from fastapi import Depends, Header, HTTPException

from database import supabase


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """Requires a valid "Authorization: Bearer <token>" header.
    Returns the user's profile (id, email, full_name, role, ...).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        user_response = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token.") from exc

    user = user_response.user if user_response else None
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    profile = supabase.table("profiles").select("*").eq("id", user.id).execute()
    if not profile.data:
        raise HTTPException(status_code=403, detail="No profile found for this account.")

    return {"email": user.email, **profile.data[0]}


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Requires a valid login AND an admin role."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return current_user
