import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';
import { jest } from '@jest/globals';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    reload: jest.fn(),
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    has: jest.fn(),
    getAll: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return React.createElement('img', { src, alt, ...props });
  };
});

// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    orgId: 'test-org-id',
    orgRole: 'org:member',
    orgSlug: 'test-org',
    signOut: jest.fn(),
    getToken: jest.fn().mockResolvedValue('mock-token'),
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
  SignIn: () => React.createElement('div', { 'data-testid': 'sign-in' }, 'Sign In'),
  SignUp: () => React.createElement('div', { 'data-testid': 'sign-up' }, 'Sign Up'),
  UserButton: () => React.createElement('div', { 'data-testid': 'user-button' }, 'User Button'),
  ClerkProvider: ({ children }) => children,
  auth: () => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    orgId: 'test-org-id',
  }),
}));

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  connectFirestoreEmulator: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: jest.fn((date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  connectAuthEmulator: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  connectStorageEmulator: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));

// Mock Web APIs
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr) => arr.map(() => Math.floor(Math.random() * 256)),
  },
});

// Mock performance.now
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
  },
});

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
  // Increase timeout for slow tests
  asyncUtilTimeout: 5000,
});

// Global test utilities
global.waitForNextUpdate = async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
};

// Console warnings/errors configuration
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress specific warnings in tests
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (
        args[0].includes('Warning: ReactDOM.render is deprecated') ||
        args[0].includes('Warning: findDOMNode is deprecated') ||
        args[0].includes('Warning: componentWillMount has been renamed')
      )
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: Failed prop type')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Global test timeout
jest.setTimeout(10000);