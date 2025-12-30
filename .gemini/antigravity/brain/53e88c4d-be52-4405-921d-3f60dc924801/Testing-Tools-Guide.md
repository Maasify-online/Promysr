# PromySr - Testing Tools & Setup Guide

## 🛠️ **Recommended Testing Stack**

### **Overview:**
- **Frontend Testing:** Playwright + Vitest
- **Backend Testing:** Deno Test (for Edge Functions)
- **Email Testing:** Mailtrap / Resend Sandbox
- **Performance:** Lighthouse CI
- **Monitoring:** Sentry + Vercel Analytics
- **Manual Testing:** Chrome DevTools + React DevTools

---

## 📦 **1. PLAYWRIGHT (End-to-End Testing)**

### **Why Playwright?**
✅ Tests real user flows  
✅ Cross-browser (Chrome, Firefox, Safari)  
✅ Auto-waits for elements  
✅ Screenshots & videos  
✅ Works with React/Vite  

### **Setup:**

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Create config
npx playwright init
```

### **Example Test:**

```typescript
// tests/e2e/promise-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete promise flow', async ({ page }) => {
  // Login
  await page.goto('https://promysr.vercel.app/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  
  // Create promise
  await page.click('text=Create Promise');
  await page.fill('textarea', 'Complete Q4 Report');
  await page.click('button:has-text("Create")');
  
  // Verify promise appears
  await expect(page.locator('text=Complete Q4 Report')).toBeVisible();
  
  // Mark as done
  await page.click('text=Complete Q4 Report');
  await page.click('button:has-text("Mark as Done")');
  
  // Verify status changed
  await expect(page.locator('text=Pending Verification')).toBeVisible();
});
```

### **Run Tests:**

```bash
# Run all tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test promise-flow

# Generate report
npx playwright show-report
```

### **Cost:** FREE ✅

---

## 🧪 **2. VITEST (Unit & Component Testing)**

### **Why Vitest?**
✅ Fast (Vite-powered)  
✅ Jest-compatible API  
✅ React component testing  
✅ Built-in coverage  

### **Setup:**

```bash
# Install Vitest
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom

# Add to package.json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "coverage": "vitest --coverage"
}
```

### **Example Test:**

```typescript
// src/components/__tests__/PromiseInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PromiseInput } from '../PromiseInput';

describe('PromiseInput', () => {
  it('should allow creating a promise', () => {
    render(<PromiseInput />);
    
    const input = screen.getByPlaceholderText('Enter your promise...');
    fireEvent.change(input, { target: { value: 'Test Promise' } });
    
    expect(input).toHaveValue('Test Promise');
  });
  
  it('should validate empty input', () => {
    render(<PromiseInput />);
    
    const button = screen.getByText('Create');
    fireEvent.click(button);
    
    expect(screen.getByText('Promise text is required')).toBeInTheDocument();
  });
});
```

### **Run Tests:**

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# UI mode
npm run test:ui

# Coverage
npm run coverage
```

### **Cost:** FREE ✅

---

## 📧 **3. MAILTRAP (Email Testing)**

### **Why Mailtrap?**
✅ Catches all test emails  
✅ No emails sent to real users  
✅ Email preview & HTML inspection  
✅ API for automated testing  

### **Setup:**

```bash
# 1. Sign up at https://mailtrap.io (FREE tier)
# 2. Get SMTP credentials
# 3. Update your .env.local for testing:

RESEND_API_KEY=your_mailtrap_api_key  # For testing
# OR use Mailtrap SMTP settings
```

### **Test Email Delivery:**

```typescript
// tests/email/notifications.spec.ts
import { test, expect } from '@playwright/test';

test('should send promise created email', async ({ request }) => {
  // Trigger email
  const response = await request.post(
    'https://yjvrluwawbrnecaeoiax.supabase.co/functions/v1/send-promise-notification',
    {
      headers: { 'Authorization': 'Bearer YOUR_JWT' },
      data: {
        type: 'created',
        promise_text: 'Test Promise',
        owner_email: 'test@mailtrap.io'
      }
    }
  );
  
  expect(response.ok()).toBeTruthy();
  
  // Check Mailtrap API for email
  const emails = await request.get('https://mailtrap.io/api/v1/inboxes/YOUR_INBOX_ID/messages', {
    headers: { 'Api-Token': 'YOUR_MAILTRAP_TOKEN' }
  });
  
  const emailData = await emails.json();
  expect(emailData[0].subject).toContain('New Promise');
});
```

### **Alternatives:**
- **Resend Sandbox Mode** (built-in, FREE)
- **MailHog** (self-hosted, FREE)
- **Ethereal Email** (temporary, FREE)

### **Cost:** FREE tier (100 emails/month)

---

## 🚀 **4. LIGHTHOUSE CI (Performance Testing)**

### **Why Lighthouse CI?**
✅ Automated performance audits  
✅ Runs on every deploy  
✅ Catches regressions  
✅ SEO & Accessibility checks  

### **Setup:**

```bash
# Install
npm install -D @lhci/cli

# Create config
# lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['https://promysr.vercel.app/dashboard'],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }]
      }
    }
  }
};
```

### **Run:**

```bash
# Local test
npx lhci autorun

# Add to GitHub Actions
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install && npm run build
      - run: npx lhci autorun
```

### **Cost:** FREE ✅

---

## 🐛 **5. SENTRY (Error Monitoring)**

### **Why Sentry?**
✅ Real-time error tracking  
✅ Stack traces  
✅ User context  
✅ Performance monitoring  

### **Setup:**

```bash
# Install
npm install @sentry/react

# Initialize in main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### **Cost:** FREE tier (5K errors/month)

---

## 📊 **6. VERCEL ANALYTICS (Real User Monitoring)**

### **Why Vercel Analytics?**
✅ Real user performance data  
✅ Core Web Vitals  
✅ Zero config (built into Vercel)  
✅ Audience insights  

### **Setup:**

```bash
# Install
npm install @vercel/analytics

# Add to App.tsx
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

### **Cost:** FREE on Vercel

---

## 🔍 **7. REACT DEVTOOLS (Component Debugging)**

### **Why React DevTools?**
✅ Inspect component tree  
✅ View props & state  
✅ Profile performance  
✅ Track re-renders  

### **Setup:**

```bash
# Install browser extension
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
```

### **Usage:**
1. Open DevTools (F12)
2. Click "Components" tab
3. Inspect any component
4. Use "Profiler" to find slow renders

### **Cost:** FREE ✅

---

## 🧰 **8. CHROME DEVTOOLS (Browser Testing)**

### **Built-in Tools:**
- **Network Tab:** Check API calls, timing
- **Console:** View logs, errors
- **Application:** Inspect localStorage, cookies
- **Performance:** Record runtime performance
- **Lighthouse:** Run audits

### **Useful Features:**
```javascript
// Test in different timezones
// DevTools > Settings > Sensors > Location > Custom
// Set timezone to "America/New_York"

// Throttle network
// Network tab > Throttling > Slow 3G

// Simulate mobile
// DevTools > Toggle device toolbar (Cmd+Shift+M)
```

### **Cost:** FREE ✅

---

## 🧪 **9. POSTMAN / BRUNO (API Testing)**

### **Why Postman/Bruno?**
✅ Test Edge Functions  
✅ Save request collections  
✅ Automated tests  
✅ Environment variables  

### **Setup (Bruno - Open Source):**

```bash
# Install Bruno
brew install bruno  # Mac
# Or download from https://www.usebruno.com/

# Create collection
# 1. New Collection: "PromySr API Tests"
# 2. Add requests for each Edge Function
# 3. Save environment variables (JWT, BASE_URL)
```

### **Example Request:**

```
POST https://yjvrluwawbrnecaeoiax.supabase.co/functions/v1/send-promise-notification
Headers:
  Authorization: Bearer {{JWT}}
  Content-Type: application/json
Body:
{
  "type": "created",
  "promise_text": "Test Promise",
  "owner_email": "test@example.com"
}

Tests:
assert(res.status === 200)
assert(res.body.id !== undefined)
```

### **Cost:** FREE ✅ (Bruno is open source)

---

## 📱 **10. BROWSERSTACK (Cross-Browser Testing)**

### **Why BrowserStack?**
✅ Test on real devices  
✅ iOS Safari, Android Chrome  
✅ Old browser versions  
✅ Screenshots & videos  

### **Setup:**

```bash
# Sign up at https://www.browserstack.com/
# FREE for open source projects

# Or use Playwright with BrowserStack
npm install -D @browserstack/playwright-browserstack
```

### **Cost:** 
- FREE for open source
- $29/month for paid plans

### **Free Alternative:**
- **LambdaTest** (100 min/month free)
- **Sauce Labs** (open source free)

---

## 🎯 **RECOMMENDED SETUP FOR PROMYSR**

### **Phase 1: Essential (Start Here)**
```bash
# 1. Install Playwright for E2E
npm install -D @playwright/test
npx playwright install

# 2. Install Vitest for unit tests
npm install -D vitest @testing-library/react

# 3. Add Sentry for error tracking
npm install @sentry/react

# 4. Add Vercel Analytics
npm install @vercel/analytics
```

### **Phase 2: Email Testing**
```bash
# Use Resend's built-in sandbox mode
# OR sign up for Mailtrap (free tier)
```

### **Phase 3: CI/CD**
```bash
# Add GitHub Actions for automated testing
# .github/workflows/test.yml
```

---

## 📋 **Testing Tools Comparison**

| Tool | Purpose | Cost | Setup Time | Priority |
|------|---------|------|------------|----------|
| **Playwright** | E2E Testing | FREE | 30 min | 🔴 High |
| **Vitest** | Unit Tests | FREE | 20 min | 🔴 High |
| **Mailtrap** | Email Testing | FREE | 10 min | 🟡 Medium |
| **Lighthouse** | Performance | FREE | 15 min | 🟡 Medium |
| **Sentry** | Error Tracking | FREE | 15 min | 🔴 High |
| **Vercel Analytics** | RUM | FREE | 5 min | 🟡 Medium |
| **React DevTools** | Debugging | FREE | 2 min | 🔴 High |
| **Chrome DevTools** | Debugging | FREE | 0 min | 🔴 High |
| **Bruno/Postman** | API Testing | FREE | 20 min | 🟢 Low |
| **BrowserStack** | Cross-Browser | $29/mo | 30 min | 🟢 Low |

---

## 🚀 **Quick Start Script**

```bash
#!/bin/bash
# setup-testing.sh

echo "🧪 Setting up PromySr Testing Tools..."

# Install Playwright
npm install -D @playwright/test
npx playwright install chromium

# Install Vitest
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom

# Install Sentry
npm install @sentry/react

# Install Vercel Analytics
npm install @vercel/analytics

# Create test directories
mkdir -p tests/e2e
mkdir -p tests/unit
mkdir -p src/components/__tests__

echo "✅ Testing tools installed!"
echo ""
echo "Next steps:"
echo "1. Run: npx playwright test"
echo "2. Run: npm test"
echo "3. Configure Sentry DSN in main.tsx"
```

---

## 📚 **Resources**

- **Playwright Docs:** https://playwright.dev
- **Vitest Docs:** https://vitest.dev
- **Mailtrap:** https://mailtrap.io
- **Sentry:** https://sentry.io
- **Lighthouse:** https://developer.chrome.com/docs/lighthouse

---

**Total Cost for Full Stack:** $0/month (using free tiers) 🎉

Would you like me to help you set up any of these tools?
