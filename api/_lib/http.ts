import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';

export type JsonObject = Record<string, unknown>;

export function methodNotAllowed(res: VercelResponse) {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
}

export function parseJson(req: VercelRequest): JsonObject {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        throw new Error('Invalid JSON body.');
    }
    return req.body as JsonObject;
}

export function requestId(): string {
    return randomUUID();
}

export function jsonHeaders(res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
}

export function safeError(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (/already submitted/i.test(message)) return message;
    if (/invalid|unsupported|must|cannot|batch|stake|duration|required|idempotency|origin|csrf/i.test(message)) {
        return message.slice(0, 180);
    }
    return 'The trading request could not be completed. Use the request ID when contacting support.';
}

export function errorStatus(error: unknown): number {
    const message = error instanceof Error ? error.message : '';
    if (/invalid|unsupported|must|cannot|batch|stake|duration|required|idempotency|origin|csrf/i.test(message)) {
        return 400;
    }
    return 502;
}
