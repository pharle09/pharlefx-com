export type TradingMode = 'manual' | 'copy' | 'bulk';

export type ContractType = 'CALL' | 'PUT';
export type DurationUnit = 't' | 's' | 'm';

export type TradeRequest = {
    symbol: string;
    contractType: ContractType;
    amount: number;
    duration: number;
    durationUnit: DurationUnit;
};

export type BulkTradeRow = TradeRequest & {
    id: string;
};

export type CopyTradingSettings = {
    traderId: string;
    allocation: number;
    maxStake: number;
    maxDailyLoss: number;
    maxOpenPositions: number;
};
