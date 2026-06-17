interface AgeChartProps {
  buckets: { label: string; count: number }[]
}

export function AgeChart({ buckets }: AgeChartProps) {
  const max = Math.max(1, ...buckets.map(b => b.count))

  return (
    <div className="card p-6">
      <h2 className="section-title mb-4">Altersstruktur</h2>
      <div className="flex h-24 items-end gap-2">
        {buckets.map(bucket => {
          const heightPct = Math.max(6, (bucket.count / max) * 100)
          return (
            <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-ink-subtle tabular-nums">{bucket.count}</span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-sm bg-brand-gold transition-all duration-500"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {buckets.map(bucket => (
          <span key={bucket.label} className="flex-1 text-center text-[10px] text-ink-subtle">
            {bucket.label}
          </span>
        ))}
      </div>
    </div>
  )
}
