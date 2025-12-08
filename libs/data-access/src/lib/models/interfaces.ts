export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'TEACHER' | 'USER';
  avatarUrl?: string;
  status: 'ACTIVE' | 'BLOCKED';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface Topic {
  id: string;
  title: string;
  categoryId: string;
  thumbnailUrl?: string;
}

export interface Comment {
  id: string;
  user: string;
  avatarUrl?: string;
  content: string;
  date: Date;
  rating: number;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: 'PDF' | 'EXCEL' | 'WORD' | 'VIDEO';
  url: string; // File URL or Video URL
  thumbnailUrl?: string;
  viewsCount: number;
  topicId: string;
  createdAt: Date;
  rating?: number;
  comments?: Comment[];
}

export interface Banner {
  id: string;
  imageUrl: string;
  link?: string;
  active: boolean;
  order: number;
}
