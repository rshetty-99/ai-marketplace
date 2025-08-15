# Testing Rules for Enterprise SaaS

## Test Strategy Overview

### 1. Testing Pyramid
```
         /\
        /E2E\         5% - Critical user journeys
       /------\
      /Integration\   20% - API & service integration  
     /------------\
    /   Unit Tests  \ 75% - Components, functions, utilities
   /----------------\
```

### 2. Test File Organization
```
/tests
  /unit
    /components
      /features
        /organizations
          OrganizationList.test.tsx
          OrganizationForm.test.tsx
      /shared
        Button.test.tsx
        Modal.test.tsx
    /services
      organizationService.test.ts
      authService.test.ts
    /utils
      validators.test.ts
      formatters.test.ts
    /hooks
      useAuth.test.ts
      useTenant.test.ts
      
  /integration
    /api
      organizations.test.ts
      auth.test.ts
    /services
      firestore-operations.test.ts
      clerk-integration.test.ts
      
  /e2e
    /flows
      organization-crud.spec.ts
      multi-tenant-access.spec.ts
      user-onboarding.spec.ts
    /smoke
      critical-path.spec.ts
      
  /fixtures
    /data
      organizations.json
      users.json
    /mocks
      firebase.ts
      clerk.ts
      
  /utils
    testHelpers.ts
    setupTests.ts
```

### 3. Unit Testing Rules

#### Component Testing
```typescript
// Every component test must include:
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrganizationList } from '@/components/features/organizations/OrganizationList';
import { mockOrganizations } from '@/tests/fixtures/data/organizations';

describe('OrganizationList', () => {
  // 1. Rendering tests
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<OrganizationList />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
    
    it('should display loading state initially', () => {
      render(<OrganizationList />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });
  
  // 2. Multi-tenant tests
  describe('Multi-tenancy', () => {
    it('should only show organizations for current tenant', async () => {
      const { rerender } = render(
        <OrganizationList tenantId="org-1" />
      );
      
      await waitFor(() => {
        expect(screen.queryByText('Org 2')).not.toBeInTheDocument();
      });
    });
    
    it('should handle subsidiary access correctly', () => {
      // Test subsidiary-specific logic
    });
    
    it('should respect channel partner limitations', () => {
      // Test channel partner constraints
    });
  });
  
  // 3. Permission tests
  describe('RBAC Permissions', () => {
    it('should show edit button only with write permission', () => {
      render(<OrganizationList permissions={['read']} />);
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });
  });
  
  // 4. Error handling tests
  describe('Error Handling', () => {
    it('should display error message on fetch failure', async () => {
      // Mock failed API call
      render(<OrganizationList />);
      await waitFor(() => {
        expect(screen.getByText(/error loading/i)).toBeInTheDocument();
      });
    });
  });
  
  // 5. User interaction tests
  describe('User Interactions', () => {
    it('should handle organization selection', async () => {
      const onSelect = jest.fn();
      render(<OrganizationList onSelect={onSelect} />);
      
      fireEvent.click(screen.getByText('Organization 1'));
      expect(onSelect).toHaveBeenCalledWith('org-1');
    });
  });
});
```

#### Service Testing
```typescript
// Service tests must cover all methods and edge cases
describe('OrganizationService', () => {
  let service: OrganizationService;
  
  beforeEach(() => {
    service = new OrganizationService();
    jest.clearAllMocks();
  });
  
  describe('createOrganization', () => {
    it('should create organization with valid data', async () => {
      const data = { name: 'Test Org', tenantId: 'tenant-1' };
      const result = await service.createOrganization(data);
      
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test Org');
    });
    
    it('should validate required fields', async () => {
      await expect(service.createOrganization({}))
        .rejects.toThrow('Validation error');
    });
    
    it('should enforce tenant isolation', async () => {
      // Test that org is created under correct tenant
    });
    
    it('should handle Firestore errors', async () => {
      // Mock Firestore failure
      jest.spyOn(db, 'collection').mockRejectedValue(new Error('Firestore error'));
      
      await expect(service.createOrganization(data))
        .rejects.toThrow('Failed to create organization');
    });
  });
});
```

### 4. Integration Testing Rules

```typescript
// API Integration Tests
describe('API: /api/v1/organizations', () => {
  describe('POST /api/v1/organizations', () => {
    it('should create organization with valid auth', async () => {
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test Org',
          type: 'enterprise'
        });
        
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });
    
    it('should reject without auth', async () => {
      const response = await request(app)
        .post('/api/v1/organizations')
        .send({ name: 'Test Org' });
        
      expect(response.status).toBe(401);
    });
    
    it('should validate input data', async () => {
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', 'Bearer valid-token')
        .send({ invalid: 'data' });
        
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Validation');
    });
    
    it('should enforce rate limiting', async () => {
      // Make 100 requests rapidly
      const requests = Array(100).fill(null).map(() =>
        request(app).post('/api/v1/organizations')
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
```

### 5. E2E Testing Rules (Playwright)

```typescript
// E2E tests for critical user journeys
import { test, expect } from '@playwright/test';

test.describe('Organization Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as org admin
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });
  
  test('should complete full organization CRUD cycle', async ({ page }) => {
    // Create
    await page.click('text=New Organization');
    await page.fill('[name="name"]', 'E2E Test Org');
    await page.selectOption('[name="type"]', 'enterprise');
    await page.click('text=Create');
    
    // Verify creation
    await expect(page.locator('text=E2E Test Org')).toBeVisible();
    
    // Update
    await page.click('text=E2E Test Org');
    await page.click('text=Edit');
    await page.fill('[name="name"]', 'Updated E2E Org');
    await page.click('text=Save');
    
    // Verify update
    await expect(page.locator('text=Updated E2E Org')).toBeVisible();
    
    // Delete
    await page.click('text=Delete');
    await page.click('text=Confirm');
    
    // Verify deletion
    await expect(page.locator('text=Updated E2E Org')).not.toBeVisible();
  });
  
  test('should enforce multi-tenant boundaries', async ({ page }) => {
    // Try to access another tenant's data
    await page.goto('/organizations/other-tenant-id');
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });
  
  test('should handle concurrent modifications', async ({ page, context }) => {
    // Open two tabs
    const page2 = await context.newPage();
    
    // Modify same org in both tabs
    // Verify conflict resolution
  });
});
```

### 6. Test Data Management

```typescript
// Test data factories
export const createMockOrganization = (overrides = {}): Organization => ({
  id: 'org-test-' + Date.now(),
  name: 'Test Organization',
  type: 'enterprise',
  tenantId: 'tenant-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockUser = (overrides = {}): User => ({
  id: 'user-test-' + Date.now(),
  email: 'test@example.com',
  role: 'admin',
  organizations: ['org-1'],
  ...overrides
});

// Seed data for different scenarios
export const seedMultiTenantData = async () => {
  // Organization 1 with subsidiaries
  const org1 = await createMockOrganization({ name: 'Parent Org' });
  const sub1 = await createMockOrganization({ 
    name: 'Subsidiary 1',
    parentId: org1.id 
  });
  
  // Organization 2 with channel partners
  const org2 = await createMockOrganization({ name: 'Partner Org' });
  const partner1 = await createMockUser({
    role: 'channel_partner',
    organizations: [org2.id]
  });
  
  return { org1, sub1, org2, partner1 };
};
```

### 7. Test Coverage Rules

```yaml
coverage_requirements:
  global:
    statements: 80
    branches: 75
    functions: 80
    lines: 80
    
  critical_paths:
    # These must have 100% coverage
    - /services/auth/
    - /services/payment/
    - /middleware/rbac/
    - /utils/validators/
    
  minimum_per_file: 70

excluded_from_coverage:
  - "*.test.ts"
  - "*.spec.ts"
  - "/tests/"
  - "*.config.js"
  - "/scripts/"
```

### 8. Performance Testing

```typescript
// Performance benchmarks
describe('Performance', () => {
  test('Dashboard should load under 2 seconds', async () => {
    const startTime = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });
  
  test('API response time should be under 200ms', async () => {
    const startTime = Date.now();
    await fetch('/api/v1/organizations');
    const responseTime = Date.now() - startTime;
    
    expect(responseTime).toBeLessThan(200);
  });
  
  test('Should handle 100 concurrent users', async () => {
    // Load testing logic
  });
});
```

### 9. Accessibility Testing

```typescript
// Accessibility tests
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test('Dashboard should be accessible', async ({ page }) => {
    await page.goto('/dashboard');
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });
  
  test('Forms should have proper labels', async ({ page }) => {
    await page.goto('/organizations/new');
    const labels = await page.$$eval('label', labels => 
      labels.map(label => label.getAttribute('for'))
    );
    
    for (const forId of labels) {
      const input = await page.$(`#${forId}`);
      expect(input).toBeTruthy();
    }
  });
});
```

### 10. Testing Best Practices

#### Test Naming Convention
```
should_[expectedBehavior]_when_[condition]
Example: should_return_filtered_orgs_when_tenant_specified
```

#### Test Independence
- Each test must be able to run independently
- No shared state between tests
- Clean up after each test

#### Mock External Services
```typescript
// Always mock external services
jest.mock('firebase/authentication');
jest.mock('firebase/firestore');
```

#### Test Environments
```bash
# Different configs for different test types
NODE_ENV=test:unit npm run test:unit
NODE_ENV=test:integration npm run test:integration
NODE_ENV=test:e2e npm run test:e2e
```

#### Continuous Testing
- Run unit tests on save (watch mode)
- Run integration tests on commit
- Run E2E tests on PR
- Run full suite before deployment

### 11. Test Automation Pipeline

```yaml
# GitHub Actions workflow
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Unit Tests
        run: npm run test:unit
      - name: Upload Coverage
        run: npm run coverage:upload
        
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Integration Tests
        run: npm run test:integration
        
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run E2E Tests
        run: npm run test:e2e
```

### 12. Test Reporting

```typescript
// Generate test reports
export const generateTestReport = () => ({
  summary: {
    total: 500,
    passed: 480,
    failed: 20,
    skipped: 0
  },
  coverage: {
    statements: 85,
    branches: 78,
    functions: 82,
    lines: 84
  },
  duration: '2m 30s',
  timestamp: new Date().toISOString()
});
