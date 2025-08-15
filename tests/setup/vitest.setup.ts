import { vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Configure testing library
import { configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
});

// Mock Next.js modules
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    reload: vi.fn(),
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn(),
    toString: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock Next.js Image
vi.mock('next/image', () => {
  return {
    default: ({ src, alt, ...props }: any) => {
      return <img src={src} alt={alt} {...props} />;
    },
  };
});

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    orgId: 'test-org-id',
    orgRole: 'org:member',
    orgSlug: 'test-org',
    signOut: vi.fn(),
    getToken: vi.fn().mockResolvedValue('mock-token'),
  }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      imageUrl: 'https://example.com/avatar.jpg',
      publicMetadata: {
        organizationId: 'test-org-id',
        roles: ['team_member'],
        permissions: ['service:view', 'booking:create'],
      },
    },
  }),
  useOrganization: () => ({
    isLoaded: true,
    organization: {
      id: 'test-org-id',
      name: 'Test Organization',
      slug: 'test-org',
      imageUrl: 'https://example.com/org-logo.jpg',
    },
  }),
  SignIn: () => <div data-testid="sign-in">Sign In</div>,
  SignUp: () => <div data-testid="sign-up">Sign Up</div>,
  UserButton: () => <div data-testid="user-button">User Button</div>,
  ClerkProvider: ({ children }: any) => children,
  auth: () => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    orgId: 'test-org-id',
  }),
}));

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

// Mock Web APIs
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr: any) => arr.map(() => Math.floor(Math.random() * 256)),
  },
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Setup and cleanup for each test
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup DOM after each test
  cleanup();
  
  // Clear localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Global setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock_key';
  process.env.FIREBASE_PROJECT_ID = 'ai-marketplace-test';
});

// Global cleanup
afterAll(() => {
  // Final cleanup
  vi.clearAllMocks();
});