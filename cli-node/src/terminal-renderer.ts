/**
 * Advanced terminal renderer inspired by Gemini CLI
 * Fixes truncation issues with proper text flow management
 */

import chalk from 'chalk';
import { getChalkColor } from './color-utils';
import type { ColorScheme } from './color-utils';

export interface RenderingOptions {
  terminalWidth: number;
  terminalHeight: number;
  colorScheme: ColorScheme;
  maxHeight?: number;
}

export class AdvancedTerminalRenderer {
  private options: RenderingOptions;
  
  constructor(options: RenderingOptions) {
    this.options = options;
  }

  /**
   * Render response with proper text flow management (like Gemini CLI)
   */
  renderResponse(content: string, data?: any): void {
    // Clear any existing content and prepare for rendering
    const contentBlocks = this.parseContent(content);
    
    // Render each block with proper spacing and flow control
    contentBlocks.forEach((block, index) => {
      this.renderBlock(block, index === contentBlocks.length - 1);
    });

    // Handle additional data (tables, charts, etc.)
    if (data?.table) {
      this.renderTable(data.table);
    }
    
    if (data?.visualization) {
      this.renderVisualization(data.visualization);
    }

    if (data?.charts) {
      this.renderCharts(data.charts);
    }
  }

  /**
   * Parse content into renderable blocks (similar to Gemini's MarkdownDisplay)
   */
  private parseContent(content: string): ContentBlock[] {
    const lines = content.split('\n');
    const blocks: ContentBlock[] = [];
    let currentBlock: ContentBlock | null = null;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Headers
      if (trimmedLine.match(/^#{1,4}\s+/)) {
        if (currentBlock) blocks.push(currentBlock);
        const level = (line.match(/^#+/) || [''])[0].length;
        currentBlock = {
          type: 'header',
          level,
          content: trimmedLine.replace(/^#+\s*/, ''),
          lines: [line]
        };
      }
      // Tables
      else if (trimmedLine.match(/^\|.*\|$/)) {
        if (currentBlock?.type !== 'table') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            type: 'table',
            content: '',
            lines: []
          };
        }
        currentBlock.lines.push(line);
      }
      // Code blocks
      else if (trimmedLine.match(/^```/)) {
        if (currentBlock?.type !== 'code') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            type: 'code',
            content: '',
            lines: []
          };
        }
        currentBlock.lines.push(line);
      }
      // Lists
      else if (trimmedLine.match(/^[-*+]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
        if (currentBlock?.type !== 'list') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            type: 'list',
            content: '',
            lines: []
          };
        }
        currentBlock.lines.push(line);
      }
      // Regular text
      else if (trimmedLine.length > 0) {
        if (currentBlock?.type !== 'text') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            type: 'text',
            content: '',
            lines: []
          };
        }
        currentBlock.lines.push(line);
      }
      // Empty line - finish current block
      else if (trimmedLine.length === 0 && currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
    });

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return blocks;
  }

  /**
   * Render individual content block with proper formatting
   */
  private renderBlock(block: ContentBlock, isLast: boolean): void {
    const colors = require('./color-utils').ColorSchemes[this.options.colorScheme];
    
    switch (block.type) {
      case 'header':
        const headerColor = block.level === 1 ? 'primary' : 
                           block.level === 2 ? 'accent' : 'secondary';
        console.log(getChalkColor(headerColor, 'bold')(block.content));
        if (!isLast) console.log();
        break;

      case 'table':
        this.renderMarkdownTable(block.lines);
        if (!isLast) console.log();
        break;

      case 'code':
        this.renderCodeBlock(block.lines);
        if (!isLast) console.log();
        break;

      case 'list':
        block.lines.forEach(line => {
          const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)/);
          if (match) {
            const [, indent, bullet, text] = match;
            console.log(
              indent + 
              getChalkColor(colors.accent)(bullet) + ' ' + 
              getChalkColor(colors.dim)(text)
            );
          }
        });
        if (!isLast) console.log();
        break;

      case 'text':
        // Handle long text with proper word wrapping
        const text = block.lines.join('\n');
        this.renderWrappedText(text);
        if (!isLast) console.log();
        break;
    }
  }

  /**
   * Render text with proper word wrapping (prevents truncation)
   */
  private renderWrappedText(text: string): void {
    const maxWidth = Math.min(this.options.terminalWidth - 4, 120);
    const words = text.split(/\s+/);
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length > maxWidth && currentLine) {
        console.log(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      console.log(currentLine);
    }
  }

  /**
   * Render markdown-style tables with proper formatting
   */
  private renderMarkdownTable(lines: string[]): void {
    const colors = require('./color-utils').ColorSchemes[this.options.colorScheme];
    
    lines.forEach((line, index) => {
      if (line.includes('|') && !line.match(/^\s*\|[-:\s|]+\|\s*$/)) {
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        
        if (index === 0) {
          // Header row
          const headerRow = cells.map(cell => 
            getChalkColor(colors.primary, 'bold')(cell.padEnd(15))
          ).join(' | ');
          console.log(headerRow);
          console.log(getChalkColor(colors.dim)('─'.repeat(headerRow.length / 2)));
        } else {
          // Data row
          const dataRow = cells.map(cell => 
            getChalkColor(colors.dim)(cell.padEnd(15))
          ).join(' | ');
          console.log(dataRow);
        }
      }
    });
  }

  /**
   * Render code blocks with syntax highlighting
   */
  private renderCodeBlock(lines: string[]): void {
    const colors = require('./color-utils').ColorSchemes[this.options.colorScheme];
    
    lines.forEach(line => {
      if (!line.trim().startsWith('```')) {
        console.log(getChalkColor(colors.accent)('  ' + line));
      }
    });
  }

  /**
   * Render OpenBB-style data tables
   */
  private renderTable(tableData: any[]): void {
    console.log(chalk.blue('\n📊 Data Table:'));
    console.table(tableData);
  }

  /**
   * Render OpenBB-style visualizations
   */
  private renderVisualization(vizData: any): void {
    console.log(chalk.green('\n📈 Chart/Visualization:'));
    console.log(vizData);
  }

  /**
   * Render OpenBB charts with ASCII representation
   */
  private renderCharts(charts: any): void {
    console.log(chalk.magenta('\n📊 Charts:'));
    if (Array.isArray(charts)) {
      charts.forEach((chart, index) => {
        console.log(chalk.dim(`Chart ${index + 1}:`));
        console.log(chart);
      });
    } else {
      console.log(charts);
    }
  }
}

interface ContentBlock {
  type: 'header' | 'text' | 'table' | 'code' | 'list';
  level?: number;
  content: string;
  lines: string[];
}