# PromySr - Comprehensive QA Testing Guide

## 🎯 Testing Strategy Overview

**Total Test Cases:** ~50 scenarios  
**Estimated Time:** 2-3 hours for full QA  
**Priority Levels:** P0 (Critical), P1 (High), P2 (Medium), P3 (Low)

---

## 📋 **PART 1: User Authentication & Onboarding** (15 min)

### Test Case 1.1: Sign Up Flow (P0)
- [ ] Navigate to `/login`
- [ ] Click "Sign Up"
- [ ] Enter email and password
- [ ] Verify email confirmation (if enabled)
- [ ] Check profile is created in `profiles` table
- [ ] Check email notification settings are created with IST defaults
- [ ] **Expected:** User lands on dashboard with welcome message

### Test Case 1.2: Login Flow (P0)
- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] **Expected:** Redirect to `/dashboard`
- [ ] Try invalid credentials
- [ ] **Expected:** Error message shown

### Test Case 1.3: Password Reset (P1)
- [ ] Click "Forgot Password"
- [ ] Enter email
- [ ] Check email for reset link
- [ ] Reset password
- [ ] Login with new password

---

## 📋 **PART 2: Promise Creation & Management** (20 min)

### Test Case 2.1: Create Promise (P0)
- [ ] Click "Create Promise" button
- [ ] Fill in promise text: "Complete Q4 Report"
- [ ] Select due date (try today, tomorrow, next week)
- [ ] Verify date picker allows today
- [ ] Click "Create"
- [ ] **Expected:** Promise appears in "My Commitments"
- [ ] **Expected:** Email sent to promise owner (if enabled)
- [ ] Check `promises` table for new record
- [ ] Verify status is "Open"

### Test Case 2.2: Assign Promise to Team Member (P0)
- [ ] Create promise
- [ ] Assign to another user
- [ ] **Expected:** Assignee receives "Promise Created" email
- [ ] **Expected:** Promise appears in assignee's "My Commitments"
- [ ] **Expected:** Promise appears in your "All Promises" (leader view)

### Test Case 2.3: Mark Promise as Done (P0)
- [ ] Open a promise
- [ ] Click "Mark as Done"
- [ ] **Expected:** Status changes to "Pending Verification"
- [ ] **Expected:** Leader receives "Review Needed" email
- [ ] **Expected:** Promise shows in "Pending Verification" filter

### Test Case 2.4: Verify Promise (Leader) (P0)
- [ ] As leader, open promise in "Pending Verification"
- [ ] Click "Verify Completion"
- [ ] **Expected:** Status changes to "Closed"
- [ ] **Expected:** Owner receives "Promise Verified" email
- [ ] **Expected:** Integrity score updates

### Test Case 2.5: Reject Completion (Leader) (P0)
- [ ] As leader, open promise in "Pending Verification"
- [ ] Click "Reject"
- [ ] Enter rejection reason: "Needs more details"
- [ ] **Expected:** Status changes back to "Open"
- [ ] **Expected:** Owner receives "Completion Rejected" email
- [ ] **Expected:** Rejection count increments

### Test Case 2.6: Promise Becomes Overdue (P1)
- [ ] Create promise with due date in past
- [ ] Wait for system to mark as overdue
- [ ] **Expected:** Status shows "Overdue"
- [ ] **Expected:** Red styling/badge appears
- [ ] **Expected:** Shows in "Overdue" filter

### Test Case 2.7: Promise Missed (P1)
- [ ] Let promise stay overdue for extended period
- [ ] **Expected:** Status changes to "Missed"
- [ ] **Expected:** Leader receives "Promise Missed" email
- [ ] **Expected:** Integrity score decreases

---

## 📋 **PART 3: Email Notifications** (30 min)

### Test Case 3.1: Promise Notification Emails (P0)
Test all 6 promise-related emails:

#### 3.1.1: Promise Created
- [ ] Create new promise
- [ ] Check inbox for "New Promise Assigned" email
- [ ] Verify email has correct promise text and due date
- [ ] Click "View Promise" link
- [ ] **Expected:** Redirects to promise detail page

#### 3.1.2: Review Needed
- [ ] Mark promise as done
- [ ] Check leader's inbox for "Review Needed" email
- [ ] Verify email shows promise text and completion date
- [ ] Test "Verify" and "Reject" buttons in email

#### 3.1.3: Promise Verified
- [ ] Leader verifies promise
- [ ] Check owner's inbox for "Promise Verified" email
- [ ] Verify integrity score is shown

#### 3.1.4: Completion Rejected
- [ ] Leader rejects completion
- [ ] Check owner's inbox for "Completion Rejected" email
- [ ] Verify rejection reason is shown

#### 3.1.5: Promise Closed
- [ ] Leader closes promise
- [ ] Check leader's inbox for "Promise Closed" email

#### 3.1.6: Promise Missed
- [ ] Let promise become missed
- [ ] Check leader's inbox for "Promise Missed" email

### Test Case 3.2: Daily Brief Email (P0)

#### 3.2.1: User Daily Brief
- [ ] Go to Settings → Email Notifications
- [ ] Enable "Daily Brief"
- [ ] Set time to current time + 5 minutes
- [ ] Set timezone to "Asia/Kolkata"
- [ ] Select days: Today's day
- [ ] Wait for scheduled time
- [ ] **Expected:** Receive "Your Daily Brief" email
- [ ] **Expected:** Email shows tasks due today

#### 3.2.2: Leader Daily Radar
- [ ] Enable "Leader Daily Radar" toggle
- [ ] Ensure team members have tasks due today
- [ ] Wait for scheduled time
- [ ] **Expected:** Receive "Leader Daily Radar" email
- [ ] **Expected:** Email shows team member tasks

### Test Case 3.3: Weekly Reminder Email (P0)

#### 3.3.1: User Weekly Reminder
- [ ] Enable "Weekly Reminder"
- [ ] Set day to today
- [ ] Set time to current time + 5 minutes
- [ ] Set frequency to "Weekly"
- [ ] Wait for scheduled time
- [ ] **Expected:** Receive "Your Weekly Report" email
- [ ] **Expected:** Email shows promise statistics

#### 3.3.2: Leader Weekly Team Report
- [ ] Enable "Leader Weekly Team Report" toggle
- [ ] Wait for scheduled time
- [ ] **Expected:** Receive "Leader Weekly Team Report" email
- [ ] **Expected:** Email shows team performance stats

### Test Case 3.4: Email Toggle Functionality (P1)
Test that each toggle actually enables/disables emails:

- [ ] Disable "Promise Created" → Create promise → No email sent
- [ ] Disable "Review Needed" → Mark done → No email sent
- [ ] Disable "Daily Brief" → Wait for time → No email sent
- [ ] Disable "Leader Daily Radar" → Wait for time → No leader email sent
- [ ] Re-enable all → Verify emails resume

### Test Case 3.5: Timezone Support (P1)
- [ ] Set Daily Brief timezone to "America/New_York"
- [ ] Set time to 9:00 AM EST
- [ ] **Expected:** Email arrives at 9:00 AM EST (7:30 PM IST)
- [ ] Test with other timezones: PST, GMT, JST

### Test Case 3.6: Email Preview (P2)
- [ ] Click preview button for each email type
- [ ] **Expected:** Modal shows email template
- [ ] Verify branding is correct (PromySr logo, colors)
- [ ] Verify sample data is realistic

---

## 📋 **PART 4: Dashboard & Analytics** (15 min)

### Test Case 4.1: Integrity Score (P0)
- [ ] Create 5 promises
- [ ] Complete and verify 4 of them
- [ ] Miss 1 promise
- [ ] **Expected:** Integrity score = 80% (4/5)
- [ ] Verify score shows in dashboard card
- [ ] Verify score updates in real-time

### Test Case 4.2: Active Promises Count (P0)
- [ ] Create 3 promises
- [ ] Complete 1
- [ ] **Expected:** Active count = 2
- [ ] **Expected:** Shows "Open" + "Pending Verification"

### Test Case 4.3: Filters (P1)
Test all filters in "All Promises" view:

- [ ] Filter by Status: Open
- [ ] Filter by Status: Pending Verification
- [ ] Filter by Status: Closed
- [ ] Filter by Status: Overdue
- [ ] Filter by Status: Missed
- [ ] Filter by Who: Assigned to me
- [ ] Filter by Who: Assigned by me
- [ ] Filter by When: Due today
- [ ] Filter by When: Due this week
- [ ] Filter by When: Overdue

### Test Case 4.4: Activity Feed (P1)
- [ ] Create promise
- [ ] Mark as done
- [ ] Verify completion
- [ ] **Expected:** All 3 activities show in feed
- [ ] **Expected:** Timestamps are correct
- [ ] **Expected:** Activity feed updates in real-time

---

## 📋 **PART 5: Organization & Team Management** (10 min)

### Test Case 5.1: Create Organization (P0)
- [ ] Go to Settings → Organization
- [ ] Create new organization
- [ ] **Expected:** Organization appears in dropdown
- [ ] **Expected:** You are set as owner

### Test Case 5.2: Invite Team Member (P0)
- [ ] Click "Invite Member"
- [ ] Enter email
- [ ] Select role: "Member"
- [ ] **Expected:** Invitation email sent
- [ ] **Expected:** Member appears in team list after accepting

### Test Case 5.3: Leader Permissions (P1)
- [ ] As leader, verify you can:
  - [ ] See all team promises
  - [ ] Verify completions
  - [ ] Reject completions
  - [ ] Receive leader emails
- [ ] As member, verify you cannot:
  - [ ] See other members' promises (unless assigned)
  - [ ] Verify other members' promises

---

## 📋 **PART 6: Settings & Preferences** (10 min)

### Test Case 6.1: Profile Settings (P1)
- [ ] Update full name
- [ ] Update email
- [ ] **Expected:** Changes save successfully
- [ ] **Expected:** Name shows in dashboard header

### Test Case 6.2: Email Notification Settings (P0)
- [ ] Toggle each notification on/off
- [ ] Change daily brief time
- [ ] Change daily brief days
- [ ] Change weekly reminder day
- [ ] Change timezone
- [ ] **Expected:** All changes persist after page refresh
- [ ] **Expected:** Settings show correct defaults (IST timezone)

### Test Case 6.3: Notification Preferences Persistence (P1)
- [ ] Disable all notifications
- [ ] Logout
- [ ] Login
- [ ] **Expected:** All notifications still disabled
- [ ] Re-enable all
- [ ] **Expected:** All notifications enabled

---

## 📋 **PART 7: Edge Cases & Error Handling** (15 min)

### Test Case 7.1: Network Errors (P1)
- [ ] Disconnect internet
- [ ] Try to create promise
- [ ] **Expected:** Error message shown
- [ ] Reconnect internet
- [ ] Retry
- [ ] **Expected:** Promise created successfully

### Test Case 7.2: Concurrent Edits (P2)
- [ ] Open same promise in two tabs
- [ ] Mark as done in tab 1
- [ ] Try to edit in tab 2
- [ ] **Expected:** Conflict handled gracefully

### Test Case 7.3: Invalid Data (P1)
- [ ] Try to create promise with empty text
- [ ] **Expected:** Validation error
- [ ] Try to set due date in far past
- [ ] **Expected:** Warning or error

### Test Case 7.4: Rate Limiting (P2)
- [ ] Send 10 emails rapidly
- [ ] **Expected:** Rate limit message or queuing

---

## 📋 **PART 8: Performance & UX** (10 min)

### Test Case 8.1: Page Load Speed (P1)
- [ ] Measure dashboard load time
- [ ] **Expected:** < 2 seconds on good connection
- [ ] Check for console errors
- [ ] **Expected:** No errors

### Test Case 8.2: Mobile Responsiveness (P1)
- [ ] Open on mobile device or resize browser
- [ ] Test all major pages:
  - [ ] Dashboard
  - [ ] Create Promise
  - [ ] Promise Detail
  - [ ] Settings
- [ ] **Expected:** All elements visible and usable

### Test Case 8.3: Browser Compatibility (P2)
Test on:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## 📋 **PART 9: Security & Privacy** (10 min)

### Test Case 9.1: Row Level Security (P0)
- [ ] As User A, create promise
- [ ] As User B, try to access User A's promise directly
- [ ] **Expected:** Access denied or promise not visible

### Test Case 9.2: Email Privacy (P0)
- [ ] Verify emails only go to intended recipients
- [ ] Verify no sensitive data in email headers
- [ ] Verify unsubscribe link works (if present)

### Test Case 9.3: Session Management (P1)
- [ ] Login
- [ ] Close browser
- [ ] Reopen
- [ ] **Expected:** Still logged in (if "Remember me")
- [ ] Test session timeout after inactivity

---

## 📋 **PART 10: Admin Features** (10 min)

### Test Case 10.1: Admin Panel Access (P0)
- [ ] Login as admin
- [ ] Navigate to `/admin`
- [ ] **Expected:** Admin panel visible
- [ ] As regular user, try to access `/admin`
- [ ] **Expected:** Access denied

### Test Case 10.2: Email Logs (P1)
- [ ] Send test email
- [ ] Check Admin → Email Logs
- [ ] **Expected:** Email appears in log
- [ ] Verify status, recipient, timestamp

### Test Case 10.3: Security Audit (P1)
- [ ] Check Security Audit page
- [ ] Verify user activity logs
- [ ] Test "Send Test Email" button

---

## 🎯 **Quick Smoke Test** (15 min)

If you only have 15 minutes, run this minimal test:

1. ✅ **Sign up/Login** (2 min)
2. ✅ **Create promise** (2 min)
3. ✅ **Mark as done** (1 min)
4. ✅ **Verify completion** (1 min)
5. ✅ **Check email received** (2 min)
6. ✅ **Toggle notification off** (2 min)
7. ✅ **Create promise, verify no email** (2 min)
8. ✅ **Check dashboard stats** (2 min)
9. ✅ **Test one filter** (1 min)

---

## 📊 **Test Tracking Spreadsheet**

Create a Google Sheet with these columns:
- Test Case ID
- Description
- Priority
- Status (Pass/Fail/Blocked)
- Tester
- Date Tested
- Notes/Issues

---

## 🐛 **Bug Reporting Template**

When you find a bug, report it with:

```
**Title:** [Brief description]
**Priority:** P0/P1/P2/P3
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
**Actual Result:**
**Screenshots:** [Attach if applicable]
**Browser/Device:** 
**User Role:** Leader/Member/Admin
```

---

## 🚀 **Automated Testing Recommendations**

For future automation:

1. **Unit Tests:** Jest for React components
2. **Integration Tests:** Playwright for user flows
3. **API Tests:** Postman/Newman for Edge Functions
4. **Email Tests:** Mailtrap for email delivery
5. **Performance:** Lighthouse CI
6. **Security:** OWASP ZAP

---

## ✅ **Sign-Off Checklist**

Before going live:

- [ ] All P0 tests pass
- [ ] All P1 tests pass
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Email delivery working
- [ ] Security verified
- [ ] Backup/restore tested
- [ ] Documentation updated
- [ ] Stakeholder approval

---

**Last Updated:** 2025-12-30  
**Version:** 1.0  
**Tested By:** _____________  
**Sign-Off:** _____________
