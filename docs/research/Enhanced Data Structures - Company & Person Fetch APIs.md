# Enhanced Data Structures - Company & Person Fetch APIs

## Overview
This document defines the comprehensive data structures for fetching companies and persons in the enhanced RedpillAI CRM system, designed to support Exa.ai integration, talent intelligence, and multi-source data management.

## Company Fetch API Structure

### Basic Company Response (`GET /api/v1/companies/{id}`)

```typescript
interface CompanyResponse {
  // Core Company Data
  id: string;
  name: string;
  description?: string;
  website?: string;
  logo_url?: string;
  company_type: "PUBLIC" | "PRIVATE" | "CRYPTO";
  sector?: string;
  founded_date?: string; // ISO date
  employee_count?: number;
  headquarters?: string;
  
  // Status & Metadata
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  created_by?: string; // User ID
  owner_user_id?: string; // User ID
  
  // Enhanced Structured Data
  founders: PersonSummary[]; // From Person table
  key_people: PersonSummary[]; // CTOs, VPs, etc.
  tags: TagSummary[];
  deals: DealSummary[];
  ownership_structure: OwnershipSummary[];
  recent_activities: ActivitySummary[];
  
  // Multi-Source Data Attribution
  data_sources: DataSourceAttribution[];
  data_freshness: {
    profile_data: string; // Last updated ISO datetime
    team_data: string;
    financial_data: string;
    news_data: string;
  };
  
  // Market & Financial Data (if applicable)
  market_data?: {
    market_cap?: number;
    last_funding_round?: FundingRound;
    total_funding?: number;
    valuation?: number;
    stock_symbol?: string; // For public companies
    token_symbol?: string; // For crypto companies
  };
  
  // News & Updates
  recent_news?: NewsArticleSummary[];
  
  // Legacy Compatibility (deprecated but maintained)
  enriched_data?: Record<string, any>; // Gradually being replaced
}
```

### Extended Company Response (`GET /api/v1/companies/{id}?include=full`)

```typescript
interface ExtendedCompanyResponse extends CompanyResponse {
  // Full relationship data
  team: {
    founders: PersonDetailed[];
    executives: PersonDetailed[];
    key_employees: PersonDetailed[];
    advisors: PersonDetailed[];
    former_employees: PersonDetailed[]; // With talent tracking
  };
  
  // Complete deal pipeline
  deal_history: DealDetailed[];
  
  // Full activity timeline
  activity_timeline: ActivityDetailed[];
  
  // Comprehensive news and mentions
  news_coverage: {
    recent: NewsArticleDetailed[];
    sentiment_analysis?: {
      positive: number;
      negative: number;
      neutral: number;
      overall_score: number; // -1 to 1
    };
  };
  
  // Intelligence insights
  ai_insights?: {
    company_stage_assessment: string;
    growth_trajectory: "ACCELERATING" | "STABLE" | "DECLINING";
    investment_signals: string[];
    risk_factors: string[];
    opportunity_score: number; // 0-100
  };
  
  // Talent intelligence
  talent_metrics?: {
    total_talent_employees: number;
    ex_faang_count: number;
    technical_leadership_strength: number; // 0-100
    hiring_velocity: {
      last_30_days: number;
      last_90_days: number;
      year_over_year: number;
    };
  };
}
```

## Person Fetch API Structure

### Basic Person Response (`GET /api/v1/persons/{id}`)

```typescript
interface PersonResponse {
  // Core Person Data
  id: string;
  name: string;
  email?: string;
  phone?: string;
  primary_role?: string;
  company_id?: string;
  
  // Status & Metadata
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  
  // Professional Profile
  professional: PersonProfessionalProfile;
  
  // Talent Classification
  talent_profile?: TalentProfile;
  
  // Platform Presence
  platform_profiles: PlatformProfile[];
  
  // Achievements & Recognition
  achievements: AchievementSummary[];
  
  // Multi-Source Data Attribution
  data_sources: DataSourceAttribution[];
  data_confidence: number; // 0-1, weighted average of source confidence
  
  // Relationships
  current_company?: CompanySummary;
  associated_deals: DealSummary[];
  ownership_stakes: OwnershipSummary[];
  recent_activities: ActivitySummary[];
}
```

### Extended Person Response (`GET /api/v1/persons/{id}?include=full`)

```typescript
interface ExtendedPersonResponse extends PersonResponse {
  // Complete professional history
  career_timeline: {
    current_position: PositionDetailed;
    previous_positions: PositionDetailed[];
    career_progression: {
      years_experience: number;
      companies_count: number;
      average_tenure: number; // in months
      career_trajectory: "UPWARD" | "LATERAL" | "ENTREPRENEURIAL";
    };
  };
  
  // Full achievement portfolio
  achievement_portfolio: {
    achievements: AchievementDetailed[];
    achievement_score: number; // 0-100
    categories: {
      technical: AchievementDetailed[];
      leadership: AchievementDetailed[];
      entrepreneurial: AchievementDetailed[];
      recognition: AchievementDetailed[];
    };
  };
  
  // Complete platform intelligence
  digital_footprint: {
    github?: GitHubProfile;
    linkedin?: LinkedInProfile;
    twitter?: TwitterProfile;
    professional_websites?: string[];
    social_influence_score: number; // 0-100
    content_creation: {
      blog_posts: number;
      conference_talks: number;
      podcast_appearances: number;
      publications: number;
    };
  };
  
  // Network & Influence Analysis
  network_analysis?: {
    connection_strength: number; // 0-100
    industry_influence: number; // 0-100
    mutual_connections: PersonSummary[];
    recommended_by: RecommendationSummary[];
  };
  
  // AI-Generated Insights
  ai_insights?: {
    talent_summary: string;
    key_strengths: string[];
    experience_highlights: string[];
    potential_fit: {
      roles: string[];
      company_stages: string[];
      industries: string[];
    };
    risk_factors?: string[];
  };
}
```

## Supporting Data Structures

### Core Supporting Types

```typescript
interface PersonSummary {
  id: string;
  name: string;
  primary_role?: string;
  talent_score?: number;
  is_talent: boolean;
  current_company?: string;
  linkedin_url?: string;
}

interface PersonDetailed extends PersonSummary {
  professional: PersonProfessionalProfile;
  achievements: AchievementSummary[];
  platform_profiles: PlatformProfile[];
  talent_categories?: string[];
}

interface PersonProfessionalProfile {
  current_title?: string;
  current_company?: string;
  experience_years?: number;
  location?: string;
  skills: string[];
  languages?: string[];
  education: EducationRecord[];
  previous_roles: PreviousRole[];
  professional_summary?: string;
  
  // Platform URLs
  linkedin_url?: string;
  github_url?: string;
  twitter_url?: string;
  personal_website?: string;
}

interface TalentProfile {
  is_talent: boolean;
  talent_score?: number; // 0-100
  talent_categories: string[];
  manual_classification?: string;
  suggested_by_ai: boolean;
  suggestion_confidence?: number;
  achievement_summary?: string;
  classified_by?: string;
  classified_at?: string; // ISO datetime
}

interface PlatformProfile {
  platform: string; // "LINKEDIN" | "GITHUB" | "TWITTER" etc.
  profile_url: string;
  username?: string;
  followers_count?: number;
  engagement_score?: number;
  verified_account: boolean;
  last_activity?: string; // ISO datetime
  bio?: string;
}

interface AchievementSummary {
  id: string;
  achievement_type: string;
  title: string;
  date_achieved?: string; // ISO date
  verification_status: string;
  impact_score?: number; // 0-100
}

interface AchievementDetailed extends AchievementSummary {
  description?: string;
  source_url?: string;
  tags: string[];
  metadata?: Record<string, any>;
  verified_by?: string;
  verified_at?: string; // ISO datetime
}
```

### Company Supporting Types

```typescript
interface TagSummary {
  id: string;
  name: string;
  category: string;
  color?: string;
}

interface DealSummary {
  id: string;
  deal_status: string;
  investment_stage: string;
  amount?: number;
  created_at: string; // ISO datetime
  contact_person?: PersonSummary;
}

interface DealDetailed extends DealSummary {
  notes?: string;
  due_diligence_status?: string;
  next_steps?: string;
  team_members: PersonSummary[];
  activities: ActivitySummary[];
}

interface OwnershipSummary {
  person: PersonSummary;
  ownership_type: string;
  percentage?: number;
  is_active: boolean;
  share_class?: string;
}

interface ActivitySummary {
  id: string;
  activity_type: string;
  occurred_at: string; // ISO datetime
  performed_by?: PersonSummary;
  summary: string;
}

interface ActivityDetailed extends ActivitySummary {
  description?: string;
  metadata?: Record<string, any>;
  related_entities?: {
    companies?: CompanySummary[];
    deals?: DealSummary[];
    persons?: PersonSummary[];
  };
}
```

### Data Source & Intelligence Types

```typescript
interface DataSourceAttribution {
  source_name: string;
  source_type: "API" | "SCRAPER" | "MANUAL" | "EXA_AI";
  confidence_score: number; // 0-1
  last_updated: string; // ISO datetime
  data_fields: string[]; // Which fields came from this source
}

interface NewsArticleSummary {
  title: string;
  source: string;
  published_at: string; // ISO datetime
  url: string;
  relevance_score: number; // 0-1
}

interface NewsArticleDetailed extends NewsArticleSummary {
  content_summary: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  key_mentions: string[];
  embedding_vector?: number[]; // For similarity/deduplication
}

interface CompanySummary {
  id: string;
  name: string;
  company_type: string;
  sector?: string;
  employee_count?: number;
  headquarters?: string;
}

interface FundingRound {
  round_type: string;
  amount: number;
  date: string; // ISO date
  lead_investor?: string;
  valuation?: number;
}
```

### Platform-Specific Profiles

```typescript
interface GitHubProfile {
  username: string;
  public_repos: number;
  followers: number;
  following: number;
  contributions_last_year: number;
  languages: string[];
  starred_repos: number;
  organizations: string[];
  notable_repos?: {
    name: string;
    stars: number;
    language: string;
    description: string;
  }[];
}

interface LinkedInProfile {
  headline: string;
  connections: number;
  location: string;
  industry: string;
  experience: PreviousRole[];
  education: EducationRecord[];
  skills: string[];
  recommendations_count: number;
  posts_engagement_avg: number;
}

interface TwitterProfile {
  handle: string;
  followers: number;
  following: number;
  tweets_count: number;
  verified: boolean;
  bio: string;
  location?: string;
  engagement_rate: number; // Average engagement per tweet
  topics: string[]; // AI-analyzed main topics
}
```

### Educational & Career History

```typescript
interface EducationRecord {
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date?: string; // ISO date
  end_date?: string; // ISO date
  achievements?: string[];
}

interface PreviousRole {
  company: string;
  title: string;
  start_date?: string; // ISO date
  end_date?: string; // ISO date
  duration_months?: number;
  description?: string;
  achievements?: string[];
  skills_used?: string[];
}

interface PositionDetailed extends PreviousRole {
  company_info?: CompanySummary;
  team_size?: number;
  technologies?: string[];
  impact_metrics?: Record<string, any>;
}
```

## API Query Parameters & Filtering

### Company Fetch Options
```typescript
interface CompanyFetchOptions {
  include?: "basic" | "full" | "team" | "deals" | "activities" | "intelligence";
  data_freshness?: "latest" | "cached"; // Force fresh data vs cached
  source_priority?: string[]; // Prefer specific data sources
  include_inactive?: boolean; // Include inactive team members
  activity_days?: number; // Limit activities to last N days
  news_limit?: number; // Limit number of news articles
}
```

### Person Fetch Options
```typescript
interface PersonFetchOptions {
  include?: "basic" | "full" | "professional" | "achievements" | "platforms" | "intelligence";
  platform_data?: string[]; // Which platforms to include detailed data
  achievement_verification?: "all" | "verified_only" | "unverified_only";
  career_depth?: "current" | "recent" | "full"; // Career history depth
  ai_insights?: boolean; // Include AI-generated insights
  network_analysis?: boolean; // Include network analysis
}
```

## Implementation Benefits

### For Exa.ai Integration
- **Multi-source attribution** tracks which data came from Exa.ai vs other sources
- **Confidence scoring** helps resolve conflicts between data sources
- **Fresh data indicators** show when to refresh from external APIs
- **Structured relationships** replace unstructured JSON blobs

### For Talent Intelligence
- **Comprehensive talent scoring** with achievement and platform data
- **Multi-platform presence** tracking for complete professional profiles  
- **Career trajectory analysis** for investment decision insights
- **Achievement verification** system for reliable talent assessment

### For User Experience
- **Flexible inclusion levels** allow UI to request exactly needed data
- **Consistent data structures** across all entity types
- **Rich relationship modeling** supports complex UI requirements
- **Performance optimization** through selective data loading

This structure supports both the current CRM needs and future enhancements while maintaining backward compatibility with existing implementations.