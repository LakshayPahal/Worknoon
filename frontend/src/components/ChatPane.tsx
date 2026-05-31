"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ShieldAlert } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

export function ChatPane({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'agent', content: 'Hello! I am the Worknoon AI Support Agent. How can I help you with your order today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: userMsg })
      });
      
      if (!res.ok) throw new Error('API Error');
      
      // The backend starts an async job. 
      // In a real app, we'd poll or wait for a specific SSE event that gives the final response.
      // For this demo, we'll wait for the SSE stream to push the final response, 
      // or we simulate a generic wait. Actually, the blueprint says the graph drafts a response.
      // Let's rely on the backend for this logic. Wait, the backend doesn't stream the *response text* to SSE,
      // it streams logs. The response text is returned in the state.
      // Ah! We need to fetch the final response or the backend should stream it over SSE.
      // Since the backend `/api/chat` just returns {"status": "processing"}, we should probably 
      // intercept the SSE event for "RESPONSE GEN: Response drafted successfully." and fetch it?
      // Wait, the backend doesn't currently expose an endpoint to GET the chat history.
      // Let's modify the chat logic to just add a mock delay for the demo, OR I can modify the backend to return the final response directly synchronously, since we can still stream logs in parallel!
      
      // Wait, I will just poll the health or assume the response will be streamed in logs.
      // For now, let's keep it simple. The blueprint says the admin dashboard is the clincher.
      // If we don't get the agent's actual response, it's weird. 
      // I'll update the backend `main.py` in the next step to return the final response synchronously for the ChatPane, while still emitting SSE logs!
      // For now, I'll assume we wait for a response from another endpoint, or I'll just change the backend `chat` to be synchronous.
      
      const data = await res.json();
      if(data.final_response) {
         setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', content: data.final_response }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', content: 'An error occurred connecting to the server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-6 py-4 glass-panel border-b border-white/5 z-10">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            Customer Support
          </h2>
          <p className="text-xs text-gray-400">Powered by LangGraph AI</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Agent Online
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <div className="flex flex-col gap-2 max-w-3xl mx-auto w-full">
          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4 animate-in fade-in">
              <div className="flex items-center gap-2 glass px-4 py-3 rounded-2xl rounded-bl-sm border border-white/10 text-gray-400 text-sm shadow-lg">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                Agent is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 glass-panel border-t border-white/5 z-10">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Type your message here..."
            className="w-full bg-black/40 border border-white/10 text-white rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all placeholder:text-gray-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50 disabled:hover:bg-purple-600"
          >
            <Send size={18} className={input.trim() && !isLoading ? "ml-0.5" : ""} />
          </button>
        </form>
      </div>
    </div>
  );
}
