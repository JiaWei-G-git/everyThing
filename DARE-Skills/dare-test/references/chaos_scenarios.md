# Chaos Engineering Scenario Library

A comprehensive catalog of fault injection scenarios for adversarial testing. Use these patterns to design fault simulation tests that validate system resilience under real-world failure conditions.

---

## Scenario Catalog Organization

Scenarios are organized by:
1. **Dependency type** — What fails
2. **Fault type** — How it fails
3. **Impact level** — Blast radius
4. **Detection difficulty** — How hard to catch without dedicated tests

---

## 1. Database Failure Scenarios

### 1.1 Connection Failures

| Scenario | Fault | Expected Behavior | Detection |
|----------|-------|-------------------|-----------|
| Connection refused | DB service down on startup | Graceful startup failure or degraded mode | Startup hangs, crash loop |
| Connection timeout | DB firewall blocks, no SYN-ACK | Timeout after configured threshold | Indefinite hang |
| Connection pool exhaustion | All connections in use, new request arrives | Queue or fail fast with clear error | Leaked connections accumulate |
| Connection intermittent | 50% of connections fail randomly | Retry succeeds on alternate connection | Flaky tests, Heisenbugs |
| SSL/TLS handshake failure | Certificate expired/invalid | Clear TLS error, no plaintext fallback | Silent connection to wrong DB |
| Authentication failure | Wrong password, user locked | Fail fast with auth error | Credential rotation mishandling |

### 1.2 Query Execution Failures

| Scenario | Fault | Expected Behavior | Detection |
|----------|-------|-------------------|-----------|
| Query timeout | Slow query exceeds timeout | Cancel query, return timeout error | Connection held indefinitely |
| Deadlock | Circular lock dependency | Deadlock detected, victim chosen | Both transactions hang forever |
| Lock timeout | Row lock held too long | Fail with lock timeout | Indefinite wait |
| Constraint violation | Unique constraint breached | Clear error, no partial write | Silent data corruption |
| Foreign key violation | Referenced row missing | Clear error, transaction rolled back | Orphan records created |
| Serialization failure | MVCC conflict in SERIALIZABLE | Retry or abort | Lost update anomaly |
| Too many connections | DB at max_connections | Reject with clear error | Cascade failure to other services |

### 1.3 Data Integrity Failures

| Scenario | Fault | Expected Behavior | Detection |
|----------|-------|-------------------|-----------|
| Corrupted row | Bit flip in storage | Detection on read, error returned | Silent data corruption |
| Replication lag | Read replica stale | Stale read detection or read from primary | Inconsistent user experience |
| Replication conflict | Multi-master write conflict | Conflict resolution or error | Last-write-wins data loss |
| Partial write | Write fails mid-transaction | Full rollback, no partial state | Half-updated record |
| Index corruption | Index out of sync with table | Query returns wrong results | Silent wrong answers |

### 1.4 Recovery Scenarios

| Scenario | Test Point |
|----------|------------|
| DB failover | Primary → replica promotion, connections migrate |
| Backup restoration | Point-in-time recovery validation |
| Transaction log full | Behavior when WAL/disk full |
| Long-running transaction | Behavior under extended lock hold |

---

## 2. HTTP / API Dependency Failures

### 2.1 Network-Level Failures

| Scenario | Fault | Expected Behavior |
|----------|-------|-------------------|
| DNS resolution failure | Hostname unresolvable | Fail fast, don't hang on DNS |
| DNS timeout | DNS server not responding | Timeout with fallback if configured |
| Connection timeout | No TCP handshake completion | Timeout after connect-timeout |
| Read timeout | Connection established, no response | Timeout after read-timeout |
| Connection reset | RST packet from server | Retry or fail with clear error |
| TLS certificate expired | cert.notAfter < now | Reject connection, no bypass |
| TLS wrong hostname | cert.CN != hostname | Reject connection |
| TLS protocol downgrade | Server only supports SSLv3 | Reject insecure connection |
| Network partition | Split-brain, half-duplex | Detect unreachability, don't wait forever |

### 2.2 HTTP-Level Failures

| Scenario | Status Code | Expected Behavior |
|----------|-------------|-------------------|
| Server error | 500 Internal Server Error | Retry with backoff, circuit breaker |
| Bad gateway | 502 Bad Gateway | Retry, mark upstream unhealthy |
| Service unavailable | 503 Service Unavailable | Backoff, queue, or fail fast |
| Gateway timeout | 504 Gateway Timeout | Distinguish from local timeout |
| Rate limited | 429 Too Many Requests | Exponential backoff, respect Retry-After |
| Request timeout | 408 Request Timeout | Retry idempotent requests only |
| Payload too large | 413 Payload Too Large | Chunk or reject before sending |
| Gone | 410 Gone | Permanent failure, don't retry |

### 2.3 Response Corruption

| Scenario | Fault | Expected Behavior |
|----------|-------|-------------------|
| Malformed JSON | Invalid JSON in response body | Parse error handling, don't crash |
| Wrong content-type | `text/plain` instead of `application/json` | Reject or attempt parse |
| Encoding mismatch | UTF-8 declared but Latin-1 content | Encoding error handling |
| Truncated response | Connection drops mid-body | Detect incomplete payload |
| Empty response body | 200 OK with empty body | Handle empty body gracefully |
| Gigantic response | 100MB response to simple query | Streaming parse, size limit |
| Circular reference | JSON with `$ref` loop | Depth limit, don't stack overflow |
| Type mismatch | Expected int, got string | Schema validation failure |
| Missing required field | Required key absent | Schema validation, reject response |
| Wrong data format | Date as Unix epoch vs ISO string | Format negotiation or error |

### 2.4 Behavioral Failures

| Scenario | Fault | Expected Behavior |
|----------|-------|-------------------|
| Infinite redirect | 301 loop between A↔B | Redirect limit, break loop |
| Slow response | 10s+ response to normally fast endpoint | Timeout, don't hold resources |
| Hanging connection | Connection open, zero bytes | Read timeout fires |
| Partial response | Headers sent, body never arrives | Read timeout, resource cleanup |
| Duplicate callback | Webhook called twice | Idempotency key handles duplicate |
| Callback out of order | Webhook 2 arrives before webhook 1 | Sequence number or state machine |
| Callback replay | Old webhook re-sent | Timestamp validation, deduplication |

---

## 3. Cache Failure Scenarios

### 3.1 Cache Unavailability

| Scenario | Fault | Expected Behavior |
|----------|-------|-------------------|
| Cache startup failure | Redis won't start | Degrade to direct DB queries |
| Cache connection timeout | Network issue to cache | Fallback to origin, mark cache down |
| Cache total failure | Cache cluster unreachable | Pass-through to origin, no crash |
| Cache partial failure | Some shards unavailable | Graceful degradation, reduced hit rate |

### 3.2 Cache Data Issues

| Scenario | Fault | Expected Behavior |
|----------|-------|-------------------|
| Cache stampede | High miss rate under load | Request coalescing, mutex lock |
| Hot key eviction | Frequently accessed key evicted | Re-fetch from origin |
| Cold start | Empty cache after restart | Gradual warmup, no thundering herd |
| Cache poisoning | Bad data written to cache | TTL expiration, invalidation |
| Stale cache | Data updated but cache not invalidated | Max stale time, version check |
| Negative caching | Failed lookups cached | Short TTL for negative results |
| Cache size limit | Large object exceeds max item size | Reject or chunk, don't crash |

### 3.3 Cache Consistency

| Scenario | Test Point |
|----------|------------|
| Write-through failure | DB write succeeds, cache write fails |
| Write-behind failure | Cache write succeeds, async DB write fails |
| Read-after-write | Write clears cache, subsequent read sees new value |
| Concurrent invalidation | Two writers invalidate simultaneously |
| TTL race | Key expires mid-transaction |

---

## 4. Message Queue Failures

| Scenario | Fault | Expected Behavior |
|----------|-------|-------------------|
| Broker unavailable | Kafka/RabbitMQ down | Queue messages locally or fail fast |
| Producer timeout | Can't send within timeout | Buffer, drop, or fail based on config |
| Consumer lag | Consumer slower than producer | Backpressure, scale out, or drop policy |
| Duplicate delivery | At-least-once delivery duplicate | Idempotent consumer |
| Message loss | At-most-once loses message | Acceptable loss or retry at source |
| Poison message | Unprocessable message | Dead letter queue, don't infinite retry |
| Message ordering | Out-of-order delivery | Sequence numbers or tolerate disorder |
| Partition rebalance | Consumer group rebalancing | Graceful partition handoff |
| Schema evolution | Consumer expects v1, gets v2 | Forward/backward compatibility |
| Queue full | Max queue depth reached | Reject new messages, apply backpressure |

---

## 5. File System Failures

| Scenario | Fault | Expected Behavior |
|----------|-------|-------------------|
| Disk full | No space left on device | Graceful handling, alert, don't crash |
| Permission denied | Insufficient file permissions | Clear error, don't expose path |
| File not found | Expected file missing | Handle absence, recreate if possible |
| File locked | Another process holds lock | Wait with timeout or fail fast |
| Corrupted file | Truncated or garbled file | Validate checksum, reject corrupted |
| Concurrent write | Two processes write same file | Atomic rename, file locking |
| Path traversal | `../../../etc/passwd` input | Sanitize path, restrict to allowed dirs |
| Symlink attack | Sensitive file symlinked | Validate realpath, reject symlinks |
| Temporary file leak | Temp files not cleaned up | Temp file lifecycle test |
| Large file | Multi-GB file processing | Streaming, don't load entire file |
| Too many open files | ulimit reached | Close files promptly, connection pooling |

---

## 6. Concurrency / Timing Failures

| Scenario | Fault | Expected Behavior |
|----------|-------|-------------------|
| Race condition | Two threads modify shared state | Atomic operations, locking, CAS |
| Deadlock | Circular dependency on locks | Timeout, lock ordering, detection |
| Livelock | Threads keep retrying without progress | Backoff, randomization |
| Starvation | Low-priority thread never gets resource | Fairness policy, priority aging |
| Thread pool exhaustion | All threads blocked | Rejection policy, don't create threads unbounded |
| Timer drift | System clock changes | Monotonic clock for intervals |
| Clock jump | NTP adjusts clock backward/forward | Handle time going backward |
| Scheduled task overlap | Previous run hasn't finished when next starts | Skip, delay, or run concurrently |
| Context cancellation | Parent cancels mid-operation | Clean shutdown, resource release |
| Goroutine leak | Goroutines spawned without exit path | Monitor goroutine count |

---

## 7. Resource Exhaustion Scenarios

| Resource | Exhaustion Pattern | Expected Behavior |
|----------|-------------------|-------------------|
| CPU | 100% utilization | Degrade gracefully, shed load |
| Memory | Near OOM | Limit buffers, refuse large allocations |
| Disk I/O | Saturated disk | Async I/O, batch writes |
| Network bandwidth | Pipe full | Backpressure, reduce payload |
| File descriptors | EMFILE / ENFILE | Connection pooling, early close |
| Thread count | OS thread limit | Thread pool with max size |
| Heap objects | GC thrashing | Object pooling, reduce allocations |
| Database connections | Pool exhausted | Queue or fail fast |
| Rate limit quota | API limit reached | Throttle, respect Retry-After |

---

## 8. Security / Adversarial Faults

| Scenario | Fault | Expected Behavior |
|----------|-------|-------------------|
| Replay attack | Old valid request re-sent | Nonce/timestamp validation |
| Man-in-the-middle | Certificate pinning failure | TLS validation failure |
| Timing attack | Side-channel information leak | Constant-time comparison |
| Resource exhaustion attack | Tiny request causes huge work | Input validation, limits |
| Reflection attack | Request bounced to amplify traffic | Source validation, rate limiting |
| Privilege escalation | Lower-priv user accesses admin endpoint | RBAC enforcement |
| Session fixation | Attacker forces session ID | Regenerate ID on auth |
| CSRF | Unauthorized cross-origin action | Token validation, SameSite cookies |
| JWT without signature | `alg: none` attack | Reject tokens with none algorithm |
| JWT algorithm confusion | `alg: HS256` with RSA key | Strict algorithm whitelist |

---

## 9. Recovery and Graceful Degradation Patterns

### 9.1 Circuit Breaker Patterns

| State | Test Scenario |
|-------|---------------|
| CLOSED (normal) | Verify requests pass through |
| OPEN (failing) | After N failures, fast-fail without calling dependency |
| HALF-OPEN | After timeout, allow probe request to test recovery |
| State transition | Verify correct transition counts and timeouts |

### 9.2 Fallback Patterns

| Pattern | Test Point |
|---------|------------|
| Cache fallback | Primary fails, serve stale cache |
| Static fallback | Dynamic fails, serve static/default |
| degraded response | Full response fails, return minimal viable data |
| Queue fallback | Sync fails, queue for later processing |
| Skip pattern | Non-critical dependency fails, skip it |

### 9.3 Retry Patterns

| Pattern | Test Point |
|---------|------------|
| Fixed backoff | Wait N ms between retries |
| Exponential backoff | Wait 2^attempt * base ms |
| Jitter | Add randomness to prevent thundering herd |
| Max retries | Stop retrying after N attempts |
| Retry budget | Limit retry ratio to prevent cascade |
| Idempotency check | Retry only idempotent operations |

---

## 10. Composite Failure Scenarios

Real incidents often involve multiple simultaneous failures. Test these combinations:

| Combo | Scenario | Blast Radius |
|-------|----------|--------------|
| Cache down + DB slow | All traffic hits already slow DB | Complete outage |
| Retry storm + rate limit | Retries amplify rate limit violations | Extended outage |
| Partial network partition | Some nodes see each other, some don't | Data inconsistency |
| Clock skew + lease expiration | Different nodes have different times | Split brain |
| GC pause + heartbeat timeout | JVM GC causes missed heartbeats | False-positive failover |
| Deploy during recovery | New code while system is degraded | Compound failure |
| Cascading failure | A down causes B overload causes C down | Full cascade |
| Thundering herd | Cache expires, all requests hit origin | Origin overload |

---

## Quick-Start: Top 10 Most Common Production Faults

Based on incident data, these are the most common un-tested failure modes:

1. **Timeout not configured** — Default infinite timeout on HTTP calls
2. **No circuit breaker** — Retry without limit during dependency outage
3. **Cache stampede** — No protection against cache miss flood
4. **Connection leak** — Connections not returned to pool
5. **No fallback on auth failure** — Authentication service down = everything down
6. **Unbounded queue** — Memory exhaustion from queue growth
7. **No request size limit** — OOM from unexpectedly large payload
8. **Race on shared cache** — Concurrent read-modify-write without lock
9. **Missing null check on external response** — `response.data.items.map(...)` crashes
10. **No graceful shutdown** — In-flight requests aborted on deploy

During Lv.2+ review, verify that each of these has at least one test case if applicable to the system under test.
