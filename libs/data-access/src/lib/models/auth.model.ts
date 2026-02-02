export type UserRole = 'ADMIN' | 'TEACHER' | 'USER';

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  fullName: string;
  role?: UserRole; // Deprecated in favor of roles
  roles?: string[];
  isActive?: boolean; // Derived or legacy
  status?: string; // "ACTIVE" | "BLOCKED" | "DELETED" (From API)
  avatarUrl?: string; // Backend field
  avatar?: string; // Frontend alias or potential future field
  createdAt: string;
  updatedAt?: string; // Added for Metadata
  createdBy?: string; // Added for Metadata
  updatedBy?: string; // Added for Metadata
  lastActive?: string | Date; // Replaces lastLogin
  phoneNumber?: string;
  bio?: string;
  isDeleted?: boolean;
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

export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED';

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
  bio?: string;
}

export interface AdminUpdateUserRequest {
  fullName: string;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  isDeleted?: boolean;
  password?: string;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword?: string;
}

export interface UserCreationRequest {
  fullName: string;
  username: string;
  email: string;
  password?: string;
  roles?: string[];
  status?: string; // 'ACTIVE' | 'BLOCKED'
}
