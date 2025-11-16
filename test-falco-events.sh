#!/bin/bash

# Test script to simulate Falco security events in WSL2
# This script triggers various security detections based on custom Falco rules

set -e

echo "========================================="
echo "Falco Security Event Simulation Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test header
print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
    sleep 1
}

# Function to print success
print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
    sleep 2
}

# Function to print warning
print_warning() {
    echo -e "${RED}[ALERT]${NC} $1 - Should trigger Falco detection!"
    sleep 3
}

# Check if containers are running
echo "Checking if BBF containers are running..."
if ! docker ps | grep -q "bbf-backend"; then
    echo "Error: bbf-backend container is not running"
    echo "Please start containers with: docker-compose up -d"
    exit 1
fi

if ! docker ps | grep -q "bbf-falco"; then
    echo "Error: bbf-falco container is not running"
    echo "Please start containers with: docker-compose up -d"
    exit 1
fi

print_success "Containers are running"
echo ""

# Test 1: Shell Spawned in Container (CRITICAL)
print_test "Test 1: Shell Spawned in Container (CRITICAL Priority)"
echo "Spawning interactive shell in bbf-backend container..."
docker exec bbf-backend sh -c "echo 'Shell execution test'" 2>/dev/null || true
print_warning "Shell spawned - Rule: 'Shell Spawned in Container'"
echo ""

# Test 2: Sensitive File Access (CRITICAL)
print_test "Test 2: Sensitive File Access (CRITICAL Priority)"
echo "Attempting to read /etc/shadow..."
docker exec bbf-backend sh -c "cat /etc/shadow 2>/dev/null || echo 'Permission denied (expected)'" >/dev/null 2>&1 || true
docker exec bbf-backend sh -c "cat /etc/passwd >/dev/null" 2>/dev/null || true
print_warning "Sensitive file access - Rule: 'Sensitive File Access in Container'"
echo ""

# Test 3: Package Manager Execution (WARNING)
print_test "Test 3: Package Manager Execution (WARNING Priority)"
echo "Running npm in container (should be build-time only)..."
docker exec bbf-backend sh -c "npm --version >/dev/null 2>&1" 2>/dev/null || true
print_warning "Package manager executed - Rule: 'Package Manager Execution in Container'"
echo ""

# Test 4: Unauthorized Process Execution (WARNING)
print_test "Test 4: Unauthorized Process Execution (WARNING Priority)"
echo "Running unauthorized process (wget) in container..."
docker exec bbf-backend sh -c "which wget >/dev/null 2>&1 || echo 'wget not installed (expected)'" 2>/dev/null || true
# Try with curl instead
docker exec bbf-backend sh -c "which curl >/dev/null 2>&1 && curl --version >/dev/null 2>&1 || echo 'Process test'" 2>/dev/null || true
print_warning "Unauthorized process - Rule: 'Unauthorized Process Execution in Container'"
echo ""

# Test 5: Write to System Directories (CRITICAL)
print_test "Test 5: Write to System Directories (CRITICAL Priority)"
echo "Attempting to write to /usr/bin (should fail)..."
docker exec bbf-backend sh -c "touch /usr/bin/test-file 2>/dev/null || echo 'Permission denied (expected)'" 2>/dev/null || true
docker exec bbf-backend sh -c "echo test > /bin/test-file 2>/dev/null || echo 'Permission denied (expected)'" 2>/dev/null || true
print_warning "Write to system directory attempted - Rule: 'Write to System Directories'"
echo ""

# Test 6: Network Connection to Suspicious Port (WARNING)
print_test "Test 6: Network Connection to Suspicious Port (WARNING Priority)"
echo "Attempting connection to suspicious port 4444..."
docker exec bbf-backend sh -c "timeout 2 nc -zv 127.0.0.1 4444 2>/dev/null || echo 'Connection test completed'" 2>/dev/null || true
# Try with wget/curl to external suspicious port
docker exec bbf-backend sh -c "timeout 2 curl -s http://127.0.0.1:4444 2>/dev/null || echo 'Connection test completed'" 2>/dev/null || true
print_warning "Suspicious network connection - Rule: 'Network Connection to Suspicious Port'"
echo ""

# Test 7: Cryptomining Activity Detection (CRITICAL)
print_test "Test 7: Cryptomining Activity Detection (CRITICAL Priority)"
echo "Simulating cryptomining process name..."
docker exec bbf-backend sh -c "(sleep 1 & echo 'Simulating suspicious process')" 2>/dev/null || true
echo "Note: Actual cryptominer binaries (minerd, xmrig) not installed (expected)"
print_warning "Would detect if cryptominer process was spawned - Rule: 'Cryptomining Activity Detected'"
echo ""

# Wait for events to be processed
echo "========================================="
echo "Waiting 5 seconds for Falco to process events..."
sleep 5
echo ""

# Check Falco logs
echo "========================================="
echo "Recent Falco Detections:"
echo "========================================="
docker logs bbf-falco --tail 50 2>&1 | grep -E "(CRITICAL|WARNING|Notice|Priority)" || echo "No Falco alerts found in recent logs"
echo ""

echo "========================================="
echo "Falco Event Simulation Complete!"
echo "========================================="
echo ""
echo "To view all Falco logs:"
echo "  docker logs bbf-falco"
echo ""
echo "To follow Falco logs in real-time:"
echo "  docker logs -f bbf-falco"
echo ""
echo "To view in Grafana Security Dashboard:"
echo "  http://localhost:3001/d/bbf-security"
echo "  (Login: admin / admin123)"
echo ""
echo "Expected detections by priority:"
echo "  CRITICAL: Shell Spawned, Sensitive File Access, Write to System Directories, Cryptomining"
echo "  WARNING: Unauthorized Process, Package Manager, Suspicious Network Connection"
echo ""
