import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

type TradingSession = {
    sub: string;
    exp: number;
    iat: number;
    aud: string;
};

const COOKIE_NAME = 'pharlefx_session';
const CSRF_COOKIE_NAME = 'pharlefx_csrf';

function readCookie(header: string | undefined, name: string): string | null {
    const candidate = header?.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
    return candidate ? decodeURIComponent(candidate.slice(name.length + 1)) : null;
}

function base64UrlDecode(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    return Buffer.from(normalized + pad, 'base64').toString('utf8');
}

function validateSignedSession(token: string, secret: string): TradingSession | null {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, signatureInput] = parts;
    const expected = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
    const actual = Buffer.from(signatureInput, 'base64url');
    const expectedBuffer = Buffer.from(expected, 'base64url');
    if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) {
        return null;
    }

    try {
        const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<TradingSession>;
        if (!payload.sub || typeof payload.sub !== 'string') return null;
        if (!payload.aud || payload.aud !== 'pharlefx.com') return null;
        if (!Number.isFinite(payload.exp) || !Number.isFinite(payload.iat)) return null;
        const now = Math.floor(Date.now() / 1000);
        const maxAge = Number(process.env.TRADING_SESSION_MAX_AGE_SECONDS || 86400);
        if (payload.iat > now + 30) return null;
        if (payload.exp < now || payload.exp - payload.iat > maxAge) return null;
        return { sub: payload.sub, exp: payload.exp, iat: payload.iat, aud: payload.aud };
    } catch {
        return null;
    }
}

export function requireTradingSession(req: VercelRequest, res: VercelResponse): TradingSession | null {
    const secret = process.env.TRADING_AUTH_SECRET;
    if (!secret) {
        res.status(503).json({ message: 'Trading authentication is not configured.' });
        return null;
    }

    const allowedOrigin = process.env.TRADING_APP_ORIGIN || 'https://pharlefx.com';
    const requestOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
    if (requestOrigin && requestOrigin !== allowedOrigin) {
        res.status(403).json({ message: 'Invalid request origin.' });
        return null;
    }

    const cookieValue = readCookie(req.headers.cookie, COOKIE_NAME);
    if (!cookieValue) {
        res.status(401).json({ message: 'Sign in before trading.' });
        return null;
    }

    const session = validateSignedSession(cookieValue, secret);
    if (!session) {
        res.status(401).json({ message: 'Your trading session is invalid or expired.' });
        return null;
    }

    const csrfHeader = req.headers['x-trading-csrf'];
    const csrfCookie = readCookie(req.headers.cookie, CSRF_COOKIE_NAME);
    if ((csrfHeader || csrfCookie) && (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie)) {
        res.status(403).json({ message: 'Security verification failed.' });
        return null;
    }

    return session;
}
