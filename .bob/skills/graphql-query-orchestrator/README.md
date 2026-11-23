# GraphQL Query Orchestrator Skill

A Bob skill that merges a parent resource and its child endpoints into a single unified GraphQL query using StepZen `@materializer` directives — reducing multiple agent API calls to one.

## What It Does

When a REST API has a parent resource (e.g., `GET /accounts/{id}`) and two or more related child endpoints (e.g., `GET /accounts/{id}/compliance`, `GET /accounts/{id}/bankdetails`), an AI agent would normally need to fire separate queries and stitch the results together. This skill extends the parent GraphQL type with child resource fields backed by `@materializer`, so the agent can fetch the complete entity in a single query.

> Instead of creating a new composite type, the skill **extends the existing parent type** returned by the base query. The orchestrated query is identical to the parent query at the REST level — the extra data is fetched in parallel by the materializers.

## When to Use It

Activate this skill by asking questions such as:

- *"Merge the account and its compliance/bank detail endpoints into one query."*
- *"Create an orchestrated query for the customer resource."*
- *"Combine the parent and child queries using materializers."*
- *"Reduce the number of queries the agent needs to call."*

**Use it after `graphql-api-creator`** (and optionally `graphql-field-optimization`) have already run.

**Minimum requirement:** the parent resource must have **2 or more child endpoints** sharing the same ID parameter.

## What You Get

| Step | What happens |
|------|-------------|
| 1 · Analyse schema | Reads existing `schema/{input-filename}.graphql`; identifies parent/child relationships by path pattern and shared ID parameters |
| 2 · Group operations | Groups child endpoints under their parent resource |
| 3 · Interactive confirmation | Proposes orchestrated query name (e.g., `getAccountDetails`); asks for confirmation |
| 4 · Tool configuration | Asks which queries to expose as MCP tools (typically only the orchestrated query) |
| 5 · Generate merged schema | Adds orchestrated query + `extend type` block with `@materializer` fields; preserves original operations for backward compatibility |
| 6 · Validate & deploy | Checks for duplicate type names; validates `extend schema` tool format |

## Files Modified

| File | What changes |
|------|-------------|
| `api-connect/graphql/schema/{input-filename}.graphql` | Orchestrated query added; parent type extended with `@materializer` fields |
| `api-connect/graphql/tools/{input-filename}.graphql` | Tool definitions updated — typically only the orchestrated query is exposed |
| `api-connect/graphql/index.graphql` | Visibility `fields` regex updated to match newly exposed tools |

## Critical Rules

| Rule | Why it matters |
|------|---------------|
| Base queries **must** have `configuration: "upstream_configuration"` | Materializers inherit auth context from the referenced query — without it, child calls return 401 |
| Base queries **must** have `headers` OR `forwardheaders` | Same reason — materializers cannot supply their own auth |
| **Never add `configuration` to `@materializer`** | Not supported by StepZen — causes deployment error |
| Tools file **must** use `extend schema @tool(...)` | Using `extend type Query` causes "field already defined" errors |
| Generated files **must** be ASCII-only | StepZen's SDL parser fails on em-dash, smart quotes, ellipsis, etc. |

## Related Skills

- [**`graphql-api-creator`**](../graphql-api-creator/README.md) — must run first to create the base schema
- [**`graphql-security`**](../graphql-security/README.md) — single source of truth for all authentication troubleshooting, including materializer 401 errors
- [**`graphql-field-optimization`**](../graphql-field-optimization/README.md) — can be combined before or after orchestration

## Part of the GraphQL Skill Family

This skill is included in the **[IBM GraphQL API Builder for AI Agents](../../Collections/IBM-GraphQL-API-Builder-For-Agents/README.md)** collection. For a step-by-step walkthrough with prompts and a demo script, see the **[recipe](../../Recipes/GraphQL-API-Builder-For-Agents/08-GraphQL-API-Builder-For-Agents.md)**.

## Further Documentation

> **Note:** These links were identified from search results. Automated access to `ibm.com/docs` is blocked (HTTP 403) — verify manually in a browser before use.

- [Developing GraphQL APIs and schemas](https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=developing-graphql-apis-schemas)
- [Building a supergraph by stitching results (`@materializer`)](https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=directives-building-supergraph-by-stitching-results)
- [Using GraphQL directives](https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=schemas-using-graphql-directives)
- [Configuring API Connect for GraphQL (`config.yaml`)](https://www.ibm.com/docs/en/api-connect-graphql/1.1.x?topic=essentials-configuring-api-connect)
