import type { AuthTokensDTO } from "@packages/types";

export type TokenStore = {
  getTokens: () => Promise<AuthTokensDTO | null> | AuthTokensDTO | null;
  setTokens: (tokens: AuthTokensDTO | null) => Promise<void> | void;
};

type RequestInterceptor = (init: RequestInit) => Promise<RequestInit> | RequestInit;
type ResponseInterceptor = (response: Response) => Promise<Response> | Response;

const memoryStore: { tokens: AuthTokensDTO | null } = {
  tokens: null,
};

const defaultTokenStore: TokenStore = {
  getTokens: () => memoryStore.tokens,
  setTokens: (tokens) => {
    memoryStore.tokens = tokens;
  },
};

function getBackendUrl(): string {
  const url = typeof process !== "undefined" ? process.env.BACKEND_URL : undefined;

  if (!url) {
    throw new Error("BACKEND_URL is not defined");
  }

  return url.replace(/\/+$/, "");
}

export class ApiClient {
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];
  private readonly tokenStore: TokenStore;

  constructor(tokenStore: TokenStore = defaultTokenStore) {
    this.tokenStore = tokenStore;
    this.requestInterceptors.push((init) => this.withAuthHeader(init));
    this.responseInterceptors.push((response) => this.withRefreshIfNeeded(response));
  }

  async request<TResponse>(path: string, init: RequestInit = {}): Promise<TResponse> {
    const url = `${getBackendUrl()}${path.startsWith("/") ? path : `/${path}`}`;
    let response = await fetch(url, await this.applyRequestInterceptors(init));

    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        response = await fetch(url, await this.applyRequestInterceptors(init));
      }
    }

    for (const interceptor of this.responseInterceptors) {
      response = await interceptor(response);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return (await response.json()) as TResponse;
  }

  async setTokens(tokens: AuthTokensDTO | null): Promise<void> {
    await this.tokenStore.setTokens(tokens);
  }

  async getTokens(): Promise<AuthTokensDTO | null> {
    return this.tokenStore.getTokens();
  }

  private async withAuthHeader(init: RequestInit): Promise<RequestInit> {
    const tokens = await this.tokenStore.getTokens();

    if (!tokens?.accessToken) {
      return init;
    }

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);

    return {
      ...init,
      headers,
    };
  }

  private async withRefreshIfNeeded(response: Response): Promise<Response> {
    if (response.status === 401) {
      await this.tokenStore.setTokens(null);
    }
    return response;
  }

  private async applyRequestInterceptors(init: RequestInit): Promise<RequestInit> {
    let requestInit = init;
    for (const interceptor of this.requestInterceptors) {
      requestInit = await interceptor(requestInit);
    }
    return requestInit;
  }

  private async tryRefreshToken(): Promise<boolean> {
    const tokens = await this.tokenStore.getTokens();
    if (!tokens?.refreshToken) {
      return false;
    }

    const refreshed = await this.refreshTokens(tokens.refreshToken);
    if (!refreshed) {
      await this.tokenStore.setTokens(null);
      return false;
    }

    await this.tokenStore.setTokens(refreshed);
    return true;
  }

  private async refreshTokens(refreshToken: string): Promise<AuthTokensDTO | null> {
    const response = await fetch(`${getBackendUrl()}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AuthTokensDTO;
  }
}

export const apiClient = new ApiClient();
