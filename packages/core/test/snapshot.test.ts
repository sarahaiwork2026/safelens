import { expect,it } from 'vitest';
import { buildDemoSnapshot } from '../src/demo-snapshot';
import snapshot from '../../../apps/web/src/features/landing/demo-incident.json';
it('keeps the displayed incident snapshot in sync with the real pipeline',()=>{expect(snapshot).toEqual(buildDemoSnapshot());expect(snapshot.incident.reportCount).toBe(5);expect(snapshot.incident.evidence).toEqual({supported:2,disputed:1,unconfirmed:1});});
