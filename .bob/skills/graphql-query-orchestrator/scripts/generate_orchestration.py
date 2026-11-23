#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_orchestration.py
-------------------------
Add an orchestrated query and @materializer type extensions to an
existing GraphQL schema file.

Given a parent query name and a list of child query names (from
detect_relationships.py), this script:

  1. Creates a new orchestrated query identical to the parent @rest query
     but with the user-supplied name.
  2. Extends the parent return type with @materializer fields for each
     child endpoint.
  3. Updates the tools file to expose only the orchestrated query.
  4. Updates index.graphql visibility to match.

Usage:
    python generate_orchestration.py
        [--project-root PATH]
        [--input-file PATH]
        --parent QUERY_NAME
        --children CHILD1 CHILD2 ...
        --orchestrated-name NEW_QUERY_NAME
        [--dry-run]

Exit codes:
    0  Success
    1  Runtime error
    2  Precondition not met
"""

import argparse
import re
import sys
from pathlib import Path

# graphql_writer from graphql-api-creator (ASCII enforcement)
_WRITER_PATH = (
    Path(__file__).parent.parent.parent
    / "graphql-api-creator" / "scripts" / "lib" / "graphql_writer.py"
)


def _enforce_ascii(text: str) -> str:
    """Minimal ASCII enforcement — mirrors graphql_writer.enforce_ascii."""
    replacements = [
        ("\u2014", "-"), ("\u2013", "-"),
        ("\u2018", "'"), ("\u2019", "'"),
        ("\u201c", '"'), ("\u201d", '"'),
        ("\u2026", "..."), ("\u00a0", " "),
    ]
    for bad, good in replacements:
        text = text.replace(bad, good)
    return "".join(ch if ord(ch) <= 127 else "?" for ch in text)


# ---------------------------------------------------------------------------
# Schema helpers
# ---------------------------------------------------------------------------

def _find_query_field(schema_text: str, query_name: str) -> dict | None:
    """
    Extract the full definition of a single Query field including its
    @rest directive. Returns a dict with keys: full_text, return_type, rest_block.
    """
    # Pattern: fieldName(args...): ReturnType @rest(...)
    pattern = re.compile(
        rf"({re.escape(query_name)}\s*(?:\([^)]*\))?\s*:\s*(\S+)[^\n]*"
        rf"(?:\s*@rest\s*\(.*?\))?)",
        re.DOTALL,
    )
    m = pattern.search(schema_text)
    if not m:
        return None

    full_text = m.group(1)
    return_type = m.group(2).strip("[]!")

    rest_match = re.search(r"@rest\s*\(.*?\)", full_text, re.DOTALL)
    rest_block = rest_match.group(0) if rest_match else ""

    return {
        "full_text":   full_text,
        "return_type": return_type,
        "rest_block":  rest_block,
    }


def _extract_return_type(schema_text: str, query_name: str) -> str | None:
    """Return the return type name of a query field (unwrapped from [] and !)."""
    m = re.search(
        rf"\b{re.escape(query_name)}\s*(?:\([^)]*\))?\s*:\s*\[?(\w+)",
        schema_text,
    )
    return m.group(1) if m else None


def _extract_param_name(schema_text: str, query_name: str) -> str | None:
    """Return the first argument name of a query field."""
    m = re.search(
        rf"\b{re.escape(query_name)}\s*\(\s*(\w+)\s*:",
        schema_text,
    )
    return m.group(1) if m else None


def _build_orchestrated_query(
    parent_info: dict,
    orchestrated_name: str,
    parent_name: str,
) -> str:
    """Build the orchestrated query declaration (same as parent but renamed)."""
    orchestrated = parent_info["full_text"].replace(parent_name, orchestrated_name, 1)
    return f"\n  # Orchestrated query — fetches {parent_name} plus all child resources\n  {orchestrated.strip()}\n"


def _build_extend_type(
    parent_return_type: str,
    children: list[dict],
    parent_param: str,
) -> str:
    """
    Build: extend type ParentType { child1: ChildType @materializer(...) ... }
    """
    fields = []
    for child in children:
        child_name = child["query_name"]
        child_return_type = child["return_type"]
        # Derive a clean field name: strip get/For/By prefixes and ID/ByID suffixes
        field_name = re.sub(r"^get", "", child_name)
        field_name = re.sub(r"(?:ForID|ByID|For\w*|By\w*)$", "", field_name)
        field_name = field_name[0].lower() + field_name[1:] if field_name else child_name

        fields.append(
            f"  # Child resource — fetched via {child_name}\n"
            f"  {field_name}: {child_return_type}\n"
            f'    @materializer(\n'
            f'      query: "{child_name}"\n'
            f'      arguments: [{{ name: "{parent_param}", field: "id" }}]\n'
            f"    )"
        )

    fields_text = "\n\n".join(fields)
    return (
        f"\n# Extend {parent_return_type} with child resource fields\n"
        f"extend type {parent_return_type} {{\n{fields_text}\n}}\n"
    )


def _update_tools_visibility(
    tools_text: str,
    index_text: str,
    orchestrated_name: str,
    parent_name: str,
    child_names: list[str],
    non_orchestrated_tools: list[str],
) -> tuple[str, str]:
    """
    Update the tools file to remove tool definitions for the parent and all
    children, add one for the orchestrated query, and update index.graphql
    visibility to match.
    """
    removed = [parent_name] + child_names

    # Remove @tool blocks for removed queries
    for name in removed:
        tools_text = re.sub(
            rf"extend\s+schema\s*@tool\s*\((?:[^()]*|\([^()]*\))*"
            rf'name\s*:\s*"{re.escape(name)}"'
            rf"(?:[^()]*|\([^()]*\))*\)\s*",
            "",
            tools_text,
            flags=re.DOTALL,
        )

    # Build new @tool block for the orchestrated query
    resources = ", ".join(
        re.sub(r"^get|(?:ForID|ByID|For\w*|By\w*)$", "", c) for c in child_names
    )
    new_tool = (
        f'\nextend schema\n'
        f'  @tool(\n'
        f'    name: "{orchestrated_name}"\n'
        f'    description: "Retrieves the complete {re.sub(r"^get|Details$", "", orchestrated_name)} '
        f'including {resources}. Single unified query replacing separate calls."\n'
        f'    graphql: {{ expose: true, types: "Query", fields: "{orchestrated_name}" }}\n'
        f'  )\n'
    )
    tools_text = tools_text.rstrip() + "\n" + new_tool

    # Update visibility in index.graphql
    exposed = [orchestrated_name] + non_orchestrated_tools
    new_fields_pattern = "(" + "|".join(re.escape(n) for n in exposed) + ")"
    index_text = re.sub(
        r'fields\s*:\s*"[^"]*"',
        f'fields: "{new_fields_pattern}"',
        index_text,
    )

    return tools_text, index_text


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Add an orchestrated query and @materializer extensions to a GraphQL schema.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--project-root", default=None)
    parser.add_argument("--input-file", default=None,
                        help="Schema .graphql file to modify")
    parser.add_argument("--parent", required=True,
                        help="Name of the parent query (e.g. getAccountByID)")
    parser.add_argument("--children", required=True, nargs="+",
                        help="Names of the child queries to merge")
    parser.add_argument("--orchestrated-name", required=True,
                        help="Name for the new orchestrated query (e.g. getAccountDetails)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve() if args.project_root else Path.cwd()
    graphql_dir  = project_root / "api-connect" / "graphql"
    schema_dir   = graphql_dir / "schema"

    # Locate schema file
    if args.input_file:
        schema_path = Path(args.input_file)
    else:
        candidates = sorted(schema_dir.glob("*.graphql"))
        if not candidates:
            print("[ERROR] No schema files found. Run graphql-api-creator first.",
                  file=sys.stderr)
            return 2
        schema_path = candidates[0]

    api_name    = schema_path.stem
    tools_path  = graphql_dir / "tools"  / (api_name + ".graphql")
    index_path  = graphql_dir / "index.graphql"

    if not schema_path.exists():
        print(f"[ERROR] Schema not found: {schema_path}", file=sys.stderr)
        return 2

    schema_text = schema_path.read_text(encoding="utf-8")

    # Extract parent info
    parent_info = _find_query_field(schema_text, args.parent)
    if not parent_info:
        print(f"[ERROR] Parent query '{args.parent}' not found in schema.", file=sys.stderr)
        return 1

    parent_return_type = parent_info["return_type"]
    parent_param = _extract_param_name(schema_text, args.parent) or "id"

    # Extract child return types
    children_info = []
    for child_name in args.children:
        rt = _extract_return_type(schema_text, child_name)
        if not rt:
            print(f"[WARN] Could not determine return type for '{child_name}' — using 'JSON'",
                  file=sys.stderr)
            rt = "JSON"
        children_info.append({"query_name": child_name, "return_type": rt})

    # Build additions
    orchestrated_query = _build_orchestrated_query(
        parent_info, args.orchestrated_name, args.parent
    )
    extend_type_block = _build_extend_type(
        parent_return_type, children_info, parent_param
    )

    # Insert orchestrated query at the end of the Query type
    new_schema = re.sub(
        r"(\btype\s+Query\s*\{[^}]*)(})",
        lambda m: m.group(1) + orchestrated_query + m.group(2),
        schema_text,
        flags=re.DOTALL,
    )
    new_schema += extend_type_block
    new_schema = _enforce_ascii(new_schema)

    # Update tools and index files
    tools_text = tools_path.read_text(encoding="utf-8") if tools_path.exists() else ""
    index_text = index_path.read_text(encoding="utf-8") if index_path.exists() else ""

    # Detect non-orchestrated tool names from current tools file
    existing_tool_names = re.findall(r'name\s*:\s*"(\w+)"', tools_text)
    merged_names = set([args.parent] + args.children)
    non_orchestrated = [n for n in existing_tool_names if n not in merged_names]

    new_tools, new_index = _update_tools_visibility(
        tools_text, index_text,
        args.orchestrated_name, args.parent, args.children,
        non_orchestrated,
    )
    new_tools = _enforce_ascii(new_tools)

    if args.dry_run:
        print("[DRY-RUN] Schema additions (orchestrated query + extend type):")
        print(orchestrated_query)
        print(extend_type_block)
        print()
        print("[DRY-RUN] No files written.")
        return 0

    schema_path.write_text(new_schema, encoding="utf-8")
    print(f"[OK] Schema updated:  {schema_path}")

    if tools_path.exists():
        tools_path.write_text(new_tools, encoding="utf-8")
        print(f"[OK] Tools updated:   {tools_path}")

    if index_path.exists():
        index_path.write_text(new_index, encoding="utf-8")
        print(f"[OK] Index updated:   {index_path}")

    print()
    print(f"[OK] Orchestrated query '{args.orchestrated_name}' added.")
    print(f"     Parent '{args.parent}' extended with {len(children_info)} @materializer field(s).")
    print()
    print("Next steps:")
    print("  1. Review the schema changes")
    print("  2. Deploy: python api-connect/deploy.py")

    return 0


if __name__ == "__main__":
    sys.exit(main())

# Made with IBM Bob
