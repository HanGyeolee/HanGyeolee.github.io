/**
 * Interface for line state information
 */
interface LineState {
    openParens: number;
    closeParens: number;
    openBraces: number;
    closeBraces: number;
    hasSemicolon: boolean;
}

export class IndentationTracker {
    lineStates: Map<number, LineState>;
    semicolonLines:number[];
    constructor() {
      this.lineStates = new Map<number, LineState>(); // Store parenthesis/brace state for each line
      this.semicolonLines = []; // Ordered list of line numbers containing semicolons
    }
  
    /**
     * Update state for a specific line
     * @param {string} lineContent - Content of the line
     * @param {number} lineNumber - Line number
     */
    updateLine(lineContent:string, lineNumber:number) {
      const openParens = (lineContent.match(/\(/g) || []).length;
      const closeParens = (lineContent.match(/\)/g) || []).length;
      const openBraces = (lineContent.match(/\{/g) || []).length;
      const closeBraces = (lineContent.match(/\}/g) || []).length;
      const hasSemicolon = lineContent.includes(';');
      
      // Store the state for this line
      this.lineStates.set(lineNumber, {
        openParens,
        closeParens,
        openBraces,
        closeBraces,
        hasSemicolon
      });
      
      // Update semicolon lines list
      if (hasSemicolon) {
        if (!this.semicolonLines.includes(lineNumber)) {
          this.semicolonLines.push(lineNumber);
          this.semicolonLines.sort((a, b) => a - b);
        }
      } else {
        const index = this.semicolonLines.indexOf(lineNumber);
        if (index > -1) {
          this.semicolonLines.splice(index, 1);
        }
      }
    }
    
    /**
     * Calculate indentation needed after pressing Enter at the current position
     * @param {IModel} model - Editor model
     * @param {Position} position - Current cursor position
     * @returns {number} - Number of tabs to indent
     */
    calculateIndentation(model, position) {
      // Find the most recent semicolon line before the current position
      let lastSemicolonLine = 1;
      for (let i = this.semicolonLines.length - 1; i >= 0; i--) {
        if (this.semicolonLines[i] < position.lineNumber) {
          lastSemicolonLine = this.semicolonLines[i];
          break;
        }
      }
      
      // Calculate parentheses/braces balance from last semicolon line to current line
      let parenBalance = 0;
      let braceBalance = 0;
      
      for (let line = lastSemicolonLine; line <= position.lineNumber; line++) {
        const state = this.lineStates.get(line);
        if (!state) continue;
        
        if (line === position.lineNumber) {
          // For current line, only count up to cursor position
          const contentBeforeCursor = model.getLineContent(line).substring(0, position.column - 1);
          const currentOpenParens = (contentBeforeCursor.match(/\(/g) || []).length;
          const currentCloseParens = (contentBeforeCursor.match(/\)/g) || []).length;
          const currentOpenBraces = (contentBeforeCursor.match(/\{/g) || []).length;
          const currentCloseBraces = (contentBeforeCursor.match(/\}/g) || []).length;
          
          parenBalance += currentOpenParens - currentCloseParens;
          braceBalance += currentOpenBraces - currentCloseBraces;
        } else {
          parenBalance += state.openParens - state.closeParens;
          braceBalance += state.openBraces - state.closeBraces;
        }
      }
      
      // Check if there's a semicolon in the current statement
      let hasSemicolonInCurrentStatement = false;
      for (let line = lastSemicolonLine + 1; line <= position.lineNumber; line++) {
        const state = this.lineStates.get(line);
        if (state && state.hasSemicolon) {
          hasSemicolonInCurrentStatement = true;
          break;
        }
      }
      
      // Calculate required indentation: parens + braces + (1 if no semicolon)
      const noSemicolonIndent = hasSemicolonInCurrentStatement ? 0 : 1;
      return Math.max(0, parenBalance) + Math.max(0, braceBalance) + noSemicolonIndent;
    }
    
    /**
     * Handle model content changes
     * @param {monaco.editor.IModelContentChangedEvent} event - Content change event
     * @param {IModel} model - Editor model
     */
    handleModelContentChanged(event, model) {
      // Update affected lines
      for (const change of event.changes) {
        const startLineNumber = change.range.startLineNumber;
        const endLineNumber = change.range.endLineNumber;
        
        // Update or remove state for each affected line
        for (let line = startLineNumber; line <= endLineNumber; line++) {
          if (line <= model.getLineCount()) {
            this.updateLine(model.getLineContent(line), line);
          } else {
            this.lineStates.delete(line);
            const index = this.semicolonLines.indexOf(line);
            if (index > -1) {
              this.semicolonLines.splice(index, 1);
            }
          }
        }
      }
    }
}