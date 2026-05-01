# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> successful login and redirection (role: candidate)
- Location: e2e\auth.spec.ts:56:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:3000/login"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
    - alert [ref=e22]: "Network request failed: Failed to fetch"
    - generic [ref=e23]:
      - generic [ref=e24]:
        - generic [ref=e26]: Email address
        - textbox "Email address" [ref=e28]:
          - /placeholder: name@company.com
          - text: candidate@test.com
      - generic [ref=e29]:
        - generic [ref=e30]:
          - generic [ref=e31]: Password
          - link "Forgot password?" [ref=e32] [cursor=pointer]:
            - /url: /forgot-password
        - generic [ref=e33]:
          - textbox "Password" [ref=e34]:
            - /placeholder: ••••••••
            - text: password123
          - button [ref=e35] [cursor=pointer]:
            - img [ref=e36]
      - button "Sign In" [ref=e39] [cursor=pointer]
    - generic [ref=e40]:
      - paragraph [ref=e41]:
        - text: Don't have an account?
        - link "Sign up" [ref=e42] [cursor=pointer]:
          - /url: /signup
      - paragraph [ref=e43]:
        - text: Need to verify your account?
        - button "Verify email" [ref=e44] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e50] [cursor=pointer]:
    - img [ref=e51]
  - alert [ref=e54]: Sign in to your account
```

# Test source

```ts
  8  |         await route.fulfill({ status: 200, body: JSON.stringify({ user: null }) });
  9  |       } else {
  10 |         route.continue();
  11 |       }
  12 |     });
  13 | 
  14 |     // 2. Mock auth failure
  15 |     await page.route('**/api/auth/sessions', async route => {
  16 |       await route.fulfill({
  17 |         status: 400,
  18 |         contentType: 'application/json',
  19 |         body: JSON.stringify({ error: 'invalid_grant', message: 'Invalid credentials' })
  20 |       });
  21 |     });
  22 | 
  23 |     await page.goto('/login');
  24 |     await page.fill('#email', 'invalid@example.com');
  25 |     await page.fill('#password', 'wrongpassword');
  26 |     await page.click('button[type="submit"]');
  27 | 
  28 |     const error = page.getByTestId('login-error');
  29 |     await expect(error).toBeVisible({ timeout: 10000 });
  30 |     await expect(error).toContainText(/Invalid/i);
  31 |   });
  32 | 
  33 |   test('should redirect unauthenticated users from protected routes', async ({ page }) => {
  34 |     // Mock session as 401
  35 |     await page.route('**/api/auth/session', async route => {
  36 |       await route.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) });
  37 |     });
  38 |     
  39 |     await page.goto('/dashboard/candidate/some-id');
  40 |     await page.waitForURL(/\/login/, { timeout: 10000 });
  41 |     await expect(page).toHaveURL(/\/login/);
  42 |   });
  43 | 
  44 |   test('successful login and redirection (role: candidate)', async ({ page }) => {
  45 |     const mockUserId = 'cand-uuid-123';
  46 |     
  47 |     // 1. Mock session as initially null
  48 |     let sessionUser: any = null;
  49 |     await page.route('**/api/auth/session', async route => {
  50 |       if (route.request().method() === 'POST') {
  51 |         const body = JSON.parse(route.request().postData() || '{}');
  52 |         sessionUser = { id: body.user.id, role: body.role };
  53 |         await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
  54 |       } else {
  55 |         await route.fulfill({ status: 200, body: JSON.stringify({ user: sessionUser }) });
  56 |       }
  57 |     });
  58 | 
  59 |     // 2. Mock Auth Success
  60 |     await page.route('**/api/auth/sessions', async route => {
  61 |       await route.fulfill({
  62 |         status: 200,
  63 |         body: JSON.stringify({ 
  64 |           user: { id: mockUserId, email: 'candidate@test.com' },
  65 |           access_token: 'fake-token'
  66 |         })
  67 |       });
  68 |     });
  69 | 
  70 |     // 3. Mock Profile API
  71 |     await page.route('**/rest/v1/candidate_profiles*', async route => {
  72 |       await route.fulfill({
  73 |         status: 200,
  74 |         body: JSON.stringify({
  75 |           id: mockUserId,
  76 |           email: 'candidate@test.com',
  77 |           role: 'candidate',
  78 |           name: 'Test User',
  79 |           completed_onboarding: true
  80 |         }),
  81 |       });
  82 |     });
  83 | 
  84 |     await page.goto('/login');
  85 |     await page.fill('#email', 'candidate@test.com');
  86 |     await page.fill('#password', 'password123');
  87 |     await page.click('button[type="submit"]');
  88 | 
  89 |     await page.waitForURL(new RegExp(`dashboard/candidate/${mockUserId}`), { timeout: 15000 });
  90 |     await expect(page).toHaveURL(new RegExp(`dashboard/candidate/${mockUserId}`));
  91 |   });
  92 | });
  93 | 
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
```