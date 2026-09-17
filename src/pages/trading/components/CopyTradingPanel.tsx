import React, { useState } from 'react';
import type { CopyTradingSettings } from '../types';
import { derivTrading } from '../derivTrading';

const CopyTradingPanel = () => {
    const [settings, setSettings] = useState<CopyTradingSettings>({ traderId: '', allocation: 10, maxStake: 25, maxDailyLoss: 100, maxOpenPositions: 3 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const update = <K extends keyof CopyTradingSettings>(key: K, value: CopyTradingSettings[K]) => setSettings(current => ({ ...current, [key]: value }));
    const startCopy = async () => {
        if (!settings.traderId.trim()) return setMessage('Enter a trader or strategy identifier.');
        if (settings.allocation <= 0 || settings.allocation > 100) return setMessage('Allocation must be between 1% and 100%.');
        if (settings.maxStake <= 0 || settings.maxDailyLoss <= 0 || settings.maxOpenPositions <= 0) return setMessage('All risk limits must be greater than zero.');
        setIsSubmitting(true); setMessage('');
        try {
            await derivTrading.startCopyTrading(settings);
            setMessage('Copy-trading request accepted by the secure service.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Copy-trading request failed.');
        } finally { setIsSubmitting(false); }
    };

    return <section className='trading-panel' aria-labelledby='copy-trading-title'>
        <div className='trading-panel__heading'><div><p className='trading-panel__eyebrow'>AUTOMATION</p><h2 id='copy-trading-title'>Copy Trading</h2><p className='trading-panel__description'>Follow an approved strategy with explicit allocation and loss limits.</p></div><span className='trading-badge trading-badge--muted'>Paused</span></div>
        <div className='trading-form-grid'>
            <label className='trading-field trading-field--wide'><span>Trader or strategy ID</span><input value={settings.traderId} onChange={event => update('traderId', event.target.value)} placeholder='e.g. strategy-001' /></label>
            <label className='trading-field'><span>Allocation (%)</span><input type='number' min='1' max='100' value={settings.allocation} onChange={event => update('allocation', Number(event.target.value))} /></label>
            <label className='trading-field'><span>Max stake (USD)</span><input type='number' min='0.01' value={settings.maxStake} onChange={event => update('maxStake', Number(event.target.value))} /></label>
            <label className='trading-field'><span>Max daily loss (USD)</span><input type='number' min='0.01' value={settings.maxDailyLoss} onChange={event => update('maxDailyLoss', Number(event.target.value))} /></label>
            <label className='trading-field'><span>Max open positions</span><input type='number' min='1' step='1' value={settings.maxOpenPositions} onChange={event => update('maxOpenPositions', Number(event.target.value))} /></label>
        </div>
        <div className='trading-risk-note'><strong>Risk guard enabled</strong><span>Copying pauses when the daily loss or open-position cap is reached.</span></div>
        <div className='trading-panel__footer'><p className='trading-panel__hint'>The backend must validate the strategy and execute copied trades; no Deriv token is used in this browser component.</p><button type='button' className='trading-primary-button' onClick={startCopy} disabled={isSubmitting}>{isSubmitting ? 'Starting…' : 'Start copy trading'}</button></div>
        {message && <p className='trading-message' role='status'>{message}</p>}
    </section>;
};

export default CopyTradingPanel;
