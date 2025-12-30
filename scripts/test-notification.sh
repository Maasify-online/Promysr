#!/bin/bash
# Test sending a promise creation notification
# Uses the anon key which functions.invoke uses (or service_role, but usually anon for client)
# Actually, functions.invoke uses the session token if available, or anon key.
# For this test, I will use the service_role key to bypass RLS issues, simulating a trusted internal call.
# IN PRODUCTION: The dashboard uses the USER's token.

SUPABASE_URL="https://yjvrluwawbrnecaeoiax.supabase.co"
KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdnJsdXdhd2JybmVjYWVvaWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0NTk2MSwiZXhwIjoyMDgyMzIxOTYxfQ.0jNDiIyE72ZR6Sl9aAdFVKaCYexnMqAg8h4Zl51GYYQ"

echo "Testing send-promise-notification (created)..."

curl -X POST "${SUPABASE_URL}/functions/v1/send-promise-notification" \
  -H "Authorization: Bearer ${KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "created",
    "promise_text": "Manual Test Promise via Curl",
    "due_date": "2025-01-01",
    "owner_email": "info@maasify.online",
    "owner_name": "Info User",
    "leader_email": "info@maasify.online",
    "promise_id": "test-id-123"
  }'

echo -e "\n\nDone."
