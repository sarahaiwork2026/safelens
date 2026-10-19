import { lazy, Suspense, useState } from 'react';
import type { ChatReply } from 'core';
import { SeverityPill, StatusPill } from '../../components/severity';
import { Button, Skeleton } from '../../components/ui';
import { when } from '../../lib/format';
import { copy } from '../../copy';
const ChatMap = lazy(() => import('./ChatMap'));
export default function ChatAnswer({ reply }: { reply: ChatReply }) {
  const [map, setMap] = useState(false);
  return (
    <div className="chat-answer">
      <h2 className="sr-only">{copy.chat.response}</h2>
      <p
        className="chat-answer-text"
        dir="auto"
        lang={
          reply.language === 'Urdu'
            ? 'ur'
            : reply.language === 'Roman Urdu'
              ? 'ur-Latn'
              : 'en'
        }
      >
        {reply.answer}
      </p>
      {!!reply.advice.length && (
        <ul
          className="chat-guidance"
          dir={reply.language === 'Urdu' ? 'rtl' : 'ltr'}
        >
          {reply.advice.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      )}
      {reply.routeApproximate && (
        <p className="demo-notice">{copy.chat.route}</p>
      )}
      <div className="chat-incidents">
        {reply.incidents.map((i) => (
          <article className="chat-incident" key={i.code}>
            <div className="inline">
              <SeverityPill level={i.severity} />
              <StatusPill status={i.status} />
              <span className="meta">{i.code}</span>
            </div>
            <h3>{copy.incident.title(copy.type[i.type], i.area)}</h3>
            <p className="meta">
              {i.simulated ? copy.chat.demo : copy.chat.community}
            </p>
            <p className="meta">
              {copy.chat.updated}:{' '}
              <time dateTime={new Date(i.updatedAt).toISOString()}>
                {when(i.updatedAt)}
              </time>
            </p>
            <p className="meta">
              {copy.evidence.supported}: {i.evidence.supported} ·{' '}
              {copy.evidence.disputed}: {i.evidence.disputed} ·{' '}
              {copy.evidence.unconfirmed}: {i.evidence.unconfirmed}
            </p>
            {i.sources.length ? (
              i.sources.map((source) => (
                <div className="source-card" key={source.id}>
                  <span className="pill">{copy.chat.official}</span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.title}
                  </a>
                  <p>{source.summary}</p>
                  <p className="meta">
                    {copy.chat.published}: {when(source.publishedAt)} ·{' '}
                    {copy.chat.reviewed}: {when(source.reviewedAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="meta">{copy.chat.noOfficial}</p>
            )}
          </article>
        ))}
      </div>
      {!!reply.incidents.length &&
        (map ? (
          <Suspense fallback={<Skeleton />}>
            <ChatMap incidents={reply.incidents} />
          </Suspense>
        ) : (
          <Button variant="secondary" onClick={() => setMap(true)}>
            {copy.chat.map}
          </Button>
        ))}
      <div className="chat-contacts">
        <h3>{copy.chat.contacts}</h3>
        {reply.contacts.map((contact) => (
          <p key={contact.number}>
            <a href={`tel:${contact.number}`}>
              {contact.name} {contact.number}
            </a>{' '}
            ·{' '}
            <a href={contact.source} target="_blank" rel="noopener noreferrer">
              {copy.chat.source}
            </a>
            <small>
              {copy.chat.sourceChecked}: {contact.checked}
            </small>
          </p>
        ))}
      </div>
      <p className="meta">
        {reply.engine === 'groq' ? copy.chat.ai : copy.chat.local} ·{' '}
        {copy.chat.retrieved}: {when(reply.retrievedAt)}
      </p>
      {reply.limited && <p className="meta">{copy.chat.quota}</p>}
    </div>
  );
}
