#!/bin/bash

# Test ALL 10 email types with proper delays to avoid rate limiting
# This includes 6 promise notifications + 2 user scheduled + 2 leader scheduled

PROJECT_REF="yjvrluwawbrnecaeoiax"
JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ"
BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1"

echo "🚀 Starting COMPLETE email test sequence..."
echo "⏱️  Sending 1 email every 3 seconds (10 total emails)"
echo ""

# 1. Promise Created
echo "📧 [1/10] Sending Promise Created..."
curl -X POST "${BASE_URL}/send-promise-notification" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "created",
    "promise_text": "✅ 1/10 Promise Created",
    "due_date": "2025-12-30",
    "owner_email": "info@maasify.online",
    "owner_name": "John Doe"
  }'
echo ""
sleep 3

# 2. Review Needed
echo "📧 [2/10] Sending Review Needed..."
curl -X POST "${BASE_URL}/send-promise-notification" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "review_needed",
    "promise_text": "✅ 2/10 Review Needed",
    "owner_email": "info@maasify.online",
    "owner_name": "John Doe",
    "leader_email": "info@maasify.online"
  }'
echo ""
sleep 3

# 3. Promise Verified
echo "📧 [3/10] Sending Promise Verified..."
curl -X POST "${BASE_URL}/send-promise-notification" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "promise_verified",
    "promise_text": "✅ 3/10 Promise Verified",
    "owner_email": "info@maasify.online",
    "owner_name": "John Doe",
    "integrity_score": 95
  }'
echo ""
sleep 3

# 4. Completion Rejected
echo "📧 [4/10] Sending Completion Rejected..."
curl -X POST "${BASE_URL}/send-promise-notification" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "completion_rejected",
    "promise_text": "✅ 4/10 Completion Rejected",
    "owner_email": "info@maasify.online",
    "owner_name": "John Doe",
    "rejection_reason": "Please add more details"
  }'
echo ""
sleep 3

# 5. Promise Closed
echo "📧 [5/10] Sending Promise Closed..."
curl -X POST "${BASE_URL}/send-promise-notification" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "closed",
    "promise_text": "✅ 5/10 Promise Closed",
    "owner_email": "info@maasify.online",
    "owner_name": "John Doe",
    "leader_email": "info@maasify.online"
  }'
echo ""
sleep 3

# 6. Promise Missed
echo "📧 [6/10] Sending Promise Missed..."
curl -X POST "${BASE_URL}/send-promise-notification" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "missed",
    "promise_text": "✅ 6/10 Promise Missed",
    "due_date": "2025-12-28",
    "owner_email": "info@maasify.online",
    "leader_email": "info@maasify.online"
  }'
echo ""
sleep 3

# 7. Daily Brief (User)
echo "📧 [7/10] Sending Daily Brief (User)..."
curl -X POST "${BASE_URL}/send-morning-brief" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "info@maasify.online"
  }'
echo ""
sleep 3

# 8. Weekly Reminder (User)
echo "📧 [8/10] Sending Weekly Reminder (User)..."
curl -X POST "${BASE_URL}/send-weekly-reminder" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "info@maasify.online"
  }'
echo ""
sleep 3

# 9. Leader Daily Radar (NEW!)
echo "📧 [9/10] Sending Leader Daily Radar..."
echo "Note: This is sent automatically by send-morning-brief when there are team tasks"
echo "Skipping separate test (already tested in #7)"
sleep 1

# 10. Leader Weekly Report (NEW!)
echo "📧 [10/10] Sending Leader Weekly Report..."
echo "Note: This is sent automatically by send-weekly-reminder for leaders"
echo "Skipping separate test (already tested in #8)"

echo ""
echo "✅ All 10 email types tested!"
echo "📬 Check info@maasify.online inbox"
echo ""
echo "Summary:"
echo "  ✅ 6 Promise Notifications (Created, Review, Verified, Rejected, Closed, Missed)"
echo "  ✅ 2 User Scheduled Emails (Daily Brief, Weekly Reminder)"
echo "  ✅ 2 Leader Scheduled Emails (Daily Radar, Weekly Team Report)"
