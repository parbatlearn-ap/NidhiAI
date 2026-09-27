# services/infographic_render.py
# Draws a hand-drawn-style infographic image (title + a vertical flow
# of numbered points connected by sketchy arrows) using Pillow, then
# saves it as PNG and PDF.
#
# "Hand-drawn" here means: a casual/handwriting-style font, plus
# wobbly (jittered) outlines instead of perfectly straight lines -
# not a scanned real drawing. Good enough to feel sketchy and
# friendly for students, without needing any external design tools.

import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

CANVAS_WIDTH = 1000
MARGIN = 60
BOX_JITTER = 3

# Common install locations for a casual/handwriting-style font.
# Falls back to Pillow's built-in font if none of these exist, so
# rendering never crashes even on a machine without these fonts -
# it just looks less "hand-drawn".
FONT_CANDIDATES = [
    r"C:\Windows\Fonts\comic.ttf",
    r"C:\Windows\Fonts\comicbd.ttf",
    "/usr/share/fonts/truetype/comic/comic.ttf",
    "/Library/Fonts/Comic Sans MS.ttf",
]


def _find_font_path(bold: bool = False) -> str | None:
    for path in FONT_CANDIDATES:
        if bold and "bd" not in path.lower() and "Bold" not in path:
            continue
        if not bold and ("bd" in path.lower() or "Bold" in path):
            continue
        if Path(path).exists():
            return path
    return None


def _get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = _find_font_path(bold=bold)
    if path:
        return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textlength(candidate, font=font) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def _jittered_point(x: float, y: float, amount: int = BOX_JITTER) -> tuple[float, float]:
    return (x + random.uniform(-amount, amount), y + random.uniform(-amount, amount))


def _draw_sketchy_rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], passes: int = 2):
    """Draws a rounded rectangle outline 2-3 times with slight random
    offsets each time, so overlapping lines look hand-drawn instead
    of a single crisp CAD-style rectangle."""
    x0, y0, x1, y1 = box
    for _ in range(passes):
        offset_box = (
            x0 + random.uniform(-BOX_JITTER, BOX_JITTER),
            y0 + random.uniform(-BOX_JITTER, BOX_JITTER),
            x1 + random.uniform(-BOX_JITTER, BOX_JITTER),
            y1 + random.uniform(-BOX_JITTER, BOX_JITTER),
        )
        draw.rounded_rectangle(offset_box, radius=18, outline="black", width=3)


def _draw_wavy_line(draw: ImageDraw.ImageDraw, start: tuple[float, float], end: tuple[float, float]):
    """Draws a slightly wobbly line between two points by connecting
    several jittered midpoints, instead of one straight segment."""
    steps = 8
    points = []
    for i in range(steps + 1):
        t = i / steps
        x = start[0] + (end[0] - start[0]) * t
        y = start[1] + (end[1] - start[1]) * t
        points.append(_jittered_point(x, y, amount=2))
    draw.line(points, fill="black", width=3, joint="curve")


def render_infographic(title: str, points: list[str], output_dir: Path, file_id: str) -> tuple[Path, Path]:
    """Renders the infographic and writes both a PNG and a PDF to
    output_dir, named "<file_id>.png" and "<file_id>.pdf".
    Returns (png_path, pdf_path).
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    width = CANVAS_WIDTH
    content_width = width - 2 * MARGIN

    title_font = _get_font(46, bold=True)
    point_font = _get_font(30)
    footer_font = _get_font(18)

    # Measure against a throwaway image first, so we can size the
    # real canvas to fit the title + all points without clipping.
    measurer = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    title_lines = _wrap_text(measurer, title, title_font, content_width)

    box_height = 130
    box_gap = 55
    title_block_height = MARGIN + len(title_lines) * 58 + 30
    boxes_block_height = len(points) * box_height + (len(points) - 1) * box_gap
    footer_block_height = 80
    height = title_block_height + boxes_block_height + footer_block_height

    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)

    # Title, wrapped and centered.
    y = MARGIN
    for line in title_lines:
        line_width = draw.textlength(line, font=title_font)
        draw.text(((width - line_width) / 2, y), line, font=title_font, fill="black")
        y += 58
    y += 30

    # Numbered, sketchy boxes in a vertical flow, connected by wavy
    # arrows, one per key point.
    box_x0 = MARGIN
    box_x1 = width - MARGIN

    for index, point in enumerate(points, start=1):
        box = (box_x0, y, box_x1, y + box_height)
        _draw_sketchy_rect(draw, box)

        # Numbered circle badge in the top-left of the box.
        badge_center = (box_x0 + 35, y + 35)
        draw.ellipse(
            (badge_center[0] - 22, badge_center[1] - 22, badge_center[0] + 22, badge_center[1] + 22),
            outline="black",
            width=3,
        )
        number_text = str(index)
        number_width = draw.textlength(number_text, font=point_font)
        draw.text(
            (badge_center[0] - number_width / 2, badge_center[1] - 18),
            number_text,
            font=point_font,
            fill="black",
        )

        # Point text, wrapped, to the right of the badge.
        text_x = box_x0 + 75
        text_max_width = (box_x1 - text_x) - 20
        text_lines = _wrap_text(draw, point, point_font, text_max_width)
        text_y = y + (box_height - len(text_lines) * 36) / 2
        for line in text_lines:
            draw.text((text_x, text_y), line, font=point_font, fill="black")
            text_y += 36

        next_y = y + box_height + box_gap
        if index < len(points):
            _draw_wavy_line(draw, (width / 2, y + box_height), (width / 2, next_y))

        y = next_y

    # Footer credit.
    footer_text = "Generated by NidhiAI"
    footer_width = draw.textlength(footer_text, font=footer_font)
    draw.text(((width - footer_width) / 2, height - 40), footer_text, font=footer_font, fill="gray")

    png_path = output_dir / f"{file_id}.png"
    pdf_path = output_dir / f"{file_id}.pdf"
    image.save(png_path, "PNG")
    image.save(pdf_path, "PDF", resolution=150.0)

    return png_path, pdf_path
