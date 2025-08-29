/**
 * Adaptive ASCII art branding for RedPill Terminal
 * Inspired by Gemini CLI's responsive design approach
 */

export const longAsciiLogo = `
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

export const shortAsciiLogo = `
 ██████╗ ███████╗██████╗ ██████╗ ██╗██╗     ██╗      
 ██╔══██╗██╔════╝██╔══██╗██╔══██╗██║██║     ██║      
 ██████╔╝█████╗  ██║  ██║██████╔╝██║██║     ██║      
 ██╔══██╗██╔══╝  ██║  ██║██╔═══╝ ██║██║     ██║      
 ██║  ██║███████╗██████╔╝██║     ██║███████╗███████╗ 
 ╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝     ╚═╝╚══════╝╚══════╝ 
`;

export const tinyAsciiLogo = `
 ██████╗ ██████╗ 
 ██╔══██╗██╔══██╗
 ██████╔╝██████╔╝
 ██╔══██╗██╔═══╝ 
 ██║  ██║██║     
 ╚═╝  ╚═╝╚═╝     
`;

export const minimalistLogo = `RP Terminal`;

/**
 * Get ASCII art width (number of characters in longest line)
 */
export function getAsciiArtWidth(asciiArt: string): number {
  const lines = asciiArt.split('\n');
  return Math.max(...lines.map(line => line.length));
}

/**
 * Select appropriate ASCII art based on terminal width
 */
export function getAdaptiveAsciiArt(terminalWidth: number): string {
  const longWidth = getAsciiArtWidth(longAsciiLogo);
  const shortWidth = getAsciiArtWidth(shortAsciiLogo);
  const tinyWidth = getAsciiArtWidth(tinyAsciiLogo);

  if (terminalWidth >= longWidth + 10) {
    return longAsciiLogo;
  } else if (terminalWidth >= shortWidth + 5) {
    return shortAsciiLogo;
  } else if (terminalWidth >= tinyWidth + 5) {
    return tinyAsciiLogo;
  } else {
    return minimalistLogo;
  }
}

// Color schemes moved to color-utils.ts for better TypeScript support