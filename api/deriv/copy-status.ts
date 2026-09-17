import type { VercelRequest, VercelResponse } from '@vercel/node';
import { durableGet } from '../_lib/persistence';
import { requireTradingSession } from '../_lib/auth';
import { errorStatus, jsonHeaders, methodNotAllowed, safeError } from '../_lib/http';
import { startRequest } from '../_lib/monitoring';
import type { CopyExecutionRecord } from '../_lib/types';

export const config = { runtime: 'nodejs22.x', maxDuration: 10 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    jsonHeaders(res);
    if (req.method !== 'GET') return methodNotAllowed(res);
    const monitor = startRequest('/api/deriv/copy-status');
    const session = requireTradingSession(req, res);
    if (!session) {
        monitor.complete('failure');
        return;
    }

    try {
        const url = new URL(req.url || '/', `https://${req.headers.host || 'pharlefx.com'}`);
        const copyId = url.searchParams.get('copyId');
        if (!copyId) {
            throw new Error('A copy ID is required.');
        }
        const record = await durableGet<CopyExecutionRecord>('copy', copyId);
        monitor.complete('success', session.sub);
        return res.status(200).json({
            status: record ? record.status : 'rejected',
            copyId,
            traderId: record?.traderId,
            message: record ? 'Copy configuration is stored for execution.' : 'Copy configuration not found.',
        });
    } catch (error) {
        monitor.complete('failure', session.sub);
        return res.status(errorStatus(error)).json({
            status: 'rejected',
            message: safeError(error),
        });
    }
}
