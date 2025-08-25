export declare class SetupWizard {
    private envPath;
    constructor();
    run(): Promise<boolean>;
    private askForKeys;
    private saveConfiguration;
    private buildEnvContent;
    private showSuccess;
    needsSetup(): boolean;
    askForAPIKeyGuide(): Promise<void>;
}
