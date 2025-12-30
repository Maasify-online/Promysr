#!/bin/bash

# Test all 8 email types with proper delays to avoid rate limiting
# This script sends one email every 3 seconds

PROJECT_REF="yjvrluwawbrnecaeoiax"
JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ"
BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1"

echo "🚀 Starting email test sequence..."
echo "⏱️  Sending 1 email every 3 seconds to avoid rate limits"
echo ""

# 1. Promise Created
echo "📧 [1/8] Sending Promise Created..."
curl -X POST "${BASE_URL}/send-promise-notification" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "created",
    "promise_text": "✅ 1/8 Promise Created",
    "due_date": "2025-12-30",
    "owner_email": "info@maasify.online",
    "owner_name": "John Doe"
  }'
echo ""
sleep 3

# 2. Review Needed
echo "📧 [2/8] Sending Review Needed..."
curl -X POST "${BASE_URL}/send-promise-notification" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "review_needed",
    "promise_text": "✅ 2/8 Review Needed",
    "owner_email": "info@maasify.online",
    "owner_name": "John Doe",
    "leader_email": "info@maasify.online"
  }'
echo ""
sleep 3

# 3. Promise Verified
echo "📧 [3/8] Sending Promise Verified..."
curl -X POST "${BASE_URL}/send-promise-notification" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "promise_verified",
    "promise_text": "✅ 3/8 Promise Verified",
    "owner_email": "info@maasify.online",
    "owner_name": "John Doe",
    "integrity_score": 95
  }'
echo ""
sleep 3

# 4. Completion Rejected
echo "📧 [4/8] Sending Completion Rejected..."
curl -X POST "${BASE_URL}/send-promise-notification" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "completion_rejected",
    "promise_text": "✅ 4/8 Completion Rejected",
    "owner_email": "info@maasify.online",
    "owner_name": "John Doe",
    "rejection_reason": "Please add more details"
  }'
echo ""
sleep 3

# 5. Promise Closed
echo "📧 [5/8] Sending Promise Closed..."
curl -X POST "${BASE_URL}/send-promise-notification" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "closed",
    "promise_text": "✅ 5/8 Promise Closed",
    "owner_email": "info@maasify.online",
    "owner_name": "John Doe",
    "leader_email": "info@maasify.online"
  }'
echo ""
sleep 3

# 6. Promise Missed
echo "📧 [6/8] Sending Promise Missed..."
curl -X POST "${BASE_URL}/send-promise-notification" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "missed",
    "promise_text": "✅ 6/8 Promise Missed",
    "due_date": "2025-12-28",
    "owner_email": "info@maasify.online",
    "leader_email": "info@maasify.online"
  }'
echo ""
sleep 3

# 7. Daily Brief
echo "📧 [7/8] Sending Daily Brief..."
curl -X POST "${BASE_URL}/send-morning-brief" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "info@maasify.online"
  }'
echo ""
sleep 3

# 8. Weekly Reminder (Direct Test)
echo "📧 [8/8] Sending Weekly Reminder..."
curl -X POST "${BASE_URL}/send-weekly-reminder" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "info@maasify.online"
  }'

echo ""
echo "---------------------------------------------------"
echo "🕒 STARTING TIME TRAVEL SIMULATIONS (Scoped Tests)"
echo "---------------------------------------------------"

# 9. SCENARIO A: User Morning (8:00 AM IST)
# 8:00 AM IST = 02:30 UTC
# Should trigger: User Daily Brief (Scope: User) + User Missed Report (Scope: User)
echo "🚀 [Scenario A] Simulating 8:00 AM IST (User Brief Time)..."
curl -X POST "${BASE_URL}/send-scheduled-emails" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "debugNow": "2025-12-30T02:30:00Z"
  }'
echo ""
sleep 3

# 10. SCENARIO B: Leader Morning (9:00 AM IST)
# 9:00 AM IST = 03:30 UTC
# Should trigger: Leader Daily Radar (Scope: Leader) + Leader Missed Report (Scope: Leader)
echo "🚀 [Scenario B] Simulating 9:00 AM IST (Leader Radar Time)..."
curl -X POST "${BASE_URL}/send-scheduled-emails" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "debugNow": "2025-12-30T03:30:00Z"
  }'
echo ""
sleep 3

# 11. SCENARIO C: Weekly Reminder (Monday 10:00 AM IST)
# 10:00 AM IST = 04:30 UTC
# Should trigger: Weekly Reminders
echo "🚀 [Scenario C] Simulating Monday 10:00 AM IST (Weekly Reminder)..."
# Note: Ensure the date used is actually a Monday
curl -X POST "${BASE_URL}/send-scheduled-emails" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "debugNow": "2025-12-29T04:30:00Z"
  }'

echo ""
echo "✅ All tests completed!"
echo "📬 Check logs and inbox for Scoped Emails:"
echo "   - Scenario A should deliver 'Your Daily Brief' ONLY"
echo "   - Scenario B should deliver 'Leader Daily Radar' ONLY"
