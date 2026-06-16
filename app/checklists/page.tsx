'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Trash2, GripVertical, Save, CheckSquare,
  Star, StarOff, Loader2, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChecklistTemplate, ChecklistItem } from '@/types'

export default function ChecklistsPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    setTemplates((data || []) as ChecklistTemplate[])
    if (data && data.length > 0 && !selected) setSelected(data[0].id)
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

    const maxOrder = items.reduce((max, i) => Math.max(max, i.sort_order), 0)
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
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function toggleRequired(item: ChecklistItem) {
    const { data } = await supabase
      .from('checklist_items')
      .update({ is_required: !item.is_required })
      .eq('id', item.id)
      .select()
      .single()

    if (data) setItems(prev => prev.map(i => i.id === item.id ? data as ChecklistItem : i))
  }

  async function updateLabel(id: string, label: string) {
    await supabase.from('checklist_items').update({ label }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, label } : i))
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

  const selectedTemplate = templates.find(t => t.id === selected)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-ink-faint animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Checklisten</h1>
          <p className="text-sm text-ink-muted mt-1">Prüfungsvoraussetzungen verwalten</p>
        </div>
        <button onClick={createTemplate} className="btn-secondary">
          <Plus className="w-4 h-4" />
          Neue Vorlage
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Template sidebar */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider px-2 mb-2">
            Vorlagen
          </p>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                selected === t.id
                  ? 'bg-ink text-surface-0 font-medium'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-2'
              )}
            >
              <span className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{t.name}</span>
                {t.is_default && (
                  <span className="text-[10px] bg-accent-light text-accent px-1.5 rounded ml-auto flex-shrink-0">
                    Standard
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Editor */}
        {selected && selectedTemplate && (
          <div className="lg:col-span-3 card">
            <div className="px-6 py-4 border-b border-surface-3 flex items-center justify-between">
              <div>
                <h2 className="section-title">{selectedTemplate.name}</h2>
                <p className="section-subtitle mt-0.5">{items.length} Punkte</p>
              </div>
            </div>

            <div className="p-6 space-y-2">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="w-8 h-8 text-ink-faint mx-auto mb-2" />
                  <p className="text-sm text-ink-muted">Noch keine Punkte</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-surface-3 bg-surface-0 hover:bg-surface-1 group"
                  >
                    <GripVertical className="w-4 h-4 text-ink-faint group-hover:text-ink-subtle cursor-grab flex-shrink-0" />

                    <span className="text-xs text-ink-faint w-5 text-center tabular-nums">{index + 1}</span>

                    <input
                      type="text"
                      value={item.label}
                      onChange={e => updateLabel(item.id, e.target.value)}
                      className="flex-1 text-sm text-ink bg-transparent border-none outline-none focus:ring-0 p-0"
                    />

                    <button
                      onClick={() => toggleRequired(item)}
                      title={item.is_required ? 'Pflichtpunkt (Klick zum Deaktivieren)' : 'Optional (Klick für Pflicht)'}
                      className={cn(
                        'flex-shrink-0 transition-colors',
                        item.is_required ? 'text-amber-500 hover:text-amber-600' : 'text-ink-faint hover:text-ink-subtle'
                      )}
                    >
                      {item.is_required ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="flex-shrink-0 text-ink-faint hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}

              {/* Add item */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Neuen Punkt hinzufügen…"
                  value={newItemLabel}
                  onChange={e => setNewItemLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                />
                <button
                  onClick={addItem}
                  disabled={!newItemLabel.trim()}
                  className="btn-primary flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Hinzufügen
                </button>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-surface-3 flex items-center gap-2 text-xs text-ink-subtle">
              <Star className="w-3 h-3 text-amber-500" />
              Stern-Punkte sind Pflichtfelder und werden bei der Prüfungsbereitschaft berücksichtigt
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
