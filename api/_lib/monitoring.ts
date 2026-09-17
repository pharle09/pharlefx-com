import { createHash } from 'node:crypto';

type Metric = { route: string; requestId: string; status: 'success' | 'failure'; durationMs: number; user?: string };

export function startRequest(route: string) {
    const requestId = crypto.randomUUID();
    const started = Date.now();
    return {
        requestId,
        complete(status: Metric['status'], userId?: string) {
            const user = userId ? createHash('sha256').update(userId).digest('hex').slice(0, 16) : undefined;
            const metric: Metric = { route, requestId, status, durationMs: Date.now() - started, ...(user ? { user } : {}) };
            console.info(JSON.stringify({ type: 'trading_api_request', ...metric }));
        },
    };
}
