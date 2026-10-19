import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageCircle, Send, RotateCcw } from 'lucide-react';
import type { ChatReply } from 'core';
import { api } from '../../lib/api';
import { Button, Field } from '../../components/ui';
import { Select } from '../../components/ui/Select';
import { copy } from '../../copy';
import ChatAnswer from './ChatAnswer';
export default function ChatPage() {
  const [message, setMessage] = useState(''),
    [language, setLanguage] = useState('auto');
  const [entries, setEntries] = useState<
    { question: string; reply: ChatReply }[]
  >([]);
  const [validation, setValidation] = useState('');
  const answer = useRef<HTMLDivElement>(null);
  const mutation = useMutation({
    mutationFn: (question: string) =>
      api.chat(
        question,
        entries.slice(-3).map((e) => e.question.slice(0, 400)),
        language === 'auto' ? undefined : language,
      ),
    onSuccess: (reply, question) => {
      setEntries((old) => [...old.slice(-9), { question, reply }]);
      setMessage('');
      setTimeout(() => answer.current?.focus(), 0);
    },
  });
  function submit() {
    if (message.trim().length < 2) {
      setValidation(copy.chat.tooShort);
      return;
    }
    setValidation('');
    mutation.mutate(message.trim());
  }
  return (
    <div className="container page chat-page">
      <div className="page-title">
        <h1>{copy.chat.title}</h1>
        <Button
          variant="secondary"
          disabled={mutation.isPending || !entries.length}
          onClick={() => {
            setEntries([]);
            mutation.reset();
          }}
        >
          <RotateCcw size={16} />
          {copy.chat.clear}
        </Button>
      </div>
      <p className="demo-notice">{copy.chat.safety}</p>
      {!entries.length && (
        <section className="chat-welcome">
          <MessageCircle size={28} aria-hidden="true" />
          <p>{copy.chat.welcome}</p>
          <div className="chat-examples">
            {copy.chat.examples.map((text) => (
              <Button
                key={text}
                variant="secondary"
                onClick={() => {
                  setMessage(text);
                  document.getElementById('chat-question')?.focus();
                }}
              >
                {text}
              </Button>
            ))}
          </div>
        </section>
      )}
      <div className="chat-transcript">
        {entries.map((entry, index) => (
          <section className="chat-turn" key={index}>
            <div className="chat-question">
              <strong>{copy.chat.you}</strong>
              <p dir="auto">{entry.question}</p>
            </div>
            <div
              ref={index === entries.length - 1 ? answer : undefined}
              tabIndex={-1}
              aria-label={copy.chat.title}
            >
              <ChatAnswer reply={entry.reply} />
            </div>
          </section>
        ))}
      </div>
      <form
        className="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field
          id="chat-question"
          label={copy.chat.message}
          {...(validation ? { error: validation } : {})}
        >
          <textarea
            id="chat-question"
            dir="auto"
            required
            minLength={2}
            maxLength={600}
            rows={3}
            placeholder={copy.chat.placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (!mutation.isPending) submit();
              }
            }}
          />
        </Field>
        <div className="chat-compose-actions">
          <Select
            id="chat-language"
            label={copy.chat.language}
            value={language}
            onChange={setLanguage}
            options={['auto', 'English', 'Urdu', 'Roman Urdu'].map((value) => ({
              value,
              label: value === 'auto' ? copy.chat.auto : value,
            }))}
          />
          <Button type="submit" busy={mutation.isPending}>
            <Send size={16} />
            {mutation.isPending ? copy.chat.sending : copy.chat.send}
          </Button>
        </div>
        {mutation.isError && (
          <p className="field-error" role="alert">
            {mutation.error.message}
          </p>
        )}
      </form>
      <p className="meta">{copy.chat.privacy}</p>
      <p className="meta">{copy.chat.limits}</p>
      <p className="meta">{copy.chat.coverage}</p>
    </div>
  );
}
