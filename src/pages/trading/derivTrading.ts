import type { BulkTradeRow, BulkTradeResponse, CopyTradingResponse, CopyTradingSettings, DerivTradeResult, TradeRequest } from './types';

async function post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(path, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
    const payload = (await response.json().catch(() => ({}))) as { message?: string } & T;
    if (!response.ok) throw new Error(payload.message || 'The trading service is unavailable.');
    return payload;
}

export const derivTrading = {
    placeManualTrade: (request: TradeRequest) => post<DerivTradeResult>('/api/deriv/trade', request),
    startCopyTrading: (settings: CopyTradingSettings) => post<CopyTradingResponse>('/api/deriv/copy', settings),
    submitBulkTrades: (orders: BulkTradeRow[]) => post<BulkTradeResponse>('/api/deriv/bulk', { orders }),
};
