import type { Paginated, SortDirection } from "@/types/common";

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export type RepositoryListParams = {
  /** Opaque offset cursor — stringified integer from prior nextCursor. */
  cursor?: string | null;
  limit?: number;
  /** Database column name (snake_case). */
  sortBy?: string;
  sortDirection?: SortDirection;
  includeDeleted?: boolean;
};

export function resolveLimit(limit?: number): number {
  if (limit == null) return DEFAULT_PAGE_LIMIT;
  return Math.min(Math.max(1, limit), MAX_PAGE_LIMIT);
}

export function resolveOffset(cursor?: string | null): number {
  if (cursor == null || cursor === "") return 0;
  const parsed = Number.parseInt(cursor, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function resolveSort(
  sortBy: string | undefined,
  sortDirection: SortDirection | undefined,
  fallbackColumn: string,
): { column: string; ascending: boolean } {
  return {
    column: sortBy && sortBy.length > 0 ? sortBy : fallbackColumn,
    ascending: (sortDirection ?? "desc") === "asc",
  };
}

/**
 * rows should contain up to limit+1 items (range fetched with inclusive end).
 */
export function toPaginated<T>(
  rows: T[],
  limit: number,
  offset: number,
): Paginated<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    limit,
    offset,
    hasMore,
    nextCursor: hasMore ? String(offset + items.length) : null,
  };
}

/** Inclusive range for Supabase .range — fetches limit+1 rows. */
export function resolveRange(
  offset: number,
  limit: number,
): { from: number; to: number } {
  return { from: offset, to: offset + limit };
}
