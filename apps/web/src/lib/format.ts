import { copy } from '../copy';
const clockFormatter = new Intl.DateTimeFormat('en-PK', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Karachi',
});
export function clock(at: number): string {
  return clockFormatter.format(at).toLowerCase();
}
export function relative(at: number, now = Date.now()): string {
  const min = Math.max(0, Math.floor((now - at) / 60000));
  return min < 1
    ? copy.time.now
    : min < 60
      ? copy.time.minutes(min)
      : copy.time.hours(Math.floor(min / 60));
}
export function when(at: number, now = Date.now()): string {
  const day = (n: number) => Math.floor((n + 18000000) / 86400000),
    diff = day(now) - day(at);
  return `${diff === 0 ? copy.time.today : diff === 1 ? copy.time.yesterday : new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', timeZone: 'Asia/Karachi' }).format(at)}, ${clock(at)}`;
}
