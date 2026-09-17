export type TradeInput = { symbol: string; contractType: 'CALL' | 'PUT'; amount: number; duration: number; durationUnit: 't' | 's' | 'm' };
export type CopySettings = { traderId: string; allocation: number; maxStake: number; maxDailyLoss: number; maxOpenPositions: number };

type DerivMessage = { error?: { message?: string }; proposal?: { id?: string; ask_price?: number }; buy?: { contract_id?: string } };

export async function executeDerivTrade(input: TradeInput): Promise<{ contractId?: string }> {
    const token = process.env.DERIV_API_TOKEN;
    if (!token) throw new Error('Deriv trading is not configured.');
    const socket = new WebSocket(process.env.DERIV_WS_URL || 'wss://ws.deriv.com/websockets/v3');

    try {
        await open(socket);
        await send(socket, { authorize: token });
        const proposal = await send({
            proposal: 1,
            amount: input.amount,
            basis: 'stake',
            contract_type: input.contractType,
            currency: 'USD',
            duration: input.duration,
            duration_unit: input.durationUnit,
            symbol: input.symbol,
        }, socket);
        const proposalId = proposal.proposal?.id;
        const askPrice = proposal.proposal?.ask_price;
        if (!proposalId || typeof askPrice !== 'number') {
            throw new Error('Deriv did not return a valid proposal.');
        }
        const purchase = await send(socket, { buy: proposalId, price: askPrice });
        return { contractId: purchase.buy?.contract_id };
    } finally {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            socket.close();
        }
    }
}

function open(socket: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.close();
            reject(new Error('Deriv connection timed out.'));
        }, 15000);

        socket.addEventListener('open', () => {
            clearTimeout(timer);
            resolve();
        }, { once: true });

        socket.addEventListener('error', () => {
            clearTimeout(timer);
            reject(new Error('Deriv connection failed.'));
        }, { once: true });
    });
}

function send(socket: WebSocket, payload: object): Promise<DerivMessage> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.removeEventListener('message', onMessage);
            reject(new Error('Deriv request timed out.'));
        }, 15000);

        const onMessage = (event: MessageEvent) => {
            clearTimeout(timer);
            socket.removeEventListener('message', onMessage);
            try {
                const response = JSON.parse(String(event.data)) as DerivMessage;
                if (response.error) {
                    reject(new Error(response.error.message || 'Deriv request failed.'));
                    return;
                }
                resolve(response);
            } catch {
                reject(new Error('Invalid response from Deriv.'));
            }
        };

        socket.addEventListener('message', onMessage);
        socket.send(JSON.stringify(payload));
    });
}
