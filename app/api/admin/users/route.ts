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

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 403 })
  }

  const body = await request.json()
  const email = String(body.email || '').trim()
  const password = String(body.password || '')
  const fullName = String(body.fullName || '').trim()
  const role = body.role as UserRole

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: 'E-Mail und ein Passwort mit mindestens 8 Zeichen sind erforderlich.' },
      { status: 400 }
    )
  }

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Ungültige Rolle.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || null },
  })

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message || 'Nutzer konnte nicht angelegt werden.' },
      { status: 400 }
    )
  }

  // handle_new_user() trigger already created a profile row with role 'reader' —
  // update it to the requested role and name.
  const { error: updateError } = await admin
    .from('profiles')
    .update({ role, full_name: fullName || null })
    .eq('id', created.user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ id: created.user.id })
}
