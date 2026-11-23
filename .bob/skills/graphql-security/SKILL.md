---
name: graphql-security
description: >
  Handles authentication and security configuration for GraphQL APIs built with StepZen, including
  OpenAPI security schema detection, interactive auth method selection, config.yaml validation, and
  materializer authentication troubleshooting. Triggers on: configure authentication, GraphQL 401
  error, materializer 401, fix authentication, set up API key authentication, detect security
  schema, forwardheaders, graphql-security, authentication fails, upstream auth, StepZen auth.
---

# GraphQL Security Skill

## Purpose
Centralized security configuration for GraphQL APIs built with StepZen. This skill handles OpenAPI/Swagger security schema detection, interactive authentication method selection, configuration validation, and troubleshooting for both base queries and materializers.

## Environment Setup (check before starting)

This skill reads credentials from the process environment. Before using it, verify that environment variables are loaded. See **README.md** for instructions on running `set-env.py`.

## When to Use This Skill

Use this skill when:
- Converting OpenAPI/Swagger specs to GraphQL and need to configure authentication
- Setting up authentication for GraphQL queries with `@rest` directives
- Configuring materializers that need to inherit authentication context
- Troubleshooting authentication failures (401/500 errors)
- Validating security configuration before deployment

---

## 0. Sensitive Data Handling (Mandatory)

**See `graphql-api-creator` skill Section 0 for the full sensitive data handling policy.** The same rules apply here: never display literal API keys, tokens, or secrets in chat — obfuscate using the format `71e8****bc55`.

---

## 1. Core Authentication Concepts

### 1.1 StepZen Authentication Model

StepZen supports two primary authentication approaches:

**Configuration-Based Authentication:**
- Uses variables defined in `config.yaml`
- Applied via `headers` parameter in `@rest` directive
- Suitable for static API keys, tokens, or credentials

**Pass-Through Authentication (Forward Headers):**
- Uses `forwardheaders` parameter in `@rest` directive
- Forwards specified headers from client request to upstream API
- No configuration variables needed in `config.yaml`
- Suitable for dynamic authentication (Bearer tokens, session tokens)

### 1.2 Critical Requirements

All `@rest` directives MUST include:
```graphql
configuration: "upstream_configuration"
```

This is **required** for:
- Accessing configuration variables from `config.yaml`
- Enabling materializers to inherit authentication context
- Proper authentication propagation in orchestrated queries

---

## 2. OpenAPI Security Schema Detection

### 2.1 Detecting Security Schemas in OpenAPI Specifications

Before processing operations, analyze the OpenAPI/Swagger specification for security definitions.

**OpenAPI 3.x Example:**
```yaml
components:
  securitySchemes:
    oauth2:
      type: oauth2
      flows:
        implicit:
          authorizationUrl: https://example.com/oauth/authorize
          scopes:
            read: Read access
    apiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

**Swagger 2.0 Example:**
```json
{
  "securityDefinitions": {
    "oauth2": {
      "type": "oauth2",
      "flow": "implicit",
      "authorizationUrl": "https://example.com/oauth/authorize"
    },
    "apiKey": {
      "type": "apiKey",
      "name": "X-API-Key",
      "in": "header"
    }
  }
}
```

### 2.2 Operation-Level Security Requirements

Check if individual operations specify which security schema(s) they require:

```yaml
# OpenAPI 3.x example
paths:
  /public-data:
    get:
      security: []  # No authentication required
  /user-data:
    get:
      security:
        - bearerAuth: []  # Requires bearer token
  /admin-data:
    get:
      security:
        - bearerAuth: []
        - apiKeyAuth: []  # Requires BOTH bearer token AND API key
```

---

## 3. Interactive Authentication Selection

### 3.1 Presenting Authentication Options

When security schemas are detected, present options to the user:

```text
🔐 Security Configuration Detected in OpenAPI Specification

The following authentication methods are defined:

1. OAuth 2.0 (oauth2)
   - Type: oauth2
   - Flow: implicit
   - Authorization URL: https://example.com/oauth/authorize

2. API Key (apiKeyAuth)
   - Type: apiKey
   - Header: X-API-Key
   - Location: header

3. Bearer Token (bearerAuth)
   - Type: http
   - Scheme: bearer
   - Format: JWT

How would you like to configure authentication?

A) Use API Key with header from OpenAPI spec
   → Variable: upstream_api_key
   → Header: Uses header name defined in OpenAPI specification (e.g., X-API-Key)

B) Use forwardheaders (pass through authentication from client)
   → Syntax: forwardheaders: ["Authorization"]
   → Forwards specified headers from client request to upstream API
   → No configuration variable needed

C) Use custom header as defined in spec
   → Specify variable name and header format

D) No authentication (public API or external auth)
   → Skip authentication headers

Please select (A/B/C/D):
```

### 3.2 Multiple Security Schemas

When multiple security schemas are defined, present this enhanced selection:

```text
🔐 Multiple Security Schemas Detected

The API specification defines multiple authentication methods:

1. API Key (apiKeyAuth) - Used by: 8 operations
2. Custom Authentication - Used by: 12 operations

Some operations require multiple authentication methods simultaneously.

How would you like to configure authentication?

A) Use primary schema: API Key
   → All operations will use header from OpenAPI spec (e.g., X-API-Key: $upstream_api_key)
   
B) Use forwardheaders (pass through authentication)
   → All operations will use: forwardheaders: ["Authorization"]
   → Forwards specified headers from client to upstream API
   → No configuration variable needed

C) Use operation-specific authentication (recommended)
   → Each operation uses its defined security schema
   → May require config variables for some operations
   
D) Combine multiple schemas
   → Apply multiple headers to all operations
   → Specify which schemas to combine

E) No authentication
   → Skip all authentication headers

Please select (A/B/C/D/E):
```

---

## 4. Authentication Methods

### 4.1 API Key Authentication

**GraphQL Implementation:**
```graphql
type Query {
  getResource(id: ID!): Resource
    @rest(
      endpoint: "https://api.example.com/resource/$id"
      method: GET
      configuration: "upstream_configuration"
      headers: [
        { name: "X-API-Key", value: "$upstream_api_key" }
      ]
    )
}
```

**Required config.yaml:**
```yaml
configurationset:
  - configuration:
      name: upstream_configuration
      upstream_api_key: ${UPSTREAM_API_KEY}
```

**When to Use:**
- API requires static API key
- Header name is defined in OpenAPI spec
- Same credentials used for all requests

### 4.2 Forward Headers (Pass-Through Authentication)

**GraphQL Implementation:**
```graphql
type Query {
  getResource(id: ID!): Resource
    @rest(
      endpoint: "https://api.example.com/resource/$id"
      method: GET
      configuration: "upstream_configuration"
      forwardheaders: ["Authorization"]
    )
}
```

**Forward Multiple Headers:**
```graphql
forwardheaders: ["Authorization", "X-Custom-Header"]
```

**No config.yaml configuration needed** - headers are forwarded from client requests.

**When to Use:**
- Dynamic authentication (Bearer tokens, session tokens)
- Client handles authentication
- Different users have different credentials
- Gateway or proxy handles authentication

### 4.3 Custom Headers

**GraphQL Implementation:**
```graphql
type Query {
  getResource(id: ID!): Resource
    @rest(
      endpoint: "https://api.example.com/resource/$id"
      method: GET
      configuration: "upstream_configuration"
      headers: [
        { name: "x-Gateway-APIKey", value: "$upstream_api_key" }
      ]
    )
}
```

Extract the exact header name from the OpenAPI security schema.

### 4.4 Combined Authentication Methods

**Static Header + Forwarded Headers:**
```graphql
@rest(
  endpoint: "https://api.example.com/resource"
  method: GET
  configuration: "upstream_configuration"
  headers: [
    { name: "X-API-Key", value: "$upstream_api_key" }
  ]
  forwardheaders: ["Authorization"]
)
```

**When to Use:**
- API requires multiple authentication methods simultaneously
- Mix of static and dynamic credentials

### 4.5 API Key in Query Parameter

```graphql
@rest(
  endpoint: "https://api.example.com/resource?api_key=$upstream_api_key"
  method: GET
  configuration: "upstream_configuration"
)
```

### 4.6 No Authentication

```graphql
@rest(
  endpoint: "https://api.example.com/resource"
  method: GET
  configuration: "upstream_configuration"
)
```

Omit both `headers` and `forwardheaders` parameters.

---

## 5. Configuration Requirements

### 5.1 Base Query Requirements

**All base queries MUST have:**

1. ✅ **`configuration: "upstream_configuration"`**
   - Required for materializers to inherit API configuration
   - Without this, materializers cannot access authentication context

2. ✅ **Authentication via `headers` OR `forwardheaders`**
   - `headers`: For static credentials from config.yaml
   - `forwardheaders`: For pass-through authentication
   - Required for materializers to inherit authentication

**Example - Correct Base Query:**
```graphql
type Query {
  getCustomer(customerId: ID!): Customer
    @rest(
      endpoint: "https://api.example.com/customers/$customerId"
      method: GET
      configuration: "upstream_configuration"  # ✅ Required
      headers: [                                # ✅ Required (or use forwardheaders)
        { name: "X-API-Key", value: "$upstream_api_key" }
      ]
    )
}
```

### 5.2 Materializer Authentication Inheritance

**How Materializers Inherit Authentication:**

Materializers automatically inherit `configuration` and `headers` (or `forwardheaders`) from the base queries they reference.

**Example:**
```graphql
type Customer {
  id: ID!
  name: String
  
  # Materializer inherits configuration and headers from getCustomerAddresses
  addresses: [Address]
    @materializer(
      query: "getCustomerAddresses"
      arguments: [{ name: "customerId", field: "id" }]
    )
}
```

**Critical Rules:**
- ✅ Base query `getCustomerAddresses` MUST have `configuration` and `headers`
- ✅ Materializer automatically inherits these from the referenced query
- ❌ **NEVER add `configuration` to `@materializer` directive** (not supported by StepZen)

### 5.3 config.yaml Structure

**For Configuration-Based Authentication:**
```yaml
configurationset:
  - configuration:
      name: upstream_configuration
      upstream_api_key: ${UPSTREAM_API_KEY}
      upstream_api_token: ${UPSTREAM_API_TOKEN}
```

**For Forward Headers:**
No configuration needed in config.yaml - authentication is passed through from client.

---

## 6. Implementation Decision Process

### 6.1 Decision Priority

1. **If operations have explicit security requirements** → Use operation-specific authentication
2. **If all operations accept any auth method** → Let user choose
3. **If API requires multiple auth methods** → Use combined authentication
4. **If unsure** → Ask the user to decide

### 6.2 Implementation Rules by Selection

**Option A (API Key for All):**
- Apply the API key header uniformly to all `@rest` directives
- Use the header name from the OpenAPI specification
- Ignore operation-level security specifications
- Verify `upstream_api_key` exists in config.yaml

**Option B (Forward Headers for All):**
- Add `forwardheaders: ["Authorization"]` to all `@rest` directives
- Specify which headers to forward as an array
- No authentication headers or config variables needed in config.yaml
- Client authentication is passed through transparently

**Option C (Operation-Specific - Recommended):**
- Parse each operation's `security` field
- Apply the appropriate header(s) based on the operation's requirements
- Ensure all required config variables exist in `config.yaml`
- Most accurate approach when operations have different requirements

**Option D (Combined Schemas):**
- Apply multiple authentication methods to all operations
- Can combine headers with forwardheaders
- Ensure all required variables exist in `config.yaml`

**Option E (No Authentication):**
- Omit all authentication headers and forwardheaders
- Use for public APIs or when authentication is handled externally

---

## 7. Validation and Configuration

### 7.1 Pre-Generation Validation

Before generating schema files:

1. **Verify all required config variables exist:**
   - For API key auth: check that `upstream_api_key` exists in config.yaml
   - For forwardheaders: no config variables needed
   - For operation-specific auth: check all referenced security schemas have config variables
   - For combined auth: verify all selected schemas have config variables

2. **Warn about missing variables:**
   ```text
   ⚠️  Missing configuration variables for selected security schemas:
   
   Required in config.yaml:
   - upstream_api_key (for apiKeyAuth)
   
   Please add these to config.yaml before proceeding.
   ```

3. **Confirm consistency:**
   - All operations using the same security schema should use identical header configurations
   - Variable names should be consistent across all `@rest` directives

### 7.2 Applying Authentication Consistently

**All `@rest` directives must have consistent authentication:**

```graphql
# ✅ Correct - All queries use same authentication
type Query {
  getCustomer(id: ID!): Customer
    @rest(
      endpoint: "https://api.example.com/customers/$id"
      configuration: "upstream_configuration"
      headers: [{ name: "X-API-Key", value: "$upstream_api_key" }]
    )
  
  getOrder(id: ID!): Order
    @rest(
      endpoint: "https://api.example.com/orders/$id"
      configuration: "upstream_configuration"
      headers: [{ name: "X-API-Key", value: "$upstream_api_key" }]
    )
}
```

```graphql
# ❌ Incorrect - Inconsistent authentication
type Query {
  getCustomer(id: ID!): Customer
    @rest(
      endpoint: "https://api.example.com/customers/$id"
      configuration: "upstream_configuration"
      headers: [{ name: "X-API-Key", value: "$upstream_api_key" }]
    )
  
  getOrder(id: ID!): Order
    @rest(
      endpoint: "https://api.example.com/orders/$id"
      configuration: "upstream_configuration"
      forwardheaders: ["Authorization"]  # ❌ Different auth method
    )
}
```

---

## 8. Troubleshooting Guide

### 8.1 Issue: Materializers Fail with 401 Unauthorized Errors

**Symptoms:**
- Base queries work correctly
- Orchestrated queries with materializers return 401 or 500 errors
- Child resources fail to fetch

**Root Cause:**
Materializers cannot inherit authentication context from parent queries if base queries lack `configuration` and `headers` (or `forwardheaders`) parameters.

**Solution:**
1. ✅ Verify ALL base queries have `configuration: "upstream_configuration"`
2. ✅ Verify ALL base queries have `headers` array with authentication OR `forwardheaders` array
3. ✅ Materializers automatically inherit these from referenced queries
4. ❌ **Never add `configuration` to `@materializer` directive** (not supported by StepZen)

For the correct base query structure, see **Section 5.1** above.

**Example - Correct Materializer:**
```graphql
type Customer {
  id: ID!
  name: String
  # Materializer inherits configuration and headers from getCustomerAddresses
  addresses: [Address]
    @materializer(
      query: "getCustomerAddresses"
      arguments: [{ name: "customerId", field: "id" }]
    )
}
```

### 8.2 Issue: Authentication Variable Not Found

**Symptoms:**
- Error: `variable $upstream_api_key not found`

**Root Cause:**
The authentication variable referenced in `headers` doesn't exist in `config.yaml`.

**Solution:**
1. Check `config.yaml` for the `upstream_configuration` section
2. Verify the variable name matches exactly (case-sensitive)
3. Ensure the variable is defined in the correct configuration block

**Example - config.yaml:**
```yaml
configurationset:
  - configuration:
      name: upstream_configuration
      upstream_api_key: ${UPSTREAM_API_KEY}
```

**Alternative Solution (Forward Headers):**
Use `forwardheaders: ["Authorization"]` instead of config variables:
```graphql
@rest(
  endpoint: "https://api.example.com/resource"
  configuration: "upstream_configuration"
  forwardheaders: ["Authorization"]
)
```

This forwards the Authorization header from the client request to the upstream API.

**For Multiple Headers:**
```graphql
@rest(
  endpoint: "https://api.example.com/resource"
  configuration: "upstream_configuration"
  forwardheaders: ["Authorization", "X-Custom-Header"]
)
```

### 8.3 Issue: Wrong Authentication Header Format

**Symptoms:**
- 401 Unauthorized despite correct credentials
- API returns "Invalid authentication header" error

**Root Cause:**
Header format doesn't match the API's authentication requirements.

**Common Formats:**
- **API Key in header:** `X-API-Key: $upstream_api_key` (or header name from OpenAPI spec)
- **Forward headers:** `forwardheaders: ["Authorization"]` (no config variable needed)
- **Forward multiple headers:** `forwardheaders: ["Authorization", "X-Custom-Header"]`
- **API Key in custom header:** `x-Gateway-APIKey: $upstream_api_key`
- **Basic Auth:** `Authorization: Basic $upstream_basic_auth`

**Solution:**
1. Check OpenAPI security schemas for correct header name
2. Verify header format matches API requirements
3. Test with API documentation examples

### 8.4 Issue: Mixed Authentication Methods

**Symptoms:**
- Some queries work, others fail with 401
- Inconsistent authentication behavior

**Root Cause:**
Different `@rest` directives use different authentication methods.

**Solution:**
Ensure all `@rest` directives use the same authentication approach:
- All use `headers` with same variable, OR
- All use `forwardheaders` with same headers, OR
- All use operation-specific authentication consistently

### 8.5 Issue: Authentication Works in Testing but Fails in Production

**Symptoms:**
- Local testing succeeds
- Production deployment returns 401/403 errors

**Root Cause:**
Environment variables not configured in production deployment.

**Solution:**
1. Verify environment variables are set in production
2. Check `config.yaml` references correct variable names
3. Ensure variables are accessible to GraphQL runtime
4. Verify StepZen deployment includes environment variables

---

## 9. Best Practices

1. ✅ **Always use `configuration: "upstream_configuration"`** on all `@rest` directives
2. ✅ **Choose one authentication method** and apply consistently
3. ✅ **Verify config.yaml variables** before generating schema
4. ✅ **Use forwardheaders for dynamic authentication** (Bearer tokens, session tokens)
5. ✅ **Use headers for static authentication** (API keys, fixed tokens)
6. ✅ **Test authentication thoroughly** before deployment
7. ✅ **Document authentication requirements** in tool descriptions
8. ✅ **Validate materializer authentication** by testing orchestrated queries
9. ❌ **Never add `configuration` to `@materializer` directive**
10. ❌ **Never mix authentication methods** without explicit requirement

---

## 10. Integration with Other Skills

### 10.1 With graphql-api-creator

When generating GraphQL schema from OpenAPI:
1. Activate `graphql-security` skill first
2. Detect and select authentication method
3. Apply authentication to all generated `@rest` directives
4. Validate configuration before file generation

### 10.2 With graphql-field-optimization

When field mappings have been applied via `graphql-field-optimization`:
- Renamed fields do not affect authentication — `setters` operate at the response-mapping layer, after the `@rest` call completes
- If a 401 error appears after applying field mappings, the root cause is always a missing `configuration` or `headers`/`forwardheaders` on the base query, not the mapping itself — use this skill to diagnose and fix it

### 10.3 With graphql-query-orchestrator

When creating orchestrated queries with materializers:
1. Verify all base queries have `configuration` and authentication
2. Ensure orchestrated query has same authentication as parent
3. Test materializer authentication inheritance
4. Validate child queries can access protected endpoints

> **This skill is the single source of truth for materializer 401 errors.** `graphql-query-orchestrator` refers back here for authentication troubleshooting.

---

## 11. Quick Reference

### Authentication Method Selection Matrix

| Scenario | Recommended Method | Configuration Needed |
|----------|-------------------|---------------------|
| Static API key | `headers` with variable | config.yaml variable |
| Dynamic Bearer token | `forwardheaders: ["Authorization"]` | None |
| Multiple headers | `forwardheaders: ["Header1", "Header2"]` | None |
| Combined static + dynamic | `headers` + `forwardheaders` | config.yaml variable |
| Public API | None | None |
| Operation-specific | Per-operation configuration | Varies |

### Common Header Formats

```graphql
# API Key in header
headers: [{ name: "X-API-Key", value: "$upstream_api_key" }]

# Forward Authorization header
forwardheaders: ["Authorization"]

# Forward multiple headers
forwardheaders: ["Authorization", "X-Custom-Header"]

# Custom API key header
headers: [{ name: "x-Gateway-APIKey", value: "$upstream_api_key" }]

# Combined authentication
headers: [{ name: "X-API-Key", value: "$upstream_api_key" }]
forwardheaders: ["Authorization"]
```

---

## 12. Files Never to Modify

This skill provides guidance for authentication configuration but **NEVER modifies**:
- `config.yaml` - User must configure manually
- Files in `input/` directory
- Unrelated project files

This skill only provides instructions for authentication configuration in:
- `schema/*.graphql` files
- `tools/*.graphql` files
- `index.graphql` file

---

## Further Documentation

- **Developing GraphQL APIs and schemas** — https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=developing-graphql-apis-schemas
- **Using GraphQL directives** — https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=schemas-using-graphql-directives
- **Tutorial: Transform a REST API to GraphQL** — https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=apis-tutorial-transform-rest-api-graphql
- **Configuring API Connect for GraphQL (`config.yaml`)** — https://www.ibm.com/docs/en/api-connect-graphql/1.1.x?topic=essentials-configuring-api-connect

> **Note:** These URLs may require manual browser verification (automated access returns HTTP 403).
