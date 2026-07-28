import { AppError } from "@/lib/errors";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { throwIfError } from "@/repositories/shared/errors";
import {
  resolveLimit,
  resolveOffset,
  resolveRange,
  resolveSort,
  toPaginated,
  type RepositoryListParams,
} from "@/repositories/shared/pagination";

type SoftDeleteQuery = {
  is: (column: string, value: null) => SoftDeleteQuery;
};

/**
 * Base repository — only the data-access layer holds a Supabase client.
 * Services never receive clients; they call repositories.
 *
 * Future modules: `class XRepository extends BaseRepository` then
 * `createBrowserRepository(XRepository)`.
 */
export abstract class BaseRepository {
  protected constructor(protected readonly client: TypedSupabaseClient) {}

  protected get db(): TypedSupabaseClient {
    return this.client;
  }

  protected assertOk(
    error: Parameters<typeof throwIfError>[0],
    context: string,
  ): void {
    throwIfError(error, context);
  }

  protected requireData<T>(data: T | null, context: string): T {
    if (data == null) {
      throw new AppError("NOT_FOUND", `${context}: no row returned`, 404);
    }
    return data;
  }

  protected pageLimit(params?: RepositoryListParams): number {
    return resolveLimit(params?.limit);
  }

  protected pageOffset(params?: RepositoryListParams): number {
    return resolveOffset(params?.cursor);
  }

  protected pageRange(params?: RepositoryListParams) {
    const limit = this.pageLimit(params);
    const offset = this.pageOffset(params);
    return { limit, offset, ...resolveRange(offset, limit) };
  }

  protected sort(
    params: RepositoryListParams | undefined,
    fallbackColumn: string,
  ) {
    return resolveSort(params?.sortBy, params?.sortDirection, fallbackColumn);
  }

  protected paginate<T>(rows: T[], limit: number, offset: number) {
    return toPaginated(rows, limit, offset);
  }

  protected applyNotDeleted<T extends SoftDeleteQuery>(
    query: T,
    includeDeleted?: boolean,
  ): T {
    if (includeDeleted) return query;
    return query.is("deleted_at", null) as T;
  }
}
