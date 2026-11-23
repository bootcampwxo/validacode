# GraphQL Field Optimization Skill

A Bob skill that renames cryptic backend field names to AI-agent-friendly camelCase without touching the upstream API — purely through StepZen's `setters` mapping mechanism.

## What It Does

Backend APIs often return fields like `aml_flag`, `kyc_status`, or `IBAN` — abbreviations and snake_case identifiers that are opaque to AI agents. This skill proposes optimised GraphQL field names (e.g., `antiMoneyLaunderingFlag`, `knowYourCustomerStatus`, `internationalBankAccountNumber`) and wires up the `setters` mapping in the `@rest` directive so the backend response is transparently remapped.

No backend changes required. No API behaviour changes. The mapping lives entirely in the GraphQL layer.

## When to Use It

Activate this skill by asking questions such as:

- *"Optimise the field names in my GraphQL schema for AI agents."*
- *"Rename the abbreviations in my schema to readable names."*
- *"Make the field names more descriptive for the agent."*
- *"Apply field mapping from the mapping file to the schema."*

Use it **after** `graphql-api-creator` has generated the initial schema.

## What You Get

Two workflows are available:

| Workflow | Steps | Best for |
|----------|-------|---------|
| **A · Mapping File (recommended)** | Generate mapping file → user edits → apply | Larger schemas, team review, version control |
| **B · Interactive (legacy)** | Analyse schema → propose names → confirm per-field | Quick one-off schemas |

**Workflow A in detail:**

| Step | Output |
|------|--------|
| 1 · Generate mapping file | `api-connect/graphql/mappings/{api-name}.md` — one table per type, all fields listed with default 1:1 mappings and optimisation suggestions |
| 2 · User edits file | Customise field names, set status indicators (`✅ Custom`, `⏭️ Skip`, `🚫 Excluded`) |
| 3 · Apply mappings | Schema and tools files updated; `setters` added for every `✅ Custom` entry |
| 4 · Update status | Mapping file marked as applied |

## Files Modified

| File | What changes |
|------|-------------|
| `api-connect/graphql/schema/{input-filename}.graphql` | Field names in type definitions updated; `setters` added to `@rest` directives |
| `api-connect/graphql/tools/{input-filename}.graphql` | Tool `fields` references updated to match new field names |
| `api-connect/graphql/mappings/{api-name}.md` | Created (Workflow A) or updated with applied status |

## Mapping File Status Indicators

| Icon | Meaning |
|------|---------|
| 🔄 Default | 1:1 mapping — backend name = GraphQL name, no setter needed |
| ✅ Custom | Custom name applied — setter configured in schema |
| ⏭️ Skip | Keep backend name as-is — no optimisation, no setter |
| 🚫 Excluded | Field removed from GraphQL schema entirely |

## Related Skills

- [**`graphql-api-creator`**](../graphql-api-creator/README.md) — run this first to generate the initial schema
- [**`graphql-query-orchestrator`**](../graphql-query-orchestrator/README.md) — combine with field optimisation for maximum AI-agent clarity
- [**`graphql-security`**](../graphql-security/README.md) — consult if authentication issues arise after applying mappings

## Part of the GraphQL Skill Family

This skill is included in the **[IBM GraphQL API Builder for AI Agents](../../Collections/IBM-GraphQL-API-Builder-For-Agents/README.md)** collection. For a step-by-step walkthrough with prompts and a demo script, see the **[recipe](../../Recipes/GraphQL-API-Builder-For-Agents/08-GraphQL-API-Builder-For-Agents.md)**.

## Further Documentation

> **Note:** These links were identified from search results. Automated access to `ibm.com/docs` is blocked (HTTP 403) — verify manually in a browser before use.

- [Developing GraphQL APIs and schemas](https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=developing-graphql-apis-schemas)
- [Using GraphQL directives](https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=schemas-using-graphql-directives)
- [Tutorial: Transform a REST API to GraphQL](https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=apis-tutorial-transform-rest-api-graphql)
