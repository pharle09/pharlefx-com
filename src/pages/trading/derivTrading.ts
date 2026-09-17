import type { CopyTradingSettings, TradeRequest } from './types';

export type DerivApiResult = {
    contractId?: string;
    message?: string;
};

/**
 * Browser-safe trading client.
 *
 * The server routes are intentionally not implemented in this frontend package yet.
 * They must authenticate with Deriv on the server and must never accept a token from
 * the browser or return an authorization response to the browser.
 */
async function post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
    } & T;

    if (!response.ok) {
        throw new Error(payload.message || 'The trading service is unavailable.');
    }

    return payload;
}

export const derivTrading = {
    placeManualTrade: (request: TradeRequest) =>
        post<DerivApiResult>('/api/deriv/trade', request),

    startCopyTrading: (settings: CopyTradingSettings) =>
        post<DerivApiResult>('/api/deriv/copy', settings),
};
