import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: import.meta.env.DEV ? console.error : undefined,
  }),
  mutationCache: new MutationCache({
    onError: import.meta.env.DEV ? console.error : undefined,
  }),
  defaultOptions: {
    queries: {
      experimental_prefetchInRender: true,
      staleTime: 5 * 1000, // 5 secs
    },
  },
});

export function getContext() {
  return {
    queryClient,
  };
}

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
