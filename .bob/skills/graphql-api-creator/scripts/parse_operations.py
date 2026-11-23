#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
parse_operations.py
-------------------
Parse an OpenAPI/Swagger spec and display all GET operations in the
numbered format used by graphql-api-creator SKILL.md section 2.1.

The output is intentionally identical to what the SKILL.md instructs Bob
to show the user during interactive API selection.

Usage:
    python parse_operations.py --input-file PATH [--project-root PATH]

Exit codes:
    0  Operations printed successfully
    1  Runtime error
    2  No GET operations found or file not provided
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.openapi_parser import (
    load_spec,
    detect_spec_version,
    extract_get_operations,
    format_operations_list,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Parse an OpenAPI/Swagger spec and list all GET operations "
            "in numbered format for interactive selection."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--input-file",
        required=False,
        default=None,
        help=(
            "Path to the OpenAPI/Swagger spec file. "
            "If omitted, auto-detects the first spec in "
            "api-connect/graphql/input/."
        ),
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

    # ── Resolve the input file ────────────────────────────────────────────
    if args.input_file:
        spec_path = Path(args.input_file).resolve()
    else:
        # Auto-detect: pick the first spec in input/
        input_dir = project_root / "api-connect" / "graphql" / "input"
        candidates = sorted(
            p for p in (input_dir.iterdir() if input_dir.exists() else [])
            if p.suffix.lower() in (".json", ".yaml", ".yml")
        )
        if not candidates:
            print(
                "[ERROR] No spec file provided and none found in "
                f"{input_dir}.\n"
                "Use --input-file PATH or place a spec in the input/ folder.",
                file=sys.stderr,
            )
            return 2
        spec_path = candidates[0]
        print(f"[INFO] Auto-detected spec: {spec_path}\n")

    if not spec_path.exists():
        print(f"[ERROR] Spec file not found: {spec_path}", file=sys.stderr)
        return 1

    # ── Parse and display ─────────────────────────────────────────────────
    spec = load_spec(spec_path)
    try:
        version = detect_spec_version(spec)
    except ValueError as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 1

    version_label = {"swagger2": "Swagger 2.0", "openapi3": "OpenAPI 3.x"}.get(
        version, version
    )
    title = spec.get("info", {}).get("title", spec_path.stem)
    api_version = spec.get("info", {}).get("version", "")

    print(f"Spec: {spec_path.name}  ({version_label})")
    print(f"Title: {title}" + (f"  v{api_version}" if api_version else ""))
    print()

    operations = extract_get_operations(spec)

    if not operations:
        print(
            "[WARN] No GET operations with an operationId were found "
            f"in {spec_path.name}.\n"
            "Only GET operations are supported by this read-only generator.",
            file=sys.stderr,
        )
        return 2

    print(format_operations_list(operations))
    print()

    # ── Non-GET summary ───────────────────────────────────────────────────
    paths = spec.get("paths", {})
    non_get_count = sum(
        1
        for path_item in paths.values()
        if isinstance(path_item, dict)
        for method in ("post", "put", "patch", "delete")
        if method in path_item
    )
    if non_get_count:
        print(
            f"Note: {non_get_count} non-GET operation(s) detected and excluded "
            "(this generator is read-only)."
        )
        print()

    print(
        "Which operations should be included in the GraphQL API?\n"
        "\n"
        "  A) Include all read operations\n"
        "  B) Include only selected operations by number\n"
        "  C) Exclude selected operations by number\n"
        "  D) Include only selected operationIds\n"
        "\n"
        "Please choose A/B/C/D and provide the selection."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

# Made with IBM Bob
