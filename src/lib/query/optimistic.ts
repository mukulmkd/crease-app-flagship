import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/react-query";

type OptimisticContext<TData> = {
  previous: TData | undefined;
};

type OptimisticMutationConfig<TData, TVariables, TResult, TError> = {
  queryKey: QueryKey;
  mutationFn: (variables: TVariables) => Promise<TResult>;
  /** Apply optimistic patch to cached query data. */
  updateCache: (
    current: TData | undefined,
    variables: TVariables,
  ) => TData | undefined;
  /** Keys to invalidate after settle (in addition to queryKey). */
  invalidateKeys?: QueryKey[];
  options?: Omit<
    UseMutationOptions<TResult, TError, TVariables, OptimisticContext<TData>>,
    "mutationFn" | "onMutate" | "onError" | "onSettled"
  > & {
    onMutate?: (variables: TVariables) => void | Promise<void>;
    onError?: (
      error: TError,
      variables: TVariables,
      context: OptimisticContext<TData> | undefined,
    ) => void;
    onSettled?: (
      data: TResult | undefined,
      error: TError | null,
      variables: TVariables,
      context: OptimisticContext<TData> | undefined,
    ) => void;
  };
};

/**
 * Shared optimistic mutation — cancel → snapshot → patch → rollback → invalidate.
 */
export function useOptimisticMutation<
  TData,
  TVariables,
  TResult = unknown,
  TError = Error,
>({
  queryKey,
  mutationFn,
  updateCache,
  invalidateKeys = [],
  options,
}: OptimisticMutationConfig<TData, TVariables, TResult, TError>) {
  const queryClient = useQueryClient();

  return useMutation<TResult, TError, TVariables, OptimisticContext<TData>>({
    ...options,
    mutationFn,
    async onMutate(variables) {
      await options?.onMutate?.(variables);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TData>(queryKey);
      queryClient.setQueryData<TData>(queryKey, (current) =>
        updateCache(current, variables),
      );
      return { previous };
    },
    onError(error, variables, context) {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      options?.onError?.(error, variables, context);
    },
    async onSettled(data, error, variables, context) {
      await queryClient.invalidateQueries({ queryKey });
      await Promise.all(
        invalidateKeys.map((key) =>
          queryClient.invalidateQueries({ queryKey: key }),
        ),
      );
      options?.onSettled?.(data, error, variables, context);
    },
  });
}
