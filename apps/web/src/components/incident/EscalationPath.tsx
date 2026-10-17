import { ArrowRight } from 'lucide-react';
import type { Escalation } from 'core';
import { copy } from '../../copy';
import { severityClass } from '../severity';
export function EscalationPath({escalation}:{escalation:Escalation}){return <div className="escalation-path"><span><i className={`dot ${severityClass[escalation.fromSeverity]}`}/>{copy.type[escalation.fromType]} · {copy.severity[escalation.fromSeverity]}</span><ArrowRight size={16}/><span><i className={`dot ${severityClass[escalation.toSeverity]}`}/>{copy.type[escalation.toType]} · {copy.severity[escalation.toSeverity]}</span></div>;}
