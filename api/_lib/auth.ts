import type { VercelRequest, VercelResponse } from '@vercel/node';

export function requireTradingSession(req: VercelRequest, res: VercelResponse): boolean {
    // The deployment must set a signed application session cookie. Do not replace this
    // with a client-provided user ID or Deriv token. Integrate your auth provider here.
    if (!process.env.TRADING_AUTH_SECRET) { res.status(503).json({ message: 'Trading authentication is not configured.' }); return false; }
    const session = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith('pharlefx_session='));
    if (!session) { res.status(401).json({ message: 'Sign in before trading.' }); return false; }
    return true;
}
