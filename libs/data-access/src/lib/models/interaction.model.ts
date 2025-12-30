import { User } from './auth.model';

export interface Comment {
  id: string;
  content: string;
  rating: number;
  userId: number; // For ID reference
  user: User | Partial<User>; // Rich object for display (Avatar, Name) - Refactored from string or helper fields
  resourceId: string;
  createdAt: string;
}

export interface Rating {
  userId: number;
  resourceId: string;
  value: number;
}
