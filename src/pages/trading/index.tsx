import React, { useState } from 'react';
import ManualTradingPanel from './components/ManualTradingPanel';
import CopyTradingPanel from './components/CopyTradingPanel';
import BulkTradingPanel from './components/BulkTradingPanel';
import type { TradingMode } from './types';
import './trading.scss';

const symbols = [
    { value: 'R_10', label: 'Volatility 10 Index' },
    { value: 'R_25', label: 'Volatility 25 Index' },
    { value: 'R_50', label: 'Volatility 50 Index' },
    { value: 'R_75', label: 'Volatility 75 Index' },
    { value: 'R_100', label: 'Volatility 100 Index' },
];

const tabs: Array<{ id: TradingMode; label: string }> = [
    { id: 'manual', label: 'Manual Trading' },
    { id: 'copy', label: 'Copy Trading' },
    { id: 'bulk', label: 'Bulk Trading' },
];

const Trading = () => {
    const [activeTab, setActiveTab] = useState<TradingMode>('manual');

    return <main className='trading-page'>
        <div className='trading-page__inner'>
            <header className='trading-page__header'>
                <div><p className='trading-panel__eyebrow'>DERIV TRADING TERMINAL</p><h1>PharleFX Trading</h1><p className='trading-page__subtitle'>Manual Trading • Copy Trading • Bulk Trading</p></div>
                <div className='account-status'><span className='account-status__dot' /> <span>Secure session</span><small>API credentials stay server-side</small></div>
            </header>
            <section className='trading-stats' aria-label='Trading overview'>
                {['Balance —', 'Available margin —', 'Open contracts —', 'Today’s P/L —'].map(item => <div className='trading-stat' key={item}><span>{item.split(' —')[0]}</span><strong>—</strong></div>)}
            </section>
            <nav className='trading-tabs' aria-label='Trading modes'>
                {tabs.map(tab => <button type='button' key={tab.id} className={activeTab === tab.id ? 'trading-tab active' : 'trading-tab'} onClick={() => setActiveTab(tab.id)} aria-selected={activeTab === tab.id}>{tab.label}</button>)}
            </nav>
            {activeTab === 'manual' && <ManualTradingPanel symbols={symbols} />}
            {activeTab === 'copy' && <CopyTradingPanel />}
            {activeTab === 'bulk' && <BulkTradingPanel />}
            <p className='trading-disclaimer'>Trading involves risk. Review every proposal and use only funds you can afford to lose.</p>
        </div>
    </main>;
};

export default Trading;
