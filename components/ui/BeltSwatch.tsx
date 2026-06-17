import { cn } from '@/lib/utils'
import type { Graduation } from '@/types'

interface BeltSwatchProps {
  graduation?: Pick<Graduation, 'border_color' | 'secondary_color'> | null
  className?: string
}

/**
 * Belt color swatch: left half solid primary color, right half a dashed
 * diagonal pattern in the secondary color for two-tone grades (e.g. "Gruen-Blau").
 * Solid belts just render as a single solid color.
 */
export function BeltSwatch({ graduation, className }: BeltSwatchProps) {
  if (!graduation) {
    return <div className={className} style={{ backgroundColor: '#e8e8e6' }} />
  }

  if (!graduation.secondary_color) {
    return <div className={className} style={{ backgroundColor: graduation.border_color }} />
  }

  return (
    <div className={cn('flex overflow-hidden', className)}>
      <div className="w-1/2 h-full" style={{ backgroundColor: graduation.border_color }} />
      <div
        className="w-1/2 h-full"
        style={{
          backgroundColor: graduation.border_color,
          backgroundImage: `repeating-linear-gradient(135deg, ${graduation.secondary_color} 0px, ${graduation.secondary_color} 3px, transparent 3px, transparent 7px)`,
        }}
      />
    </div>
  )
}
