# GraphQL Security Skill

A Bob skill that is the **single source of truth** for authentication configuration in the GraphQL skill family — covering OpenAPI security detection, interactive method selection, `config.yaml` validation, and full troubleshooting for base queries and materializers.

## What It Does

When converting OpenAPI/Swagger specs to GraphQL with StepZen, every `@rest` directive needs authentication wired up correctly. This skill detects what security schemas the spec declares, presents the available authentication methods, validates that `config.yaml` holds the right variables, and applies the chosen method consistently across all generated directives. It is also the authoritative reference for diagnosing 401/500 errors in both base queries and orchestrated materializer queries.

## When to Use It

Activate this skill by asking questions such as:

- *"Configure authentication for my GraphQL API."*
- *"My materializers are returning 401 — help me fix it."*
- *"Set up API key authentication for the StepZen schema."*
- *"Detect the security schema from my OpenAPI spec."*

The other three GraphQL skills (`graphql-api-creator`, `graphql-query-orchestrator`, `graphql-field-optimization`) all **delegate** to this skill for authentication — it is never run in isolation but is always activated alongside them when auth configuration or troubleshooting is needed.

## What You Get

| Step | What happens |
|------|-------------|
| 1 · Detect security schemas | Parses the OpenAPI `securitySchemes` block; identifies API key, Bearer, OAuth 2.0, or no-auth patterns |
| 2 · Interactive selection | Presents available methods (A–E); asks you to choose one |
| 3 · Validate `config.yaml` | Checks that all referenced variable names exist; warns about missing variables |
| 4 · Apply consistently | Ensures every `@rest` directive uses the same auth method and variable names |
| 5 · Troubleshoot | Diagnoses 401/500 errors, missing variables, wrong header formats, and test-vs-production gaps |

## Authentication Methods

| Method | StepZen syntax | Best for |
|--------|---------------|---------|
| **API Key (static)** | `headers: [{ name: "X-API-Key", value: "$upstream_api_key" }]` | Static keys stored in `config.yaml` |
| **Forward headers** | `forwardheaders: ["Authorization"]` | Dynamic Bearer/session tokens from client |
| **Multiple headers** | `forwardheaders: ["Authorization", "X-Custom-Header"]` | APIs requiring more than one header |
| **Combined** | `headers: [...]` + `forwardheaders: [...]` | Static key + dynamic token simultaneously |
| **No auth** | *(neither parameter)* | Public APIs |

## Critical Rules

| Rule | Why it matters |
|------|---------------|
| Every `@rest` **must** include `configuration: "upstream_configuration"` | Required for materializers to inherit auth context |
| Choose **one** auth method and apply it consistently | Mixed methods cause some queries to succeed and others to fail with 401 |
| **Never add `configuration` to `@materializer`** | Not supported — causes deployment error |
| Variable names are **case-sensitive** | `upstream_api_key` ≠ `Upstream_Api_Key` |

## What This Skill Does NOT Do

This skill provides **guidance only** — it never directly modifies files. It instructs the other skills (or you) on which changes to make to:
- `schema/*.graphql`
- `tools/*.graphql`
- `index.graphql`

It never modifies `config.yaml` or files in `input/`.

## Related Skills

- [**`graphql-api-creator`**](../graphql-api-creator/README.md) — calls this skill during initial schema generation
- [**`graphql-query-orchestrator`**](../graphql-query-orchestrator/README.md) — calls this skill when materializer authentication fails
- [**`graphql-field-optimization`**](../graphql-field-optimization/README.md) — consults this skill if auth issues arise after applying field mappings

## Part of the GraphQL Skill Family

This skill is included in the **[IBM GraphQL API Builder for AI Agents](../../Collections/IBM-GraphQL-API-Builder-For-Agents/README.md)** collection. For a step-by-step walkthrough with prompts and a demo script, see the **[recipe](../../Recipes/GraphQL-API-Builder-For-Agents/08-GraphQL-API-Builder-For-Agents.md)**.

## Further Documentation

> **Note:** These links were identified from search results. Automated access to `ibm.com/docs` is blocked (HTTP 403) — verify manually in a browser before use.

- [Developing GraphQL APIs and schemas](https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=developing-graphql-apis-schemas)
- [Using GraphQL directives](https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=schemas-using-graphql-directives)
- [Tutorial: Transform a REST API to GraphQL](https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=apis-tutorial-transform-rest-api-graphql)
- [Configuring API Connect for GraphQL (`config.yaml`)](https://www.ibm.com/docs/en/api-connect-graphql/1.1.x?topic=essentials-configuring-api-connect)
