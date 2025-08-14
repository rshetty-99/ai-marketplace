import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Playwright global setup starting...');
  
  try {
    // Setup test environment variables
    process.env.NODE_ENV = 'test';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock_key';
    
    // Launch browser for setup tasks
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Wait for the application to be ready
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
    console.log('⏳ Waiting for application to be ready...');
    
    // Retry mechanism for app readiness
    let retries = 30;
    while (retries > 0) {
      try {
        const response = await page.goto(baseURL, { timeout: 5000 });
        if (response && response.ok()) {
          console.log('✅ Application is ready');
          break;
        }
        throw new Error('Application not ready');
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`Application not ready after 30 retries: ${error}`);
        }
        console.log(`⏳ Application not ready, retrying... (${retries} attempts left)`);
        await page.waitForTimeout(2000);
      }
    }
    
    // Setup test data and authentication state
    await setupTestAuthentication(page);
    await setupTestData(page);
    
    // Save authentication state for reuse in tests
    await context.storageState({ path: 'tests/fixtures/auth-state.json' });
    
    await browser.close();
    
    console.log('✅ Playwright global setup completed');
  } catch (error) {
    console.error('❌ Playwright global setup failed:', error);
    throw error;
  }
}

async function setupTestAuthentication(page: any) {
  try {
    console.log('🔐 Setting up test authentication...');
    
    // Mock authentication state in localStorage/sessionStorage
    await page.evaluate(() => {
      // Mock Clerk session
      localStorage.setItem('__clerk_session', JSON.stringify({
        userId: 'test-user-id',
        sessionId: 'test-session-id',
        orgId: 'test-org-id',
        isSignedIn: true,
      }));
      
      // Mock user data
      localStorage.setItem('__test_user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@aimarketplace.com',
        name: 'Test User',
        organizationId: 'test-org-id',
        roles: ['team_member'],
        permissions: ['service:view', 'booking:create'],
      }));
      
      // Mock organization data
      localStorage.setItem('__test_organization', JSON.stringify({
        id: 'test-org-id',
        name: 'Test Organization',
        type: 'primary',
        industry: 'technology',
        size: 'midmarket',
      }));
    });
    
    console.log('✅ Test authentication setup completed');
  } catch (error) {
    console.error('❌ Test authentication setup failed:', error);
    throw error;
  }
}

async function setupTestData(page: any) {
  try {
    console.log('🌱 Setting up test data...');
    
    // Mock API responses for common endpoints
    await page.route('/api/services**', async (route) => {
      const mockServices = [
        {
          id: 'service-1',
          name: 'AI Chatbot Development',
          description: 'Custom AI chatbot solutions for your business',
          category: 'nlp',
          pricing: { type: 'fixed', amount: 5000, currency: 'USD' },
          providerId: 'provider-1',
          status: 'published',
        },
        {
          id: 'service-2',
          name: 'Computer Vision System',
          description: 'Advanced computer vision and image recognition',
          category: 'computer_vision',
          pricing: { type: 'project', amount: 15000, currency: 'USD' },
          providerId: 'provider-2',
          status: 'published',
        },
      ];
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ services: mockServices, total: mockServices.length }),
      });
    });
    
    await page.route('/api/providers**', async (route) => {
      const mockProviders = [
        {
          id: 'provider-1',
          name: 'AI Solutions Inc',
          description: 'Leading provider of AI solutions',
          logo: 'https://example.com/logo1.jpg',
          rating: 4.8,
          reviewCount: 125,
        },
        {
          id: 'provider-2',
          name: 'Vision Tech LLC',
          description: 'Computer vision specialists',
          logo: 'https://example.com/logo2.jpg',
          rating: 4.6,
          reviewCount: 87,
        },
      ];
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ providers: mockProviders, total: mockProviders.length }),
      });
    });
    
    // Mock authentication endpoints
    await page.route('/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
    
    console.log('✅ Test data setup completed');
  } catch (error) {
    console.error('❌ Test data setup failed:', error);
    throw error;
  }
}

export default globalSetup;