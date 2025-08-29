/**
 * Color utilities with proper TypeScript support for chalk
 */

import chalk from 'chalk';

export type ChalkColor = 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' | 'grey' | 'blackBright' | 'redBright' | 'greenBright' | 'yellowBright' | 'blueBright' | 'magentaBright' | 'cyanBright' | 'whiteBright';

export function getChalkColor(colorName: string, modifier?: 'bold' | 'dim' | 'italic' | 'underline'): (text: string) => string {
  let colorFn: (text: string) => string;
  
  switch (colorName) {
    case 'primary':
    case 'cyan': colorFn = chalk.cyan; break;
    case 'secondary':
    case 'blue': colorFn = chalk.blue; break;
    case 'accent':
    case 'magenta': colorFn = chalk.magenta; break;
    case 'success':
    case 'green': colorFn = chalk.green; break;
    case 'warning':
    case 'yellow': colorFn = chalk.yellow; break;
    case 'error':
    case 'red': colorFn = chalk.red; break;
    case 'dim':
    case 'gray': colorFn = chalk.gray; break;
    case 'greenBright': colorFn = chalk.greenBright; break;
    case 'matrix': colorFn = chalk.green; break;
    case 'neon': colorFn = chalk.magenta; break;
    default: colorFn = chalk.white; break;
  }

  // Apply modifier if specified
  if (modifier) {
    switch (modifier) {
      case 'bold': return (text: string) => chalk.bold(colorFn(text));
      case 'dim': return (text: string) => chalk.dim(colorFn(text));
      case 'italic': return (text: string) => chalk.italic(colorFn(text));
      case 'underline': return (text: string) => chalk.underline(colorFn(text));
    }
  }
  
  return colorFn;
}

// Enhanced color schemes with proper typing
export const ColorSchemes = {
  default: {
    primary: 'cyan' as const,
    secondary: 'blue' as const,
    accent: 'magenta' as const,
    success: 'green' as const,
    warning: 'yellow' as const,
    error: 'red' as const,
    dim: 'gray' as const
  },
  matrix: {
    primary: 'green' as const,
    secondary: 'greenBright' as const,
    accent: 'cyan' as const,
    success: 'green' as const,
    warning: 'yellow' as const,
    error: 'red' as const,
    dim: 'gray' as const
  },
  neon: {
    primary: 'magenta' as const,
    secondary: 'cyan' as const,
    accent: 'yellow' as const,
    success: 'green' as const,
    warning: 'yellow' as const,
    error: 'red' as const,
    dim: 'gray' as const
  }
};

export type ColorScheme = keyof typeof ColorSchemes;