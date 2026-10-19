import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { IncidentDetail } from 'core';
import { api } from '../../lib/api';
import { queryClient } from '../../lib/query';
import { Button, Card, Field } from '../../components/ui';
import { copy } from '../../copy';
import { when } from '../../lib/format';

export default function OfficialSources({ data }: { data: IncidentDetail }) {
  const [title, setTitle] = useState(''),
    [url, setUrl] = useState(''),
    [summary, setSummary] = useState(''),
    [date, setDate] = useState(''),
    [reviewed, setReviewed] = useState(false);
  const ref = data.incident.ref;
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['incident', String(ref)] });
  const save = useMutation({
    mutationFn: () =>
      api.source(ref, {
        title,
        url,
        summary,
        publishedAt: Date.parse(`${date}:00+05:00`),
      }),
    onSuccess: () => {
      setTitle('');
      setUrl('');
      setSummary('');
      setDate('');
      setReviewed(false);
      void refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.removeSource(ref, id),
    onSuccess: () => {
      void refresh();
    },
  });
  return (
    <Card>
      <h2>{copy.sources.title}</h2>
      {data.incident.simulated ? (
        <p className="meta">{copy.sources.demo}</p>
      ) : (
        <>
          {(data.sources ?? []).map((source) => (
            <div className="source-card" key={source.id}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title}
              </a>
              <p>{source.summary}</p>
              <p className="meta">
                {copy.chat.published}: {when(source.publishedAt)} ·{' '}
                {copy.chat.reviewed}: {when(source.reviewedAt)}
              </p>
              <Button
                variant="ghost"
                busy={remove.isPending}
                onClick={() => remove.mutate(source.id)}
              >
                {copy.sources.remove}
              </Button>
            </div>
          ))}
          {!data.sources?.length && (
            <p className="meta">{copy.sources.empty}</p>
          )}
          <details>
            <summary>{copy.sources.add}</summary>
            <form
              className="stack source-form"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <Field id="source-title" label={copy.sources.name}>
                <input
                  id="source-title"
                  required
                  minLength={3}
                  maxLength={180}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
              <Field id="source-url" label={copy.sources.url}>
                <input
                  id="source-url"
                  type="url"
                  required
                  maxLength={1000}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </Field>
              <p className="meta">{copy.sources.policy}</p>
              <Field id="source-summary" label={copy.sources.summary}>
                <textarea
                  id="source-summary"
                  required
                  minLength={10}
                  maxLength={600}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </Field>
              <Field id="source-date" label={copy.sources.date}>
                <input
                  id="source-date"
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
              <label className="review-check">
                <input
                  type="checkbox"
                  required
                  checked={reviewed}
                  onChange={(e) => setReviewed(e.target.checked)}
                />
                {copy.sources.reviewed}
              </label>
              {save.isError && (
                <p className="field-error" role="alert">
                  {copy.sources.error}
                </p>
              )}
              {save.isSuccess && <p role="status">{copy.sources.saved}</p>}
              <Button type="submit" busy={save.isPending}>
                {copy.sources.add}
              </Button>
            </form>
          </details>
          {remove.isError && (
            <p className="field-error" role="alert">
              {remove.error.message}
            </p>
          )}
        </>
      )}
    </Card>
  );
}
