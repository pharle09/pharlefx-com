import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireTradingSession } from '../_lib/auth';
import { methodNotAllowed, parseJson, requestId, safeError } from '../_lib/http';
import { validateCopy } from '../_lib/risk';

export const config = { runtime: 'nodejs22.x', maxDuration: 10 };
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return methodNotAllowed(res);
    if (!requireTradingSession(req, res)) return;
    const id = requestId();
    try { const settings = validateCopy(parseJson(req)); return res.status(200).json({ status: 'configured', requestId: id, message: `Copy strategy ${settings.traderId} is configured. A persistent worker is required to execute future copy events.` }); }
    catch (error) { return res.status(400).json({ status: 'rejected', requestId: id, message: safeError(error) }); }
}
