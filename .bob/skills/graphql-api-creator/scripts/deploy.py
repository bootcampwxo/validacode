#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Connect GraphQL Deploy Script
Deploys GraphQL API to StepZen/API Connect for GraphQL.
Does NOT create files or folders - only deploys existing schema.
"""

import os
import sys
import subprocess
import json
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
# WXO_* vars are validated by graphql-wxo-agent-creator/scripts/deploy.py.
REQUIRED_VARS = [
    "STEPZEN_INSTANCE_API_KEY",
    "STEPZEN_ENVIRONMENT",
    "STEPZEN_DOMAIN",
    "STEPZEN_INSTANCE_ID",
]

# Determine paths relative to the project root.
# This script lives at .bob/skills/graphql-api-creator/scripts/deploy.py
# so the project root is four levels up.
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parents[3]  # <project>/.bob/skills/graphql-api-creator/scripts -> <project>
GRAPHQL_DIR = PROJECT_ROOT / "api-connect" / "graphql"

REQUIRED_FILES = [
    "config.yaml",
    "stepzen.config.json",
    "index.graphql"
]

def run_command(cmd, check=True, quiet=False, timeout=120, cwd=None):
    """Run a CLI command, streaming its stdout/stderr live as it runs.

    stepzen's own long-running commands (login, deploy) print progress
    incrementally, but subprocess.communicate() only returns output once the
    process exits — buffering it that way makes deploy.py look hung for the
    whole duration of a slow deploy, with no visible output at all. Draining
    stdout and stderr concurrently on separate threads streams that output to
    the console as it arrives, while still avoiding the classic deadlock
    where reading one pipe blocks while the other fills up — and a hard
    timeout still applies via proc.wait(timeout=...).
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

    # Build a lightweight result object that mimics subprocess.CompletedProcess
    class _Result:
        def __init__(self, returncode, stdout, stderr):
            self.returncode = returncode
            self.stdout = stdout
            self.stderr = stderr

    result = _Result(proc.returncode, "".join(out_lines), "".join(err_lines))
    if check and result.returncode != 0:
        print(f"[X] Failed (exit {result.returncode})", file=sys.stderr, flush=True)
    return result

def print_api_connect_setup_hint():
    """Print setup instructions when API Connect for GraphQL is not configured."""
    print("\n" + "=" * 60, file=sys.stderr)
    print("  API Connect for GraphQL — Not Configured", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    print(file=sys.stderr)
    print("  How to obtain the required credentials:", file=sys.stderr)
    print(file=sys.stderr)
    print("  0. If you don't have a tenant yet, register a free trial at:", file=sys.stderr)
    print("     https://www.ibm.com/account/reg/signup?formid=urx-52542", file=sys.stderr)
    print("  1. Go to https://aws.console.saas.ibm.com/", file=sys.stderr)
    print("  2. Select your SaaS account (e.g. 'API Connect for GraphQL').", file=sys.stderr)
    print("  3. In the instances table, click on your instance.", file=sys.stderr)
    print("  4. On the instance page, create or copy an API key.", file=sys.stderr)
    print("     -> This is your STEPZEN_INSTANCE_API_KEY.", file=sys.stderr)
    print("  5. On the login page of your instance, locate the environment and domain.", file=sys.stderr)
    print("     -> STEPZEN_ENVIRONMENT = the environment name from the login page", file=sys.stderr)
    print("     -> STEPZEN_DOMAIN      = the domain name from the login page", file=sys.stderr)
    print("     The MCP/Query endpoint base URL is:", file=sys.stderr)
    print("       https://<STEPZEN_ENVIRONMENT>.<STEPZEN_DOMAIN>/", file=sys.stderr)
    print("  6. Click the instance URL on that same page.", file=sys.stderr)
    print("     You will see the stepzen CLI login command, e.g.:", file=sys.stderr)
    print("       stepzen login <domain> -i 123456 -k <key>", file=sys.stderr)
    print("     -> STEPZEN_DOMAIN      = the hostname shown (e.g. eu-central-a.ibm.stepzen.net)", file=sys.stderr)
    print("     -> STEPZEN_INSTANCE_ID = the -i value (123456)", file=sys.stderr)
    print(file=sys.stderr)
    print("  Add all values to your .env file before running this script.", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    print(file=sys.stderr)


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
        print_api_connect_setup_hint()
        sys.exit(1)

    print(f"[i] Loading environment from: {env_path.resolve()}")
    load_dotenv(env_path)

    missing = [v for v in REQUIRED_VARS if not os.getenv(v, "").strip()]
    if missing:
        print("[X] Missing required environment variables:", file=sys.stderr)
        for var in missing:
            print(f"    - {var}", file=sys.stderr)
        print_api_connect_setup_hint()
        sys.exit(1)

    print("✅ Environment variables loaded:")
    for var in REQUIRED_VARS:
        value = os.getenv(var, "")
        display = value[:8] + "****" if "KEY" in var or "API" in var else value
        print(f"   {var}: {display}")

def verify_required_files():
    """Verify all required files exist before deployment."""
    print("\n[*] Verifying required files...")
    
    missing_files = []
    for file_path in REQUIRED_FILES:
        full_path = GRAPHQL_DIR / file_path
        if not full_path.exists():
            missing_files.append(file_path)
            print(f"❌ Missing: {file_path}")
        else:
            print(f"✓ Found: {file_path}")
    
    if missing_files:
        print(f"\n[X] Cannot deploy - missing {len(missing_files)} required file(s)", file=sys.stderr)
        print("    Run the schema generation process first", file=sys.stderr)
        sys.exit(1)
    
    print("✅ All required files present")

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
    import shutil
    # shutil.which finds stepzen.cmd on Windows PATH
    resolved = shutil.which(args[0])
    if resolved:
        return [resolved] + args[1:]
    return args


def check_stepzen_cli() -> None:
    """Abort with a clear message if the stepzen CLI is not on PATH.

    The stepzen CLI is an npm global package:
      npm install -g stepzen
    On Windows it installs as stepzen.cmd; shutil.which finds both forms.
    """
    import shutil
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

def get_endpoint_info():
    """Read endpoint information from stepzen.config.json."""
    config_path = GRAPHQL_DIR / "stepzen.config.json"
    
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
            endpoint = config.get("endpoint")
            if endpoint:
                print(f"[i] Endpoint from config: {endpoint}")
                return endpoint
            else:
                print("⚠ No endpoint found in config")
                return None
    except Exception as e:
        print(f"⚠ Error reading config: {e}")
        return None

def deploy_graphql_api():
    """Deploy the GraphQL API to StepZen."""
    print("\n🚀 Deploying GraphQL API...")
    print("[*] This can take a while for a larger schema — output streams below...",
          flush=True)

    result = run_command(
        ["stepzen", "deploy"],
        check=False,
        cwd=GRAPHQL_DIR
    )

    if result and result.returncode == 0:
        print("✅ GraphQL API deployed successfully")
        return True

    print("❌ GraphQL API deployment failed")
    output = ((result.stdout or "") + (result.stderr or "")) if result else ""
    auth_error = any(kw in output.lower() for kw in (
        "unauthorized", "authentication failed", "forbidden", "401", "403"
    ))
    if auth_error:
        print_cloud_tenant_key_hint()
    return False

def display_deployment_info():
    """Display deployment information including MCP endpoint."""
    print("\n" + "=" * 60)
    print("📋 DEPLOYMENT INFORMATION")
    print("=" * 60)

    endpoint = get_endpoint_info()
    environment = os.getenv("STEPZEN_ENVIRONMENT")
    domain = os.getenv("STEPZEN_DOMAIN")

    if endpoint and environment and domain:
        base_url = f"https://{environment}.{domain}"
        graphql_url = f"{base_url}/{endpoint}"
        mcp_url = f"{base_url}/{endpoint}/mcp"

        print(f"\n🔗 GraphQL Endpoint:")
        print(f"   {graphql_url}")
        print(f"\n🔗 MCP Endpoint:")
        print(f"   {mcp_url}")
        print(f"\n💡 Use the MCP endpoint for watsonx Orchestrate integration")
    else:
        print("\n⚠ Could not determine endpoint URLs")

def check_config_files_pre_deploy() -> None:
    """Warn if stepzen.config.json or config.yaml still contain template defaults.

    Prints warnings but does NOT abort — the user may have intentionally kept
    defaults in a dev environment. The warnings make the likely failure visible.
    """
    warnings: list[str] = []

    # ── stepzen.config.json ───────────────────────────────────────────────
    stepzen_cfg = GRAPHQL_DIR / "stepzen.config.json"
    if stepzen_cfg.exists():
        try:
            import json as _json
            data = _json.loads(stepzen_cfg.read_text(encoding="utf-8"))
            endpoint_val = data.get("endpoint", "")
            if "my-graphql-api" in endpoint_val:
                warnings.append(
                    f'  stepzen.config.json  endpoint is still the default ("{endpoint_val}")'
                    "  — update it to your actual StepZen endpoint name."
                )
        except Exception:
            pass

    # ── config.yaml ──────────────────────────────────────────────────────
    config_yaml = GRAPHQL_DIR / "config.yaml"
    if config_yaml.exists():
        try:
            content = config_yaml.read_text(encoding="utf-8")
            # Check for template placeholder comment still present
            if "YOUR_API_KEY_HERE" in content:
                warnings.append(
                    "  config.yaml  still contains the template placeholder comment — "
                    "no upstream credentials have been added yet."
                )
            else:
                # Check whether any real credential key:value line exists under
                # upstream_configuration (i.e. not just structural YAML keys)
                structural = {
                    "name:", "configuration:", "configurationset:", "access:",
                    "policies:", "type:", "policyDefault:", "condition:",
                    "deployment:", "identity:", "jwksendpoint:", "issuer:", "audience:",
                }
                cred_lines = [
                    ln for ln in content.splitlines()
                    if ln.strip()
                    and not ln.strip().startswith("#")
                    and ":" in ln
                    and not any(ln.strip().startswith(s) for s in structural)
                ]
                if not cred_lines:
                    warnings.append(
                        "  config.yaml  no upstream API credentials found — "
                        "add upstream_*_api_key under upstream_configuration."
                    )
        except Exception:
            pass

    if warnings:
        print("\n" + "=" * 60)
        print("  ⚠  PRE-DEPLOY CONFIGURATION WARNINGS")
        print("=" * 60)
        print("  Deployment may fail if these are not resolved:\n")
        for w in warnings:
            print(f"  ⚠ {w}")
        print()
        print("  Files to check:")
        print(f"    {GRAPHQL_DIR / 'stepzen.config.json'}")
        print(f"    {GRAPHQL_DIR / 'config.yaml'}")
        print("=" * 60)
        print()


def main():
    try:
        print("🚀 API CONNECT GRAPHQL DEPLOY")
        print("=" * 60)

        # Check CLI prerequisite first — fast fail with a clear install hint
        check_stepzen_cli()

        # Load environment
        load_env()

        # Verify graphql directory exists
        if not GRAPHQL_DIR.exists():
            print(f"\n[X] GraphQL directory not found: {GRAPHQL_DIR}")
            sys.exit(1)

        # Verify all required files exist
        verify_required_files()

        # Warn if config files still have template defaults
        check_config_files_pre_deploy()

        # Login to StepZen
        print("\n[*] Logging in to StepZen...")
        if not login_stepzen():
            print("\n[X] Failed to login to StepZen")
            sys.exit(1)
        
        # Deploy the GraphQL API
        success = deploy_graphql_api()
        
        if success:
            # Display deployment information
            display_deployment_info()
            
            print("\n" + "=" * 60)
            print("🎉 DEPLOYMENT COMPLETE!")
            print("=" * 60)
            sys.exit(0)
        else:
            print("\n" + "=" * 60)
            print("❌ DEPLOYMENT FAILED")
            print("=" * 60)
            sys.exit(1)
        
    except KeyboardInterrupt:
        print("\n[!] Deployment cancelled by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n[X] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

# Made with Bob
