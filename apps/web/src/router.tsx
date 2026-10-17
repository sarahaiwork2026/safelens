import { createBrowserRouter } from 'react-router';
import { AppShell } from './app/AppShell';
import { ActionLink } from './components/ui';
import { copy } from './copy';
const page=(name:keyof typeof copy.headings)=><div className="container page"><h1>{copy.headings[name]}</h1></div>;
export const router=createBrowserRouter([{Component:AppShell,children:[{path:'/',element:page('incidents')},{path:'/report',lazy:async()=>({Component:(await import('./features/report/ReportPage')).default})},{path:'/incidents',lazy:async()=>({Component:(await import('./features/incidents/IncidentsPage')).default})},{path:'/incidents/:ref',lazy:async()=>({Component:(await import('./features/incident/IncidentPage')).default})},{path:'/map',element:page('map')},{path:'/test-lab',element:page('lab')},{path:'/about',element:page('about')},{path:'*',element:<div className="container page empty-state"><h1>{copy.headings.notFound}</h1><ActionLink to="/incidents">{copy.actions.go}</ActionLink></div>}]}]);
