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
  createdAt: string;
  updatedAt?: string;
  slug: string;
  highlights?: string[]; // JSON mapped to string array

  // Enums or Union types
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  type:
    | 'VIDEO'
    | 'DOCUMENT'
    | 'PDF'
    | 'EXCEL'
    | 'WORD'
    | 'AUDIO'
    | 'IMAGE'
    | 'PPT'
    | 'POWERPOINT';

  // Relations (optional depending on API response depth)
  comments?: Comment[];
  rating?: number; // Calculated or from View
  uploader?: string; // Helpers
  uploaderAvatar?: string; // Helpers
}

// ResourceComment merged into Comment in interaction.model.ts

// Request Data Types
export interface CreateResourceRequest {
  file: File;
  title: string;
  description: string;
  topicId: string;
  ageGroupIds: string; // Comma separated
}

export interface UpdateResourceRequest {
  title?: string;
  description?: string;
  topicId?: string;
  ageGroupIds?: string;
  file?: File; // If re-uploading
}

// Response Wrappers
export interface RestResponse<T> {
  status?: string; // 'OK', etc. if your API sends this
  message?: string;
  data: T;
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
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  type?: string;
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
