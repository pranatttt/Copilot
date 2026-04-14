import axios from 'axios';
import { ChatFilters, ChatApiResponse } from './types';

/**
 * PRODUCTION GRADE API CLIENT
 * Extension: Phase 3 Feedback System Integration.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, 
});

/**
 * Fetches dynamic metadata for sidebar filters.
 */
export const getMetadata = async (): Promise<{ 
  regions: string[], 
  categories: string[], 
  sub_categories: string[], 
  criticality: string[], 
  countries: string[] 
}> => {
  try {
    const response = await apiClient.get('/metadata');
    return response.data;
  } catch (error) {
    console.error("🔥 Metadata Fetch Failed:", error);
    return { regions: [], categories: [], sub_categories: [], criticality: [], countries: ['India'] };
  }
};

/**
 * Fetches saved messages for a specific session.
 */
export const getChatHistory = async (sessionId: string): Promise<any[]> => {
  try {
    const response = await apiClient.get(`/history/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("🔥 Failed to fetch session history:", error);
    return [];
  }
};

/**
 * PHASE 3: Submits user feedback/remark for a specific AI response.
 */
export const submitFeedback = async (
  sessionId: string,
  queryText: string,
  responseText: string,
  remark: string
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post('/feedback', {
      session_id: sessionId,
      query_text: queryText,
      response_text: responseText,
      remark: remark
    });
    return response.data;
  } catch (error: any) {
    console.error("🔥 Feedback Submission Failed:", error);
    throw new Error("Could not save feedback.");
  }
};

/**
 * PHASE 3: Retrieves all previous feedback for a specific query content.
 */
export const getFeedback = async (
  queryText: string,
  responseText: string
): Promise<any[]> => {
  try {
    const response = await apiClient.get('/feedback', {
      params: {
        query_text: queryText,
        response_text: responseText
      }
    });
    return response.data;
  } catch (error) {
    console.error("🔥 Feedback Retrieval Failed:", error);
    return [];
  }
};

/**
 * Sends query, filters, and session ID to the Backend.
 */
export const sendChatMessage = async (
  query: string, 
  filters: ChatFilters,
  sessionId: string,
  previousResponse?: string 
): Promise<ChatApiResponse> => {
  try {
    const response = await apiClient.post<ChatApiResponse>('/chat', {
      query: query,
      filters: filters,
      session_id: sessionId,
      previous_response: previousResponse 
    });

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.detail || "The compliance engine encountered an error.";
      throw new Error(errorMessage);
    }
    throw new Error("A network error occurred.");
  }
};
