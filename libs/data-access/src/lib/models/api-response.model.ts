export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  empty: boolean;
  pageable: any;
  first: boolean;
  numberOfElements: number;
}
