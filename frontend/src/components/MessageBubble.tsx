import React from 'react';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'agent';
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-purple-600 shadow-[0_0_15px_rgba(139,92,246,0.5)]'}`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>
        
        {/* Message Content */}
        <div 
          className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-sm shadow-md' 
              : 'glass text-gray-100 rounded-bl-sm border border-white/10 shadow-lg'
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
