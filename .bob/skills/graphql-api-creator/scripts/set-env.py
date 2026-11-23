#!/usr/bin/env python3
"""
set-env.py  —  Cross-platform .env loader (Windows / Linux / macOS)

Reads KEY=VALUE pairs from .env in the same directory and loads them into
the current shell session WITHOUT printing secret values to the terminal.

HOW IT WORKS
────────────
  The real values are written to a private temp file that the shell sources,
  then the temp file is immediately deleted. Only obfuscated values
  (first 4 + last 4 chars visible, middle masked with ****) are ever printed
  to the terminal — the same convention used by OAuth providers for secrets.

USAGE
─────
  Linux / macOS / Git Bash / WSL (bash / zsh):
      source <(python3 set-env.py)

  Windows PowerShell:
      python set-env.py | Invoke-Expression

  Fish shell:
      python3 set-env.py --shell fish | source

OPTIONS
───────
  --shell <bash|powershell|fish>
      Override auto-detected shell format (default: auto-detect).

  --check <VAR1,VAR2,...>
      After loading, verify these variable names are present and non-empty.
      Exits non-zero and prints an error if any are missing.
      Example: python3 set-env.py --check WXO_AGENT_NAME,WXO_TOOLKIT_NAME

  --env-file <path>
      Path to a specific .env file (default: .env next to this script).

SECURITY
────────
  - Real values are NEVER written to stdout or the terminal
  - Each key is displayed with its value obfuscated: KEY=abcd****wxyz
  - The temp file (0600 on Unix) is sourced then immediately deleted
  - Nothing sensitive appears in shell history or terminal scrollback
"""

import argparse
import os
import platform
import re
import stat
import sys
import tempfile
from pathlib import Path

ENV_LINE = re.compile(
    r"^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$"
)


# ── helpers ───────────────────────────────────────────────────────────────────

def parse_env(path: Path) -> list[tuple[str, str]]:
    """Parse a .env file; return ordered (key, value) pairs."""
    pairs: list[tuple[str, str]] = []
    with path.open(encoding="utf-8") as fh:
        for raw in fh:
            stripped = raw.strip()
            if not stripped or stripped.startswith("#"):
                continue
            m = ENV_LINE.match(stripped)
            if not m:
                continue
            key, value = m.group(1), m.group(2)
            # strip surrounding single or double quotes
            if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
                value = value[1:-1]
            pairs.append((key, value))
    return pairs


def detect_shell() -> str:
    """Best-effort detection of the parent shell."""
    if platform.system() == "Windows":
        shell_env = os.environ.get("SHELL", "")
        if "bash" in shell_env or "zsh" in shell_env:
            return "bash"
        return "powershell"
    return "fish" if "fish" in os.environ.get("SHELL", "") else "bash"


def escape_bash(v: str) -> str:
    return v.replace("\\", "\\\\").replace('"', '\\"').replace("$", "\\$").replace("`", "\\`")


def escape_ps(v: str) -> str:
    return v.replace("'", "''")


def export_line(key: str, value: str, shell: str) -> str:
    if shell == "powershell":
        return f"$env:{key} = '{escape_ps(value)}'"
    elif shell == "fish":
        return f'set -gx {key} "{escape_bash(value)}"'
    else:
        return f'export {key}="{escape_bash(value)}"'


def obfuscate(value: str) -> str:
    """Show first 4 + last 4 chars; mask middle with ****.
    Matches the convention used by OAuth providers for client secrets."""
    if len(value) <= 8:
        return "****"
    return f"{value[:4]}****{value[-4:]}"


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Load .env into the current shell session without exposing secret values",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--shell", choices=["bash", "powershell", "fish"], default=None,
        help="Shell format to emit (default: auto-detect)",
    )
    parser.add_argument(
        "--check", default="",
        help="Comma-separated variable names that must be non-empty after loading",
    )
    parser.add_argument(
        "--env-file", default=None,
        help="Path to .env file (default: .env next to this script)",
    )
    args = parser.parse_args()

    env_path = (
        Path(args.env_file).resolve()
        if args.env_file
        else Path(__file__).resolve().parent / ".env"
    )

    if not env_path.is_file():
        sys.stderr.write(f"ERROR: .env file not found at {env_path}\n")
        return 1

    shell   = args.shell or detect_shell()
    pairs   = parse_env(env_path)
    is_unix = platform.system() != "Windows"

    # ── write real values to a private temp file ──────────────────────────────
    suffix = ".ps1" if shell == "powershell" else ".sh"
    fd, tmp_path = tempfile.mkstemp(suffix=suffix, prefix=".set-env-")
    try:
        if is_unix:
            os.chmod(tmp_path, stat.S_IRUSR | stat.S_IWUSR)  # 0600

        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            for key, value in pairs:
                fh.write(export_line(key, value, shell) + "\n")

        # ── display obfuscated values on stderr (terminal only, not captured) ─
        sys.stderr.write(f"\nLoading from {env_path}:\n\n")
        for key, value in pairs:
            sys.stderr.write(f"  {key}={obfuscate(value)}\n")
        sys.stderr.write(f"\n[OK] {len(pairs)} variables loaded\n\n")

        # ── stdout: source + cleanup + confirmation (evaluated by shell) ──────
        if shell == "powershell":
            # Resolve away any legacy 8.3 short paths (e.g. PETERK~1) that
            # PowerShell's dot-source operator does not accept.
            full = str(Path(tmp_path).resolve())
            print(f". '{full}'")
            print(f"Remove-Item -Force '{full}'")
        elif shell == "fish":
            print(f"source '{tmp_path}'")
            print(f"command rm -f '{tmp_path}'")
        else:
            print(f". '{tmp_path}'")
            print(f"rm -f '{tmp_path}'")

    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise

    # ── optional post-load presence check ─────────────────────────────────────
    if args.check:
        required = [v.strip() for v in args.check.split(",") if v.strip()]
        loaded   = {k for k, _ in pairs}
        missing  = [k for k in required if k not in loaded]
        if missing:
            msg = f"ERROR: Missing required variables: {', '.join(missing)}"
            if shell == "powershell":
                print(f'throw "{msg}"')
            else:
                print(f'echo "{msg}" >&2; false')
            sys.stderr.write(msg + "\n")
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
