# graphql-api-creator — Scripts

Python scripts for the `graphql-api-creator` Bob skill. All scripts run on
Windows, macOS, and Linux without shell dependencies.

## Usage

Every script supports `--help`:

```
python <script>.py --help
```

Scripts that write files also support `--dry-run` to preview changes without
writing anything.

## Scripts

| Script | Purpose |
|---|---|
| `scaffold_project.py` | Create the full `api-connect/` folder tree and drop template config files on a clean project |
| `scan_input.py` | Scan `api-connect/graphql/input/` for OpenAPI/Swagger specs and print a numbered list |
| `parse_operations.py` | Parse a spec file and display all GET operations in numbered format for interactive selection |
| `generate_schema.py` | Generate `schema/`, `tools/`, and `index.graphql` files from a confirmed operation list |
| `deploy.py` | Log in to StepZen and deploy the GraphQL API (canonical — `api-connect/deploy.py` delegates here) |
| `undeploy.py` | Log in to StepZen, delete the deployed API, and clean up local generated files (canonical) |

## Shared Library (`lib/`)

| Module | Purpose |
|---|---|
| `lib/openapi_parser.py` | Load and parse Swagger 2.0 / OpenAPI 3.x specs; extract GET operations, parameters, response schemas |
| `lib/graphql_writer.py` | Write `.graphql` files with ASCII-only enforcement (prevents StepZen SDL parse errors) |

## Common Flags

| Flag | Applies to | Effect |
|---|---|---|
| `--project-root PATH` | All scripts | Override the default project root (default: current working directory) |
| `--dry-run` | File-writing scripts | Print what would be created/modified without writing |
| `--force` | `scaffold_project.py` | Overwrite existing config files (use with caution — may overwrite credentials) |

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Runtime error |
| `2` | Precondition not met (e.g., schema not yet generated) |
