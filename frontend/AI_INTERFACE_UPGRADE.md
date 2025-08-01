# AI Interface: Unified System Architecture

## 🚀 Current Implementation (January 2025)

The RedPill VC platform features a unified AI system built around the UnifiedAISystem context provider. This architecture supports persistent chat sessions, research workflows, and multi-provider AI integration.

## ✨ Key Features Implemented

### 1. **UnifiedAISystem Architecture**
- **Context Provider**: Central AI state management with React Context API
- **Session Persistence**: Chat sessions stored in localStorage with unique IDs
- **Multi-Provider Support**: RedPill AI (primary) + OpenAI (fallback) + mock development mode
- **Message Management**: addMessage function for consistent session updates

### 2. **OpenResearchCanvas Interface (ANA-Style)**
- **Document-Style Layout**: ANA-inspired two-panel layout (document left, chat right)
- **Professional Markdown Rendering**: Custom ReactMarkdown components with proper typography
- **Approval Workflow**: Research plan generation → user approval → structured execution
- **Card-Based Sections**: Professional section organization with gradient headers
- **Auto-Expansion**: Interface expands immediately when AI starts processing
- **Enhanced Visual Hierarchy**: Improved headings, spacing, and content organization
- **Real-Time Updates**: Streaming content updates with smooth animations

### 3. **Chat History System**
- **Session Management**: Persistent chat history with metadata and previews
- **Search & Filter**: Search conversations by content, filter by time periods
- **Session Loading**: Restore previous conversations with full context
- **Storage Keys**: Standardized format (`chat-history-${projectId}`)

### 4. **Component Integration**
- **UnifiedAIButtons**: Consistent AI action buttons across the platform
- **Project Context**: AI remembers company/deal context between sessions
- **Memo Integration**: Save AI insights as memos with proper storage sync
- **Error Handling**: Graceful fallbacks and comprehensive error logging
- **Responsive Design**: Works across desktop and mobile devices

## 🏗️ Technical Architecture

### Core Components

```
UnifiedAISystem (Context Provider)
├── OpenResearchCanvas (Research Interface)
├── ChatHistory (Session Viewer)
├── UnifiedAIButtons (Action Buttons)
└── Component Integration Layer
```

### Key Files
- `src/components/ai/UnifiedAISystem.tsx` - Core AI context and state management
- `src/components/ai/OpenResearchCanvas.tsx` - Main research interface
- `src/components/ai/ChatHistory.tsx` - Session history viewer
- `src/components/ai/UnifiedAIButtons.tsx` - AI action buttons
- `backend/app/api/ai_chat.py` - Unified backend AI endpoint

### Data Flow
1. User interacts with AI buttons or canvas
2. UnifiedAISystem manages session state
3. Messages sent to backend `/api/v1/chat/ai-chat`
4. Backend routes to appropriate AI provider
5. Response processed and stored in session
6. UI updates with new content and state

## 📚 Usage Examples

### Basic AI Chat
```typescript
const { openAI } = useAI()

// Open AI chat for a specific project
openAI({
  projectId: 'company-123',
  projectType: 'company',
  projectName: 'Chainlink'
})
```

### Research Workflow
```typescript
// Trigger structured research
await sendMessage('market research for chainlink')
// -> Automatically expands to research canvas
// -> Shows approval workflow
// -> Executes approved plan
```

### Session Management
```typescript
const { getChatHistory, loadChatSession } = useAI()

// Get all sessions for a project
const sessions = getChatHistory(projectId, projectType)

// Load a specific session
loadChatSession('session-1753818169177-8pn16rycl')
```

### Components Structure
```
/components/ai/
├── AgenticChatInterface.tsx     # Main chat interface
├── AgenticChatButton.tsx        # Trigger button component
├── EnhancedAISidebar.tsx        # Legacy (replaced)
└── CompanyAIAssistant.tsx       # Legacy (updated to use new API)
```

### Key Technologies
- **React + TypeScript**: Type-safe component development
- **ReactMarkdown**: Rich text rendering with custom components and remark-gfm plugin
- **Custom Markdown Components**: ANA-style typography with proper headings, lists, and code blocks
- **React Syntax Highlighter**: Code highlighting with multiple themes
- **Framer Motion**: Smooth animations and transitions
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling with professional card layouts

## 🔄 Workflow Types

### 1. Due Diligence Workflow
- **Perception**: Data Collection
- **Reasoning**: Business Model Analysis
- **Action**: Risk Assessment
- **Reflection**: Investment Recommendation

### 2. Market Analysis Workflow
- **Perception**: Market Scanning
- **Reasoning**: Trend Analysis
- **Action**: Competitive Mapping
- **Reflection**: Market Position

### 3. Financial Analysis Workflow
- **Perception**: Financial Data Collection
- **Reasoning**: Unit Economics Analysis
- **Action**: Financial Modeling
- **Reflection**: Valuation Assessment

### 4. Investment Memo Workflow
- **Perception**: Research Synthesis
- **Reasoning**: Investment Thesis
- **Action**: Memo Writing
- **Reflection**: Final Review

## 🎯 Usage Examples

### Basic Chat
```typescript
<AgenticChatInterface
  project={project}
  isOpen={chatOpen}
  onToggle={setChatOpen}
>
  <YourMainContent />
</AgenticChatInterface>
```

### Trigger Button
```typescript
<AgenticChatButton 
  project={project}
  onClick={() => setChatOpen(true)}
/>
```

## 📊 Demo Page

Created `/ai-demo` page showcasing:
- **Feature Overview**: All capabilities explained
- **Project Selection**: Test with different companies
- **Sample Prompts**: Pre-written examples to try
- **Live Interface**: Full interactive demo

Access via: `http://localhost:3000/ai-demo`

## 🔧 Configuration

### Environment Variables
```bash
REDPILL_AI_API_KEY=your_api_key_here
COINGECKO_API_KEY=your_coingecko_key
```

### API Integration
- Uses existing `/api/chat` endpoint
- Supports streaming responses
- Handles reasoning content from DeepSeek-R1
- Fallback error handling

## 🎨 Visual Improvements

### Before vs After
- **Before**: Basic chat bubbles with limited formatting and poor markdown rendering
- **After**: ANA-style professional UI with rich markdown, enhanced typography, and structured layouts

### ANA-Style Design Elements
- **Two-Panel Layout**: Document canvas (left) with chat sidebar (right)
- **Professional Typography**: Custom heading styles with proper hierarchy and spacing
- **Card-Based Sections**: Each research section in clean cards with gradient headers
- **Enhanced Markdown Rendering**: Custom ReactMarkdown components for better formatting
- **Improved Visual Hierarchy**: Better contrast, spacing, and content organization
- **Professional Color Scheme**: Subtle gradients and consistent styling throughout

### Color Coding
- **User Messages**: Blue gradient with clean borders
- **Agent Messages**: Clean white with professional styling
- **Section Headers**: Gradient backgrounds with proper contrast
- **Workflow Steps**: Color-coded by status (pending/active/completed/failed)
- **Research Sections**: Card-based layout with subtle shadows and borders

## 🚀 Performance Optimizations

- **Lazy Loading**: Components load only when needed
- **Memoization**: Prevents unnecessary re-renders
- **Virtual Scrolling**: Handles long conversation histories
- **Debounced Inputs**: Reduces API calls during typing

## 🔮 Future Enhancements

1. **Voice Integration**: Speech-to-text and text-to-speech
2. **Document Analysis**: Drag-and-drop document analysis
3. **Graph Visualizations**: Interactive charts and graphs
4. **Collaborative Features**: Multi-user chat sessions
5. **Integration APIs**: Connect to external data sources

## 📝 Migration Notes

### Replaced Components
- `EnhancedAISidebar` → `AgenticChatInterface` (✅ Updated in ProjectDetail)
- `CompanyAIAssistant` → Uses new API integration (✅ Updated)
- `RedpillChat` → `AgenticChatInterface` (✅ Replaced)

### Breaking Changes
- Interface props changed from `isOpen/onClose` to `isOpen/onToggle`
- Project data structure expects `id`, `name`, `sector`, `stage` fields
- Chat history storage format updated for better context

## 🎉 Results

The new ANA-style AI interface provides:
- **Professional Research Experience**: ANA-inspired two-panel layout with document-style presentation
- **Enhanced Markdown Rendering**: Custom ReactMarkdown components with proper typography and formatting
- **Improved Visual Hierarchy**: Better contrast, spacing, and content organization
- **Card-Based Section Design**: Professional section organization with gradient headers
- **Transparent Reasoning**: Users can see exactly how the AI thinks through structured workflows  
- **Real-Time Updates**: Streaming content with smooth animations and visual feedback
- **Context Awareness**: Company-specific insights and recommendations

### Key Improvements from ANA Integration:
- **Fixed "terrible" markdown rendering** with custom ReactMarkdown components
- **Professional typography** matching research document standards
- **Two-panel layout** for optimal content consumption
- **Enhanced visual design** with proper spacing and hierarchy
- **Card-based sections** for better content organization

This positions RedPill VC at the forefront of AI-powered investment platforms with a research-grade user experience that rivals professional tools like ANA, showcasing the full capabilities of modern reasoning models in a visually appealing and highly functional interface.