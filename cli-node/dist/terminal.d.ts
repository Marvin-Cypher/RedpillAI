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
    private logFile;
    private debugMode;
    private colorScheme;
    private enhancedInput;
    private renderer;
    private markdownRenderer;
    constructor(options?: {
        includeDirectories?: string[];
        nonInteractive?: boolean;
        sessionId?: string;
    });
    start(): Promise<void>;
    executeCommand(command: string): Promise<CommandResult>;
    showSystemStatus(): Promise<void>;
    private showWelcome;
    private checkBackendHealth;
    private checkSetup;
    private runInteractiveMode;
    private processInput;
    private callBackend;
    private displayResult;
    private isExitCommand;
    private isClearCommand;
    private getAvailableCommands;
    private handleCommandDiscovery;
    private showCommandMenu;
    private handleThemeChange;
    private handleAdvancedInput;
    private showEnhancedHelp;
}
export {};
//# sourceMappingURL=terminal.d.ts.map