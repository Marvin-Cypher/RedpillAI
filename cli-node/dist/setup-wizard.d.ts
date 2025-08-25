#!/usr/bin/env node
/**
 * Interactive Setup Wizard for Redpill AI Terminal
 * Guides users through configuring all necessary API keys
 */
declare class SetupWizard {
    private envPath;
    private currentEnv;
    private apis;
    constructor();
    private loadExistingEnv;
    start(): Promise<void>;
    private showCurrentStatus;
    private showMainMenu;
    private setupAllAPIs;
    private setupIndividualAPI;
    private setupSingleAPI;
    private testAPIKey;
    private testAllAPIs;
    private viewCurrentConfig;
    private showAPIHelp;
    private maskApiKey;
    private saveConfiguration;
    private buildEnvContent;
    private finishSetup;
}
export { SetupWizard };
