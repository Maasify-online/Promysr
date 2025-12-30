#!/bin/bash

# PromySr - Quick Automated API Test Suite
# Tests critical backend functionality

PROJECT_REF="yjvrluwawbrnecaeoiax"
JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ"
BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1"
TEST_EMAIL="info@maasify.online"

echo "🧪 PromySr - Quick Automated Test Suite"
echo "========================================"
echo ""

PASS=0
FAIL=0

# Helper function to test API endpoint
test_api() {
    local test_name=$1
    local endpoint=$2
    local data=$3
    
    echo -n "Testing: $test_name... "
    
    response=$(curl -s -X POST "${BASE_URL}/${endpoint}" \
        -H "Authorization: Bearer ${JWT}" \
        -H "Content-Type: application/json" \
        -d "$data")
    
    if echo "$response" | grep -q "error"; then
        echo "❌ FAIL"
        echo "  Response: $response"
        ((FAIL++))
    else
        echo "✅ PASS"
        ((PASS++))
    fi
}

echo "📧 EMAIL NOTIFICATION TESTS"
echo "----------------------------"

# Test 1: Promise Created Email
test_api "Promise Created Email" "send-promise-notification" \
    '{"type": "created", "promise_text": "QA Test Promise", "due_date": "2025-12-31", "owner_email": "'$TEST_EMAIL'", "owner_name": "QA Tester"}'

sleep 2

# Test 2: Review Needed Email
test_api "Review Needed Email" "send-promise-notification" \
    '{"type": "review_needed", "promise_text": "QA Test Review", "owner_email": "'$TEST_EMAIL'", "owner_name": "QA Tester", "leader_email": "'$TEST_EMAIL'"}'

sleep 2

# Test 3: Promise Verified Email
test_api "Promise Verified Email" "send-promise-notification" \
    '{"type": "promise_verified", "promise_text": "QA Test Verified", "owner_email": "'$TEST_EMAIL'", "owner_name": "QA Tester", "integrity_score": 95}'

sleep 2

# Test 4: Daily Brief
test_api "Daily Brief Email" "send-morning-brief" \
    '{"userEmail": "'$TEST_EMAIL'"}'

sleep 2

# Test 5: Weekly Reminder
test_api "Weekly Reminder Email" "send-weekly-reminder" \
    '{"userEmail": "'$TEST_EMAIL'"}'

sleep 2

# Test 6: Scheduler
test_api "Email Scheduler" "send-scheduled-emails" \
    '{}'

echo ""
echo "📊 TEST SUMMARY"
echo "==============="
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed. Check logs above."
    exit 1
fi
