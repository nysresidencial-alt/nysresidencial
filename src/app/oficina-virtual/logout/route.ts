import { clearClientSession } from '@/lib/client-auth'
import { redirect } from 'next/navigation'

export async function GET() {
  await clearClientSession()
  redirect('/')
}

export async function POST() {
  await clearClientSession()
  redirect('/')
}
