/**
 * Focus Management and Accessibility Components
 * Provides keyboard navigation, screen reader support, and ARIA enhancements
 */

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Skip Navigation Link
 */
export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-blue-600 text-white px-4 py-2 rounded-md m-2 transition-all duration-200"
      tabIndex={1}
    >
      Skip to main content
    </a>
  );
}

/**
 * Focus Management Hook
 */
export function useFocusManagement() {
  const router = useRouter();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  // Store current focus before navigation
  const storeFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  // Restore focus after navigation
  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
      previousFocusRef.current.focus();
    } else {
      // If previous element is not available, focus on main content
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
      }
    }
  }, []);

  // Focus the first interactive element in a container
  const focusFirstInteractive = useCallback((container: HTMLElement) => {
    const firstFocusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, []);

  // Trap focus within a container (for modals, dropdowns)
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus the first element
    if (firstFocusable) {
      firstFocusable.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return {
    storeFocus,
    restoreFocus,
    focusFirstInteractive,
    trapFocus,
  };
}

/**
 * Live Region for Announcements
 */
export function LiveRegion({ 
  children, 
  level = 'polite',
  role = 'status' 
}: { 
  children: React.ReactNode; 
  level?: 'polite' | 'assertive' | 'off';
  role?: 'status' | 'alert' | 'log';
}) {
  return (
    <div
      aria-live={level}
      aria-atomic="true"
      role={role}
      className="sr-only"
    >
      {children}
    </div>
  );
}

/**
 * Keyboard Navigation Component
 */
export function KeyboardNavigation({ 
  children,
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
}: {
  children: React.ReactNode;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onEscape?.();
        break;
      case 'Enter':
        onEnter?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        onArrowRight?.();
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown} tabIndex={-1}>
      {children}
    </div>
  );
}

/**
 * Accessible Button with proper focus management
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
}

export function AccessibleButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Loading...',
  disabled,
  className = '',
  ...props
}: AccessibleButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center
        font-medium rounded-md border border-transparent
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled || loading}
      aria-describedby={loading ? 'loading-description' : undefined}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only" id="loading-description">
            {loadingText}
          </span>
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * High Contrast Mode Detection and Styles
 */
export function useHighContrastMode() {
  const isHighContrast = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    isHighContrast.current = mediaQuery.matches;

    const handleChange = (e: MediaQueryListEvent) => {
      isHighContrast.current = e.matches;
      
      // Update CSS custom properties for high contrast
      if (e.matches) {
        document.documentElement.style.setProperty('--color-text', '#000000');
        document.documentElement.style.setProperty('--color-background', '#ffffff');
        document.documentElement.style.setProperty('--color-border', '#000000');
        document.documentElement.style.setProperty('--color-link', '#0000ff');
      } else {
        // Reset to default values
        document.documentElement.style.removeProperty('--color-text');
        document.documentElement.style.removeProperty('--color-background');
        document.documentElement.style.removeProperty('--color-border');
        document.documentElement.style.removeProperty('--color-link');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    handleChange({ matches: mediaQuery.matches } as MediaQueryListEvent);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { isHighContrast: isHighContrast.current };
}

/**
 * Screen Reader Text Component
 */
export function ScreenReaderText({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * Accessible Form Field with proper labeling
 */
interface AccessibleFieldProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactElement;
}

export function AccessibleField({
  label,
  error,
  description,
  required = false,
  children,
}: AccessibleFieldProps) {
  const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const descriptionId = description ? `${fieldId}-description` : undefined;

  // Clone the child element to add accessibility attributes
  const childWithProps = React.cloneElement(children, {
    id: fieldId,
    'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? 'true' : undefined,
    'aria-required': required,
  });

  return (
    <div className="space-y-1">
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-gray-500">
          {description}
        </p>
      )}
      
      {childWithProps}
      
      {error && (
        <p 
          id={errorId} 
          className="text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}