import React from 'react';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'agent';
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';
  
  // Custom lightweight markdown renderer to prevent rendering ugly ** text
  const parseMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    
    return lines.map((line, lineIdx) => {
      // Check for bullet lists
      let isBullet = false;
      let cleanLine = line;
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        isBullet = true;
        // Strip out the bullet character
        cleanLine = line.trim().replace(/^[-*]\s+/, "");
      }
      
      // Split line into parts for bold (**), italics (*), and inline code (`)
      // regex handles **bold**, *italics*, `code`
      const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
      const pieces = cleanLine.split(regex);
      
      const parsedPieces = pieces.map((piece, pieceIdx) => {
        if (piece.startsWith('**') && piece.endsWith('**')) {
          return <strong key={pieceIdx} className="font-extrabold text-white">{piece.slice(2, -2)}</strong>;
        }
        if (piece.startsWith('*') && piece.endsWith('*')) {
          return <em key={pieceIdx} className="italic text-gray-300">{piece.slice(1, -1)}</em>;
        }
        if (piece.startsWith('`') && piece.endsWith('`')) {
          return <code key={pieceIdx} className="bg-black/50 px-1.5 py-0.5 rounded font-mono text-xs text-purple-300 border border-white/5">{piece.slice(1, -1)}</code>;
        }
        return piece;
      });

      if (isBullet) {
        return (
          <li key={lineIdx} className="list-disc list-inside ml-2 mb-1.5 text-gray-200 pl-2">
            <span>{parsedPieces}</span>
          </li>
        );
      }

      return (
        <p key={lineIdx} className={lineIdx > 0 ? "mt-1.5" : ""}>
          {parsedPieces}
        </p>
      );
    });
  };

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
          {parseMarkdown(content)}
        </div>
      </div>
    </div>
  );
}
