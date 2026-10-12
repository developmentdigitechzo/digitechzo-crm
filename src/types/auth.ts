export type UserRole = 
  | 'ADMIN' 
  | 'MANAGER' 
  | 'BDE_SALES' 
  | 'MARKETING' 
  | 'DELIVERY'
  | 'SUPER_ADMIN' 
  | 'SALES_MANAGER' 
  | 'BDE';

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions?: string[];
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  teamId?: string;
  teamName?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  token?: string;
  expiresAt: string;
}
