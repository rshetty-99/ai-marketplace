# UX Specifications - AI Marketplace Platform

## Executive Summary

This UX specifications document defines the comprehensive user experience requirements for the AI Marketplace Platform, focusing on loading states, error handling, accessibility, mobile responsiveness, and interaction patterns. The goal is to create an intuitive, fast, and accessible platform that serves enterprise users across all devices and capabilities.

### UX Principles
- **Clarity First:** Clear information hierarchy and intuitive navigation
- **Performance Focused:** Fast loading with meaningful feedback
- **Accessibility Ready:** WCAG 2.1 AA compliance across all interactions
- **Mobile Optimized:** Mobile-first responsive design approach
- **Error Resilient:** Graceful degradation and helpful error recovery

## Loading State Specifications

### Loading State Hierarchy

#### 1. Initial Page Load (0-500ms)
**Full-Page Loading Spinner**
- **Visual:** Branded spinner with company logo
- **Animation:** Smooth rotation (1 second per full rotation)
- **Message:** "Loading AI Marketplace..." or contextual message
- **Background:** Semi-transparent overlay (rgba(255,255,255,0.95))
- **Implementation:**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95">
  <div className="flex flex-col items-center space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p className="text-lg font-medium text-gray-700">Loading AI Marketplace...</p>
  </div>
</div>
```

#### 2. Data Fetching (500ms+)
**Skeleton Screens**
- **Purpose:** Match the actual content structure
- **Animation:** Subtle shimmer effect from left to right
- **Duration:** Until real content loads
- **Fallback:** Show skeleton for maximum 10 seconds before error state

**Service Card Skeleton:**
```tsx
<div className="bg-white rounded-lg border p-6 space-y-4">
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-20 bg-gray-200 rounded mb-4"></div>
    <div className="flex space-x-2">
      <div className="h-6 bg-gray-200 rounded w-16"></div>
      <div className="h-6 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
</div>
```

#### 3. Background Operations
**Subtle Loading Indicators**
- **Search Autocomplete:** Pulsing text cursor
- **Filter Application:** Overlay spinner with "Applying filters..."
- **Form Submission:** Button loading state with spinner
- **File Upload:** Progress bar with percentage

### Context-Specific Loading States

#### Homepage Loading
```tsx
// Hero section loading
<div className="hero-section">
  <div className="animate-pulse">
    <div className="h-12 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
    <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
    <div className="h-12 bg-gray-200 rounded w-48 mx-auto"></div>
  </div>
</div>

// Featured services loading
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {[...Array(6)].map((_, i) => (
    <ServiceCardSkeleton key={i} />
  ))}
</div>
```

#### Catalog Loading
```tsx
// Filter sidebar loading
<div className="space-y-6">
  {['Category', 'Price Range', 'Industry', 'Location'].map((filter) => (
    <div key={filter} className="animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-24 mb-3"></div>
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded w-32"></div>
        ))}
      </div>
    </div>
  ))}
</div>

// Service grid loading
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
  {[...Array(12)].map((_, i) => (
    <ServiceCardSkeleton key={i} />
  ))}
</div>
```

#### Service Detail Loading
```tsx
// Service header loading
<div className="animate-pulse">
  <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
</div>

// Description loading
<div className="space-y-4">
  {[...Array(6)].map((_, i) => (
    <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
  ))}
</div>

// Reviews loading
<div className="space-y-6">
  {[...Array(3)].map((_, i) => (
    <ReviewSkeleton key={i} />
  ))}
</div>
```

### Loading Performance Standards
- **Skeleton Display:** Within 100ms of user action
- **Content Replacement:** Smooth transition without layout shift
- **Timeout Handling:** Show error state after 10 seconds
- **Progressive Loading:** Load critical content first, enhancements second

## Error State Specifications

### Error State Hierarchy

#### 1. Network and Connectivity Errors
**Offline State**
```tsx
<div className="min-h-screen flex items-center justify-center bg-gray-50">
  <div className="max-w-md mx-auto text-center p-6">
    <div className="w-24 h-24 mx-auto mb-6 text-gray-400">
      <WifiOffIcon className="w-full h-full" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Connection Lost
    </h2>
    <p className="text-gray-600 mb-6">
      Please check your internet connection and try again.
    </p>
    <button 
      onClick={retry}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Try Again
    </button>
  </div>
</div>
```

**API Service Unavailable**
```tsx
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
  <div className="flex items-start">
    <AlertTriangleIcon className="w-6 h-6 text-yellow-600 mt-1 mr-3" />
    <div className="flex-1">
      <h3 className="text-lg font-medium text-yellow-800 mb-2">
        Service Temporarily Unavailable
      </h3>
      <p className="text-yellow-700 mb-4">
        We're experiencing technical difficulties. Please try again in a few moments.
      </p>
      <div className="flex space-x-3">
        <button onClick={retry} className="btn-secondary">
          Retry
        </button>
        <button onClick={reportIssue} className="btn-outline">
          Report Issue
        </button>
      </div>
    </div>
  </div>
</div>
```

#### 2. User Input Errors
**Form Validation Errors**
```tsx
<div className="space-y-4">
  <div className="form-field">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Email Address
    </label>
    <input
      type="email"
      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
        error ? 'border-red-300 bg-red-50' : 'border-gray-300'
      }`}
      value={email}
      onChange={handleEmailChange}
    />
    {error && (
      <div className="flex items-center mt-1 text-sm text-red-600">
        <ExclamationCircleIcon className="w-4 h-4 mr-1" />
        {error.message}
      </div>
    )}
  </div>
</div>
```

**Search No Results**
```tsx
<div className="text-center py-12">
  <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
  <h3 className="text-xl font-medium text-gray-900 mb-2">
    No results found for "{searchQuery}"
  </h3>
  <p className="text-gray-600 mb-6 max-w-md mx-auto">
    Try adjusting your search terms or filters to find what you're looking for.
  </p>
  <div className="space-x-4">
    <button onClick={clearFilters} className="btn-secondary">
      Clear All Filters
    </button>
    <button onClick={browseAll} className="btn-primary">
      Browse All Services
    </button>
  </div>
  
  {/* Suggested searches */}
  <div className="mt-8">
    <p className="text-sm text-gray-500 mb-3">Popular searches:</p>
    <div className="flex flex-wrap gap-2 justify-center">
      {suggestedSearches.map((term) => (
        <button
          key={term}
          onClick={() => handleSuggestedSearch(term)}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
        >
          {term}
        </button>
      ))}
    </div>
  </div>
</div>
```

#### 3. System Errors
**500 Server Error Page**
```tsx
<div className="min-h-screen flex items-center justify-center bg-gray-50">
  <div className="max-w-lg mx-auto text-center p-6">
    <div className="w-24 h-24 mx-auto mb-6">
      <img src="/error-robot.svg" alt="Error" className="w-full h-full" />
    </div>
    <h1 className="text-3xl font-bold text-gray-900 mb-4">
      Something went wrong
    </h1>
    <p className="text-gray-600 mb-6">
      We're experiencing technical difficulties. Our team has been notified and is working on a fix.
    </p>
    <div className="bg-gray-100 rounded-lg p-4 mb-6">
      <p className="text-sm text-gray-500">
        Error ID: {errorId}
      </p>
      <p className="text-sm text-gray-500">
        Timestamp: {new Date().toLocaleString()}
      </p>
    </div>
    <div className="space-x-4">
      <button onClick={retry} className="btn-primary">
        Try Again
      </button>
      <button onClick={goHome} className="btn-secondary">
        Go Home
      </button>
      <button onClick={contactSupport} className="btn-outline">
        Contact Support
      </button>
    </div>
  </div>
</div>
```

#### 4. 404 Not Found Page
```tsx
<div className="min-h-screen flex items-center justify-center bg-gray-50">
  <div className="max-w-2xl mx-auto text-center p-6">
    <div className="text-9xl font-bold text-blue-600 mb-4">404</div>
    <h1 className="text-3xl font-bold text-gray-900 mb-4">
      Page not found
    </h1>
    <p className="text-gray-600 mb-8">
      The page you're looking for doesn't exist or has been moved.
    </p>
    
    {/* Search bar */}
    <div className="max-w-md mx-auto mb-8">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for AI services..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onSubmit={handleSearch}
        />
      </div>
    </div>
    
    {/* Popular links */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      {popularPages.map((page) => (
        <a
          key={page.path}
          href={page.path}
          className="p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
        >
          <page.icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">{page.name}</p>
        </a>
      ))}
    </div>
    
    <button onClick={goHome} className="btn-primary">
      Back to Home
    </button>
  </div>
</div>
```

### Error Recovery Patterns

#### Retry Mechanism
```tsx
const useRetryableOperation = (operation, maxRetries = 3) => {
  const [state, setState] = useState({ 
    loading: false, 
    error: null, 
    retryCount: 0 
  });

  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await operation(...args);
        setState({ loading: false, error: null, retryCount: i });
        return result;
      } catch (error) {
        if (i === maxRetries) {
          setState({ loading: false, error, retryCount: i });
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }, [operation, maxRetries]);

  return { ...state, execute };
};
```

#### Graceful Degradation
```tsx
const ServiceCard = ({ service }) => {
  const [imageError, setImageError] = useState(false);
  const [ratingError, setRatingError] = useState(false);

  return (
    <div className="bg-white rounded-lg border p-6">
      {/* Image with fallback */}
      <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
        {!imageError ? (
          <img
            src={service.image}
            alt={service.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Service info */}
      <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
      <p className="text-gray-600 mb-4">{service.description}</p>
      
      {/* Rating with fallback */}
      <div className="flex items-center mb-4">
        {!ratingError && service.rating ? (
          <StarRating value={service.rating} />
        ) : (
          <span className="text-sm text-gray-500">Rating unavailable</span>
        )}
      </div>
      
      {/* Always show price and CTA */}
      <div className="flex items-center justify-between">
        <span className="text-xl font-bold">${service.price}/mo</span>
        <button className="btn-primary">Learn More</button>
      </div>
    </div>
  );
};
```

## Empty State Specifications

### Category-Specific Empty States

#### Empty Service Catalog
```tsx
<div className="text-center py-16">
  <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
    <SearchIcon className="w-full h-full" />
  </div>
  <h3 className="text-2xl font-bold text-gray-900 mb-4">
    No AI services found
  </h3>
  <p className="text-gray-600 mb-8 max-w-md mx-auto">
    We couldn't find any AI services matching your current filters. Try broadening your search criteria.
  </p>
  
  {/* Action buttons */}
  <div className="space-x-4">
    <button onClick={clearAllFilters} className="btn-secondary">
      Clear All Filters
    </button>
    <button onClick={browsePopular} className="btn-primary">
      Browse Popular Services
    </button>
  </div>
  
  {/* Suggested categories */}
  <div className="mt-12">
    <h4 className="text-lg font-medium mb-4">Popular categories:</h4>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
      {popularCategories.map((category) => (
        <button
          key={category.slug}
          onClick={() => browseCategory(category.slug)}
          className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <category.icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium">{category.name}</p>
        </button>
      ))}
    </div>
  </div>
</div>
```

#### Empty Dashboard (New User)
```tsx
<div className="text-center py-16">
  <div className="w-32 h-32 mx-auto mb-6">
    <img src="/welcome-illustration.svg" alt="Welcome" className="w-full h-full" />
  </div>
  <h2 className="text-3xl font-bold text-gray-900 mb-4">
    Welcome to AI Marketplace!
  </h2>
  <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
    You're all set up! Start exploring AI services and connect with providers that can help transform your business.
  </p>
  
  {/* Quick action cards */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
    <div className="p-6 bg-white border rounded-lg">
      <SearchIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Find AI Services</h3>
      <p className="text-gray-600 mb-4">Browse our catalog of AI solutions</p>
      <button onClick={browseCatalog} className="btn-primary w-full">
        Browse Services
      </button>
    </div>
    
    <div className="p-6 bg-white border rounded-lg">
      <UserGroupIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Connect with Providers</h3>
      <p className="text-gray-600 mb-4">Find expert AI service providers</p>
      <button onClick={browseProviders} className="btn-primary w-full">
        View Providers
      </button>
    </div>
    
    <div className="p-6 bg-white border rounded-lg">
      <BookOpenIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Learn About AI</h3>
      <p className="text-gray-600 mb-4">Explore guides and resources</p>
      <button onClick={browseResources} className="btn-primary w-full">
        Read Resources
      </button>
    </div>
  </div>
</div>
```

#### Empty Saved Services
```tsx
<div className="text-center py-12">
  <HeartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
  <h3 className="text-xl font-medium text-gray-900 mb-2">
    No saved services yet
  </h3>
  <p className="text-gray-600 mb-6">
    Save services you're interested in to easily find them later.
  </p>
  <button onClick={browseCatalog} className="btn-primary">
    Explore AI Services
  </button>
</div>
```

## Success State Specifications

### Confirmation Messages

#### Form Submission Success
```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-6">
  <div className="flex items-start">
    <CheckCircleIcon className="w-6 h-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
    <div className="flex-1">
      <h3 className="text-lg font-medium text-green-800 mb-2">
        Request sent successfully!
      </h3>
      <p className="text-green-700 mb-4">
        {providerName} will review your inquiry and respond within 24 hours.
      </p>
      <div className="flex space-x-3">
        <button onClick={viewRequest} className="btn-secondary">
          View Request
        </button>
        <button onClick={browseMore} className="btn-outline">
          Explore More Services
        </button>
      </div>
    </div>
  </div>
</div>
```

#### Booking Confirmation
```tsx
<div className="max-w-md mx-auto bg-white border rounded-lg p-6 shadow-lg">
  <div className="text-center">
    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <CalendarIcon className="w-8 h-8 text-green-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Consultation Booked!
    </h2>
    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-500">Date & Time</span>
        <span className="text-sm text-gray-900">
          {formatDateTime(booking.dateTime)}
        </span>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-500">Provider</span>
        <span className="text-sm text-gray-900">{booking.providerName}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500">Meeting Link</span>
        <a href={booking.meetingLink} className="text-sm text-blue-600 hover:underline">
          Join Meeting
        </a>
      </div>
    </div>
    <p className="text-sm text-gray-600 mb-6">
      Calendar invites have been sent to your email. You'll receive a reminder 24 hours before the meeting.
    </p>
    <button onClick={addToCalendar} className="btn-primary w-full">
      Add to Calendar
    </button>
  </div>
</div>
```

#### Payment Success
```tsx
<div className="max-w-lg mx-auto bg-white rounded-lg p-8 shadow-lg">
  <div className="text-center">
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <CheckIcon className="w-10 h-10 text-green-600" />
    </div>
    <h2 className="text-3xl font-bold text-gray-900 mb-4">
      Payment Successful!
    </h2>
    <p className="text-lg text-gray-600 mb-6">
      Your order has been confirmed and the provider has been notified.
    </p>
    
    {/* Order details */}
    <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
      <h3 className="font-semibold mb-4">Order Summary</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Service</span>
          <span>{order.serviceName}</span>
        </div>
        <div className="flex justify-between">
          <span>Provider</span>
          <span>{order.providerName}</span>
        </div>
        <div className="flex justify-between">
          <span>Amount</span>
          <span className="font-semibold">${order.amount}</span>
        </div>
        <div className="flex justify-between">
          <span>Order ID</span>
          <span className="text-sm text-gray-600">{order.id}</span>
        </div>
      </div>
    </div>
    
    <div className="space-y-3">
      <button onClick={viewOrder} className="btn-primary w-full">
        View Order Details
      </button>
      <button onClick={contactProvider} className="btn-secondary w-full">
        Contact Provider
      </button>
    </div>
  </div>
</div>
```

## Accessibility Requirements (WCAG 2.1 AA)

### Keyboard Navigation
```tsx
const ServiceCard = ({ service, index }) => {
  const [focused, setFocused] = useState(false);
  const cardRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigateToService(service.id);
    }
  };

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      role="button"
      aria-label={`${service.name} by ${service.provider}. Price: $${service.price} per month. Rating: ${service.rating} stars.`}
      className={`bg-white rounded-lg border p-6 cursor-pointer transition-all ${
        focused ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } hover:shadow-md focus:shadow-md focus:outline-none`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={handleKeyDown}
      onClick={() => navigateToService(service.id)}
    >
      {/* Card content */}
    </div>
  );
};
```

### Screen Reader Support
```tsx
const LoadingSpinner = ({ message = "Loading content" }) => {
  return (
    <div 
      role="status" 
      aria-live="polite" 
      aria-label={message}
      className="flex items-center justify-center"
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="sr-only">{message}</span>
    </div>
  );
};

const ErrorAlert = ({ error, onRetry }) => {
  return (
    <div 
      role="alert" 
      aria-live="assertive"
      className="bg-red-50 border border-red-200 rounded-lg p-4"
    >
      <div className="flex">
        <ExclamationTriangleIcon 
          className="h-5 w-5 text-red-400" 
          aria-hidden="true" 
        />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            {error.title}
          </h3>
          <p className="mt-1 text-sm text-red-700">
            {error.message}
          </p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="mt-2 btn-secondary"
              aria-describedby="error-description"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

### Color and Contrast
```css
/* Ensure 4.5:1 contrast ratio for normal text */
.text-primary { color: #1f2937; } /* #1f2937 on white = 16.34:1 */
.text-secondary { color: #4b5563; } /* #4b5563 on white = 9.13:1 */
.text-muted { color: #6b7280; } /* #6b7280 on white = 6.55:1 */

/* Interactive elements */
.btn-primary {
  background-color: #2563eb; /* 4.78:1 on white */
  color: white;
}

.btn-primary:hover {
  background-color: #1d4ed8; /* Higher contrast on hover */
}

.btn-primary:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Error states */
.text-error { color: #dc2626; } /* 5.74:1 on white */
.bg-error-light { background-color: #fef2f2; }

/* Success states */
.text-success { color: #059669; } /* 4.54:1 on white */
.bg-success-light { background-color: #f0fdf4; }
```

### Focus Management
```tsx
const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      modalRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    
    // Trap focus within modal
    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0];
      const lastElement = focusableElements?.[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative z-10"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <h2 id="modal-title" className="text-xl font-bold mb-4">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};
```

## Mobile Responsiveness

### Breakpoint Strategy
```css
/* Mobile First Approach */
/* Base styles: Mobile (320px+) */
.container {
  padding: 1rem;
}

.grid {
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Small tablets (640px+) */
@media (min-width: 640px) {
  .container {
    padding: 1.5rem;
  }
  
  .grid-sm-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Tablets (768px+) */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
  
  .grid-md-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Laptops (1024px+) */
@media (min-width: 1024px) {
  .container {
    padding: 2.5rem;
  }
  
  .grid-lg-4 {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Desktops (1280px+) */
@media (min-width: 1280px) {
  .container {
    padding: 3rem;
  }
}
```

### Touch-Friendly Interface
```tsx
const MobileServiceCard = ({ service }) => {
  return (
    <div className="bg-white rounded-lg border p-4 mb-4 touch-manipulation">
      {/* Larger touch targets (minimum 44px) */}
      <button 
        className="w-full text-left p-3 -m-3 rounded-lg hover:bg-gray-50 focus:bg-gray-50 transition-colors"
        style={{ minHeight: '44px' }}
        onClick={() => navigateToService(service.id)}
      >
        <div className="flex items-start space-x-3">
          <img
            src={service.image}
            alt={service.name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {service.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {service.description}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">
                ${service.price}/mo
              </span>
              <div className="flex items-center">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <span className="ml-1 text-sm text-gray-600">
                  {service.rating}
                </span>
              </div>
            </div>
          </div>
        </div>
      </button>
      
      {/* Quick action buttons */}
      <div className="mt-4 flex space-x-2">
        <button 
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium"
          style={{ minHeight: '44px' }}
        >
          Contact Provider
        </button>
        <button 
          className="p-3 border border-gray-300 rounded-lg"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Save service"
        >
          <HeartIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};
```

### Mobile Navigation
```tsx
const MobileNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b lg:hidden">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <Logo />
          <button
            className="p-2 -mr-2 rounded-lg"
            style={{ minWidth: '44px', minHeight: '44px' }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="border-t bg-white">
          <div className="py-2">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block px-4 py-3 text-gray-900 hover:bg-gray-50"
                style={{ minHeight: '44px' }}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};
```

## Performance Standards

### Loading Performance Targets
- **First Contentful Paint:** <1.2 seconds
- **Largest Contentful Paint:** <2.5 seconds
- **First Input Delay:** <100 milliseconds
- **Cumulative Layout Shift:** <0.1

### Implementation Guidelines
```tsx
// Lazy loading images
const LazyImage = ({ src, alt, className, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.src = src;
          img.onload = () => setLoaded(true);
          img.onerror = () => setError(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <div ref={imgRef} className={`relative ${className}`} {...props}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      {loaded && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover rounded transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};

// Code splitting for routes
const ServiceCatalog = lazy(() => import('../pages/ServiceCatalog'));
const ProviderDirectory = lazy(() => import('../pages/ProviderDirectory'));
const Dashboard = lazy(() => import('../pages/Dashboard'));

const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoadingSpinner />}>
      <Routes>
        <Route path="/catalog" element={<ServiceCatalog />} />
        <Route path="/providers" element={<ProviderDirectory />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
};
```

This comprehensive UX specifications document ensures the AI Marketplace Platform delivers an exceptional user experience across all devices, user capabilities, and interaction scenarios, with emphasis on performance, accessibility, and error resilience.