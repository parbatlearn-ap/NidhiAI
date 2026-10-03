# scripts/check_pdf_extraction.py
# Checks how cleanly each textbook PDF's text comes out with the current
# extractor (services/pdf_text.py, pypdfium2). For every PDF it reports:
#   - what % of Devanagari words START with a vowel sign or virama
#     (U+093E-U+094D). A real word can't start that way, so a high number
#     means the extractor is scrambling the text. Target: under 0.5%.
#   - how many maths symbols (delta, perpendicular, angle) survived - this
#     matters for "Maths Part 2" (10th), which is geometry-heavy.
# It also prints 3 sample lines each for Hindi 9th, Hindi 10th, Marathi 9th.
#
# Usage (run from the backend/ folder):
#   python scripts/check_pdf_extraction.py                 # PDFs from Supabase storage
#   python scripts/check_pdf_extraction.py --dir "E:\NidhiAI\Books_PDF"   # PDFs on disk
#
# Supabase mode needs SUPABASE_URL and SUPABASE_SERVICE_KEY in .env. Nothing
# is written to the database or to storage - this is read-only.
# Exit code is 1 if any PDF is over the threshold, else 0.

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.pdf_text import extract_pages  # noqa: E402

STORAGE_BUCKET = "pdf-documents"
THRESHOLD_PCT = 0.5

_DEVANAGARI = re.compile("[\u0900-\u097F]")
_BAD_START = re.compile("[\u093E-\u094D]")
# Leading punctuation / quotes / joiners are skipped before looking at a
# word's first character (e.g. a quote mark in front of a word).
_LEADING_JUNK = re.compile("^[^\u0900-\u097F\\w]+")

# Delta can be encoded as Greek capital delta or the "increment" sign.
MATH_SYMBOLS = {"Δ": "[\u0394\u2206]", "⊥": "[\u22A5]", "∠": "[\u2220]"}


def devanagari_word_stats(text: str) -> tuple[int, int]:
    """Returns (devanagari_words, words_starting_with_vowel_sign_or_virama)."""
    total = bad = 0
    for token in text.split():
        if not _DEVANAGARI.search(token):
            continue
        word = _LEADING_JUNK.sub("", token)
        if not word:
            continue
        total += 1
        if _BAD_START.match(word[0]):
            bad += 1
    return total, bad


def math_symbol_counts(text: str) -> dict[str, int]:
    return {name: len(re.findall(pattern, text)) for name, pattern in MATH_SYMBOLS.items()}


def sample_lines(pages: list[str], count: int = 3) -> list[tuple[int, str]]:
    """First `count` Devanagari-heavy lines from a page near the middle of the book."""
    for page_index in range(len(pages) // 2, len(pages)):
        found = []
        for line in pages[page_index].splitlines():
            line = " ".join(line.split())
            if len(_DEVANAGARI.findall(line)) >= 25:
                found.append((page_index + 1, line[:160]))
            if len(found) == count:
                return found
    return []


def _pdfs_from_supabase():
    from database import supabase

    if supabase is None:
        sys.exit("Supabase isn't configured - set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env, or use --dir.")
    docs = (
        supabase.table("pdf_documents")
        .select("filename,storage_path,subjects(name,standard)")
        .execute()
        .data
    )
    docs.sort(key=lambda d: (d["subjects"]["name"], d["subjects"]["standard"], d["filename"]))
    for doc in docs:
        label = f'{doc["subjects"]["name"]} {doc["subjects"]["standard"]} - {doc["filename"]}'
        yield label, doc["subjects"]["name"], doc["subjects"]["standard"], (
            lambda path=doc["storage_path"]: supabase.storage.from_(STORAGE_BUCKET).download(path)
        )


def _pdfs_from_dir(folder: Path):
    for path in sorted(folder.rglob("*.pdf")):
        yield path.name, path.stem, path.parent.name, (lambda p=path: p.read_bytes())


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dir", type=Path, help="read PDFs from this folder instead of Supabase storage")
    parser.add_argument("--threshold", type=float, default=THRESHOLD_PCT, help="max %% of bad word starts (default 0.5)")
    args = parser.parse_args()

    source = _pdfs_from_dir(args.dir) if args.dir else _pdfs_from_supabase()

    rows, samples = [], {}
    for label, subject, standard, load in source:
        pages = extract_pages(load())
        text = "\n".join(pages)
        total, bad = devanagari_word_stats(text)
        pct = 100.0 * bad / total if total else 0.0
        rows.append((label, len(pages), total, bad, pct, math_symbol_counts(text)))
        if re.search(r"hindi|marathi", subject, re.IGNORECASE):
            samples[label] = sample_lines(pages)
        print(f"  done: {label}", file=sys.stderr)

    print(f'\n{"PDF":<38} {"pages":>5} {"deva words":>10} {"bad starts":>10} {"% bad":>7}  status')
    failed = False
    for label, n_pages, total, bad, pct, _ in rows:
        if total < 50:
            status = "n/a (little Devanagari)"
        elif pct < args.threshold:
            status = "OK"
        else:
            status = "FAIL"
            failed = True
        print(f"{label:<38} {n_pages:>5} {total:>10} {bad:>10} {pct:>6.2f}%  {status}")

    print("\nMaths symbols that survived extraction (delta / perpendicular / angle):")
    for label, _, _, _, _, symbols in rows:
        if "Maths" in label:
            counts = "  ".join(f"{name}={n}" for name, n in symbols.items())
            print(f"  {label:<38} {counts}")

    for label, lines in samples.items():
        print(f"\nSample lines - {label}:")
        for page_number, line in lines:
            print(f"  p.{page_number}: {line}")

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
