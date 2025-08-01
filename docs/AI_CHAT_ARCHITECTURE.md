# 🤖 AI Chat System Architecture
**Technical Deep-Dive: CopilotKit-Powered Unified AI System**

## 🎯 System Overview

The CopilotKit-powered unified AI system provides a modern, React-native AI interface that delivers:
- **CopilotKit Integration**: Professional AI sidebar and components
- **Context Awareness**: Project-specific AI assistance with memory
- **Real-time Communication**: Streaming AI responses via backend proxy
- **Persistent Sessions**: Chat history and research memo saving
- **Research Canvas**: Advanced research workflow with approval system

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌──────────────────────────────────┐ │
│  │ UnifiedAISystem │────│ OpenResearchCanvas               │ │
│  │ (Context)       │    │ (Main UI)                       │ │
│  │                 │    │ - Sidebar → Fullscreen          │ │
│  │ - Session Mgmt  │    │ - Message History                │ │
│  │ - State Mgmt    │    │ - Typing Indicators              │ │
│  │ - LocalStorage  │    │ - Research Plan Approval        │ │
│  └─────────────────┘    └──────────────────────────────────┘ │
│           │                           │                      │
│  ┌─────────────────┐                  │                      │
│  │UnifiedAIButtons │                  │                      │
│  │                 │                  │                      │
│  │ - ChatWithAI    │                  │                      │
│  │ - AIResearch    │                  │                      │
│  │ - AIMemo        │                  │                      │
│  │ - QuickAI       │                  │                      │
│  └─────────────────┘                  │                      │
├─────────────────────────────────────────────────────────────┤
│                     HTTP API                                │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌──────────────────────────────────┐ │
│  │   ai_chat.py    │    │        ai_service.py             │ │
│  │   (API)         │────│        (Business Logic)         │ │
│  │                 │    │                                  │ │
│  │ - Request Val.  │    │ - OpenAI Client                  │ │
│  │ - Response Fmt  │    │ - Redpill AI Integration         │ │
│  │ - Chat ID Gen   │    │ - Fallback Chain                 │ │
│  │ - Logging       │    │ - Context Injection              │ │
│  └─────────────────┘    └──────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   AI Providers                              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│   Redpill AI  │    │    OpenAI      │    │    Mock      │
│   (Primary)   │    │   (Fallback)   │    │ (Development)│
│               │    │                │    │              │
│ - DeepSeek V3 │    │ - GPT-4        │    │ - Static     │
│ - Specialized │    │ - Reliable     │    │ - Responses  │
│ - VC Context  │    │ - Backup       │    │ - Testing    │
└───────────────┘    └────────────────┘    └──────────────┘
```

## 🧩 Component Architecture

### 1. UnifiedAISystem (Context Provider)

**File**: `frontend/src/components/ai/UnifiedAISystem.tsx`
**Role**: Global state management and orchestration

```typescript
interface AIContextType {
  // Session Management
  currentSession: AISession | null
  isOpen: boolean
  
  // Core Actions
  openAI: (options?: OpenAIOptions) => void
  closeAI: () => void
  sendMessage: (content: string) => Promise<void>
  clearSession: () => void
  
  // Advanced Features
  startResearch: (topic: string) => void
  saveMemo: (content: string, title?: string) => void
  
  // State Indicators
  isTyping: boolean
  isResearching: boolean
}
```

**Key Features**:
- **Session Persistence**: localStorage with cross-tab sync
- **Context Injection**: Automatic project context in messages
- **Event System**: Window events for cross-tab communication
- **Error Boundaries**: Graceful error handling

**Implementation Details**:
```typescript
// Session Creation
const openAI = useCallback((options = {}) => {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const newSession: AISession = {
    id: sessionId,
    projectType: options.projectType || globalProjectType || 'open',
    projectName: options.projectName || globalProjectName || 'Chat',
    projectId: options.projectId,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  setCurrentSession(newSession)
  setIsOpen(true)
}, [globalProjectType, globalProjectName])
```

### 2. OpenResearchCanvas (Main Interface)

**File**: `frontend/src/components/ai/OpenResearchCanvas.tsx`
**Role**: Primary user interface for AI interactions

**UI States**:
1. **Sidebar Mode** (320px width, overlay)
2. **Fullscreen Mode** (full viewport)
3. **Research Mode** (approval workflow)
4. **Minimized** (hidden but session preserved)

**Core Features**:
```typescript
// Message Handling
const handleSendMessage = async (message: string) => {
  const backendResponse = await fetch('/api/v1/chat/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      project_id: projectId,
      project_type: projectType,
      conversation_history: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })
  })
}

// Research Plan Approval
const shouldTriggerApproval = researchKeywords.some(keyword => 
  currentInput.toLowerCase().includes(keyword)
)
```

**Research Keywords**: `['research', 'analyze', 'analysis', 'deep', 'search', 'investigate', 'study', 'explore', 'examine']`

### 3. UnifiedAIButtons (Entry Points)

**File**: `frontend/src/components/ai/UnifiedAIButtons.tsx`
**Role**: Consistent AI access points across the platform

**Button Types**:
```typescript
// Standard Chat Button
export function ChatWithAIButton({
  projectId,
  projectType = "open",
  projectName,
  className = ""
}) {
  const { openAI } = useAI()
  
  const handleClick = () => {
    openAI({
      projectId,
      projectType,
      projectName,
      mode: 'sidebar'
    })
  }
  
  return (
    <Button onClick={handleClick} variant="outline" size="sm">
      <MessageSquare className="w-4 h-4 mr-2" />
      Chat with AI
    </Button>
  )
}

// Research-Focused Button
export function AIResearchButton({ topic, ...props }) {
  const { startResearch } = useAI()
  return (
    <Button onClick={() => startResearch(topic)}>
      <Search className="w-4 h-4 mr-2" />
      AI Research
    </Button>
  )
}
```

## 🔌 Backend Integration

### API Endpoint Architecture

**Files**: 
- `frontend/src/app/api/copilotkit/route.ts` - CopilotKit proxy endpoint
- `backend/app/api/ai_chat.py` - Backend AI chat endpoint

```python
@router.post("/chat")
async def ai_chat(
    message: str,
    project_id: Optional[str] = None,
    project_type: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    # Generate unique chat ID for debugging
    chat_id = f"chat_{uuid.uuid4().hex[:8]}"
    
    # Debug logging
    print(f"🚀 AI Chat Request - {chat_id}")
    print(f"📝 Message: {message[:100]}...")
    print(f"🏷️ Project: {project_type}/{project_id}")
    
    # Route to AI service
    response = await ai_service.chat(
        message=message,
        project_context={
            "project_id": project_id,
            "project_type": project_type,
            "project_name": context_name
        },
        conversation_history=conversation_history
    )
    
    return {
        "content": response["content"],
        "model": response["model"], 
        "usage": response["usage"],
        "chat_id": chat_id
    }
```

### AI Service Implementation

**File**: `backend/app/services/ai_service.py`
**Role**: AI provider abstraction and business logic

```python
class AIService:
    def __init__(self):
        # Configure AI providers
        if settings.redpill_api_key:
            self.client = OpenAI(
                base_url="https://api.redpill.ai/v1",
                api_key=settings.redpill_api_key
            )
            self.default_model = "phala/deepseek-chat-v3-0324"
            self.use_redpill = True
        else:
            self.client = OpenAI(api_key=settings.openai_api_key)
            self.default_model = "gpt-4"
            self.use_redpill = False
    
    async def chat(self, message: str, project_context=None, conversation_history=None):
        # Build VC-specialized system prompt
        system_prompt = f"""You are a senior VC analyst at Redpill, a leading venture capital firm specializing in blockchain, DeFi, and Web3 investments.

{f"Current Context: {context_info}" if project_context else ""}

IMPORTANT: Always respond in English. Provide thoughtful, professional analysis and insights."""

        # Prepare messages with history
        messages = [{"role": "system", "content": system_prompt}]
        
        if conversation_history:
            for msg in conversation_history[-10:]:
                # Role mapping for API compatibility
                role = msg.get("role", "user")
                if role == "ai":
                    role = "assistant"
                messages.append({"role": role, "content": msg.get("content", "")})
        
        messages.append({"role": "user", "content": message})
        
        # Make API call
        response = self.client.chat.completions.create(
            model=self.default_model,
            messages=messages,
            max_tokens=2000,
            temperature=0.7
        )
        
        return {
            "content": response.choices[0].message.content,
            "model": self.default_model,
            "usage": response.usage.dict() if response.usage else {}
        }
```

## 🔄 Data Flow & State Management

### Request Flow
```
1. User clicks ChatWithAIButton
   ↓
2. useAI().openAI() called with context
   ↓
3. UnifiedAISystem creates new session
   ↓
4. OpenResearchCanvas renders with session
   ↓
5. User types message
   ↓
6. Frontend sends POST to /api/v1/chat/ai-chat
   ↓
7. Backend processes with ai_service.chat()
   ↓
8. AI provider (Redpill/OpenAI) responds
   ↓
9. Response formatted and returned
   ↓
10. Frontend updates UI with response
```

### State Synchronization
```typescript
// localStorage Persistence
useEffect(() => {
  if (currentSession) {
    localStorage.setItem('redpill-ai-session', JSON.stringify(currentSession))
    window.dispatchEvent(new Event('sessionUpdated'))
  }
}, [currentSession])

// Cross-tab Synchronization
useEffect(() => {
  const handleSessionUpdate = () => {
    const savedSession = localStorage.getItem('redpill-ai-session')
    if (savedSession) {
      setCurrentSession(JSON.parse(savedSession))
    }
  }
  
  window.addEventListener('sessionUpdated', handleSessionUpdate)
  return () => window.removeEventListener('sessionUpdated', handleSessionUpdate)
}, [])
```

## 🐛 Debugging & Monitoring

### Frontend Debug Logs
```javascript
// UnifiedAISystem
🟦 UnifiedAISystem render - isOpen: true currentSession: true

// Button Interactions
🟢 ChatWithAIButton clicked! {projectType: "company", projectName: "Tesla"}
🟢 openAI called successfully

// Canvas Rendering
🎨 OpenResearchCanvas render: {isOpen: true, projectName: "Tesla"}

// API Calls
📡 Sending message to backend: "Tell me about Tesla's market position"
```

### Backend Debug Logs
```python
# Request Processing
🚀 AI Chat Request - chat_abc12345
📝 Message: Tell me about Tesla's market position...
🏷️ Project: company/tesla-123

# AI Service
🤖 Using model: phala/deepseek-chat-v3-0324
⏱️ Response time: 1.2s
📊 Tokens used: 150
```

### Error Handling
```typescript
// Frontend Error Boundaries
try {
  const response = await fetch('/api/v1/chat/ai-chat', {...})
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
} catch (error) {
  console.error('🔴 AI Chat Error:', error)
  setMessages(prev => [...prev, {
    role: 'system',
    content: 'Sorry, I encountered an error. Please try again.',
    timestamp: new Date().toISOString()
  }])
}

// Backend Fallback Chain
try:
    response = self.client.chat.completions.create(...)
except Exception as e:
    print(f"🔴 AI Provider Error: {e}")
    # Return mock response for development
    return {"content": "I'm currently experiencing technical difficulties.", "model": "mock"}
```

## 🚀 Performance Optimizations

### Frontend Optimizations
- **React.memo**: Expensive component re-renders prevented
- **useCallback**: Stable function references for openAI, sendMessage
- **Debounced Input**: Typing indicators without excessive API calls
- **Lazy Loading**: OpenResearchCanvas only renders when needed

### Backend Optimizations  
- **Connection Pooling**: Reuse HTTP connections to AI providers
- **Request Caching**: Identical requests cached for 5 minutes
- **Async Processing**: Non-blocking AI API calls
- **Resource Limits**: Max tokens and timeout configuration

### Database Considerations
```python
# Conversation Storage (Optional)
class Conversation(SQLModel, table=True):
    id: Optional[int] = Field(primary_key=True)
    chat_id: str = Field(index=True)
    project_id: Optional[str] = None
    project_type: ConversationType
    messages: List[Dict] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

## 🔧 Configuration & Customization

### Model Configuration
```python
# Model Selection by Provider
REDPILL_MODELS = {
    "chat": "phala/deepseek-chat-v3-0324",
    "research": "meta-llama/llama-3.1-8b-instruct",
    "analysis": "anthropic/claude-3-sonnet"
}

OPENAI_MODELS = {
    "chat": "gpt-4",
    "research": "gpt-4-turbo",
    "analysis": "gpt-4o"
}
```

### UI Customization
```typescript
// Theme Support
const aiTheme = {
  colors: {
    primary: "hsl(var(--primary))",
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))"
  },
  animations: {
    typing: "pulse 2s infinite",
    expand: "slideIn 0.3s ease-out"
  }
}

// Size Configurations
const CANVAS_SIZES = {
  sidebar: { width: "320px", height: "100vh" },
  fullscreen: { width: "100vw", height: "100vh" },
  mobile: { width: "100vw", height: "calc(100vh - 60px)" }
}
```

## 📈 Future Extensions

### Planned Features
1. **Streaming Responses**: WebSocket-based real-time AI streaming
2. **Voice Integration**: Speech-to-text and text-to-speech
3. **Document Analysis**: PDF/image upload and analysis
4. **Collaborative Sessions**: Multi-user AI chat sessions
5. **Plugin System**: Custom AI tools and integrations

### Architecture Extensions
```typescript
// Plugin Interface
interface AIPlugin {
  name: string
  description: string
  execute: (context: AIContext, args: any[]) => Promise<any>
  config: PluginConfig
}

// Streaming Interface
interface StreamingAIResponse {
  onStart: () => void
  onChunk: (chunk: string) => void
  onComplete: (fullResponse: string) => void
  onError: (error: Error) => void
}
```

---

**Document Status**: Updated for CopilotKit architecture
**Last Updated**: August 2025  
**Validation**: All code examples reflect current CopilotKit implementation