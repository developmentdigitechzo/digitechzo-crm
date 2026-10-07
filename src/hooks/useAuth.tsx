import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthSession, UserRole } from '@/types/auth';
import { mockAuthService, MOCK_USERS } from '@/mocks/mockAuth';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  hasRole: (roles: UserRole[]) => boolean;
  allMockUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const current = mockAuthService.getCurrentSession();
    setSession(current);
    setIsLoading(false);
  }, []);

  const login = (email: string) => {
    const newSession = mockAuthService.login(email);
    setSession(newSession);
  };

  const logout = () => {
    mockAuthService.logout();
    setSession(null);
  };

  const switchUser = (userId: string) => {
    const newSession = mockAuthService.switchUser(userId);
    if (newSession) {
      setSession(newSession);
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!session?.user) return false;
    return roles.includes(session.user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        isAuthenticated: !!session?.user,
        isLoading,
        login,
        logout,
        switchUser,
        hasRole,
        allMockUsers: MOCK_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
