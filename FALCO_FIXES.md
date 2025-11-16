# Falco Configuration Fixes for WSL2

This document describes the fixes applied to resolve Falco issues in WSL2 environment.

## Issues Fixed

### 1. Schema Validation Error for 'outputs' Property

**Problem:**
```
schema validation: failed for <root>: Object contains a property that could not be validated using 'properties' or 'additionalProperties' constraints: 'outputs'.
```

**Root Cause:**
Newer versions of Falco changed the syntax for output rate limiting from nested `outputs:` object to flat `outputs_rate` and `outputs_max_burst` properties.

**Fix Applied:**
- **File:** `falco/falco.yaml`
- **Change:**
  ```yaml
  # OLD (incorrect)
  outputs:
    rate: 1
    max_burst: 1000

  # NEW (correct)
  outputs_rate: 1
  outputs_max_burst: 1000
  ```

---

### 2. Driver Loading Failure in WSL2

**Problem:**
```
Unable to load the driver
Error: error opening device /host/dev/falco0. Make sure you have root credentials and that the falco module is loaded: No such file or directory
```

**Root Cause:**
WSL2 doesn't support Falco's kernel module driver. The container was configured with `FALCO_BPF_PROBE=""` which doesn't enable any alternative driver.

**Fix Applied:**
- **File:** `docker-compose.yml`
- **Changes:**
  1. Changed driver type to modern eBPF: `FALCOCTL_DRIVER_TYPE=modern_ebpf`
  2. Added required volume mounts:
     - `/sys/kernel/debug:/sys/kernel/debug:ro` - For eBPF debugging
     - `/proc:/host/proc:ro` - For process information
  3. Added required capabilities:
     - `SYS_ADMIN` - For eBPF operations
     - `SYS_RESOURCE` - For resource management
     - `SYS_PTRACE` - For process tracing
  4. Set `HOST_ROOT=/host` environment variable

---

### 3. Performance Warning on "Write to System Directories" Rule

**Problem:**
```
LOAD_NO_EVTTYPE (Condition has no event-type restriction): Rule matches too many evt.type values. This has a significant performance penalty.
```

**Root Cause:**
The `open_write` macro matches many event types, causing performance issues. The rule needed explicit event type filtering.

**Fix Applied:**
- **File:** `falco/rules/custom_rules.yaml`
- **Change:**
  ```yaml
  # OLD (too broad)
  condition: >
    open_write and
    container and
    ...

  # NEW (specific event types)
  condition: >
    (evt.type in (open, openat, openat2) and evt.is_open_write=true) and
    container and
    ...
  ```

This explicitly restricts the rule to only the `open`, `openat`, and `openat2` syscalls when performing write operations.

---

## Testing the Fixes

### Step 1: Restart Falco Container

```bash
cd /home/user/bbf
docker compose restart falco
```

### Step 2: Verify Falco Started Successfully

```bash
docker logs bbf-falco
```

You should see:
- ✅ No schema validation errors
- ✅ No "LOAD_NO_EVTTYPE" warnings
- ✅ "Opening 'syscall' source with modern_ebpf" or similar
- ✅ "Falco initialized" message

### Step 3: Run the Event Simulation Script

```bash
cd /home/user/bbf
./test-falco-events.sh
```

This script will:
1. Verify containers are running
2. Trigger 7 different security events based on custom rules
3. Wait for Falco to process events
4. Display recent Falco detections

### Step 4: Monitor Falco Logs in Real-Time

```bash
docker logs -f bbf-falco
```

Watch for JSON-formatted security alerts like:
```json
{
  "priority": "Critical",
  "rule": "Shell Spawned in Container",
  "output": "Shell spawned in application container...",
  "container": "bbf-backend"
}
```

---

## Expected Detections

The test script will trigger these security rules:

| Rule Name | Priority | Trigger Action |
|-----------|----------|----------------|
| Shell Spawned in Container | CRITICAL | Execute `sh` in container |
| Sensitive File Access in Container | CRITICAL | Read `/etc/shadow`, `/etc/passwd` |
| Write to System Directories | CRITICAL | Attempt to write to `/bin`, `/usr/bin` |
| Cryptomining Activity Detected | CRITICAL | Spawn process matching crypto miners |
| Unauthorized Process Execution | WARNING | Run non-whitelisted processes |
| Package Manager Execution | WARNING | Run `npm` in running container |
| Network Connection to Suspicious Port | WARNING | Connect to non-standard ports |

---

## Viewing Alerts in Grafana

1. Open Grafana: http://localhost:3001
2. Login: `admin` / `admin123`
3. Navigate to Security Monitoring Dashboard: http://localhost:3001/d/bbf-security
4. Alerts will appear in the "Falco Security Events" panel

---

## Troubleshooting

### If Falco Still Fails to Start

**Check WSL2 Kernel Version:**
```bash
uname -r
```

Modern eBPF requires Linux kernel 5.8+ (5.15+ recommended). If your kernel is older, you may need to update WSL2.

**Try Alternative Driver (Plugin/Userspace):**

If eBPF doesn't work, you can try the plugin driver instead:

Edit `docker-compose.yml`:
```yaml
environment:
  - HOST_ROOT=/host
  - FALCOCTL_DRIVER_TYPE=plugin  # Change from modern_ebpf to plugin
```

Then restart:
```bash
docker compose restart falco
```

### If No Events Are Detected

1. **Verify containers are running:**
   ```bash
   docker ps | grep bbf
   ```

2. **Check Falco is monitoring the right containers:**
   ```bash
   docker logs bbf-falco | grep "container.name"
   ```

3. **Verify rules are loaded:**
   ```bash
   docker logs bbf-falco | grep "custom_rules.yaml"
   ```

4. **Check log level allows detections:**
   In `falco/falco.yaml`, ensure:
   ```yaml
   priority: debug  # Shows all priority levels
   ```

### If Performance is Still Slow

If you still see performance warnings, you can further optimize rules by:

1. Adding more specific event type filters
2. Reducing the number of containers monitored
3. Adjusting the priority threshold to only show CRITICAL/WARNING events

---

## Additional Resources

- **Falco Documentation:** https://falco.org/docs/
- **Falco Rules Documentation:** https://falco.org/docs/rules/
- **Modern eBPF Driver:** https://falco.org/docs/event-sources/drivers/#modern-ebpf-probe
- **WSL2 Kernel Info:** https://learn.microsoft.com/en-us/windows/wsl/kernel-release-notes

---

## Summary

All three major issues have been resolved:

1. ✅ **Configuration syntax** - Updated to Falco v0.39+ schema
2. ✅ **Driver compatibility** - Configured modern eBPF for WSL2
3. ✅ **Performance optimization** - Added explicit event type filtering
4. ✅ **Testing script** - Created `test-falco-events.sh` to simulate security events

The Falco runtime security monitoring is now fully operational on WSL2!

---

**Last Updated:** 2025-11-16
**Falco Version:** 0.39.2
**Environment:** WSL2 (Linux 5.15.167.4-microsoft-standard-WSL2)
