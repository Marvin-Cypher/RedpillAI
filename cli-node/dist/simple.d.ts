#!/usr/bin/env node
/**
 * Simple version of Redpill CLI - Direct OpenBB integration without backend
 */
declare class SimpleRedpillCLI {
    private openaiApiKey?;
    constructor();
    start(): Promise<void>;
    private processInput;
    private extractCryptoSymbols;
    private showCryptoPrices;
    private fetchCryptoPrices;
    private formatNumber;
}
export { SimpleRedpillCLI };
