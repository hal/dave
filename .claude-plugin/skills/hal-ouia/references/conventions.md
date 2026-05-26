# OUIA ID Conventions

## Naming

All OUIA IDs in halOP follow these conventions:

- **Java constant name:** `SCREAMING_SNAKE_CASE` (e.g., `RUNTIME_SERVER_STATUS`)
- **OUIA ID value:** `"hal-op-kebab-case"` (e.g., `"hal-op-runtime-server-status"`)
- **Prefix:** always `hal-op-`
- **Structure:** `hal-op-<feature>-<element>[-<purpose>]`

## Common Suffixes

Use existing suffix constants from `OuiaIds.java` when applicable:

| Suffix     | Constant   | Used for              |
| ---------- | ---------- | --------------------- |
| `-add`     | `_ADD`     | Add/create buttons    |
| `-delete`  | `_DELETE`  | Delete/remove buttons |
| `-save`    | `_SAVE`    | Save buttons          |
| `-refresh` | `_REFRESH` | Refresh buttons       |
| `-modal`   | `_MODAL`   | Modal dialogs         |
| `-form`    | `_FORM`    | Forms                 |
| `-table`   | `_TABLE`   | Data tables           |
| `-tab`     | `_TAB`     | Tab elements          |

## Applying to Elements

In halOP Java source, OUIA IDs are applied by chaining `.ouiaId(OuiaIds.CONSTANT)` on PatternFly element builders:

```java
// Button example
button("Save").primary().ouiaId(OuiaIds.CONFIGURATION_SAVE_BTN)

// Card example
card().ouiaId(OuiaIds.RUNTIME_STATUS_CARD)
  .addHeader(cardHeader().addTitle(...))
  .addBody(...)
```

## Section Organization in OuiaIds.java

Constants are grouped by feature with comment headers:

```java
// ------------------------------------------------------ configuration
public static final String CONFIGURATION_PAGE = "hal-op-configuration-page";
public static final String CONFIGURATION_SAVE_BTN = "hal-op-configuration-save-btn";

// ------------------------------------------------------ runtime
public static final String RUNTIME_PAGE = "hal-op-runtime-page";
```

Insert new constants in **alphabetical order** within the appropriate section. Create a new section if the feature doesn't have one yet.
