import posthog from "posthog-js"

// Initialize PostHog client automatically on the client-side
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  capture_pageview: 'history_change', // track history change pageviews
  capture_pageleave: true,             // track pageleave events
  capture_exceptions: true,            // enable error tracking
  debug: process.env.NODE_ENV === "development",
});
