import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-secondary btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Vorherige Seite"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-ink-muted tabular-nums">
        Seite {page} von {pageCount}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        className="btn-secondary btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Nächste Seite"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
