import React from 'react';
import { 
  QueryClient, 
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes (replaces deprecated cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Provider component
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Generic API query hook
export function useApiQuery<T>(
  queryKey: string[], 
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error, T, string[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn,
    ...options,
  });
}

// Generic API mutation hook
export function useApiMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: Omit<UseMutationOptions<T, Error, V>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation<T, Error, V>({
    mutationFn,
    ...options,
  });
}

// Invalidate queries by prefix
export function invalidateQueries(prefix: string[]) {
  return queryClient.invalidateQueries({ queryKey: prefix });
}

// Prefetch a query
export function prefetchQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
}

// Reset query client
export function resetQueryClient() {
  return queryClient.clear();
}

export { queryClient };
