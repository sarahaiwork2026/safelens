import { Phone, ExternalLink } from 'lucide-react';
import { CONTACTS, CONTACTS_CHECKED } from 'core';
import type { IncidentType } from 'core';
import { copy } from '../../copy';
import { Card } from '../ui';
export function Contacts({ type }: { type?: IncidentType | undefined }) {
  return (
    <Card>
      <h2>{copy.headings.contacts}</h2>
      <div className="contacts-list">
        {CONTACTS.filter((c) => !type || c.types.includes(type)).map((c) => (
          <a href={`tel:${c.number}`} key={c.id}>
            <Phone size={14} />
            <span>{c.name}</span>
            <strong>{c.number}</strong>
          </a>
        ))}
      </div>
      <a
        className="meta text-link contact-source"
        href={CONTACTS[0]?.source}
        target="_blank"
        rel="noreferrer"
      >
        {copy.source(CONTACTS_CHECKED)}
        <ExternalLink size={12} />
      </a>
    </Card>
  );
}
