import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isDomainAvailable } from '@/lib/whois'

const requestSchema = z.object({
  domain: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain } = requestSchema.parse(body)
    
    const isAvailable = await isDomainAvailable(domain)
    
    return NextResponse.json({ 
      domain,
      isAvailable 
    })
    
  } catch (error) {
    console.error('Error checking domain:', error)
    return NextResponse.json(
      { error: 'Failed to check domain availability' },
      { status: 500 }
    )
  }
}