// Performance monitoring utilities
import React from 'react';

/**
 * Performance measurement decorator
 */
export const measurePerformance = (name: string) => {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const start = performance.now();
      const result = originalMethod.apply(this, args);
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${name} took ${end - start} milliseconds`);
      }
      
      return result;
    };
    
    return descriptor;
  };
};

/**
 * Memory usage tracking
 */
export const trackMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize / 1048576, // MB
      totalJSHeapSize: memory.totalJSHeapSize / 1048576, // MB
      jsHeapSizeLimit: memory.jsHeapSizeLimit / 1048576 // MB
    };
  }
  return null;
};

/**
 * Web Vitals tracking
 */
export const trackWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

/**
 * Lazy component loader with loading state
 */
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return React.lazy(importFunc);
};

/**
 * Virtual scrolling hook for large lists
 */
export const useVirtualScrolling = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    startIndex,
    endIndex,
    offsetY,
    setScrollTop
  };
};

/**
 * Debounced state hook
 */
export const useDebouncedState = <T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] => {
  const [value, setValue] = React.useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState<T>(initialValue);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return [value, debouncedValue, setValue];
};

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  
  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [elementRef, options]);
  
  return isIntersecting;
};

/**
 * Bundle size analyzer
 */
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis available in production build with ANALYZE=true');
  }
};

export default {
  measurePerformance,
  trackMemoryUsage,
  trackWebVitals,
  createLazyComponent,
  useVirtualScrolling,
  useDebouncedState,
  useIntersectionObserver,
  analyzeBundleSize
};