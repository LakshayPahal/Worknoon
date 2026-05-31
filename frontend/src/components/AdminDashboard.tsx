"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Activity, Server, ShieldCheck, Database, Zap } from 'lucide-react';

export function AdminDashboard({ sessionId }: { sessionId: string }) {
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to Server-Sent Events
    const eventSource = new EventSource(`http://localhost:8000/api/logs/${sessionId}`);

    eventSource.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      // eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Helper to colorize log prefixes
  const renderLog = (log: string, idx: number) => {
    let colorClass = "text-gray-400";
    let Icon = Activity;
    
    if (log.includes("GUARDRAIL")) {
      colorClass = "text-amber-400";
      Icon = ShieldCheck;
    } else if (log.includes("EXTRACTION")) {
      colorClass = "text-blue-400";
      Icon = Zap;
    } else if (log.includes("TOOL CALL")) {
      colorClass = "text-emerald-400";
      Icon = Database;
    } else if (log.includes("POLICY ENGINE")) {
      colorClass = "text-purple-400";
      Icon = Server;
    } else if (log.includes("RESPONSE GEN")) {
      colorClass = "text-pink-400";
    } else if (log.includes("SYSTEM ERROR") || log.includes("Violation")) {
      colorClass = "text-red-500";
    } else if (log.includes("SYSTEM")) {
      colorClass = "text-white font-semibold";
    }

    return (
      <div key={idx} className="flex gap-3 mb-2 font-mono text-[13px] leading-tight group hover:bg-white/5 p-1 -mx-1 rounded transition-colors">
        <div className="flex-shrink-0 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
          <Icon size={14} className={colorClass} />
        </div>
        <div className="break-words">
          {/* Split timestamp if exists */}
          {log.match(/^\[(.*?)\]/) ? (
            <>
              <span className="text-gray-500 mr-2">
                {log.match(/^\[(.*?)\]/)?.[0]}
              </span>
              <span className={colorClass}>
                {log.replace(/^\[.*?\]\s*/, '')}
              </span>
            </>
          ) : (
            <span className={colorClass}>{log}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md z-10">
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
          <Terminal size={18} className="text-blue-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-gray-200 uppercase">Admin Observability</h2>
          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono mt-0.5">
            <span>SESSION: {sessionId.substring(0,8)}</span>
            <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
            <span className="flex items-center gap-1 text-green-400"><Activity size={10} /> Live Stream</span>
          </div>
        </div>
      </div>

      {/* Terminal Area */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth z-10">
        <div className="bg-black/50 border border-white/10 rounded-xl p-4 shadow-2xl h-full min-h-[400px]">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
              <Activity className="w-8 h-8 opacity-20" />
              <p className="text-xs font-mono uppercase tracking-widest">Waiting for agent activity...</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {logs.map((log, i) => renderLog(log, i))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
