export interface Resource {
  id: number;
  title: string;
  thumbnail: string;
  uploader: string;
  date: string;
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
