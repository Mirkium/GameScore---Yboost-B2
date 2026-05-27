type CacheEntry<Value> = { value: Value; expiresAt: number };

export class LruCache<Key, Value> {
  private readonly entries = new Map<Key, CacheEntry<Value>>();

  public constructor(
    private readonly maxSize: number,
    private readonly ttlMs: number = 0,
  ) {
    if (!Number.isInteger(maxSize) || maxSize < 1) {
      throw new Error("LruCache maxSize must be a positive integer");
    }
  }

  public get(key: Key): Value | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) {
      return undefined;
    }

    if (this.ttlMs > 0 && Date.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value;
  }

  private getEntry(key: Key): CacheEntry<Value> | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) {
      return undefined;
    }

    if (this.ttlMs > 0 && Date.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }

    return entry;
  }

  public set(key: Key, value: Value): void {
    if (this.entries.has(key)) {
      this.entries.delete(key);
    }

    this.entries.set(key, {
      value,
      expiresAt: this.ttlMs > 0 ? Date.now() + this.ttlMs : Infinity,
    });

    if (this.entries.size > this.maxSize) {
      const oldestKey = this.entries.keys().next().value as Key | undefined;
      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      }
    }
  }

  public async getOrSet(key: Key, factory: () => Promise<Value>): Promise<Value> {
    const cachedValue = this.getEntry(key);
    if (cachedValue !== undefined) {

      if(cachedValue.expiresAt - Date.now() < this.ttlMs / 2) {
        // If the cached value is more than halfway to expiring, refresh it in the background
        factory().then(value => this.set(key, value)).catch(() => {}); // Ignore errors from the background refresh
      }
      return cachedValue.value;
    }



    const value = await factory().catch((error: unknown) => {
      this.entries.delete(key);
      throw error;
    });

    this.set(key, value);
    return value;
  }
}