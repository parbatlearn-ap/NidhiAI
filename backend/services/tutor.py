# services/tutor.py
# Answers a student's question in simple language, like a patient
# tutor would. This is a plain text explanation for now - it doesn't
# yet look anything up in the uploaded textbook PDFs (that would need
# the chunking/embedding pipeline, which is a bigger piece of work).

from groq import Groq

from config import GROQ_API_KEY

MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = (
    "You are a patient, encouraging tutor for Class 8-10 Maharashtra Board "
    "students. Explain answers in simple, clear language a teenager can "
    "follow, using short paragraphs or a few bullet points. Avoid jargon "
    "unless you explain it. Keep answers focused and not too long."
)


def generate_answer(
    question: str,
    subject: str | None = None,
    standard: str | None = None,
    textbook_excerpts: list[str] | None = None,
) -> str:
    """Calls Groq to answer a student's question. Raises RuntimeError
    if GROQ_API_KEY isn't configured.

    If textbook_excerpts is given (relevant chunks found in an
    uploaded PDF), the tutor is asked to ground its answer in them
    instead of relying purely on general knowledge.
    """
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured. Check your .env file.")

    client = Groq(api_key=GROQ_API_KEY)

    user_prompt = f"Question: {question}"
    if subject:
        user_prompt += f"\nSubject: {subject}"
    if standard:
        user_prompt += f"\nStudent's class/standard: {standard}"

    if textbook_excerpts:
        excerpts_text = "\n\n".join(f"- {excerpt}" for excerpt in textbook_excerpts)
        user_prompt += (
            "\n\nHere are relevant excerpts from the student's textbook. "
            "Base your answer on these where possible:\n" + excerpts_text
        )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.5,
    )

    return response.choices[0].message.content.strip()
