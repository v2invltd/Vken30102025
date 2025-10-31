import { test, expect } from '@playwright/test';

// Use a unique user object for each test file run to ensure isolation
const testUser = {
  name: 'E2E Test User',
  email: `test_${Date.now()}@example.com`,
  phone: '+254712345678',
  password: 'Password123!',
};

test.describe('V-Ken Serve Core User Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto('/');
    // The app requires a location to be selected to enable most features.
    // We'll click the "Nairobi" button in the location selector modal that appears on first load.
    await expect(page.getByRole('heading', { name: 'First, please select your city' })).toBeVisible();
    await page.getByRole('button', { name: 'Nairobi' }).click();
  });

  test('should allow a new user to register and log in successfully', async ({ page }) => {
    // 1. Start the registration process
    await page.getByRole('button', { name: 'Login / Register' }).click();
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Expect the registration form to be visible
    await expect(page.getByRole('heading', { name: 'Create an Account' })).toBeVisible();

    // 2. Fill out the registration form
    await page.getByPlaceholder('Full Name').fill(testUser.name);
    await page.getByPlaceholder('Email Address').fill(testUser.email);
    // The phone input has a country code selector; we target the national number part
    await page.getByPlaceholder('712 345 678').fill('712345678');
    await page.getByPlaceholder('Password').fill(testUser.password);
    await page.getByLabel('I agree to the Terms of Service and Privacy Policy.').check();

    // 3. Submit the form and verify the outcome
    await page.getByRole('button', { name: 'Register', exact: true }).click();
    
    // After registration, the app automatically logs the user in and should prompt for KYC.
    await expect(page.getByRole('heading', { name: 'Complete Your Profile (KYC)' })).toBeVisible();

    // For this test, we'll just close the KYC modal to confirm the underlying login state.
    await page.getByRole('dialog', { name: 'Complete Your Profile (KYC)' }).getByRole('button', { name: 'Close' }).click();

    // Final verification: The header should greet the newly registered user.
    await expect(page.getByRole('button', { name: `Welcome, ${testUser.name.split(' ')[0]}` })).toBeVisible();
  });

  test('should allow an existing user to log in and out', async ({ page }) => {
    // Step 1: Create a user to log in with. This makes the test self-contained.
    await page.getByRole('button', { name: 'Login / Register' }).click();
    await page.getByRole('button', { name: 'Register' }).click();
    await page.getByPlaceholder('Full Name').fill(testUser.name);
    await page.getByPlaceholder('Email Address').fill(testUser.email);
    await page.getByPlaceholder('712 345 678').fill('712345678');
    await page.getByPlaceholder('Password').fill(testUser.password);
    await page.getByLabel('I agree to the Terms of Service and Privacy Policy.').check();
    await page.getByRole('button', { name: 'Register', exact: true }).click();
    
    // Close the KYC modal that appears after registration
    await page.getByRole('dialog', { name: 'Complete Your Profile (KYC)' }).getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('button', { name: `Welcome, ${testUser.name.split(' ')[0]}` })).toBeVisible();

    // Step 2: Log out
    await page.getByRole('button', { name: `Welcome, ${testUser.name.split(' ')[0]}` }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('button', { name: 'Login / Register' })).toBeVisible();

    // Step 3: Log back in
    await page.getByRole('button', { name: 'Login / Register' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await page.getByPlaceholder('Email Address').fill(testUser.email);
    await page.getByPlaceholder('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Step 4: Verify successful login
    await expect(page.getByRole('button', { name: `Welcome, ${testUser.name.split(' ')[0]}` })).toBeVisible();
  });

  test('should open the AI assistant, perform a search, and show results', async ({ page }) => {
    // 1. Open the AI Assistant from the hero section
    await page.getByRole('button', { name: 'Find Services with AI' }).click();
    
    // 2. Verify the modal is open and type a query
    const aiModal = page.getByRole('dialog', { name: 'AI Service Finder' });
    await expect(aiModal).toBeVisible();
    await aiModal.getByPlaceholder('Tell us what you need...').fill('I need a plumber in Nairobi');

    // 3. Submit the AI search
    await aiModal.getByRole('button', { name: 'Find Providers' }).click();

    // 4. Verify the results
    // The AI modal should close after a successful search.
    await expect(aiModal).not.toBeVisible();
    // The search results view should be displayed with the correct category heading.
    await expect(page.getByRole('heading', { name: 'Providers for Plumbing' })).toBeVisible({ timeout: 10000 }); // Increase timeout for AI search
  });
});