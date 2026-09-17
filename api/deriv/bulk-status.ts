import type { VercelRequest, VercelResponse } from '@vercel/node';
import { durableGet } from '../_lib/persistence';
import { requireTradingSession } from '../_lib/auth';
import { errorStatus, jsonHeaders, methodNotAllowed, safeError } from '../_lib/http';
import { startRequest } from '../_lib/monitoring';
import type { BulkJobRecord } from '../_lib/types';

export const config = { runtime: 'nodejs22.x', maxDuration: 10 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    jsonHeaders(res);
    if (req.method !== 'GET') return methodNotAllowed(res);
    const monitor = startRequest('/api/deriv/bulk-status');
    const session = requireTradingSession(req, res);
    if (!session) {
        monitor.complete('failure');
        return;
    }

    try {
        const url = new URL(req.url || '/', `https://${req.headers.host || 'pharlefx.com'}`);
        const jobId = url.searchParams.get('jobId');
        if (!jobId) {
            throw new Error('A bulk job ID is required.');
        }
        const job = await durableGet<BulkJobRecord>('bulk-job', jobId);
        monitor.complete('success', session.sub);
        return res.status(200).json({
            status: job ? job.status : 'rejected',
            jobId,
            requestId: job?.requestId,
            results: job?.results ?? [],
        });
    } catch (error) {
        monitor.complete('failure', session.sub);
        return res.status(errorStatus(error)).json({
            status: 'rejected',
            message: safeError(error),
        });
    }
}
