import { useState } from 'react';
import type { ChatIncident, IncidentSummary } from 'core';
import { FAMILY } from 'core';
import MapCanvas from '../map/MapCanvas';
import { copy } from '../../copy';
export default function ChatMap({ incidents }: { incidents: ChatIncident[] }) {
  const [selected, setSelected] = useState<number | null>(1);
  const points: IncidentSummary[] = incidents.map((i, index) => ({
    id: i.code,
    ref: index + 1,
    code: i.code,
    type: i.type,
    family: FAMILY[i.type][0],
    severity: i.severity,
    status: i.status,
    areaId: i.area,
    areaName: i.area,
    lat: i.lat,
    lng: i.lng,
    summary: copy.incident.title(copy.type[i.type], i.area),
    reportCount: i.reportCount,
    languages: [],
    evidence: i.evidence,
    firstSeen: i.updatedAt,
    lastSeen: i.updatedAt,
    updatedAt: i.updatedAt,
    escalatedAt: null,
    simulated: i.simulated,
  }));
  return (
    <div className="chat-map" role="region" aria-label={copy.chat.mapTitle}>
      <MapCanvas
        incidents={points}
        selected={selected}
        onSelect={setSelected}
        fallbackTo="/chat"
        fallbackLabel={copy.chat.title}
      />
    </div>
  );
}
