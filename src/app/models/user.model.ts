export type AppRole = 'Customer' | 'Manager' | 'Operations' | 'Delivery' | 'Admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  avatarUrl: string;
}
