export type UserRole = 'Admin' | 'Guardian' | 'Child';

export interface User {
  id: number;
  googleId?: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
}

export interface ChildUser extends User {
  isOnline: boolean;
  lastSeenAt?: string;
  ipAddress?: string;
  activeWebsitesCount?: number;
  todayTotalSeconds?: number;
  filterEnabled?: boolean;  // Web filter toggle status
  internetPaused?: boolean; // Kill switch status
}

