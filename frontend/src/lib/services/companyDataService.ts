/**
 * Company Data Service
 * Handles company data operations including refresh functionality
 */

export interface CompanyRefreshResponse {
  success: boolean;
  data?: any;
  error?: string;
  lastUpdated?: string;
  message?: string;
  widgetMetricsGenerated?: boolean;
}

class CompanyDataService {
  private baseUrl = 'http://localhost:8000';

  /**
   * Refresh company data from external sources (Tavily + OpenBB)
   * @deprecated Use refreshCompanyDataForWidgets instead
   */
  async refreshCompanyData(companyId: string): Promise<CompanyRefreshResponse> {
    // Delegate to the enhanced widget-focused refresh
    return this.refreshCompanyDataForWidgets(companyId);
  }

  /**
   * Enhanced refresh specifically for widget data consumption
   * Generates complete financial metrics for all widgets
   */
  async refreshCompanyDataForWidgets(
    companyId: string, 
    forceExternalCalls: boolean = true
  ): Promise<CompanyRefreshResponse> {
    try {
      console.log(`🔄 Refreshing widget data for company: ${companyId}`);
      
      const response = await fetch(
        `${this.baseUrl}/api/v1/data/companies/${companyId}/refresh-for-widgets?force_external_calls=${forceExternalCalls}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
            // Removed auth for now since data endpoints don't require it
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`✅ Successfully refreshed widget data for company: ${companyId}`);
      console.log(`📊 Key metrics generated: ${result.key_metrics_generated}`);
      console.log(`💾 Cache updated: ${result.cache_updated}`);
      
      return {
        success: true,
        data: result.data,
        lastUpdated: result.refresh_timestamp,
        message: result.message,
        widgetMetricsGenerated: result.key_metrics_generated
      };

    } catch (error) {
      console.error(`❌ Failed to refresh widget data for ${companyId}:`, error);
      
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