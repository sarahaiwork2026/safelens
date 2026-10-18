import { ACCUSATION } from './lexicon';
import { has, norm } from './text';
import type { RejectionCode } from './schema';
export function rejectReason(raw: string, clean: string): RejectionCode | null {
  if ([...raw].length > 1000) return 'too_long';
  if (
    [...clean.replace(/\s/g, '')].length < 10 ||
    clean.split(/\s+/).length < 2
  )
    return 'too_short';
  if (has(norm(clean), ACCUSATION)) return 'accusation';
  return null;
}
