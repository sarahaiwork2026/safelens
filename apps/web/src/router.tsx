import { createBrowserRouter } from 'react-router';
import { AppShell } from './app/AppShell';
import { ActionLink } from './components/ui';
import { copy } from './copy';
const page=(name:keyof typeof copy.headings)=><div className="container page"><h1>{copy.headings[name]}</h1></div>;
export const router=createBrowserRouter([{Component:AppShell,children:[{path:'/',element:page('incidents')},{path:'/report',element:page('report')},{path:'/incidents',element:page('incidents')},{path:'/incidents/:ref',element:page('details')},{path:'/map',element:page('map')},{path:'/test-lab',element:page('lab')},{path:'/about',element:page('about')},{path:'*',element:<div className="container page empty-state"><h1>{copy.headings.notFound}</h1><ActionLink to="/incidents">{copy.actions.go}</ActionLink></div>}]}]);
