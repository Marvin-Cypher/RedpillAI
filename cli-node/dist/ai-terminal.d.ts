#!/usr/bin/env node
/**
 * AI-Powered Redpill CLI - True Claude Code Experience
 * Understands ANY natural language request and figures out how to execute it
 */
declare class AITerminal {
    private openaiApiKey?;
    private conversationHistory;
    constructor();
    start(): Promise<void>;
    private processWithAI;
    private callOpenAI;
    private executeAPICall;
    private displayAPIResult;
    private displayCryptoData;
    private displayStockData;
    private displayMarketData;
    private fallbackResponse;
    private formatNumber;
}
export { AITerminal };
