/**
 * Optimized Image Component
 * Enhanced Next.js Image with lazy loading, blur placeholders, and WebP support
 */

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  quality?: number;
  sizes?: string;
  aspectRatio?: '1:1' | '4:3' | '16:9' | '21:9' | 'auto';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoadingComplete?: () => void;
  fallbackSrc?: string;
  blurDataURL?: string;
  loading?: 'lazy' | 'eager';
}

// Generate shimmer effect for loading placeholder
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f3f4f6" offset="20%" />
      <stop stop-color="#e5e7eb" offset="50%" />
      <stop stop-color="#f3f4f6" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f3f4f6" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

const generateBlurDataURL = (w: number, h: number) =>
  `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  fill = false,
  priority = false,
  className,
  containerClassName,
  quality = 75,
  sizes,
  aspectRatio = 'auto',
  objectFit = 'cover',
  onLoadingComplete,
  fallbackSrc = '/placeholder-image.jpg',
  blurDataURL,
  loading = 'lazy',
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Calculate dimensions based on aspect ratio
  const getDimensions = () => {
    if (fill) return {};
    
    switch (aspectRatio) {
      case '1:1':
        return { width, height: width };
      case '4:3':
        return { width, height: Math.round((width * 3) / 4) };
      case '16:9':
        return { width, height: Math.round((width * 9) / 16) };
      case '21:9':
        return { width, height: Math.round((width * 9) / 21) };
      default:
        return { width, height };
    }
  };

  const dimensions = getDimensions();
  const placeholderDataURL = blurDataURL || generateBlurDataURL(width, height);

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
  }, [src]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    onLoadingComplete?.();
  };

  const handleError = () => {
    setHasError(true);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || fill
    ? sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    : undefined;

  // Container styles for different aspect ratios
  const getContainerStyles = () => {
    if (!fill) return {};
    
    switch (aspectRatio) {
      case '1:1':
        return { paddingBottom: '100%' };
      case '4:3':
        return { paddingBottom: '75%' };
      case '16:9':
        return { paddingBottom: '56.25%' };
      case '21:9':
        return { paddingBottom: '42.86%' };
      default:
        return {};
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        fill && 'w-full',
        containerClassName
      )}
      style={getContainerStyles()}
    >
      <Image
        src={imageSrc}
        alt={alt}
        {...dimensions}
        fill={fill}
        quality={quality}
        sizes={responsiveSizes}
        priority={priority}
        loading={loading}
        placeholder="blur"
        blurDataURL={placeholderDataURL}
        className={cn(
          'transition-opacity duration-300',
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100',
          className
        )}
        style={{
          objectFit,
        }}
        onLoadingComplete={handleLoadingComplete}
        onError={handleError}
      />
      
      {/* Loading skeleton */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"
          aria-hidden="true"
        />
      )}
      
      {/* Error state */}
      {hasError && imageSrc === fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm">Image not available</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Service Card Image - Optimized for service listings
 */
export function ServiceCardImage({
  src,
  alt,
  providerName,
}: {
  src?: string;
  alt: string;
  providerName?: string;
}) {
  return (
    <OptimizedImage
      src={src || '/placeholder-service.jpg'}
      alt={alt}
      width={400}
      height={225}
      aspectRatio="16:9"
      className="group-hover:scale-105 transition-transform duration-300"
      containerClassName="w-full"
      quality={85}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
}

/**
 * Avatar Image - Optimized for user avatars
 */
export function AvatarImage({
  src,
  alt,
  size = 'md',
}: {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };
  
  const dimension = sizeMap[size];
  
  return (
    <OptimizedImage
      src={src || '/placeholder-avatar.jpg'}
      alt={alt}
      width={dimension}
      height={dimension}
      aspectRatio="1:1"
      className="rounded-full"
      quality={90}
      priority={size === 'lg' || size === 'xl'}
    />
  );
}

/**
 * Hero Image - Optimized for large hero sections
 */
export function HeroImage({
  src,
  alt,
  overlay = false,
}: {
  src: string;
  alt: string;
  overlay?: boolean;
}) {
  return (
    <div className="relative w-full h-full">
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover"
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      )}
    </div>
  );
}