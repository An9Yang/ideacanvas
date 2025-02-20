import { create } from 'zustand';
import { Message } from '@/lib/types/common';
import { createAssistant, createThread, sendMessage, getMessages } from '@/lib/services/chat-service';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  assistantId: string | null;
  threadId: string | null;
  initializeChat: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  assistantId: null,
  threadId: null,

  initializeChat: async () => {
    try {
      set({ isLoading: true, error: null });
      const assistant = await createAssistant();
      const thread = await createThread();
      set({ 
        assistantId: assistant.id,
        threadId: thread.id
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to initialize chat' });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (content: string) => {
    const { threadId, assistantId } = get();
    if (!threadId || !assistantId) {
      throw new Error('Chat not initialized');
    }

    try {
      set({ isLoading: true, error: null });
      await sendMessage(threadId, assistantId, content);
      const apiMessages = await getMessages(threadId);
      
      // 转换消息格式
      const messages: Message[] = apiMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: Array.isArray(msg.content) 
          ? msg.content
              .filter(c => 'text' in c && c.text?.value)
              .map(c => (c as { text: { value: string } }).text.value)
              .join('\n')
          : typeof msg.content === 'string' 
            ? msg.content 
            : JSON.stringify(msg.content)
      }));
      
      set({ messages });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
    } finally {
      set({ isLoading: false });
    }
  }
}));