import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../api/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user] = useState<User | null>({
    id: '1',
    username: 'rich',
    email: 'rich@example.com',
    userTier: 'Developer',
    permissions: ['all'],
  });
  const [isLoading] = useState(false);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
