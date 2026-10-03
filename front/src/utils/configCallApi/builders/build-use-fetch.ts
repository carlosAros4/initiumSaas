import { useState, useEffect, useCallback, useRef } from "react";
import type { buildFetcher } from "./build-fetcher";
import type { FetcherOptions } from "../types/fetcher.types";

export interface UseFetchResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  mutate: () => void;
}

export function buildUseFetch(fetcher: ReturnType<typeof buildFetcher>) {
  return function useFetch<T = unknown>(
    path: string | null,
    options: FetcherOptions = {}
  ): UseFetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(path !== null);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const fetchData = useCallback(async () => {
      if (!path) return;
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetcher<T>(path, optionsRef.current);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }, [path, fetcher]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    return { data, error, isLoading, mutate: fetchData };
  };
}
