import type { VercelRequest, VercelResponse } from '@vercel/node';
import { claimIdempotency } from '../_lib/idempotency';
import { durableSet } from '../_lib/persistence';
import { requireTradingSession } from '../_lib/auth';
import { errorStatus, jsonHeaders, methodNotAllowed, parseJson, requestId, safeError } from '../_lib/http';
import { startRequest } from '../_lib/monitoring';
import { validateCopy } from '../_lib/risk';

export const config = { runtime: 'nodejs22.x', maxDuration: 10 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    jsonHeaders(res);
    if (req.method !== 'POST') return methodNotAllowed(res);
    const monitor = startRequest('/api/deriv/copy');
    const session = requireTradingSession(req, res);
    if (!session) {
        monitor.complete('failure');
        return;
    }

    try {
        await claimIdempotency('copy', req.headers['idempotency-key'] as string | undefined, 3600);
        const settings = validateCopy(parseJson(req));
        const copyId = requestId();
        await durableSet('copy', copyId, {
            id: copyId,
            traderId: settings.traderId,
            status: 'configured',
            requestId: monitor.requestId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            settings,
        }, 7 * 24 * 60 * 60);
        monitor.complete('success', session.sub);
        return res.status(200).json({
            status: 'configured',
            requestId: monitor.requestId,
            copyId,
            message: 'Copy configuration accepted and stored for a durable worker.',
        });
    } catch (error) {
        monitor.complete('failure', session.sub);
        return res.status(errorStatus(error)).json({
            status: 'rejected',
            requestId: monitor.requestId,
            message: safeError(error),
        });
    }
}
