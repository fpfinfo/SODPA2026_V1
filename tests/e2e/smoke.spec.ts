import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('App should load successfully', async ({ page }) => {
    // Navigate to the app root
    await page.goto('/');

    // Check if we are redirected to login or see the landing page
    // Assuming there is a title or specific element on the login page
    await expect(page).toHaveTitle(/SOSFU/);
    
    // Check for main container or loading state
    await expect(page.locator('body')).toBeVisible();
  });

  test('Login page should display login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check for email input field
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Check for password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });
});
