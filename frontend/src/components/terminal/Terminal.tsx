"use client"

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { TerminalOutput } from './TerminalOutput'
import { TerminalInput } from './TerminalInput'
import { CommandHistory } from './CommandHistory'
import { useTerminalCommands } from '@/hooks/useTerminalCommands'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TerminalProps {
  className?: string
  onCommand?: (command: string) => void
}

export function Terminal({ className, onCommand }: TerminalProps) {
  const [input, setInput] = useState('')
  const [outputs, setOutputs] = useState<Array<{
    id: string
    type: 'command' | 'response' | 'error' | 'system'
    content: string
    timestamp: Date
    metadata?: any
  }>>([])
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { executeCommand, isExecuting } = useTerminalCommands()
  const history = useRef(new CommandHistory())
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Auto-scroll to bottom when new output
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [outputs])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const addOutput = (type: 'command' | 'response' | 'error' | 'system', content: string, metadata?: any) => {
    setOutputs(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp: new Date(),
      metadata
    }])
  }

  const handleCommand = async (command: string) => {
    if (!command.trim()) return
    
    // Add command to output
    addOutput('command', command)
    
    // Add to history
    history.current.add(command)
    setHistoryIndex(-1)
    
    // Clear input
    setInput('')
    
    // Execute command
    try {
      const result = await executeCommand(command)
      
      if (result.type === 'stream') {
        // Handle streaming responses
        for await (const chunk of result.stream) {
          addOutput('response', chunk)
        }
      } else {
        addOutput(result.success ? 'response' : 'error', result.message, result.data)
      }
    } catch (error) {
      addOutput('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    // Callback
    onCommand?.(command)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCommand(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevCommand = history.current.getPrevious(historyIndex)
      if (prevCommand !== null) {
        setInput(prevCommand.command)
        setHistoryIndex(prevCommand.index)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextCommand = history.current.getNext(historyIndex)
      if (nextCommand !== null) {
        setInput(nextCommand.command)
        setHistoryIndex(nextCommand.index)
      } else {
        setInput('')
        setHistoryIndex(-1)
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setOutputs([])
    }
  }

  const handleTerminalClick = () => {
    inputRef.current?.focus()
  }

  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-black text-green-400 font-mono text-sm rounded-lg overflow-hidden",
        className
      )}
      onClick={handleTerminalClick}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="text-xs text-gray-400">
          Redpill Terminal - Claude Code for Investment
        </div>
        <div className="text-xs text-gray-500">
          {isExecuting && "Executing..."}
        </div>
      </div>

      {/* Terminal Body */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-2">
          {/* Welcome Message */}
          {outputs.length === 0 && (
            <div className="text-gray-500">
              <p>Welcome to Redpill Terminal 🚀</p>
              <p>Type 'help' to see available commands or just describe what you want to do.</p>
              <p className="mt-2">Examples:</p>
              <p className="ml-4">• "import my portfolio from Notion"</p>
              <p className="ml-4">• "analyze Tesla's financials"</p>
              <p className="ml-4">• "monitor SOL and AAPL"</p>
              <p className="ml-4">• "show my portfolio performance"</p>
            </div>
          )}
          
          {/* Output History */}
          {outputs.map((output) => (
            <TerminalOutput key={output.id} output={output} />
          ))}
        </div>
      </ScrollArea>

      {/* Terminal Input */}
      <div className="border-t border-gray-800 p-4">
        <TerminalInput
          ref={inputRef}
          value={input}
          onChange={setInput}
          onKeyDown={handleKeyDown}
          isExecuting={isExecuting}
          placeholder={isExecuting ? "Executing..." : "Enter command or describe what you want..."}
        />
      </div>
    </div>
  )
}