import { Type } from "@google/genai";

export interface Project {
  id: string;
  title: string;
  description: string;
  instructions: string;
}

export interface Document {
  id: string;
  project_id: string;
  title: string;
  content: string;
  page_count: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  sources?: SourceCitation[];
  created_at: string;
}

export interface SourceCitation {
  documentTitle: string;
  pageNumber: number;
  excerpt: string;
  documentId?: string | null;
  documentUrl?: string | null;
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
