#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
apply_mappings.py
-----------------
Read a completed field mapping file and apply custom field names and
setters to the corresponding schema and tools GraphQL files.

Only rows with Status "✅ Custom" are applied. Rows with "🔄 Default"
or "⏭️ Skip" are left unchanged. Rows with "🚫 Excluded" are removed
from the type definition.

Usage:
    python apply_mappings.py [--project-root PATH] [--input-file PATH]
                             [--dry-run]

Exit codes:
    0  Success
    1  Runtime error
    2  Precondition not met (no schema or mapping file found)
"""

import argparse
import re
import sys
from pathlib import Path

# Status strings as they appear in the mapping file tables
_STATUS_CUSTOM   = "✅ Custom"
_STATUS_DEFAULT  = "🔄 Default"
_STATUS_SKIP     = "⏭️ Skip"
_STATUS_EXCLUDED = "🚫 Excluded"


# ---------------------------------------------------------------------------
# Mapping file parsing
# ---------------------------------------------------------------------------

def _parse_mapping_file(mapping_path: Path) -> dict[str, dict[str, str]]:
    """
    Parse the mapping file and return:
        {backend_field: {"graphql": graphql_name, "status": status}}

    Only rows with ✅ Custom or 🚫 Excluded are returned — others are ignored.
    """
    text = mapping_path.read_text(encoding="utf-8")
    mappings: dict[str, dict[str, str]] = {}

    # Match table rows: | `backend` | `graphql` | status | notes |
    row_pattern = re.compile(
        r"\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|"
    )
    for line in text.splitlines():
        m = row_pattern.match(line.strip())
        if not m:
            continue
        backend, graphql, status = m.group(1), m.group(2), m.group(3).strip()
        if _STATUS_CUSTOM in status:
            mappings[backend] = {"graphql": graphql, "status": "custom"}
        elif _STATUS_EXCLUDED in status:
            mappings[backend] = {"graphql": graphql, "status": "excluded"}

    return mappings


# ---------------------------------------------------------------------------
# Schema patching
# ---------------------------------------------------------------------------

def _apply_to_schema(schema_text: str, mappings: dict[str, dict[str, str]]) -> str:
    """
    Apply field renames and setters to the schema text.

    For each ✅ Custom mapping:
      - Rename the field in type definitions
      - Add or update setter in the corresponding @rest directive

    For each 🚫 Excluded mapping:
      - Remove the field line from type definitions
    """
    # Step 1: rename / remove fields in type definitions
    def patch_type_body(match: re.Match) -> str:
        type_name = match.group(1)
        body = match.group(2)
        new_lines = []
        for line in body.splitlines():
            stripped = line.strip()
            # Match field declarations: field_name: Type or field_name(args...): Type
            fm = re.match(r"^(\w+)(\s*[\(:])", stripped)
            if fm:
                field = fm.group(1)
                if field in mappings:
                    entry = mappings[field]
                    if entry["status"] == "excluded":
                        continue  # drop the line
                    elif entry["status"] == "custom":
                        new_field = entry["graphql"]
                        line = line.replace(field, new_field, 1)
            new_lines.append(line)
        return f"type {type_name} {{{chr(10).join(new_lines)}}}"

    schema_text = re.sub(
        r"\btype\s+(\w+)\s*\{([^}]*)\}",
        patch_type_body,
        schema_text,
        flags=re.DOTALL,
    )

    # Step 2: update setters in @rest directives
    # Custom mappings need a setter: { field: "new_name", path: "old_name" }
    custom = {k: v["graphql"] for k, v in mappings.items() if v["status"] == "custom"}
    if not custom:
        return schema_text

    def patch_rest_directive(match: re.Match) -> str:
        directive_text = match.group(0)

        # Collect existing setters
        existing_setters: list[tuple[str, str]] = []
        setters_block_match = re.search(
            r"setters\s*:\s*\[(.*?)\]", directive_text, re.DOTALL
        )
        if setters_block_match:
            for sm in re.finditer(
                r'\{\s*field\s*:\s*"([^"]+)"\s*,?\s*path\s*:\s*"([^"]+)"\s*\}',
                setters_block_match.group(1),
            ):
                existing_setters.append((sm.group(1), sm.group(2)))

        # Merge: update existing entries, add new ones
        setters_dict: dict[str, str] = {}
        # Existing setters keyed by current field name
        for gql_field, backend_path in existing_setters:
            setters_dict[gql_field] = backend_path
        # Apply custom mappings
        for backend, new_gql in custom.items():
            # If setter already exists for the old field name, update its key
            if backend in setters_dict:
                path = setters_dict.pop(backend)
                setters_dict[new_gql] = path
            else:
                # New setter needed
                setters_dict[new_gql] = backend

        if not setters_dict:
            return directive_text

        # Format the setters block
        setter_lines = "\n".join(
            f'        {{ field: "{gql}", path: "{path}" }}'
            for gql, path in setters_dict.items()
        )
        new_setters_block = f"setters: [\n{setter_lines}\n      ]"

        if setters_block_match:
            directive_text = directive_text[:setters_block_match.start()] + new_setters_block + directive_text[setters_block_match.end():]
        else:
            # Insert setters before the closing ) of @rest(...)
            insert_pos = directive_text.rfind(")")
            if insert_pos != -1:
                directive_text = (
                    directive_text[:insert_pos]
                    + f"\n      {new_setters_block}\n    "
                    + directive_text[insert_pos:]
                )

        return directive_text

    schema_text = re.sub(
        r"@rest\s*\(.*?\)",
        patch_rest_directive,
        schema_text,
        flags=re.DOTALL,
    )

    return schema_text


def _apply_to_tools(tools_text: str, mappings: dict[str, dict[str, str]]) -> str:
    """
    Update @tool field references in the tools file.
    Tool `fields` values that match a renamed backend field are updated to
    the new GraphQL field name.
    """
    custom = {k: v["graphql"] for k, v in mappings.items() if v["status"] == "custom"}
    if not custom:
        return tools_text

    def replace_fields_value(match: re.Match) -> str:
        fields_val = match.group(1)
        for old_name, new_name in custom.items():
            fields_val = re.sub(
                rf'\b{re.escape(old_name)}\b', new_name, fields_val
            )
        return f'fields: "{fields_val}"'

    return re.sub(r'fields:\s*"([^"]+)"', replace_fields_value, tools_text)


# ---------------------------------------------------------------------------
# File discovery
# ---------------------------------------------------------------------------

def _find_mapping_file(project_root: Path, input_file: Path | None) -> Path:
    mappings_dir = project_root / "api-connect" / "graphql" / "mappings"
    if input_file:
        candidate = mappings_dir / (input_file.stem + ".md")
        if candidate.exists():
            return candidate
        sys.exit(
            f"[ERROR] Mapping file not found: {candidate}\n"
            "        Run generate_mapping.py first."
        )
    md_files = sorted(mappings_dir.glob("*.md"))
    if not md_files:
        print(
            "[ERROR] No mapping files found in:\n"
            f"        {mappings_dir}\n"
            "        Run generate_mapping.py first.",
            file=sys.stderr,
        )
        sys.exit(2)
    if len(md_files) > 1:
        print(
            "[WARN] Multiple mapping files found — using the first one.\n"
            "       Use --input-file to specify which mapping to apply.",
            file=sys.stderr,
        )
    return md_files[0]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Apply field mappings from a mapping file to schema and tools files.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--project-root", default=None,
                        help="Project root directory (default: cwd)")
    parser.add_argument("--input-file", default=None,
                        help="Base name or path of the API (e.g. my-api or my-api.json)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would change without writing files")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve() if args.project_root else Path.cwd()
    input_file = Path(args.input_file) if args.input_file else None

    graphql_dir = project_root / "api-connect" / "graphql"

    # Locate mapping file
    mapping_path = _find_mapping_file(project_root, input_file)
    api_name = mapping_path.stem

    # Locate schema and tools files
    schema_path = graphql_dir / "schema" / (api_name + ".graphql")
    tools_path  = graphql_dir / "tools"  / (api_name + ".graphql")

    if not schema_path.exists():
        print(
            f"[ERROR] Schema file not found: {schema_path}\n"
            "        Run graphql-api-creator first.",
            file=sys.stderr,
        )
        return 2

    # Parse mappings
    try:
        mappings = _parse_mapping_file(mapping_path)
    except OSError as exc:
        print(f"[ERROR] Cannot read mapping file: {exc}", file=sys.stderr)
        return 1

    custom_count   = sum(1 for v in mappings.values() if v["status"] == "custom")
    excluded_count = sum(1 for v in mappings.values() if v["status"] == "excluded")

    print(f"Mapping file:     {mapping_path}")
    print(f"Schema file:      {schema_path}")
    print(f"Tools file:       {tools_path} {'(not found — skipped)' if not tools_path.exists() else ''}")
    print(f"Custom mappings:  {custom_count}")
    print(f"Excluded fields:  {excluded_count}")
    print()

    if custom_count == 0 and excluded_count == 0:
        print("[OK] No custom mappings to apply. Set Status to '✅ Custom' in the mapping file first.")
        return 0

    # Apply to schema
    schema_text = schema_path.read_text(encoding="utf-8")
    new_schema   = _apply_to_schema(schema_text, mappings)

    if args.dry_run:
        print("[DRY-RUN] Schema changes (first 60 lines of result):")
        for i, line in enumerate(new_schema.splitlines()[:60]):
            print(f"  {line}")
        print()
    else:
        schema_path.write_text(new_schema, encoding="utf-8")
        print(f"[OK] Schema updated: {schema_path}")

    # Apply to tools (optional)
    if tools_path.exists():
        tools_text = tools_path.read_text(encoding="utf-8")
        new_tools  = _apply_to_tools(tools_text, mappings)
        if args.dry_run:
            print("[DRY-RUN] Tools file would be updated.")
        else:
            tools_path.write_text(new_tools, encoding="utf-8")
            print(f"[OK] Tools updated:  {tools_path}")

    if not args.dry_run:
        print()
        print(f"[OK] Applied {custom_count} custom mapping(s), removed {excluded_count} excluded field(s).")
        print()
        print("Next steps:")
        print("  1. Review the changes in the schema and tools files")
        print("  2. Update the mapping file Status to '✅ Applied'")
        print("  3. Deploy: python api-connect/deploy.py")

    return 0


if __name__ == "__main__":
    sys.exit(main())

# Made with IBM Bob
