import { useQuery } from '@tanstack/react-query';
import { Popover } from 'radix-ui';
import { copy } from '../../copy';
import { Button } from '../ui';
import { incidentsQuery } from '../../lib/query';
export default function AlertHost(){const {data}=useQuery({...incidentsQuery(),refetchInterval:10000,refetchIntervalInBackground:false});const level=data?.counts.high?3:data?.counts.moderate?2:data?.counts.low?1:0;const count=level===3?data?.counts.high:level===2?data?.counts.moderate:data?.counts.low;return <Popover.Root><Popover.Trigger asChild><Button variant="secondary" className="beacon"><span className={`dot level-${level===3?'high':level===2?'mod':'low'}`}/>{data?(level?copy.alerts.count(count??0,copy.severity[level]):copy.alerts.clear):copy.alerts.title}</Button></Popover.Trigger><Popover.Portal><Popover.Content className="popover" sideOffset={12} align="end"><h2>{copy.alerts.title}</h2><p>{copy.empty.alerts}</p></Popover.Content></Popover.Portal></Popover.Root>;}
