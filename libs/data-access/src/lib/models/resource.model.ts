import { Comment } from './interaction.model';

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  thumbnailUrl?: string; // Mapped from backend column
  fileType?: string; // Mapped from backend column
  fileExtension?: string;
  fileSize?: string; // Assuming mapped to string for display or number from BE
  viewsCount: number;
  downloadCount: number;
  topicId: string;
  createdById?: number; // User Id assumed number based on Users table
  isActive: boolean;
  isDeleted: boolean;
  isFavorited?: boolean; // New field from spec
  createdAt: string;
  updatedAt?: string;
  slug: string;
  highlights?: string[]; // JSON mapped to string array
  ageGroups?: AgeGroup[]; // New field from spec

  // Enums or Union types
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
  type:
    | 'VIDEO'
    | 'DOCUMENT'
    | 'PDF'
    | 'EXCEL'
    | 'WORD'
    | 'AUDIO'
    | 'IMAGE'
    | 'POWERPOINT'
    | 'YOUTUBE';

  // Relations (optional depending on API response depth)
  comments?: Comment[];
  rating?: number; // Calculated or from View
  uploader?: string; // Helpers
  uploaderAvatar?: string; // Helpers
  topic?: {
    id: string | number;
    name: string;
    categoryId: string | number;
    categoryName?: string;
  };
}

// ResourceComment merged into Comment in interaction.model.ts

// Request Data Types
export interface CreateResourceRequest {
  file: File;
  title: string;
  description: string;
  topicId: string;
  ageGroupIds: string; // Comma separated
  username: string; // Required by spec
}

export interface UpdateResourceRequest {
  title?: string;
  description?: string;
  topicId?: string;
  ageGroupIds?: string; // List<Long> but sent as query params usually string or multi-value
  status?: 'APPROVED' | 'REJECTED' | 'HIDDEN';
  file?: File; // If re-uploading (not in update spec but good to keep if needed)
}

// Response Wrappers
export interface RestResponse<T> {
  code?: number; // Spec uses 'code': 1000
  status?: string;
  message?: string;
  result?: T; // Spec uses 'result' instead of 'data'
  data: T; // Keep for backward compatibility if needed
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Filter Params
export interface ResourceFilterParams {
  page?: number;
  size?: number;
  topicId?: string;
  categoryId?: string;
  ageGroupId?: string;
  keyword?: string;
  topic?: string; // slug
  category?: string; // slug
  ages?: string; // slugs
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
  type?: string;
  sort?: string; // Added sort
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  topicCount?: number;
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  platform?: 'WEB' | 'MOBILE' | 'BOTH';
  isActive?: boolean;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  isActive?: boolean;
}

export interface AgeGroup {
  id: string;
  name: string;
  slug: string;
  minAge: number;
  maxAge: number;
  description?: string;
}

export type CategoryViewMode = 'list' | 'trash';
export type CategoryAction =
  | 'delete'
  | 'restore'
  | 'bulk-delete'
  | 'bulk-restore';
export type CategoryItemType = 'category' | 'topic';
