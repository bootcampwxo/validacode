#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_schema.py
------------------
Generate GraphQL schema, tools, and index files from a confirmed list of
OpenAPI GET operations.

This script is invoked AFTER the user has selected which operations to
include (via parse_operations.py). It implements the generation logic
described in graphql-api-creator SKILL.md sections 4-14.

Usage:
    python generate_schema.py --input-file PATH --operations A
                              [--project-root PATH] [--dry-run]

    --operations accepts:
        A          All GET operations
        1,3,5      Comma-separated numbers to include
        -2,4       Numbers to exclude (prefix with -)
        opId,...   Comma-separated operationIds

Exit codes:
    0  Success
    1  Runtime error
    2  Precondition not met
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.openapi_parser import (
    load_spec,
    detect_spec_version,
    extract_get_operations,
    get_response_schema,
    get_required_params,
)
from lib.graphql_writer import write_graphql_file


# ---------------------------------------------------------------------------
# Precondition check
# ---------------------------------------------------------------------------

def check_prerequisites(project_root: Path) -> Path:
    """
    Verify that the api-connect/graphql/ directory exists and has been
    scaffolded. Returns graphql_dir on success, exits with code 2 if not.
    """
    graphql_dir = project_root / "api-connect" / "graphql"
    if not graphql_dir.exists():
        print(
            "[PRECONDITION] api-connect/graphql/ not found.\n"
            "Run scaffold_project.py first.",
            file=sys.stderr,
        )
        sys.exit(2)
    return graphql_dir


# ---------------------------------------------------------------------------
# Operation selection
# ---------------------------------------------------------------------------

def resolve_selection(operations: list[dict], selection: str) -> list[dict]:
    """
    Resolve user selection string to a filtered list of operations.

    Accepted formats:
        A           - all operations
        1,3,5       - include by 1-based index
        -2,4        - exclude by 1-based index
        opId,...    - include by operationId
    """
    s = selection.strip()
    if s.upper() == "A":
        return operations

    all_ids = {op["operation_id"] for op in operations}
    all_indices = {op["index"] for op in operations}

    # Exclusion mode: starts with '-' followed by numbers
    if s.startswith("-") and all(
        part.lstrip("-").isdigit() for part in s.split(",")
    ):
        exclude_indices = {abs(int(x)) for x in s.split(",")}
        return [op for op in operations if op["index"] not in exclude_indices]

    # Numeric inclusion
    parts = [p.strip() for p in s.split(",")]
    if all(p.isdigit() for p in parts):
        include_indices = {int(p) for p in parts}
        selected = [op for op in operations if op["index"] in include_indices]
        unknown = include_indices - all_indices
        if unknown:
            print(
                f"[WARN] Unknown operation numbers: {sorted(unknown)}",
                file=sys.stderr,
            )
        return selected

    # operationId list
    include_ids = {p for p in parts}
    selected = [op for op in operations if op["operation_id"] in include_ids]
    unknown_ids = include_ids - all_ids
    if unknown_ids:
        print(
            f"[WARN] Unknown operationIds: {sorted(unknown_ids)}",
            file=sys.stderr,
        )
    return selected


# ---------------------------------------------------------------------------
# Type name derivation
# ---------------------------------------------------------------------------

def _to_type_name(operation_id: str) -> str:
    """
    Derive a GraphQL type name from an operationId.
    Strips leading 'get' / 'list' / 'fetch', capitalises first letter.
    """
    stripped = operation_id
    for prefix in ("get", "list", "fetch", "search"):
        if stripped.lower().startswith(prefix):
            stripped = stripped[len(prefix):]
            break
    if stripped:
        return stripped[0].upper() + stripped[1:]
    return operation_id[0].upper() + operation_id[1:]


def _to_camel(name: str) -> str:
    """Convert snake_case to camelCase."""
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def _graphql_scalar(schema: dict) -> str:
    """Map an OpenAPI schema type to a GraphQL scalar type."""
    t = schema.get("type", "string")
    fmt = schema.get("format", "")
    mapping = {
        ("integer", ""):       "Int",
        ("integer", "int32"):  "Int",
        ("integer", "int64"):  "Int",
        ("number",  ""):       "Float",
        ("number",  "float"):  "Float",
        ("number",  "double"): "Float",
        ("boolean", ""):       "Boolean",
        ("string",  ""):       "String",
        ("string",  "date"):   "String",
        ("string",  "date-time"): "String",
        ("string",  "uuid"):   "String",
    }
    return mapping.get((t, fmt), "String")


# ---------------------------------------------------------------------------
# Schema generation
# ---------------------------------------------------------------------------

def _build_flat_type(type_name: str, response_schema: dict | None) -> list[str]:
    """
    Build a flat GraphQL type definition from a response schema.
    Falls back to a minimal type with an id field if schema is unknown.
    """
    lines = [f"type {type_name} {{"]

    if not response_schema:
        lines.append("  id: String")
        lines.append("  # TODO: add fields based on actual API response")
        lines.append("}")
        return lines

    # Handle array response — unwrap to item schema
    schema = response_schema
    if schema.get("type") == "array" and "items" in schema:
        schema = schema["items"]

    # Handle $ref at item level (already resolved by openapi_parser)
    props = schema.get("properties", {})
    if not props:
        lines.append("  id: String")
        lines.append("  # TODO: add fields based on actual API response")
        lines.append("}")
        return lines

    for field_name, field_schema in props.items():
        if not isinstance(field_schema, dict):
            continue
        gql_name = _to_camel(field_name)
        if field_schema.get("type") == "array":
            item_schema = field_schema.get("items", {})
            item_type = _graphql_scalar(item_schema)
            lines.append(f"  {gql_name}: [{item_type}]")
        else:
            gql_type = _graphql_scalar(field_schema)
            lines.append(f"  {gql_name}: {gql_type}")

    lines.append("}")
    return lines


def _build_query_field(op: dict, type_name: str, is_list: bool,
                       base_url: str, auth_mode: str) -> list[str]:
    """Build a single query field with @rest directive."""
    params = get_required_params(op)
    args_str = ""
    if params:
        arg_parts = []
        for p in params:
            gql_arg = _to_camel(p.get("name", "arg"))
            gql_type = "String"
            schema = p.get("schema", p)
            if schema.get("type") == "integer":
                gql_type = "Int"
            arg_parts.append(f"{gql_arg}: {gql_type}!")
        args_str = "(" + ", ".join(arg_parts) + ")"

    return_type = f"[{type_name}]" if is_list else type_name
    op_name = op["operation_id"][0].lower() + op["operation_id"][1:]
    path = op["path"]
    # Convert OpenAPI {param} to GraphQL $param
    gql_path = path.replace("{", "$").replace("}", "")
    endpoint = base_url.rstrip("/") + gql_path if base_url else gql_path

    lines = [
        f"  {op_name}{args_str}: {return_type}",
        f"    @rest(",
        f'      endpoint: "{endpoint}"',
        f'      configuration: "upstream_configuration"',
    ]

    if auth_mode == "api_key":
        lines.append(
            '      headers: [{ name: "x-Gateway-APIKey", value: "$upstream_api_key" }]'
        )
    elif auth_mode == "bearer":
        lines.append(
            '      headers: [{ name: "Authorization", value: "Bearer $upstream_token" }]'
        )
    elif auth_mode == "forward":
        lines.append('      forwardheaders: ["Authorization"]')

    lines.append("    )")
    return lines


def generate_schema_content(
    operations: list[dict],
    spec: dict,
    auth_mode: str,
    base_url: str,
) -> str:
    """Build the full schema .graphql file content."""
    lines: list[str] = []
    query_lines: list[str] = ["type Query {"]

    for op in operations:
        response_schema = get_response_schema(op, spec)
        type_name = _to_type_name(op["operation_id"])

        # Detect if return type is a list
        is_list = False
        if response_schema and response_schema.get("type") == "array":
            is_list = True

        # Type definition
        lines.extend(_build_flat_type(type_name, response_schema))
        lines.append("")

        # Query field
        query_lines.extend(
            _build_query_field(op, type_name, is_list, base_url, auth_mode)
        )
        query_lines.append("")

    query_lines.append("}")
    lines.extend(query_lines)
    return "\n".join(lines) + "\n"


def generate_tools_content(operations: list[dict]) -> str:
    """Build the tools .graphql file content."""
    lines: list[str] = []
    for op in operations:
        op_name = op["operation_id"][0].lower() + op["operation_id"][1:]
        summary = op.get("summary", "").replace('"', "'") or f"Retrieves {op_name} data."
        description = summary if summary.endswith(".") else summary + "."
        lines.append("extend schema")
        lines.append("  @tool(")
        lines.append(f'    name: "{op_name}"')
        lines.append(f'    description: "{description} Read-only operation."')
        lines.append(
            f'    graphql: {{ expose: true, types: "Query", fields: "{op_name}" }}'
        )
        lines.append("  )")
        lines.append("")
    return "\n".join(lines)


def generate_index_content(input_filename: str, tool_names: list[str]) -> str:
    """Build the index.graphql file content."""
    fields_pattern = "|".join(tool_names)
    return (
        "schema\n"
        "  @sdl(\n"
        "    files: [\n"
        f'      "schema/{input_filename}.graphql"\n'
        f'      "tools/{input_filename}.graphql"\n'
        "    ]\n"
        "    visibility: {\n"
        "      expose: true\n"
        '      types: "Query"\n'
        f'      fields: "({fields_pattern})"\n'
        "    }\n"
        "  )\n"
        "  {\n"
        "    query: Query\n"
        "  }\n"
    )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Generate GraphQL schema, tools, and index files from a "
            "confirmed list of OpenAPI GET operations."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--input-file",
        required=False,
        default=None,
        help="Path to the OpenAPI/Swagger spec file (auto-detected if omitted)",
    )
    parser.add_argument(
        "--operations",
        default="A",
        help=(
            "Operations to include: A=all, 1,3=by index, -2=exclude index, "
            "opId1,opId2=by operationId  (default: A)"
        ),
    )
    parser.add_argument(
        "--auth",
        default="none",
        choices=["none", "api_key", "bearer", "forward"],
        help="Authentication method to apply to all @rest directives (default: none)",
    )
    parser.add_argument(
        "--base-url",
        default="",
        help="Upstream API base URL (e.g. https://api.example.com/v1)",
    )
    parser.add_argument(
        "--project-root",
        default=None,
        help="Project root directory (default: cwd)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print generated content without writing files",
    )
    args = parser.parse_args()

    project_root = (
        Path(args.project_root).resolve()
        if args.project_root
        else Path.cwd()
    )

    graphql_dir = check_prerequisites(project_root)

    # ── Resolve spec file ─────────────────────────────────────────────────
    if args.input_file:
        spec_path = Path(args.input_file).resolve()
    else:
        input_dir = graphql_dir / "input"
        candidates = sorted(
            p for p in (input_dir.iterdir() if input_dir.exists() else [])
            if p.suffix.lower() in (".json", ".yaml", ".yml")
        )
        if not candidates:
            print(
                "[ERROR] No spec file found in api-connect/graphql/input/.\n"
                "Use --input-file PATH.",
                file=sys.stderr,
            )
            return 2
        spec_path = candidates[0]
        print(f"[INFO] Using spec: {spec_path}")

    spec = load_spec(spec_path)
    input_filename = spec_path.stem

    # ── Extract and filter operations ─────────────────────────────────────
    all_ops = extract_get_operations(spec)
    if not all_ops:
        print("[ERROR] No GET operations found in spec.", file=sys.stderr)
        return 2

    selected = resolve_selection(all_ops, args.operations)
    if not selected:
        print("[ERROR] No operations selected.", file=sys.stderr)
        return 2

    print(f"Generating schema for {len(selected)} operation(s) from {spec_path.name}:")
    for op in selected:
        print(f"  - {op['operation_id']}  GET {op['path']}")
    print()

    # ── Generate content ──────────────────────────────────────────────────
    schema_content = generate_schema_content(selected, spec, args.auth, args.base_url)
    tools_content  = generate_tools_content(selected)
    tool_names     = [
        op["operation_id"][0].lower() + op["operation_id"][1:]
        for op in selected
    ]
    index_content  = generate_index_content(input_filename, tool_names)

    # ── Write files ───────────────────────────────────────────────────────
    schema_path = graphql_dir / "schema" / f"{input_filename}.graphql"
    tools_path  = graphql_dir / "tools"  / f"{input_filename}.graphql"
    index_path  = graphql_dir / "index.graphql"

    write_graphql_file(schema_path, schema_content, dry_run=args.dry_run)
    write_graphql_file(tools_path,  tools_content,  dry_run=args.dry_run)
    write_graphql_file(index_path,  index_content,  dry_run=args.dry_run)

    if not args.dry_run:
        print()
        print("[OK] Schema generation complete.")
        print()
        print("Next steps:")
        print(f"  - Review: {schema_path}")
        print(f"  - Review: {tools_path}")
        print(f"  - Review: {index_path}")
        print(
            "  - Optional: run graphql-field-optimization to rename fields"
        )
        print(
            "  - Optional: run graphql-query-orchestrator to merge parent/child queries"
        )
        print(
            "  - Deploy:   python .bob/skills/graphql-api-creator/scripts/deploy.py"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())

# Made with IBM Bob
