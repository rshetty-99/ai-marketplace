import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * E2E Test: User Registration Flow
 * Tests the complete user registration and onboarding process
 */

test.describe('User Registration Flow', () => {
  let page: Page;
  let testUser: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    organizationName: string;
    industry: string;
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Generate test user data
    testUser = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: 'TestPassword123!',
      organizationName: faker.company.name(),
      industry: 'technology',
    };
    
    // Start at homepage
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should complete successful user registration and onboarding', async () => {
    // Step 1: Navigate to registration
    await test.step('Navigate to registration page', async () => {
      await page.getByRole('link', { name: /sign up|register/i }).click();
      await expect(page).toHaveURL(/sign-up/);
      
      // Verify registration form is visible
      await expect(page.getByRole('heading', { name: /create account|sign up/i })).toBeVisible();
    });

    // Step 2: Fill out registration form
    await test.step('Fill out registration form', async () => {
      // Fill personal information
      await page.getByLabel(/first name/i).fill(testUser.firstName);
      await page.getByLabel(/last name/i).fill(testUser.lastName);
      await page.getByLabel(/email/i).fill(testUser.email);
      await page.getByLabel(/^password$/i).fill(testUser.password);
      await page.getByLabel(/confirm password/i).fill(testUser.password);
      
      // Accept terms and conditions
      await page.getByLabel(/terms and conditions|terms of service/i).check();
      await page.getByLabel(/privacy policy/i).check();
      
      // Submit registration form
      await page.getByRole('button', { name: /create account|sign up/i }).click();
    });

    // Step 3: Handle email verification (if required)
    await test.step('Handle email verification', async () => {
      // Check if we're on email verification page
      const currentUrl = page.url();
      if (currentUrl.includes('verify-email') || currentUrl.includes('verification')) {
        // In real tests, you might use a test email service or mock
        // For this example, we'll simulate clicking a verification link
        await expect(page.getByText(/verify your email/i)).toBeVisible();
        
        // Mock email verification (in real tests, check email or use test API)
        await page.evaluate(() => {
          // Simulate email verification completion
          localStorage.setItem('email_verified', 'true');
        });
        
        // Navigate to next step (would normally come from email link)
        await page.goto('/onboarding');
      }
    });

    // Step 4: Organization setup
    await test.step('Complete organization setup', async () => {
      // Should be on onboarding page
      await expect(page).toHaveURL(/onboarding/);
      await expect(page.getByRole('heading', { name: /organization|company/i })).toBeVisible();
      
      // Fill organization information
      await page.getByLabel(/organization name|company name/i).fill(testUser.organizationName);
      await page.getByLabel(/industry/i).selectOption(testUser.industry);
      await page.getByLabel(/organization size|company size/i).selectOption('midmarket');
      
      // Select organization type
      await page.getByLabel(/organization type/i).selectOption('primary');
      
      // Continue to next step
      await page.getByRole('button', { name: /continue|next/i }).click();
    });

    // Step 5: Role selection
    await test.step('Select user role and permissions', async () => {
      // Should be on role selection step
      await expect(page.getByRole('heading', { name: /role|permissions/i })).toBeVisible();
      
      // Select primary role (buyer/service seeker)
      await page.getByLabel(/buyer|service seeker/i).check();
      
      // Select specific permissions/interests
      await page.getByLabel(/ai consulting/i).check();
      await page.getByLabel(/machine learning/i).check();
      await page.getByLabel(/data analytics/i).check();
      
      // Continue to final step
      await page.getByRole('button', { name: /continue|finish setup/i }).click();
    });

    // Step 6: Verify successful registration
    await test.step('Verify successful onboarding completion', async () => {
      // Should be redirected to dashboard
      await expect(page).toHaveURL(/dashboard/);
      
      // Check for welcome message or dashboard elements
      await expect(page.getByText(/welcome|dashboard/i)).toBeVisible();
      
      // Verify user profile elements
      await expect(page.getByText(testUser.firstName)).toBeVisible();
      await expect(page.getByText(testUser.organizationName)).toBeVisible();
      
      // Check navigation elements
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('link', { name: /browse services|marketplace/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    });

    // Step 7: Verify user can access marketplace
    await test.step('Verify marketplace access', async () => {
      // Navigate to marketplace
      await page.getByRole('link', { name: /browse services|marketplace|catalog/i }).click();
      await expect(page).toHaveURL(/catalog|marketplace/);
      
      // Verify marketplace elements are visible
      await expect(page.getByRole('heading', { name: /ai services|marketplace/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /search/i })).toBeVisible();
      
      // Verify user can see service listings
      await expect(page.getByTestId('service-grid')).toBeVisible();
    });
  });

  test('should show validation errors for invalid registration data', async () => {
    await test.step('Navigate to registration page', async () => {
      await page.getByRole('link', { name: /sign up|register/i }).click();
    });

    await test.step('Submit form with invalid data', async () => {
      // Try to submit empty form
      await page.getByRole('button', { name: /create account|sign up/i }).click();
      
      // Verify validation errors are shown
      await expect(page.getByText(/required/i)).toBeVisible();
    });

    await test.step('Test invalid email format', async () => {
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/first name/i).click(); // Trigger validation
      
      await expect(page.getByText(/invalid email|valid email/i)).toBeVisible();
    });

    await test.step('Test password strength requirements', async () => {
      await page.getByLabel(/^password$/i).fill('weak');
      await page.getByLabel(/confirm password/i).click(); // Trigger validation
      
      await expect(page.getByText(/password.*strong|8 characters/i)).toBeVisible();
    });

    await test.step('Test password confirmation mismatch', async () => {
      await page.getByLabel(/^password$/i).fill('StrongPassword123!');
      await page.getByLabel(/confirm password/i).fill('DifferentPassword123!');
      await page.getByLabel(/email/i).click(); // Trigger validation
      
      await expect(page.getByText(/passwords.*match/i)).toBeVisible();
    });
  });

  test('should handle email already exists error', async () => {
    await test.step('Navigate to registration page', async () => {
      await page.getByRole('link', { name: /sign up|register/i }).click();
    });

    await test.step('Submit form with existing email', async () => {
      // Use a common test email that should already exist
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/email/i).fill('existing@example.com');
      await page.getByLabel(/^password$/i).fill('TestPassword123!');
      await page.getByLabel(/confirm password/i).fill('TestPassword123!');
      await page.getByLabel(/terms and conditions/i).check();
      await page.getByLabel(/privacy policy/i).check();
      
      await page.getByRole('button', { name: /create account|sign up/i }).click();
      
      // Should show error message about existing email
      await expect(page.getByText(/email.*already exists|already registered/i)).toBeVisible();
    });
  });

  test('should redirect authenticated users away from registration', async () => {
    await test.step('Simulate authenticated user', async () => {
      // Mock authentication state
      await page.evaluate(() => {
        localStorage.setItem('__clerk_session', JSON.stringify({
          isSignedIn: true,
          userId: 'existing-user-id',
        }));
      });
    });

    await test.step('Try to access registration page', async () => {
      await page.goto('/sign-up');
      
      // Should be redirected to dashboard
      await expect(page).toHaveURL(/dashboard/);
    });
  });

  test('should support social media registration', async () => {
    await test.step('Navigate to registration page', async () => {
      await page.getByRole('link', { name: /sign up|register/i }).click();
    });

    await test.step('Verify social login options', async () => {
      // Check for social login buttons
      await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /microsoft|outlook/i })).toBeVisible();
      
      // Click Google signup (would need to mock OAuth in real tests)
      await page.getByRole('button', { name: /google/i }).click();
      
      // In a real test environment, you would:
      // 1. Mock the OAuth provider response
      // 2. Handle the OAuth redirect flow
      // 3. Verify the user is created and redirected properly
    });
  });

  test('should handle network errors gracefully', async () => {
    await test.step('Navigate to registration page', async () => {
      await page.getByRole('link', { name: /sign up|register/i }).click();
    });

    await test.step('Simulate network failure during registration', async () => {
      // Mock network failure
      await page.route('/api/auth/signup', route => {
        route.abort('failed');
      });

      // Fill and submit form
      await page.getByLabel(/first name/i).fill(testUser.firstName);
      await page.getByLabel(/last name/i).fill(testUser.lastName);
      await page.getByLabel(/email/i).fill(testUser.email);
      await page.getByLabel(/^password$/i).fill(testUser.password);
      await page.getByLabel(/confirm password/i).fill(testUser.password);
      await page.getByLabel(/terms and conditions/i).check();
      await page.getByLabel(/privacy policy/i).check();
      
      await page.getByRole('button', { name: /create account|sign up/i }).click();
      
      // Should show network error message
      await expect(page.getByText(/network error|connection|try again/i)).toBeVisible();
    });

    await test.step('Verify retry functionality', async () => {
      // Remove network mock
      await page.unroute('/api/auth/signup');
      
      // Click retry or try again
      await page.getByRole('button', { name: /try again|retry/i }).click();
      
      // Should proceed normally (or at least not show network error)
      await expect(page.getByText(/network error|connection/i)).not.toBeVisible();
    });
  });

  test('should maintain form state during navigation', async () => {
    await test.step('Navigate to registration page', async () => {
      await page.getByRole('link', { name: /sign up|register/i }).click();
    });

    await test.step('Fill partial form data', async () => {
      await page.getByLabel(/first name/i).fill(testUser.firstName);
      await page.getByLabel(/last name/i).fill(testUser.lastName);
      await page.getByLabel(/email/i).fill(testUser.email);
    });

    await test.step('Navigate away and back', async () => {
      // Navigate to login page
      await page.getByRole('link', { name: /sign in|login/i }).click();
      
      // Navigate back to registration
      await page.getByRole('link', { name: /sign up|register/i }).click();
      
      // Form should maintain previous values (if implemented with proper state management)
      const firstName = await page.getByLabel(/first name/i).inputValue();
      const lastName = await page.getByLabel(/last name/i).inputValue();
      const email = await page.getByLabel(/email/i).inputValue();
      
      // Note: This behavior depends on implementation
      // Some apps clear form state, others maintain it
      if (firstName) {
        expect(firstName).toBe(testUser.firstName);
        expect(lastName).toBe(testUser.lastName);
        expect(email).toBe(testUser.email);
      }
    });
  });

  test('should be accessible with keyboard navigation', async () => {
    await test.step('Navigate to registration page', async () => {
      await page.getByRole('link', { name: /sign up|register/i }).click();
    });

    await test.step('Test keyboard navigation through form', async () => {
      // Start at first input
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/first name/i)).toBeFocused();
      
      // Tab through all form fields
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/last name/i)).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/email/i)).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/^password$/i)).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/confirm password/i)).toBeFocused();
      
      // Test that Enter can submit form
      await page.keyboard.press('Enter');
      // Should show validation errors since form is empty
      await expect(page.getByText(/required/i)).toBeVisible();
    });
  });

  test('should display proper loading states during registration', async () => {
    await test.step('Navigate to registration page', async () => {
      await page.getByRole('link', { name: /sign up|register/i }).click();
    });

    await test.step('Fill form and verify loading state', async () => {
      // Mock slow network response
      await page.route('/api/auth/signup', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, userId: 'new-user-id' }),
        });
      });

      // Fill form
      await page.getByLabel(/first name/i).fill(testUser.firstName);
      await page.getByLabel(/last name/i).fill(testUser.lastName);
      await page.getByLabel(/email/i).fill(testUser.email);
      await page.getByLabel(/^password$/i).fill(testUser.password);
      await page.getByLabel(/confirm password/i).fill(testUser.password);
      await page.getByLabel(/terms and conditions/i).check();
      await page.getByLabel(/privacy policy/i).check();
      
      // Submit form
      const submitButton = page.getByRole('button', { name: /create account|sign up/i });
      await submitButton.click();
      
      // Verify loading state
      await expect(submitButton).toBeDisabled();
      await expect(page.getByText(/creating account|signing up|loading/i)).toBeVisible();
      
      // Wait for completion
      await expect(page.getByText(/creating account|signing up|loading/i)).not.toBeVisible({ timeout: 5000 });
    });
  });
});

// Test helper functions
async function mockApiResponse(page: Page, endpoint: string, response: any, delay = 0) {
  await page.route(endpoint, async route => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

async function mockApiError(page: Page, endpoint: string, statusCode = 500, errorMessage = 'Internal Server Error') {
  await page.route(endpoint, route => {
    route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          type: 'ServerError',
          message: errorMessage,
        },
      }),
    });
  });
}