/**
 * PRODUCTION GRADE DATA TYPES
 * Extension: Phase 3 Feedback System Types.
 */

// 1. The Legal Source
export interface ComplianceSource {
  [key: string]: any; 
  category?: string;
  sub_category?: string;
  state_region?: string;
  country?: string;
  criticality?: string;
}

// 2. The Individual Chat Message
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: ComplianceSource[];
  // User query associated with this specific assistant response
  // Used to link feedback correctly
  associatedQuery?: string;
}

// 3. The Feedback Record (Phase 3 New)
export interface FeedbackRecord {
  id: number;
  remark: string;
  created_at: string; // ISO timestamp from Postgres
}

// 4. The Active Filters
export interface ChatFilters {
  country?: string;
  state_region?: string;
  category?: string;
  sub_category?: string;
  criticality?: string;
}

// 5. The Sidebar Meta-Scope
export interface ComplianceScope {
  role: string;
  tenant: string;
  countries: string[];
  regAreasCount: number;
}

// 6. API Response Structure
export interface ChatApiResponse {
  answer: string;
  sources: ComplianceSource[];
}
