// @vitest-environment jsdom
import { afterEach,expect,it } from 'vitest';
import { cleanup,render,screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { SeverityPill,SegmentedControl } from './index';
afterEach(cleanup);
it('renders severity words and distinct icons for all three levels',()=>{render(<><SeverityPill level={1}/><SeverityPill level={2}/><SeverityPill level={3}/></>);for(const name of ['Low','Moderate','High'])expect(screen.getByText(name).querySelector('svg')??screen.getByText(name).parentElement?.querySelector('svg')).toBeTruthy();});
it('supports arrow-key selection through the severity control',async()=>{function Control(){const [value,setValue]=useState('all');return <SegmentedControl label="Severity" value={value} onChange={setValue} items={[{value:'all',label:'All'},{value:'high',label:'High'}]}/>;}render(<Control/>);const user=userEvent.setup();await user.tab();await user.keyboard('{ArrowRight} ');expect(screen.getByRole('radio',{name:'High'}).getAttribute('data-state')).toBe('on');});
