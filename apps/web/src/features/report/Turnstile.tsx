import { useEffect, useRef } from 'react';
interface TurnstileAPI {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ) => string;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}
export function Turnstile({
  onToken,
  resetKey,
}: {
  onToken: (token: string) => void;
  resetKey: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let id: string | undefined;
    const render = () => {
      if (ref.current && window.turnstile)
        id = window.turnstile.render(ref.current, {
          sitekey: String(
            import.meta.env.VITE_TURNSTILE_SITE_KEY ??
              '1x00000000000000000000AA',
          ),
          callback: onToken,
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        });
    };
    let script = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile]',
    );
    if (!script) {
      script = document.createElement('script');
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.dataset.turnstile = 'true';
      script.async = true;
      document.head.appendChild(script);
    }
    if (window.turnstile) render();
    else script.addEventListener('load', render);
    return () => {
      script?.removeEventListener('load', render);
      if (id) window.turnstile?.remove(id);
    };
  }, [onToken, resetKey]);
  return <div ref={ref} />;
}
