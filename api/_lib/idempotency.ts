import { createHash } from 'node:crypto';
import { durableGet, durableSet } from './persistence';

export async function claimIdempotency(scope: string, key?: string, ttlSeconds = 300): Promise<string> {
    const normalized = (key || '').trim();
    if (!normalized || !/^[A-Za-z0-9._:-]{8,128}$/.test(normalized)) {
        throw new Error('A valid Idempotency-Key header is required.');
    }

    const record = await durableGet<string>('idempotency', `${scope}:${normalized}`);
    if (record) {
        throw new Error('This trading request was already submitted.');
    }

    await durableSet('idempotency', `${scope}:${normalized}`, normalized, ttlSeconds);
    return normalized;
}

export function hashUserId(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 16);
}
