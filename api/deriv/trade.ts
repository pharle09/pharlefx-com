import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeDerivTrade } from '../_lib/deriv-websocket';
import { requireTradingSession } from '../_lib/auth';
import { methodNotAllowed, parseJson, requestId, safeError } from '../_lib/http';
import { validateTrade } from '../_lib/risk';

export const config = { runtime: 'nodejs22.x', maxDuration: 30 };
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return methodNotAllowed(res);
    if (!requireTradingSession(req, res)) return;
    const id = requestId();
    try { const trade = validateTrade(parseJson(req)); const result = await executeDerivTrade(trade); return res.status(200).json({ status: 'accepted', requestId: id, ...result, message: 'Trade accepted.' }); }
    catch (error) { return res.status(400).json({ status: 'failed', requestId: id, message: safeError(error) }); }
}
