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

# 8. Weekly Reminder
echo "📧 [8/8] Sending Weekly Reminder..."
curl -X POST "${BASE_URL}/send-weekly-reminder" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "info@maasify.online"
  }'
echo ""

echo ""
echo "✅ All 8 emails sent!"
echo "📬 Check info@maasify.online inbox in ~30 seconds"
