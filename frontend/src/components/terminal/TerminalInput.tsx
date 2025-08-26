import React, { forwardRef, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface TerminalInputProps {
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  isExecuting: boolean
  placeholder?: string
  className?: string
}

export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ value, onChange, onKeyDown, isExecuting, placeholder, className }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <span className="text-blue-400">❯</span>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isExecuting}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent outline-none placeholder-gray-600",
            "text-green-400 caret-green-400",
            isExecuting && "opacity-50 cursor-not-allowed",
            className
          )}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>
    )
  }
)

TerminalInput.displayName = 'TerminalInput'