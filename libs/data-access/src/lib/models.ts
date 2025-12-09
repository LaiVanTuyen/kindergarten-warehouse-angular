export interface Resource {
  id: number;
  title: string;
  thumbnail: string;
  uploader: string;
  date: string;
  url?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Category {
  id: number;
  name: string;
}

export interface Topic {
  id: number;
  name: string;
  categoryId: number;
}

export interface Stats {
  totalResources: number;
  totalViews: number;
  totalUsers: number;
  pendingApprovals: number;
}

export interface Banner {
  id: number;
  image_url: string;
  link: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
  // Optional frontend fields
  start_date?: string;
  end_date?: string;
  platform?: 'desktop' | 'mobile';
}
