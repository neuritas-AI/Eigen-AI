import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

interface ChatStore {
  conversations: Conversation[];
  selectedConversationId: string | null;
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  createConversation: () => Conversation;
  selectConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  setLoading: (value: boolean) => void;
  clearConversation: (id: string) => void;
}

const createTitle = (message: string) => message.slice(0, 40) || 'New chat';

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      selectedConversationId: null,
      isLoading: false,
      input: '',
      setInput: (value) => set({ input: value }),
      createConversation: () => {
        const conversation: Conversation = {
          id: crypto.randomUUID(),
          title: 'New chat',
          messages: [],
          updatedAt: Date.now(),
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          selectedConversationId: conversation.id,
        }));
        return conversation;
      },
      selectConversation: (id) => set({ selectedConversationId: id }),
      addMessage: (conversationId, message) => {
        set((state) => {
          const conversations = state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  title: conversation.messages.length === 0 ? createTitle(message.content) : conversation.title,
                  updatedAt: Date.now(),
                  messages: [...conversation.messages, message],
                }
              : conversation
          );
          return { conversations };
        });
      },
      setLoading: (value) => set({ isLoading: value }),
      clearConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((conversation) => conversation.id !== id),
          selectedConversationId: state.selectedConversationId === id ? null : state.selectedConversationId,
        }));
      },
    }),
    { name: 'brainz-chat-store' }
  )
);
