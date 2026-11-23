# graphql-field-optimization — Scripts

Python scripts for the `graphql-field-optimization` Bob skill.

## Precondition

**`graphql-api-creator` must have run first.** These scripts operate on the
schema files that `graphql-api-creator` produces. If no `.graphql` files exist
in `api-connect/graphql/schema/`, all scripts exit with code `2` and print
a clear error.

## Scripts

| Script | Purpose |
|---|---|
| `generate_mapping.py` | Analyse the existing schema; generate a `mappings/{api-name}.md` file with default 1:1 field mappings and optimisation suggestions (camelCase expansion of snake_case and common abbreviations like `aml`, `kyc`, `IBAN`) |
| `apply_mappings.py` | Read a completed mapping file and apply custom field names + `setters` to `schema/` and `tools/` GraphQL files |

## Common Flags

| Flag | Effect |
|---|---|
| `--project-root PATH` | Override project root (default: cwd) |
| `--input-file PATH` | Path to the OpenAPI spec or schema base name (e.g. `my-api` or `my-api.json`) |
| `--dry-run` | Preview changes without writing files |

## Workflow

```bash
# Step 1 — generate the mapping file from the existing schema
python generate_mapping.py

# Step 2 — review and edit api-connect/graphql/mappings/{api-name}.md
# Set Status to "✅ Custom" for fields you rename
# Set Status to "⏭️ Skip" to keep a field unchanged
# Set Status to "🚫 Excluded" to remove a field

# Step 3 — apply the mappings
python apply_mappings.py

# Step 4 — deploy
python api-connect/deploy.py
```

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Runtime error |
| `2` | Precondition not met — run `graphql-api-creator` first |
