# GraphQL API Creator Skill

A Bob skill that converts OpenAPI/Swagger specifications into a read-only **IBM API Connect for GraphQL** project, fully wired for MCP tool exposure.

> **IBM API Connect for GraphQL** (powered by StepZen) is the GraphQL engine that hosts the API. **MCP** (Model Context Protocol) is the protocol that lets AI agents call the generated GraphQL queries as tools. This skill is the entry point of the four-skill GraphQL family.

## What It Does

Given one or more OpenAPI/Swagger files in `input/`, this skill generates a flat, token-efficient GraphQL API optimised for agentic AI clients. It intentionally **does not** mirror the upstream REST schema 1:1 — it produces a clean, nullable, flat contract instead.

Only **GET operations** are converted. POST, PUT, PATCH, DELETE, and all mutation operations are explicitly excluded.

## When to Use It

Activate this skill by asking questions such as:

- *"Generate a GraphQL API from my OpenAPI spec."*
- *"Convert the spec in `input/` to a StepZen GraphQL project."*
- *"Build a read-only GraphQL API for my REST service."*
- *"Create MCP tools from my OpenAPI file."*

## What You Get

The skill walks through **five interactive steps** and then generates exactly three files:

| Step | What happens |
|------|-------------|
| 1 · Project Initialisation | Scans `input/` for `.yaml`, `.yml`, `.json` specs; reads `config.yaml` for auth variable names |
| 2 · Interactive API Selection | Lists all GET operations; asks you to pick all or a subset |
| 3 · Security Configuration | Detects OpenAPI security schemas; asks you to confirm the auth method |
| 4 · Schema Generation | Produces flat output types, `@rest` directives, `resultroot`/`setters` mappings |
| 5 · Tool & Index Assembly | Wraps every query in an `@tool` directive; assembles `index.graphql` with visibility control |

## Files Generated

| File | Purpose |
|------|---------|
| `api-connect/graphql/schema/{input-filename}.graphql` | GraphQL queries and output types |
| `api-connect/graphql/tools/{input-filename}.graphql` | MCP `@tool` definitions (one per query) |
| `api-connect/graphql/index.graphql` | Schema assembly with visibility filter |

`config.yaml` and all files in `input/` are **never** modified.

## Key Design Principles

| Principle | Why |
|-----------|-----|
| **Flat output types** | Reduces token usage for MCP/LLM clients |
| **Nullable fields by default** | Tolerates partial upstream responses |
| **`extend schema` for tools** | Avoids "field already defined" deployment errors |
| **`configuration:` on every `@rest`** | Required for materializer auth inheritance |
| **ASCII-only in `.graphql` files** | StepZen's SDL parser rejects non-ASCII characters |

## Required Environment Variables

All values go into a single `.env` file at the project root. The file is created automatically during `init` — fill in the placeholder values before running any deploy script.

### IBM API Connect for GraphQL (StepZen)

| Variable | Where to find it |
|---|---|
| `STEPZEN_INSTANCE_API_KEY` | Instance page on [IBM API Connect for GraphQL](https://aws.console.saas.ibm.com/) — create or copy the API key |
| `STEPZEN_ENVIRONMENT` | Login page of your instance — the **environment** name |
| `STEPZEN_DOMAIN` | Login page of your instance — the **domain** name |
| `STEPZEN_INSTANCE_ID` | From the `stepzen login` command shown on the instance page — the `-i` value |

> The MCP and GraphQL query endpoint base URL is `https://<STEPZEN_ENVIRONMENT>.<STEPZEN_DOMAIN>/`

### watsonx Orchestrate

These variables are appended to `.env` when you run the `graphql-wxo-agent-creator` init (or run `scaffold_project.py` in that skill). They are required to deploy the agent.

| Variable | Where to find it |
|---|---|
| `WXO_ENV_NAME` | The **exact resource name** of your watsonx Orchestrate instance as shown in [IBM Cloud resource list](https://cloud.ibm.com/resources) under **AI / Machine Learning** |
| `WXO_IBM_CLOUD_API_KEY` | [IBM Cloud API keys](https://cloud.ibm.com/iam/apikeys) — key with Viewer access to the Orchestrate instance |
| `WXO_INSTANCE_URL` | IBM Cloud resource page for your watsonx Orchestrate instance (the launch URL) |
| `WXO_CONNECTION_NAME` | `app_id` of an existing connection in your Orchestrate instance (links the MCP toolkit) |
| `WXO_TOOLKIT_NAME` | Name you give the MCP toolkit in watsonx Orchestrate |
| `WXO_AGENT_NAME` | Display name for the deployed agent |
| `WXO_AGENT_DESCRIPTION` | Short description shown in the Orchestrate UI |
| `WXO_AGENT_MODEL` | LLM model ID (e.g. `watsonx/ibm/granite-4-h-small`) |

> `WXO_AGENT_KIND`, `WXO_AGENT_STYLE`, `WXO_AGENT_INSTRUCTIONS`, `WXO_AGENT_HIDE_REASONING`, `WXO_CONTEXT_ACCESS_ENABLED`, and `WXO_CONTEXT_VARIABLES` are optional — defaults are written into `.env` during init.

## Related Skills

This skill is the **entry point** of the GraphQL skill chain. After running it, consider:

- [**`graphql-field-optimization`**](../graphql-field-optimization/README.md) — rename cryptic backend field names to AI-friendly camelCase
- [**`graphql-query-orchestrator`**](../graphql-query-orchestrator/README.md) — merge parent + child endpoints into a single unified query
- [**`graphql-security`**](../graphql-security/README.md) — the single source of truth for all authentication troubleshooting

## Part of the GraphQL Skill Family

This skill is included in the **[IBM GraphQL API Builder for AI Agents](../../Collections/IBM-GraphQL-API-Builder-For-Agents/README.md)** collection. For a step-by-step walkthrough with prompts and a demo script, see the **[recipe](../../Recipes/GraphQL-API-Builder-For-Agents/08-GraphQL-API-Builder-For-Agents.md)**.

## Relationship to the `apiconnect-graphql` Skill

The [`apiconnect-graphql`](../apiconnect-graphql/README.md) skill and this four-skill family are **complementary — both are intentionally present**:

| Skill | Abstraction level | When to use |
|---|---|---|
| `apiconnect-graphql` | **Platform reference** — teaches the `stepzen` CLI, SDL directives (`@rest`, `@materializer`, `@dbquery`, …), deploy lifecycle, and debugging playbook | You want to understand or hand-author any StepZen / API Connect for GraphQL schema |
| `graphql-api-creator` (+ family) | **Project scaffolding + MCP optimisation** — automates the conversion of an OpenAPI spec into a flat, agent-ready GraphQL project with `@tool` directives | You have an OpenAPI file and want a deployable, AI-agent-callable API with minimal manual SDL |

The two do not overlap in purpose. `apiconnect-graphql` is the platform knowledge base; `graphql-api-creator` is the automation layer on top of it. The scaffolding skills internally follow the same StepZen patterns documented in `apiconnect-graphql`.

## Further Documentation

> **Note:** These links were identified from search results. Automated access to `ibm.com/docs` is blocked (HTTP 403) — verify manually in a browser before use.

- [Developing GraphQL APIs and schemas](https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=developing-graphql-apis-schemas)
- [Using GraphQL directives](https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=schemas-using-graphql-directives)
- [Tutorial: Transform a REST API to GraphQL](https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=apis-tutorial-transform-rest-api-graphql)
