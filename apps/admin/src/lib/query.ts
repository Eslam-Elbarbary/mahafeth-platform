export type Paginated<T> = {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

/** `{ a: 1, b: undefined }` → `?a=1` (empty values dropped). */
export function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}
