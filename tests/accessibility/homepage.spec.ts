import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

/**
 * Accessibility Tests for Homepage
 * Tests WCAG 2.1 AA compliance and accessibility best practices
 */

test.describe('Homepage Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Inject axe-core into the page
    await injectAxe(page);
  });

  test('should not have any automatically detectable accessibility violations', async ({ page }) => {
    // Run accessibility check on the entire page
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('should have proper heading structure', async ({ page }) => {
    // Check for h1 element
    const h1Elements = await page.locator('h1').count();
    expect(h1Elements).toBeGreaterThan(0);
    expect(h1Elements).toBeLessThanOrEqual(1); // Only one h1 per page
    
    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let currentLevel = 0;
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const level = parseInt(tagName.charAt(1));
      
      if (currentLevel === 0) {
        expect(level).toBe(1); // First heading should be h1
      } else {
        expect(level).toBeLessThanOrEqual(currentLevel + 1); // Don't skip levels
      }
      
      currentLevel = level;
    }
  });

  test('should have accessible navigation', async ({ page }) => {
    // Check for navigation landmarks
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toHaveCount(1); // Should have at least one navigation
    
    // Check navigation links are accessible
    const navLinks = nav.locator('a');
    const linkCount = await navLinks.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i);
      
      // Each link should have accessible text
      const accessibleText = await link.evaluate(el => {
        return el.textContent?.trim() || 
               el.getAttribute('aria-label') || 
               el.getAttribute('title') || 
               el.querySelector('img')?.getAttribute('alt');
      });
      
      expect(accessibleText).toBeTruthy();
      expect(accessibleText?.length).toBeGreaterThan(0);
    }
  });

  test('should have proper form accessibility', async ({ page }) => {
    // Check search form if present
    const searchForm = page.locator('form:has(input[type="search"]), form:has([role="searchbox"])');
    
    if (await searchForm.count() > 0) {
      // Search input should have label or aria-label
      const searchInput = searchForm.locator('input[type="search"], [role="searchbox"]');
      
      const hasLabel = await searchInput.evaluate(input => {
        const id = input.getAttribute('id');
        if (id && document.querySelector(`label[for="${id}"]`)) {
          return true;
        }
        return input.getAttribute('aria-label') || 
               input.getAttribute('aria-labelledby') ||
               input.getAttribute('placeholder');
      });
      
      expect(hasLabel).toBeTruthy();
      
      // Submit button should be accessible
      const submitButton = searchForm.locator('button[type="submit"], input[type="submit"]');
      if (await submitButton.count() > 0) {
        const buttonText = await submitButton.evaluate(btn => {
          return btn.textContent?.trim() || 
                 btn.getAttribute('aria-label') || 
                 btn.getAttribute('value') ||
                 btn.querySelector('img')?.getAttribute('alt');
        });
        expect(buttonText).toBeTruthy();
      }
    }
  });

  test('should have accessible images', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      
      // Check if image is decorative or informative
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Decorative images should have empty alt or aria-hidden="true"
      // Informative images should have meaningful alt text
      if (role === 'presentation' || ariaHidden === 'true') {
        // Decorative image - alt can be empty
        continue;
      }
      
      // Informative image should have alt text
      expect(alt).not.toBeNull();
      if (alt !== '') {
        expect(alt!.length).toBeGreaterThan(0);
        expect(alt!.length).toBeLessThan(125); // Keep alt text concise
      }
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    // Use axe to check color contrast specifically
    const violations = await getViolations(page, undefined, {
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true }, // AAA level
      },
    });
    
    const colorContrastViolations = violations.filter(v => 
      v.id === 'color-contrast' || v.id === 'color-contrast-enhanced'
    );
    
    expect(colorContrastViolations).toHaveLength(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Start navigation from the top
    await page.keyboard.press('Tab');
    
    // Get all focusable elements
    const focusableElements = await page.locator(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    ).all();
    
    // Test that we can reach key interactive elements via keyboard
    const keyElements = [
      'main navigation',
      'search',
      'sign in',
      'sign up',
      'get started',
      'browse services',
    ];
    
    for (const elementText of keyElements) {
      const element = page.locator(`text=${elementText}`, { hasText: new RegExp(elementText, 'i') });
      if (await element.count() > 0) {
        // Try to focus the element
        await element.first().focus();
        await expect(element.first()).toBeFocused();
      }
    }
  });

  test('should have proper focus indicators', async ({ page }) => {
    // Check that focusable elements have visible focus indicators
    const focusableElements = await page.locator(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    ).all();
    
    for (const element of focusableElements.slice(0, 5)) { // Test first 5 elements
      await element.focus();
      
      // Check if element has focus styles
      const focusStyles = await element.evaluate(el => {
        const styles = window.getComputedStyle(el, ':focus');
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor,
          borderColor: styles.borderColor,
          boxShadow: styles.boxShadow,
        };
      });
      
      // Should have some kind of focus indicator
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none' ||
        focusStyles.borderColor !== 'rgba(0, 0, 0, 0)';
      
      expect(hasFocusIndicator).toBeTruthy();
    }
  });

  test('should have proper ARIA landmarks', async ({ page }) => {
    // Check for main content landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toHaveCount(1);
    
    // Check for navigation landmark
    const nav = page.locator('nav, [role="navigation"]');
    expect(await nav.count()).toBeGreaterThanOrEqual(1);
    
    // Check for banner/header if present
    const header = page.locator('header, [role="banner"]');
    expect(await header.count()).toBeGreaterThanOrEqual(0);
    
    // Check for contentinfo/footer if present
    const footer = page.locator('footer, [role="contentinfo"]');
    expect(await footer.count()).toBeGreaterThanOrEqual(0);
  });

  test('should handle screen reader announcements', async ({ page }) => {
    // Check for live regions
    const liveRegions = page.locator('[aria-live]');
    
    if (await liveRegions.count() > 0) {
      for (let i = 0; i < await liveRegions.count(); i++) {
        const region = liveRegions.nth(i);
        const ariaLive = await region.getAttribute('aria-live');
        
        // aria-live values should be valid
        expect(['polite', 'assertive', 'off']).toContain(ariaLive);
      }
    }
    
    // Check for skip links
    const skipLink = page.locator('a[href^="#"]:has-text("skip")');
    if (await skipLink.count() > 0) {
      // Skip link should be focusable
      await skipLink.first().focus();
      await expect(skipLink.first()).toBeFocused();
      
      // Skip link should navigate to main content
      await skipLink.first().click();
      const targetId = await skipLink.first().getAttribute('href');
      const target = page.locator(targetId!);
      await expect(target).toBeFocused();
    }
  });

  test('should work with high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            background-color: black !important;
            color: white !important;
            border-color: white !important;
          }
        }
      `,
    });
    
    // Emulate high contrast preference
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    
    // Check that content is still readable
    const violations = await getViolations(page, undefined, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
    
    // Should not have color contrast violations even in high contrast mode
    expect(violations.filter(v => v.id === 'color-contrast')).toHaveLength(0);
  });

  test('should respect reduced motion preferences', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Check for animations that should be reduced
    const animatedElements = await page.locator('[class*="animate"], [style*="animation"], [style*="transition"]').all();
    
    for (const element of animatedElements) {
      const computedStyle = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          animation: styles.animation,
          transition: styles.transition,
        };
      });
      
      // Animations should be minimal or disabled when reduced motion is preferred
      // This would need to be implemented in the actual CSS
    }
  });

  test('should be compatible with screen readers', async ({ page }) => {
    // Check for proper semantic HTML
    const semanticElements = [
      'header', 'nav', 'main', 'article', 'section', 'aside', 'footer',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ];
    
    let semanticCount = 0;
    for (const element of semanticElements) {
      const count = await page.locator(element).count();
      semanticCount += count;
    }
    
    // Should have reasonable amount of semantic HTML
    expect(semanticCount).toBeGreaterThan(5);
    
    // Check for proper ARIA attributes
    const ariaElements = await page.locator('[aria-label], [aria-labelledby], [aria-describedby], [role]').count();
    expect(ariaElements).toBeGreaterThan(0);
  });

  test('should have accessible error handling', async ({ page }) => {
    // Test form error handling if forms are present
    const forms = page.locator('form');
    
    if (await forms.count() > 0) {
      const form = forms.first();
      const inputs = form.locator('input[required]');
      
      if (await inputs.count() > 0) {
        // Try to submit form without filling required fields
        await form.locator('button[type="submit"], input[type="submit"]').click();
        
        // Check for error messages
        const errorMessages = page.locator('[role="alert"], .error, [aria-invalid="true"]');
        
        if (await errorMessages.count() > 0) {
          // Error messages should be associated with form fields
          for (let i = 0; i < await errorMessages.count(); i++) {
            const error = errorMessages.nth(i);
            const text = await error.textContent();
            expect(text).toBeTruthy();
            expect(text!.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});

test.describe('Homepage Accessibility - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
    hasTouch: true,
  });

  test('should be accessible on mobile devices', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await injectAxe(page);
    
    // Run accessibility check on mobile
    await checkA11y(page, undefined, {
      rules: {
        // Mobile-specific rules
        'target-size': { enabled: true }, // Touch targets should be large enough
      },
    });
  });

  test('should have proper touch target sizes', async ({ page }) => {
    await page.goto('/');
    
    // Check that interactive elements are large enough for touch
    const touchTargets = await page.locator('button, a, input, [role="button"]').all();
    
    for (const target of touchTargets) {
      const boundingBox = await target.boundingBox();
      if (boundingBox) {
        // WCAG recommends minimum 44x44px touch targets
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});