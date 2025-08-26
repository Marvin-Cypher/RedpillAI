export class CommandHistory {
  private history: string[] = []
  private maxSize: number = 100

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
    this.loadFromStorage()
  }

  add(command: string) {
    // Don't add duplicate consecutive commands
    if (this.history.length > 0 && this.history[this.history.length - 1] === command) {
      return
    }

    this.history.push(command)

    // Limit history size
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(-this.maxSize)
    }

    this.saveToStorage()
  }

  getPrevious(currentIndex: number): { command: string; index: number } | null {
    if (this.history.length === 0) return null

    let newIndex = currentIndex
    if (currentIndex === -1) {
      newIndex = this.history.length - 1
    } else if (currentIndex > 0) {
      newIndex = currentIndex - 1
    } else {
      return null
    }

    return {
      command: this.history[newIndex],
      index: newIndex
    }
  }

  getNext(currentIndex: number): { command: string; index: number } | null {
    if (currentIndex === -1 || currentIndex >= this.history.length - 1) {
      return null
    }

    const newIndex = currentIndex + 1
    return {
      command: this.history[newIndex],
      index: newIndex
    }
  }

  clear() {
    this.history = []
    this.saveToStorage()
  }

  getAll(): string[] {
    return [...this.history]
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('terminal-history')
      if (stored) {
        this.history = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load command history:', error)
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('terminal-history', JSON.stringify(this.history))
    } catch (error) {
      console.error('Failed to save command history:', error)
    }
  }
}