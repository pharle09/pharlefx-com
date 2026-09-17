import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireTradingSession } from '../_lib/auth';
import { errorStatus, jsonHeaders, methodNotAllowed, parseJson, safeError } from '../_lib/http';
import { startRequest } from '../_lib/monitoring';
import { validateCopy } from '../_lib/risk';

export const config = { runtime: 'nodejs22.x', maxDuration: 10 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    jsonHeaders(res);
    if (req.method !== 'POST') return methodNotAllowed(res);
    const request = startRequest('/api/deriv/copy');
    const session = requireTradingSession(req, res);
    if (!session) { request.complete('failure'); return; }
    try {
        const settings = validateCopy(parseJson(req));
        request.complete('success', session.sub);
        return res.status(200).json({ status: 'configured', requestId: request.requestId, message: `Copy strategy ${settings.traderId} is configured. A persistent worker is required to execute future copy events.` });
    } catch (error) {
        request.complete('failure', session.sub);
        return res.status(errorStatus(error)).json({ status: 'rejected', requestId: request.requestId, message: safeError(error) });
    }
}
