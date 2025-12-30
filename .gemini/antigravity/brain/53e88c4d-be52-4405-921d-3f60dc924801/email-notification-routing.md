# Email Notification Routing Logic

## Overview
This document confirms the email routing logic for all 8 notification types in PromySr.

---

## 📧 Promise-Related Notifications (6 Types)

### 1. **Promise Created** (`created`)
- **Recipient**: `owner_email` (The person assigned the task)
- **Scenario**: 
  - ✅ Leader assigns task to team member → Team member gets email
  - ✅ Leader self-assigns task → Leader gets email
- **Preference Check**: `promise_created_enabled`
- **Code Reference**: Lines 267-273

---

### 2. **Review Needed** (`review_needed`)
- **Recipient**: `leader_email` (The team leader/manager)
- **Scenario**: 
  - ✅ Team member marks task complete → Leader gets email to verify
  - ✅ Leader self-assigned task and marks complete → Leader gets email (to verify their own work)
- **Preference Check**: `review_needed_enabled`
- **Code Reference**: Lines 286-292
- **Note**: This is the ONLY notification that ALWAYS goes to the leader

---

### 3. **Promise Verified** (`promise_verified`)
- **Recipient**: `owner_email` (The person who completed the task)
- **Scenario**: 
  - ✅ Leader verifies team member's completion → Team member gets confirmation email
  - ✅ Leader verifies their own completion → Leader gets confirmation email
- **Preference Check**: `promise_verified_enabled`
- **Code Reference**: Lines 282-285
- **Current Bug**: Line 283 shows `to = leader_email || owner_email` which is INCORRECT
  - This should be `to = owner_email` because the person who DID the work should get the verification confirmation

---

### 4. **Completion Rejected** (`completion_rejected`)
- **Recipient**: `owner_email` (The person who submitted the completion)
- **Scenario**: 
  - ✅ Leader rejects team member's completion → Team member gets rejection email with feedback
  - ✅ Leader rejects their own completion → Leader gets rejection email
- **Preference Check**: `completion_rejected_enabled`
- **Code Reference**: Lines 298-301

---

### 5. **Promise Closed** (`closed`)
- **Recipient**: `leader_email || owner_email` (Fallback to owner if no leader)
- **Scenario**: 
  - ✅ Team member's promise is marked as kept → Leader gets notification
  - ✅ Leader's self-assigned promise is kept → Leader gets notification
- **Preference Check**: `promise_closed_enabled`
- **Code Reference**: Lines 278-281
- **Purpose**: Informs the leader that a promise has been successfully completed

---

### 6. **Promise Missed** (`missed`)
- **Recipient**: `leader_email || owner_email` (Fallback to owner if no leader)
- **Scenario**: 
  - ✅ Team member misses deadline → Leader gets alert
  - ✅ Leader misses their own deadline → Leader gets alert
- **Preference Check**: `promise_missed_enabled`
- **Code Reference**: Lines 274-277
- **Purpose**: Alerts the leader about missed commitments

---

## 📅 Scheduled Notifications (2 Types)

### 7. **Daily Brief** (`due-today` / `digest_user`)
- **Recipient**: `owner_email` (Every user gets their own brief)
- **Scenario**: 
  - ✅ Sent to ALL users (both leaders and team members) at their preferred time
  - ✅ Contains only THEIR tasks due today
  - ✅ Leader gets brief with their own tasks + tasks they assigned (if configured)
- **Preference Check**: `daily_brief_enabled`
- **Code Reference**: Lines 293-297
- **Scheduling**: Triggered by hourly cron job based on user's `daily_brief_time` preference

---

### 8. **Weekly Reminder** (`weekly_user_report`)
- **Recipient**: ALL users (both `owner_email` and `leader_email`)
- **Scenario**: 
  - ✅ Sent to ALL users at their preferred day/time
  - ✅ Contains weekly performance stats (completed, in-progress, missed)
  - ✅ Shows upcoming tasks for the week
  - ✅ Leaders get their own stats + team overview (if configured)
- **Preference Check**: `weekly_reminder_enabled`
- **Code Reference**: Lines 183-212 (template), scheduled by `send-weekly-reminder` function
- **Scheduling**: Triggered by hourly cron job based on user's `weekly_reminder_day` and `weekly_reminder_time` preferences

---

## 🔍 Key Findings

### ✅ Correct Routing
- **Promise Created**: ✅ Goes to task owner (team member or leader)
- **Review Needed**: ✅ Goes to leader only
- **Completion Rejected**: ✅ Goes to task owner
- **Promise Closed**: ✅ Goes to leader (or owner if no leader)
- **Promise Missed**: ✅ Goes to leader (or owner if no leader)
- **Daily Brief**: ✅ Goes to all users
- **Weekly Reminder**: ✅ Goes to all users

### ⚠️ Bug Found
- **Promise Verified**: ❌ Currently sends to `leader_email || owner_email` (line 283)
  - **Should be**: `owner_email` only
  - **Reason**: The person who completed the task should receive the verification confirmation, not the leader who verified it

---

## 📊 Summary Table

| Notification Type | Owner (Team Member) | Leader | Preference Column |
|-------------------|---------------------|--------|-------------------|
| Promise Created | ✅ Receives | ✅ Receives (if self-assigned) | `promise_created_enabled` |
| Review Needed | ❌ No | ✅ Always receives | `review_needed_enabled` |
| Promise Verified | ✅ Should receive | ❌ Should not receive | `promise_verified_enabled` |
| Completion Rejected | ✅ Receives | ✅ Receives (if self-assigned) | `completion_rejected_enabled` |
| Promise Closed | ❌ No | ✅ Receives | `promise_closed_enabled` |
| Promise Missed | ❌ No | ✅ Receives | `promise_missed_enabled` |
| Daily Brief | ✅ Receives | ✅ Receives | `daily_brief_enabled` |
| Weekly Reminder | ✅ Receives | ✅ Receives | `weekly_reminder_enabled` |

---

## 🛠️ Recommended Fix

**File**: `/supabase/functions/send-promise-notification/index.ts`  
**Line**: 283  
**Current**:
```typescript
case 'promise_verified':
    to = leader_email || owner_email
    requiredPref = 'promise_verified_enabled'
    break
```

**Should be**:
```typescript
case 'promise_verified':
    to = owner_email  // Person who did the work gets the confirmation
    requiredPref = 'promise_verified_enabled'
    break
```

This ensures that when a leader verifies a team member's work, the **team member** receives the "Promise Verified" confirmation email, not the leader.
