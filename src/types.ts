import { Type } from "@google/genai";

export interface Account {
  id: string;
  name: string;
  branding_json?: string;
  monthly_limit_usd?: number;
  warning_threshold_percent?: number;
  hard_stop_enabled?: boolean;
  totalSpentUsd?: number;
  balance?: number;
  status?: string;
  isBlocked?: boolean;
}

export interface Project {
  id: string;
  account_id?: string;
  title: string;
  description: string;
  instructions: string;
  voiceCreditUsedUsd?: number;
  textCreditUsedUsd?: number;
  totalCreditUsedUsd?: number;
}

export interface Document {
  id: string;
  project_id: string;
  title: string;
  content: string;
  page_count: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'kiosk';
  account_id?: string;
  account_name?: string;
  last_active: string;
  created_at?: string;
}

export interface ProjectMessageLogItem {
  id: string;
  session_id: string;
  role: 'user' | 'model';
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
  session_start?: string;
  sources?: SourceCitation[];
}

export interface GlobalMessageLogItem extends ProjectMessageLogItem {
  project_id: string;
  project_title: string;
  account_id: string;
  account_name: string;
}

export interface UsageLogItem {
  id: string;
  account_id: string;
  account_name: string;
  project_id: string;
  project_title: string;
  session_id: string;
  message_id: string;
  message_content: string;
  type: 'voice' | 'text';
  units: number;
  cost_usd: number;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | null;
  sources?: SourceCitation[];
  created_at: string;
}

export interface Analytics {
  totalSessions: number;
  totalMessages: number;
  activeProjects: number;
  totalDocuments: number;
  totalUsers: number;
  activeKiosks: number;
  accuracy: number;
  sessionVolume: number[];
  sentimentTotals?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  distribution?: {
    correct: number;
    clarifications: number;
    unknowns: number;
  };
  billing?: {
    totalSpentUsd: number;
    voiceSpentUsd: number;
    textSpentUsd: number;
    voiceSeconds: number;
    textCharacters: number;
    monthlyLimitUsd?: number;
    warningThresholdPercent?: number;
    hardStopEnabled?: boolean;
  };
}

export interface SourceCitation {
  documentTitle: string;
  pageNumber: number;
  excerpt: string;
}

export const AI_CONFIG = {
  model: "gemini-3.1-pro-preview",
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      answer: { type: Type.STRING, description: "The grounded answer to the user's question." },
      showSummary: { type: Type.BOOLEAN, description: "Whether to show the session summary and QR code. Set to true when the user indicates they are finished." },
      sources: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            documentTitle: { type: Type.STRING },
            pageNumber: { type: Type.INTEGER },
            excerpt: { type: Type.STRING }
          }
        }
      }
    },
    required: ["answer"]
  }
};
