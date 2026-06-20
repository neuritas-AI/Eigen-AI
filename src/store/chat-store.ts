import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Conversation, ChatMessage, ModelKey, Project } from '@/types';

interface ChatStore {
  conversations: Conversation[];
  projects: Project[];
  selectedConversationId: string | null;
  selectedProjectId: string | null;
  defaultModelKey: ModelKey;
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  createConversation: () => Conversation;
  selectConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  setLoading: (value: boolean) => void;
  clearConversation: (id: string) => void;
  selectProject: (projectId: string | null) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  setProjects: (projects: Project[]) => void;
  setConversations: (conversations: Conversation[]) => void;
  updateProject: (projectId: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  setConversationModel: (conversationId: string, modelKey: ModelKey) => void;
  setDefaultModelKey: (modelKey: ModelKey) => void;
}

const createTitle = (message: string) => message.slice(0, 40) || 'New chat';

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      projects: [],
      selectedConversationId: null,
      selectedProjectId: null,
      defaultModelKey: 'brainz_local',
      isLoading: false,
      input: '',
      setInput: (value) => set({ input: value }),
      createConversation: () => {
        const conversation: Conversation = {
          id: crypto.randomUUID(),
          title: 'New chat',
          messages: [],
          updatedAt: Date.now(),
          modelKey: get().defaultModelKey,
          projectId: get().selectedProjectId ?? undefined,
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
      selectProject: (projectId) => set({ selectedProjectId: projectId }),
      createProject: (project) => {
        const newProject: Project = {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...project,
        };
        set((state) => ({
          projects: [newProject, ...state.projects],
          selectedProjectId: newProject.id,
        }));
        return newProject;
      },
      setConversations: (conversations) => set({ conversations }),
      setProjects: (projects) => set({ projects }),
      updateProject: (projectId, updates) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, ...updates, updatedAt: Date.now() } : project
          ),
        }));
      },
      setConversationModel: (conversationId, modelKey) => {
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId ? { ...conversation, modelKey } : conversation
          ),
        }));
      },
      setDefaultModelKey: (modelKey) => set({ defaultModelKey: modelKey }),
    }),
    { name: 'brainz-chat-store' }
  )
);
