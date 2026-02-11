import type { RefreshResponse } from "@packages/types";

import type { TokenStorage } from "./storage";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
};

type CreateHttpClientOptions = {
  baseUrl: string;
  storage: TokenStorage;
  fetcher?: typeof fetch;
};

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export type HttpClient = {
  request<TResponse>(path: string, options?: RequestOptions): Promise<TResponse>;
};

export function createHttpClient(options: CreateHttpClientOptions): HttpClient {
  const fetcher = options.fetcher ?? fetch;
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  async function request<TResponse>(path: string, requestOptions: RequestOptions = {}, hasRetried = false): Promise<TResponse> {
    const response = await fetcher(`${baseUrl}${normalizePath(path)}`, await buildRequestInit(requestOptions, options.storage));

    if (response.status === 401 && !hasRetried) {
      const refreshed = await tryRefreshToken(baseUrl, fetcher, options.storage);
      if (refreshed) {
        return request<TResponse>(path, requestOptions, true);
      }

      await options.storage.clear();
      throw new Error("UNAUTHENTICATED");
    }

    if (!response.ok) {
      const errorBody = await parseResponseBody(response);
      throw new HttpError(response.status, `HTTP ${response.status}`, errorBody);
    }

    return (await parseResponseBody(response)) as TResponse;
  }

  return { request };
}

function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl) {
    throw new Error("baseUrl is required");
  }

  return baseUrl.replace(/\/+$/, "");
}

function normalizePath(path: string): string {
  if (!path) {
    return "";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

async function buildRequestInit(options: RequestOptions, storage: TokenStorage): Promise<RequestInit> {
  const headers = new Headers(options.headers);
  const accessToken = await storage.getAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
  };

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(options.body);
  }

  return init;
}

async function tryRefreshToken(baseUrl: string, fetcher: typeof fetch, storage: TokenStorage): Promise<boolean> {
  const refreshToken = await storage.getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  const response = await fetcher(`${baseUrl}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    return false;
  }

  const payload = (await parseResponseBody(response)) as RefreshResponse & { refreshToken?: string };
  if (!payload?.accessToken) {
    return false;
  }

  await storage.setTokens(payload.accessToken, payload.refreshToken ?? refreshToken);
  return true;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
