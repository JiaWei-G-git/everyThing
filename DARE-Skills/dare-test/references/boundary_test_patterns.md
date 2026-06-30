# Boundary Test Patterns Reference

Common boundary condition test patterns organized by data type, applicable across programming languages and frameworks. Use this reference to systematically generate boundary test cases during adversarial review.

---

## Universal Boundary Checklist

For every input parameter of every function under test, verify coverage of:

1. **Null/None/Undefined** — the absent value
2. **Empty** — zero-length string, empty collection, zero numeric
3. **Minimum valid** — the smallest acceptable value
4. **Minimum - 1** — just below the minimum (should fail/reject)
5. **Minimum + 1** — just above the minimum
6. **Typical/Normal** — a representative valid value
7. **Maximum - 1** — just below the maximum
8. **Maximum** — the largest acceptable value
9. **Maximum + 1** — just above the maximum (should fail/reject)
10. **Type mismatch** — wrong type entirely
11. **Format invalid** — structurally wrong (malformed JSON, invalid date string)
12. **Encoding edge** — Unicode extremes, NULL bytes, overlong sequences

---

## By Data Type

### Numeric Types (int, float, decimal)

| Pattern | Value | Expected Behavior | Risk if Untested |
|---------|-------|-------------------|------------------|
| Zero | 0 | Verify handling of additive identity | Division by zero, falsey logic errors |
| Negative | -1, -MAX | Verify negative number handling | Underflow, sign errors, unsigned cast issues |
| Positive min | 1 | Smallest positive value | Off-by-one in loops, boundary logic |
| Positive max | MAX_INT, MAX_LONG | Largest representable value | Overflow, truncation |
| Overflow | MAX + 1 | Wraparound or exception behavior | Silent overflow corruption |
| Underflow | MIN - 1 | Wraparound or exception behavior | Silent underflow corruption |
| Float epsilon | 0.0000001 | Near-zero floating point | Precision loss, comparison failures |
| NaN | NaN | Propagation or rejection | Poisoned computations |
| Infinity | +Inf, -Inf | Handling of infinite values | Hangs, unbounded loops |
| Decimal precision | 1.999, 2.001 | Rounding boundary | Financial calculation errors |

**Common exploit**: Integer overflow in size/length calculations leading to buffer under-allocation.

### String Types

| Pattern | Example | Expected Behavior | Risk if Untested |
|---------|---------|-------------------|------------------|
| Empty string | `""` | Rejection or acceptance | Empty string passed to DB as NULL, division by len |
| Single char | `"a"` | Minimum non-empty | Off-by-one, loop doesn't execute |
| Whitespace only | `" "`, `"\\t\\n"` | Trim or reject | Invisible data corruption |
| Max length - 1 | 255 chars | Boundary below limit | Fencepost errors |
| Max length | 256 chars | At limit | Truncation at boundary |
| Max length + 1 | 257 chars | Rejection | Silent truncation, injection via overflow |
| Unicode BMP | `"中文", "émoiji"` | Basic multilingual plane | Encoding errors (UTF-8 2-3 byte) |
| Unicode astral | `"𐍈", "🚀"` | Beyond BMP (> U+FFFF) | Surrogate pair bugs, truncation mid-character |
| RTL override | `"‮evil‭"` | Right-to-left handling | UI spoofing, path traversal |
| Null byte | `"hello\\x00world"` | Null-terminated handling | C-string truncation, path injection |
| SQL injection | `"' OR '1'='1"` | Parameterization | Data breach, unauthorized access |
| Command injection | `"; rm -rf /"` | Sanitization | Remote code execution |
| Path traversal | `"../../../etc/passwd"` | Path normalization | Unauthorized file access |
| XML/JSON in string | `"<script>alert(1)</script>"` | Escaping | XSS, XXE attacks |
| Newline injection | `"line1\\nline2"` | Line break handling | Log injection, header injection |
| Zero-width chars | `"test​ing"` (U+200B) | Invisible character handling | Identifier spoofing |
| Emoji variation | `"❤️"` (with U+FE0F) | Combined sequence handling | Length calculation errors |

**Common exploit**: String length in code points vs. bytes confusion causing buffer overruns.

### Collection / Array / List Types

| Pattern | Example | Expected Behavior | Risk if Untested |
|---------|---------|-------------------|------------------|
| Null reference | null | NullPointer handling | Crash |
| Empty | [] | Empty collection logic | Index out of bounds, division by size |
| Single element | [1] | Minimum non-empty | Loop executes once, special singleton logic |
| Typical | [1, 2, 3, 4, 5] | Normal operation | Baseline |
| Max size boundary | at capacity | Full collection handling | Rejection or resize logic |
| Max size + 1 | over capacity | Overflow handling | Data loss, exception |
| All identical | [5, 5, 5, 5] | Deduplication logic | Unexpected equality branches |
| All nulls | [null, null, null] | Null element handling | Cascade null dereference |
| Nested empty | [[]] | Nested collection | Recursion depth, flatten logic |
| Deeply nested | [[[[[1]]]]] | Recursion limit | Stack overflow |
| Cyclic reference | a.push(a) | Cycle detection | Infinite loop, stack overflow |
| Large elements | ["x" * 1MB] * 100 | Memory pressure | OOM, performance degradation |
| Unsorted when sorted expected | [3, 1, 2] | Sort or reject | Binary search fails |
| Duplicate keys | [{"k":1}, {"k":1}] | Key collision handling | Map overwrite data loss |

**Common exploit**: Deserialization of untrusted collections causing memory exhaustion.

### Object / Struct / Map Types

| Pattern | Example | Expected Behavior | Risk if Untested |
|---------|---------|-------------------|------------------|
| Null object | null | Null handling | NullPointerException |
| Empty object | {} | Empty object logic | Missing field access |
| Missing required field | {"optional": 1} | Validation failure | Null in required field propagates |
| Extra unknown field | {"extra": 1, "known": 2} | Ignore or reject | Data leak, unexpected behavior |
| Nested null | {"a": {"b": null}} | Deep null handling | Nested null dereference |
| Circular reference | a.self = a | Serialization handling | Stack overflow in toString/JSON |
| All fields at boundary | every field = max value | Combined boundary stress | Overflow from combined effects |
| Type confusion | numeric as string | Strict typing enforcement | Implicit conversion bugs |

### Boolean Types

| Pattern | Value | Expected Behavior | Risk if Untested |
|---------|-------|-------------------|------------------|
| True | true | True branch | Baseline |
| False | false | False branch | Else branch never tested |
| Null (nullable bool) | null | Third state handling | Null treated as false |
| Truthy/falsy coercion | 1, 0, "", "false" | Strict boolean check | Logic error from coercion |

**Note**: Booleans often appear as flags in combination. Test all 2^n combinations of boolean flags.

### Date / Time Types

| Pattern | Example | Expected Behavior | Risk if Untested |
|---------|---------|-------------------|------------------|
| Epoch | 1970-01-01 00:00:00 UTC | Unix epoch handling | Time calculation errors |
| Null/None | null | Unset date handling | Null in time arithmetic |
| Invalid format | "not-a-date" | Parse error handling | Unhandled ParseException |
| Timezone edge | 23:59 UTC crossing date | TZ conversion | Off-by-day in conversion |
| DST transition | spring-forward gap | Ambiguous time handling | Non-existent hour |
| DST fallback | fall-back overlap | Repeated hour handling | Duplicate timestamp confusion |
| Leap year | Feb 29, 2024 | Leap year acceptance | Invalid date rejection |
| Non-leap century | Feb 29, 1900 | Century leap year rule | Incorrect leap year logic |
| Leap second | 23:59:60 UTC | Leap second handling | Time sequence violation |
| Max date | 9999-12-31 | Maximum representable | Overflow to invalid |
| Past date | 1800-01-01 | Historical date | Calendar system differences |
| Future date | 2050-01-01 | Future date logic | Expiry, scheduling bugs |
| Same millisecond | t1 == t2 | Equality handling | Race in timestamp comparison |

**Common exploit**: Time comparison without timezone awareness causing authorization bypass.

### Enum / Enumeration Types

| Pattern | Example | Expected Behavior | Risk if Untested |
|---------|---------|-------------------|------------------|
| Each valid value | All enum members | Coverage of all branches | Missing case in switch |
| Null | null | Null enum handling | Default branch catches all |
| Unknown value | value = 999 | Unknown handling | Enum deserialization failure |
| Case sensitivity | "active" vs "ACTIVE" | Case normalization | String-enum mismatch |
| String coercion | from string value | Parsing robustness | Invalid string crash |
| Numeric coercion | from integer | Index-based enum | Out-of-range index |
| Deprecated value | deprecated member | Backward compatibility | Removed enum member handling |

---

## Composite Boundary Patterns

### Multi-Parameter Boundary Combinations

When multiple parameters interact, test their combined boundaries:

```
// Example: paginated query(page, page_size)
(page=0, page_size=0)      → both at minimum
(page=0, page_size=MAX)    → min + max combo
(page=MAX, page_size=0)    → max + min combo
(page=MAX, page_size=MAX)  → both at maximum (overflow risk)
(page=-1, page_size=10)    → invalid + valid
(page=1, page_size=-1)     → valid + invalid
```

**Combination strategy**: Use pairwise testing to limit explosion while covering interactions.

### State Machine Boundary Testing

For objects with internal state:

| Transition | Pattern |
|------------|---------|
| Valid transition | Every valid state → state edge |
| Invalid transition | Action in wrong state | must reject/error |
| Self-transition | Stay in same state | idempotent |
| Entry/exit hooks | Verify side effects on transition |
| Final state | No further transitions allowed |
| Reset | Return to initial state from any state |

### Resource Limit Boundaries

| Resource | Test Point |
|----------|------------|
| Memory | Near heap limit, OOM handling |
| Disk | Full disk, quota exceeded |
| File descriptors | At ulimit, EMFILE handling |
| Connections | Pool exhaustion, wait queue |
| Threads | Thread pool saturation |
| CPU | 100% utilization, scheduling |
| Network bandwidth | Throttled, zero bandwidth |
| Rate limit | At limit, limit + 1, backoff |

---

## Language-Specific Edge Cases

### Java / JVM
- `Integer.MIN_VALUE` abs still negative
- Autoboxing null: `Integer i = null; int x = i;` → NPE
- Generic type erasure: `List<String>` vs `List<Integer>` at runtime
- `equals()` vs `==` on strings
- `BigDecimal`: 1.0 != 1.00 (scale matters)

### Python
- `None` in boolean context is falsy (but not False)
- Mutable default arguments: `def f(x=[])`
- `is` vs `==` (identity vs equality)
- Integer division: `5 / 2 = 2.5` (Py3) vs `2` (Py2)
- `NaN != NaN` (always True)

### JavaScript / TypeScript
- `typeof null === 'object'`
- `[] + {}` vs `{} + []` (different results)
- `0.1 + 0.2 !== 0.3`
- `undefined` vs `null` vs `not defined`
- Falsy values: `0, "", null, undefined, NaN, false`

### Go
- `nil` interface vs `nil` pointer (different)
- Slice append capacity doubling behavior
- Map read from nil map (panics on write, ok on read)
- Goroutine leak detection
- String is immutable byte slice (not rune slice)

### SQL
- NULL in aggregates (COUNT(*) vs COUNT(col))
- Empty string vs NULL in VARCHAR
- Trailing spaces in CHAR (padded, compared equal)
- Parameter type coercion in prepared statements
- Lock escalation under concurrent access

---

## Adversarial Boundary Checklist (Quick Reference)

During review, for each parameter ask:

- [ ] What is the smallest possible value? Is it tested?
- [ ] What is the largest possible value? Is it tested?
- [ ] What if it's null/nil/None? Is it tested?
- [ ] What if it's empty? Is it tested?
- [ ] What if it's the wrong type? Is it tested?
- [ ] What if it's malformed? Is it tested?
- [ ] What if two parameters are both at extremes? Is it tested?
- [ ] What if it contains special characters? Is it tested?
- [ ] What if it's at maximum length? Max + 1? Is it tested?
- [ ] What if it has circular/self-referential structure? Is it tested?
- [ ] Does the code assume it's non-null after a check that doesn't guarantee it?
- [ ] Does the code use `.length`, `.size()`, or `len()` without checking existence first?

Flag any "no" answer as a coverage gap.
