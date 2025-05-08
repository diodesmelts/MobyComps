import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Process image URL to ensure it's properly formatted for display
 * Handles both remote URLs and local uploads
 */
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // For upload paths, use the current host
  if (url.startsWith('/uploads/')) {
    return `${window.location.origin}${url}`;
  }
  
  // All other URLs are returned as-is
  return url;
}

/**
 * Format price to currency string
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(price);
}

/**
 * Format date to UK format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Generate a range of numbers from min to max (inclusive)
 */
export function numberRange(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

/**
 * Returns a random number between min and max (inclusive)
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick random numbers from a range
 */
export function pickRandomNumbers(min: number, max: number, count: number, exclude: number[] = []): number[] {
  const available = numberRange(min, max).filter(n => !exclude.includes(n));
  const result: number[] = [];
  
  if (available.length < count) {
    return available;
  }
  
  while (result.length < count && available.length > 0) {
    const randomIndex = Math.floor(Math.random() * available.length);
    result.push(available[randomIndex]);
    available.splice(randomIndex, 1);
  }
  
  return result.sort((a, b) => a - b);
}

/**
 * Format time in MM:SS format from seconds
 */
export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
