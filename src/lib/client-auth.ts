import { cookies } from 'next/headers'
import prisma from '@/lib/db'
import crypto from 'crypto'

const SESSION_COOKIE_NAME = 'nys_client_session'
const SECRET_KEY = process.env.SUPABASE_JWT_SECRET || 'nys_residencial_client_secret_salt_2026'

export interface ClientSession {
  id: string
  name: string
  email: string | null
  rut: string | null
  username: string | null
  phone: string | null
}

function sign(payload: string): string {
  const hmac = crypto.createHmac('sha256', SECRET_KEY)
  hmac.update(payload)
  return `${payload}.${hmac.digest('hex')}`
}

function verify(token: string): string | null {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return null
  const payload = token.substring(0, lastDot)
  const signature = token.substring(lastDot + 1)
  const expectedHmac = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex')
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) {
    return payload
  }
  return null
}

export async function createClientSession(client: {
  id: string
  name: string
  email?: string | null
  rut?: string | null
  username?: string | null
  phone?: string | null
}) {
  const cookieStore = await cookies()
  const payload = JSON.stringify({
    id: client.id,
    name: client.name,
    email: client.email || null,
    rut: client.rut || null,
    username: client.username || null,
    phone: client.phone || null,
    issuedAt: Date.now(),
  })

  const token = sign(payload)

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

export async function getClientSession(): Promise<ClientSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const payload = verify(token)
    if (!payload) return null
    const data = JSON.parse(payload)

    // Verify in db that user is still active
    const user = await prisma.clientUser.findUnique({
      where: { id: data.id },
      select: { id: true, name: true, email: true, rut: true, username: true, phone: true, isActive: true },
    })

    if (!user || !user.isActive) return null

    return user
  } catch (e) {
    console.error('Error verifying client session:', e)
    return null
  }
}

export async function clearClientSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
