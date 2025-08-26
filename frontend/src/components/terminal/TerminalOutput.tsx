import React from 'react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface TerminalOutputProps {
  output: {
    id: string
    type: 'command' | 'response' | 'error' | 'system'
    content: string
    timestamp: Date
    metadata?: any
  }
}

export function TerminalOutput({ output }: TerminalOutputProps) {
  const getPrefix = () => {
    switch (output.type) {
      case 'command':
        return '❯'
      case 'response':
        return '✓'
      case 'error':
        return '✗'
      case 'system':
        return '⚡'
      default:
        return '>'
    }
  }

  const getColor = () => {
    switch (output.type) {
      case 'command':
        return 'text-blue-400'
      case 'response':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'system':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  const renderContent = () => {
    // For responses, parse markdown
    if (output.type === 'response' && output.content.includes('```')) {
      return (
        <ReactMarkdown
          className="prose prose-invert prose-sm max-w-none"
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              )
            },
            p: ({ children }) => <div className="mb-2">{children}</div>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
            li: ({ children }) => <li className="ml-4">{children}</li>,
            h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-bold mb-1">{children}</h3>,
            a: ({ children, href }) => (
              <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-gray-600 pl-4 my-2 text-gray-400">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-2">
                <table className="border-collapse border border-gray-700">{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-gray-800">{children}</thead>,
            th: ({ children }) => <th className="border border-gray-700 px-2 py-1">{children}</th>,
            td: ({ children }) => <td className="border border-gray-700 px-2 py-1">{children}</td>,
          }}
        >
          {output.content}
        </ReactMarkdown>
      )
    }

    // For structured data in metadata, render as JSON
    if (output.metadata && typeof output.metadata === 'object') {
      return (
        <div className="space-y-2">
          <div>{output.content}</div>
          <pre className="bg-gray-900 p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(output.metadata, null, 2)}
          </pre>
        </div>
      )
    }

    // For multiline content
    if (output.content.includes('\n')) {
      return (
        <pre className="whitespace-pre-wrap break-words">
          {output.content}
        </pre>
      )
    }

    return output.content
  }

  return (
    <div className={cn("flex gap-2", getColor())}>
      <span className="flex-shrink-0">{getPrefix()}</span>
      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>
      <span className="text-xs text-gray-600 flex-shrink-0">
        {output.timestamp.toLocaleTimeString()}
      </span>
    </div>
  )
}