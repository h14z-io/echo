import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'echo-auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)

  return NextResponse.json({
    authenticated: token?.value === 'authenticated',
  })
}

export async function POST(request: NextRequest) {
  const { code } = await request.json()
  const accessCode = process.env.ACCESS_CODE

  if (!accessCode) {
    return NextResponse.json(
      { error: 'Access code not configured' },
      { status: 500 }
    )
  }

  if (code !== accessCode) {
    return NextResponse.json(
      { error: 'Invalid code' },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ authenticated: true })

  response.cookies.set(COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })

  return response
}
