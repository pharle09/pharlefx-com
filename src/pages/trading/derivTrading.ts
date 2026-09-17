import type { CopyTradingSettings, BulkTradeRow, BulkTradeResponse, CopyTradingResponse, BulkTradeResult } from './types';

function getCsrfToken(): string | null {
    const cookie = typeof document === 'undefined' ? '' : document.cookie.split('; ').find(value => value.startsWith('pharlefx_csrf='));
    if (!cookie) return null;
    return decodeURIComponent(cookie.split('=')[1] || '');
}

async function post<T>(path: string, body: unknown): Promise<T> {
    const csrf = getCsrfToken();
    const response = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Idempotency-Key': crypto.randomUUID(),
            ...(csrf ? { 'X-Trading-CSRF': csrf } : {}),
        },
        body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as { message?: string } & T;
    if (!response.ok) throw new Error(payload.message || 'The trading service is unavailable.');
    return payload;
}

export const derivTrading = {
    placeManualTrade: (request: CopyTradingSettings) => post<{ contractId?: string; requestId?: string; message?: string }>('/api/deriv/trade', request),
    startCopyTrading: (settings: CopyTradingSettings) => post<CopyTradingResponse>('/api/deriv/copy', settings),
    submitBulkTrades: (orders: BulkTradeRow[]) => post<BulkTradeResponse>('/api/deriv/bulk', { orders }),
    getBulkJobStatus: (jobId: string) => fetch(`/api/deriv/bulk-status?jobId=${encodeURIComponent(jobId)}`, { credentials: 'include' }).then(async response => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || 'Unable to fetch bulk job status.');
        return payload as { status: string; results: BulkTradeResult[]; requestId?: string };
    }),
    getCopyStatus: (copyId: string) => fetch(`/api/deriv/copy-status?copyId=${encodeURIComponent(copyId)}`, { credentials: 'include' }).then(async response => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || 'Unable to fetch copy configuration status.');
        return payload as { status: string; message?: string; traderId?: string };
    }),
};
