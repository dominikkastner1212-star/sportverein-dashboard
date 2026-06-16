import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ExamForm } from '@/components/exams/ExamForm'
import type { Exam, Graduation } from '@/types'

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/auth/login')
  }

  const [{ data: profile }, { data: exam }, { data: graduations }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single(),
    supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('graduations')
      .select('*')
      .order('rank_order'),
  ])

  const canEdit = profile?.role === 'admin' || profile?.role === 'trainer'
  if (!canEdit) {
    redirect(`/exams/${id}`)
  }

  if (!exam) {
    notFound()
  }

  return (
    <ExamForm
      exam={exam as Exam}
      graduations={(graduations || []) as Graduation[]}
      examinerId={exam.examiner_id || session.user.id}
    />
  )
}
