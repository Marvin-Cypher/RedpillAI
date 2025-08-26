export declare class BackendLauncher {
    private backendProcess;
    private backendUrl;
    private maxStartupWaitMs;
    ensureBackendRunning(): Promise<boolean>;
    isBackendRunning(): Promise<boolean>;
    private isPortInUse;
    private startBackend;
    private findProjectRoot;
    private getDatabaseUrl;
    private isRedpillProject;
    private findPythonCommand;
    private waitForBackend;
    stopBackend(): void;
    setupCleanup(): void;
}
//# sourceMappingURL=backend-launcher.d.ts.map