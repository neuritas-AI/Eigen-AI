import axios from 'axios';

import type { ModelKey } from '@/types';

const api = axios.create({
  baseURL: '',
  timeout: 120000,
});

export type ChatRequest = { message: string; modelKey?: ModelKey; projectId?: string; conversationId?: string };
export type ChatResponse = { response: string; conversationId?: string };

function fallbackResponse(reason: string): ChatResponse {
  return {
    response:
      'The AI backend is temporarily unavailable. The chat interface is still available, and the same prompt will use the live model response as soon as the backend is reachable.',
  };
}

export async function postChatMessage(message: string, modelKey?: ModelKey, projectId?: string, conversationId?: string) {
  try {
    const { data } = await api.post<ChatResponse>('/api/chat', { message, modelKey, projectId, conversationId } as ChatRequest);
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    const detail = error?.response?.data?.message || error?.message || 'Unknown error';

    if (status === 403 || status === 404 || status === 429 || !error?.response) {
      return fallbackResponse(`HTTP ${status || 'network error'} - ${detail}`);
    }

    return fallbackResponse(`HTTP ${status || 'request error'} - ${detail}`);
  }
}
