import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeDerivTrade } from '../_lib/deriv-websocket';
import { requireTradingSession } from '../_lib/auth';
import { claimIdempotency } from '../_lib/idempotency';
import { errorStatus, jsonHeaders, methodNotAllowed, parseJson, requestId, safeError } from '../_lib/http';
import { startRequest } from '../_lib/monitoring';
import { validateTrade } from '../_lib/risk';

export const config = { runtime: 'nodejs22.x', maxDuration: 30 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    jsonHeaders(res);
    if (req.method !== 'POST') return methodNotAllowed(res);
    const monitor = startRequest('/api/deriv/trade');
    const session = requireTradingSession(req, res);
    if (!session) {
        monitor.complete('failure');
        return;
    }

    try {
        await claimIdempotency('manual', req.headers['idempotency-key'] as string | undefined);
        const trade = validateTrade(parseJson(req));
        const result = await executeDerivTrade(trade);
        monitor.complete('success', session.sub);
        return res.status(200).json({
            status: 'accepted',
            requestId: monitor.requestId,
            contractId: result.contractId,
            message: 'Trade accepted.',
        });
    } catch (error) {
        monitor.complete('failure', session.sub);
        return res.status(errorStatus(error)).json({
            status: 'failed',
            requestId: monitor.requestId,
            message: safeError(error),
        });
    }
}
