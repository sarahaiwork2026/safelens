import { Link } from 'react-router';
import type { IncidentSummary } from 'core';
import { copy } from '../../copy';
import { SeverityIcon,severityClass } from '../severity';
export function AlertToast({incident}:{incident:IncidentSummary}){return <div className={`alert-toast ${severityClass[incident.severity]}`}><span className="toast-icon"><SeverityIcon level={incident.severity} size={18}/></span><div><strong>{copy.incident.title(copy.type[incident.type],incident.areaName)}</strong><p>{copy.severity[incident.severity]} · {copy.unverifiedPill}</p></div><Link to={`/incidents/${incident.ref}`}>{copy.alerts.view}</Link></div>;}
