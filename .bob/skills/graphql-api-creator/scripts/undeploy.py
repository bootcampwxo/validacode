#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Connect GraphQL Undeploy Script
Removes the deployed GraphQL API from StepZen. Does NOT delete local files
or folders — only the remote deployment is torn down.
"""

import os
import sys
import subprocess
import json
import shutil
import time
import base64
import threading
from pathlib import Path
from dotenv import load_dotenv

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Only StepZen credentials are needed by this script.
# WXO_* vars are validated by graphql-wxo-agent-creator/scripts/undeploy.py.
REQUIRED_VARS = [
    "STEPZEN_INSTANCE_API_KEY",
    "STEPZEN_ENVIRONMENT",
    "STEPZEN_DOMAIN",
    "STEPZEN_INSTANCE_ID",
]

# Determine paths relative to the project root.
# This script lives at .bob/skills/graphql-api-creator/scripts/undeploy.py
# so the project root is four levels up.
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parents[3]  # <project>/.bob/skills/graphql-api-creator/scripts -> <project>
GRAPHQL_DIR = PROJECT_ROOT / "api-connect" / "graphql"

def _resolve_stepzen_cmd(args: list[str]) -> list[str]:
    """Resolve 'stepzen' to its full path on Windows.

    On Windows, npm global packages install as <name>.cmd wrapper scripts.
    Passing a bare 'stepzen' with shell=False fails because .cmd files are
    not directly executable — they require cmd.exe.  We resolve the .cmd
    wrapper explicitly so we can keep shell=False and avoid the cmd.exe
    pipe-deadlock that causes login to hang indefinitely on first run.
    """
    if sys.platform != 'win32':
        return args
    # shutil.which finds stepzen.cmd on Windows PATH
    resolved = shutil.which(args[0])
    if resolved:
        return [resolved] + args[1:]
    return args


def _run_capture(cmd: list[str], timeout: int = 15):
    """Run a command and return its output without printing or exiting."""
    resolved = _resolve_stepzen_cmd(cmd)
    try:
        proc = subprocess.Popen(
            resolved, shell=False,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding='utf-8', errors='replace',
        )
        stdout, stderr = proc.communicate(timeout=timeout)
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return None

    class _R:
        def __init__(self, rc, out, err):
            self.returncode = rc
            self.stdout = out
            self.stderr = err
    return _R(proc.returncode, stdout, stderr)


def check_stepzen_cli() -> None:
    """Abort with a clear message if the stepzen CLI is not on PATH.

    The stepzen CLI is an npm global package:
      npm install -g stepzen
    On Windows it installs as stepzen.cmd; shutil.which finds both forms.
    """
    if shutil.which("stepzen") is None:
        print("\n[X] 'stepzen' CLI not found on PATH.", file=sys.stderr)
        print("", file=sys.stderr)
        print("  The stepzen CLI is required to deploy to IBM API Connect for GraphQL.", file=sys.stderr)
        print("  Install it once globally via npm:", file=sys.stderr)
        print("", file=sys.stderr)
        print("    npm install -g stepzen", file=sys.stderr)
        print("", file=sys.stderr)
        print("  Verify the install:", file=sys.stderr)
        print("    stepzen --version", file=sys.stderr)
        print("", file=sys.stderr)
        print("  Prerequisites:", file=sys.stderr)
        print("    • Node.js 18+ (https://nodejs.org/)", file=sys.stderr)
        print("    • npm (bundled with Node.js)", file=sys.stderr)
        print("    • An IBM API Connect for GraphQL account", file=sys.stderr)
        print("      https://www.ibm.com/account/reg/signup?formid=urx-52542", file=sys.stderr)
        print("", file=sys.stderr)
        sys.exit(1)
    result = _run_capture(["stepzen", "--version"])
    version = (result.stdout or result.stderr or "").strip().splitlines()[0] if result else "unknown"
    print(f"[i] stepzen CLI: {version}")


def run_command(cmd, check=True, quiet=False, timeout=120, cwd=None):
    """Run a CLI command, streaming its stdout/stderr live as it runs.

    stepzen's own long-running commands (login, delete) print progress
    incrementally (e.g. "Deleting <endpoint> from StepZen... done"), but
    subprocess.communicate() only returns output once the process exits —
    buffering it that way made undeploy.py look hung for the whole duration
    of a slow delete, with no visible output at all. Draining stdout and
    stderr concurrently on separate threads streams that output to the
    console as it arrives, while still avoiding the classic deadlock where
    reading one pipe blocks while the other fills up — and a hard timeout
    still applies via proc.wait(timeout=...).
    """
    if not quiet:
        print(f"$ {' '.join(str(a) for a in cmd)}", flush=True)

    resolved = _resolve_stepzen_cmd(cmd)
    try:
        proc = subprocess.Popen(
            resolved, shell=False,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding='utf-8', errors='replace',
            cwd=cwd,
        )
    except FileNotFoundError:
        print(f"[X] Command not found: {cmd[0]}", flush=True)
        if check:
            sys.exit(1)
        return None

    out_lines: list[str] = []
    err_lines: list[str] = []

    def _pump(stream, sink, collected):
        for line in iter(stream.readline, ""):
            collected.append(line)
            print(line.rstrip(), file=sink, flush=True)
        stream.close()

    t_out = threading.Thread(target=_pump, args=(proc.stdout, sys.stdout, out_lines))
    t_err = threading.Thread(target=_pump, args=(proc.stderr, sys.stderr, err_lines))
    t_out.start()
    t_err.start()

    try:
        proc.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()
        t_out.join(timeout=2)
        t_err.join(timeout=2)
        print(f"[!] Timeout after {timeout}s", flush=True)
        if check:
            sys.exit(1)
        return None

    t_out.join()
    t_err.join()

    class _Result:
        def __init__(self, returncode, stdout, stderr):
            self.returncode = returncode
            self.stdout = stdout
            self.stderr = stderr

    result = _Result(proc.returncode, "".join(out_lines), "".join(err_lines))
    if check and result.returncode != 0:
        print(f"[X] Failed (exit {result.returncode})", file=sys.stderr, flush=True)
    return result

def load_env():
    """Load environment variables from .env file."""
    possible_paths = [
        PROJECT_ROOT / ".env",
        PROJECT_ROOT / "api-connect" / ".env",
    ]
    env_path = next((p for p in possible_paths if p.is_file()), None)

    if not env_path:
        print("[X] .env file not found", file=sys.stderr)
        print(f"    Looked in: {possible_paths[0]}", file=sys.stderr)
        print(f"               {possible_paths[1]}", file=sys.stderr)
        sys.exit(1)

    print(f"[i] Loading environment from: {env_path.resolve()}")
    load_dotenv(env_path)

    missing = [v for v in REQUIRED_VARS if not os.getenv(v, "").strip()]
    if missing:
        print("[X] Missing required environment variables:", file=sys.stderr)
        for var in missing:
            print(f"    - {var}", file=sys.stderr)
        sys.exit(1)

    print("✅ Environment variables loaded:")
    for var in REQUIRED_VARS:
        value = os.getenv(var, "")
        display = value[:8] + "****" if "KEY" in var or "API" in var else value
        print(f"   {var}: {display}")

def print_cloud_tenant_key_hint():
    """Print guidance for resolving authentication failures."""
    print("\n" + "=" * 60, file=sys.stderr)
    print("  Authentication Failed — API Key Hint", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    print(file=sys.stderr)
    print("  STEPZEN_INSTANCE_API_KEY must be the instance API key from the SaaS", file=sys.stderr)
    print("  console — not a key copied from the API Connect for GraphQL dashboard.", file=sys.stderr)
    print(file=sys.stderr)
    print("  Steps to get the correct key:", file=sys.stderr)
    print("    1. Go to https://aws.console.saas.ibm.com/", file=sys.stderr)
    print("    2. Select your SaaS account (e.g. 'API Connect for GraphQL').", file=sys.stderr)
    print("    3. In the instances table, click your instance.", file=sys.stderr)
    print("    4. On the instance page, create or copy an API key.", file=sys.stderr)
    print("       -> Set this as STEPZEN_INSTANCE_API_KEY in .env", file=sys.stderr)
    print("    5. On the login page, find the environment and domain names:", file=sys.stderr)
    print("       -> STEPZEN_ENVIRONMENT = environment name from the login page", file=sys.stderr)
    print("       -> STEPZEN_DOMAIN      = domain name from the login page", file=sys.stderr)
    print("    6. Re-run this script.", file=sys.stderr)
    print(file=sys.stderr)
    print("  Tip: the instance page also shows the stepzen CLI login command:", file=sys.stderr)
    print("    stepzen login <domain> -i 123456 -k <key>", file=sys.stderr)
    print("    -> STEPZEN_DOMAIN      = the hostname in the login command", file=sys.stderr)
    print("    -> STEPZEN_INSTANCE_ID = the -i value (123456)", file=sys.stderr)
    print("    Note: STEPZEN_ENVIRONMENT is the subdomain prefix used only in", file=sys.stderr)
    print("    the MCP/GraphQL endpoint URL: https://<environment>.<domain>/", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    print(file=sys.stderr)


def _stepzen_whoami(flag: str | None = None, timeout: int = 15) -> str | None:
    """Run 'stepzen whoami --non-interactive [flag]' and return stdout, or
    None if there is no cached session / the command fails.

    Uses the CLI's own documented 'whoami' command rather than reading
    ~/.stepzen/stepzen-config.yaml directly, since that file's format is an
    internal implementation detail.
    """
    cmd = ["stepzen", "whoami", "--non-interactive"]
    if flag:
        cmd.append(flag)
    result = _run_capture(cmd, timeout=timeout)
    if not result or result.returncode != 0 or not (result.stdout or "").strip():
        return None
    return result.stdout.strip()


def _jwt_exp(token: str) -> int | None:
    """Decode a JWT's 'exp' claim locally — no signature check, no network."""
    try:
        payload_b64 = token.split(".")[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        return payload.get("exp")
    except Exception:
        return None


def _stepzen_session_matches(domain: str, instance_id: str, environment: str) -> bool:
    """True if the CLI's cached StepZen session (per 'stepzen whoami') is for
    the same domain/account(environment)/instance as .env and its access
    token has not expired yet.

    This is the "is the right environment active" check for StepZen: unlike
    orchestrate there is only one cached session slot, so a mismatch on any
    of domain/environment/instance means it belongs to a different tenant
    and must not be reused.
    """
    info = _stepzen_whoami()
    if not info:
        return False

    fields: dict[str, str] = {}
    for line in info.splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            fields[key.strip().lower()] = value.strip()

    if fields.get("domain") != domain:
        return False
    if fields.get("account") != environment:
        return False
    if fields.get("instance id") != instance_id:
        return False

    token = _stepzen_whoami("--accesstoken")
    exp = _jwt_exp(token) if token else None
    if exp is None:
        return False
    return exp - time.time() > 60  # 60s safety buffer


def login_stepzen():
    """Login to StepZen, unless a cached session for the same
    domain/environment/instance is already active and not yet expired.

    The stepzen CLI login hostname is the DOMAIN only (e.g. eu-central-a.ibm.stepzen.net).
    STEPZEN_ENVIRONMENT is NOT part of the login hostname — it is only used to
    construct the MCP/GraphQL endpoint URL: https://<environment>.<domain>/<endpoint>
    """
    domain = os.getenv("STEPZEN_DOMAIN")
    instance_id = os.getenv("STEPZEN_INSTANCE_ID")
    admin_key = os.getenv("STEPZEN_INSTANCE_API_KEY")
    environment = os.getenv("STEPZEN_ENVIRONMENT")
    introspection_id = os.getenv("STEPZEN_INTROSPECTION_ID")  # optional

    if _stepzen_session_matches(domain, instance_id, environment):
        print(f"✓ Reusing active StepZen session (domain={domain}, "
              f"environment={environment}, instance={instance_id}, token still valid)")
        return True

    cmd = ["stepzen", "login", domain, "-i", instance_id, "-k", admin_key]
    if introspection_id:
        cmd += ["--introspection", introspection_id]

    print("[*] Connecting to StepZen (this may take a few seconds)...", flush=True)
    result = run_command(cmd, check=False, timeout=60)

    if result is None:
        print("❌ StepZen login timed out after 60s", flush=True)
        print("   This may be caused by a stale cached session.", flush=True)
        print("   Try clearing it with:  stepzen logout", flush=True)
        print("   Or delete ~/.stepzen/config.yaml manually.", flush=True)
        return False

    if result.returncode != 0:
        output = (result.stdout or "") + (result.stderr or "")
        auth_failed = any(kw in output.lower() for kw in (
            "authentication failed", "unauthorized", "forbidden", "401", "403"
        ))
        print("❌ StepZen login failed", flush=True)
        if auth_failed:
            print_cloud_tenant_key_hint()
        return False

    print("✓ StepZen login successful")
    return True

def get_endpoint_from_config():
    """Read endpoint from stepzen.config.json."""
    config_path = GRAPHQL_DIR / "stepzen.config.json"
    
    if not config_path.exists():
        print(f"⚠ Config file not found: {config_path}")
        return None
    
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
            endpoint = config.get("endpoint")
            if endpoint:
                print(f"[i] Found endpoint in config: {endpoint}")
                return endpoint
            else:
                print("⚠ No endpoint found in config")
                return None
    except Exception as e:
        print(f"⚠ Error reading config: {e}")
        return None

def delete_graphql_api(endpoint):
    """Delete the deployed GraphQL API from StepZen.

    Returns:
        True   – deleted successfully
        None   – endpoint not found (warning only, not an error)
        False  – auth error, timeout, or unexpected failure
    """
    print(f"\n🚫 Deleting GraphQL API: {endpoint}")
    print("[*] This can take a while for a live endpoint — output streams below...",
          flush=True)

    cmd = ["stepzen", "delete", endpoint, "--non-interactive"]
    result = run_command(cmd, check=False, timeout=120, cwd=GRAPHQL_DIR)

    if result is None:
        print("[!] Timeout waiting for stepzen delete", flush=True)
        return False

    output = (result.stdout or "") + (result.stderr or "")

    if result.returncode == 0:
        print(f"✓ GraphQL API '{endpoint}' deleted successfully")
        return True

    # Auth errors are the only hard failures — everything else is "not found"
    auth_error = any(kw in output.lower() for kw in (
        "unauthorized", "authentication failed", "forbidden", "401", "403"
    ))

    if auth_error:
        print(f"❌ Failed to delete GraphQL API '{endpoint}'")
        print_cloud_tenant_key_hint()
        return False

    # Non-zero exit without auth error → endpoint not found / already gone
    print(f"⚠ GraphQL API '{endpoint}' not found — already deleted or never deployed")
    return None  # not an error

def main():
    try:
        print("🗑️  API CONNECT GRAPHQL CLEANUP")
        print("=" * 60)

        # Check CLI prerequisite first — fast fail with a clear install hint
        check_stepzen_cli()

        # Load environment variables
        load_env()
        
        # Check if graphql directory exists
        if not GRAPHQL_DIR.exists():
            print(f"\n[X] GraphQL directory not found: {GRAPHQL_DIR}")
            sys.exit(1)
        
        # Login to StepZen
        print("\n[*] Logging in to StepZen...")
        if not login_stepzen():
            print("\n[X] Failed to login to StepZen — aborting")
            sys.exit(1)

        # Get endpoint from config
        endpoint = get_endpoint_from_config()

        # Delete GraphQL API if endpoint found
        # True = deleted, None = not found (warning), False = auth/other error
        api_result = None
        if endpoint:
            api_result = delete_graphql_api(endpoint)
            if api_result is False:
                print("\n[X] Aborting cleanup due to API deletion error")
                sys.exit(1)
        else:
            print("\n⚠ Skipping API deletion (no endpoint found)")

        # Local files/folders (mappings, schema, tools, index.graphql, etc.)
        # are intentionally left untouched — this script only tears down the
        # remote StepZen deployment, never the local workspace.

        # ── Summary table ────────────────────────────────────────────────────
        print("\n" + "=" * 60)
        print("  CLEANUP SUMMARY")
        print("=" * 60)

        # Server row
        if endpoint:
            if api_result is True:
                server_status = "✅ deleted"
            elif api_result is None:
                server_status = "⚠️  not found"
            else:
                server_status = "❌ failed"
        else:
            server_status = "⚠️  no endpoint configured"
        print(f"  {'Server API':<20}  {server_status}")
        print(f"  {'Local files':<20}  ℹ️  untouched (not deleted)")

        print()
        print("=" * 60)
        print("  Overall: ✅ SUCCESS")
        print("=" * 60)

        sys.exit(0)
        
    except KeyboardInterrupt:
        print("\n[!] Cleanup cancelled by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n[X] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

# Made with Bob
