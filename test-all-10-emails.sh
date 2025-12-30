#!/bin/bash

# Configuration
SUPABASE_URL="https://yjvrluwawbrnecaeoiax.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDU5NjEsImV4cCI6MjA4MjMyMTk2MX0.YR7HC2vOoZbpy7g7O5bi6GkytgMhZaTREKVfAF6TqDs"
SUPABASE_ANON_KEY="$ANON_KEY"

# Check for .env if available to override
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# URL for functions
FUNCTION_URL="${SUPABASE_URL}/functions/v1/send-promise-notification"
SCHEDULER_URL="${SUPABASE_URL}/functions/v1/send-morning-brief"
WEEKLY_URL="${SUPABASE_URL}/functions/v1/send-weekly-reminder"

echo "----------------------------------------------------------------"
echo "  PROMYSR 10-POINT EMAIL LOGIC TEST"
echo "----------------------------------------------------------------"

# 1. PROMISE ASSIGNED (Created)
echo "[1/10] Testing: Promise Assigned (Created)..."
curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "type": "created",
    "promise_text": "TEST: Complete System Audit",
    "due_date": "2025-12-31",
    "owner_email": "svkapoor9@gmail.com",
    "owner_name": "Vinayak (Owner)",
    "leader_email": "info@maasify.online",
    "leader_name": "Vinayak (Leader)"
  }' | grep "id" || echo "Failed"
echo ""

# 2. REVIEW NEEDED (Marked Complete)
echo "[2/10] Testing: Review Needed (Completion Review)..."
curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "type": "review_needed",
    "promise_text": "TEST: Complete System Audit",
    "due_date": "2025-12-31",
    "owner_email": "svkapoor9@gmail.com",
    "owner_name": "Vinayak (Owner)",
    "leader_email": "info@maasify.online",
    "leader_name": "Vinayak (Leader)"
  }' | grep "id" || echo "Failed"
echo ""

# 3. PROMISE VERIFIED (User Notification)
echo "[3/10] Testing: Promise Verified (To User)..."
curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "type": "promise_verified",
    "promise_text": "TEST: Complete System Audit",
    "due_date": "2025-12-31",
    "owner_email": "svkapoor9@gmail.com",
    "owner_name": "Vinayak (Owner)",
    "leader_name": "Vinayak (Leader)",
    "completed_at": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
    "integrity_score": 98
  }' | grep "id" || echo "Failed"
echo ""

# 4. PROMISE KEPT (Leader Notification - Closed)
echo "[4/10] Testing: Promise Kept (To Leader)..."
curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "type": "closed",
    "promise_text": "TEST: Complete System Audit",
    "due_date": "2025-12-31",
    "owner_email": "svkapoor9@gmail.com",
    "owner_name": "Vinayak (Owner)",
    "leader_email": "info@maasify.online",
    "leader_name": "Vinayak (Leader)",
    "completed_at": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"
  }' | grep "id" || echo "Failed"
echo ""

# 5. COMPLETION REJECTED
echo "[5/10] Testing: Completion Rejected..."
curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "type": "completion_rejected",
    "promise_text": "TEST: Poor Quality Work",
    "due_date": "2025-12-30",
    "owner_email": "svkapoor9@gmail.com",
    "owner_name": "Vinayak (Owner)",
    "leader_name": "Vinayak (Leader)",
    "rejection_reason": "Missing key details in section 3.",
    "rejected_at": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"
  }' | grep "id" || echo "Failed"
echo ""

# 6. PROMISE MISSED
echo "[6/10] Testing: Promise Missed..."
curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "type": "missed",
    "promise_text": "TEST: Missed Deadline Task",
    "due_date": "2025-12-28",
    "owner_email": "svkapoor9@gmail.com",
    "owner_name": "Vinayak (Owner)",
    "leader_email": "info@maasify.online",
    "leader_name": "Vinayak (Leader)"
  }' | grep "id" || echo "Failed"
echo ""

# 7. DAILY BRIEF (User)
echo "[7/10] Testing: Daily Brief (User)..."
curl -s -X POST "$SCHEDULER_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "userEmail": "svkapoor9@gmail.com"
  }' | grep "sent" || echo "Failed"
echo ""

# 8. LEADER DAILY RADAR
echo "[8/10] Testing: Leader Daily Radar..."
curl -s -X POST "$SCHEDULER_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "userEmail": "info@maasify.online" 
  }' | grep "sent" || echo "Failed"
echo ""

# 9. WEEKLY REPORT (User)
echo "[9/10] Testing: Weekly Report (User)..."
curl -s -X POST "$WEEKLY_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "userEmail": "svkapoor9@gmail.com"
  }' | grep "sent" || echo "Failed"
echo ""

# 10. WEEKLY TEAM REPORT (Leader)
echo "[10/10] Testing: Weekly Team Report (Leader)..."
curl -s -X POST "$WEEKLY_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "userEmail": "info@maasify.online" 
  }' | grep "sent" || echo "Failed"
echo ""

echo "----------------------------------------------------------------"
echo "  TEST COMPLETE - Check email inbox for 10 new messages."
echo "----------------------------------------------------------------"
