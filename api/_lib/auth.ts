import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE_NAME = 'pharlefx_session';
const MAX_CLOCK_SKEW_SECONDS = 30;

type SessionPayload = { sub: string; exp: number; aud?: string };

function unauthorized(res: VercelResponse, message = 'Sign in before trading.') {
    res.status(401).json({ message });
    return false;
}

function signature(payload: string, secret: string) {
    return createHmac('sha256', secret).update(payload).digest('base64url');
}

function readCookie(header: string | undefined, name: string) {
    return header?.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

function verifySession(value: string, secret: string): SessionPayload | null {
    const [encodedPayload, providedSignature] = value.split('.');
    if (!encodedPayload || !providedSignature) return null;
    const expected = signature(encodedPayload, secret);
    const left = Buffer.from(providedSignature);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
    try {
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload;
        if (!payload.sub || typeof payload.sub !== 'string' || !Number.isFinite(payload.exp)) return null;
        if (payload.exp < Math.floor(Date.now() / 1000) - MAX_CLOCK_SKEW_SECONDS) return null;
        if (payload.aud && payload.aud !== 'pharlefx.com') return null;
        return payload;
    } catch {
        return null;
    }
}

export function requireTradingSession(req: VercelRequest, res: VercelResponse): SessionPayload | null {
    const secret = process.env.TRADING_AUTH_SECRET;
    if (!secret) {
        res.status(503).json({ message: 'Trading authentication is not configured.' });
        return null;
    }

    const configuredOrigin = process.env.TRADING_APP_ORIGIN || 'https://pharlefx.com';
    const origin = req.headers.origin;
    if (origin && origin !== configuredOrigin) return unauthorized(res, 'Invalid request origin.') ? null : null;

    const rawCookie = readCookie(req.headers.cookie, process.env.TRADING_SESSION_COOKIE || COOKIE_NAME);
    if (!rawCookie) return unauthorized(res) ? null : null;
    const session = verifySession(decodeURIComponent(rawCookie), secret);
    if (!session) return unauthorized(res, 'Your trading session is invalid or expired.') ? null : null;
    return session;
}
