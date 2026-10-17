import { expect, it } from 'vitest';
import fixtures from '../fixtures/test-reports.json';
import areas from '../data/karachi-areas.json';
it('ships all fixtures and their gazetteer locations', () => { expect(fixtures.reports).toHaveLength(25); for (const r of fixtures.reports) if (r.expected.areaId) expect(areas.areas.some(a => a.id === r.expected.areaId)).toBe(true); });
