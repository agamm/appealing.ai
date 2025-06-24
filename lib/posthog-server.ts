import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

export function getPostHogClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return null
  }

  if (!posthogClient) {
    posthogClient = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY,
      {
        host: 'https://us.i.posthog.com',
        flushAt: 1, // Flush events immediately in serverless environment
        flushInterval: 0 // Disable time-based flushing
      }
    )
  }

  return posthogClient
}

export async function captureEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
  distinctId?: string
) {
  const client = getPostHogClient()
  if (!client) return

  try {
    client.capture({
      distinctId: distinctId || 'anonymous',
      event: eventName,
      properties
    })
    
    // Flush events immediately in serverless environment
    await client.flush()
  } catch (error) {
    console.error('Failed to capture PostHog event:', error)
  }
}