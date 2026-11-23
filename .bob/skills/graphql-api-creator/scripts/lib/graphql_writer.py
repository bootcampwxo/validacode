#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lib/graphql_writer.py
---------------------
Write .graphql files with strict ASCII-only enforcement.

StepZen's SDL parser rejects any character above U+007F — including
en-dash, em-dash, smart quotes, and ellipsis — even inside comments.
This module enforces that invariant on every write.

See: graphql-api-creator SKILL.md Issue 8.
"""

import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# ASCII enforcement
# ---------------------------------------------------------------------------

_REPLACEMENTS: list[tuple[str, str]] = [
    ("\u2014", "-"),   # em dash         —  →  -
    ("\u2013", "-"),   # en dash         –  →  -
    ("\u2018", "'"),   # left single quote  '  →  '
    ("\u2019", "'"),   # right single quote '  →  '
    ("\u201c", '"'),   # left double quote  "  →  "
    ("\u201d", '"'),   # right double quote "  →  "
    ("\u2026", "..."), # ellipsis           …  →  ...
    ("\u00a0", " "),   # non-breaking space    →  space
]


def enforce_ascii(text: str) -> str:
    """
    Replace known non-ASCII punctuation with ASCII equivalents, then
    strip any remaining characters above U+007F.

    This is applied to every .graphql file before writing.
    """
    for bad, good in _REPLACEMENTS:
        text = text.replace(bad, good)

    # Final safety net: replace any remaining non-ASCII with '?'
    # (should be rare after the explicit replacements above)
    result = []
    for ch in text:
        if ord(ch) > 127:
            result.append("?")
        else:
            result.append(ch)
    return "".join(result)


# ---------------------------------------------------------------------------
# File writing
# ---------------------------------------------------------------------------

def write_graphql_file(path: Path, content: str, dry_run: bool = False) -> None:
    """
    Write *content* to *path* as a .graphql file.

    - Enforces ASCII-only content before writing.
    - Creates parent directories if they do not exist.
    - In dry-run mode, prints what would be written without touching disk.

    Raises SystemExit(1) on IO error.
    """
    safe_content = enforce_ascii(content)

    if dry_run:
        print(f"[DRY-RUN] Would write {len(safe_content)} bytes to: {path}")
        return

    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(safe_content, encoding="utf-8")
        print(f"[OK] Written: {path}")
    except OSError as exc:
        print(f"[ERROR] Cannot write {path}: {exc}", file=sys.stderr)
        sys.exit(1)


def append_graphql_file(path: Path, content: str, dry_run: bool = False) -> None:
    """
    Append *content* to an existing .graphql file at *path*.

    - Enforces ASCII-only on the appended content.
    - In dry-run mode, prints what would be appended.

    Raises SystemExit(1) on IO error.
    """
    safe_content = enforce_ascii(content)

    if dry_run:
        print(f"[DRY-RUN] Would append {len(safe_content)} bytes to: {path}")
        return

    try:
        with path.open("a", encoding="utf-8") as fh:
            fh.write(safe_content)
        print(f"[OK] Appended: {path}")
    except OSError as exc:
        print(f"[ERROR] Cannot append to {path}: {exc}", file=sys.stderr)
        sys.exit(1)


def read_graphql_file(path: Path) -> str:
    """
    Read and return the content of a .graphql file.
    Raises SystemExit(1) on IO error.
    """
    try:
        return path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"[ERROR] Cannot read {path}: {exc}", file=sys.stderr)
        sys.exit(1)
