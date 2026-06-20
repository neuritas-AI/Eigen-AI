export type MessageRole = 'user' | 'assistant';

export type ModelKey = 'brainz_local' | 'gpt5' | 'claude' | 'gemini';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  modelKey: ModelKey;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  instructions?: string;
  createdAt: number;
  updatedAt: number;
}
