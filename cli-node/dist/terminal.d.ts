interface CommandResult {
    success: boolean;
    message: string;
    data?: any;
}
export declare class RedpillTerminal {
    private apiUrl;
    private apiKey?;
    private sessionId?;
    private includeDirectories?;
    private nonInteractive;
    private backendLauncher;
    constructor(options?: {
        includeDirectories?: string[];
        nonInteractive?: boolean;
        sessionId?: string;
    });
    start(): Promise<void>;
    executeCommand(command: string): Promise<CommandResult>;
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
    private getAvailableCommands;
    private handleCommandDiscovery;
    private showCommandMenu;
    private showHelp;
}
export {};
//# sourceMappingURL=terminal.d.ts.map