import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/types'

const VALID_ROLES: UserRole[] = ['admin', 'trainer', 'reader']

async function requireAdmin() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  return profile?.role === 'admin' ? session : null
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const role = body.role as UserRole

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Ungültige Rolle.' }, { status: 400 })
  }

  if (id === session.user.id && role !== 'admin') {
    return NextResponse.json(
      { error: 'Du kannst dir nicht selbst die Admin-Rechte entziehen.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ role }).eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 403 })
  }

  const { id } = await params
  if (id === session.user.id) {
    return NextResponse.json({ error: 'Du kannst dich nicht selbst löschen.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
