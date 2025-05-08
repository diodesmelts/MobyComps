import { useLocation } from "wouter";

export function useSearchParams() {
  const [location] = useLocation();
  
  // Find the '?' that starts the query string (if it exists)
  const queryIndex = location.indexOf('?');
  
  // Extract the search portion (empty string if no query string)
  const search = queryIndex !== -1 ? location.slice(queryIndex) : '';
  
  return { search };
}