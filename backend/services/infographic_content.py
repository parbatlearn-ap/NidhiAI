# services/infographic_content.py
# Turns a topic like "Photosynthesis" into a short, structured
# breakdown (a title + a handful of key points). This is the
# "what to draw" step; services/infographic_render.py handles "how
# to draw it".
#
# This is a small, well-defined task, so it's handled by Gemini when
# a GEMINI_API_KEY is configured (splitting load off Groq, which is
# used for the more important /ask tutoring endpoint). If Gemini
# isn't configured, it falls back to Groq so the feature still works.

import json

from groq import Groq
from google import genai

from config import GEMINI_API_KEY, GROQ_API_KEY

GROQ_MODEL = "openai/gpt-oss-120b"
GEMINI_MODEL = "gemini-3.8-flash"

SYSTEM_PROMPT = (
    "You help create simple hand-drawn-style infographics for Class 8-10 "
    "Maharashtra Board students. Given a topic, break it into a short title "
    "and 4 to 6 key points a student could use to understand and remember "
    "the topic at a glance. Each point must be a short phrase, at most 10 "
    "words, in simple language a teenager would understand. "
    "Respond with ONLY valid JSON in this exact shape, no extra text: "
    '{"title": "...", "points": ["...", "...", "...", "..."]}'
)


def _build_user_prompt(topic: str, standard: str | None) -> str:
    prompt = f"Topic: {topic}"
    if standard:
        prompt += f"\nStudent's class/standard: {standard}"
    return prompt


def _generate_with_gemini(topic: str, standard: str | None) -> str:
    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=f"{SYSTEM_PROMPT}\n\n{_build_user_prompt(topic, standard)}",
        config={"response_mime_type": "application/json"},
    )
    return response.text


def _generate_with_groq(topic: str, standard: str | None) -> str:
    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(topic, standard)},
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content


def generate_infographic_content(topic: str, standard: str | None = None) -> dict:
    """Calls Gemini (preferred, for this small task) or Groq (fallback)
    to turn a topic into {"title": ..., "points": [...]}.

    Raises RuntimeError if neither provider is configured, or if the
    model's response can't be parsed as the expected JSON shape.
    """
    if not GEMINI_API_KEY and not GROQ_API_KEY:
        raise RuntimeError("Neither GEMINI_API_KEY nor GROQ_API_KEY is configured. Check your .env file.")

    raw = None
    if GEMINI_API_KEY:
        try:
            raw = _generate_with_gemini(topic, standard)
        except Exception:
            # Gemini's free tier can be flaky (rate limits, transient
            # "high demand" 503s). Fall back to Groq instead of failing
            # the whole request, if it's configured.
            if not GROQ_API_KEY:
                raise
    if raw is None:
        raw = _generate_with_groq(topic, standard)

    try:
        data = json.loads(raw)
        title = str(data["title"]).strip()
        points = [str(p).strip() for p in data["points"] if str(p).strip()]
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        raise RuntimeError(f"Could not parse infographic content from the AI: {exc}") from exc

    if not title or not points:
        raise RuntimeError("The AI returned an empty title or point list.")

    # Cap at 6 points so the layout stays readable on one page.
    return {"title": title, "points": points[:6]}
