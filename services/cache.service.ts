type CacheEntry = {
  value: string;
  expiresAt: number | null;
};

export class CacheService {
  private static cache: Map<string, CacheEntry> = new Map();

  static async set(key: string, value: string, ttlSeconds?: number) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiresAt });
    return true;
  }

  static async get(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  static async deletePattern(pattern: string) {
    const regex = new RegExp(
      `^${pattern.replace(/\*/g, ".*").replace(/\?/g, ".")}$`,
      "i",
    );
    const keys = Array.from(this.cache.keys());
    let removed = 0;

    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
        removed += 1;
      }
    }

    return removed > 0;
  }
}
