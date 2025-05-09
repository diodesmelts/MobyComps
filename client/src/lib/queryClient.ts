import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper to prefix API URLs with the correct base URL
function getApiUrl(url: string): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL || '';
  
  // If URL already starts with http(s), it's absolute, so return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If we have a base URL and the request path doesn't already start with it
  if (apiBaseUrl && !url.startsWith(apiBaseUrl)) {
    // Make sure we don't double up on slashes
    if (url.startsWith('/') && apiBaseUrl.endsWith('/')) {
      return `${apiBaseUrl}${url.substring(1)}`;
    }
    if (!url.startsWith('/') && !apiBaseUrl.endsWith('/')) {
      return `${apiBaseUrl}/${url}`;
    }
    return `${apiBaseUrl}${url}`;
  }
  
  // Otherwise return the original URL
  return url;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const apiUrl = getApiUrl(url);
  
  const res = await fetch(apiUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const apiUrl = getApiUrl(queryKey[0] as string);
    const res = await fetch(apiUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
