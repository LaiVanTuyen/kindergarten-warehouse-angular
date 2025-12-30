export interface Banner {
  id: number;
  imageUrl: string; // Refactored from image_url
  link: string;
  isActive: boolean; // Refactored from is_active
  displayOrder: number; // Refactored from display_order
  createdAt?: string; // Refactored from created_at
  updatedAt?: string; // Refactored from updated_at
  // Optional frontend fields
  startDate?: string;
  endDate?: string;
  platform?: 'desktop' | 'mobile';
}

export interface Stats {
  totalResources: number;
  totalViews: number;
  totalUsers: number;
  pendingApprovals: number;
}
