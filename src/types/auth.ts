export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'SALES_MANAGER' 
  | 'BDE' 
  | 'MARKETING' 
  | 'DELIVERY';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}
