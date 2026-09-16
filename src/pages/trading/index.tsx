import React, { useState } from 'react';

const Trading = () => {
    const [activeTab, setActiveTab] = useState('manual');

    return (
        <div
            style={{
                minHeight: '100vh',
                padding: '24px',
                background: '#0f172a',
                color: '#fff',
                fontFamily: 'Arial, sans-serif',
            }}
        >
            <h1 style={{ marginBottom: '8px' }}>PharleFX Trading</h1>

            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                Manual Trading • Copy Trading • Bulk Trading
            </p>

            <div
                style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginBottom: '24px',
                }}
            >
                {[
                    ['manual', 'Manual Trading'],
                    ['copy', 'Copy Trading'],
                    ['bulk', 'Bulk Trading'],
                ].map(([id, label]) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        style={{
                            padding: '12px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            background:
                                activeTab === id ? '#16a34a' : '#1e293b',
                            color: '#fff',
                            fontWeight: 'bold',
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 'manual' && (
                <div>
                    <h2>Manual Trading</h2>

                    <div
                        style={{
                            background: '#1e293b',
                            padding: '20px',
                            borderRadius: '12px',
                            marginTop: '16px',
                        }}
                    >
                        <label>Symbol</label>
                        <select
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '12px',
                                margin: '8px 0 16px',
                                borderRadius: '6px',
                            }}
                        >
                            <option>Volatility 10 Index</option>
                            <option>Volatility 25 Index</option>
                            <option>Volatility 50 Index</option>
                            <option>Volatility 75 Index</option>
                            <option>Volatility 100 Index</option>
                        </select>

                        <label>Stake</label>
                        <input
                            type="number"
                            placeholder="Enter stake"
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '12px',
                                margin: '8px 0 16px',
                                borderRadius: '6px',
                                boxSizing: 'border-box',
                            }}
                        />

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: '#16a34a',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                }}
                            >
                                BUY
                            </button>

                            <button
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: '#dc2626',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                }}
                            >
                                SELL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'copy' && (
                <div
                    style={{
                        background: '#1e293b',
                        padding: '20px',
                        borderRadius: '12px',
                    }}
                >
                    <h2>Copy Trading</h2>
                    <p style={{ color: '#94a3b8' }}>
                        Follow selected traders and manage 
