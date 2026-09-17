import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeDerivTrade } from '../_lib/deriv-websocket';
import { requireTradingSession } from '../_lib/auth';
import { errorStatus, jsonHeaders, methodNotAllowed, parseJson, safeError } from '../_lib/http';
import { startRequest } from '../_lib/monitoring';
import { validateTrade } from '../_lib/risk';

export const config = { runtime: 'nodejs22.x', maxDuration: 30 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    jsonHeaders(res);
    if (req.method !== 'POST') return methodNotAllowed(res);
    const request = startRequest('/api/deriv/trade');
    const session = requireTradingSession(req, res);
    if (!session) { request.complete('failure'); return; }
    try {
        const result = await executeDerivTrade(validateTrade(parseJson(req)));
        request.complete('success', session.sub);
        return res.status(200).json({ status: 'accepted', requestId: request.requestId, ...result, message: 'Trade accepted.' });
    } catch (error) {
        request.complete('failure', session.sub);
        return res.status(errorStatus(error)).json({ status: 'failed', requestId: request.requestId, message: safeError(error) });
    }
}
