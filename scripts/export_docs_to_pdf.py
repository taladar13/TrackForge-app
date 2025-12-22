#!/usr/bin/env python3
"""
Export Markdown documents to PDF via:
1) Markdown -> HTML (python-markdown)
2) HTML -> PDF (headless Google Chrome --print-to-pdf)

This avoids requiring pandoc/wkhtmltopdf and works well on macOS where Chrome is installed.
"""

from __future__ import annotations

import argparse
import html
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import markdown


DEFAULT_CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
]


def _die(message: str) -> "NoReturn":
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def find_chrome_explicit_or_default(chrome_path: str | None) -> str:
    if chrome_path:
        p = Path(chrome_path)
        if not p.exists():
            _die(f"--chrome-path does not exist: {p}")
        return str(p)

    env_path = os.environ.get("CHROME_PATH")
    if env_path:
        p = Path(env_path)
        if p.exists():
            return str(p)

    for candidate in DEFAULT_CHROME_CANDIDATES:
        if Path(candidate).exists():
            return candidate

    for name in ("google-chrome", "chromium", "chrome", "msedge"):
        found = shutil.which(name)
        if found:
            return found

    _die(
        "Could not find a Chrome/Chromium executable. "
        "Install Google Chrome or set CHROME_PATH / pass --chrome-path."
    )


def infer_title_from_markdown(md_text: str, fallback: str) -> str:
    for line in md_text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def markdown_to_html_document(md_text: str, *, title: str, css_text: str) -> str:
    md = markdown.Markdown(
        extensions=[
            "fenced_code",
            "tables",
            "sane_lists",
            "toc",
        ],
        output_format="html5",
    )
    body = md.convert(md_text)

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{html.escape(title)}</title>
    <style>
{css_text}
    </style>
  </head>
  <body>
{body}
  </body>
</html>
"""


def chrome_print_to_pdf(
    chrome_bin: str,
    *,
    input_html_path: Path,
    output_pdf_path: Path,
    user_data_dir: Path,
) -> None:
    output_pdf_path.parent.mkdir(parents=True, exist_ok=True)

    file_url = input_html_path.resolve().as_uri()

    # Prefer the newer headless mode when available, but fall back if needed.
    base_args = [
        chrome_bin,
        f"--user-data-dir={user_data_dir.resolve()}",
        "--disable-gpu",
        "--no-first-run",
        "--disable-extensions",
        "--disable-crash-reporter",
        "--hide-scrollbars",
        "--print-to-pdf-no-header",
        f"--print-to-pdf={output_pdf_path.resolve()}",
        file_url,
    ]

    candidates = [
        [chrome_bin, "--headless=new", *base_args[1:]],
        [chrome_bin, "--headless", *base_args[1:]],
    ]

    last_err: subprocess.CalledProcessError | None = None
    for args in candidates:
        try:
            subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            last_err = None
            break
        except subprocess.CalledProcessError as e:
            last_err = e

    if last_err:
        stderr = (last_err.stderr or b"").decode("utf-8", errors="replace")
        _die(f"Chrome PDF export failed.\n\nChrome stderr:\n{stderr}")

    if not output_pdf_path.exists() or output_pdf_path.stat().st_size == 0:
        _die(f"Chrome did not create a valid PDF at: {output_pdf_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Export Markdown to PDF via headless Chrome.")
    parser.add_argument("--input", required=True, help="Path to input Markdown file.")
    parser.add_argument("--output", required=True, help="Path to output PDF file.")
    parser.add_argument(
        "--css",
        default=None,
        help="Optional path to a CSS file to inline into the HTML before printing.",
    )
    parser.add_argument(
        "--title",
        default=None,
        help="Optional HTML document title (defaults to first H1 or filename).",
    )
    parser.add_argument(
        "--chrome-path",
        default=None,
        help="Optional path to Chrome/Chromium executable (or set CHROME_PATH).",
    )

    args = parser.parse_args()

    input_md = Path(args.input)
    output_pdf = Path(args.output)

    if not input_md.exists():
        _die(f"Input markdown file does not exist: {input_md}")

    css_text = ""
    if args.css:
        css_path = Path(args.css)
        if not css_path.exists():
            _die(f"CSS file does not exist: {css_path}")
        css_text = css_path.read_text(encoding="utf-8")

    md_text = input_md.read_text(encoding="utf-8")
    title = args.title or infer_title_from_markdown(md_text, fallback=input_md.stem)

    html_doc = markdown_to_html_document(md_text, title=title, css_text=css_text)

    chrome_bin = find_chrome_explicit_or_default(args.chrome_path)

    with tempfile.TemporaryDirectory(prefix="trackforge_pdf_") as tmp_dir:
        tmp_html = Path(tmp_dir) / f"{input_md.stem}.html"
        tmp_html.write_text(html_doc, encoding="utf-8")
        profile_dir = Path(tmp_dir) / "chrome_profile"
        profile_dir.mkdir(parents=True, exist_ok=True)

        chrome_print_to_pdf(
            chrome_bin,
            input_html_path=tmp_html,
            output_pdf_path=output_pdf,
            user_data_dir=profile_dir,
        )

    print(f"OK: wrote {output_pdf}")


if __name__ == "__main__":
    main()


