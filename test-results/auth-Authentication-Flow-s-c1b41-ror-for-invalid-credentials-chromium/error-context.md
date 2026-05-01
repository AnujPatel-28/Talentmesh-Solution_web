# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> should show error for invalid credentials
- Location: e2e\auth.spec.ts:17:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]')
    - locator resolved to <button type="submit" class="login_submitBtn__cFa2K">Sign In</button>

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - link "TalentMesh" [ref=e4] [cursor=pointer]:
      - /url: /
      - img "TalentMesh" [ref=e5]
    - heading "Sign in to your account" [level=1] [ref=e7]
    - generic [ref=e8]:
      - button "Google" [ref=e9] [cursor=pointer]:
        - img [ref=e10]
        - text: Google
      - button "LinkedIn" [ref=e15] [cursor=pointer]:
        - img [ref=e16]
        - text: LinkedIn
    - generic [ref=e20]: or
    - generic [ref=e22]:
      - generic [ref=e23]:
        - generic [ref=e25]: Email address
        - textbox "Email address" [ref=e27]:
          - /placeholder: name@company.com
          - text: invalid@example.com
      - generic [ref=e28]:
        - generic [ref=e29]:
          - generic [ref=e30]: Password
          - link "Forgot password?" [ref=e31] [cursor=pointer]:
            - /url: /forgot-password
        - generic [ref=e32]:
          - textbox "Password" [active] [ref=e33]:
            - /placeholder: ••••••••
            - text: wrongpassword
          - button [ref=e34] [cursor=pointer]:
            - img [ref=e35]
      - button "Sign In" [ref=e38] [cursor=pointer]
    - generic [ref=e39]:
      - paragraph [ref=e40]:
        - text: Don't have an account?
        - link "Sign up" [ref=e41] [cursor=pointer]:
          - /url: /signup
      - paragraph [ref=e42]:
        - text: Need to verify your account?
        - button "Verify email" [ref=e43] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e49] [cursor=pointer]:
    - img [ref=e50]
  - alert [ref=e53]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Authentication Flow', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Standard mock for session - unauthenticated by default
  6   |     await page.route('**/api/auth/session', async route => {
  7   |       await route.fulfill({ 
  8   |         status: 200, 
  9   |         contentType: 'application/json', 
  10  |         body: JSON.stringify({ user: null }) 
  11  |       });
  12  |     });
  13  | 
  14  |     await page.goto('/login');
  15  |   });
  16  | 
  17  |   test('should show error for invalid credentials', async ({ page }) => {
  18  |     // Mock auth failure - catch the specific sessions endpoint
  19  |     await page.route('**/api/auth/**', async route => {
  20  |       await route.fulfill({
  21  |         status: 400,
  22  |         contentType: 'application/json',
  23  |         body: JSON.stringify({ 
  24  |           error: 'invalid_grant', 
  25  |           message: 'Invalid login credentials' 
  26  |         })
  27  |       });
  28  |     });
  29  | 
  30  |     await page.fill('#email', 'invalid@example.com');
  31  |     await page.fill('#password', 'wrongpassword');
> 32  |     await page.click('button[type="submit"]');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  33  | 
  34  |     // Wait for error message using test-id
  35  |     const error = page.getByTestId('login-error');
  36  |     await expect(error).toBeVisible({ timeout: 15000 });
  37  |     await expect(error).toContainText(/Invalid email or password/i);
  38  |   });
  39  | 
  40  |   test('should redirect unauthenticated users from protected routes', async ({ page }) => {
  41  |     // Override session mock to 401
  42  |     await page.route('**/api/auth/session', async route => {
  43  |       await route.fulfill({ 
  44  |         status: 401, 
  45  |         contentType: 'application/json', 
  46  |         body: JSON.stringify({ error: 'Unauthorized' }) 
  47  |       });
  48  |     });
  49  |     
  50  |     await page.goto('/dashboard/candidate/some-id');
  51  |     // The client-side guard should trigger
  52  |     await page.waitForURL(/\/login/, { timeout: 10000 });
  53  |     await expect(page).toHaveURL(/\/login/);
  54  |   });
  55  | 
  56  |   test('successful login and redirection (role: candidate)', async ({ page }) => {
  57  |     const mockUserId = 'cand_123';
  58  |     
  59  |     // Mock Auth Success
  60  |     await page.route('**/api/auth/**', async route => {
  61  |       if (route.request().method() === 'POST' && !route.request().url().includes('session')) {
  62  |         await route.fulfill({
  63  |           status: 200,
  64  |           contentType: 'application/json',
  65  |           body: JSON.stringify({ 
  66  |             user: { id: mockUserId, email: 'candidate@test.com' },
  67  |             access_token: 'fake-token'
  68  |           })
  69  |         });
  70  |       } else {
  71  |         route.continue();
  72  |       }
  73  |     });
  74  | 
  75  |     // Mock internal session persistence
  76  |     await page.route('**/api/auth/session', async route => {
  77  |       if (route.request().method() === 'POST') {
  78  |         await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
  79  |       } else {
  80  |         await route.fulfill({ 
  81  |           status: 200, 
  82  |           body: JSON.stringify({ user: { id: mockUserId, role: 'candidate' } }) 
  83  |         });
  84  |       }
  85  |     });
  86  | 
  87  |     // Mock Profile API
  88  |     await page.route('**/rest/v1/candidate_profiles*', async route => {
  89  |       console.log('INTERCEPTED candidate_profiles request');
  90  |       await route.fulfill({
  91  |         status: 200,
  92  |         contentType: 'application/json',
  93  |         body: JSON.stringify({
  94  |           id: mockUserId,
  95  |           email: 'candidate@test.com',
  96  |           role: 'candidate',
  97  |           name: 'Test User',
  98  |           completed_onboarding: true
  99  |         }),
  100 |       });
  101 |     });
  102 | 
  103 |     await page.fill('#email', 'candidate@test.com');
  104 |     await page.fill('#password', 'password123');
  105 |     await page.click('button[type="submit"]');
  106 | 
  107 |     // Should redirect to dashboard
  108 |     await page.waitForURL(new RegExp(`dashboard/candidate/${mockUserId}`), { timeout: 15000 });
  109 |     await expect(page).toHaveURL(new RegExp(`dashboard/candidate/${mockUserId}`));
  110 |   });
  111 | });
  112 | 
```