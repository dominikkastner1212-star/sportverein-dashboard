import type { Graduation } from '@/types'

const LEGACY_GRADUATION_NAMES = new Set([
  'Weisser Guertel',
  'Gelber Guertel',
  'Orange Guertel',
  'Gruener Guertel',
  'Blauer Guertel',
  'Brauner Guertel',
  'Schwarzer Guertel',
  'Weißer Gürtel',
  'Gelber Gürtel',
  'Orange Gürtel',
  'Grüner Gürtel',
  'Blauer Gürtel',
  'Brauner Gürtel',
  'Schwarzer Gürtel',
  'WeiÃŸer GÃ¼rtel',
  'Gelber GÃ¼rtel',
  'Orange GÃ¼rtel',
  'GrÃ¼ner GÃ¼rtel',
  'Blauer GÃ¼rtel',
  'Brauner GÃ¼rtel',
  'Schwarzer GÃ¼rtel',
])

export function getVisibleGraduations(graduations: Graduation[]) {
  return graduations
    .filter(graduation => !LEGACY_GRADUATION_NAMES.has(graduation.name))
    .sort((a, b) => a.rank_order - b.rank_order)
}
