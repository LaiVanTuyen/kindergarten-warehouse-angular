export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  fullName: string;
  role?: 'ADMIN' | 'TEACHER' | 'USER'; // Deprecated in favor of roles
  roles?: string[];
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string | Date;
}

// Strict Login Request (password required)
export interface LoginRequest {
  email: string;
  password: string;
  // Wait, user requested strict password. Let's make it strict string.
}

export interface AuthResponse {
  token?: string; // Legacy support
  accessToken: string;
  user: User;
  refreshToken?: string;
}
