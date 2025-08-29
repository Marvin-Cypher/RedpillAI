"use strict";
/**
 * Adaptive ASCII art branding for RedPill Terminal
 * Inspired by Gemini CLI's responsive design approach
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.minimalistLogo = exports.tinyAsciiLogo = exports.shortAsciiLogo = exports.longAsciiLogo = void 0;
exports.getAsciiArtWidth = getAsciiArtWidth;
exports.getAdaptiveAsciiArt = getAdaptiveAsciiArt;
exports.longAsciiLogo = `
 ██████╗ ███████╗██████╗ ██████╗ ██╗██╗     ██╗      
 ██╔══██╗██╔════╝██╔══██╗██╔══██╗██║██║     ██║      
 ██████╔╝█████╗  ██║  ██║██████╔╝██║██║     ██║      
 ██╔══██╗██╔══╝  ██║  ██║██╔═══╝ ██║██║     ██║      
 ██║  ██║███████╗██████╔╝██║     ██║███████╗███████╗ 
 ╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝     ╚═╝╚══════╝╚══════╝ 
                                                      
      ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗     
      ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║     
         ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║     
         ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║     
         ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗
         ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
`;
exports.shortAsciiLogo = `
 ██████╗ ███████╗██████╗ ██████╗ ██╗██╗     ██╗      
 ██╔══██╗██╔════╝██╔══██╗██╔══██╗██║██║     ██║      
 ██████╔╝█████╗  ██║  ██║██████╔╝██║██║     ██║      
 ██╔══██╗██╔══╝  ██║  ██║██╔═══╝ ██║██║     ██║      
 ██║  ██║███████╗██████╔╝██║     ██║███████╗███████╗ 
 ╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝     ╚═╝╚══════╝╚══════╝ 
`;
exports.tinyAsciiLogo = `
 ██████╗ ██████╗ 
 ██╔══██╗██╔══██╗
 ██████╔╝██████╔╝
 ██╔══██╗██╔═══╝ 
 ██║  ██║██║     
 ╚═╝  ╚═╝╚═╝     
`;
exports.minimalistLogo = `RP Terminal`;
/**
 * Get ASCII art width (number of characters in longest line)
 */
function getAsciiArtWidth(asciiArt) {
    const lines = asciiArt.split('\n');
    return Math.max(...lines.map(line => line.length));
}
/**
 * Select appropriate ASCII art based on terminal width
 */
function getAdaptiveAsciiArt(terminalWidth) {
    const longWidth = getAsciiArtWidth(exports.longAsciiLogo);
    const shortWidth = getAsciiArtWidth(exports.shortAsciiLogo);
    const tinyWidth = getAsciiArtWidth(exports.tinyAsciiLogo);
    if (terminalWidth >= longWidth + 10) {
        return exports.longAsciiLogo;
    }
    else if (terminalWidth >= shortWidth + 5) {
        return exports.shortAsciiLogo;
    }
    else if (terminalWidth >= tinyWidth + 5) {
        return exports.tinyAsciiLogo;
    }
    else {
        return exports.minimalistLogo;
    }
}
// Color schemes moved to color-utils.ts for better TypeScript support
//# sourceMappingURL=branding.js.map