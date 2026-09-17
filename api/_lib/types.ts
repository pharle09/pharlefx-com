export type TradeInput = {
    symbol: string;
    contractType: 'CALL' | 'PUT';
    amount: number;
    duration: number;
    durationUnit: 't' | 's' | 'm';
};

export type CopySettings = {
    traderId: string;
    allocation: number;
    maxStake: number;
    maxDailyLoss: number;
    maxOpenPositions: number;
};

export type TradeRequest = TradeInput;

export type BulkTradeResult = {
    clientOrderId: string;
    status: 'accepted' | 'failed' | 'pending';
    contractId?: string;
    message?: string;
};

export type BulkJobStatus = 'queued' | 'processing' | 'completed' | 'partial' | 'rejected';

export type BulkJobRecord = {
    jobId: string;
    status: BulkJobStatus;
    requestId: string;
    createdAt: number;
    updatedAt: number;
    results: BulkTradeResult[];
};

export type CopyExecutionRecord = {
    id: string;
    traderId: string;
    status: 'configured' | 'queued' | 'running' | 'paused' | 'rejected';
    requestId: string;
    createdAt: number;
    updatedAt: number;
    settings: CopySettings;
};

export type TradeResponse = {
    status: string;
    requestId?: string;
    contractId?: string;
    message?: string;
};

export type CopyResponse = {
    status: 'queued' | 'configured' | 'rejected';
    requestId: string;
    copyId?: string;
    message: string;
};

export type BulkResponse = {
    status: 'completed' | 'partial' | 'rejected';
    requestId: string;
    jobId?: string;
    results: BulkTradeResult[];
    message?: string;
};
