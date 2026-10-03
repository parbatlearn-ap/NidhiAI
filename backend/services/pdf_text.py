# services/pdf_text.py
# Extracts the text of a PDF, one string per page.
#
# Uses pypdfium2 (Chrome's PDFium engine) rather than pypdf: pypdf and
# pdfplumber scramble Devanagari (Hindi/Marathi) - swapped letters and
# stray vowel signs at the start of words - while PDFium reads it
# cleanly. Kept in its own tiny module so the check script can use it
# without importing the embedding model.

import pypdfium2 as pdfium


def extract_pages(pdf_bytes: bytes) -> list[str]:
    """Returns a list of extracted text, one entry per page (1-indexed
    conceptually - index 0 in the list is page 1)."""
    pdf = pdfium.PdfDocument(pdf_bytes)
    try:
        pages = []
        for index in range(len(pdf)):
            page = pdf[index]
            textpage = page.get_textpage()
            try:
                pages.append(textpage.get_text_range() or "")
            finally:
                textpage.close()
                page.close()
        return pages
    finally:
        pdf.close()
