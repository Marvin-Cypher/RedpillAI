/**
 * Creation API Client
 * Connects Investment CRM dashboard to FastAPI creation endpoints
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
console.log('🔧 CreationAPI using API_BASE:', API_BASE);

export interface CreationSummary {
  creation_id: string;
  title: string;
  description: string;
  creation_type: string;
  category: string;
  symbols: string[];
  created_at: string;
  chart_url?: string;
  web_url?: string;
  priority: string;
  tags: string[];
}

export interface CreationDetail {
  creation_id: string;
  title: string;
  description: string;
  creation_type: string;
  category: string;
  symbols: string[];
  sectors: string[];
  created_at: string;
  openbb_tool: string;
  openbb_module: string;
  parameters: Record<string, any>;
  chart_url?: string;
  web_url?: string;
  priority: string;
  tags: string[];
  summary?: string;
  key_insights: string[];
  data: Record<string, any>;
}

export interface CreationCategories {
  categories: Array<{
    name: string;
    count: number;
    recent_items: Array<{
      creation_id: string;
      title: string;
      created_at: string;
      symbols: string[];
    }>;
    creation_types: string[];
  }>;
  total_creations: number;
}

export interface PortfolioContext {
  portfolio_context: Array<{
    symbol: string;
    total_creations: number;
    by_type: Record<string, number>;
    recent_analysis: Array<{
      creation_id: string;
      title: string;
      type: string;
      created_at: string;
      chart_url?: string;
    }>;
  }>;
  symbols_analyzed: string[];
  total_creations: number;
}

export class CreationAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE}/api/v1`;
  }

  async getUserCreations(
    userId: string,
    options: {
      creation_type?: string;
      category?: string;
      symbols?: string[];
      limit?: number;
    } = {}
  ): Promise<CreationSummary[]> {
    const params = new URLSearchParams();
    
    if (options.creation_type) params.append('creation_type', options.creation_type);
    if (options.category) params.append('category', options.category);
    if (options.symbols?.length) params.append('symbols', options.symbols.join(','));
    if (options.limit) params.append('limit', options.limit.toString());

    const fullUrl = `${this.baseUrl}/creations/${userId}?${params}`;
    console.log('🌐 Fetching creations from:', fullUrl);
    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch creations: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getCreationDetail(userId: string, creationId: string): Promise<CreationDetail> {
    const response = await fetch(`${this.baseUrl}/creations/${userId}/${creationId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch creation detail: ${response.statusText}`);
    }
    
    return response.json();
  }

  async searchCreations(
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<CreationSummary[]> {
    const params = new URLSearchParams({
      query,
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseUrl}/creations/${userId}/search?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to search creations: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getCreationCategories(userId: string): Promise<CreationCategories> {
    const response = await fetch(`${this.baseUrl}/creations/${userId}/categories`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch creation categories: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getPortfolioContextCreations(
    userId: string,
    symbols: string[]
  ): Promise<PortfolioContext> {
    const params = new URLSearchParams({
      symbols: symbols.join(',')
    });

    const response = await fetch(`${this.baseUrl}/creations/${userId}/portfolio-context?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio context: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getAvailableTypes(): Promise<{
    creation_types: string[];
    categories: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/creation-types`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch creation types: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Singleton instance
export const creationAPI = new CreationAPI();