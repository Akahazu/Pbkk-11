import { useAuthStore } from '../store/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiClient<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, headers = {}, ...rest } = options;
  const token = useAuthStore.getState().token;

  const authHeaders: Record<string, string> = {};
  if (!skipAuth && token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders,
      ...(headers as Record<string, string>),
    },
  });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new Error('Unauthenticated');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error: any = new Error(data.message || 'API request failed');
    error.status = res.status;
    error.errors = data.errors;
    throw error;
  }

  return data;
}
