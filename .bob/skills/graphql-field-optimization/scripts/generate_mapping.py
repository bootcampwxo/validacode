#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_mapping.py
-------------------
Analyse an existing GraphQL schema produced by graphql-api-creator and
generate a Markdown mapping file at api-connect/graphql/mappings/{api-name}.md.

The mapping file lists every field from every type definition alongside
a default 1:1 mapping and optimisation suggestions (camelCase expansion
of snake_case and common abbreviations).

Usage:
    python generate_mapping.py [--project-root PATH] [--input-file PATH]
                               [--dry-run]

Exit codes:
    0  Success
    1  Runtime error
    2  Precondition not met (no schema file found — run graphql-api-creator first)
"""

import argparse
import re
import sys
from datetime import date
from pathlib import Path

# ---------------------------------------------------------------------------
# Common abbreviation expansions (lower-case key → camelCase expansion)
# ---------------------------------------------------------------------------
_ABBREV: dict[str, str] = {
    "aml":   "antiMoneyLaundering",
    "kyc":   "knowYourCustomer",
    "iban":  "internationalBankAccountNumber",
    "ssn":   "socialSecurityNumber",
    "dob":   "dateOfBirth",
    "api":   "applicationProgrammingInterface",
    "url":   "uniformResourceLocator",
    "uuid":  "universallyUniqueIdentifier",
    "id":    "id",         # keep as-is
    "addr":  "address",
    "qty":   "quantity",
    "amt":   "amount",
    "num":   "number",
    "pct":   "percentage",
    "ref":   "reference",
    "desc":  "description",
    "ts":    "timestamp",
    "dt":    "dateTime",
    "src":   "source",
    "dst":   "destination",
    "msg":   "message",
    "err":   "error",
    "cfg":   "configuration",
    "auth":  "authentication",
    "acct":  "account",
    "txn":   "transaction",
    "tx":    "transaction",
    "cust":  "customer",
    "prod":  "product",
    "cat":   "category",
    "img":   "image",
    "doc":   "document",
    "loc":   "location",
    "lat":   "latitude",
    "lng":   "longitude",
    "lon":   "longitude",
    "tel":   "telephone",
    "mob":   "mobile",
    "fatca": "fatca",      # widely-known acronym — keep
    "vat":   "valueAddedTax",
    "ror":   "rateOfReturn",
    "irr":   "internalRateOfReturn",
    "npv":   "netPresentValue",
    "ebitda":"ebitda",     # widely-known — keep
    "ytd":   "yearToDate",
    "mtd":   "monthToDate",
    "qtd":   "quarterToDate",
}


def _snake_to_camel(name: str) -> str:
    """Convert snake_case or SCREAMING_SNAKE to camelCase."""
    parts = re.split(r"[_\s]+", name.lower())
    if not parts:
        return name
    return parts[0] + "".join(p.title() for p in parts[1:])


def _suggest_name(raw: str) -> tuple[str, str]:
    """
    Return (suggested_graphql_name, note).

    1. If the field is already valid camelCase with no abbreviations → keep it.
    2. Expand known abbreviations.
    3. Convert snake_case / PascalCase / UPPERCASE to camelCase.
    """
    lower = raw.lower().rstrip("_")

    # Full-field abbreviation match
    if lower in _ABBREV and lower != "id":
        expanded = _ABBREV[lower]
        if expanded != lower:
            return expanded, f"Expand {raw} abbreviation"

    # snake_case: split on underscores and expand each token
    if "_" in raw:
        parts = raw.lower().split("_")
        new_parts = []
        for i, part in enumerate(parts):
            if part in _ABBREV and part != "id":
                new_parts.append(
                    _ABBREV[part] if i == 0 else _ABBREV[part][0].upper() + _ABBREV[part][1:]
                )
            else:
                new_parts.append(part if i == 0 else part.title())
        suggested = "".join(new_parts)
        if suggested != raw:
            return suggested, "Convert snake_case to camelCase"

    # PascalCase → camelCase
    if raw[0].isupper():
        suggested = raw[0].lower() + raw[1:]
        return suggested, "Convert PascalCase to camelCase"

    # UPPERCASE → camelCase (e.g. IBAN, URL)
    if raw.isupper() and len(raw) > 1:
        lower_key = raw.lower()
        if lower_key in _ABBREV:
            return _ABBREV[lower_key], f"Expand {raw} abbreviation"
        return raw.lower(), "Convert UPPERCASE to camelCase"

    # Already looks fine
    return raw, ""


def _find_schema_file(project_root: Path, input_file: Path | None) -> Path:
    schema_dir = project_root / "api-connect" / "graphql" / "schema"
    if input_file:
        candidate = schema_dir / (input_file.stem + ".graphql")
        if candidate.exists():
            return candidate
        sys.exit(f"[ERROR] Schema file not found: {candidate}\nRun graphql-api-creator first.")
    graphql_files = sorted(schema_dir.glob("*.graphql"))
    if not graphql_files:
        print(
            "[ERROR] No .graphql files found in:\n"
            f"        {schema_dir}\n"
            "        Run graphql-api-creator first to generate a schema.",
            file=sys.stderr,
        )
        sys.exit(2)
    if len(graphql_files) > 1:
        print(
            "[WARN] Multiple schema files found — using the first one.\n"
            "       Use --input-file to specify which schema to analyse.",
            file=sys.stderr,
        )
    return graphql_files[0]


def _parse_types(schema_text: str) -> dict[str, list[str]]:
    """
    Extract type definitions and their field names from a .graphql schema.
    Returns {TypeName: [field_name, ...]} — Query type excluded.
    """
    types: dict[str, list[str]] = {}
    # Match: type Foo { ... }
    for type_match in re.finditer(
        r"\btype\s+(\w+)\s*\{([^}]*)\}", schema_text, re.DOTALL
    ):
        type_name = type_match.group(1)
        if type_name == "Query":
            continue
        body = type_match.group(2)
        fields = []
        for line in body.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # field_name: Type or field_name(args): Type
            m = re.match(r"^(\w+)\s*[\(:]", line)
            if m:
                fields.append(m.group(1))
        if fields:
            types[type_name] = fields
    return types


def _generate_mapping_md(
    schema_path: Path,
    schema_text: str,
    project_root: Path,
) -> str:
    api_name = schema_path.stem
    types = _parse_types(schema_text)
    today = date.today().isoformat()

    lines: list[str] = [
        f"# Field Mappings: {api_name}",
        "",
        f"**Status:** 🔄 Draft  ",
        f"**Generated:** {today}  ",
        f"**Source schema:** `api-connect/graphql/schema/{api_name}.graphql`  ",
        f"**Target schema:** `api-connect/graphql/schema/{api_name}.graphql`  ",
        f"**Target tools:** `api-connect/graphql/tools/{api_name}.graphql`  ",
        "",
        "---",
        "",
        "## Instructions",
        "",
        "1. Review the **GraphQL Field** column — each row starts with a 1:1 default.",
        "2. Edit the field name in **GraphQL Field** to your preferred name.",
        "3. Update **Status** to `✅ Custom` for every field you rename.",
        "4. Set **Status** to `⏭️ Skip` for fields you want to keep unchanged.",
        "5. Set **Status** to `🚫 Excluded` to remove a field from the schema entirely.",
        "6. Save this file, then run `apply_mappings.py` to apply the changes.",
        "",
        "### Status indicators",
        "",
        "| Icon | Meaning |",
        "|------|---------|",
        "| 🔄 Default | 1:1 mapping — no setter needed |",
        "| ✅ Custom | Custom name applied — setter will be configured |",
        "| ⏭️ Skip | Keep backend name as-is — no change |",
        "| 🚫 Excluded | Remove this field from the schema |",
        "",
        "### Naming convention",
        "",
        "Always use **camelCase** for GraphQL field names. Never use snake_case.",
        "",
        "---",
        "",
    ]

    total_fields = 0
    for type_name, fields in sorted(types.items()):
        lines.append(f"## Type: {type_name}")
        lines.append("")
        lines.append("| Backend Field | GraphQL Field | Status | Notes |")
        lines.append("|--------------|---------------|--------|-------|")
        for field in fields:
            suggested, note = _suggest_name(field)
            if suggested != field and note:
                status = "🔄 Default"
                # Put suggestion in the GraphQL Field column to make editing easy
                graphql_field = suggested
                note_text = note
            else:
                status = "🔄 Default"
                graphql_field = field
                note_text = ""
            lines.append(
                f"| `{field}` | `{graphql_field}` | {status} | {note_text} |"
            )
            total_fields += 1
        lines.append("")

    lines += [
        "---",
        "",
        "## Summary",
        "",
        f"- **Total fields analysed:** {total_fields}",
        f"- **Types:** {len(types)}",
        "- **Custom mappings:** 0 (update Status column to ✅ Custom when you rename a field)",
        "",
        "## Version History",
        "",
        "| Date | Changes | Author |",
        "|------|---------|--------|",
        f"| {today} | Initial mapping file generated | graphql-field-optimization |",
        "",
        "---",
        "",
        "<!-- Made with IBM Bob -->",
    ]

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate a field mapping file from an existing GraphQL schema.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--project-root", default=None,
                        help="Project root directory (default: cwd)")
    parser.add_argument("--input-file", default=None,
                        help="Path to the OpenAPI spec or schema .graphql file")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print the mapping file content without writing it")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve() if args.project_root else Path.cwd()
    input_file = Path(args.input_file) if args.input_file else None

    schema_path = _find_schema_file(project_root, input_file)

    try:
        schema_text = schema_path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"[ERROR] Cannot read schema: {exc}", file=sys.stderr)
        return 1

    mapping_md = _generate_mapping_md(schema_path, schema_text, project_root)

    mappings_dir = project_root / "api-connect" / "graphql" / "mappings"
    output_path = mappings_dir / (schema_path.stem + ".md")

    if args.dry_run:
        print(f"[DRY-RUN] Would write mapping file to: {output_path}")
        print()
        print(mapping_md)
        return 0

    mappings_dir.mkdir(parents=True, exist_ok=True)
    try:
        output_path.write_text(mapping_md, encoding="utf-8")
        print(f"[OK] Mapping file written: {output_path}")
        print()
        types = _parse_types(schema_text)
        total = sum(len(f) for f in types.values())
        print(f"     Types: {len(types)}   Fields: {total}")
        print()
        print("Next steps:")
        print(f"  1. Review and edit: {output_path}")
        print("  2. Set Status to '✅ Custom' for fields you rename")
        print("  3. Run: python apply_mappings.py")
    except OSError as exc:
        print(f"[ERROR] Cannot write mapping file: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())

# Made with IBM Bob
