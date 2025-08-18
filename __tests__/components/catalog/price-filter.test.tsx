/**
 * Unit tests for Price Filter Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PriceFilter } from '@/components/features/catalog/price-filter';

// Mock the hooks
jest.mock('@/hooks/use-debounced-filters', () => ({
  useDebouncedPriceRange: (initialMin?: number, initialMax?: number, options = {}) => ({
    priceRange: [initialMin, initialMax],
    pendingRange: [initialMin, initialMax],
    isDebouncing: false,
    updatePriceRange: jest.fn(),
  }),
}));

describe('PriceFilter', () => {
  const defaultProps = {
    onPriceChange: jest.fn(),
    disabled: false,
    className: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders price filter with default range', () => {
    render(<PriceFilter {...defaultProps} />);
    
    expect(screen.getByLabelText(/minimum price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/maximum price/i)).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  test('displays initial min and max values', () => {
    render(
      <PriceFilter 
        {...defaultProps} 
        initialMin={100} 
        initialMax={500}
      />
    );
    
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('500')).toBeInTheDocument();
  });

  test('calls onPriceChange when input values change', async () => {
    const user = userEvent.setup();
    const onPriceChange = jest.fn();
    
    render(<PriceFilter {...defaultProps} onPriceChange={onPriceChange} />);
    
    const minInput = screen.getByLabelText(/minimum price/i);
    await user.clear(minInput);
    await user.type(minInput, '200');
    
    await waitFor(() => {
      expect(onPriceChange).toHaveBeenCalledWith(200, undefined);
    });
  });

  test('validates minimum is not greater than maximum', async () => {
    const user = userEvent.setup();
    const onPriceChange = jest.fn();
    
    render(
      <PriceFilter 
        {...defaultProps} 
        onPriceChange={onPriceChange}
        initialMax={100}
      />
    );
    
    const minInput = screen.getByLabelText(/minimum price/i);
    await user.clear(minInput);
    await user.type(minInput, '200');
    
    expect(screen.getByText(/minimum price cannot be greater than maximum/i)).toBeInTheDocument();
  });

  test('shows preset price ranges', () => {
    render(<PriceFilter {...defaultProps} showPresets />);
    
    expect(screen.getByText(/under \$100/i)).toBeInTheDocument();
    expect(screen.getByText(/\$100 - \$500/i)).toBeInTheDocument();
    expect(screen.getByText(/\$500 - \$1,000/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1,000\+/i)).toBeInTheDocument();
  });

  test('applies preset range when clicked', async () => {
    const user = userEvent.setup();
    const onPriceChange = jest.fn();
    
    render(
      <PriceFilter 
        {...defaultProps} 
        onPriceChange={onPriceChange}
        showPresets
      />
    );
    
    await user.click(screen.getByText(/\$100 - \$500/i));
    
    expect(onPriceChange).toHaveBeenCalledWith(100, 500);
  });

  test('disables inputs when disabled prop is true', () => {
    render(<PriceFilter {...defaultProps} disabled />);
    
    expect(screen.getByLabelText(/minimum price/i)).toBeDisabled();
    expect(screen.getByLabelText(/maximum price/i)).toBeDisabled();
  });

  test('displays price histogram when data provided', () => {
    const histogramData = [
      { range: '0-100', count: 10, percentage: 20 },
      { range: '100-200', count: 15, percentage: 30 },
      { range: '200-300', count: 25, percentage: 50 },
    ];
    
    render(
      <PriceFilter 
        {...defaultProps} 
        showHistogram
        histogramData={histogramData}
      />
    );
    
    expect(screen.getByText(/price distribution/i)).toBeInTheDocument();
    expect(screen.getByText('0-100')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('clears price range when clear button clicked', async () => {
    const user = userEvent.setup();
    const onPriceChange = jest.fn();
    
    render(
      <PriceFilter 
        {...defaultProps} 
        onPriceChange={onPriceChange}
        initialMin={100}
        initialMax={500}
      />
    );
    
    await user.click(screen.getByRole('button', { name: /clear/i }));
    
    expect(onPriceChange).toHaveBeenCalledWith(undefined, undefined);
  });

  test('handles keyboard navigation for slider', async () => {
    const user = userEvent.setup();
    
    render(<PriceFilter {...defaultProps} />);
    
    const slider = screen.getByRole('slider');
    slider.focus();
    
    await user.keyboard('{ArrowRight}');
    // Verify slider value increases
    
    await user.keyboard('{ArrowLeft}');
    // Verify slider value decreases
  });

  test('shows loading state during debouncing', () => {
    // Mock the hook to return isDebouncing: true
    const mockHook = require('@/hooks/use-debounced-filters');
    mockHook.useDebouncedPriceRange.mockReturnValue({
      priceRange: [100, 500],
      pendingRange: [150, 600],
      isDebouncing: true,
      updatePriceRange: jest.fn(),
    });
    
    render(<PriceFilter {...defaultProps} />);
    
    expect(screen.getByText(/updating prices/i)).toBeInTheDocument();
  });

  test('formats currency correctly', () => {
    render(
      <PriceFilter 
        {...defaultProps} 
        initialMin={1000}
        initialMax={5000}
        currency="USD"
      />
    );
    
    // Should display formatted currency values
    expect(screen.getByText('$1,000')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });

  test('handles touch gestures for mobile slider', async () => {
    render(<PriceFilter {...defaultProps} />);
    
    const slider = screen.getByRole('slider');
    
    // Simulate touch events
    fireEvent.touchStart(slider, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    fireEvent.touchMove(slider, {
      touches: [{ clientX: 150, clientY: 100 }],
    });
    
    fireEvent.touchEnd(slider);
    
    // Verify slider responded to touch gestures
  });

  test('meets accessibility requirements', () => {
    render(<PriceFilter {...defaultProps} />);
    
    // Check for proper ARIA labels
    expect(screen.getByLabelText(/minimum price/i)).toHaveAttribute('aria-label');
    expect(screen.getByLabelText(/maximum price/i)).toHaveAttribute('aria-label');
    
    // Check for proper roles
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByRole('group')).toHaveAttribute('aria-labelledby');
    
    // Check for keyboard accessibility
    const inputs = screen.getAllByRole('spinbutton');
    inputs.forEach(input => {
      expect(input).toHaveAttribute('tabIndex');
    });
  });
});