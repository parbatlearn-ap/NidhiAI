# database.py
# Sets up the Supabase client so other parts of the backend can
# read/write data without each file re-creating the connection.

from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY


def get_supabase_client() -> Client | None:
    """
    Creates and returns a Supabase client using the URL and key from
    .env. Returns None if those settings aren't configured yet,
    instead of crashing the whole app.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None

    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# A single shared client instance, created once when this module is
# first imported.
supabase = get_supabase_client()
