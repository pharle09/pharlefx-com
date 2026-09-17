import type { VercelRequest, VercelResponse } from '@vercel/node';
import { claimIdempotency } from '../_lib/idempotency';
import { durableSet, durableGet } from '../_lib/persistence';
import { requireTradingSession } from '../_lib/auth';
import { executeDerivTrade } from '../_lib/deriv-websocket';
import { errorStatus, jsonHeaders, methodNotAllowed, parseJson, requestId, safeError } from '../_lib/http';
import { startRequest } from '../_lib/monitoring';
import { validateBulk } from '../_lib/risk';
import type { BulkJobRecord, BulkTradeResult } from '../_lib/types';

export const config = { runtime: 'nodejs22.x', maxDuration: 30 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    jsonHeaders(res);
    if (req.method !== 'POST') return methodNotAllowed(res);
    const monitor = startRequest('/api/deriv/bulk');
    const session = requireTradingSession(req, res);
    if (!session) {
        monitor.complete('failure');
        return;
    }

    try {
        await claimIdempotency('bulk', req.headers['idempotency-key'] as string | undefined, 900);
        const body = parseJson(req);
        const orders = validateBulk(body.orders);
        const jobId = requestId();
        const createdAt = Date.now();
        const initialJob: BulkJobRecord = {
            jobId,
            status: 'queued',
            requestId: monitor.requestId,
            createdAt,
            updatedAt: createdAt,
            results: orders.map((_, index) => ({ clientOrderId: String((Array.isArray(body.orders) ? body.orders[index] : {})?.id ?? index), status: 'pending' })),
        };
        await durableSet('bulk-job', jobId, initialJob, 60 * 60 * 24);

        for (let index = 0; index < orders.length; index += 1) {
            const current = (await durableGet<BulkJobRecord>('bulk-job', jobId)) ?? initialJob;
            const updated: BulkJobRecord = {
                ...current,
                status: 'processing',
                updatedAt: Date.now(),
                results: current.results.map((result, resultIndex) => resultIndex === index ? { ...result, status: 'pending' } : result),
            };
            await durableSet('bulk-job', jobId, updated, 60 * 60 * 24);

            try {
                const contractResult = await executeDerivTrade(orders[index]);
                const result: BulkTradeResult = {
                    clientOrderId: String((Array.isArray(body.orders) ? body.orders[index] : {})?.id ?? index),
                    status: 'accepted',
                    contractId: contractResult.contractId,
                };
                const next = (await durableGet<BulkJobRecord>('bulk-job', jobId)) ?? updated;
                next.results[index] = result;
                next.updatedAt = Date.now();
                next.status = next.results.some(item => item.status === 'failed') ? 'partial' : 'completed';
                await durableSet('bulk-job', jobId, next, 60 * 60 * 24);
            } catch (error) {
                const next = (await durableGet<BulkJobRecord>('bulk-job', jobId)) ?? updated;
                next.results[index] = {
                    clientOrderId: String((Array.isArray(body.orders) ? body.orders[index] : {})?.id ?? index),
                    status: 'failed',
                    message: safeError(error),
                };
                next.updatedAt = Date.now();
                next.status = next.results.some(item => item.status === 'failed') ? 'partial' : 'completed';
                await durableSet('bulk-job', jobId, next, 60 * 60 * 24);
            }
        }

        const finalJob = (await durableGet<BulkJobRecord>('bulk-job', jobId)) ?? initialJob;
        const failedCount = finalJob.results.filter(result => result.status === 'failed').length;
        const finalStatus = failedCount === finalJob.results.length ? 'rejected' : failedCount > 0 ? 'partial' : 'completed';
        finalJob.status = finalStatus;
        finalJob.updatedAt = Date.now();
        await durableSet('bulk-job', jobId, finalJob, 60 * 60 * 24);

        monitor.complete(failedCount > 0 ? 'failure' : 'success', session.sub);
        return res.status(200).json({
            status: finalStatus,
            requestId: monitor.requestId,
            jobId,
            results: finalJob.results,
        });
    } catch (error) {
        monitor.complete('failure', session.sub);
        return res.status(errorStatus(error)).json({
            status: 'rejected',
            requestId: monitor.requestId,
            results: [],
            message: safeError(error),
        });
    }
}
