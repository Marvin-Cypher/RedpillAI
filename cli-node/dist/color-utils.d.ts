/**
 * Color utilities with proper TypeScript support for chalk
 */
export type ChalkColor = 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' | 'grey' | 'blackBright' | 'redBright' | 'greenBright' | 'yellowBright' | 'blueBright' | 'magentaBright' | 'cyanBright' | 'whiteBright';
export declare function getChalkColor(colorName: string, modifier?: 'bold' | 'dim' | 'italic' | 'underline'): (text: string) => string;
export declare const ColorSchemes: {
    default: {
        primary: "cyan";
        secondary: "blue";
        accent: "magenta";
        success: "green";
        warning: "yellow";
        error: "red";
        dim: "gray";
    };
    matrix: {
        primary: "green";
        secondary: "greenBright";
        accent: "cyan";
        success: "green";
        warning: "yellow";
        error: "red";
        dim: "gray";
    };
    neon: {
        primary: "magenta";
        secondary: "cyan";
        accent: "yellow";
        success: "green";
        warning: "yellow";
        error: "red";
        dim: "gray";
    };
};
export type ColorScheme = keyof typeof ColorSchemes;
//# sourceMappingURL=color-utils.d.ts.map