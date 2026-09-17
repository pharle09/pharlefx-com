import { ALLOWED_CONTRACT_TYPES, ALLOWED_DURATION_UNITS, ALLOWED_SYMBOLS, MAX_BULK_ORDERS, MAX_BULK_STAKE, MAX_STAKE } from './constants';
import type { CopySettings, TradeInput } from './types';

function positiveNumber(value: unknown, name: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error(`${name} must be greater than zero.`);
    return value;
}

export function validateTrade(input: unknown): TradeInput {
    if (!input || typeof input !== 'object') throw new Error('Invalid trade request.');
    const value = input as Record<string, unknown>;
    if (typeof value.symbol !== 'string' || !ALLOWED_SYMBOLS.has(value.symbol)) throw new Error('Unsupported symbol.');
    if (typeof value.contractType !== 'string' || !ALLOWED_CONTRACT_TYPES.has(value.contractType)) throw new Error('Unsupported contract type.');
    const amount = positiveNumber(value.amount, 'Stake');
    if (amount > MAX_STAKE) throw new Error(`Stake cannot exceed ${MAX_STAKE} USD.`);
    const duration = positiveNumber(value.duration, 'Duration');
    if (!Number.isInteger(duration)) throw new Error('Duration must be a whole number.');
    if (typeof value.durationUnit !== 'string' || !ALLOWED_DURATION_UNITS.has(value.durationUnit)) throw new Error('Unsupported duration unit.');
    return { symbol: value.symbol, contractType: value.contractType as 'CALL' | 'PUT', amount, duration, durationUnit: value.durationUnit as 't' | 's' | 'm' };
}

export function validateBulk(input: unknown): TradeInput[] {
    if (!Array.isArray(input) || input.length === 0 || input.length > MAX_BULK_ORDERS) throw new Error(`Batch must contain 1-${MAX_BULK_ORDERS} orders.`);
    const orders = input.map(validateTrade);
    if (orders.reduce((total, order) => total + order.amount, 0) > MAX_BULK_STAKE) throw new Error(`Batch stake cannot exceed ${MAX_BULK_STAKE} USD.`);
    return orders;
}

export function validateCopy(input: unknown): CopySettings {
    if (!input || typeof input !== 'object') throw new Error('Invalid copy-trading request.');
    const value = input as Record<string, unknown>;
    if (typeof value.traderId !== 'string' || !/^[a-zA-Z0-9._-]{1,80}$/.test(value.traderId)) throw new Error('Invalid trader or strategy ID.');
    const allocation = positiveNumber(value.allocation, 'Allocation');
    const maxStake = positiveNumber(value.maxStake, 'Maximum stake');
    const maxDailyLoss = positiveNumber(value.maxDailyLoss, 'Maximum daily loss');
    const maxOpenPositions = positiveNumber(value.maxOpenPositions, 'Maximum open positions');
    if (allocation > 100 || maxStake > MAX_STAKE || !Number.isInteger(maxOpenPositions)) throw new Error('Copy-trading risk limits are invalid.');
    return { traderId: value.traderId, allocation, maxStake, maxDailyLoss, maxOpenPositions };
}
