import React, { useState } from 'react';
import type { CopyTradingSettings } from '../types';
import { derivTrading } from '../derivTrading';

const CopyTradingPanel = () => {
    const [settings, setSettings] = useState<CopyTradingSettings>({ traderId: '', allocation: 10, maxStake: 25, maxDailyLoss: 100, maxOpenPositions: 3 });
    const [isSubmitting, setIsSubmitting] = useState(false); const [message, setMessage] = useState(''); const [requestId, setRequestId] = useState('');
    const update = <K extends keyof CopyTradingSettings>(key: K, value: CopyTradingSettings[K]) => setSettings(current => ({ ...current, [key]: value }));
    const startCopy = async () => {
        if (!/^[a-zA-Z0-9._-]{1,80}$/.test(settings.traderId.trim())) return setMessage('Use a valid trader or strategy identifier.');
        if (!Number.isFinite(settings.allocation) || settings.allocation <= 0 || settings.allocation > 100) return setMessage('Allocation must be between 1% and 100%.');
        if (![settings.maxStake, settings.maxDailyLoss, settings.maxOpenPositions].every(value => Number.isFinite(value) && value > 0) || !Number.isInteger(settings.maxOpenPositions)) return setMessage('Use positive risk limits and a whole-number position cap.');
        setIsSubmitting(true); setMessage(''); setRequestId('');
        try { const result = await derivTrading.startCopyTrading({ ...settings, traderId: settings.traderId.trim() }); setMessage(result.message); setRequestId(result.requestId); }
        catch (error) { setMessage(error instanceof Error ? error.message : 'Copy-trading request failed.'); }
        finally { setIsSubmitting(false); }
    };
    return <section className='trading-panel' aria-labelledby='copy-trading-title'><div className='trading-panel__heading'><div><p className='trading-panel__eyebrow'>AUTOMATION</p><h2 id='copy-trading-title'>Copy Trading</h2><p className='trading-panel__description'>Follow an approved strategy with explicit allocation and loss limits.</p></div><span className='trading-badge trading-badge--muted'>Server configured</span></div><div className='trading-form-grid'><label className='trading-field trading-field--wide'><span>Trader or strategy ID</span><input value={settings.traderId} onChange={event => update('traderId', event.target.value)} placeholder='e.g. strategy-001' maxLength={80} autoComplete='off' /></label><label className='trading-field'><span>Allocation (%)</span><input type='number' min='1' max='100' value={settings.allocation} onChange={event => update('allocation', Number(event.target.value))} /></label><label className='trading-field'><span>Max stake (USD)</span><input type='number' min='0.01' max='1000' value={settings.maxStake} onChange={event => update('maxStake', Number(event.target.value))} /></label><label className='trading-field'><span>Max daily loss (USD)</span><input type='number' min='0.01' value={settings.maxDailyLoss} onChange={event => update('maxDailyLoss', Number(event.target.value))} /></label><label className='trading-field'><span>Max open positions</span><input type='number' min='1' step='1' value={settings.maxOpenPositions} onChange={event => update('maxOpenPositions', Number(event.target.value))} /></label></div><div className='trading-risk-note'><strong>Risk guard enabled</strong><span>Copying pauses when the daily loss or open-position cap is reached. Continuous execution requires a configured worker.</span></div><div className='trading-panel__footer'><p className='trading-panel__hint'>Only signed app sessions can configure copying. No Deriv credentials are sent from this form.</p><button type='button' className='trading-primary-button' onClick={startCopy} disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save copy configuration'}</button></div>{message && <p className='trading-message' role='status'>{message}</p>}{requestId && <p className='trading-request-id'>Request ID: {requestId}</p>}</section>;
};
export default CopyTradingPanel;
