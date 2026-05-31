"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Mail, ShieldAlert, Sparkles, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  risk_score: string;
  orders: {
    id: number;
    purchase_date: string;
    total_amount: number;
    status: string;
  }[];
}

export function ChatPane({ sessionId }: { sessionId: string }) {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Collapsed by default for a clutter-free, user-friendly UI
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'agent', 
      content: 'Hello! I am the Worknoon AI Support Agent. To begin our secure customer session, I start with no pre-loaded knowledge about your account. Could you please provide your **full name**, **email address**, or **Order ID** so that I can look up your record in our database and assist you?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/users');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
        // Default to first customer if available
        if (data.length > 0 && selectedCustomerId === null) {
          handleCustomerChange(data[0].id, data);
        }
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Poll for customer changes or fetch when component is focused to keep in sync with CrmManager
  useEffect(() => {
    const interval = setInterval(fetchCustomers, 4000);
    return () => clearInterval(interval);
  }, [customers, selectedCustomerId]);

  const handleCustomerChange = (id: number, currentCustomers = customers) => {
    setSelectedCustomerId(id);
    const customer = currentCustomers.find(c => c.id === id) || null;
    setSelectedCustomer(customer);
    
    // Always start the chat session completely clean and anonymous
    setMessages([
      { 
        id: '1', 
        role: 'agent', 
        content: `Hello! I am the Worknoon AI Support Agent. 
        
To begin securely, I start with no pre-loaded knowledge about your account. Could you please provide your **full name**, **email address**, or **Order ID** so that I can look up your record in our database and assist you?` 
      }
    ]);
  };

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
        body: JSON.stringify({ 
          session_id: sessionId, 
          message: userMsg,
          user_id: selectedCustomerId
        })
      });
      
      if (!res.ok) throw new Error('API Error');
      
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
      <div className="flex flex-col px-6 py-4 glass-panel border-b border-white/5 z-10 gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Customer Support Center
            </h2>
            <p className="text-xs text-gray-400">Powered by LangGraph AI & Dynamic DB Lookup</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Agent Online
          </div>
        </div>

        {/* Customer Select Dropdown + Toggle Button */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-black/30 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex-shrink-0">
              Simulate Customer:
            </label>
            {customers.length === 0 ? (
              <div className="text-xs text-amber-400 font-mono py-1">
                (No customers in database. Please seed or add customers in the CRM tab)
              </div>
            ) : (
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => handleCustomerChange(parseInt(e.target.value))}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs transition-all cursor-pointer truncate"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {selectedCustomer && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="px-3.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 active:bg-purple-600/40 text-purple-300 border border-purple-500/20 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 flex-shrink-0"
              title="Toggle CRM Context Sidebar to see relational databases"
            >
              {isSidebarOpen ? <EyeOff size={13} /> : <Eye size={13} />}
              {isSidebarOpen ? "Hide Profile CRM" : "Show Profile CRM"}
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Grid (Split if customer selected & sidebar open) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side of Chatpane: Profile Card (hidden if sidebar closed) */}
        {selectedCustomer && isSidebarOpen && (
          <div className="hidden lg:flex w-64 border-r border-white/5 bg-black/20 flex-col overflow-y-auto p-4 gap-4 animate-in slide-in-from-left duration-300 ease-out flex-shrink-0">
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest border-b border-purple-500/20 pb-2 flex items-center gap-1.5">
              <Sparkles size={11} /> Customer CRM Context
            </div>

            {/* Profile Overview */}
            <div className="bg-white/3 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <User size={15} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white leading-tight break-all truncate">{selectedCustomer.name}</h4>
                  <span className="text-[9px] font-mono text-gray-500">ID #{selectedCustomer.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-3 break-all">
                <Mail size={12} className="flex-shrink-0 text-gray-500" />
                <span className="truncate">{selectedCustomer.email}</span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] mt-2">
                <ShieldAlert size={12} className="flex-shrink-0 text-gray-500" />
                <span className="text-gray-400 mr-1">Risk Status:</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                  selectedCustomer.risk_score === 'low' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : selectedCustomer.risk_score === 'medium'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {selectedCustomer.risk_score}
                </span>
              </div>
            </div>

            {/* Customer Orders */}
            <div className="flex flex-col gap-2">
              <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <ShoppingBag size={10} /> Purchase Orders ({selectedCustomer.orders.length})
              </div>
              
              {selectedCustomer.orders.length === 0 ? (
                <div className="text-[11px] text-gray-500 font-mono text-center p-3 border border-dashed border-white/5 rounded-xl">
                  No purchases.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedCustomer.orders.map(o => (
                    <div key={o.id} className="bg-white/3 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1 hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-gray-300">Order #{o.id}</span>
                        <span className="font-bold text-white">${o.total_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-gray-500">
                        <span>{new Date(o.purchase_date).toLocaleDateString()}</span>
                        <span className={`px-1 rounded-sm uppercase tracking-wider font-semibold border ${
                          o.status === 'delivered'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : o.status === 'processing'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Side: Chat Messages (Takes up full width if sidebar is collapsed!) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-950/20 transition-all duration-300">
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            <div className="flex flex-col gap-3 max-w-3xl mx-auto w-full">
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
          <div className="p-4 glass-panel border-t border-white/5 z-10 bg-black/40">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading || !selectedCustomerId}
                placeholder={selectedCustomerId ? "Tell the agent who you are or type your order ID (e.g. 'I am Bob Jones')..." : "Please simulate a customer profile above to enable chat..."}
                className="w-full bg-black/40 border border-white/10 text-white rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all placeholder:text-gray-500 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || !selectedCustomerId}
                className="absolute right-2 p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50 disabled:hover:bg-purple-600 cursor-pointer"
              >
                <Send size={18} className={input.trim() && !isLoading ? "ml-0.5" : ""} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
