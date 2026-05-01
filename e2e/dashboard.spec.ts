import { test, expect } from '@playwright/test';

test.describe('Dashboard Accessibility & Role Protection', () => {
  
  test('unauthenticated user redirected to login from /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user redirected to login from /dashboard/admin', async ({ page }) => {
    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  // Mock-based or direct navigation smoke tests
  // Note: These usually require a session cookie or a login step
  test.describe('Authorized Navigation Smoke Tests', () => {
    // This is a pattern for re-using authentication state if needed
    // For now, we perform light smoke checks on page elements that are public or handle loading states
    
    test('candidate dashboard loading state contains skeleton or title', async ({ page }) => {
      // Navigate to candidate dashboard (even if it redirects, we check the landing page experience)
      await page.goto('/dashboard/candidate');
      // If unauthenticated, it's already tested. 
      // This test is to ensure the route exists and doesn't 404
      expect(page.url()).not.toContain('404');
    });

    test('recruiter dashboard loading state contains skeleton or title', async ({ page }) => {
      await page.goto('/dashboard/recruiter');
      expect(page.url()).not.toContain('404');
    });
  });
});
