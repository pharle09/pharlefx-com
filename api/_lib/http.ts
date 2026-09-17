import type { VercelRequest, VercelResponse } from '@vercel/node';

export type JsonObject = Record<string, unknown>;

export function methodNotAllowed(res: VercelResponse) {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
}

export function parseJson(req: VercelRequest): JsonObject {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new Error('Invalid JSON body.');
    return req.body as JsonObject;
}

export function safeError(error: unknown): string {
    if (error instanceof Error && error.message && !/token|authorize|secret|password/i.test(error.message)) return error.message;
    return 'The Deriv trading request could not be completed.';
}

export function requestId(): string {
    return crypto.randomUUID();
}
