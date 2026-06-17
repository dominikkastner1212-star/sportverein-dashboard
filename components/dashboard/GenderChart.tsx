interface GenderChartProps {
  male: number
  female: number
  other: number
}

export function GenderChart({ male, female, other }: GenderChartProps) {
  const total = male + female + other
  const malePct = total > 0 ? (male / total) * 100 : 0
  const femalePct = total > 0 ? (female / total) * 100 : 0

  const gradient = total > 0
    ? `conic-gradient(#28509e 0% ${malePct}%, #d9a828 ${malePct}% ${malePct + femalePct}%, #d1d5db ${malePct + femalePct}% 100%)`
    : '#eeeeeb'

  return (
    <div className="card p-6">
      <h2 className="section-title mb-4">Geschlechterverteilung</h2>
      <div className="flex items-center gap-6">
        <div
          className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: gradient }}
        >
          <div className="h-[54px] w-[54px] rounded-full bg-surface-0" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-blue" />
            Männlich — <strong className="text-ink">{male} ({malePct.toFixed(0)}%)</strong>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-gold" />
            Weiblich — <strong className="text-ink">{female} ({femalePct.toFixed(0)}%)</strong>
          </div>
          {other > 0 && (
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-surface-3" />
              Divers — <strong className="text-ink">{other}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
