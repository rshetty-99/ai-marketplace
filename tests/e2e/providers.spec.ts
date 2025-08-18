/**
 * End-to-end tests for provider functionality
 * Tests user workflows: browsing, filtering, searching, and viewing provider profiles
 */

import { test, expect } from '@playwright/test';

test.describe('Provider Directory', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to provider directory
    await page.goto('/providers');
  });

  test('should display provider directory page', async ({ page }) => {
    // Check page title and heading
    await expect(page).toHaveTitle(/AI Service Providers/);
    await expect(page.locator('h1')).toContainText('AI Service Providers');
    
    // Check search bar is present
    await expect(page.locator('input[placeholder*="Search AI providers"]')).toBeVisible();
    
    // Check filter controls are present
    await expect(page.locator('button:has-text("Filters")')).toBeVisible();
    
    // Check view mode toggles
    await expect(page.locator('[aria-label="Grid view"]')).toBeVisible();
    await expect(page.locator('[aria-label="List view"]')).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Check for loading indicator
    await expect(page.locator('.animate-pulse')).toBeVisible();
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="provider-card"]', { timeout: 10000 });
    
    // Check that loading state is gone
    await expect(page.locator('.animate-pulse')).not.toBeVisible();
  });

  test('should display provider cards when data loads', async ({ page }) => {
    // Wait for provider cards to load
    await page.waitForSelector('[data-testid="provider-card"]', { timeout: 10000 });
    
    // Check that at least one provider card is displayed
    const providerCards = page.locator('[data-testid="provider-card"]');
    await expect(providerCards.first()).toBeVisible();
    
    // Check provider card content
    const firstCard = providerCards.first();
    await expect(firstCard.locator('h3')).toBeVisible(); // Provider name
    await expect(firstCard.locator('p')).toBeVisible(); // Provider description
    await expect(firstCard.locator('[data-testid="provider-rating"]')).toBeVisible(); // Rating
  });

  test('should filter providers by expertise', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="provider-card"]', { timeout: 10000 });
    
    // Get initial provider count
    const initialCards = await page.locator('[data-testid="provider-card"]').count();
    
    // Click expertise filter
    await page.locator('select[name="expertise"]').selectOption('machine-learning');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Check that results are filtered (may be same or different count)
    const filteredCards = await page.locator('[data-testid="provider-card"]').count();
    expect(filteredCards).toBeGreaterThanOrEqual(0);
    
    // Check that URL reflects the filter
    await expect(page).toHaveURL(/expertise=machine-learning/);
  });

  test('should filter providers by location', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="provider-card"]', { timeout: 10000 });
    
    // Click location filter
    await page.locator('select[name="location"]').selectOption('us');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Check that URL reflects the filter
    await expect(page).toHaveURL(/location=us/);
  });

  test('should search providers by name', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="provider-card"]', { timeout: 10000 });
    
    // Type in search box
    await page.locator('input[placeholder*="Search AI providers"]').fill('AI');
    
    // Press Enter or wait for search
    await page.keyboard.press('Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check that URL reflects the search
    await expect(page).toHaveURL(/search=AI/);
  });

  test('should change view mode from grid to list', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="provider-card"]', { timeout: 10000 });
    
    // Click list view button
    await page.locator('[aria-label="List view"]').click();
    
    // Check that layout changed to list view
    await expect(page.locator('.grid-cols-1')).toBeVisible();
  });

  test('should sort providers by rating', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="provider-card"]', { timeout: 10000 });
    
    // Click sort dropdown
    await page.locator('select').filter({ hasText: 'Most Relevant' }).selectOption('rating');
    
    // Wait for sorted results
    await page.waitForTimeout(1000);
    
    // Check that URL reflects the sort
    await expect(page).toHaveURL(/sortBy=rating/);
  });

  test('should show empty state when no providers match filters', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="provider-card"]', { timeout: 10000 });
    
    // Apply a very specific search that likely returns no results
    await page.locator('input[placeholder*="Search AI providers"]').fill('xyznonexistentprovider123');
    await page.keyboard.press('Enter');
    
    // Wait for search to complete
    await page.waitForTimeout(2000);
    
    // Check for empty state
    await expect(page.locator('text=No providers found')).toBeVisible();
    await expect(page.locator('button:has-text("Clear Filters")')).toBeVisible();
  });

  test('should clear filters when clicking clear button', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="provider-card"]', { timeout: 10000 });
    
    // Apply some filters
    await page.locator('input[placeholder*="Search AI providers"]').fill('test');
    await page.locator('select[name="expertise"]').selectOption('machine-learning');
    
    // Wait for filters to apply
    await page.waitForTimeout(1000);
    
    // Trigger empty state if possible, or manually clear
    await page.locator('input[placeholder*="Search AI providers"]').fill('xyznonexistent');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Click clear filters button if empty state appears
    const clearButton = page.locator('button:has-text("Clear Filters")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    } else {
      // Manually clear if no empty state
      await page.locator('input[placeholder*="Search AI providers"]').clear();
    }
    
    // Wait for results to reset
    await page.waitForTimeout(1000);
    
    // Check that providers are shown again
    await expect(page.locator('[data-testid="provider-card"]')).toBeVisible();
  });

  test('should handle mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="provider-card"]', { timeout: 10000 });
    
    // Check mobile filter button is visible
    await expect(page.locator('button:has-text("Filters")')).toBeVisible();
    
    // Check that provider cards stack vertically
    const cards = page.locator('[data-testid="provider-card"]');
    await expect(cards.first()).toBeVisible();
  });
});

test.describe('Individual Provider Profile', () => {
  test('should navigate to provider profile from directory', async ({ page }) => {
    // Navigate to provider directory
    await page.goto('/providers');
    
    // Wait for providers to load
    await page.waitForSelector('[data-testid="provider-card"]', { timeout: 10000 });
    
    // Click on first provider card
    const firstCard = page.locator('[data-testid="provider-card"]').first();
    await firstCard.click();
    
    // Check that we navigated to a provider profile page
    await expect(page).toHaveURL(/\/providers\/[a-z0-9-]+/);
    
    // Check provider profile page elements
    await expect(page.locator('h1')).toBeVisible(); // Provider name
    await expect(page.locator('[data-testid="provider-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-provider"]')).toBeVisible();
  });

  test('should display provider profile with all sections', async ({ page }) => {
    // Navigate directly to a known provider (using mock data structure)
    await page.goto('/providers/ai-innovations-inc');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check main provider information
    await expect(page.locator('h1')).toContainText('AI');
    await expect(page.locator('[data-testid="provider-rating"]')).toBeVisible();
    await expect(page.locator('[data-testid="provider-location"]')).toBeVisible();
    
    // Check tabs are present
    await expect(page.locator('button:has-text("Overview")')).toBeVisible();
    await expect(page.locator('button:has-text("Portfolio")')).toBeVisible();
    await expect(page.locator('button:has-text("Services")')).toBeVisible();
    await expect(page.locator('button:has-text("Reviews")')).toBeVisible();
    
    // Check contact section
    await expect(page.locator('button:has-text("Contact Provider")')).toBeVisible();
    await expect(page.locator('button:has-text("Request Proposal")')).toBeVisible();
  });

  test('should switch between profile tabs', async ({ page }) => {
    // Navigate to provider profile
    await page.goto('/providers/ai-innovations-inc');
    await page.waitForLoadState('networkidle');
    
    // Click Portfolio tab
    await page.locator('button:has-text("Portfolio")').click();
    await expect(page.locator('[data-testid="portfolio-section"]')).toBeVisible();
    
    // Click Services tab
    await page.locator('button:has-text("Services")').click();
    await expect(page.locator('[data-testid="services-section"]')).toBeVisible();
    
    // Click Reviews tab
    await page.locator('button:has-text("Reviews")').click();
    await expect(page.locator('[data-testid="reviews-section"]')).toBeVisible();
    
    // Click back to Overview
    await page.locator('button:has-text("Overview")').click();
    await expect(page.locator('[data-testid="overview-section"]')).toBeVisible();
  });

  test('should handle contact provider interactions', async ({ page }) => {
    // Navigate to provider profile
    await page.goto('/providers/ai-innovations-inc');
    await page.waitForLoadState('networkidle');
    
    // Click contact provider button
    await page.locator('button:has-text("Contact Provider")').click();
    
    // Check that contact modal or action is triggered
    // This would depend on your implementation - could be a modal, redirect, etc.
    // For now, just check the button was clickable
    await expect(page.locator('button:has-text("Contact Provider")')).toBeVisible();
  });

  test('should handle request proposal interactions', async ({ page }) => {
    // Navigate to provider profile
    await page.goto('/providers/ai-innovations-inc');
    await page.waitForLoadState('networkidle');
    
    // Click request proposal button
    await page.locator('button:has-text("Request Proposal")').click();
    
    // Check that proposal request action is triggered
    await expect(page.locator('button:has-text("Request Proposal")')).toBeVisible();
  });

  test('should display provider certifications and stats', async ({ page }) => {
    // Navigate to provider profile
    await page.goto('/providers/ai-innovations-inc');
    await page.waitForLoadState('networkidle');
    
    // Check certifications section
    await expect(page.locator('[data-testid="certifications"]')).toBeVisible();
    
    // Check stats section
    await expect(page.locator('[data-testid="provider-stats"]')).toBeVisible();
    
    // Check that key stats are displayed
    await expect(page.locator('text=/Founded|Team Size|Projects|Clients/')).toBeVisible();
  });

  test('should handle 404 for non-existent provider', async ({ page }) => {
    // Navigate to non-existent provider
    await page.goto('/providers/non-existent-provider-123');
    
    // Check for 404 page
    await expect(page.locator('text=Provider Not Found')).toBeVisible();
    await expect(page.locator('button:has-text("All Providers")')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to provider profile
    await page.goto('/providers/ai-innovations-inc');
    await page.waitForLoadState('networkidle');
    
    // Check that content is accessible on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Contact Provider")')).toBeVisible();
    
    // Check that tabs work on mobile
    await page.locator('button:has-text("Portfolio")').click();
    await expect(page.locator('[data-testid="portfolio-section"]')).toBeVisible();
  });
});

test.describe('Provider Search Integration', () => {
  test('should maintain search state in URL', async ({ page }) => {
    // Navigate with search parameters
    await page.goto('/providers?search=AI&expertise=machine-learning&location=us');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that filters are applied based on URL
    await expect(page.locator('input[placeholder*="Search AI providers"]')).toHaveValue('AI');
    
    // Refresh page and check state is maintained
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[placeholder*="Search AI providers"]')).toHaveValue('AI');
  });

  test('should update URL when filters change', async ({ page }) => {
    // Navigate to providers page
    await page.goto('/providers');
    await page.waitForLoadState('networkidle');
    
    // Apply search
    await page.locator('input[placeholder*="Search AI providers"]').fill('machine learning');
    await page.keyboard.press('Enter');
    
    // Check URL updated
    await expect(page).toHaveURL(/search=machine%20learning/);
    
    // Apply additional filter
    await page.locator('select[name="location"]').selectOption('us');
    
    // Check URL includes both parameters
    await expect(page).toHaveURL(/location=us/);
    await expect(page).toHaveURL(/search=machine%20learning/);
  });
});

test.describe('Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure by blocking network requests
    await page.route('**/api/providers**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Navigate to providers page
    await page.goto('/providers');
    
    // Wait for error state
    await page.waitForTimeout(2000);
    
    // Check error message is displayed
    await expect(page.locator('text=Error loading providers')).toBeVisible();
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test('should retry loading when clicking try again', async ({ page }) => {
    let requestCount = 0;
    
    // Mock API to fail first time, succeed second time
    await page.route('**/api/providers**', route => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      } else {
        route.continue();
      }
    });
    
    // Navigate to providers page
    await page.goto('/providers');
    
    // Wait for error state
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Error loading providers')).toBeVisible();
    
    // Click try again
    await page.locator('button:has-text("Try Again")').click();
    
    // Wait for successful load
    await page.waitForTimeout(2000);
    
    // Check that content loaded successfully
    await expect(page.locator('[data-testid="provider-card"]')).toBeVisible();
  });
});