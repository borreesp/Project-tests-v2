export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(access: string, refresh: string): Promise<void>;
  clear(): Promise<void>;
}

const DEFAULT_ACCESS_KEY = "hf_access_token";
const DEFAULT_REFRESH_KEY = "hf_refresh_token";

export class MemoryTokenStorage implements TokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async getAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  async getRefreshToken(): Promise<string | null> {
    return this.refreshToken;
  }

  async setTokens(access: string, refresh: string): Promise<void> {
    this.accessToken = access;
    this.refreshToken = refresh;
  }

  async clear(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
  }
}

export class WebTokenStorage implements TokenStorage {
  constructor(
    private readonly accessKey: string = DEFAULT_ACCESS_KEY,
    private readonly refreshKey: string = DEFAULT_REFRESH_KEY
  ) {}

  async getAccessToken(): Promise<string | null> {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(this.accessKey);
  }

  async getRefreshToken(): Promise<string | null> {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(this.refreshKey);
  }

  async setTokens(access: string, refresh: string): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(this.accessKey, access);
    window.localStorage.setItem(this.refreshKey, refresh);
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(this.accessKey);
    window.localStorage.removeItem(this.refreshKey);
  }
}

type SecureStoreModule = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

export class MobileTokenStorage implements TokenStorage {
  constructor(
    private readonly accessKey: string = DEFAULT_ACCESS_KEY,
    private readonly refreshKey: string = DEFAULT_REFRESH_KEY
  ) {}

  async getAccessToken(): Promise<string | null> {
    const secureStore = await this.getSecureStore();
    return secureStore?.getItemAsync(this.accessKey) ?? null;
  }

  async getRefreshToken(): Promise<string | null> {
    const secureStore = await this.getSecureStore();
    return secureStore?.getItemAsync(this.refreshKey) ?? null;
  }

  async setTokens(access: string, refresh: string): Promise<void> {
    const secureStore = await this.getSecureStore();
    if (!secureStore) {
      return;
    }

    await secureStore.setItemAsync(this.accessKey, access);
    await secureStore.setItemAsync(this.refreshKey, refresh);
  }

  async clear(): Promise<void> {
    const secureStore = await this.getSecureStore();
    if (!secureStore) {
      return;
    }

    await secureStore.deleteItemAsync(this.accessKey);
    await secureStore.deleteItemAsync(this.refreshKey);
  }

  private async getSecureStore(): Promise<SecureStoreModule | null> {
    try {
      const dynamicImport = new Function("moduleName", "return import(moduleName);") as (
        moduleName: string
      ) => Promise<unknown>;
      return (await dynamicImport("expo-secure-store")) as SecureStoreModule;
    } catch {
      return null;
    }
  }
}
