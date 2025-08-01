import { test, expect } from '@playwright/test';

test('complete padel registration flow', async ({ page }) => {
  console.log('Starting registration test...');
  
  // Navigate to homepage
  await page.goto('/');
  console.log('Navigated to homepage');
  
  // Wait for page to load and check if content is visible
  await page.waitForLoadState('networkidle');
  console.log('Page loaded');
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'test-results/homepage.png' });
  
  await expect(page.getByText('Inschrijven voor wekelijkse padellessen')).toBeVisible({ timeout: 15000 });
  console.log('Homepage content visible');
  
  // Click the registration button at the bottom
  await page.getByRole('link', { name: 'Schrijf in voor Padel Les!' }).click();
  console.log('Clicked registration button');
  
  // Should be on registration page
  await expect(page.getByText('Stap 1: Persoonlijke Gegevens')).toBeVisible({ timeout: 10000 });
  console.log('On registration page Step 1');
  
  // Fill in Step 1 - Personal details
  await page.getByPlaceholder('Voornaam').fill('Test');
  await page.getByPlaceholder('Achternaam').fill('User');
  await page.getByPlaceholder('team@email.com').fill('test@playwright.com');
  console.log('Filled contact person details');
  
  // Add a team member
  await page.getByRole('button', { name: 'Teamlid toevoegen' }).click();
  console.log('Added team member');
  
  // Fill team member details
  await page.locator('input[placeholder="Voornaam"]').nth(1).fill('Team');
  await page.locator('input[placeholder="Achternaam"]').nth(1).fill('Member');
  await page.locator('input[placeholder="E-mail (optioneel)"]').fill('member@playwright.com');
  console.log('Filled team member details');
  
  // Take screenshot before going to step 2
  await page.screenshot({ path: 'test-results/step1-completed.png' });
  
  // Click Next to go to Step 2
  await page.getByRole('button', { name: 'Volgende' }).click();
  console.log('Clicked Next to Step 2');
  
  // Should be on Step 2 - Timeslot selection
  await expect(page.getByText('Stap 2: Tijdslot Voorkeuren')).toBeVisible();
  
  // Wait for timeslots to load
  await page.waitForSelector('[data-testid="timeslot-button"]', { timeout: 10000 });
  
  // Select 4 timeslots (maximum allowed)
  const timeslotButtons = page.locator('[data-testid="timeslot-button"]');
  const count = await timeslotButtons.count();
  
  console.log(`Found ${count} timeslots`);
  
  // Select first 4 timeslots
  for (let i = 0; i < Math.min(4, count); i++) {
    await timeslotButtons.nth(i).click();
    await page.waitForTimeout(200); // Small delay between clicks
  }
  
  // Click Next to go to Step 3
  await page.getByRole('button', { name: 'Volgende' }).click();
  
  // Should be on Step 3 - Confirmation
  await expect(page.getByText('Stap 3: Bevestiging')).toBeVisible();
  
  // Verify the data is displayed correctly
  await expect(page.getByText('Test User')).toBeVisible();
  await expect(page.getByText('test@playwright.com')).toBeVisible();
  
  // Submit the registration
  await page.getByRole('button', { name: 'Inschrijving Bevestigen' }).click();
  
  // Wait for either success page or toast notification
  try {
    // Check for success page (Step 4)
    await expect(page.getByText('Inschrijving Gelukt!')).toBeVisible({ timeout: 15000 });
    console.log('✅ Registration completed successfully - reached success page');
  } catch (error) {
    // If success page doesn't appear, check for toast notification
    const toastSuccess = page.locator('.react-hot-toast').filter({ hasText: 'Inschrijving succesvol' });
    if (await toastSuccess.isVisible()) {
      console.log('✅ Registration completed successfully - toast notification shown');
    } else {
      // Check for any error messages
      const toastError = page.locator('.react-hot-toast').filter({ hasText: 'fout' });
      if (await toastError.isVisible()) {
        const errorText = await toastError.textContent();
        console.log('❌ Registration failed with error:', errorText);
        throw new Error(`Registration failed: ${errorText}`);
      } else {
        console.log('❌ Registration status unclear - no success or error message found');
        throw error;
      }
    }
  }
});

test('homepage displays correctly', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load completely
  await page.waitForLoadState('networkidle');
  
  // Check main elements
  await expect(page.getByText('Inschrijven voor wekelijkse padellessen')).toBeVisible({ timeout: 10000 });
  
  // Check feature cards
  await expect(page.getByText('Team Vorming')).toBeVisible();
  await expect(page.getByText('Tijdsloten')).toBeVisible();
  await expect(page.getByText('Eerlijke Loting')).toBeVisible();
  await expect(page.getByText('Planning')).toBeVisible();
  
  // Check how it works section
  await expect(page.getByText('Hoe werkt het?')).toBeVisible();
  await expect(page.getByText('Inschrijven')).toBeVisible();
  await expect(page.getByText('Loting')).toBeVisible();
  await expect(page.getByText('Spelen!')).toBeVisible();
  
  // Check registration button is at the bottom
  await expect(page.getByRole('link', { name: 'Schrijf in voor Padel Les!' })).toBeVisible();
});