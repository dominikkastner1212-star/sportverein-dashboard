'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, GripVertical, CheckSquare, Star, StarOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { ChecklistTemplate, ChecklistItem } from '@/types'

function isExamTemplate(name: string) {
  const normalizedName = name.trim().toLowerCase()
  return normalizedName === 'prüfung' || normalizedName === 'pruefung'
}

export default function ChecklistsPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItemLabel, setNewItemLabel] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    if (selected) loadItems(selected)
  }, [selected])

  async function loadTemplates() {
    const { data } = await supabase
      .from('checklist_templates')
      .select('*')
      .order('created_at')

    const nextTemplates = (data || []) as ChecklistTemplate[]
    const preferredTemplate = nextTemplates.find(template => isExamTemplate(template.name)) || nextTemplates[0]

    setTemplates(nextTemplates)
    if (preferredTemplate && !selected) setSelected(preferredTemplate.id)
    setLoading(false)
  }

  async function loadItems(templateId: string) {
    const { data } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('template_id', templateId)
      .order('sort_order')

    setItems((data || []) as ChecklistItem[])
  }

  async function addItem() {
    if (!selected || !newItemLabel.trim()) return

    const maxOrder = items.reduce((max, item) => Math.max(max, item.sort_order), 0)
    const { data, error } = await supabase
      .from('checklist_items')
      .insert({
        template_id: selected,
        label: newItemLabel.trim(),
        is_required: false,
        sort_order: maxOrder + 1,
      })
      .select()
      .single()

    if (!error && data) {
      setItems(prev => [...prev, data as ChecklistItem])
      setNewItemLabel('')
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Diesen Punkt löschen?')) return

    await supabase.from('checklist_items').delete().eq('id', id)
    setItems(prev => prev.filter(item => item.id !== id))
  }

  async function toggleRequired(item: ChecklistItem) {
    const { data } = await supabase
      .from('checklist_items')
      .update({ is_required: !item.is_required })
      .eq('id', item.id)
      .select()
      .single()

    if (data) {
      setItems(prev => prev.map(currentItem => (
        currentItem.id === item.id ? data as ChecklistItem : currentItem
      )))
    }
  }

  async function updateLabel(id: string, label: string) {
    await supabase.from('checklist_items').update({ label }).eq('id', id)
    setItems(prev => prev.map(item => (item.id === id ? { ...item, label } : item)))
  }

  async function createTemplate() {
    const name = prompt('Name der neuen Vorlage:')
    if (!name) return

    const { data } = await supabase
      .from('checklist_templates')
      .insert({ name, is_default: false })
      .select()
      .single()

    if (data) {
      setTemplates(prev => [...prev, data as ChecklistTemplate])
      setSelected(data.id)
    }
  }

  const selectedTemplate = templates.find(template => template.id === selected)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Checklisten</h1>
          <p className="mt-1 text-sm text-ink-muted">Prüfungsvoraussetzungen verwalten</p>
        </div>
        <button onClick={createTemplate} className="btn-secondary">
          <Plus className="h-4 w-4" />
          Neue Vorlage
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="space-y-1.5">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Vorlagen
          </p>
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => setSelected(template.id)}
              className={cn(
                'w-full rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150',
                selected === template.id
                  ? 'bg-ink font-medium text-surface-0'
                  : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
              )}
            >
              <span className="flex items-center gap-2">
                <CheckSquare className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{template.name}</span>
                {isExamTemplate(template.name) && (
                  <span className="ml-auto flex-shrink-0 rounded bg-green-50 px-1.5 text-[10px] text-green-700">
                    Prüfung
                  </span>
                )}
                {!isExamTemplate(template.name) && template.is_default && (
                  <span className="ml-auto flex-shrink-0 rounded bg-accent-light px-1.5 text-[10px] text-accent">
                    Standard
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {selected && selectedTemplate && (
          <div className="card lg:col-span-3">
            <div className="flex items-center justify-between border-b border-surface-3 px-6 py-4">
              <div>
                <h2 className="section-title">{selectedTemplate.name}</h2>
                <p className="section-subtitle mt-0.5">{items.length} Punkte</p>
              </div>
            </div>

            <div className="space-y-2 p-6">
              {items.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckSquare className="mx-auto mb-2 h-8 w-8 text-ink-faint" />
                  <p className="text-sm text-ink-muted">Noch keine Punkte</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 rounded-lg border border-surface-3 bg-surface-0 p-3 hover:bg-surface-1"
                  >
                    <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-ink-faint group-hover:text-ink-subtle" />
                    <span className="w-5 text-center text-xs tabular-nums text-ink-faint">{index + 1}</span>
                    <input
                      type="text"
                      value={item.label}
                      onChange={event => updateLabel(item.id, event.target.value)}
                      className="flex-1 border-none bg-transparent p-0 text-sm text-ink outline-none focus:ring-0"
                    />
                    <button
                      onClick={() => toggleRequired(item)}
                      title={item.is_required ? 'Pflichtpunkt (Klick zum Deaktivieren)' : 'Optional (Klick für Pflicht)'}
                      className={cn(
                        'flex-shrink-0 transition-colors',
                        item.is_required ? 'text-amber-500 hover:text-amber-600' : 'text-ink-faint hover:text-ink-subtle'
                      )}
                    >
                      {item.is_required ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="flex-shrink-0 text-ink-faint transition-colors hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Neuen Punkt hinzufügen…"
                  value={newItemLabel}
                  onChange={event => setNewItemLabel(event.target.value)}
                  onKeyDown={event => event.key === 'Enter' && addItem()}
                />
                <button
                  onClick={addItem}
                  disabled={!newItemLabel.trim()}
                  className="btn-primary flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Hinzufügen
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-surface-3 px-6 py-3 text-xs text-ink-subtle">
              <Star className="h-3 w-3 text-amber-500" />
              Die Vorlage „Prüfung“ wird in Prüfungen verwendet. Falls sie fehlt, nutzt das System die Standardvorlage.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
