# graphql-query-orchestrator — Scripts

Python scripts for the `graphql-query-orchestrator` Bob skill.

## Precondition

**`graphql-api-creator` must have run first AND the schema must contain at
least 2 Query fields sharing a parent resource ID.** Scripts exit with
code `2` if either precondition is unmet, with a clear error message.

## Scripts

| Script | Purpose |
|---|---|
| `detect_relationships.py` | Scan a schema file and identify parent-child query pairs that are candidates for orchestration — reports suggested orchestrated query names and the shared ID parameter |
| `generate_orchestration.py` | Add an orchestrated query + `@materializer` type extensions to an existing schema file; update tools and index visibility to match |

## Common Flags

| Flag | Effect |
|---|---|
| `--project-root PATH` | Override project root (default: cwd) |
| `--input-file PATH` | Path to the schema `.graphql` file to analyse or modify |
| `--dry-run` | Preview changes without writing files |

## Workflow

```bash
# Step 1 — detect which queries can be orchestrated
python detect_relationships.py

# Step 2 — generate the orchestration (use the names from step 1)
python generate_orchestration.py \
  --parent getAccountByID \
  --children getComplianceInfoForID getBankAccountForID getCreditWorthinessForID \
  --orchestrated-name getAccountDetails

# Step 3 — review the changes in schema/, tools/, index.graphql

# Step 4 — deploy
python api-connect/deploy.py
```

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Runtime error |
| `2` | Precondition not met — run `graphql-api-creator` first, or schema has no orchestratable queries |
