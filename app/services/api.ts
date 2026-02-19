import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'happypause_device_id';
const TOKEN_KEY = 'happypause_access_token';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

let cachedDeviceId: string | null = null;
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  cachedDeviceId = id;
  return id;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit & { retries?: number } = {}
): Promise<Response> {
  const { retries = 2, ...init } = options;
  const deviceId = await getDeviceId();
  const headers = new Headers(init.headers);
  headers.set('X-Device-ID', deviceId);
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(`${API_URL}${url}`, { ...init, headers });
      return res;
    } catch (e) {
      lastError = e as Error;
      if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastError || new Error('Request failed');
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { error?: string })?.error || `API error: ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetchWithRetry(path);
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithRetry(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithRetry(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithRetry(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export function getImageUrl(filename: string): string {
  const path = filename.startsWith('activityimages/') ? filename : `activityimages/${filename}`;
  return `${API_URL}/images/${path}`;
}

export function getAvatarUrl(avatarUrl: string): string {
  if (!avatarUrl) return '';
  if (avatarUrl.startsWith('http')) return avatarUrl;
  const path = avatarUrl.startsWith('/') ? avatarUrl.slice(1) : avatarUrl;
  return `${API_URL}/${path}`;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const deviceId = await getDeviceId();
  const headers: Record<string, string> = {
    'X-Device-ID': deviceId,
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { error?: string })?.error || `Upload failed: ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}
