import { randomUUID } from 'node:crypto';

type Metric = { route: string; requestId: string; status: 'success' | 'failure'; durationMs: number; userId?: string };

export function startRequest(route: string) {
    const requestId = randomUUID();
    const started = Date.now();
    return {
        requestId,
        complete(status: Metric['status'], userId?: string) {
            const record: Metric = { route, requestId, status, durationMs: Date.now() - started, ...(userId ? { userId } : {}) };
            // Safe operational telemetry only. Never log tokens, payloads, or Deriv responses.
            console.info(JSON.stringify({ type: 'trading_api_request', ...record }));
        },
    };
}
