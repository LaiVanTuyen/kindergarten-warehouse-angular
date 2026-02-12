import { Comment } from './interaction.model';

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  thumbnailUrl?: string; // Mapped from backend column
  fileExtension?: string;

  fileSize?: number; // Bytes
  duration?: string; // "MM:SS" or "HH:MM:SS"
  viewsCount: number;
  downloadCount: number;
  topicId: string;
  createdById?: number; // User Id assumed number based on Users table
  createdBy?: string; // Username from API
  isActive: boolean;
  isDeleted: boolean;
  isFavorited?: boolean; // New field from spec
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string; // Metadata field
  slug: string;
  highlights?: string[]; // JSON mapped to string array
  ageGroups?: AgeGroup[]; // New field from spec

  // Enums or Union types
  // Enums or Union types
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN' | 'DELETED';

  // Mapped from backend resourceType
  resourceType?: 'FILE' | 'YOUTUBE' | 'EXTERNAL_LINK';

  // Mapped from backend fileType (or type)
  fileType?:
    | 'VIDEO'
    | 'DOCUMENT'
    | 'EXCEL'
    | 'PDF'
    | 'POWERPOINT'
    | 'IMAGE'
    | 'OTHER';

  // Legacy/UI Binding (can be same as fileType or combined)
  type?: string;

  // Relations (optional depending on API response depth)
  comments?: Comment[];
  rating?: number; // Keep for backward compat if needed
  averageRating?: number; // From Spec
  uploader?: string; // Helpers
  uploaderAvatar?: string; // Helpers
  topic?: {
    id: string | number;
    name: string;
    slug: string; // Added for strict typing
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
  duration?: string; // "MM:SS" or "HH:MM:SS"
}

export interface UpdateResourceRequest {
  title?: string;
  description?: string;
  topicId?: string;
  ageGroupIds?: string | string[]; // List<Long> but sent as query params usually string or multi-value
  status?: 'APPROVED' | 'REJECTED' | 'HIDDEN';
  file?: File; // If re-uploading (not in update spec but good to keep if needed)
  youtubeLink?: string;
  fileType?: string;
  duration?: string; // New field
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
  topicId?: string | string[];
  categoryId?: string | string[];
  ageGroupId?: string | string[];
  keyword?: string;
  topic?: string | string[]; // Deprecated: use topicSlugs
  category?: string | string[]; // Deprecated: use categorySlugs
  ages?: string | string[]; // Deprecated: use ageSlugs
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN' | 'DELETED';
  type?: string | string[]; // Deprecated: use types
  sort?: string;
  // New Multi-select Params
  topicSlugs?: string[];
  categorySlugs?: string[];
  ageSlugs?: string[];
  types?: string[];
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
