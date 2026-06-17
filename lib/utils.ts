import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInYears, format, parseISO, isAfter, isBefore, addDays } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Graduation } from '@/types'

// ─── Class Name Utility ───────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

export function calculateAge(birthDate: string): number {
  return differenceInYears(new Date(), parseISO(birthDate))
}

export function formatDate(date: string, fmt = 'dd.MM.yyyy'): string {
  return format(parseISO(date), fmt, { locale: de })
}

export function formatDateTime(date: string): string {
  return format(parseISO(date), "dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de })
}

export function isExpiringSoon(date: string, days = 30): boolean {
  const expiry = parseISO(date)
  const soon = addDays(new Date(), days)
  return isAfter(expiry, new Date()) && isBefore(expiry, soon)
}

export function isExpired(date: string): boolean {
  return isBefore(parseISO(date), new Date())
}

// ─── File Utilities ───────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
}

export const MAX_FILE_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || 10)
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isImageFile(fileFormat: string): boolean {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileFormat.toLowerCase())
}

export function isPdfFile(fileFormat: string): boolean {
  return fileFormat.toLowerCase() === 'pdf'
}

// ─── Graduation Utilities ─────────────────────────────────────────────────────

export function getGraduationBorderStyle(graduation?: Graduation | null) {
  if (!graduation) return { borderColor: '#e5e7eb', borderWidth: '2px' }
  return {
    borderColor: graduation.border_color,
    borderWidth: '2px',
    borderStyle: 'solid',
  }
}

/** CSS background for a belt dot/bar: solid color, or a 50/50 split for two-tone grades. */
export function getGraduationBackground(graduation?: Pick<Graduation, 'border_color' | 'secondary_color'> | null): string {
  if (!graduation) return '#e5e7eb'
  if (!graduation.secondary_color) return graduation.border_color
  return `linear-gradient(135deg, ${graduation.border_color} 50%, ${graduation.secondary_color} 50%)`
}

export function getGraduationColorName(color: string): string {
  const map: Record<string, string> = {
    '#e5e7eb': 'Weiß',
    '#eab308': 'Gelb',
    '#16a34a': 'Grün',
    '#2563eb': 'Blau',
    '#111110': 'Schwarz',
    '#dc2626': 'Rot',
  }
  return map[color] || color
}

// ─── Status Utilities ─────────────────────────────────────────────────────────

export const STATUS_LABELS = {
  active: 'Aktiv',
  paused: 'Pausiert',
  left: 'Ausgetreten',
}

export const STATUS_COLORS = {
  active: 'bg-green-50 text-green-700 border-green-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  left: 'bg-gray-50 text-gray-500 border-gray-200',
}

export const EXAM_STATUS_LABELS = {
  planned: 'Geplant',
  open: 'Offen',
  completed: 'Abgeschlossen',
}

export const EXAM_STATUS_COLORS = {
  planned: 'bg-blue-50 text-blue-700 border-blue-200',
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
}

export const GENDER_LABELS = {
  male: 'Männlich',
  female: 'Weiblich',
  other: 'Divers',
}

export const MEMBER_GROUP_LABELS = {
  children: 'Kinder',
  youth_adults: 'Jugend/Erwachsene',
}
