/**
 * Enhanced input system inspired by Gemini CLI
 * Features: autocompletion, history, file context detection
 */
import { type ColorScheme } from './color-utils';
export interface InputOptions {
    colorScheme: ColorScheme;
    prompt?: string;
    placeholder?: string;
    enableFileCompletion?: boolean;
    enableCommandCompletion?: boolean;
    history?: string[];
}
export declare class EnhancedInput {
    private options;
    private history;
    private historyIndex;
    private commands;
    constructor(options: InputOptions);
    prompt(): Promise<string>;
    private getCommandCompletion;
    private getFileCompletion;
    private validateFilePath;
    getHistory(): string[];
    clearHistory(): void;
    processInput(input: string): {
        cleanInput: string;
        fileContext: string[];
        isShellCommand: boolean;
        isSlashCommand: boolean;
        shellCommand?: string;
        slashCommand?: string;
    };
}
//# sourceMappingURL=enhanced-input.d.ts.map