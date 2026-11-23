#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scan_input.py
-------------
Scan api-connect/graphql/input/ for OpenAPI/Swagger specification files
and print a numbered list suitable for interactive selection.

Usage:
    python scan_input.py [--project-root PATH]

Exit codes:
    0  One or more spec files found
    1  Runtime error
    2  No spec files found (precondition: add specs to input/ first)
"""

import argparse
import sys
from pathlib import Path

# Allow running this script directly without installing the package
sys.path.insert(0, str(Path(__file__).parent))
from lib.openapi_parser import load_spec, detect_spec_version


_SPEC_EXTENSIONS = (".json", ".yaml", ".yml")


def find_spec_files(input_dir: Path) -> list[Path]:
    """Return all OpenAPI/Swagger spec files in *input_dir*, sorted by name."""
    if not input_dir.exists():
        return []
    return sorted(
        p for p in input_dir.iterdir()
        if p.is_file() and p.suffix.lower() in _SPEC_EXTENSIONS
    )


def describe_spec(path: Path) -> str:
    """Return a short human-readable description of a spec file."""
    try:
        spec = load_spec(path)
        version = detect_spec_version(spec)
        title = (
            spec.get("info", {}).get("title", "")
            or spec.get("title", "")
            or ""
        )
        ver_label = {
            "swagger2":  "Swagger 2.0",
            "openapi3":  "OpenAPI 3.x",
        }.get(version, version)
        if title:
            return f"{ver_label} — {title}"
        return ver_label
    except (SystemExit, Exception):
        return "(unreadable or unsupported format)"


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Scan api-connect/graphql/input/ for OpenAPI/Swagger spec files "
            "and print a numbered list for interactive selection."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--project-root",
        default=None,
        help="Project root directory (default: current working directory)",
    )
    args = parser.parse_args()

    project_root = (
        Path(args.project_root).resolve()
        if args.project_root
        else Path.cwd()
    )
    input_dir = project_root / "api-connect" / "graphql" / "input"

    if not input_dir.exists():
        print(
            f"[ERROR] Input directory not found: {input_dir}\n"
            "Run scaffold_project.py first to create the project structure.",
            file=sys.stderr,
        )
        return 2

    spec_files = find_spec_files(input_dir)

    if not spec_files:
        print(
            f"[ERROR] No spec files found in {input_dir}\n"
            "Place your OpenAPI (.json / .yaml / .yml) files in that folder "
            "then re-run this script.",
            file=sys.stderr,
        )
        return 2

    print(f"OpenAPI Spec Files Detected in {input_dir}\n")
    for i, path in enumerate(spec_files, start=1):
        description = describe_spec(path)
        print(f"{i}. {path.name}")
        print(f"   {description}")
        print()

    print(f"Total: {len(spec_files)} file(s)")
    print()
    print(
        "Next step: run parse_operations.py to list the GET operations\n"
        "available in a specific spec file before generating the schema."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

# Made with IBM Bob
