// Rate limiting constants for client-side usage
export const RATE_LIMITS = {
  // Daily search limit
  DAILY_SEARCHES: 50,
  
  // Try more suggestions limit per search
  TRY_MORE_PER_SEARCH: 5,
  
  // Domain check batch size
  DOMAIN_CHECK_BATCH_SIZE: 5,
  
  // Debounce delay for search input (ms)
  SEARCH_DEBOUNCE_DELAY: 500,
  
  // Scroll throttle delay (ms)
  SCROLL_THROTTLE_DELAY: 100,
  
  // Initial visible domains count
  INITIAL_VISIBLE_DOMAINS: 100,
  
  // Load more increment
  LOAD_MORE_INCREMENT: 50,
} as const