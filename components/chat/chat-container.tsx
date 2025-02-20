"use client";

import { useEffect } from 'react';
import { useChatStore } from '@/lib/stores/chat-store';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { Card } from '@/components/ui/card';

export function ChatContainer() {
  const { 
    messages, 
    isLoading, 
    error,
    initializeChat,
    sendMessage 
  } = useChatStore();

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  if (error) {
    return (
      <Card className="p-4 bg-destructive/10 text-destructive">
        <p>{error}</p>
      </Card>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-4">
      <div className="flex flex-col h-[800px] space-y-4">
        <MessageList messages={messages} />
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}