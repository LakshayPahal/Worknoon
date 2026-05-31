"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
  Terminal, 
  Activity, 
  Server, 
  ShieldCheck, 
  Database, 
  Zap, 
  Play,
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Cpu
} from 'lucide-react';

interface Step {
  id: 'guardrail' | 'extraction' | 'tool' | 'policy' | 'response';
  name: string;
  description: string;
  status: 'idle' | 'running' | 'success' | 'error';
  icon: any;
}

export function AdminDashboard({ sessionId }: { sessionId: string }) {
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // LangGraph steps tracking
  const [steps, setSteps] = useState<Step[]>([
    { id: 'guardrail', name: 'Guardrail Engine', description: 'Checks safety & prompt injection', status: 'idle', icon: ShieldCheck },
    { id: 'extraction', name: 'Intent Extraction', description: 'Extracts Intent & Order ID', status: 'idle', icon: Zap },
    { id: 'tool', name: 'DB SQL Tool', description: 'Fetches secure order details', status: 'idle', icon: Database },
    { id: 'policy', name: 'Policy Evaluator', description: 'Validates strict refund rules', status: 'idle', icon: Server },
    { id: 'response', name: 'Response Generator', description: 'Drafts conversational reply', status: 'idle', icon: Cpu },
  ]);

  useEffect(() => {
    // Connect to Server-Sent Events
    const eventSource = new EventSource(`http://localhost:8000/api/logs/${sessionId}`);

    eventSource.onmessage = (event) => {
      const logLine = event.data;
      setLogs((prev) => [...prev, logLine]);

      // Parse log to update stepper status in real-time
      setSteps((prevSteps) => {
        const next = [...prevSteps];
        
        if (logLine.includes("Starting agent workflow")) {
          // Reset all
          return next.map(s => ({ ...s, status: 'idle' }));
        }

        // 1. Guardrail
        if (logLine.includes("GUARDRAIL")) {
          const idx = next.findIndex(s => s.id === 'guardrail');
          if (logLine.includes("Checking input")) {
            next[idx].status = 'running';
          } else if (logLine.includes("Input clean")) {
            next[idx].status = 'success';
          } else if (logLine.includes("Violation detected") || logLine.includes("failed")) {
            next[idx].status = 'error';
          }
        }

        // 2. Extraction
        if (logLine.includes("EXTRACTION")) {
          const gIdx = next.findIndex(s => s.id === 'guardrail');
          const eIdx = next.findIndex(s => s.id === 'extraction');
          if (next[gIdx].status === 'running') next[gIdx].status = 'success';
          
          if (logLine.includes("Extracting intent")) {
            next[eIdx].status = 'running';
          } else if (logLine.includes("identified") || logLine.includes("found") || logLine.includes("Defaulting")) {
            next[eIdx].status = 'success';
          } else if (logLine.includes("Failed")) {
            next[eIdx].status = 'error';
          }
        }

        // 3. Tool Call
        if (logLine.includes("TOOL CALL")) {
          const eIdx = next.findIndex(s => s.id === 'extraction');
          const tIdx = next.findIndex(s => s.id === 'tool');
          if (next[eIdx].status === 'running') next[eIdx].status = 'success';

          if (logLine.includes("Fetching details")) {
            next[tIdx].status = 'running';
          } else if (logLine.includes("Fetched Order")) {
            next[tIdx].status = 'success';
          } else if (logLine.includes("Error fetching")) {
            next[tIdx].status = 'error';
          }
        }

        // 4. Policy Engine
        if (logLine.includes("POLICY ENGINE")) {
          const tIdx = next.findIndex(s => s.id === 'tool');
          const pIdx = next.findIndex(s => s.id === 'policy');
          if (next[tIdx].status === 'running') next[tIdx].status = 'success';

          if (logLine.includes("Evaluating request")) {
            next[pIdx].status = 'running';
          } else if (logLine.includes("Conclusion -> Action: refund") || logLine.includes("Conclusion -> Action: escalate") || logLine.includes("Action: ask_order_id")) {
            next[pIdx].status = 'success';
          } else if (logLine.includes("Violation") || logLine.includes("denial") || logLine.includes("Conclusion -> Action: deny") || logLine.includes("Access denied")) {
            next[pIdx].status = 'error';
          }
        }

        // 5. Response Gen
        if (logLine.includes("RESPONSE GEN")) {
          const pIdx = next.findIndex(s => s.id === 'policy');
          const rIdx = next.findIndex(s => s.id === 'response');
          if (next[pIdx].status === 'running') next[pIdx].status = 'success';

          if (logLine.includes("Drafting response")) {
            next[rIdx].status = 'running';
          } else if (logLine.includes("Response drafted successfully")) {
            next[rIdx].status = 'success';
          }
        }

        // Error fallback
        if (logLine.includes("SYSTEM ERROR")) {
          const runningIdx = next.findIndex(s => s.status === 'running');
          if (runningIdx !== -1) {
            next[runningIdx].status = 'error';
          }
        }

        return next;
      });
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
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
      colorClass = "text-amber-400 font-medium";
      Icon = ShieldCheck;
    } else if (log.includes("EXTRACTION")) {
      colorClass = "text-blue-400 font-medium";
      Icon = Zap;
    } else if (log.includes("TOOL CALL")) {
      colorClass = "text-emerald-400 font-medium";
      Icon = Database;
    } else if (log.includes("POLICY ENGINE")) {
      colorClass = "text-purple-400 font-medium";
      Icon = Server;
    } else if (log.includes("RESPONSE GEN")) {
      colorClass = "text-pink-400 font-medium";
      Icon = Cpu;
    } else if (log.includes("SYSTEM ERROR") || log.includes("Violation") || log.includes("Access denied")) {
      colorClass = "text-rose-500 font-semibold";
      Icon = AlertCircle;
    } else if (log.includes("SYSTEM")) {
      colorClass = "text-white font-semibold";
      Icon = Play;
    }

    return (
      <div key={idx} className="flex gap-3 mb-2 font-mono text-[12px] leading-tight group hover:bg-white/5 p-1 -mx-1 rounded transition-colors">
        <div className="flex-shrink-0 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
          <Icon size={13} className={colorClass} />
        </div>
        <div className="break-words flex-1">
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
          <Terminal size={18} className="text-blue-400 animate-pulse" />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-gray-200 uppercase">Agent Observability Dashboard</h2>
          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono mt-0.5">
            <span>SESSION: {sessionId.substring(0,8)}</span>
            <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
            <span className="flex items-center gap-1 text-green-400"><Activity size={10} /> Live Stream</span>
          </div>
        </div>
      </div>

      {/* Main split display: Stepper (left/top) + Console (right/bottom) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden z-10">
        {/* Stepper Panel */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/35 p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Cpu size={12} className="text-purple-400" /> LangGraph Active State Machine
          </div>
          
          <div className="flex flex-col gap-5 mt-2 relative">
            {/* Visual connector line */}
            <div className="absolute left-[17px] top-[14px] bottom-[14px] w-0.5 bg-white/10 z-0"></div>

            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              let badgeColor = "bg-white/5 border-white/10 text-gray-500";
              let connectorActive = false;

              if (step.status === 'running') {
                badgeColor = "bg-purple-500/20 border-purple-500 text-purple-400 ring-4 ring-purple-500/10";
              } else if (step.status === 'success') {
                badgeColor = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
              } else if (step.status === 'error') {
                badgeColor = "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse";
              }

              return (
                <div key={step.id} className="flex gap-4 items-start relative z-10 group">
                  {/* Status Indicator Bubble */}
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300 flex-shrink-0 bg-black ${badgeColor}`}>
                    {step.status === 'success' ? (
                      <CheckCircle2 size={16} />
                    ) : step.status === 'error' ? (
                      <AlertCircle size={16} />
                    ) : step.status === 'running' ? (
                      <Activity size={16} className="animate-pulse" />
                    ) : (
                      <StepIcon size={16} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs font-bold transition-colors ${
                        step.status === 'running' ? 'text-purple-400' : step.status === 'success' ? 'text-emerald-400' : step.status === 'error' ? 'text-rose-500' : 'text-gray-300'
                      }`}>
                        {step.name}
                      </h4>
                      {step.status === 'running' && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping"></span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto border-t border-white/5 pt-4 bg-purple-950/10 p-3 rounded-xl border border-purple-500/10">
            <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Workflow Audit</h5>
            <p className="text-[10px] text-gray-400 mt-1 leading-normal font-sans">
              LangGraph provides explicit, transparent routing, visual logging, and guards against non-deterministic loop failures.
            </p>
          </div>
        </div>

        {/* Live Terminal Panel */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Terminal size={12} className="text-blue-400" /> Live Stream Agent Reasoning Console
          </div>
          
          <div className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 shadow-2xl overflow-y-auto flex flex-col font-mono">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3 py-12">
                <Activity className="w-8 h-8 opacity-20 animate-pulse text-purple-500" />
                <p className="text-[10px] font-mono uppercase tracking-widest">Waiting for customer chat activity...</p>
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
    </div>
  );
}
