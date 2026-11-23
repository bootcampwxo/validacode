---
name: graphql-field-optimization
description: >
  Optimizes GraphQL field names for AI agent readability while maintaining backend compatibility
  through StepZen setters mapping. Triggers on: optimize field names, rename GraphQL fields,
  improve field names for AI agents, expand abbreviations in schema, camelCase GraphQL fields,
  generate mapping file, apply field mappings, graphql-field-optimization, aml_flag kyc_status
  IBAN field names, make schema readable, rename cryptic fields.
---

# GraphQL Field Optimization Skill

## Purpose
Optimize GraphQL field names to improve readability and semantic clarity for AI agents while maintaining compatibility with backend API responses through StepZen's `setters` mapping mechanism.

## Key Concept
Transform backend field names (often using snake_case, abbreviations, or inconsistent conventions) into AI-agent-friendly GraphQL field names (camelCase, descriptive, self-explanatory) without requiring backend API changes. The mapping is handled transparently by StepZen's `@rest` directive using the `setters` parameter.

---

## Activation Precondition (MANDATORY — check before anything else)

**This skill requires `graphql-api-creator` to have run first.** It operates
on files that `graphql-api-creator` produces. If those files do not exist,
there is nothing to optimize.

### Check procedure

Before executing any step in this skill, verify the following:

1. List the contents of `api-connect/graphql/schema/`
2. Check whether at least one `{input-filename}.graphql` file exists there

**If NO `.graphql` files exist in `api-connect/graphql/schema/`:**

STOP. Do not proceed. Tell the user:

> "No GraphQL schema file found in `api-connect/graphql/schema/`. The
> `graphql-field-optimization` skill requires a schema that was generated
> by `graphql-api-creator` first. Please run `graphql-api-creator` to
> convert your OpenAPI spec into a GraphQL schema, then return here to
> optimize field names."

**If schema files DO exist:**

Identify the `{input-filename}` (the base name without `.graphql` extension)
and continue to the next section.

**Enforcement:** If no schema file exists when this skill is activated, the
very next action MUST be to display the message above and stop. Proceeding
without a schema file is a violation of this skill.

---

## 0. Sensitive Data Handling (Mandatory)

**See `graphql-api-creator` skill Section 0 for the full sensitive data handling policy.** The same rules apply here: never display literal API keys, tokens, or secrets in chat — obfuscate using the format `71e8****bc55`.

---

## When to Use This Skill

Use field optimization when:
- Backend field names use **abbreviations** (e.g., `aml_flag`, `kyc_status`, `IBAN`)
- Field names use **inconsistent conventions** (mix of snake_case, camelCase, PascalCase)
- Field names lack **semantic clarity** for AI agents (e.g., `flag` vs `isEnabled`)
- You want to improve **GraphQL schema quality** without backend changes

## When NOT to Use

Do not use field optimization when:
- Backend field names are already **clear and consistent**
- Field names follow **GraphQL best practices** (camelCase, descriptive)
- The overhead of mapping is **not justified** by readability gains
- Backend team can **update their API** to use better naming

## Related Skills

- **`graphql-api-creator`** — must run first to generate the schema; see its Section 6.5 for the technical basis of `setters`
- **`graphql-security`** — activate if authentication issues arise after applying field mappings (e.g., a renamed header field causes a 401); this is the single source of truth for auth troubleshooting
- **`graphql-query-orchestrator`** — can be combined before or after field optimisation to merge parent/child queries

---

## Naming Conventions for AI Agents

### Why camelCase? (Not snake_case)

**CRITICAL**: Always use camelCase for GraphQL field names, never snake_case.

**Reasons:**
1. **GraphQL Best Practice**: The official GraphQL specification and all major implementations use camelCase
2. **JavaScript/TypeScript Compatibility**: GraphQL is commonly used with JavaScript/TypeScript where camelCase is standard
3. **AI Agent Training**: Modern LLMs are trained on camelCase patterns and understand them better
4. **Tool Consistency**: All GraphQL editors, linters, and tools expect camelCase
5. **Industry Standard**: Every major GraphQL API (GitHub, Shopify, etc.) uses camelCase

**Comparison:**
```graphql
# ❌ Wrong - snake_case (not GraphQL-compliant)
anti_money_laundering_flag: Boolean
know_your_customer_status: String

# ✅ Correct - camelCase (GraphQL best practice)
antiMoneyLaunderingFlag: Boolean
knowYourCustomerStatus: String
```

**For Very Long Names:**
If a field name becomes excessively long (>40 characters), consider:

1. **Use meaningful abbreviations with documentation:**
```graphql
type ComplianceInfo {
  amlFlag: Boolean  # Anti-Money Laundering Flag
  kycStatus: String # Know Your Customer Status
}
```

2. **Break into nested types if semantically appropriate:**
```graphql
type ComplianceInfo {
  antiMoneyLaundering: AMLInfo
  knowYourCustomer: KYCInfo
}

type AMLInfo {
  flag: Boolean
  lastChecked: String
}
```

3. **Simplify the concept:**
```graphql
# Instead of: internationalBankAccountNumberValidationStatus
# Use: ibanValidationStatus (IBAN is widely understood)
```

**Never use snake_case** - it breaks GraphQL conventions and reduces compatibility.

### 1. Use camelCase Consistently
**Bad:**
```graphql
type ComplianceInfo {
  aml_flag: Boolean        # snake_case
  BankName: String         # PascalCase
  IBAN: String             # UPPERCASE
}
```

**Good:**
```graphql
type ComplianceInfo {
  antiMoneyLaunderingFlag: Boolean
  bankName: String
  internationalBankAccountNumber: String
}
```

### 2. Expand Abbreviations
**Bad:**
```graphql
type ComplianceInfo {
  aml_flag: Boolean        # What is AML?
  kyc_status: String       # What is KYC?
  IBAN: String             # What is IBAN?
}
```

**Good:**
```graphql
type ComplianceInfo {
  antiMoneyLaunderingFlag: Boolean
  knowYourCustomerStatus: String
  internationalBankAccountNumber: String
}
```

### 3. Use Descriptive Boolean Names
**Bad:**
```graphql
type ComplianceInfo {
  aml_flag: Boolean        # Flag of what?
  fatca_reporting: Boolean # Reporting what?
}
```

**Good:**
```graphql
type ComplianceInfo {
  antiMoneyLaunderingFlag: Boolean
  fatcaReportingRequired: Boolean
}
```

### 4. Add Context to Numeric Fields
**Bad:**
```graphql
type CreditWorthiness {
  outstanding_loans: Float  # Loans or amount?
  default_rate: Float       # Rate of what?
}
```

**Good:**
```graphql
type CreditWorthiness {
  outstandingLoansAmount: Float
  defaultRate: Float
}
```

### 5. Clarify Result vs Action Fields
**Bad:**
```graphql
type ComplianceInfo {
  sanctions_list_check: String  # Check or result?
}
```

**Good:**
```graphql
type ComplianceInfo {
  sanctionsListCheckResult: String
}
```

---

## Mapping Files

### Overview

Field mappings can be documented and managed using mapping files stored in `api-connect/graphql/mappings/`. These files serve as both documentation and input for the optimization process, allowing users to customize field names without repeated agent interactions.

### Benefits of Mapping Files

1. **Version Control**: Mappings are tracked in git alongside schema files
2. **Reusability**: Same mappings can be applied across multiple deployments
3. **Documentation**: Clear record of all field transformations
4. **User Control**: Users can edit mappings directly without agent interaction
5. **Consistency**: Ensures same mappings are applied to both queries and tools
6. **Auditability**: Changes to mappings are visible in version history

### Mapping File Location

```
api-connect/graphql/mappings/
├── {api-name}.md          # One file per API/schema
├── iwhi-account-api-2-8.md
└── another-api.md
```

**Naming Convention**: Use the same base name as the OpenAPI input file and schema file.

### Mapping File Format

Each mapping file contains:

1. **Metadata Section**
   - Generation date
   - Source OpenAPI file
   - Target schema file
   - Target tools file
   - Current status

2. **Instructions Section**
   - How to use the file
   - Status indicators explanation
   - Naming conventions reminder

3. **Type Mapping Tables**
   - One table per GraphQL type
   - Columns: Backend Field | GraphQL Field | Status | Notes
   - Status indicators: 🔄 Default, ✅ Custom, ⏭️ Skip, 🚫 Excluded

4. **Summary Section**
   - Statistics (total fields, custom mappings, etc.)
   - Optimization rationale
   - Backend API response examples

5. **Usage Instructions**
   - How to apply mappings
   - How to revert changes

6. **Version History**
   - Track changes over time

### Example Mapping Table

```markdown
## Type: ComplianceInfo

| Backend Field | GraphQL Field | Status | Notes |
|--------------|---------------|---------|-------|
| `aml_flag` | `antiMoneyLaunderingFlag` | ✅ Custom | Expanded AML abbreviation, converted snake_case to camelCase |
| `fatca_reporting` | `fatcaReportingRequired` | ✅ Custom | Added "Required" for boolean clarity |
| `kyc_status` | `knowYourCustomerStatus` | ✅ Custom | Expanded KYC abbreviation |
```

### Status Indicators

- **🔄 Default**: Using 1:1 mapping (backend name = GraphQL name, no setter needed)
- **✅ Custom**: Custom mapping applied (setter configured in schema)
- **⏭️ Skip**: Keep backend name as-is (no optimization, no setter)
- **🚫 Excluded**: Field excluded from GraphQL schema

### Creating a Mapping File

**Step 1: Generate Initial Mapping File**

When analyzing an OpenAPI specification, create a mapping file with:
- All fields from API responses
- Default 1:1 mappings (Backend Field = GraphQL Field)
- Optimization suggestions in the Notes column
- Status set to 🔄 Default for all fields

**Step 2: User Customization**

Users can edit the file to:
- Change GraphQL field names in the "GraphQL Field" column
- Update Status to ✅ Custom when modifying a field
- Set Status to ⏭️ Skip to keep a field unchanged
- Add notes explaining their decisions

**Step 3: Apply Mappings**

The skill reads the mapping file and:
- Updates type definitions with custom field names
- Adds setters for all ✅ Custom mappings
- Skips setters for 🔄 Default and ⏭️ Skip fields
- Applies changes to both schema and tools files

### Workflow with Mapping Files

#### Option A: Generate Mapping File First (Recommended)

1. **Generate mapping file** from OpenAPI specification
   - Analyze all API responses
   - Create 1:1 default mappings
   - Add optimization suggestions
   - Save to `api-connect/graphql/mappings/{api-name}.md`

2. **User reviews and edits** mapping file
   - Customize field names
   - Update status indicators
   - Add notes

3. **Apply mappings** using the skill
   - Read mapping file
   - Update schema with custom field names
   - Add setters for custom mappings
   - Update tools file if it exists

#### Option B: Interactive Proposal (Legacy)

1. **Analyze schema** and propose optimizations
2. **User approves** changes interactively
3. **Apply approved changes** to schema
4. **Generate mapping file** from applied changes (for documentation)

### Mapping File Example

See `api-connect/graphql/mappings/iwhi-account-api-2-8.md` for a complete example showing:
- Metadata and instructions
- Multiple type mapping tables
- Various status indicators
- Optimization rationale
- Backend API response examples
- Usage instructions

---

## Implementation Pattern

### Step 1: Identify Fields Needing Optimization

Analyze the GraphQL schema for:
1. **Abbreviations**: `aml`, `kyc`, `IBAN`, `API`, etc.
2. **Inconsistent casing**: Mix of snake_case, camelCase, PascalCase
3. **Unclear semantics**: `flag`, `check`, `status` without context
4. **Missing type information**: Numeric fields without units

### Step 2: Propose Optimized Names

Create a mapping table:
```
Backend Field          → GraphQL Field
-----------------        ------------------
aml_flag              → antiMoneyLaunderingFlag
kyc_status            → knowYourCustomerStatus
IBAN                  → internationalBankAccountNumber
BankName              → bankName
credit_score          → creditScore
outstanding_loans     → outstandingLoansAmount
```

### Step 3: Update Type Definitions

**Before:**
```graphql
type ComplianceInfo {
  aml_flag: Boolean
  fatca_reporting: Boolean
  kyc_status: String
  sanctions_list_check: String
}
```

**After:**
```graphql
type ComplianceInfo {
  antiMoneyLaunderingFlag: Boolean
  fatcaReportingRequired: Boolean
  knowYourCustomerStatus: String
  sanctionsListCheckResult: String
}
```

### Step 4: Add Field Mapping with Setters

**Critical Rule**: When you rename a field in the GraphQL type, you **MUST** add a `setters` block to the corresponding query's `@rest` directive to map the backend field name to the new GraphQL field name.

**Pattern:**
```graphql
type Query {
  getComplianceInfoForID(accountID: String!): ComplianceInfo
    @rest(
      endpoint: "https://api.example.com/accounts/$accountID/compliance"
      method: GET
      configuration: "upstream_configuration"
      headers: [
        { name: "x-Gateway-APIKey", value: "$upstream_api_key" }
      ]
      setters: [
        { field: "antiMoneyLaunderingFlag", path: "aml_flag" }
        { field: "fatcaReportingRequired", path: "fatca_reporting" }
        { field: "knowYourCustomerStatus", path: "kyc_status" }
        { field: "sanctionsListCheckResult", path: "sanctions_list_check" }
      ]
    )
}
```

**Setter Rules:**
1. `field`: The **new GraphQL field name** (in the type definition)
2. `path`: The **backend field name** (from the API response)
3. Add a setter for **every renamed field**
4. Setters are **case-sensitive** - match backend response exactly
5. If a field is **not renamed**, no setter is needed (default mapping applies)

---

## Complete Example

### Original Schema (Before Optimization)

```graphql
type ComplianceInfo {
  aml_flag: Boolean
  fatca_reporting: Boolean
  kyc_status: String
  sanctions_list_check: String
}

type BankDetails {
  BankName: String
  IBAN: String
}

type CreditWorthiness {
  credit_score: Int
  default_rate: Float
  outstanding_loans: Float
  risk_category: String
}

type Query {
  getComplianceInfoForID(accountID: String!): ComplianceInfo
    @rest(
      endpoint: "https://api.example.com/accounts/$accountID/compliance"
      method: GET
      configuration: "upstream_configuration"
      headers: [
        { name: "x-Gateway-APIKey", value: "$upstream_api_key" }
      ]
    )
  
  getBankAccountForID(accountID: String!): BankDetails
    @rest(
      endpoint: "https://api.example.com/accounts/$accountID/bankdetails"
      method: GET
      configuration: "upstream_configuration"
      headers: [
        { name: "x-Gateway-APIKey", value: "$upstream_api_key" }
      ]
    )
  
  getCreditWorthinessForID(accountID: String!): CreditWorthiness
    @rest(
      endpoint: "https://api.example.com/accounts/$accountID/creditworthiness"
      method: GET
      configuration: "upstream_configuration"
      headers: [
        { name: "x-Gateway-APIKey", value: "$upstream_api_key" }
      ]
    )
}
```

### Optimized Schema (After Optimization)

```graphql
type ComplianceInfo {
  antiMoneyLaunderingFlag: Boolean
  fatcaReportingRequired: Boolean
  knowYourCustomerStatus: String
  sanctionsListCheckResult: String
}

type BankDetails {
  bankName: String
  internationalBankAccountNumber: String
}

type CreditWorthiness {
  creditScore: Int
  defaultRate: Float
  outstandingLoansAmount: Float
  riskCategory: String
}

type Query {
  getComplianceInfoForID(accountID: String!): ComplianceInfo
    @rest(
      endpoint: "https://api.example.com/accounts/$accountID/compliance"
      method: GET
      configuration: "upstream_configuration"
      headers: [
        { name: "x-Gateway-APIKey", value: "$upstream_api_key" }
      ]
      setters: [
        { field: "antiMoneyLaunderingFlag", path: "aml_flag" }
        { field: "fatcaReportingRequired", path: "fatca_reporting" }
        { field: "knowYourCustomerStatus", path: "kyc_status" }
        { field: "sanctionsListCheckResult", path: "sanctions_list_check" }
      ]
    )
  
  getBankAccountForID(accountID: String!): BankDetails
    @rest(
      endpoint: "https://api.example.com/accounts/$accountID/bankdetails"
      method: GET
      configuration: "upstream_configuration"
      headers: [
        { name: "x-Gateway-APIKey", value: "$upstream_api_key" }
      ]
      setters: [
        { field: "bankName", path: "BankName" }
        { field: "internationalBankAccountNumber", path: "IBAN" }
      ]
    )
  
  getCreditWorthinessForID(accountID: String!): CreditWorthiness
    @rest(
      endpoint: "https://api.example.com/accounts/$accountID/creditworthiness"
      method: GET
      configuration: "upstream_configuration"
      headers: [
        { name: "x-Gateway-APIKey", value: "$upstream_api_key" }
      ]
      setters: [
        { field: "creditScore", path: "credit_score" }
        { field: "defaultRate", path: "default_rate" }
        { field: "outstandingLoansAmount", path: "outstanding_loans" }
        { field: "riskCategory", path: "risk_category" }
      ]
    )
}
```

---

## Workflow

### Workflow Choice: Mapping File vs Interactive

**Recommended**: Use mapping files for new APIs or when systematic optimization is needed.

**Alternative**: Use interactive proposal for quick one-off optimizations.

---

### Workflow A: Using Mapping Files (Recommended)

#### Step 1: Generate Mapping File from OpenAPI

1. **Read OpenAPI specification** (e.g., `api-connect/graphql/input/{api-name}.json`)
2. **Analyze API responses** to extract all field names
3. **Create mapping file** at `api-connect/graphql/mappings/{api-name}.md` with:
   - Metadata (source, target, date)
   - Instructions section
   - One table per response type
   - All fields with 1:1 default mappings
   - Optimization suggestions in Notes column
   - Status set to 🔄 Default

**Example Generation Output:**
```
Created mapping file: api-connect/graphql/mappings/iwhi-account-api-2-8.md

Summary:
- 4 types identified (ComplianceInfo, BankDetails, CreditWorthiness, AccountData)
- 20 fields total
- 10 optimization suggestions provided
- All fields set to 🔄 Default (1:1 mapping)

Next steps:
1. Review the mapping file
2. Edit "GraphQL Field" column to customize names
3. Update Status to ✅ Custom for modified fields
4. Run optimization skill to apply mappings
```

#### Step 2: User Reviews and Customizes Mapping File

**User Actions:**
1. Open `api-connect/graphql/mappings/{api-name}.md`
2. Review optimization suggestions in Notes column
3. Edit "GraphQL Field" column to customize field names
4. Update Status indicator:
   - Change to ✅ Custom when modifying a field
   - Change to ⏭️ Skip to keep backend name unchanged
5. Add notes explaining decisions
6. Save the file

**Example Customization:**
```markdown
## Type: ComplianceInfo

| Backend Field | GraphQL Field | Status | Notes |
|--------------|---------------|---------|-------|
| `aml_flag` | `antiMoneyLaunderingFlag` | ✅ Custom | Accepted suggestion |
| `kyc_status` | `knowYourCustomerStatus` | ✅ Custom | Accepted suggestion |
| `IBAN` | `iban` | ✅ Custom | Kept short, widely understood |
```

#### Step 3: Apply Mappings from File

1. **Read mapping file** at `api-connect/graphql/mappings/{api-name}.md`
2. **Parse mapping tables** to extract:
   - Backend field names
   - GraphQL field names
   - Status indicators
3. **Apply to schema** (`api-connect/graphql/schema/{api-name}.graphql`):
   - Update type definitions with custom field names (✅ Custom)
   - Add setters for all custom mappings
   - Skip setters for 🔄 Default and ⏭️ Skip fields
4. **Apply to tools** (`api-connect/graphql/tools/{api-name}.graphql`) if exists:
   - Update type definitions consistently
   - Add setters to tool queries
5. **Validate** schema syntax and deployment

**Example Application Output:**
```
Applied mappings from: api-connect/graphql/mappings/iwhi-account-api-2-8.md

Changes applied:
✅ ComplianceInfo: 4 custom mappings (4 setters added)
✅ BankDetails: 2 custom mappings (2 setters added)
✅ CreditWorthiness: 4 custom mappings (4 setters added)
⏭️ AccountData: 6 fields kept as-is (no setters)

Files modified:
- api-connect/graphql/schema/iwhi-account-api-2-8.graphql
- api-connect/graphql/tools/iwhi-account-api-2-8.graphql

Total: 10 custom mappings applied, 6 fields unchanged
```

#### Step 4: Update Mapping File Status

After successful application:
1. Update mapping file metadata: Status → ✅ Applied
2. Add entry to Version History section
3. Commit changes to version control

---

### Workflow B: Interactive Proposal (Legacy)

Use this workflow for quick optimizations or when mapping file doesn't exist yet.

#### Step 1: Analyze Schema
1. Read the GraphQL schema file (e.g., `api-connect/graphql/schema/{filename}.graphql`)
2. Identify all type definitions and their fields
3. Analyze field names for optimization opportunities:
   - Abbreviations
   - Inconsistent casing
   - Unclear semantics
   - Missing context

#### Step 2: Create Comprehensive Optimization Proposal

**CRITICAL**: You MUST present ALL proposed optimizations to the user BEFORE making any changes.

1. Generate a complete mapping table of ALL proposed changes across ALL types
2. Group changes by type for clarity
3. Provide rationale for each change
4. **Present the complete proposal to user for review**

**Example Proposal Format:**
```
=== GraphQL Field Optimization Proposal ===

Found optimization opportunities across 3 types:

┌─────────────────────────────────────────────────────────────────┐
│ Type: ComplianceInfo                                            │
├─────────────────────────────────────────────────────────────────┤
│ Current Field          → Proposed Field                         │
│ Rationale                                                       │
├─────────────────────────────────────────────────────────────────┤
│ aml_flag              → antiMoneyLaunderingFlag                 │
│ • Expands AML abbreviation for clarity                          │
│ • Converts snake_case to camelCase                              │
├─────────────────────────────────────────────────────────────────┤
│ fatca_reporting       → fatcaReportingRequired                  │
│ • Clarifies boolean intent (required vs enabled)                │
│ • Converts snake_case to camelCase                              │
├─────────────────────────────────────────────────────────────────┤
│ kyc_status            → knowYourCustomerStatus                  │
│ • Expands KYC abbreviation for clarity                          │
│ • Converts snake_case to camelCase                              │
├─────────────────────────────────────────────────────────────────┤
│ sanctions_list_check  → sanctionsListCheckResult                │
│ • Clarifies this is a result, not an action                     │
│ • Converts snake_case to camelCase                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Type: BankDetails                                               │
├─────────────────────────────────────────────────────────────────┤
│ Current Field          → Proposed Field                         │
│ Rationale                                                       │
├─────────────────────────────────────────────────────────────────┤
│ BankName              → bankName                                │
│ • Converts PascalCase to camelCase for consistency              │
├─────────────────────────────────────────────────────────────────┤
│ IBAN                  → internationalBankAccountNumber          │
│ • Expands IBAN abbreviation for clarity                         │
│ • Converts UPPERCASE to camelCase                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Type: CreditWorthiness                                          │
├─────────────────────────────────────────────────────────────────┤
│ Current Field          → Proposed Field                         │
│ Rationale                                                       │
├─────────────────────────────────────────────────────────────────┤
│ credit_score          → creditScore                             │
│ • Converts snake_case to camelCase                              │
├─────────────────────────────────────────────────────────────────┤
│ default_rate          → defaultRate                             │
│ • Converts snake_case to camelCase                              │
├─────────────────────────────────────────────────────────────────┤
│ outstanding_loans     → outstandingLoansAmount                  │
│ • Adds 'Amount' suffix for clarity (numeric value)              │
│ • Converts snake_case to camelCase                              │
├─────────────────────────────────────────────────────────────────┤
│ risk_category         → riskCategory                            │
│ • Converts snake_case to camelCase                              │
└─────────────────────────────────────────────────────────────────┘

Total: 11 fields across 3 types
```

### Step 3: Interactive User Confirmation

**CRITICAL**: User MUST explicitly approve changes before implementation.

Present options to user:
```
Please review the proposed optimizations above.

Options:
1. ✅ Apply all proposed changes (11 fields)
2. 📝 Apply selected changes only (specify which fields)
3. 🚫 Exclude specific fields from optimization (list exceptions)
4. 💡 Suggest alternative names for specific fields
5. ⏭️  Skip optimization entirely

Please respond with your choice and any specific instructions.
```

**Handling User Response:**

**Option 1 - Apply All:**
- Proceed with all proposed changes
- No exceptions

**Option 2 - Apply Selected:**
- User specifies which fields to optimize (e.g., "Only ComplianceInfo fields" or "Only aml_flag and IBAN")
- Apply only the specified changes
- Keep all other fields unchanged

**Option 3 - Exclude Specific:**
- User lists fields to exclude (e.g., "Keep IBAN and BankName as-is")
- Apply all changes EXCEPT the excluded fields
- Document exceptions in comments

**Option 4 - Alternative Names:**
- User suggests different names for specific fields
- Update proposal with user's suggestions
- Re-confirm before applying

**Option 5 - Skip:**
- Do not make any changes
- Document that optimization was skipped

### Step 4: Apply Approved Changes Only

**CRITICAL**: Only apply changes that were explicitly approved by the user.

1. **For each approved field change:**
   - Update type definition with new field name
   - Add corresponding setter to the query's `@rest` directive
   - Verify setter maps to correct backend field

2. **For excluded fields:**
   - Keep original field name in type definition
   - Do NOT add setter (default mapping applies)
   - Add comment documenting the exception if requested

3. **Validate all changes:**
   - Verify all renamed fields have setters
   - Ensure no setters for unchanged fields
   - Check schema syntax

**Example with Exceptions:**
```graphql
type BankDetails {
  bankName: String                          # Optimized: BankName → bankName
  IBAN: String                              # Exception: User requested to keep as-is
}

type Query {
  getBankAccountForID(accountID: String!): BankDetails
    @rest(
      endpoint: "https://api.example.com/accounts/$accountID/bankdetails"
      method: GET
      configuration: "upstream_configuration"
      headers: [
        { name: "x-Gateway-APIKey", value: "$upstream_api_key" }
      ]
      setters: [
        { field: "bankName", path: "BankName" }
        # IBAN kept as-is per user request - no setter needed
      ]
    )
}
```

### Step 5: Document and Validate

1. **Document changes:**
   - Add comments for any exceptions
   - Note rationale for excluded fields if provided
   - Update any related documentation

2. **Validate implementation:**
   - Check that all setters reference valid fields
   - Ensure backend field names in `path` are correct
   - Verify no fields are missing setters (except unchanged fields)
   - Test schema deployment

3. **Confirm with user:**
   - Report which changes were applied
   - List any exceptions that were honored
   - Confirm schema validates successfully

---

## Common Patterns

### Pattern 1: Abbreviation Expansion
```graphql
# Before
aml_flag: Boolean

# After (Type)
antiMoneyLaunderingFlag: Boolean

# After (Setter)
setters: [
  { field: "antiMoneyLaunderingFlag", path: "aml_flag" }
]
```

### Pattern 2: Case Normalization
```graphql
# Before
BankName: String

# After (Type)
bankName: String

# After (Setter)
setters: [
  { field: "bankName", path: "BankName" }
]
```

### Pattern 3: Adding Context
```graphql
# Before
outstanding_loans: Float

# After (Type)
outstandingLoansAmount: Float

# After (Setter)
setters: [
  { field: "outstandingLoansAmount", path: "outstanding_loans" }
]
```

### Pattern 4: Boolean Clarification
```graphql
# Before
fatca_reporting: Boolean

# After (Type)
fatcaReportingRequired: Boolean

# After (Setter)
setters: [
  { field: "fatcaReportingRequired", path: "fatca_reporting" }
]
```

---

## Benefits for AI Agents

1. **Improved Comprehension**: Self-explanatory field names reduce ambiguity
2. **Reduced Context Switching**: Agents don't need to look up abbreviations
3. **Better Reasoning**: Clear semantics enable better decision-making
4. **Consistent Patterns**: camelCase convention is familiar to AI models
5. **Type Safety**: Descriptive names clarify data types and units
6. **Documentation**: Field names serve as inline documentation

---

## Troubleshooting

### Issue: Field returns null after renaming

**Cause**: Missing or incorrect setter mapping

**Solution**:
1. Verify setter exists for the renamed field
2. Check that `path` matches backend field name exactly (case-sensitive)
3. Test backend API response to confirm field name

### Issue: Deployment fails with "field not found"

**Cause**: Setter references non-existent field in type definition

**Solution**:
1. Ensure `field` in setter matches GraphQL type field name exactly
2. Check for typos in field names
3. Verify type definition includes the field

### Issue: Some fields map correctly, others don't

**Cause**: Inconsistent setter configuration

**Solution**:
1. Add setters for ALL renamed fields
2. Fields not renamed don't need setters (default mapping applies)
3. Review setter list for completeness

### Issue: Backend field name unknown

**Cause**: API documentation unclear or outdated

**Solution**:
1. Test API endpoint directly to see actual response
2. Use browser DevTools or curl to inspect response
3. Consult API documentation or backend team
4. If uncertain, keep original field name until confirmed

### Issue: Mapping file and schema out of sync

**Cause**: Schema was modified without updating mapping file, or vice versa

**Solution**:
1. Compare mapping file with schema setters
2. Identify discrepancies (missing setters, wrong field names)
3. Update mapping file to match current schema state
4. Or regenerate schema from mapping file
5. Always keep both files in sync going forward

### Issue: Mapping file not found when applying optimizations

**Cause**: Mapping file doesn't exist or is in wrong location

**Solution**:
1. Check file exists at `api-connect/graphql/mappings/{api-name}.md`
2. Verify filename matches schema filename (same base name)
3. Generate mapping file if missing
4. Or use interactive workflow instead

### Issue: Status indicators not being respected

**Cause**: Skill not correctly parsing mapping file format

**Solution**:
1. Verify Status column uses exact emoji indicators: 🔄 ✅ ⏭️ 🚫
2. Check table format is correct (markdown table with pipes)
3. Ensure no extra spaces or formatting issues
4. Validate mapping file follows the documented format

---

## Implementation Checklist

### Using Mapping Files (Recommended)

**Step 1: Generate Mapping File**
1. ✅ **Read OpenAPI specification** - Analyze API responses
2. ✅ **Extract all field names** - From all response types
3. ✅ **Create mapping file** - At `api-connect/graphql/mappings/{api-name}.md`
4. ✅ **Set default 1:1 mappings** - Backend field = GraphQL field
5. ✅ **Add optimization suggestions** - In Notes column
6. ✅ **Set all Status to 🔄 Default** - Initial state

**Step 2: User Customization**
7. ✅ **User reviews mapping file** - Check suggestions
8. ✅ **User edits GraphQL Field column** - Customize field names
9. ✅ **User updates Status indicators** - ✅ Custom for changes, ⏭️ Skip to keep as-is
10. ✅ **User adds notes** - Document decisions

**Step 3: Apply Mappings**
11. ✅ **Read mapping file** - Parse all mapping tables
12. ✅ **Update type definitions** - Use custom GraphQL field names
13. ✅ **Add setters for ✅ Custom** - All custom mappings need setters
14. ✅ **Skip setters for 🔄 Default and ⏭️ Skip** - Use default mapping
15. ✅ **Apply to both schema and tools** - Keep consistent
16. ✅ **Consistent camelCase convention** - For all custom fields (NEVER snake_case)

**Step 4: Validate and Document**
17. ✅ **Schema validates** - No syntax errors
18. ✅ **Test deployment** - Verify fields map correctly
19. ✅ **Update mapping file metadata** - Set Status to ✅ Applied
20. ✅ **Add version history entry** - Document changes
21. ✅ **Commit all files together** - Mapping + schema + tools

### Using Interactive Workflow (Legacy)

**Before Making Changes:**
1. ✅ **Analyze complete schema** - Identify all optimization opportunities
2. ✅ **Create comprehensive proposal** - Include ALL proposed changes with rationale
3. ✅ **Present to user for approval** - Show complete proposal before any modifications
4. ✅ **Wait for explicit confirmation** - Never proceed without user approval
5. ✅ **Clarify exceptions** - Ask user if any fields should remain unchanged

**When Applying Approved Changes:**
6. ✅ **Only modify approved fields** - Respect user's selections and exceptions
7. ✅ **All renamed fields have setters** - No exceptions for approved changes
8. ✅ **Setter `field` matches GraphQL type** - Exact match required
9. ✅ **Setter `path` matches backend response** - Case-sensitive
10. ✅ **Consistent camelCase convention** - For all approved changes (NEVER snake_case)
11. ✅ **No setters for unchanged fields** - Fields kept as-is use default mapping
12. ✅ **Document exceptions** - Add comments for fields kept unchanged per user request
13. ✅ **Handle long names appropriately** - Use abbreviations with comments or nested types

**After Making Changes:**
14. ✅ **Schema validates** - No syntax errors
15. ✅ **Test deployment** - Verify fields map correctly
16. ✅ **Confirm with user** - Report which changes were applied and which were excluded
17. ✅ **Generate mapping file** - Document applied optimizations for future reference

---

## Files Modified

### Schema and Tools Files

- `api-connect/graphql/schema/{filename}.graphql` - Update type definitions and add setters to queries
- `api-connect/graphql/tools/{filename}.graphql` - Update type definitions and add setters to tools (if exists)

**Example:** For file `iwhi-account-api-2-8.graphql`:
- Modify: `api-connect/graphql/schema/iwhi-account-api-2-8.graphql`
- Modify: `api-connect/graphql/tools/iwhi-account-api-2-8.graphql`

### Mapping Files

- `api-connect/graphql/mappings/{filename}.md` - Create or update field mapping documentation

**Example:** For API `iwhi-account-api-2-8`:
- Create/Update: `api-connect/graphql/mappings/iwhi-account-api-2-8.md`

### File Relationships

```
input/iwhi-account-api-2-8.json (OpenAPI)
    ↓
    ↓ (analyzed to generate)
    ↓
mappings/iwhi-account-api-2-8.md (Field Mappings)
    ↓
    ↓ (applied to)
    ↓
schema/iwhi-account-api-2-8.graphql (Base Queries)
    ↓
    ↓ (extended by)
    ↓
tools/iwhi-account-api-2-8.graphql (Tool Definitions)
```

---

## Mapping File Maintenance

### When to Update Mapping Files

Update the mapping file when:
1. **Backend API changes** - New fields added or renamed
2. **Optimization improvements** - Better field names identified
3. **User feedback** - Field names need adjustment
4. **Schema regeneration** - After updating from new OpenAPI spec

### Keeping Mappings in Sync

**Best Practice**: Always update the mapping file BEFORE modifying schema files.

**Workflow:**
1. Edit mapping file with desired changes
2. Update Status indicators
3. Apply mappings using the skill
4. Verify changes in schema/tools files
5. Update mapping file metadata (status, version history)
6. Commit all files together

### Mapping File as Source of Truth

The mapping file should be treated as the **authoritative source** for field name decisions:
- Schema files are **generated** from mappings
- Tools files are **generated** from mappings
- Mapping file is **manually curated** by users

**Do NOT:**
- Manually edit schema/tools files without updating mapping file
- Apply optimizations without documenting in mapping file
- Skip mapping file updates when regenerating schemas

**DO:**
- Always update mapping file first
- Document rationale in Notes column
- Keep version history updated
- Review mapping file during code reviews

### Migrating Existing Schemas to Mapping Files

If you have an existing optimized schema without a mapping file:

1. **Extract current mappings** from schema:
   - Identify all types with setters
   - Document backend field → GraphQL field mappings
   - Note which fields have no setters (unchanged)

2. **Create mapping file**:
   - Use current GraphQL field names
   - Set Status to ✅ Custom for fields with setters
   - Set Status to ⏭️ Skip for unchanged fields
   - Add notes explaining optimization decisions

3. **Validate consistency**:
   - Verify mapping file matches schema
   - Check that all setters are documented
   - Ensure no mappings are missing

4. **Update metadata**:
   - Set Status to ✅ Applied
   - Add creation entry to Version History
   - Note this was migrated from existing schema

**Example Migration:**

```markdown
# Field Mappings: IWHI Account API v2.8

**Status**: ✅ Applied (migrated from existing schema)

## Version History

| Date | Changes | Author |
|------|---------|--------|
| 2026-06-15 | Migrated from existing optimized schema | System |
```

---

## Best Practices

### General Optimization Practices

1. **Always use camelCase** - Never use snake_case for GraphQL fields (GraphQL best practice)
2. **Start with high-impact changes** - Focus on abbreviations and unclear names first
3. **Preserve backend compatibility** - Never assume backend can change
4. **Use consistent patterns** - Apply same conventions across all approved changes
5. **Handle long names wisely** - Use abbreviations with comments or nested types for very long names
6. **Consider domain context** - Some abbreviations may be standard in the domain
7. **Validate thoroughly** - Test that all mappings work correctly

### Mapping File Best Practices

8. **Use mapping files for new APIs** - Generate mapping file from OpenAPI before creating schema
9. **Mapping file is source of truth** - Always update mapping file before modifying schema
10. **Document all decisions** - Use Notes column to explain optimization rationale
11. **Keep mappings in sync** - Update mapping file when backend API changes
12. **Version control mappings** - Commit mapping files with schema changes
13. **Review mappings in PRs** - Include mapping file changes in code reviews
14. **Migrate existing schemas** - Create mapping files for legacy optimized schemas

### Interactive Workflow Best Practices

15. **Present complete proposal first** - Show ALL proposed changes before making any modifications
16. **Get explicit user approval** - Never apply changes without user confirmation
17. **Honor user exceptions** - Respect fields the user wants to keep unchanged
18. **Document exceptions clearly** - Add comments for fields kept as-is per user request
19. **Confirm completion** - Report which changes were applied and which were excluded

---

## Common Abbreviations to Expand

| Abbreviation | Expansion |
|--------------|-----------|
| `aml` | `antiMoneyLaundering` |
| `kyc` | `knowYourCustomer` |
| `IBAN` | `internationalBankAccountNumber` |
| `API` | `applicationProgrammingInterface` |
| `URL` | `uniformResourceLocator` |
| `UUID` | `universallyUniqueIdentifier` |
| `SSN` | `socialSecurityNumber` |
| `DOB` | `dateOfBirth` |
| `addr` | `address` |
| `qty` | `quantity` |
| `amt` | `amount` |
| `num` | `number` |
| `desc` | `description` |
| `ref` | `reference` |
| `msg` | `message` |

**Exception**: Keep `id`, `url`, `api` when they are universally understood and short.

---

## Notes

- Field optimization is **cosmetic** - it doesn't change API behavior
- Backend APIs remain **unchanged** - all mapping is in GraphQL layer
- Optimized names improve **AI agent comprehension** significantly
- Use this skill **after** initial schema generation
- Can be combined with **query orchestration** for maximum benefit
- Always **test deployment** to ensure mappings work correctly
- Consider **domain-specific conventions** when choosing names
- **Mapping files are recommended** - They provide documentation, version control, and reusability
- Mapping files apply to **both queries and tools** - Ensures consistency across schema and tools
- Keep mapping files **in sync** with schema changes - Update mapping file before modifying schema
- Mapping files are **source of truth** - Schema and tools are generated from mappings
- **Location**: Mapping files are stored in `api-connect/graphql/mappings/` (not in `tools/mappings/`)

---

## Further Documentation

- **Developing GraphQL APIs and schemas** — https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=developing-graphql-apis-schemas
- **Using GraphQL directives** — https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=schemas-using-graphql-directives
- **Tutorial: Transform a REST API to GraphQL** — https://www.ibm.com/docs/en/api-connect-graphql/saas?topic=apis-tutorial-transform-rest-api-graphql

> **Note:** These URLs may require manual browser verification (automated access returns HTTP 403).
