type StoreEntry = Record<string, unknown> | string | number | boolean | null;

type LocalStore = Map<string, StoreEntry>;

function getLocalStore(): LocalStore {
    if (!(globalThis as typeof globalThis & { __pharlefx_store?: LocalStore }).__pharlefx_store) {
        (globalThis as typeof globalThis & { __pharlefx_store?: LocalStore }).__pharlefx_store = new Map<string, StoreEntry>();
    }
    return (globalThis as typeof globalThis & { __pharlefx_store?: LocalStore }).__pharlefx_store!;
}

function normalizeKey(prefix: string, key: string): string {
    return `${prefix}:${key}`;
}

export async function durableSet<T>(prefix: string, key: string, value: T, ttlSeconds?: number): Promise<void> {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (upstashUrl && upstashToken) {
        const endpoint = new URL(`${upstashUrl.replace(/\/$/, '')}/set/${encodeURIComponent(normalizeKey(prefix, key))}`);
        const body = JSON.stringify({ value, ...(ttlSeconds ? { ex: ttlSeconds } : {}) });
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${upstashToken}`, 'Content-Type': 'application/json' },
            body,
        });
        if (!response.ok) {
            throw new Error('Durable trading storage is unavailable.');
        }
        return;
    }

    getLocalStore().set(normalizeKey(prefix, key), value as StoreEntry);
}

export async function durableGet<T>(prefix: string, key: string): Promise<T | null> {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (upstashUrl && upstashToken) {
        const endpoint = new URL(`${upstashUrl.replace(/\/$/, '')}/get/${encodeURIComponent(normalizeKey(prefix, key))}`);
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { Authorization: `Bearer ${upstashToken}` },
        });
        if (!response.ok) {
            return null;
        }
        const payload = (await response.json()) as { result?: T | null };
        return payload.result ?? null;
    }

    const value = getLocalStore().get(normalizeKey(prefix, key));
    return (value as T | null) ?? null;
}

export async function durableDelete(prefix: string, key: string): Promise<void> {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (upstashUrl && upstashToken) {
        const endpoint = new URL(`${upstashUrl.replace(/\/$/, '')}/del/${encodeURIComponent(normalizeKey(prefix, key))}`);
        await fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${upstashToken}` },
        });
        return;
    }

    getLocalStore().delete(normalizeKey(prefix, key));
}
