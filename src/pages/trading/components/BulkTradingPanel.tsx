import React, { useState } from 'react';
import type { BulkTradeRow, BulkTradeResult, ContractType, DurationUnit } from '../types';
import { derivTrading } from '../derivTrading';

const symbols = [
    { value: 'R_10', label: 'Volatility 10' },
    { value: 'R_25', label: 'Volatility 25' },
    { value: 'R_50', label: 'Volatility 50' },
    { value: 'R_75', label: 'Volatility 75' },
    { value: 'R_100', label: 'Volatility 100' },
];

const emptyRow = (): BulkTradeRow => ({
    id: `${Date.now()}-${Math.random()}`,
    symbol: 'R_100',
    contractType: 'CALL',
    amount: 10,
    duration: 5,
    durationUnit: 't',
});

const BulkTradingPanel = () => {
    const [rows, setRows] = useState<BulkTradeRow[]>([emptyRow()]);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState<BulkTradeResult[]>([]);

    const updateRow = <K extends keyof BulkTradeRow>(id: string, key: K, value: BulkTradeRow[K]) => {
        setRows(current => current.map(row => (row.id === id ? { ...row, [key]: value } : row)));
    };

    const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const submit = async () => {
        if (!rows.length || rows.length > 5) {
            setMessage('Bulk requests support 1–5 orders per submission.');
            return;
        }
        if (total > 1000) {
            setMessage('The maximum batch stake is 1,000 USD.');
            return;
        }
        if (rows.some(row => row.amount <= 0 || row.duration <= 0 || !Number.isInteger(row.duration))) {
            setMessage('Every order needs a positive stake and whole-number duration.');
            return;
        }

        setSubmitting(true);
        setMessage('');
        setResults([]);

        try {
            const response = await derivTrading.submitBulkTrades(rows);
            setResults(response.results || []);
            setMessage(`Bulk request ${response.status} — ${response.requestId || 'request submitted'}`);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Bulk request failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className='trading-panel' aria-labelledby='bulk-trading-title'>
            <div className='trading-panel__heading'>
                <div>
                    <p className='trading-panel__eyebrow'>BATCH EXECUTION</p>
                    <h2 id='bulk-trading-title'>Bulk Trading</h2>
                    <p className='trading-panel__description'>Submit up to five orders at a time to keep each request bounded and reviewable.</p>
                </div>
                <span className='trading-badge'>Secure batch</span>
            </div>

            <div className='bulk-orders'>
                {rows.map((row, index) => (
                    <div className='bulk-order' key={row.id}>
                        <div className='bulk-order__header'>
                            <strong>Order {index + 1}</strong>
                            <button type='button' className='trading-link-button' disabled={rows.length === 1} onClick={() => setRows(current => current.filter(item => item.id !== row.id))}>
                                Remove
                            </button>
                        </div>

                        <div className='trading-form-grid'>
                            <label className='trading-field'>
                                <span>Symbol</span>
                                <select value={row.symbol} onChange={event => updateRow(row.id, 'symbol', event.target.value)}>
                                    {symbols.map(symbol => (
                                        <option key={symbol.value} value={symbol.value}>{symbol.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label className='trading-field'>
                                <span>Direction</span>
                                <select value={row.contractType} onChange={event => updateRow(row.id, 'contractType', event.target.value as ContractType)}>
                                    <option value='CALL'>BUY / CALL</option>
                                    <option value='PUT'>SELL / PUT</option>
                                </select>
                            </label>
                            <label className='trading-field'>
                                <span>Stake (USD)</span>
                                <input type='number' min='0.01' value={row.amount} onChange={event => updateRow(row.id, 'amount', Number(event.target.value))} />
                            </label>
                            <label className='trading-field'>
                                <span>Duration</span>
                                <input type='number' min='1' step='1' value={row.duration} onChange={event => updateRow(row.id, 'duration', Number(event.target.value))} />
                            </label>
                            <label className='trading-field'>
                                <span>Unit</span>
                                <select value={row.durationUnit} onChange={event => updateRow(row.id, 'durationUnit', event.target.value as DurationUnit)}>
                                    <option value='t'>Ticks</option>
                                    <option value='s'>Seconds</option>
                                    <option value='m'>Minutes</option>
                                </select>
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            <div className='bulk-summary'>
                <span>{rows.length} order{rows.length === 1 ? '' : 's'}</span>
                <strong>{total.toFixed(2)} USD total stake</strong>
            </div>

            <div className='trading-panel__footer'>
                <button type='button' className='trading-secondary-button' onClick={() => setRows(current => (current.length >= 5 ? current : [...current, emptyRow()]))} disabled={rows.length >= 5}>
                    + Add order
                </button>
                <button type='button' className='trading-primary-button' onClick={submit} disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit secure batch'}
                </button>
            </div>

            {message && <p className='trading-message' role='status'>{message}</p>}
            {results.length > 0 && (
                <div className='bulk-results' aria-live='polite'>
                    <strong>Order results</strong>
                    {results.map(result => (
                        <div key={result.clientOrderId} className='bulk-result'>
                            <span>{result.clientOrderId}</span>
                            <span className={result.status === 'accepted' ? 'result-success' : 'result-failure'}>
                                {result.status}{result.contractId ? ` · ${result.contractId}` : ''}{result.message ? ` · ${result.message}` : ''}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default BulkTradingPanel;
