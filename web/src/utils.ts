import type {Role} from './types';

export const ROLE_LEVEL: Record<Role, number> = {guest: 0, child: 1, teen: 2, adult: 3, admin: 4, owner: 5};
export const can = (role: string | undefined, minimum: Role) => Boolean(role && ROLE_LEVEL[role as Role] >= ROLE_LEVEL[minimum]);

export function money(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {style: 'currency', currency}).format(cents / 100);
}

export function friendlyDate(value?: string | null, options: Intl.DateTimeFormatOptions = {}) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', {month: 'short', day: 'numeric', ...options}).format(date);
}

export function friendlyDateTime(value?: string | null) {
  return friendlyDate(value, {hour: 'numeric', minute: '2-digit'});
}

export function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || '?';
}

export function localInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
