import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireTradingSession } from '../_lib/auth';
import { executeDerivTrade } from '../_lib/deriv-websocket';
import { errorStatus, jsonHeaders, methodNotAllowed, parseJson, safeError } from '../_lib/http';
import { startRequest } from '../_lib/monitoring';
import { validateBulk } from '../_lib/risk';

export const config = { runtime: 'nodejs22.x', maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    jsonHeaders(res);
    if (req.method !== 'POST') return methodNotAllowed(res);
    const request = startRequest('/api/deriv/bulk');
    const session = requireTradingSession(req, res);
    if (!session) { request.complete('failure'); return; }
    try {
        const body = parseJson(req);
        const rawOrders = body.orders;
        const orders = validateBulk(rawOrders);
        const inputOrders = rawOrders as Array<Record<string, unknown>>;
        const results: Array<Record<string, unknown>> = [];
        for (let index = 0; index < orders.length; index += 1) {
            const clientOrderId = String(inputOrders[index]?.id || index);
            try {
                const result = await executeDerivTrade(orders[index]);
                results.push({ clientOrderId, status: 'accepted', ...result });
            } catch (error) {
                results.push({ clientOrderId, status: 'failed', message: safeError(error) });
            }
        }
        const failed = results.filter(result => result.status === 'failed').length;
        request.complete(failed ? 'failure' : 'success', session.sub);
        return res.status(200).json({ status: failed === results.length ? 'rejected' : failed ? 'partial' : 'completed', requestId: request.requestId, results });
    } catch (error) {
        request.complete('failure', session.sub);
        return res.status(errorStatus(error)).json({ status: 'rejected', requestId: request.requestId, results: [], message: safeError(error) });
    }
}
