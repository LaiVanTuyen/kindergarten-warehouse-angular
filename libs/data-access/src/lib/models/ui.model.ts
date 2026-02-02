export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string; // Refactored from image_url
  bgFrom: string;
  bgTo: string;
  link: string;
  isActive: boolean; // Refactored from is_active
  displayOrder: number; // Refactored from display_order
  createdAt?: string; // Refactored from created_at
  updatedAt?: string; // Refactored from updated_at
  // Optional frontend fields
  startDate?: string;
  endDate?: string;
  platform: 'WEB' | 'MOBILE';
  createdBy?: string;
  updatedBy?: string;
}

// BannerDto removed as per optimization request

export interface Stats {
  totalResources: number;
  totalViews: number;
  totalUsers: number;
  pendingApprovals: number;
}
