import type { Pagination } from './schemas.js';

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export const pageArgs = ({ page, pageSize }: Pagination) => ({
  skip: (page - 1) * pageSize,
  take: pageSize,
});

export const paginated = <T>(
  data: T[],
  total: number,
  { page, pageSize }: Pagination,
): Paginated<T> => ({
  data,
  meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
});
