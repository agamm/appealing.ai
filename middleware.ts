import { NextFetchEvent, NextRequest, NextResponse } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { ipAddress } from '@vercel/functions'

// Create Redis client only if configured
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Create a single rate limiter for all API routes
const ratelimit = redis
  ? new Ratelimit({
      redis: redis,
      enableProtection: true,
      limiter: Ratelimit.slidingWindow(256, "1 h"), // 256 requests per hour per IP
    })
  : null

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent,
): Promise<Response | undefined> {
  // Only apply rate limiting to API routes
  if (!request.nextUrl.pathname.includes('/api/expand')) {
    return NextResponse.next()
  }

  // Skip if rate limiting is not configured
  if (!ratelimit) {
    return NextResponse.next()
  }

  const ip = ipAddress(request) ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)
  
  return success
    ? NextResponse.next()
    : NextResponse.json(
        {
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
        },
        { status: 429 }
      )
}

export const config = {
  matcher: "/api/:path*",
}