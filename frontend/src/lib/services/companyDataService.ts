/**
 * Company Data Service
 * Handles company data operations including refresh functionality
 */

export interface CompanyRefreshResponse {
  success: boolean;
  data?: any;
  error?: string;
  lastUpdated?: string;
}

class CompanyDataService {
  private baseUrl = 'http://localhost:8000';

  /**
   * Refresh company data from external sources (Tavily + OpenBB)
   */
  async refreshCompanyData(companyId: string): Promise<CompanyRefreshResponse> {
    try {
      console.log(`🔄 Refreshing data for company: ${companyId}`);
      
      const response = await fetch(`${this.baseUrl}/api/v1/companies/${companyId}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ Successfully refreshed data for company: ${companyId}`);
      
      return {
        success: true,
        data,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Failed to refresh company data for ${companyId}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get enriched company data from backend
   */
  async getCompanyData(companyId: string): Promise<CompanyRefreshResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/companies/${companyId}`, {
        headers: {
          'Authorization': 'Bearer demo_token'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        lastUpdated: data.data_last_refreshed
      };

    } catch (error) {
      console.error(`❌ Failed to get company data for ${companyId}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if company data needs refreshing (older than 24 hours)
   */
  isDataStale(lastUpdated?: string): boolean {
    if (!lastUpdated) return true;
    
    const lastUpdateTime = new Date(lastUpdated);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff > 24;
  }
}

export const companyDataService = new CompanyDataService();