#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
detect_relationships.py
-----------------------
Scan an existing GraphQL schema produced by graphql-api-creator and
identify parent-child query pairs that are candidates for orchestration
via @materializer.

A candidate group is: two or more Query fields whose REST endpoint paths
share a common parent resource prefix and the same ID parameter name.

Example:
    getAccountByID        GET /accounts/$accountID        ← parent
    getComplianceForID    GET /accounts/$accountID/compliance   ← child
    getBankDetailsForID   GET /accounts/$accountID/bankdetails  ← child

Usage:
    python detect_relationships.py [--project-root PATH] [--input-file PATH]

Exit codes:
    0  Candidates found
    1  Runtime error
    2  Precondition not met (no schema, or no orchestratable queries)
"""

import argparse
import re
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Query extraction
# ---------------------------------------------------------------------------

def _extract_queries(schema_text: str) -> list[dict]:
    """
    Extract all Query fields and their @rest endpoint URLs.

    Returns list of:
        {
            "name":     "getAccountByID",
            "endpoint": "/accounts/$accountID",
            "params":   ["accountID"],
        }
    """
    queries: list[dict] = []

    # Find the Query type block
    query_block = re.search(r"\btype\s+Query\s*\{(.*?)\}", schema_text, re.DOTALL)
    if not query_block:
        return queries

    body = query_block.group(1)

    # Split into individual field+directive chunks by looking for field declarations
    # followed by optional @rest(...) directives
    field_pattern = re.compile(
        r"(\w+)\s*(?:\([^)]*\))?\s*:\s*\S+[^\n]*"
        r"(?:\s*@rest\s*\(.*?\))?",
        re.DOTALL,
    )

    for m in field_pattern.finditer(body):
        field_name = m.group(0).split("(")[0].strip()
        if not field_name or not field_name.replace("_", "").isalpha():
            continue

        # Extract endpoint from @rest directive in this chunk
        chunk = m.group(0)
        endpoint_match = re.search(r'endpoint\s*:\s*"([^"]+)"', chunk)
        if not endpoint_match:
            continue

        endpoint = endpoint_match.group(1)

        # Extract $variable names from the endpoint
        params = re.findall(r"\$(\w+)", endpoint)

        # Normalise: remove host prefix (keep path only)
        # e.g. "https://api.example.com/accounts/$id" → "/accounts/$id"
        path_match = re.search(r"((?:/[^\"?]+))", endpoint)
        path = path_match.group(1) if path_match else endpoint

        queries.append({
            "name":     field_name,
            "endpoint": endpoint,
            "path":     path,
            "params":   params,
        })

    return queries


# ---------------------------------------------------------------------------
# Relationship detection
# ---------------------------------------------------------------------------

def _detect_groups(queries: list[dict]) -> list[dict]:
    """
    Group queries into parent-child sets.

    A parent path is the shortest path for a given parameter combination.
    Children are paths that start with the parent path and add a sub-resource segment.

    Returns list of:
        {
            "parent":   {name, path, params},
            "children": [{name, path, params}, ...],
            "param":    "accountID",
        }
    """
    groups: list[dict] = []

    # Normalise paths: replace $var with a placeholder for comparison
    def normalise(path: str) -> str:
        return re.sub(r"\$\w+", "{id}", path)

    norm_map = {q["name"]: normalise(q["path"]) for q in queries}

    # Find pairs where one path is a strict prefix of another
    candidate_parents: set[str] = set()
    for q in queries:
        norm_q = norm_map[q["name"]]
        for other in queries:
            if other["name"] == q["name"]:
                continue
            norm_other = norm_map[other["name"]]
            if norm_other.startswith(norm_q + "/") and norm_q != norm_other:
                candidate_parents.add(q["name"])

    for parent_name in candidate_parents:
        parent_q = next(q for q in queries if q["name"] == parent_name)
        norm_parent = norm_map[parent_name]
        children = [
            q for q in queries
            if q["name"] != parent_name
            and norm_map[q["name"]].startswith(norm_parent + "/")
        ]
        if len(children) < 2:
            continue  # need at least 2 children to be worth orchestrating
        # Confirm shared ID parameter
        shared_params = set(parent_q["params"]) & set(
            p for child in children for p in child["params"]
        )
        if not shared_params:
            continue
        groups.append({
            "parent":   parent_q,
            "children": children,
            "param":    next(iter(shared_params)),
        })

    return groups


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

def _format_report(groups: list[dict], schema_path: Path) -> str:
    if not groups:
        return (
            "No orchestratable query groups found.\n\n"
            "For orchestration, the schema needs at least one parent endpoint with\n"
            "2 or more child endpoints sharing the same ID parameter.\n"
        )

    lines = [
        f"Orchestration candidates in: {schema_path.name}",
        "",
    ]
    for i, group in enumerate(groups, 1):
        parent = group["parent"]
        children = group["children"]
        param = group["param"]
        all_names = [parent["name"]] + [c["name"] for c in children]
        # Suggest orchestrated name: get{Resource}Details
        resource_match = re.search(r"get(\w+?)(?:ByID|ForID|s$|$)", parent["name"])
        resource = resource_match.group(1) if resource_match else "Resource"
        suggested_name = f"get{resource}Details"

        lines += [
            f"Group {i}: {parent['name']} + {len(children)} child endpoint(s)",
            f"  Parent:   {parent['name']}  ({parent['path']})",
            f"  Children:",
        ]
        for child in children:
            lines.append(f"    - {child['name']}  ({child['path']})")
        lines += [
            f"  Shared ID parameter: ${param}",
            f"  Suggested orchestrated query name: {suggested_name}",
            f"  Queries that would be merged: {', '.join(all_names)}",
            "",
        ]

    lines.append(
        "Run generate_orchestration.py to apply the orchestration."
    )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Detect parent-child query relationships in a GraphQL schema.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--project-root", default=None,
                        help="Project root directory (default: cwd)")
    parser.add_argument("--input-file", default=None,
                        help="Path to the schema .graphql file to analyse")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve() if args.project_root else Path.cwd()
    schema_dir = project_root / "api-connect" / "graphql" / "schema"

    if args.input_file:
        schema_path = Path(args.input_file)
    else:
        candidates = sorted(schema_dir.glob("*.graphql"))
        if not candidates:
            print(
                "[ERROR] No .graphql files found in:\n"
                f"        {schema_dir}\n"
                "        Run graphql-api-creator first.",
                file=sys.stderr,
            )
            return 2
        schema_path = candidates[0]
        if len(candidates) > 1:
            print(
                "[WARN] Multiple schema files found — analysing the first one.\n"
                "       Use --input-file to specify which schema to analyse.",
                file=sys.stderr,
            )

    if not schema_path.exists():
        print(f"[ERROR] Schema file not found: {schema_path}", file=sys.stderr)
        return 2

    schema_text = schema_path.read_text(encoding="utf-8")
    queries = _extract_queries(schema_text)

    if len(queries) < 2:
        print(
            "[ERROR] The schema must contain at least 2 Query fields with\n"
            "        @rest endpoints to detect orchestration candidates.",
            file=sys.stderr,
        )
        return 2

    groups = _detect_groups(queries)
    print(_format_report(groups, schema_path))

    return 0 if groups else 2


if __name__ == "__main__":
    sys.exit(main())

# Made with IBM Bob
