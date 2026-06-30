type HttpMethod = 'GET' | 'POST';

interface FetchConfig {
  method: HttpMethod;
  url: string;
  params?: Record<string, string | number | boolean>; // 👈 Added for query parameters
  body?: any;
  headers?: HeadersInit;
  options?: Omit<RequestInit, 'method' | 'body'>;
}

export const secureFetch = async <T>({
  method,
  url,
  params,
  body,
  headers,
  options
}: FetchConfig): Promise<T> => {
  
  // 1. Build and append the query parameters if they exist
  let targetUrl = url;
  if (params) {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    targetUrl = `${url}?${queryString}`;
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...options,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await globalThis.fetch(targetUrl, config);

  if (!response.ok) {
    throw new Error(`[${method}] failed on ${targetUrl}: ${response.status}`);
  }

  return response.json() as Promise<T>;
};