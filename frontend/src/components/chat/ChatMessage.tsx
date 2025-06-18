import { type ReactNode } from 'react';

interface ChatMessageProps {
  type: 'user' | 'ai';
  children: ReactNode;
}

export function ChatMessage({ type, children }: ChatMessageProps) {
  if (type === 'user') {
    return (
      <div className="flex items-start space-x-3 justify-end animate-slide-up">
        <div className="chat-bubble-user rounded-2xl rounded-tr-sm p-4 max-w-md">
          {children}
        </div>
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          <i className="fas fa-user text-gray-600 text-sm"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3 animate-slide-up">
      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
        <i className="fas fa-heart text-white text-sm"></i>
      </div>
      <div className="chat-bubble-ai rounded-2xl rounded-tl-sm p-4 max-w-2xl">
        {children}
      </div>
    </div>
  );
}
