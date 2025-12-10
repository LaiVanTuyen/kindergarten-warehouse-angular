export interface Resource {
  id: string;
  title: string;
  thumbnail: string;
  uploader: string;
  date: string;
  url?: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'VIDEO' | 'DOCUMENT' | 'PDF' | 'EXCEL' | 'WORD';
  viewsCount: number;
  description?: string;
  rating?: number;
  topicId?: string;
  createdAt?: string | Date;
  comments?: Comment[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  fullName: string;
  role: 'ADMIN' | 'TEACHER' | 'USER';
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  user: string;
  content: string;
  date: Date;
  rating: number;
  avatarUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Topic {
  id: string;
  title: string;
  categoryId: string;
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
