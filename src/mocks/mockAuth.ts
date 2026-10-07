import { User, AuthSession } from '@/types/auth';

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    email: 'arjun.v@digitechzo.com',
    firstName: 'Arjun',
    lastName: 'Verma',
    role: 'BDE',
    teamId: 'team-1',
    teamName: 'Inbound Growth Team',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-2',
    email: 'priya.s@digitechzo.com',
    firstName: 'Priya',
    lastName: 'Sharma',
    role: 'BDE',
    teamId: 'team-1',
    teamName: 'Inbound Growth Team',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-3',
    email: 'vikram.m@digitechzo.com',
    firstName: 'Vikram',
    lastName: 'Malhotra',
    role: 'SALES_MANAGER',
    teamId: 'team-1',
    teamName: 'Inbound Growth Team',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-admin',
    email: 'admin@digitechzo.com',
    firstName: 'Aditya',
    lastName: 'Rao',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  },
];

export const DEFAULT_MOCK_USER = MOCK_USERS[0]; // Arjun Verma (BDE)

const STORAGE_KEY = 'digitechzo_mock_session';

export const mockAuthService = {
  getCurrentSession(): AuthSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Default initial session for immediate developer preview
      const session: AuthSession = {
        user: DEFAULT_MOCK_USER,
        token: 'mock-jwt-token-preview',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return session;
    }
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  },

  login(email: string): AuthSession {
    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
      id: 'user-custom',
      email,
      firstName: email.split('@')[0],
      lastName: 'User',
      role: 'BDE' as const,
      teamName: 'Sales Team',
    };

    const session: AuthSession = {
      user,
      token: 'mock-jwt-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  switchUser(userId: string): AuthSession | null {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) return null;
    const session: AuthSession = {
      user,
      token: 'mock-jwt-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }
};
