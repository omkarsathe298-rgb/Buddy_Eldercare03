import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, tokenStorage } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: any) => Promise<void>;
  switchRole: (targetRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      // Auto login as default elder user for immediate seamless experience
      switchRole('ELDER').finally(() => setIsLoading(false));
      return;
    }

    api.getMe()
      .then(res => setUser(res.user))
      .catch(() => {
        tokenStorage.clear();
        switchRole('ELDER');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login({ email, password: pass });
      setUser(res.user);
    } catch (err: any) {
      setError(err?.message || 'Failed to login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.register(payload);
      setUser(res.user);
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout().catch(console.warn);
    setUser(null);
  };

  const updateProfile = async (updates: any) => {
    const res = await api.updateProfile(updates);
    setUser(res.user);
  };

  const switchRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    setError(null);
    try {
      const creds = {
        ELDER: { email: 'elder@buddy.com', password: 'password123' },
        CAREGIVER: { email: 'caregiver@buddy.com', password: 'password123' },
        ADMIN: { email: 'admin@buddy.com', password: 'password123' }
      }[targetRole];

      const res = await api.login(creds);
      setUser(res.user);
    } catch (err) {
      console.warn('Failed auto-switching role:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
