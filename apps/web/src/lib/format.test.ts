import { expect,it } from 'vitest';
import { clock,when,relative } from './format';
it('formats Karachi clock time and day boundaries independently of host timezone',()=>{const now=Date.parse('2026-10-18T00:15:00+05:00'),before=Date.parse('2026-10-17T23:30:00+05:00');expect(clock(now)).toBe('12:15 am');expect(when(before,now)).toBe('Yesterday, 11:30 pm');expect(relative(before,now)).toBe('45 min ago');});
