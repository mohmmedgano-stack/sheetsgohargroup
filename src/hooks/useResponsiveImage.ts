import { useState, useEffect, useRef, useMemo } from 'react';

export interface ResponsiveImageOptions {
  src?: string | null;
  fallbackSrc?: string;
  widths?: number[];
  sizes?: string;
  quality?: number;
}

export interface ResponsiveImageResult {
  src: string;
  srcSet: string;
  sizes: string;
  currentWidth: number;
  isMobile: boolean;
  imgProps: {
    src: string;
    srcSet: string;
    sizes: string;
    loading: 'lazy';
    decoding: 'async';
  };
}

// Breakpoint tiers for determining device resolution bucket
// Only transitions between these tiers cause a state update, eliminating redundant DOM re-renders during micro-resizing.
const DEFAULT_WIDTHS = [320, 480, 640, 768, 1024, 1280];

function getWidthBucketIndex(width: number, widths: number[]): number {
  for (let i = 0; i < widths.length; i++) {
    if (width <= widths[i]) {
      return i;
    }
  }
  return widths.length - 1;
}

/**
 * Optimizes a URL (e.g. Unsplash or parametric images) for a specific width and quality.
 */
function buildOptimizedUrl(url: string, targetWidth: number, quality: number = 80): string {
  if (!url) return '';

  // Unsplash image optimization
  if (url.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('w', String(targetWidth));
      urlObj.searchParams.set('q', String(quality));
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      return urlObj.toString();
    } catch {
      // If parsing fails, fall back to regex replacement
      if (url.includes('w=')) {
        return url.replace(/w=\d+/, `w=${targetWidth}`);
      }
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}w=${targetWidth}&q=${quality}&auto=format`;
    }
  }

  return url;
}

/**
 * Custom hook `useResponsiveImage`
 * Handles dynamic `srcset` switching based on window innerWidth.
 * Ensures mobile devices download smaller file versions of assets without needing full DOM re-renders.
 */
export function useResponsiveImage(
  input: string | null | undefined | ResponsiveImageOptions,
  fallbackSrc: string = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'
): ResponsiveImageResult {
  const options: ResponsiveImageOptions = useMemo(() => {
    if (typeof input === 'object' && input !== null) {
      return input;
    }
    return { src: typeof input === 'string' ? input : null, fallbackSrc };
  }, [input, fallbackSrc]);

  const rawSrc = options.src || options.fallbackSrc || fallbackSrc;
  const widths = useMemo(() => options.widths || DEFAULT_WIDTHS, [options.widths]);
  const quality = options.quality ?? 80;
  const sizes = options.sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  // Compute initial window width safely
  const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const initialBucket = getWidthBucketIndex(initialWidth, widths);

  // Store the active bucket index in state. Only changes when user crosses a breakpoint threshold!
  const [bucketIndex, setBucketIndex] = useState<number>(initialBucket);
  const currentBucketRef = useRef<number>(initialBucket);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId: number | null = null;

    const handleResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const currentWindowWidth = window.innerWidth;
        const newBucket = getWidthBucketIndex(currentWindowWidth, widths);
        
        // Critical: Only update React state if the resolution bucket actually changed
        // This avoids full DOM re-renders on minor pixel resize events!
        if (newBucket !== currentBucketRef.current) {
          currentBucketRef.current = newBucket;
          setBucketIndex(newBucket);
        }
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [widths]);

  const currentWidth = widths[bucketIndex] || widths[0];
  const isMobile = currentWidth < 768;

  // Build current src and srcset string
  const currentSrc = useMemo(() => {
    return buildOptimizedUrl(rawSrc, currentWidth, quality);
  }, [rawSrc, currentWidth, quality]);

  const srcSet = useMemo(() => {
    return widths
      .map(w => `${buildOptimizedUrl(rawSrc, w, quality)} ${w}w`)
      .join(', ');
  }, [rawSrc, widths, quality]);

  return {
    src: currentSrc,
    srcSet,
    sizes,
    currentWidth,
    isMobile,
    imgProps: {
      src: currentSrc,
      srcSet,
      sizes,
      loading: 'lazy',
      decoding: 'async',
    },
  };
}
