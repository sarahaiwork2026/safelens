import { ArrowUpRight } from 'lucide-react';
import { copy } from '../../copy';
import { Pipeline } from '../landing/Pipeline';
import { Contacts } from '../../components/incident/Contacts';
export default function AboutPage(){return <div className="container page about-page"><div className="page-title"><h1>{copy.headings.about}</h1></div><section><h2>{copy.about.how}</h2><Pipeline/></section><section><h2>{copy.about.ethics}</h2><ul className="about-list">{copy.about.principles.map(item=><li key={item}>{item}</li>)}</ul></section><section><h2>{copy.landing.limitations}</h2><ul className="about-list">{copy.limitations.map(item=><li key={item}>{item}</li>)}</ul></section><section><h2>{copy.about.services}</h2><ul className="service-list">{copy.about.servicesList.map(service=><li key={service.href}><a href={service.href} target="_blank" rel="noreferrer">{service.name}<ArrowUpRight size={16}/></a></li>)}</ul></section><Contacts/></div>;}
