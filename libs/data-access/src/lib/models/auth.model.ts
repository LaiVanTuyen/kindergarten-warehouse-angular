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
  lastActive?: string | null; // ISO 8601 DateTime or null if user never logged in (may lag ~10min due to cache)
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
  role: UserRole;       // Primary role (legacy, kept for compatibility)
  roles?: string[];     // Multi-role support
  status: UserStatus;   // 'ACTIVE' | 'BLOCKED' — required by BE
  isActive?: boolean;   // Kept as optional for backward compat
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
