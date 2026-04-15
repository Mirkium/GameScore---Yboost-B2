export class LruCache<Key, Value> {
  private readonly entries = new Map<Key, Value>();

  public constructor(private readonly maxSize: number) {
    if (!Number.isInteger(maxSize) || maxSize < 1) {
      throw new Error("LruCache maxSize must be a positive integer");
    }
  }

  public get(key: Key): Value | undefined {
    const value = this.entries.get(key);
    if (value === undefined) {
      return undefined;
    }

    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  public set(key: Key, value: Value): void {
    if (this.entries.has(key)) {
      this.entries.delete(key);
    }

    this.entries.set(key, value);

    if (this.entries.size > this.maxSize) {
      const oldestKey = this.entries.keys().next().value as Key | undefined;
      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      }
    }
  }

  public async getOrSet(key: Key, factory: () => Promise<Value>): Promise<Value> {
    const cachedValue = this.get(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const value = await factory().catch((error: unknown) => {
      this.entries.delete(key);
      throw error;
    });

    this.set(key, value);
    return value;
  }
}