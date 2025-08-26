"use client"

import { Terminal } from '@/components/terminal/Terminal'
import { Card } from '@/components/ui/card'

export default function TerminalPage() {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Investment Terminal</h1>
        <p className="text-muted-foreground mt-2">
          Natural language interface powered by OpenBB Platform. Just describe what you want to do.
        </p>
      </div>
      
      <Card className="flex-1 overflow-hidden">
        <Terminal className="h-full" />
      </Card>
    </div>
  )
}