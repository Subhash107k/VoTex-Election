interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<any>>();
const inFlightPromises = new Map<string, Promise<any>>();

export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit,
  ttlMs: number = 15000,
): Promise<T> {
  const method = (options?.method || "GET").toUpperCase();

  // Cache only GET requests
  if (method !== "GET") {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  }

  const cacheKey = `${url}:${JSON.stringify(options?.headers || {})}`;
  const now = Date.now();

  // Return cached result if valid
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > now) {
    return cached.data;
  }

  // Deduplicate identical in-flight requests
  if (inFlightPromises.has(cacheKey)) {
    return inFlightPromises.get(cacheKey)!;
  }

  const promise = (async () => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Request failed with status ${res.status}`);
      }
      const data: T = await res.json();
      if (ttlMs > 0) {
        cache.set(cacheKey, { data, expiry: Date.now() + ttlMs });
      }
      return data;
    } finally {
      inFlightPromises.delete(cacheKey);
    }
  })();

  inFlightPromises.set(cacheKey, promise);
  return promise;
}

export function invalidateCache(urlPattern?: string | RegExp): void {
  if (!urlPattern) {
    cache.clear();
    return;
  }

  const regex = typeof urlPattern === "string" ? new RegExp(urlPattern) : urlPattern;
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
}

export function setCacheData<T>(url: string, data: T, ttlMs: number = 15000): void {
  const cacheKey = `${url}:{}`;
  cache.set(cacheKey, { data, expiry: Date.now() + ttlMs });
}
