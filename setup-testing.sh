#!/bin/bash

# PromySr - Testing Tools Setup Script
# This script installs and configures all recommended testing tools

echo "🧪 PromySr Testing Tools Setup"
echo "=============================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

echo "📦 Installing testing dependencies..."
echo ""

# 1. Playwright (E2E Testing)
echo "1/5 Installing Playwright..."
npm install -D @playwright/test
npx playwright install chromium --with-deps

# 2. Vitest (Unit Testing)
echo "2/5 Installing Vitest..."
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event

# 3. Sentry (Error Tracking)
echo "3/5 Installing Sentry..."
npm install @sentry/react

# 4. Vercel Analytics
echo "4/5 Installing Vercel Analytics..."
npm install @vercel/analytics

# 5. Coverage tools
echo "5/5 Installing coverage tools..."
npm install -D @vitest/coverage-v8

echo ""
echo "📁 Creating test directories..."
mkdir -p tests/e2e
mkdir -p tests/unit
mkdir -p src/components/__tests__

echo ""
echo "📝 Creating configuration files..."

# Create Playwright config
cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
EOF

# Create Vitest config
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
EOF

# Create test setup file
cat > tests/setup.ts << 'EOF'
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
EOF

# Create example E2E test
cat > tests/e2e/auth.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test('should load login page', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle(/PromySr/);
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

test('should navigate to signup', async ({ page }) => {
  await page.goto('/login');
  await page.click('text=Sign Up');
  await expect(page).toHaveURL(/.*signup/);
});
EOF

# Create example unit test
cat > src/components/__tests__/example.test.tsx << 'EOF'
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// Example test - replace with actual component
describe('Example Test', () => {
  it('should render', () => {
    const { container } = render(<div>Hello World</div>);
    expect(container.textContent).toBe('Hello World');
  });
});
EOF

# Update package.json scripts
echo ""
echo "📝 Updating package.json scripts..."

# Check if jq is installed
if command -v jq &> /dev/null; then
    # Use jq to update package.json
    jq '.scripts += {
      "test": "vitest",
      "test:ui": "vitest --ui",
      "test:coverage": "vitest --coverage",
      "test:e2e": "playwright test",
      "test:e2e:ui": "playwright test --ui",
      "test:e2e:report": "playwright show-report"
    }' package.json > package.json.tmp && mv package.json.tmp package.json
else
    echo "⚠️  jq not installed. Please manually add these scripts to package.json:"
    echo '  "test": "vitest",'
    echo '  "test:ui": "vitest --ui",'
    echo '  "test:coverage": "vitest --coverage",'
    echo '  "test:e2e": "playwright test",'
    echo '  "test:e2e:ui": "playwright test --ui",'
    echo '  "test:e2e:report": "playwright show-report"'
fi

echo ""
echo "✅ Testing tools setup complete!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure Sentry (optional):"
echo "   - Sign up at https://sentry.io"
echo "   - Get your DSN"
echo "   - Add to src/main.tsx:"
echo "     import * as Sentry from '@sentry/react';"
echo "     Sentry.init({ dsn: 'YOUR_DSN' });"
echo ""
echo "2. Add Vercel Analytics to src/App.tsx:"
echo "   import { Analytics } from '@vercel/analytics/react';"
echo "   <Analytics />"
echo ""
echo "3. Run tests:"
echo "   npm test              # Unit tests"
echo "   npm run test:e2e      # E2E tests"
echo "   npm run test:coverage # Coverage report"
echo ""
echo "4. Set up email testing:"
echo "   - Sign up at https://mailtrap.io (free)"
echo "   - Or use Resend sandbox mode"
echo ""
echo "📚 Documentation:"
echo "   - Playwright: https://playwright.dev"
echo "   - Vitest: https://vitest.dev"
echo "   - Testing Guide: .gemini/antigravity/brain/.../Testing-Tools-Guide.md"
echo ""
echo "🎉 Happy testing!"
