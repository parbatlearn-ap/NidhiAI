# services/tutor.py
# Answers a student's question in simple language, like a patient
# tutor would. This is a plain text explanation for now - it doesn't
# yet look anything up in the uploaded textbook PDFs (that would need
# the chunking/embedding pipeline, which is a bigger piece of work).

import re

from groq import Groq

from config import GROQ_API_KEY

MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = (
    "You are a patient, encouraging tutor for Class 8-10 Maharashtra Board "
    "students. Explain answers in simple, clear language a teenager can "
    "follow, using short paragraphs or a few bullet points. Avoid jargon "
    "unless you explain it. Keep answers focused and not too long."
)

# Asking the model to both "answer helpfully" and "refuse if
# inappropriate" in one call is unreliable - it tends to just answer
# (see the Sunny Leone incident). So topic-gating is a separate,
# narrow classification call with nothing else for the model to be
# "helpful" about, and the actual refusal text is hardcoded here in
# Python rather than generated - so an off-topic question can never
# result in the model producing unwanted content, regardless of how
# the classification call goes.
CLASSIFIER_SYSTEM_PROMPT = (
    "You are a strict content classifier for a school tutoring app used by "
    "students aged 13-16 (Class 8-10, Maharashtra Board). Decide whether "
    "the given question is legitimate schoolwork from subjects like "
    "Science, Maths, English, Hindi, Marathi, History, Geography, Civics, "
    "or Economics.\n\n"
    "Answer NO if the question is about celebrities, actors, adult content, "
    "relationships, violence, or anything else not part of the school "
    "syllabus - even if it's phrased as asking for biographical, "
    "historical, or factual information about a real person or event.\n\n"
    "Respond with exactly one word, nothing else: YES or NO."
)

OFF_TOPIC_MESSAGE = (
    "That's outside what I can help with here — I'm built for your "
    "Class 8-10 school subjects (Science, Maths, English, Hindi, Marathi, "
    "History, Geography, and similar). Try asking me a question from your "
    "syllabus instead!"
)

# Returned (without calling the LLM) when the textbook has no relevant
# content for the question, or when an answer is blocked for citing
# pages that weren't actually retrieved.
NOT_IN_TEXTBOOK_MESSAGE = (
    "I couldn't find this in your textbook, so I can't answer it reliably. "
    "Try rephrasing your question, or ask about a topic from your "
    "chapters."
)


# Matches page citations like "page 12", "pages 12, 14 and 15", "p. 7",
# "pp. 10-12", "pg 3". Captures the whole number list/range after the
# keyword so each number can be checked.
_NUM = r"\d+(?:\s*(?:-|–|—|to)\s*\d+)?"
_PAGE_CITATION_RE = re.compile(
    rf"\b(?:pages?|pp?\.?|pg\.?)\s*(?:no\.?|number|#)?\s*:?\s*"
    rf"({_NUM}(?:\s*(?:,|and|&)\s*{_NUM})*)",
    re.IGNORECASE,
)
_MAX_RANGE = 50


def cited_pages(answer: str) -> set[int]:
    """Every page number the answer text claims to cite."""
    pages: set[int] = set()
    for match in _PAGE_CITATION_RE.finditer(answer):
        for part in re.split(r"\s*(?:,|and|&)\s*", match.group(1), flags=re.IGNORECASE):
            bounds = [int(n) for n in re.findall(r"\d+", part)]
            if len(bounds) == 2 and 0 <= bounds[1] - bounds[0] <= _MAX_RANGE:
                pages.update(range(bounds[0], bounds[1] + 1))
            else:
                pages.update(bounds)
    return pages


def citations_are_grounded(answer: str, retrieved_pages: set[int]) -> bool:
    """True if every page the answer cites is among the pages of the
    chunks retrieved for this query (or if it cites none)."""
    return cited_pages(answer) <= retrieved_pages


def is_on_topic(question: str) -> bool:
    """Narrow yes/no classification of whether a question is legitimate
    Class 8-10 schoolwork. Raises RuntimeError if GROQ_API_KEY isn't
    configured.
    """
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured. Check your .env file.")

    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": CLASSIFIER_SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
        temperature=0,
        # MODEL is a reasoning model - it emits its reasoning as tokens
        # before the actual YES/NO answer, so a small max_tokens (e.g. 5)
        # cuts it off mid-thought and leaves content empty. reasoning_effort
        # "low" keeps that reasoning phase short; max_tokens still needs
        # enough room for it to finish and then write the verdict.
        max_tokens=300,
        reasoning_effort="low",
    )
    verdict = (response.choices[0].message.content or "").strip().upper()
    return verdict.startswith("YES")


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
            "Answer ONLY from these excerpts; if they do not contain the "
            "answer, say so instead of using outside knowledge. Do not "
            "mention page numbers - they are shown separately:\n"
            + excerpts_text
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
