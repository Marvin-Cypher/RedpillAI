export declare class RedpillTerminal {
    private apiUrl;
    private apiKey?;
    constructor();
    start(): Promise<void>;
    private showWelcome;
    private checkSetup;
    private runInteractiveMode;
    private processInput;
    private callBackend;
    private processLocally;
    private extractTickers;
    private displayResult;
    private isExitCommand;
    private isClearCommand;
    private isHelpCommand;
    private showHelp;
}
