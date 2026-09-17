import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireTradingSession } from '../_lib/auth';
import { executeDerivTrade } from '../_lib/deriv-websocket';
import { methodNotAllowed, parseJson, requestId, safeError } from '../_lib/http';
import { validateBulk } from '../_lib/risk';

export const config = { runtime: 'nodejs22.x', maxDuration: 60 };
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return methodNotAllowed(res);
    if (!requireTradingSession(req, res)) return;
    const id = requestId();
    try {
        const body = parseJson(req); const orders = validateBulk(body.orders); const results = [] as Array<Record<string, unknown>>;
        for (let index = 0; index < orders.length; index += 1) { try { const result = await executeDerivTrade(orders[index]); results.push({ clientOrderId: String((body.orders as Array<Record<string, unknown>>)[index].id || index), status: 'accepted', ...result }); } catch (error) { results.push({ clientOrderId: String((body.orders as Array<Record<string, unknown>>)[index].id || index), status: 'failed', message: safeError(error) }); } }
        const failed = results.filter(result => result.status === 'failed').length;
        return res.status(200).json({ status: failed === results.length ? 'rejected' : failed ? 'partial' : 'completed', requestId: id, results });
    } catch (error) { return res.status(400).json({ status: 'rejected', requestId: id, results: [], message: safeError(error) }); }
}
