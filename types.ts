export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isError?: boolean;
}

export enum AppMode {
  CHAT = 'chat',
  ANALYZE = 'analyze',
}

export interface AnalysisMetric {
  metric: string;
  score: number; // 0-100
  reasoning: string;
}

export interface AnalysisResult {
  ideaName: string;
  summary: string;
  metrics: AnalysisMetric[];
  overallScore: number;
  recommendation: string;
}

export interface SavedSession {
  id: string;
  title: string;
  date: number; // Last modified timestamp
  mode: AppMode;
  messages: Message[];
  analysisResult: AnalysisResult | null;
}
