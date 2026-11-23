---
name: graphql-api-creator
description: >
  Converts OpenAPI/Swagger specs into a read-only IBM API Connect for GraphQL (StepZen) project
  with MCP @tool definitions. Triggers on: build GraphQL API, generate GraphQL schema, convert
  OpenAPI to GraphQL, create StepZen project, init graphql project, initialize graphql project,
  scaffold graphql project, new graphql project, generate MCP tools from OpenAPI, create GraphQL
  API from spec, build a read-only GraphQL API, graphql-api-creator.
---

# create-graphql-project.md

This blueprint is optimized for **IBM BOB** to generate **read-only** projects for **IBM API Connect for GraphQL** that expose a **flat, MCP-friendly, token-efficient interface**.

**IMPORTANT: This generator creates READ-ONLY GraphQL APIs. Only GET operations from the source API specs will be converted to GraphQL queries. POST, PUT, PATCH, DELETE, and other mutation operations are explicitly excluded.**

## Core Intent

This generator does **not** aim to mirror the upstream REST schema 1:1.

It intentionally produces:

- **flat GraphQL output types**
- **nullable output fields by default**
- **tool-friendly query surfaces**
- **minimal nesting to reduce token usage for MCP/LLM clients**

These are **project conventions** for MCP optimization.

They are **not** IBM platform requirements.

---

## 0. Sensitive Data Handling (Mandatory)

**Bob MUST NEVER display literal secret values in chat output.** This applies to any value read from `config.yaml`, `.env`, environment variables, or any other credential source.

### What counts as sensitive data

- API keys (e.g. `71e83fc2-8bc6-420f-aed2-af1aadf6bc55`)
- Bearer / OAuth tokens
- Client secrets and client IDs
- Passwords and basic-auth credentials
- IBAN, account numbers, or any financial identifiers that could be PII
- Any value stored in a `configurationset` variable in `config.yaml`

### Obfuscation rule

When Bob reads a secret value from any config file and needs to reference it in chat, replace the middle portion with asterisks, keeping at most the first 4 and last 4 characters visible:

```
71e83fc2-8bc6-420f-aed2-af1aadf6bc55  →  71e8****bc55
bbab81a6-88bc-459d-8681-d5299be216e0  →  bbab****16e0
eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOi...  →  eyJh****...
```

If the value is shorter than 8 characters, replace it entirely with `****`.

### Where this applies

- Chat summaries describing what was found in `config.yaml`
- Confirmation messages that reference selected authentication values
- Any inline code block or table shown to the user that echoes a resolved secret
- Tool descriptions or comments written to `.graphql` files must use only the variable **name** (e.g. `$upstream_account_api_key`), never the resolved value

### What is NOT obfuscated

- Variable **names** (e.g. `upstream_account_api_key`) — these are safe to display
- Header **names** (e.g. `x-Gateway-APIKey`) — these are safe to display
- Example / placeholder values in documentation (e.g. `your-api-key-here`, `${UPSTREAM_API_KEY}`)
- URLs, endpoint paths, operation IDs

### Enforcement

- **Read `config.yaml` to verify variable names exist** — do not echo their values back to the user in plain text
- When presenting the authentication selection prompt, show the variable **name** only, not its value
- When confirming authentication choices, write `upstream_account_api_key: 71e8****bc55 (found in config.yaml)` not the full value

---

## 1. Project Initialization

### 1.0 Intent Recognition — "init" trigger

If the user's message contains any of the following intents (case-insensitive),
treat it as an **init request** and follow section 1.1 exclusively:

- "init the graphql project"
- "init graphql project"
- "initialize the graphql project"
- "set up the graphql project"
- "create the graphql project"
- "bootstrap the graphql project"
- "scaffold the graphql project"
- "new graphql project"
- "start a graphql project"

**Enforcement:** When an init intent is detected, the ONLY action Bob takes is
the scaffold procedure in section 1.1. Do NOT proceed to spec scanning,
operation selection, or schema generation until the user explicitly asks to
build the API after the scaffold is complete.

---

### 1.1 Scaffold procedure (init path)

**Step 1 — Check if the project already exists:**

List the contents of `api-connect/graphql/`. If the folder already exists
and contains `config.yaml` and `stepzen.config.json`, tell the user:

> "The GraphQL project is already initialised at `api-connect/graphql/`.
> Place your OpenAPI spec in `api-connect/graphql/input/` and then say
> **'Bob, build the GraphQL API'** to generate the schema."

Then STOP — do not re-scaffold.

**Step 2 — Run both scaffold scripts:**

```
python .bob/skills/graphql-api-creator/scripts/scaffold_project.py
python .bob/skills/graphql-wxo-agent-creator/scripts/scaffold_project.py
```

Run them in order. The second script creates the `watsonx/` folder, wrapper scripts,
and an `agent.yaml` stub. If the `graphql-wxo-agent-creator` skill is not installed,
skip the second command and tell the user:

> "The `graphql-wxo-agent-creator` skill is not installed. Only the GraphQL project
> was scaffolded. Install the skill to also set up the watsonx agent structure."

If `WXO_TOOLKIT_NAME` is set in the environment, the script uses it as the
StepZen endpoint name automatically. If it is not set, the script falls back
to `my-graphql-api` and prints a warning — tell the user to update
`api-connect/graphql/stepzen.config.json` with their actual endpoint name.

**Step 3 — Check for `.env`:**

After scaffolding, check whether `.env` exists at the project root.

If it does NOT exist, tell the user:

> "Project structure is ready. Before you can deploy, fill in `.env` with your credentials.
>
> **IBM API Connect for GraphQL (StepZen) — for `api-connect/deploy.py`:**
>
> Go to https://aws.console.saas.ibm.com/, select 'API Connect for GraphQL', click your instance:
>
> | Variable | Where to find it |
> |---|---|
> | `STEPZEN_INSTANCE_API_KEY` | Instance page — create or copy an API key |
> | `STEPZEN_ENVIRONMENT` | Login page — the environment name |
> | `STEPZEN_DOMAIN` | Login page — the domain name |
> | `STEPZEN_INSTANCE_ID` | `stepzen login` command on the instance page — the `-i` value |
>
> The MCP/Query endpoint base URL is `https://<STEPZEN_ENVIRONMENT>.<STEPZEN_DOMAIN>/`
>
> **watsonx Orchestrate — for `watsonx/deploy.py`:**
>
> | Variable | Where to find it |
> |---|---|
> | `WXO_AUTH_TYPE` | `ibm_iam` (default, IBM Cloud tenant) or `mcsp_v2` (AWS/Azure trial tenant) |
> | `WXO_ENV_NAME` | IBM Cloud: exact resource name from [IBM Cloud resource list](https://cloud.ibm.com/resources) under **AI / Machine Learning**. AWS trial: any short name you choose (used only locally). |
> | `WXO_IBM_CLOUD_API_KEY` | IBM Cloud: https://cloud.ibm.com/iam/apikeys (Viewer access). AWS trial: in the watsonx Orchestrate UI, User icon (top-right) → Settings → API details tab → **Generate API key** (copy immediately — it can't be viewed again). |
> | `WXO_INSTANCE_URL` | IBM Cloud: resource page for your Orchestrate instance (the Launch URL). AWS trial: same Settings → API details tab → **Service instance URL**. |
> | `WXO_CONNECTION_NAME` | `app_id` of an existing connection in Orchestrate (links the MCP toolkit) |
>
> The WXO variables are also appended to `.env` automatically when you initialise the watsonx project.
>
> No tenant yet? Register (no credit card): https://www.ibm.com/account/reg/signup?formid=urx-52542
>
> Copy `.env.hc.tmpl` to `.env` and fill in those values, or edit the `.env` that was just created."

**Step 4 — Confirm and guide next step:**

Tell the user:

> "Project initialised successfully. Here is what was created:
>
> ```
> api-connect/
>   graphql/
>     input/          <- place your OpenAPI spec here
>     schema/         <- generated schema files will appear here
>     tools/          <- generated tools files will appear here
>     mappings/       <- field mapping docs will appear here
>     config.yaml     <- add your upstream API credentials here
>     stepzen.config.json  <- set your StepZen endpoint name here
>   deploy.py         <- deploys schema/tools/index.graphql to StepZen
>   undeploy.py       <- removes the deployed API from StepZen only;
>                        local files (schema/, tools/, mappings/,
>                        index.graphql) are never deleted
> watsonx/
>   agent.yaml        <- regenerate with 'Bob, create the agent YAML'
>   deploy.py
>   undeploy.py
> ```
>
> **Next step:** Place your OpenAPI/Swagger spec (`.json` or `.yaml`) in
> `api-connect/graphql/input/`, then say **'Bob, build the GraphQL API'**."

---

### 1.2 Normal path (spec already present)

When the user is NOT triggering an init but asking to build/generate the API,
follow this sequence:

- Check whether `api-connect/graphql/` exists. If it does **not**, run the
  scaffold procedure (§1.1) first, then stop and wait for the user to add
  their spec.
- Scan `api-connect/graphql/input/` for any `.yaml`, `.yml`, or `.json` files.
- Detect Swagger 2.0 and OpenAPI 3.x specs.
- Extract the input filename (without extension) to use as the base name for
  generated files.
  - Example: `input/iwhi-graphql-account-input.json` → base name:
    `iwhi-graphql-account-input`
- Read `config.yaml` only for configuration lookup. Do **not** create,
  replace, or modify it.

---

## 2. Interactive API Selection

### 2.1 Parse and Display Operations

Before any schema generation, parse the OpenAPI/Swagger input and list all available operations.

Rules:
- identify **all GET operations** as candidate read operations
- identify all non-GET operations as excluded from this read-only generator
- present the GET operations to the user in a compact numbered list
- include for each operation:
  - HTTP method
  - path
  - operationId
  - short summary if available

Example:

```text
📘 Read Operations Detected

1. GET /accounts
   operationId: getAccounts
   summary: Get all Customer Accounts

2. GET /accounts/{accountID}
   operationId: getAccountByID
   summary: Get Customer Account by ID

3. GET /accounts/{accountID}/compliance
   operationId: getComplianceInfoForID
   summary: Get Compliance Information for given Customer Account ID
```

### 2.2 Selection Methods

The user must explicitly choose which read operations will be generated.

Allowed interaction patterns:
- select all read operations
- select a numbered subset
- exclude specific numbered operations
- select by operationId when clearer than numbers

Example prompt:

```text
Which read operations should be included in the GraphQL API?

A) Include all read operations
B) Include only selected operations by number
C) Exclude selected operations by number
D) Include only selected operationIds

Please choose A/B/C/D and provide the selection.
```

### 2.3 Selection Rules

These rules are mandatory:
- **STOP and ask the user before generating any files.** Do not proceed to generation until a selection has been explicitly confirmed.
- **Never assume all GET operations should be generated without user confirmation**
- **Never generate queries for non-GET operations**
- if the user says "build a GraphQL API" without specifying operations, ask for selection
- if the user explicitly says "all read operations", then generate all GET operations
- if the user specifies a subset, generate only that subset
- the final GraphQL query surface must match the selected operations exactly
- do not add convenience aliases, wrapper queries, or extra orchestrated queries unless explicitly requested

**Enforcement:** If the skill is invoked and no operation selection has been made yet, the very next action MUST be to display the numbered list and ask the selection question. Writing any `.graphql` file before receiving a selection response is a violation of this skill.

---

## 3. Security Configuration

**For detailed security configuration, authentication methods, and troubleshooting, see the `graphql-security` skill.**

### Quick Reference

Before generating GraphQL schema, configure authentication:

1. **Detect OpenAPI security schemas** (if present in specification)
2. **Present authentication options to user:**
   - API Key (static credentials)
   - Forward Headers (pass-through authentication)
   - Custom headers
   - Combined methods
   - No authentication

3. **Apply selected authentication consistently** to all `@rest` directives

### Critical Requirements

All `@rest` directives MUST include:
```graphql
configuration: "upstream_configuration"
```

Plus ONE of:
- `headers: [{ name: "Header-Name", value: "$variable_name" }]` (for static credentials)
- `forwardheaders: ["Authorization"]` (for pass-through authentication)
- Both (for combined authentication)
- Neither (for public APIs)

### When to Activate graphql-security Skill

Activate the `graphql-security` skill when:
- OpenAPI spec contains security schemas
- User needs guidance on authentication methods
- Troubleshooting authentication failures
- Configuring materializers that need authentication

**See `graphql-security` skill for:**
- Complete OpenAPI security detection process
- Interactive authentication selection
- Multiple security schema handling
- Authentication troubleshooting guide
- Materializer authentication requirements

---

## 4. Generation Strategy

For every selected **read-only (GET) operation**, generate files using the input filename as the base name:

- `schema/{input-filename}.graphql` (queries only, no mutations)
- `tools/{input-filename}.graphql`
- `index.graphql`

**Naming Convention:**
- Extract the input filename without extension (e.g., `iwhi-graphql-account-input.json` → `iwhi-graphql-account-input`)
- Use this base name for schema and tools files
- Example: For input file `iwhi-graphql-account-input.json`:
  - Generate: `schema/iwhi-graphql-account-input.graphql`
  - Generate: `tools/iwhi-graphql-account-input.graphql`
  - Generate: `index.graphql` (references the above files)

Only these files may be created or overwritten.

Do **not** create or modify:
- `config.yaml`
- input files
- any other project files

---

## 5. Schema Design Policy

### 5.1 Flat Interface Policy

This project intentionally generates **flat return types** to reduce token usage and simplify MCP tool use.

Rules:

- Flatten nested upstream JSON into a **single-level GraphQL output type** whenever practical.
- Do **not** expose deeply nested return trees unless absolutely required.
- Prefer scalar and list fields on one flat type.
- Use `setters`, `resultroot`, `transforms`, and `postbody` as needed to map upstream structures into that flat shape.

Example:

```graphql
type Account {
  id: String
  name: String
  credit_score: Int
  risk_category: String
}
```

Instead of:

```graphql
type Account {
  data: AccountData
  credit: CreditInfo
}
```

### 5.2 Nullability Policy

For **output fields**, remove `!` by default.

Rules:

- Generated response fields should normally be nullable.
- This keeps the interface tolerant of upstream variation and partial responses.
- Input arguments may still be required if the upstream operation requires them.

### 5.3 Type Usage Rules

- Every custom type must be referenced by at least one query or mutation field.
- Never generate dead types.
- Prefer explicit GraphQL object types over `JSON`.
- Use `JSON` only when:
  - the response shape is truly dynamic, or
  - arbitrary keys make a stable typed model unrealistic, or
  - flattening would destroy meaning and no practical typed model exists.

---

## 6. Mapping Rules for `@rest`

### 6.1 Directive Basics

Use the IBM API Connect for GraphQL `@rest` directive.

Important:

- The correct argument name is **`resultroot`**, not `resultRoot`.
- `setters` map fields **relative to the extracted `resultroot`**.
- If `resultroot` is set, sibling data outside that root is no longer available to `setters`.

### 6.2 Upstream Configuration Policy

Add this to every generated `@rest` directive:

```graphql
configuration: "upstream_configuration"
```

This is a **project convention**.

Before generating it, verify that `config.yaml` already contains a matching configuration block. Do not create or edit `config.yaml`.

### 6.3 Authentication Configuration

**For complete authentication configuration, see the `graphql-security` skill.**

**Quick Steps:**
1. Detect OpenAPI security schemas (if present)
2. Present authentication options to user (API Key, Forward Headers, Custom, None)
3. Apply selected authentication to all `@rest` directives

**Authentication must be ONE of:**
- `headers: [{ name: "Header-Name", value: "$variable_name" }]`
- `forwardheaders: ["Authorization"]`
- Both (combined authentication)
- Neither (public API)

**See `graphql-security` skill for:**
- Complete security detection process
- Interactive authentication selection
- Multiple security schema handling
- Validation and troubleshooting

### 6.4 Authentication Header Policy (Legacy)

For backward compatibility, if no OpenAPI security schemas are detected:

Check `config.yaml`.

If the following values exist, add matching headers in `@rest`:

- `upstream_api_key` -> header `x-Gateway-APIKey` with value `"$upstream_api_key"`

Alternatively, use `forwardheaders: ["Authorization"]` to pass through client authentication headers.

If no config variables exist and forwardheaders is not desired, do not invent auth headers.

### 6.5 Setter Rules

Use `setters` to map nested upstream JSON into flat GraphQL fields.

Rules:

- `field` refers to the **flat GraphQL output field**
- `path` refers to the **upstream JSON path relative to `resultroot`**
- Do not use `$` prefixes in setter paths
- If a `path` contains special characters such as hyphens, wrap it in backticks

Example:

```graphql
setters: [
  { field: "id", path: "AccountData.id" }
  { field: "name", path: "AccountData.name" }
  { field: "credit_score", path: "CreditInfo.credit_score" }
]
```

Example with special characters:

```graphql
setters: [
  { field: "terminal", path: "`terminal-name`" }
]
```

### 6.6 Default Mapping Rule

If upstream field names already match flat GraphQL field names, do not add unnecessary `setters`.

Only generate `setters` for:
- renamed fields
- flattened fields
- fields extracted from nested structures
- fields created after transforms

---

## 7. Array Handling Rules

This section is critical.

### 7.1 Raw Root Arrays

If the upstream response is a raw root array:

```json
[
  { "id": "1", "name": "A" },
  { "id": "2", "name": "B" }
]
```

Then:

- return type must be `[TypeName]`
- usually use **no `resultroot`**

Example:

```graphql
type Query {
  items: [Item]
    @rest(
      endpoint: "https://example.com/items"
      configuration: "upstream_configuration"
    )
}
```

### 7.2 Wrapped Arrays

If the response wraps the array in an object:

```json
{
  "items": [
    { "id": "1" },
    { "id": "2" }
  ]
}
```

Use:

```graphql
resultroot: "items[]"
```

**Important: CEL Runtime Error Prevention**

When using `resultroot` with wrapped arrays, you may encounter CEL runtime errors if field mapping is ambiguous. To prevent this:

1. **Always use explicit setters** when extracting arrays from wrapped responses
2. **Use `resultroot: "arrayName[]"`** notation for proper array extraction
3. **Map each field explicitly** even if field names match

Example that prevents CEL errors:

```graphql
type Query {
  searchResults(query: String!): [SearchResult]
    @rest(
      endpoint: "https://api.example.com/search?q=$query"
      configuration: "upstream_configuration"
      resultroot: "results[]"
      setters: [
        { field: "id", path: "id" }
        { field: "name", path: "name" }
      ]
    )
}
```

**Why this matters:**
- Without explicit setters, StepZen may fail to parse array elements correctly
- CEL runtime errors often indicate ambiguous field mapping
- Explicit setters provide clear instructions for data extraction
- The `[]` notation in `resultroot` signals array processing

**Common CEL Error Pattern:**
```json
{
  "errors": [
    {
      "message": "CEL runtime error",
      "path": ["operationName", 1]
    }
  ]
}
```

**Solution:** Add explicit setters as shown above.

### 7.3 Nested Arrays

For nested arrays, add `[]` to **every array segment** in the path.

Examples:

- `orders[]`
- `items[].fields`
- `groups[].members[]`
- `data[].items[].fields`

### 7.4 Root and Nested Array Rules Summary

- raw `[...]` -> no `resultroot`
- wrapped `{ items: [...] }` -> `resultroot: "items[]"`
- nested arrays -> add `[]` at every array hop
- never use `$[]`, `$`, or `$.propertyName`

Forbidden:

```graphql
resultroot: "$[]"
resultroot: "$"
resultroot: "$.items"
```

Allowed:

```graphql
resultroot: "items[]"
resultroot: "data.records[]"
resultroot: "groups[].members[]"
```

### 7.5 Important Limitation

`resultroot` selects where parsing starts.

It does **not** flatten nested arrays into a single flat list.

If the upstream response has nested arrays and the target GraphQL contract needs one flattened list, use:

- `transforms`
- `jq`
- `jsonata`
- `ecmascript`

Do **not** pretend `resultroot` alone can flatten nested arrays.

### 7.6 Child Arrays in a Flat Type

If a field inside the flat type is itself an array, preserve it as a GraphQL list field.

Examples:

```graphql
tags: [String]
codes: [Int]
aliases: [String]
```

Use a setter only when necessary:

```graphql
setters: [
  { field: "tags", path: "metadata.tags" }
]
```

Do not flatten a child array into a comma-separated string unless the spec explicitly demands that.

---

## 8. Object/Map Handling Rules

Some backends return objects keyed by arbitrary IDs, for example:

```json
{
  "data": {
    "2333": { "name": "john doe", "age": 23 },
    "3333": { "name": "jane smith", "age": 21 }
  }
}
```

Do **not** assume IBM automatically converts that object into a GraphQL list.

If the generated contract needs a list, use a transform such as `objectToArray`.

Example pattern:

```graphql
transforms: [
  { pathpattern: ["data", "<>*"], editor: "objectToArray" }
]
```

Then map the transformed result to the target type.

Rule:

- map/object response -> no fake automatic array conversion
- use transform first
- then use `resultroot` / `setters` against the transformed shape

---

## 9. Transform Rules

Use transforms when the upstream response must be reshaped before it can populate the flat GraphQL type.

Use transforms for:

- object-to-array conversion
- flattening nested structures
- aggregating values
- dropping irrelevant branches
- restructuring payloads before `setters`

### 9.1 Preferred Transform Order

Prefer this order of attack:

1. `resultroot` if a simple root shift is enough
2. `setters` if only field remapping is needed
3. `transforms` if structure must change
4. `ecmascript` only when simpler options are not enough

### 9.2 `jq` Guidance

Use `jq` transforms when:
- multiple nested fields must be collapsed
- arrays must be aggregated
- a new flat payload is easier to build than many setters

Keep `jq` expressions deterministic and minimal.

### 9.3 Avoid Unnecessary Complexity

Do not use transforms if:
- direct mapping already works
- a simple `resultroot` plus a few setters is enough

---

## 10. Request Method Rules (Read-Only)

### 10.1 HTTP Method Mapping

**This generator only supports GET operations.**

Rules:

- `GET` -> Query
- `POST`, `PUT`, `PATCH`, `DELETE` -> **EXCLUDED** (not generated)

All generated GraphQL fields will be queries, never mutations.

### 10.2 Query Parameters

For GET operations with query parameters:

- GraphQL arguments automatically map to URL query parameters
- Use standard argument mapping
- No `postbody` is needed for GET operations
- No `queryparameters: STOP` is needed for read-only queries

---

## 11. Naming Rules

### 11.1 Query Names

- Prefer stable, descriptive GraphQL query names derived from `operationId`
- If `operationId` is poor or missing, generate a clean field name from GET method + path intent
- Use camelCase
- Avoid generic names like `getData`, `invoke`, `callApi`
- **Never generate mutation names** (mutations are not supported)

### 11.2 Type Names

- Use stable singular names for object types
- Use domain meaning, not transport wrappers
- Avoid names like `Response`, `Response1`, `InlineResponse200`
- **Check for duplicate type names across all existing schema files** before generating new types
- If a type name already exists in another schema file, use a unique name or consider if the types can be unified

Good:
- `Account`
- `Country`
- `VatValidation`

Bad:
- `GetAccountResponse`
- `InlineResponse`
- `DataWrapper`

**Handling Duplicate Types Across Multiple APIs:**

When generating a new schema, always check existing schema files in `api-connect/graphql/schema/` for duplicate type names:

1. **Scan existing schemas** - List all type definitions in existing `.graphql` files
2. **Identify conflicts** - Check if any types in the new schema have the same name
3. **Resolution strategies**:
   - **Option A: Use unique type names** - Rename the type in the new schema (e.g., `ContactData` → `Contact`)
   - **Option B: Unify types** - If types represent the same concept with identical fields, consider reusing the existing type
   - **Option C: Use extend type** - If the new schema only adds fields to an existing type, use `extend type` instead of redefining

**Example Conflict:**

Account API defines:
```graphql
type ContactData {
  id: String
  firstName: String
  lastName: String
}
```

Contact API should NOT redefine `ContactData`. Instead:
```graphql
# Option A: Use unique name
type Contact {
  id: String
  givenName: String
  surName: String
}

# Option B: Extend existing type (if adding fields only)
extend type ContactData {
  accounts: [AccountReference]
    @materializer(...)
}
```

**Critical Rule:** GraphQL schemas cannot have duplicate type definitions. Always check existing schemas before generating new types.

---

## 12. Schema Generation (`schema/{input-filename}.graphql`)

For each selected **GET operation**:

1. Generate a flat output type
2. Generate required input arguments (query parameters)
3. Generate the **query field only** (never mutations)
4. Attach an `@rest` directive
5. Add:
   - `endpoint`
   - `method: GET` (or omit, as GET is default)
   - `configuration: "upstream_configuration"`
   - `headers` when required by config
   - `resultroot` when needed
   - `setters` when needed
   - `transforms` when needed
   - **Never add `postbody`** (not applicable to GET operations)
   - **Never add `queryparameters: STOP`** (not needed for read-only queries)

### 12.1 Required Validation

Before finalizing `schema/{input-filename}.graphql`, verify:

- every custom type is referenced
- no nested output types remain unless explicitly required
- no unused type definitions exist
- no forbidden `resultroot` syntax exists
- no `$` prefixes appear in `resultroot`
- list return types align with array-producing mappings
- setters reference fields that actually exist in the flat output type
- **no mutations are present** (only queries allowed)
- **all operations use GET method only**

---

## 13. Tool Generation (`tools/{input-filename}.graphql`)

Generate one MCP tool per generated **query** (mutations are not supported).

Important distinction:
- `schema/{input-filename}.graphql` defines the actual GraphQL operations generated from OpenAPI GET operations
- `tools/{input-filename}.graphql` must **not invent additional upstream operations**
- tool-exposed fields may reuse the same field names as the generated queries, or they may wrap them via `@materializer`, but only when there is a concrete need such as argument reshaping or composition
- if no such need exists, prefer exposing the generated query fields directly via `@tool`
- if wrapper fields are introduced, they must map 1:1 to existing generated query operations and must not create new business semantics, aliases, or renamed operations unless explicitly requested by the user

### 13.1 Required Shape

For each query field:

```graphql
extend schema
  @tool(
    name: "fieldName"
    description: "High-quality semantic description for MCP and LLM tool usage."
    graphql: { expose: true, types: "Query", fields: "fieldName" }
  )
```

**Critical: tools files must start with `extend schema` — no leading comments or descriptions.**

StepZen's tools file parser expects `extend` as the very first token. Any content before the first `extend schema` block — including `"""block descriptions"""`, `# comments`, or blank lines with descriptions — will cause a parse error:

```
Error: Syntax Error tools/file.graphql (1:1) Expected "extend", found BlockString
```

Rules:
- Do NOT put `"""..."""` block descriptions at the top of a tools file
- Do NOT put free-standing `# comments` before the first `extend schema`
- The first non-whitespace token in any `tools/*.graphql` file MUST be `extend`
- If you need to document the tools file, use `# comments` inside or after the `extend schema` blocks, not before them

### 13.2 Tool Rules

- Prefer **no wrapper query fields** in `tools/{input-filename}.graphql`
- By default, expose the already generated query fields from `schema/{input-filename}.graphql` directly with `@tool`
- Do **not** rename operations in the tool layer unless the user explicitly asks for friendlier aliases
- Do **not** create parallel query names such as exposing `accountById` when the generated operation is `getAccountByID`, unless explicit aliasing is requested
- If wrapper fields are absolutely necessary, use `extend type Query`, never redefine `type Query`
- Any wrapper field must map 1:1 to an existing generated query and preserve the original operation semantics
- For `@materializer`, ensure argument mappings reference actual query arguments correctly and validate deployment semantics
- `name` must match the exposed GraphQL field unless there is a strong reason not to
- `description` must be written for LLM use, not for human API docs only
- `fields` must be a **string**
- do **not** generate `fields` as an array
- `graphql` may be a single visibility object or an array, but for standard per-field tools use a single object
- **Always use `types: "Query"`** (never "Mutation")

### 13.3 Tool Description Quality

Descriptions should state:

- what the tool retrieves or reads
- the business object it returns
- important filter/input semantics
- any important constraints
- **Emphasize read-only nature** (e.g., "Retrieves...", "Fetches...", "Gets...")

Bad:
```graphql
description: "Calls API"
```

Good:
```graphql
description: "Retrieves flat customer account details by account ID, including status, balance, and risk indicators. Read-only operation."
```

---

## 14. Index Assembly (`index.graphql`)

Create or overwrite `index.graphql`.

**Required format for read-only API with visibility control:**

```graphql
schema
  @sdl(
    files: [
      "schema/{input-filename}.graphql"
      "tools/{input-filename}.graphql"
    ]
    visibility: {
      expose: true
      types: "Query"
      fields: "(queryName1|queryName2|queryName3)"
    }
  )
  {
    query: Query
  }
```

**Example for input file `iwhi-graphql-account-input.json`:**

```graphql
schema
  @sdl(
    files: [
      "schema/iwhi-graphql-account-input.graphql"
      "tools/iwhi-graphql-account-input.graphql"
    ]
    visibility: {
      expose: true
      types: "Query"
      fields: "(getAccountByID|getComplianceInfoForID|getBankAccountForID)"
    }
  )
  {
    query: Query
  }
```

### 14.1 Visibility Configuration

The `visibility` parameter in the `@sdl` directive controls which queries are exposed in the public GraphQL API.

**Purpose:**
- Hide queries that are not exposed as MCP tools
- Keep internal/helper queries available for materializers but hidden from public API
- Ensure only tool-exposed queries are visible to clients

**Format:**
- `expose: true` - Enable visibility filtering
- `types: "Query"` - Apply to Query type
- `fields: "(query1|query2|query3)"` - Regex pattern matching visible field names

**Important Rules:**
1. **Only expose queries that have `@tool` definitions** in `tools/{input-filename}.graphql`
2. **Use regex alternation pattern** with pipe `|` separator: `"(field1|field2|field3)"`
3. **Field names must match exactly** - use the actual query names from `schema/{input-filename}.graphql`
4. **Queries without `@tool` definitions are automatically hidden** when visibility is configured

**Example:**

If `tools/{input-filename}.graphql` exposes these queries:
```graphql
extend schema @tool(name: "getAccountByID", ...)
extend schema @tool(name: "searchAccountsByName", ...)
extend schema @tool(name: "getComplianceInfoForID", ...)
```

Then `index.graphql` visibility should match:
```graphql
visibility: {
  expose: true
  types: "Query"
  fields: "(getAccountByID|searchAccountsByName|getComplianceInfoForID)"
}
```

**Workflow:**
1. Generate all queries in `schema/{input-filename}.graphql` (including helper queries)
2. Generate `@tool` definitions in `tools/{input-filename}.graphql` for user-selected operations
3. Extract field names from `@tool` definitions
4. Build regex pattern from tool-exposed field names
5. Apply visibility configuration in `index.graphql`

**Result:**
- Queries with `@tool` definitions → **Visible** in public API
- Queries without `@tool` definitions → **Hidden** from public API (but available for internal use)

### 14.2 Basic Rules

- always include the braces block
- always include `query: Query`
- **never include `mutation: Mutation`** (mutations are not supported)
- keep file paths correct and relative
- **always configure visibility** to match tool-exposed queries

---

## 15. File Output Rules

### Files to create or overwrite

- `schema/{input-filename}.graphql` (where {input-filename} is the base name from the input file)
- `tools/{input-filename}.graphql` (where {input-filename} is the base name from the input file)
- `index.graphql` (references the above files)

**Example:** For input file `iwhi-graphql-account-input.json`:
- Create: `schema/iwhi-graphql-account-input.graphql`
- Create: `tools/iwhi-graphql-account-input.graphql`
- Create: `index.graphql`

### Files never to create or modify

- `config.yaml`
- anything in `input/`
- unrelated project files

---

## 16. Common Failure Modes

### Issue 1: `Expected {, found EOF` in `index.graphql`

Cause:
- missing schema block braces

Fix:

```graphql
schema
  @sdl(files: ["schema/{input-filename}.graphql", "tools/{input-filename}.graphql"])
  {
    query: Query
  }
```

### Issue 2: `directive @tool definition is out of sync` or `unknown value type *ast.ListValue`

Cause:
- `fields` passed as a GraphQL list instead of a string

Wrong:

```graphql
fields: ["getAccountDetails"]
```

Correct:

```graphql
fields: "getAccountDetails"
```

### Issue 3: deployed schema contains unexpected extra queries not present in the OpenAPI operations

Cause:
- tool generation introduced wrapper fields with new names instead of exposing the generated operation fields directly
- `tools/{input-filename}.graphql` redefined or extended `Query` with alias fields such as `accountById` in addition to generated fields such as `getAccountByID`
- the generator treated the tool layer as a second API design layer instead of a tool exposure layer

Fix:
- keep the query surface aligned to the generated operations unless the user explicitly requests aliases
- prefer `@tool(... fields: "existingQueryName")` on existing generated query fields
- do not create renamed wrapper queries just to make tool names friendlier
- if aliases are explicitly requested, document that this changes the public GraphQL query surface

### Issue 4: `field X.Y referenced in setters does not exist in type Z`

Cause:
- setter field name points to a nested or nonexistent GraphQL field
- flat schema and setter mapping are out of sync

Fix:
- ensure setter `field` names target actual flat fields
- keep the GraphQL output type flat if this project policy requires flat outputs

### Issue 5: service unavailable / bad mapping

Cause:
- invalid `resultroot` syntax

Wrong:
```graphql
resultroot: "$[]"
resultroot: "$"
resultroot: "$.items"
```

Correct:
```graphql
resultroot: "items[]"
resultroot: "data.records[]"
```

### Issue 5b: list expected but map/object returned

Cause:
- backend returns keyed object map instead of array

Fix:
- use `objectToArray` or another transform before mapping to `[Type]`

### Issue 6: CEL runtime error with wrapped arrays

Cause:
- wrapped array response without explicit setters
- ambiguous field mapping when using `resultroot` with arrays

Symptoms:
```json
{
  "errors": [
    {
      "message": "CEL runtime error",
      "path": ["operationName", 1]
    }
  ]
}
```

Fix:
- Use `resultroot: "arrayName[]"` notation (with `[]`)
- Add explicit setters for all fields, even if names match
- Example:

```graphql
searchResults(query: String!): [SearchResult]
  @rest(
    endpoint: "https://api.example.com/search?q=$query"
    configuration: "upstream_configuration"
    resultroot: "results[]"
    setters: [
      { field: "id", path: "id" }
      { field: "name", path: "name" }
    ]
  )
```

**Why this works:**
- Explicit setters eliminate CEL parsing ambiguity
- The `[]` notation signals array processing to StepZen
- Clear field mapping prevents runtime interpretation errors

### Issue 7: Mutation operations attempted

Cause:
- trying to generate POST/PUT/PATCH/DELETE operations

Fix:
- **This is not supported.** Only GET operations are converted to GraphQL queries.
- Remove non-GET operations from selection.

### Issue 8: Deployment fails due to non-ASCII characters in comments

**Cause:**
Non-ASCII characters (em-dash `—`, en-dash `–`, smart quotes `"` `"`, ellipsis `…`, etc.) in GraphQL comments or string literals cause StepZen's SDL parser to fail even though the characters appear harmless.

**Typical error:**
```
Error: Syntax Error schema/file.graphql (20:11) Expected :, found Name "ce"
```
The parser trips on the byte after the non-ASCII character, reporting the *next* token as unexpected.

**Prevention (mandatory):**
- **NEVER write non-ASCII characters anywhere in generated `.graphql` files** — not in comments, descriptions, string values, or anywhere else.
- Replace en-dash `–` and em-dash `—` with a plain hyphen `-`
- Replace smart/curly quotes `"` `"` `'` `'` with straight quotes `"` or `'`
- Replace ellipsis `…` with `...`
- Replace all other non-ASCII punctuation or symbols with their plain ASCII equivalents or remove them entirely.
- This rule applies to **triple-quoted descriptions** (`"""..."""`), `#` comments, and `@tool` description strings equally.

**Fix:**
Scan the generated file for any codepoint above U+007F and replace with ASCII equivalents before saving.

---
## 17. Best Practices Summary

1. **Only process GET operations** - exclude all POST, PUT, PATCH, DELETE operations
2. **Use graphql-security skill for authentication configuration**
3. **Always present authentication options** - never assume the method
4. Flatten output types intentionally for MCP efficiency
5. Keep output fields nullable by default
6. Use `resultroot`, never `resultRoot`
7. Use `[]` for every array segment in `resultroot`
8. Use no `resultroot` for raw root arrays unless proven necessary
9. Do not assume object maps auto-convert to arrays
10. Use `objectToArray`, `jq`, `jsonata`, or `ecmascript` when structure must change
11. Remember that `setters` are relative to `resultroot`
12. Use string values for `@tool(... graphql: { fields: "..." })`
13. Include the schema block in `index.graphql` with **only `query: Query`**
14. **Never generate mutations** - this is a read-only API generator
15. Generate only the three allowed files
16. **Use graphql-security skill** for authentication configuration and troubleshooting
17. Apply authentication consistently across all `@rest` directives

---

## 18. Pre-Generation Validation Checklist

Before generating any GraphQL files, verify the following:

### Schema Validation
- [ ] All selected operations are GET methods only (no POST/PUT/PATCH/DELETE)
- [ ] All custom types are referenced by at least one query
- [ ] No nested output types remain (unless explicitly required for business logic)
- [ ] No unused type definitions exist
- [ ] Type names follow naming conventions (no `Response`, `InlineResponse200`, etc.)
- [ ] **Type names are unique across all existing schema files** - Check `api-connect/graphql/schema/` for conflicts
- [ ] Query names are descriptive and use camelCase

### @rest Directive Validation
- [ ] Every query has a valid `@rest` directive
- [ ] `endpoint` parameter is present and uses correct variable interpolation (e.g., `$accountID`)
- [ ] `method: GET` is specified or omitted (GET is default)
- [ ] `configuration: "upstream_configuration"` is present on ALL queries
- [ ] `headers` array is present with correct authentication format OR `forwardheaders: ["Authorization"]` is set
- [ ] Authentication variable matches config.yaml (e.g., `$upstream_api_key`) OR forwardheaders array is used

### Array Handling Validation
- [ ] `resultroot` uses correct syntax (no `$` prefix, no JSONPath)
- [ ] Array segments use `[]` notation (e.g., `"items[]"`, `"data.records[]"`)
- [ ] Raw root arrays have no `resultroot` or use empty string
- [ ] List return types `[Type]` align with array-producing mappings
- [ ] Object maps use `objectToArray` transform before mapping to lists

### Setter Validation
- [ ] All setter `field` names reference actual fields in the flat output type
- [ ] Setter `path` values are relative to `resultroot` (if specified)
- [ ] No setters reference nested or non-existent fields
- [ ] Setters are only used when field names differ from JSON response keys

### Transform Validation
- [ ] Transforms are only used when necessary (not for simple field mapping)
- [ ] Transform order follows preference: `resultroot` → `setters` → `transforms` → `ecmascript`
- [ ] `jq` expressions are deterministic and minimal
- [ ] Transforms are applied before `resultroot` and `setters`

### Tool Configuration Validation
- [ ] One `@tool` directive per query field
- [ ] Tool `name` matches the GraphQL field name
- [ ] Tool `description` is semantic and LLM-friendly (not just API docs)
- [ ] Tool `fields` parameter is a **string**, not an array
- [ ] Tool `types: "Query"` is used (never "Mutation")
- [ ] Tool descriptions emphasize read-only nature ("Retrieves...", "Fetches...", "Gets...")

### Index File Validation
- [ ] `index.graphql` includes schema block with braces
- [ ] Schema block contains `query: Query` only (no `mutation: Mutation`)
- [ ] File paths in `@sdl` are correct and relative, using input filename as base
- [ ] Both `schema/{input-filename}.graphql` and `tools/{input-filename}.graphql` are included

### Authentication Validation
- [ ] OpenAPI security schemas were analyzed (if present)
- [ ] User selected authentication method from detected options
- [ ] Selected authentication is consistent across ALL `@rest` directives
- [ ] Authentication variable exists in `config.yaml`
- [ ] Header format matches authentication type (Bearer token, API key, etc.)

### File Output Validation
- [ ] Only three files will be created/overwritten: `schema/{input-filename}.graphql`, `tools/{input-filename}.graphql`, `index.graphql`
- [ ] `config.yaml` will NOT be modified
- [ ] Files in `input/` will NOT be modified
- [ ] No unrelated project files will be modified

- [ ] **No non-ASCII characters** exist anywhere in the generated `.graphql` files (comments, descriptions, string values)

**If any validation fails, STOP and fix the issue before generating files.**

---

## 19. Authentication Troubleshooting

For all authentication issues (401 errors, missing variables, wrong header formats, mixed methods, test-vs-production failures), activate the **`graphql-security` skill**, which is the single source of truth for authentication troubleshooting.

Key rules to check first:
1. ALL `@rest` directives must have `configuration: "upstream_configuration"`
2. ALL `@rest` directives must have `headers` OR `forwardheaders` - materializers inherit from these
3. **Never add `configuration` to `@materializer`** (not supported)
4. Variable names in `headers` must match exactly what is in `config.yaml` (case-sensitive)

---

## 20. Instructions for BOB

### Environment Setup (check first)

Before any work, verify that environment variables are loaded by running `python set-env.py` and following the shell-specific export instructions printed by that script.


1. Read API specs from `./input/`
2. Verify `./config.yaml` exists
3. Verify `config.yaml` already contains `upstream_configuration`
4. **Configure authentication** (use graphql-security skill):
   - Detect OpenAPI security schemas
   - Present authentication options to user — show variable **names** only, never literal values
   - Apply selected method to all `@rest` directives
5. **Parse only GET operations** - filter out all POST, PUT, PATCH, DELETE operations
6. Ask the user which **read-only operations** to include
7. Generate only:
   - `schema/{input-filename}.graphql` (queries only, no mutations) - using input filename as base
   - `tools/{input-filename}.graphql` (query tools only) - using input filename as base
   - `index.graphql` (with only `query: Query`, no mutations, referencing the above files)
8. Apply selected authentication headers to all `@rest` directives
9. Do not modify any other file

When in doubt:

- **only generate read-only queries from GET operations**
- **use graphql-security skill for authentication configuration**
- **never assume authentication method - always ask the user**
- **never display literal API keys, tokens, or secrets in chat — obfuscate using the rule in Section 0**
- prefer a flat GraphQL contract
- prefer explicit mapping over guesswork
- prefer transforms over fake automatic behavior
- prefer fewer, cleaner fields over transport-noise wrappers
- **never generate mutations or support write operations**
- **use graphql-security skill for authentication troubleshooting**

After generation is complete, suggest the next steps if they have not been addressed yet:
- **`graphql-field-optimization` skill** — if backend field names are cryptic, abbreviated, or use snake_case
- **`graphql-query-orchestrator` skill** — if the parent resource has 2 or more child endpoints that the agent should fetch in a single query
- **`graphql-wxo-agent-creator` skill** — to generate `watsonx/agent.yaml` and deploy the toolkit and agent to watsonx Orchestrate

---

## 21. Further Documentation

The following IBM official pages describe the underlying platform features. Use them to verify directive syntax, configuration options, or StepZen behavior. When the content of this skill conflicts with official documentation, the official documentation describes the engine behavior; this skill describes additional **project conventions** (see "Core Intent" above).

- **Developing GraphQL APIs and schemas** — https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=developing-graphql-apis-schemas
- **Using GraphQL directives (`@rest`, `@materializer`, etc.)** — https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=schemas-using-graphql-directives
- **Tutorial: Transform a REST API to GraphQL** — https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=apis-tutorial-transform-rest-api-graphql
- **Building a supergraph by stitching results (`@materializer`)** — https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=directives-building-supergraph-by-stitching-results
- **Paginating a REST API as a data source** — https://www.ibm.com/docs/en/apicgraphql-ipaas?topic=service-paginating-rest-api-as-data-source
- **Configuring API Connect for GraphQL (`config.yaml`)** — https://www.ibm.com/docs/en/api-connect-graphql/1.1.x?topic=essentials-configuring-api-connect

> **Note:** These URLs were identified from search results and may require manual verification in a browser before use, as automated access to the IBM documentation platform is blocked (HTTP 403).
