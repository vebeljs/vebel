import { VebelError } from "./error";

interface ApiContext {
  get?: (url: string, config?: Record<string, any>) => Promise<any>;
  post?: (url: string, data: any, config?: Record<string, any>) => Promise<any>;
  put?: (url: string, data: any, config?: Record<string, any>) => Promise<any>;
  patch?: (
    url: string,
    data: any,
    config?: Record<string, any>,
  ) => Promise<any>;
  delete?: (url: string, config?: Record<string, any>) => Promise<any>;
  head?: (url: string, config?: Record<string, any>) => Promise<any>;
  options?: (url: string, config?: Record<string, any>) => Promise<any>;
}

interface CacheEntry {
  expiresAt: number;
  data: any;
}

class VebelApi {
  #cache: Map<string, CacheEntry> = new Map();
  #defaultCacheDuration = 0;
  #context: ApiContext | null = null;

  // ─── Setup ────────────────────────────────────────────────

  public setContext(config: ApiContext) {
    this.#context = config;
  }

  public setDefaultCacheDuration(seconds: number) {
    this.#defaultCacheDuration = seconds;
  }

  // ─── Cache Utilities ──────────────────────────────────────

  #generateCacheKey(url: string, cacheKey?: string) {
    if (!cacheKey) return url;
    return `${url}::${cacheKey}`;
  }

  public invalidateCache(url: string, cacheKey?: string) {
    const key = this.#generateCacheKey(url, cacheKey);
    this.#cache.delete(key);
  }

  public clearCache() {
    this.#cache.clear();
  }

  // ─── Guards ───────────────────────────────────────────────

  #getContextOf(method: string) {
    if (!this.#context) {
      throw new VebelError(
        "Api",
        `Please provide your HTTP methods via 'Api.setContext()' before calling '${method}'.`,
      );
    }
    return this.#context;
  }

  #requireMethod(method: string, fn: any): asserts fn is Function {
    if (typeof fn !== "function") {
      throw new VebelError(
        "Api",
        `Method '${method}' is not defined in your Api.setContext() config.`,
      );
    }
  }

  // ─── HTTP Methods ─────────────────────────────────────────

  public async get(
    url: string,
    options?: {
      /** Cache duration in seconds. Overrides global cache duration. */
      cache?: number;
      /** Unique key for storing cache for similar urls with different config */
      cacheKey?: string;
      /** Passed directly to your context get() */
      queryConfig?: Record<string, any>;
    },
  ) {
    const ctx = this.#getContextOf("get");
    this.#requireMethod("get", ctx.get);

    const cacheDuration = options?.cache ?? this.#defaultCacheDuration;
    const cacheKey = this.#generateCacheKey(url, options?.cacheKey);
    const cached = this.#cache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const res = await ctx.get!(url, options?.queryConfig);

    if (cacheDuration > 0) {
      this.#cache.set(cacheKey, {
        expiresAt: Date.now() + cacheDuration * 1000,
        data: res,
      });
    }

    return res;
  }

  public async post(url: string, data: any, queryConfig?: Record<string, any>) {
    const ctx = this.#getContextOf("post");
    this.#requireMethod("post", ctx.post);
    return ctx.post!(url, data, queryConfig);
  }

  public async put(url: string, data: any, queryConfig?: Record<string, any>) {
    const ctx = this.#getContextOf("put");
    this.#requireMethod("put", ctx.put);
    return ctx.put!(url, data, queryConfig);
  }

  public async patch(
    url: string,
    data: any,
    queryConfig?: Record<string, any>,
  ) {
    const ctx = this.#getContextOf("patch");
    this.#requireMethod("patch", ctx.patch);
    return ctx.patch!(url, data, queryConfig);
  }

  public async delete(url: string, queryConfig?: Record<string, any>) {
    const ctx = this.#getContextOf("delete");
    this.#requireMethod("delete", ctx.delete);
    return ctx.delete!(url, queryConfig);
  }

  public async head(url: string, queryConfig?: Record<string, any>) {
    const ctx = this.#getContextOf("head");
    this.#requireMethod("head", ctx.head);
    await ctx.head!(url, queryConfig);
  }

  public async options(url: string, queryConfig?: Record<string, any>) {
    const ctx = this.#getContextOf("options");
    this.#requireMethod("options", ctx.options);
    return ctx.options!(url, queryConfig);
  }
}

export const Api = new VebelApi();
