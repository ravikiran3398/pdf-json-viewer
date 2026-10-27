import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, portal?: 'user' | 'admin') => Promise<User>;
  register: (email: string, password: string, name?: string, company?: string) => Promise<void>;
  logout: () => Promise<void> | void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, portal: 'user' | 'admin' = 'user'): Promise<User> => {
    const res = await api.post('/auth/login', { email, password, portal });
    if (res.data.success) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      await refreshUser();
      return res.data.user;
    } else {
      throw new Error(res.data.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string, name?: string, company?: string) => {
    const res = await api.post('/auth/register', { email, password, name, company });
    if (res.data.success) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      await refreshUser();
    } else {
      throw new Error(res.data.error || 'Registration failed');
    }
  };

  const logout = async () => {
    const wasAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      window.location.href = wasAdmin ? '/admin/login' : '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
