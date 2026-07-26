export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let accessToken = '';
let refreshInFlight: Promise<string | null> | null = null;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export function setAccessToken(token: string) { accessToken = token; }
export function clearAccessToken() { accessToken = ''; }

async function errorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || data);
  } catch { return response.statusText || 'Request failed'; }
}

export async function requestAccessToken(path: '/api/auth/login' | '/api/auth/register', body: object): Promise<string> {
  const response = await fetch(`${API_URL}${path}`, {method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response));
  const data = await response.json(); setAccessToken(data.access_token); return data.access_token;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/api/auth/refresh`, {method: 'POST', credentials: 'include'})
      .then(async response => { if (!response.ok) { clearAccessToken(); return null; } const data = await response.json(); setAccessToken(data.access_token); return data.access_token as string; })
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

async function authorizedFetch(path: string, options: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, {...options, headers, credentials: 'include'});
  if (response.status === 401 && retry && await refreshAccessToken()) return authorizedFetch(path, options, false);
  return response;
}

export async function api<T = any>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const response = await authorizedFetch(path, options, retry);
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response));
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function apiDownload(path: string, fallbackName = 'download'): Promise<void> {
  const response = await authorizedFetch(path);
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response));
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  const filename = encoded ? decodeURIComponent(encoded) : plain || fallbackName;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}

export async function logoutRequest(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {method: 'POST', credentials: 'include'});
  clearAccessToken();
}
