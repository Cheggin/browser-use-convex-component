import {
  BROWSER_USE_API_BASE,
  API_HEADER_KEY,
} from "./constants.js";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface ApiRequestOptions {
  method: HttpMethod;
  path: string;
  apiKey: string;
  body?: Record<string, unknown>;
}

export async function browserUseRequest<T>(
  options: ApiRequestOptions,
): Promise<T> {
  const { method, path, apiKey, body } = options;
  const url = `${BROWSER_USE_API_BASE}${path}`;

  const headers: Record<string, string> = {
    [API_HEADER_KEY]: apiKey,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Browser Use API error (${response.status}): ${text}`,
    );
  }

  return response.json() as Promise<T>;
}
