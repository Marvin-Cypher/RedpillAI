# Redpill System Architecture

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend (Next.js 14)"
        UI[React Components]
        Store[Zustand State]
        WS[WebSocket Client]
    end
    
    subgraph "Backend (FastAPI)"
        API[REST API]
        Auth[Authentication]
        DB[PostgreSQL]
        Redis[Redis Cache]
        WSS[WebSocket Server]
    end
    
    subgraph "AI Services"
        Agents[Multi-Agent System]
        RAG[Document Analysis]
        Vector[Vector Database]
        LLM[OpenAI/Claude]
    end
    
    subgraph "External APIs"
        CoinGecko[CoinGecko API]
        Messari[Messari API]
        Social[Social APIs]
        Blockchain[Blockchain APIs]
    end
    
    subgraph "TEE Environment (Future)"
        Enclave[Phala TEE Enclave]
        Private[Private AI Instance]
    end
    
    UI --> API
    UI --> WS
    WS --> WSS
    API --> DB
    API --> Redis
    API --> Agents
    Agents --> RAG
    RAG --> Vector
    Agents --> LLM
    API --> CoinGecko
    API --> Messari
    API --> Social
    API --> Blockchain
    
    Private --> Enclave
    Agents -.-> Private
```

## Technology Stack

### Backend Core
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+ with JSON support
- **ORM**: SQLModel (type-safe, async)
- **Cache**: Redis 7+ (sessions, real-time data)
- **Authentication**: Supabase Auth or Auth0
- **WebSocket**: FastAPI native WebSocket support

### AI & ML Stack
- **Multi-Agent Framework**: CrewAI or AutoGen
- **LLM Providers**: OpenAI GPT-4, Anthropic Claude
- **Vector Database**: Pinecone (managed) or Qdrant (self-hosted)
- **Document Processing**: Unstructured.io + LangChain
- **Embeddings**: OpenAI text-embedding-3-large

### Frontend Stack
- **Framework**: Next.js 14 (App Router)
- **UI Library**: shadcn/ui + TailwindCSS
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Real-time**: WebSocket + Server-Sent Events
- **Charts**: Recharts or Observable Plot
- **Tables**: TanStack Table

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (production)
- **File Storage**: AWS S3 or MinIO
- **Monitoring**: Prometheus + Grafana
- **Logging**: Structured logging with Loguru
- **CI/CD**: GitHub Actions

## Data Architecture

### Core Database Schema

```sql
-- Companies and Deals
companies (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    sector VARCHAR(100),
    stage investment_stage,
    token_symbol VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

deals (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    status deal_status DEFAULT 'planned',
    valuation BIGINT,
    round_size BIGINT,
    our_investment BIGINT,
    our_target BIGINT,
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Research and Conversations
conversations (
    id UUID PRIMARY KEY,
    deal_id UUID REFERENCES deals(id),
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    context JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

research_memos (
    id UUID PRIMARY KEY,
    deal_id UUID REFERENCES deals(id),
    content TEXT NOT NULL,
    summary TEXT,
    confidence_score INTEGER,
    generated_at TIMESTAMP DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Document Management
documents (
    id UUID PRIMARY KEY,
    deal_id UUID REFERENCES deals(id),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    document_type doc_type,
    analysis_summary TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Portfolio and Performance
portfolio_companies (
    id UUID PRIMARY KEY,
    deal_id UUID REFERENCES deals(id),
    entry_date DATE NOT NULL,
    entry_valuation BIGINT,
    current_valuation BIGINT,
    shares_owned BIGINT,
    ownership_percentage DECIMAL(5,4),
    status portfolio_status DEFAULT 'active'
);

performance_metrics (
    id UUID PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolio_companies(id),
    metric_type metric_type,
    value DECIMAL(15,2),
    period_start DATE,
    period_end DATE,
    recorded_at TIMESTAMP DEFAULT NOW()
);
```

### Vector Database Schema (Pinecone/Qdrant)

```python
# Document embeddings structure
{
    "id": "doc_chunk_123",
    "vector": [0.1, 0.2, ...],  # 1536-dim embedding
    "metadata": {
        "deal_id": "uuid",
        "document_type": "pitch_deck",
        "chunk_index": 0,
        "source_page": 1,
        "content": "text content",
        "timestamp": "2024-01-01T00:00:00Z"
    }
}
```

## AI Agent Architecture

### Multi-Agent System Design

```python
from crewai import Agent, Task, Crew

# Market Research Agent
market_analyst = Agent(
    role="Crypto Market Research Analyst",
    goal="Analyze market size, competitive landscape, and growth trends",
    backstory="Expert in crypto markets with 10+ years of experience",
    tools=[
        WebSearchTool(),
        CoinGeckoTool(),
        MessariTool(),
        TwitterSentimentTool()
    ],
    memory=True,
    verbose=True
)

# Technical Analysis Agent  
tech_analyst = Agent(
    role="Blockchain Technical Analyst",
    goal="Evaluate technical architecture, security, and development activity",
    backstory="Senior blockchain engineer with security expertise",
    tools=[
        GitHubAnalysisTool(),
        SmartContractAuditor(),
        TechnicalDocumentAnalyzer()
    ],
    memory=True,
    verbose=True
)

# Financial Modeling Agent
financial_analyst = Agent(
    role="Venture Capital Financial Analyst", 
    goal="Build financial models and valuation frameworks",
    backstory="Former Goldman Sachs analyst specializing in VC investments",
    tools=[
        FinancialModelingTool(),
        ComparablesAnalysis(),
        PortfolioTracker()
    ],
    memory=True,
    verbose=True
)

# Research Coordination
research_crew = Crew(
    agents=[market_analyst, tech_analyst, financial_analyst],
    tasks=[
        market_analysis_task,
        technical_review_task, 
        financial_modeling_task,
        synthesis_task
    ],
    process=Process.sequential,
    memory=True,
    cache=True
)
```

### RAG System Architecture

```python
class DocumentAnalysisEngine:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
        self.vectorstore = PineconeVectorStore(
            index_name="redpill-documents",
            embedding=self.embeddings
        )
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview")
        
    async def process_document(self, file_path: str, deal_id: str):
        # Load and parse document
        loader = UnstructuredFileLoader(file_path)
        documents = await loader.aload()
        
        # Split into chunks with overlap
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
        )
        chunks = text_splitter.split_documents(documents)
        
        # Add metadata
        for i, chunk in enumerate(chunks):
            chunk.metadata.update({
                "deal_id": deal_id,
                "chunk_index": i,
                "document_type": self._detect_document_type(file_path),
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Store embeddings
        await self.vectorstore.aadd_documents(chunks)
        
        # Generate initial analysis
        analysis = await self._generate_document_analysis(chunks, deal_id)
        return analysis
        
    async def query_documents(self, query: str, deal_id: str, top_k: int = 5):
        # Semantic search within deal context
        results = await self.vectorstore.asimilarity_search(
            query,
            k=top_k,
            filter={"deal_id": deal_id}
        )
        
        # Generate contextual response
        context = "\n".join([doc.page_content for doc in results])
        response = await self.llm.ainvoke([
            SystemMessage(content="You are a VC research assistant analyzing documents."),
            HumanMessage(content=f"Based on this context: {context}\n\nAnswer: {query}")
        ])
        
        return response.content, results
```

## API Design

### RESTful Endpoints

```python
from fastapi import FastAPI, Depends, BackgroundTasks
from sqlmodel import Session

app = FastAPI(title="Redpill VC CRM API", version="1.0.0")

# Deal Management
@app.post("/api/v1/deals/", response_model=Deal)
async def create_deal(deal: DealCreate, db: Session = Depends(get_db)):
    """Create new investment opportunity"""
    
@app.get("/api/v1/deals/", response_model=List[Deal])
async def list_deals(
    status: Optional[DealStatus] = None,
    sector: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List deals with filtering"""

@app.put("/api/v1/deals/{deal_id}/status")
async def update_deal_status(
    deal_id: UUID, 
    status: DealStatus,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Update deal status and trigger AI workflows"""
    # Update database
    # Trigger background AI analysis
    # Send real-time notifications

# AI Research
@app.post("/api/v1/deals/{deal_id}/chat")
async def chat_with_ai(
    deal_id: UUID,
    message: ChatMessage,
    db: Session = Depends(get_db)
):
    """Context-aware AI chat for specific deal"""
    
@app.post("/api/v1/deals/{deal_id}/documents")
async def upload_document(
    deal_id: UUID,
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Upload and analyze documents"""
    
@app.get("/api/v1/deals/{deal_id}/research-memo")
async def get_research_memo(deal_id: UUID, db: Session = Depends(get_db)):
    """Get AI-generated research memo"""

# Portfolio Management
@app.get("/api/v1/portfolio/", response_model=List[PortfolioCompany])
async def list_portfolio(db: Session = Depends(get_db)):
    """Get portfolio companies with performance metrics"""
    
@app.get("/api/v1/portfolio/{company_id}/performance")
async def get_performance_metrics(
    company_id: UUID,
    period: str = "6m",
    db: Session = Depends(get_db)
):
    """Get detailed performance metrics"""
```

### WebSocket Events

```python
from fastapi import WebSocket
import json

@app.websocket("/ws/{deal_id}")
async def websocket_endpoint(websocket: WebSocket, deal_id: UUID):
    await websocket.accept()
    
    try:
        while True:
            # Listen for messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "chat_message":
                # Process AI chat
                response = await ai_research_service.process_message(
                    message["content"], 
                    deal_id
                )
                await websocket.send_json({
                    "type": "ai_response",
                    "content": response,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
            elif message["type"] == "status_update":
                # Broadcast status changes
                await websocket.send_json({
                    "type": "status_changed",
                    "deal_id": str(deal_id),
                    "new_status": message["status"]
                })
                
    except WebSocketDisconnect:
        # Handle disconnect
        pass
```

## Security Architecture

### Authentication & Authorization

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
import jwt

security = HTTPBearer()

async def get_current_user(token: str = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Role-based access control
def require_role(required_role: str):
    def role_checker(current_user=Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker
```

### Data Encryption

```python
from cryptography.fernet import Fernet

class EncryptionService:
    def __init__(self, key: bytes):
        self.cipher = Fernet(key)
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive information like API keys"""
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive information"""
        return self.cipher.decrypt(encrypted_data.encode()).decode()
```

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: redpill
      POSTGRES_USER: redpill
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://redpill:dev_password@postgres:5432/redpill
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    volumes:
      - ./frontend:/app

volumes:
  postgres_data:
```

### Production Kubernetes

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redpill-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: redpill-backend
  template:
    metadata:
      labels:
        app: redpill-backend
    spec:
      containers:
      - name: backend
        image: redpill/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: redpill-secrets
              key: database-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: redpill-secrets
              key: openai-api-key
```

This architecture provides a solid foundation for building Redpill as a scalable, maintainable, and secure VC CRM platform with advanced AI capabilities.