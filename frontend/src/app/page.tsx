"use client";

import { useState, useEffect } from "react";
import { ChatPane } from "@/components/ChatPane";
import { AdminDashboard } from "@/components/AdminDashboard";
import { CrmManager } from "@/components/CrmManager";
import { MessageSquare, Database, Sparkles, Server } from "lucide-react";

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"support" | "crm">("support");

  useEffect(() => {
    // Generate a random session ID on mount
    setSessionId(Math.random().toString(36).substring(2, 10));
  }, []);

  if (!sessionId) return null; // Wait until mounted

  return (
    <div className="flex flex-col h-screen w-full bg-[#030712] text-gray-100 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-gray-950/80 backdrop-blur-md border-b border-white/10 z-20">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-md shadow-purple-900/30">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Worknoon Support Engine
              </span>
              <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-mono -mt-0.5">LangGraph State Machine Observability</p>
          </div>
        </div>

        {/* Tab Switchers */}
        <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("support")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "support"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MessageSquare size={14} />
            Support AI Desk
          </button>
          <button
            onClick={() => setActiveTab("crm")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "crm"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Database size={14} />
            CRM Database Hub
          </button>
        </div>

        {/* System Health Badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 font-mono bg-white/3 px-3 py-1.5 rounded-lg border border-white/5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          <span>FastAPI: Online</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full relative overflow-hidden">
        {/* Support Desk: Split-Screen Chat & Observability */}
        <div 
          className={`absolute inset-0 flex transition-opacity duration-300 ${
            activeTab === "support" ? "opacity-100 z-10" : "opacity-0 -z-10 pointer-events-none"
          }`}
        >
          {/* Left Pane: Customer Chat */}
          <div className="w-1/2 h-full border-r border-white/10 relative z-10 flex flex-col">
            <ChatPane sessionId={sessionId} />
          </div>

          {/* Right Pane: Admin Observability */}
          <div className="w-1/2 h-full relative z-0 flex flex-col bg-black">
            <AdminDashboard sessionId={sessionId} />
          </div>
        </div>

        {/* CRM Database Hub */}
        <div 
          className={`absolute inset-0 transition-opacity duration-300 ${
            activeTab === "crm" ? "opacity-100 z-10" : "opacity-0 -z-10 pointer-events-none"
          }`}
        >
          <CrmManager />
        </div>
      </div>
    </div>
  );
}
