import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';

export type JsonObject = Record<string, unknown>;

export function methodNotAllowed(res: VercelResponse) {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
}

export function parseJson(req: VercelRequest): JsonObject {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new Error('Invalid JSON body.');
    return req.body as JsonObject;
}

export function requestId(): string { return randomUUID(); }

export function jsonHeaders(res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
}

export function safeError(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (!message || /token|authorize|secret|password|cookie|stack|websocket/i.test(message)) return 'The Deriv trading request could not be completed.';
    return message.length > 180 ? 'The Deriv trading request could not be completed.' : message;
}

export function errorStatus(error: unknown): number {
    return error instanceof Error && /invalid|unsupported|must|cannot|batch|stake|duration/i.test(error.message) ? 400 : 502;
}
