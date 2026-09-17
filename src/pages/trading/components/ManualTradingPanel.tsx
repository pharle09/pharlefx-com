import React, { useState } from 'react';
import type { ContractType, DurationUnit, TradeRequest } from '../types';
import { derivTrading } from '../derivTrading';

type ManualTradingPanelProps = { symbols: Array<{ value: string; label: string }> };
const fieldStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid #475569', borderRadius: '8px', background: '#0f172a', color: '#fff', fontSize: '15px' };

const ManualTradingPanel = ({ symbols }: ManualTradingPanelProps) => {
    const [symbol, setSymbol] = useState(symbols[0]?.value || 'R_100');
    const [amount, setAmount] = useState(''); const [duration, setDuration] = useState('5'); const [durationUnit, setDurationUnit] = useState<DurationUnit>('t'); const [contractType, setContractType] = useState<ContractType>('CALL');
    const [isSubmitting, setIsSubmitting] = useState(false); const [message, setMessage] = useState(''); const [messageIsError, setMessageIsError] = useState(false); const [requestId, setRequestId] = useState('');
    const submitTrade = async () => {
        const numericAmount = Number(amount); const numericDuration = Number(duration);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError('Enter a stake greater than zero.');
        if (numericAmount > 1000) return setError('The maximum stake for this interface is 1,000 USD.');
        if (!Number.isInteger(numericDuration) || numericDuration <= 0) return setError('Enter a whole-number duration greater than zero.');
        setIsSubmitting(true); setMessage(''); setRequestId('');
        const request: TradeRequest = { symbol, contractType, amount: numericAmount, duration: numericDuration, durationUnit };
        try { const result = await derivTrading.placeManualTrade(request); setMessage(result.contractId ? `Trade accepted. Contract: ${result.contractId}` : 'Trade request accepted.'); setRequestId(result.requestId || ''); setMessageIsError(false); }
        catch (error) { setError(error instanceof Error ? error.message : 'Trade request failed.'); }
        finally { setIsSubmitting(false); }
    };
    const setError = (value: string) => { setMessage(value); setMessageIsError(true); setRequestId(''); };
    return <section className='trading-panel' aria-labelledby='manual-trading-title'><div className='trading-panel__heading'><div><p className='trading-panel__eyebrow'>EXECUTION</p><h2 id='manual-trading-title'>Manual Trading</h2><p className='trading-panel__description'>Configure a contract and confirm the order through the secure trading service.</p></div><span className='trading-badge'>Quote required</span></div><div className='trading-form-grid'><label className='trading-field'><span>Symbol</span><select value={symbol} onChange={event => setSymbol(event.target.value)} style={fieldStyle}>{symbols.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className='trading-field'><span>Stake (USD)</span><input type='number' min='0.01' max='1000' step='0.01' inputMode='decimal' value={amount} onChange={event => setAmount(event.target.value)} placeholder='Enter stake' style={fieldStyle} /></label><label className='trading-field'><span>Duration</span><input type='number' min='1' step='1' inputMode='numeric' value={duration} onChange={event => setDuration(event.target.value)} style={fieldStyle} /></label><label className='trading-field'><span>Duration unit</span><select value={durationUnit} onChange={event => setDurationUnit(event.target.value as DurationUnit)} style={fieldStyle}><option value='t'>Ticks</option><option value='s'>Seconds</option><option value='m'>Minutes</option></select></label></div><div className='trading-direction' role='group' aria-label='Contract direction'><button type='button' className={contractType === 'CALL' ? 'trade-direction trade-direction--call active' : 'trade-direction trade-direction--call'} onClick={() => setContractType('CALL')}>BUY / CALL</button><button type='button' className={contractType === 'PUT' ? 'trade-direction trade-direction--put active' : 'trade-direction trade-direction--put'} onClick={() => setContractType('PUT')}>SELL / PUT</button></div><div className='trading-panel__footer'><p className='trading-panel__hint'>A proposal, authenticated session, and server-side risk check are required before purchase.</p><button type='button' className='trading-primary-button' onClick={submitTrade} disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Request secure trade'}</button></div>{message && <p className={messageIsError ? 'trading-message trading-message--error' : 'trading-message trading-message--success'} role='status'>{message}</p>}{requestId && <p className='trading-request-id'>Request ID: {requestId}</p>}</section>;
};
export default ManualTradingPanel;
