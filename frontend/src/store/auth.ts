import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User | null, remember: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const localToken = localStorage.getItem('soc_token') || sessionStorage.getItem('soc_token');
  const localUser = localStorage.getItem('soc_user') || sessionStorage.getItem('soc_user');

  return {
    token: localToken,
    user: localUser ? JSON.parse(localUser) : null,
    setAuth: (token, user, remember) => {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('soc_token', token);
      if (user) {
        storage.setItem('soc_user', JSON.stringify(user));
      }
      set({ token, user });
    },
    logout: () => {
      localStorage.removeItem('soc_token');
      localStorage.removeItem('soc_user');
      sessionStorage.removeItem('soc_token');
      sessionStorage.removeItem('soc_user');
      set({ token: null, user: null });
    },
  };
});
