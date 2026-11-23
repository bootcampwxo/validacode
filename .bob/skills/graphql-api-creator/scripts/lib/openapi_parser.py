#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lib/openapi_parser.py
---------------------
Load and parse Swagger 2.0 / OpenAPI 3.x specifications.
Extracts GET operations, their parameters, and response schemas.

Supports JSON and YAML input files.
"""

import json
import sys
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# Optional YAML support
# ---------------------------------------------------------------------------
try:
    import yaml as _yaml
    _YAML_AVAILABLE = True
except ImportError:
    _YAML_AVAILABLE = False


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def load_spec(path: Path) -> dict:
    """
    Load an OpenAPI / Swagger spec from *path*.

    Supports:
        - JSON (.json)
        - YAML (.yaml / .yml)  — requires PyYAML

    Returns the parsed spec as a plain dict.
    Raises SystemExit(1) on parse or IO error.
    """
    suffix = path.suffix.lower()
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"[ERROR] Cannot read {path}: {exc}", file=sys.stderr)
        sys.exit(1)

    if suffix == ".json":
        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            print(f"[ERROR] JSON parse error in {path}: {exc}", file=sys.stderr)
            sys.exit(1)

    if suffix in (".yaml", ".yml"):
        if not _YAML_AVAILABLE:
            print(
                "[ERROR] PyYAML is required to parse YAML files.\n"
                "        Install it with:  pip install pyyaml",
                file=sys.stderr,
            )
            sys.exit(1)
        try:
            return _yaml.safe_load(text)
        except _yaml.YAMLError as exc:
            print(f"[ERROR] YAML parse error in {path}: {exc}", file=sys.stderr)
            sys.exit(1)

    print(
        f"[ERROR] Unsupported file extension '{suffix}'. "
        "Expected .json, .yaml, or .yml",
        file=sys.stderr,
    )
    sys.exit(1)


def detect_spec_version(spec: dict) -> str:
    """
    Return 'swagger2' or 'openapi3' based on the spec root keys.
    Raises ValueError for unknown formats.
    """
    if "swagger" in spec and spec["swagger"].startswith("2"):
        return "swagger2"
    if "openapi" in spec and spec["openapi"].startswith("3"):
        return "openapi3"
    raise ValueError(
        "Cannot determine spec version — "
        "expected 'swagger: 2.x' or 'openapi: 3.x' at root"
    )


def extract_get_operations(spec: dict) -> list[dict]:
    """
    Return all GET operations from the spec as a list of dicts:

        {
            "index":        int,            # 1-based display number
            "method":       "GET",
            "path":         "/resource/{id}",
            "operation_id": "getResourceById",
            "summary":      "Get resource by ID",
            "parameters":   [ ... ],        # raw OpenAPI parameter objects
            "responses":    { ... },        # raw OpenAPI response objects
            "spec_version": "swagger2" | "openapi3",
        }

    Non-GET operations are silently excluded.
    Skips paths whose GET operation has no operationId (logs a warning).
    """
    version = detect_spec_version(spec)
    paths: dict = spec.get("paths", {})
    operations = []
    index = 1

    for path, path_item in paths.items():
        if not isinstance(path_item, dict):
            continue
        op = path_item.get("get")
        if not op or not isinstance(op, dict):
            continue

        operation_id = op.get("operationId")
        if not operation_id:
            print(
                f"[WARN] GET {path} has no operationId — skipped",
                file=sys.stderr,
            )
            continue

        # Merge path-level parameters with operation-level parameters
        path_params = path_item.get("parameters", [])
        op_params = op.get("parameters", [])
        merged_params = _merge_parameters(path_params, op_params)

        operations.append({
            "index":        index,
            "method":       "GET",
            "path":         path,
            "operation_id": operation_id,
            "summary":      op.get("summary", ""),
            "parameters":   merged_params,
            "responses":    op.get("responses", {}),
            "spec_version": version,
        })
        index += 1

    return operations


def format_operations_list(operations: list[dict]) -> str:
    """
    Format operations as the numbered display shown to the user in
    graphql-api-creator SKILL.md §2.1, e.g.:

        Read Operations Detected

        1. GET /accounts
           operationId: getAccounts
           summary: Get all Customer Accounts

        2. GET /accounts/{accountID}
           operationId: getAccountByID
           summary: Get Customer Account by ID
    """
    if not operations:
        return "No GET operations found in the specification."

    lines = ["Read Operations Detected", ""]
    for op in operations:
        summary_line = (
            f"   summary: {op['summary']}" if op["summary"] else ""
        )
        lines.append(f"{op['index']}. GET {op['path']}")
        lines.append(f"   operationId: {op['operation_id']}")
        if summary_line:
            lines.append(summary_line)
        lines.append("")

    return "\n".join(lines).rstrip()


def get_required_params(operation: dict) -> list[dict]:
    """Return only the required parameters from an operation."""
    return [p for p in operation.get("parameters", []) if p.get("required", False)]


def get_response_schema(operation: dict, spec: dict) -> dict | None:
    """
    Attempt to extract the primary response schema (200 / 201) from an operation.
    Resolves $ref references within the spec.
    Returns None if no schema is found.
    """
    responses = operation.get("responses", {})
    for status in ("200", "201", 200, 201):
        resp = responses.get(status)
        if not resp:
            continue
        # OpenAPI 3.x
        content = resp.get("content", {})
        for mime in ("application/json", "application/xml"):
            if mime in content:
                schema = content[mime].get("schema")
                if schema:
                    return _resolve_ref(schema, spec)
        # Swagger 2.x
        schema = resp.get("schema")
        if schema:
            return _resolve_ref(schema, spec)
    return None


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _merge_parameters(path_params: list, op_params: list) -> list:
    """
    Merge path-level and operation-level parameter lists.
    Operation-level parameters override path-level ones with the same name+in.
    """
    merged: dict[tuple, dict] = {}
    for p in path_params:
        key = (p.get("name"), p.get("in"))
        merged[key] = p
    for p in op_params:
        key = (p.get("name"), p.get("in"))
        merged[key] = p
    return list(merged.values())


def _resolve_ref(obj: Any, spec: dict) -> Any:
    """
    Resolve a single-level $ref from the root spec.
    Only handles '#/definitions/...', '#/components/schemas/...'.
    Returns the original object unchanged if no $ref or ref not found.
    """
    if not isinstance(obj, dict):
        return obj
    ref = obj.get("$ref")
    if not ref or not ref.startswith("#/"):
        return obj
    parts = ref.lstrip("#/").split("/")
    node = spec
    try:
        for part in parts:
            node = node[part]
        return node
    except (KeyError, TypeError):
        return obj
