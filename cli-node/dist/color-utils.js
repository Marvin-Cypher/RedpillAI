"use strict";
/**
 * Color utilities with proper TypeScript support for chalk
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorSchemes = void 0;
exports.getChalkColor = getChalkColor;
const chalk_1 = __importDefault(require("chalk"));
function getChalkColor(colorName, modifier) {
    let colorFn;
    switch (colorName) {
        case 'primary':
        case 'cyan':
            colorFn = chalk_1.default.cyan;
            break;
        case 'secondary':
        case 'blue':
            colorFn = chalk_1.default.blue;
            break;
        case 'accent':
        case 'magenta':
            colorFn = chalk_1.default.magenta;
            break;
        case 'success':
        case 'green':
            colorFn = chalk_1.default.green;
            break;
        case 'warning':
        case 'yellow':
            colorFn = chalk_1.default.yellow;
            break;
        case 'error':
        case 'red':
            colorFn = chalk_1.default.red;
            break;
        case 'dim':
        case 'gray':
            colorFn = chalk_1.default.gray;
            break;
        case 'greenBright':
            colorFn = chalk_1.default.greenBright;
            break;
        case 'matrix':
            colorFn = chalk_1.default.green;
            break;
        case 'neon':
            colorFn = chalk_1.default.magenta;
            break;
        default:
            colorFn = chalk_1.default.white;
            break;
    }
    // Apply modifier if specified
    if (modifier) {
        switch (modifier) {
            case 'bold': return (text) => chalk_1.default.bold(colorFn(text));
            case 'dim': return (text) => chalk_1.default.dim(colorFn(text));
            case 'italic': return (text) => chalk_1.default.italic(colorFn(text));
            case 'underline': return (text) => chalk_1.default.underline(colorFn(text));
        }
    }
    return colorFn;
}
// Enhanced color schemes with proper typing
exports.ColorSchemes = {
    default: {
        primary: 'cyan',
        secondary: 'blue',
        accent: 'magenta',
        success: 'green',
        warning: 'yellow',
        error: 'red',
        dim: 'gray'
    },
    matrix: {
        primary: 'green',
        secondary: 'greenBright',
        accent: 'cyan',
        success: 'green',
        warning: 'yellow',
        error: 'red',
        dim: 'gray'
    },
    neon: {
        primary: 'magenta',
        secondary: 'cyan',
        accent: 'yellow',
        success: 'green',
        warning: 'yellow',
        error: 'red',
        dim: 'gray'
    }
};
//# sourceMappingURL=color-utils.js.map