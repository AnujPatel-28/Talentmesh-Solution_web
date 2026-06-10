import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show error for invalid credentials', async ({ page }) => {
    // 1. Mock session as unauthenticated
    await page.route('**/api/auth/session', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, body: JSON.stringify({ user: null }) });
      } else {
        route.continue();
      }
    });

    // 2. Mock auth failure
    await page.route('**/api/auth/sessions', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', message: 'Invalid credentials' })
      });
    });

    await page.goto('/login');
    await page.fill('#email', 'invalid@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    const error = page.getByTestId('login-error');
    await expect(error).toBeVisible({ timeout: 10000 });
    await expect(error).toContainText(/Invalid/i);
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Mock session as 401
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) });
    });
    
    await page.goto('/dashboard/candidate/some-id');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('successful login and redirection (role: candidate)', async ({ page, baseURL }) => {
    const mockUserId = 'cand-uuid-123';
    
    // 1. Mock session as initially null
    let sessionUser: any = null;
    await page.route('**/api/auth/session', async route => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        sessionUser = { id: body.user.id, role: body.role };
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify({ user: sessionUser }) });
      }
    });

    // 2. Mock Auth Success
    await page.route('**/api/auth/sessions', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          user: { id: mockUserId, email: 'candidate@test.com' },
          access_token: 'fake-token'
        })
      });
    });

    // 3. Mock Profile API
    await page.route('**/rest/v1/candidate_profiles*', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: mockUserId,
          email: 'candidate@test.com',
          role: 'candidate',
          name: 'Test User',
          completed_onboarding: true
        }),
      });
    });

    const loginUrl = baseURL ? baseURL.replace('://', '://jobs.') + '/login' : '/login';
    await page.goto(loginUrl);
    await page.fill('#email', 'candidate@test.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/jobs\.localhost:3000\/dashboard|dashboard\/candidate/, { timeout: 15000 });
    await expect(page).toHaveURL(/jobs\.localhost:3000\/dashboard|dashboard\/candidate/);
  });
});
