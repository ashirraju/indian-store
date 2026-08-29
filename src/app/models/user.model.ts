import { AppRole } from '../enums';

export { AppRole };

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  avatarUrl: string;
}
