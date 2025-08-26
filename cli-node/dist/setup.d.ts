export declare class SetupWizard {
    private envPath;
    constructor();
    needsSetup(): boolean;
    askForAPIKeyGuide(): Promise<void>;
    run(): Promise<void>;
    private configureAPIKeys;
    private saveConfiguration;
}
//# sourceMappingURL=setup.d.ts.map