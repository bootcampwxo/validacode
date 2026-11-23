#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scaffold_project.py
-------------------
Create the full api-connect/ folder tree and drop template config files
for a new graphql-api-creator project.

This is the FIRST script to run on a clean project before any schema
generation.

Usage:
    python scaffold_project.py [--project-root PATH] [--endpoint NAME]
                               [--dry-run] [--force]

Exit codes:
    0  Success
    1  Runtime error
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# CLI prerequisite checks
# ---------------------------------------------------------------------------

def _check_cli(name: str) -> tuple[bool, str]:
    """Return (found, version_or_empty) for a CLI tool."""
    found = shutil.which(name) is not None
    if not found:
        return False, ""
    try:
        proc = subprocess.run(
            [name, "--version"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding="utf-8", errors="replace",
            timeout=10,
        )
        raw = (proc.stdout or proc.stderr or "").strip().splitlines()
        return True, raw[0] if raw else ""
    except Exception:
        return True, ""  # found but version check failed — still present


def check_cli_prerequisites() -> list[str]:
    """Check that required CLIs are installed.

    Returns a list of warning strings for missing tools.
    Does NOT abort — callers print the warnings and continue.
    """
    warnings: list[str] = []

    stepzen_found, stepzen_ver = _check_cli("stepzen")
    if stepzen_found:
        print(f"  ✅ stepzen CLI:     {stepzen_ver or 'found'}")
    else:
        warnings.append(
            "stepzen CLI not found — required to deploy the GraphQL API.\n"
            "    Install:  npm install -g stepzen\n"
            "    Requires: Node.js 18+  (https://nodejs.org/)"
        )
        print("  ❌ stepzen CLI:     NOT FOUND  (npm install -g stepzen)")

    orchestrate_found, orchestrate_ver = _check_cli("orchestrate")
    if orchestrate_found:
        print(f"  ✅ orchestrate CLI: {orchestrate_ver or 'found'}")
    else:
        warnings.append(
            "orchestrate CLI not found — required to deploy the watsonx agent.\n"
            "    Install:  pip install ibm-watsonx-orchestrate\n"
            "    Docs:     https://www.ibm.com/docs/en/watsonx/watson-orchestrate/current"
            "?topic=cli-installing"
        )
        print("  ❌ orchestrate CLI: NOT FOUND  (pip install ibm-watsonx-orchestrate)")

    return warnings


# ---------------------------------------------------------------------------
# Config file templates
# ---------------------------------------------------------------------------

_STEPZEN_CONFIG_TEMPLATE = """\
{{
  "endpoint": "api/{endpoint}"
}}
"""

_CONFIG_YAML_TEMPLATE = """\
configurationset:
  - configuration:
      name: upstream_configuration
      # Add your upstream API credentials below.
      # Variable names used here must match the $variable_name references
      # in your @rest directives. Example:
      #   upstream_api_key: YOUR_API_KEY_HERE
access:
  policies:
    - type: Query
      policyDefault:
        condition: "?$jwt"

# deployment:
#   identity:
#     jwksendpoint: https://YOUR_IDENTITY_PROVIDER/oauth2/jwks
#     issuer: https://YOUR_IDENTITY_PROVIDER/oauth2
#     audience: your-audience
# Made with IBM Bob
"""

_DEPLOY_WRAPPER_TEMPLATE = """\
#!/usr/bin/env python3
\"\"\"
Thin wrapper — delegates to the graphql-api-creator skill canonical script.
Run this file directly or use the canonical version instead:
    python .bob/skills/graphql-api-creator/scripts/deploy.py
\"\"\"
import subprocess
import sys
import pathlib

_SKILL_SCRIPT = (
    pathlib.Path(__file__).parent.parent
    / ".bob" / "skills" / "graphql-api-creator" / "scripts" / "deploy.py"
)

if not _SKILL_SCRIPT.exists():
    print(
        f"[ERROR] Canonical deploy script not found: {{_SKILL_SCRIPT}}\\n"
        "Make sure the graphql-api-creator skill is installed.",
        file=sys.stderr,
    )
    sys.exit(1)

sys.exit(subprocess.run([sys.executable, str(_SKILL_SCRIPT)] + sys.argv[1:]).returncode)
# Made with IBM Bob
"""

_UNDEPLOY_WRAPPER_TEMPLATE = """\
#!/usr/bin/env python3
\"\"\"
Thin wrapper — delegates to the graphql-api-creator skill canonical script.
Run this file directly or use the canonical version instead:
    python .bob/skills/graphql-api-creator/scripts/undeploy.py
\"\"\"
import subprocess
import sys
import pathlib

_SKILL_SCRIPT = (
    pathlib.Path(__file__).parent.parent
    / ".bob" / "skills" / "graphql-api-creator" / "scripts" / "undeploy.py"
)

if not _SKILL_SCRIPT.exists():
    print(
        f"[ERROR] Canonical undeploy script not found: {{_SKILL_SCRIPT}}\\n"
        "Make sure the graphql-api-creator skill is installed.",
        file=sys.stderr,
    )
    sys.exit(1)

sys.exit(subprocess.run([sys.executable, str(_SKILL_SCRIPT)] + sys.argv[1:]).returncode)
# Made with IBM Bob
"""


# ---------------------------------------------------------------------------
# Scaffold logic
# ---------------------------------------------------------------------------

def _resolve_endpoint(override: str | None) -> str:
    """Resolve the StepZen endpoint name from args or environment."""
    if override:
        return override
    env_val = os.environ.get("WXO_TOOLKIT_NAME")
    if env_val:
        return env_val
    print(
        "[WARN] WXO_TOOLKIT_NAME is not set and --endpoint was not provided.\n"
        "       Using default endpoint name: my-graphql-api\n"
        "       Update api-connect/graphql/stepzen.config.json after scaffolding.",
        file=sys.stderr,
    )
    return "my-graphql-api"


def _make_dir(path: Path, dry_run: bool) -> None:
    if path.exists():
        print(f"  [SKIP] Already exists: {path}")
    else:
        if dry_run:
            print(f"  [DRY-RUN] Would create directory: {path}")
        else:
            path.mkdir(parents=True, exist_ok=True)
            print(f"  [OK]   Created directory:  {path}")


def _write_file(path: Path, content: str, dry_run: bool, force: bool) -> None:
    if path.exists() and not force:
        print(f"  [SKIP] Already exists (use --force to overwrite): {path}")
        return
    if dry_run:
        action = "overwrite" if path.exists() else "create"
        print(f"  [DRY-RUN] Would {action} file: {path}")
        return
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        action = "Overwrote" if path.exists() else "Created"
        print(f"  [OK]   {action} file:      {path}")
    except OSError as exc:
        print(f"  [ERROR] Cannot write {path}: {exc}", file=sys.stderr)
        sys.exit(1)


# ---------------------------------------------------------------------------
# Config-file sentinel values — what the templates write by default
# ---------------------------------------------------------------------------

# Default endpoint written to stepzen.config.json when WXO_TOOLKIT_NAME is unset
_DEFAULT_ENDPOINT = "my-graphql-api"

# Markers that indicate config.yaml has no real upstream credentials yet
_CONFIG_YAML_PLACEHOLDER_MARKERS = (
    "YOUR_API_KEY_HERE",
    "upstream_api_key:",     # example variable name from the template comment
)

# Variables that deploy.py requires to be populated in .env
_REQUIRED_ENV_VARS = [
    "STEPZEN_INSTANCE_API_KEY",
    "STEPZEN_ENVIRONMENT",
    "STEPZEN_DOMAIN",
    "STEPZEN_INSTANCE_ID",
]

_DUMMY_ENV_CONTENT = """\
# =============================================================================
# .env — project credentials
# Fill in EVERY placeholder before running any deploy script.
# =============================================================================

# -----------------------------------------------------------------------------
# IBM API Connect for GraphQL (StepZen) — required for api-connect/deploy.py
# -----------------------------------------------------------------------------
# How to get these values:
#   0. If you don't have a tenant yet, register a free trial at:
#      https://www.ibm.com/account/reg/signup?formid=urx-52542
#   1. Go to https://aws.console.saas.ibm.com/
#   2. Select your SaaS account (e.g. "API Connect for GraphQL").
#   3. In the instances table, click on your instance.
#   4. On the instance page, create or copy an API key.
#      -> This is STEPZEN_INSTANCE_API_KEY.
#   5. On the login page of your instance, locate the environment and domain:
#      -> STEPZEN_ENVIRONMENT = environment name shown on the login page
#      -> STEPZEN_DOMAIN      = domain name shown on the login page
#      The MCP/Query endpoint base URL is:
#        https://<STEPZEN_ENVIRONMENT>.<STEPZEN_DOMAIN>/
#   6. The instance page shows the stepzen CLI login command, e.g.:
#        stepzen login <domain> -i 123456 -k <key>
#      -> STEPZEN_DOMAIN      = the hostname in the login command
#      -> STEPZEN_INSTANCE_ID = the -i value (123456)
#      Note: STEPZEN_ENVIRONMENT is only used to build the MCP/GraphQL
#      endpoint URL: https://<environment>.<domain>/

STEPZEN_INSTANCE_API_KEY=your-stepzen-api-key-here
STEPZEN_ENVIRONMENT=your-environment-name-here
STEPZEN_DOMAIN=your-domain-name-here
STEPZEN_INSTANCE_ID=your-instance-id-here

# -----------------------------------------------------------------------------
# watsonx Orchestrate — required for watsonx/deploy.py
# Appended automatically below by the graphql-wxo-agent-creator skill's own
# scaffold_project.py (run: python .bob/skills/graphql-wxo-agent-creator/
# scripts/scaffold_project.py) — that skill documents WXO_AUTH_TYPE and the
# IBM Cloud vs AWS/Azure trial setup, so it is not duplicated here.
# -----------------------------------------------------------------------------
"""


def _copy_file_to_root(src_name: str, project_root: Path, dry_run: bool, force: bool) -> None:
    """Copy a file from the skill scripts/ dir to the project root.

    Never overwrites an existing destination file unless --force is given.
    This protects credentials (e.g. a populated .env) from being clobbered.
    """
    src = Path(__file__).parent / src_name
    dst = project_root / src_name

    if not src.exists():
        print(f"  [WARN] {src_name} not found in skill scripts dir: {src}", file=sys.stderr)
        return

    already_exists = dst.exists()

    if already_exists and not force:
        print(f"  [SKIP] Already exists (use --force to overwrite): {dst}")
        return

    if dry_run:
        action = "overwrite" if already_exists else "create"
        print(f"  [DRY-RUN] Would {action} file: {dst}")
        return

    try:
        shutil.copy2(str(src), str(dst))
        action = "Overwrote" if already_exists else "Created"
        print(f"  [OK]   {action} file:      {dst}")
    except OSError as exc:
        print(f"  [ERROR] Cannot copy {src_name} to {dst}: {exc}", file=sys.stderr)


def _load_env_via_set_env(project_root: Path) -> dict[str, str] | None:
    """Run set-env.py with python-dotenv to load .env, then read the required
    variables from the child process environment.

    Returns a dict {VAR: value} for every variable that was successfully loaded,
    or None if set-env.py / dotenv loading could not run at all.

    We do this instead of reading .env directly because .env may be in
    .gitignore (Bob cannot open it), and using python-dotenv in a subprocess
    is the same code path that deploy.py uses at runtime.
    """
    set_env_script = project_root / "set-env.py"
    if not set_env_script.exists():
        # Fall back to the copy inside the skill scripts dir
        set_env_script = Path(__file__).parent / "set-env.py"
    if not set_env_script.exists():
        return None

    # Build a tiny Python snippet that loads .env via python-dotenv and
    # prints KEY=VALUE lines for each required variable.
    var_list = ", ".join(f'"{v}"' for v in _REQUIRED_ENV_VARS)
    snippet = (
        "import os; "
        "from dotenv import load_dotenv; "
        f"from pathlib import Path; "
        f"load_dotenv(Path(r'{project_root}') / '.env'); "
        f"[print(v + '=' + os.getenv(v, '')) for v in [{var_list}]]"
    )

    try:
        result = subprocess.run(
            [sys.executable, "-c", snippet],
            capture_output=True, text=True, timeout=10,
            encoding="utf-8", errors="replace"
        )
    except Exception:
        return None

    if result.returncode != 0:
        return None

    loaded: dict[str, str] = {}
    for line in result.stdout.splitlines():
        if "=" in line:
            k, _, v = line.partition("=")
            loaded[k.strip()] = v.strip()
    return loaded


def _provision_dot_env(project_root: Path, dry_run: bool) -> None:
    """Create or validate .env at the project root.

    - If .env does NOT exist: create it with dummy placeholder values and
      print a clear reminder to fill them in before deploying.
    - If .env DOES exist: load it via set-env.py / python-dotenv (same path
      deploy.py uses) and warn about variables that are missing or still
      set to a placeholder value. The file itself is never read directly.

    .env is NEVER overwritten — even with --force — to protect real credentials.
    """
    env_path = project_root / ".env"

    if not env_path.exists():
        # ── Create with dummy values ──────────────────────────────────────
        if dry_run:
            print(f"  [DRY-RUN] Would create file: {env_path}")
            return
        try:
            env_path.write_text(_DUMMY_ENV_CONTENT, encoding="utf-8")
            print(f"  [OK]   Created file:      {env_path}")
            print()
            print("  ⚠  .env was created with PLACEHOLDER values.")
            print("     Edit it and replace all placeholder values before running deploy.py")
            print(f"     File: {env_path}")
        except OSError as exc:
            print(f"  [ERROR] Cannot create .env: {exc}", file=sys.stderr)
        return

    # ── .env exists — validate via set-env.py / dotenv ───────────────────
    print(f"  [SKIP] Already exists — validating variables via dotenv: {env_path}")

    loaded = _load_env_via_set_env(project_root)

    if loaded is None:
        print("  [WARN] Could not load .env via dotenv — skipping variable check.",
              file=sys.stderr)
        print("         Ensure python-dotenv is installed: pip install python-dotenv",
              file=sys.stderr)
        return

    _PLACEHOLDER_MARKERS = ("your-", "placeholder", "change-me", "todo", "xxx", "example")

    warnings: list[str] = []
    for var in _REQUIRED_ENV_VARS:
        val = loaded.get(var, "")
        if not val:
            warnings.append(f"    ⚠  {var}  — missing (not set)")
        elif any(m in val.lower() for m in _PLACEHOLDER_MARKERS):
            warnings.append(f"    ⚠  {var}  — still a placeholder value")

    if warnings:
        print()
        print("  ⚠  The following required variables need attention in .env:")
        for w in warnings:
            print(w)
        print(f"     File: {env_path}")
    else:
        print(f"  [OK]   All {len(_REQUIRED_ENV_VARS)} required variables are set.")


def _copy_env_template(project_root: Path, dry_run: bool, force: bool) -> None:
    """Copy .env.hc.tmpl to the project root (skip if .env already exists)."""
    env_path = project_root / ".env"
    if env_path.exists() and not force:
        print(f"  [SKIP] .env already exists — skipping .env.hc.tmpl copy: {env_path}")
        return
    _copy_file_to_root(".env.hc.tmpl", project_root, dry_run, force)


def _check_config_files(project_root: Path) -> list[str]:
    """Check stepzen.config.json and config.yaml for un-customised values.

    Returns a list of warning strings (empty list = all good).
    Does NOT abort — callers decide how to surface the warnings.
    """
    graphql_dir = project_root / "api-connect" / "graphql"
    warnings: list[str] = []

    # ── stepzen.config.json ───────────────────────────────────────────────
    stepzen_cfg = graphql_dir / "stepzen.config.json"
    if stepzen_cfg.exists():
        try:
            import json as _json
            data = _json.loads(stepzen_cfg.read_text(encoding="utf-8"))
            endpoint_val = data.get("endpoint", "")
            if _DEFAULT_ENDPOINT in endpoint_val:
                warnings.append(
                    f"  ⚠  stepzen.config.json — endpoint is still the default "
                    f'("{endpoint_val}"). '
                    f"Update it to your actual StepZen endpoint name."
                )
        except Exception:
            pass  # unreadable file: skip silently, deploy will catch it
    else:
        warnings.append(
            "  ⚠  stepzen.config.json — file not found. "
            "Run scaffold first or create it manually."
        )

    # ── config.yaml ──────────────────────────────────────────────────────
    config_yaml = graphql_dir / "config.yaml"
    if config_yaml.exists():
        try:
            content = config_yaml.read_text(encoding="utf-8")
            # A customised file will have at least one non-comment key: value
            # line inside the configurationset block that is not a template comment.
            import re as _re
            # Look for any real credential line: non-comment, non-empty, contains ':'
            cred_lines = [
                ln for ln in content.splitlines()
                if ln.strip()
                and not ln.strip().startswith("#")
                and ":" in ln
                and "name:" not in ln
                and "configuration:" not in ln
                and "configurationset:" not in ln
                and "access:" not in ln
                and "policies:" not in ln
                and "type:" not in ln
                and "policyDefault:" not in ln
                and "condition:" not in ln
                and "deployment:" not in ln
                and "identity:" not in ln
                and "jwksendpoint:" not in ln
                and "issuer:" not in ln
                and "audience:" not in ln
            ]
            has_placeholder = any(
                m in content for m in _CONFIG_YAML_PLACEHOLDER_MARKERS
            )
            if not cred_lines or has_placeholder:
                warnings.append(
                    "  ⚠  config.yaml — no upstream API credentials found. "
                    "Add your upstream_*_api_key (or equivalent) under "
                    "upstream_configuration before deploying."
                )
        except Exception:
            pass
    else:
        warnings.append(
            "  ⚠  config.yaml — file not found. "
            "Run scaffold first or create it manually."
        )

    return warnings


def _print_readiness_summary(project_root: Path) -> None:
    """Print a structured readiness table after scaffolding completes."""
    graphql_dir = project_root / "api-connect" / "graphql"

    def status(path: Path, extra_check: str | None = None) -> str:
        if not path.exists():
            return "❌ missing"
        if extra_check and extra_check in path.read_text(encoding="utf-8", errors="replace"):
            return "⚠  needs editing"
        return "✅ ready"

    print()
    print("=" * 62)
    print("  PROJECT READINESS")
    print("=" * 62)
    print()
    print("  File / Resource                         Status")
    print("  " + "-" * 58)

    rows = [
        (".env",
         status(project_root / ".env", "your-environment-name-here")),
        ("set-env.py",
         status(project_root / "set-env.py")),
        ("api-connect/graphql/stepzen.config.json",
         status(graphql_dir / "stepzen.config.json", _DEFAULT_ENDPOINT)),
        ("api-connect/graphql/config.yaml",
         status(graphql_dir / "config.yaml", "YOUR_API_KEY_HERE")),
        ("api-connect/graphql/input/  (OpenAPI spec)",
         "✅ ready" if any((graphql_dir / "input").glob("*.json"))
                    or any((graphql_dir / "input").glob("*.yaml"))
                    or any((graphql_dir / "input").glob("*.yml"))
         else "⚠  no spec yet"),
        ("api-connect/graphql/schema/*.graphql",
         "✅ ready" if any((graphql_dir / "schema").glob("*.graphql"))
         else "⚠  not generated yet"),
    ]

    for label, st in rows:
        print(f"  {label:<42} {st}")

    config_warnings = _check_config_files(project_root)
    if config_warnings:
        print()
        print("  ⚠  Deployment will likely fail until the following are resolved:")
        for w in config_warnings:
            print(w)

    print()
    print("=" * 62)


def scaffold(project_root: Path, endpoint: str, dry_run: bool, force: bool) -> None:
    """Create the full api-connect/ folder tree and config files."""

    graphql_dir = project_root / "api-connect" / "graphql"
    api_connect_dir = project_root / "api-connect"

    print(f"\nScaffolding project under: {project_root.resolve()}")
    print(f"StepZen endpoint:          api/{endpoint}")
    if dry_run:
        print("Mode: DRY-RUN (no files will be written)\n")
    print()

    # ── Directories ──────────────────────────────────────────────────────
    print("Directories:")
    for subdir in [
        api_connect_dir,
        graphql_dir,
        graphql_dir / "input",
        graphql_dir / "schema",
        graphql_dir / "tools",
        graphql_dir / "mappings",
    ]:
        _make_dir(subdir, dry_run)

    print()

    # ── Config files ─────────────────────────────────────────────────────
    print("Config files:")
    _write_file(
        graphql_dir / "stepzen.config.json",
        _STEPZEN_CONFIG_TEMPLATE.format(endpoint=endpoint),
        dry_run,
        force,
    )
    _write_file(
        graphql_dir / "config.yaml",
        _CONFIG_YAML_TEMPLATE,
        dry_run,
        force,
    )

    print()

    # ── Wrapper scripts ───────────────────────────────────────────────────
    print("Wrapper scripts (api-connect/):")
    _write_file(
        api_connect_dir / "deploy.py",
        _DEPLOY_WRAPPER_TEMPLATE,
        dry_run,
        force,
    )
    _write_file(
        api_connect_dir / "undeploy.py",
        _UNDEPLOY_WRAPPER_TEMPLATE,
        dry_run,
        force,
    )

    print()

    # ── Root-level helper files (never overwrite credentials) ────────────
    print("Environment helpers (project root):")
    _copy_file_to_root("set-env.py", project_root, dry_run, force)
    _copy_env_template(project_root, dry_run, force)
    _provision_dot_env(project_root, dry_run)

    print()

    # ── CLI prerequisite check ────────────────────────────────────────────
    if not dry_run:
        print("CLI prerequisites:")
        cli_warnings = check_cli_prerequisites()
        if cli_warnings:
            print()
            print("  ⚠  Install the missing CLIs before running deploy/undeploy:")
            for w in cli_warnings:
                print(f"     • {w}")
        print()

    if dry_run:
        print("[DRY-RUN] No files were written. Remove --dry-run to apply.")
    else:
        print("[OK] Scaffolding complete.")
        print()
        print("Next steps:")
        print("  1. Populate .env:   copy .env.hc.tmpl to .env and fill in your credentials")
        print("  2. Place your OpenAPI/Swagger spec in api-connect/graphql/input/")
        print("  3. Fill in credentials in api-connect/graphql/config.yaml")
        print("  4. Run: python .bob/skills/graphql-api-creator/scripts/scan_input.py")
        _print_readiness_summary(project_root)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Create the api-connect/ folder tree and template config files "
            "for a new graphql-api-creator project. Safe to re-run — "
            "existing files are never overwritten unless --force is passed."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--project-root",
        default=None,
        help="Project root directory (default: current working directory)",
    )
    parser.add_argument(
        "--endpoint",
        default=None,
        help=(
            "StepZen endpoint name written to stepzen.config.json "
            "(default: WXO_TOOLKIT_NAME env var, or 'my-graphql-api')"
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be created without writing anything",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing config files (CAUTION: may overwrite credentials)",
    )
    args = parser.parse_args()

    project_root = (
        Path(args.project_root).resolve()
        if args.project_root
        else Path.cwd()
    )
    endpoint = _resolve_endpoint(args.endpoint)

    scaffold(project_root, endpoint, args.dry_run, args.force)
    return 0


if __name__ == "__main__":
    sys.exit(main())

# Made with IBM Bob
