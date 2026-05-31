"use client";

import { useState, useEffect } from "react";
import { ChatPane } from "@/components/ChatPane";
import { AdminDashboard } from "@/components/AdminDashboard";

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Generate a random session ID on mount
    setSessionId(Math.random().toString(36).substring(2, 10));
  }, []);

  if (!sessionId) return null; // Wait until mounted

  return (
    <main className="flex h-screen w-full bg-black overflow-hidden">
      {/* Left Pane: Customer Chat */}
      <div className="w-1/2 h-full border-r border-white/10 shadow-2xl z-10 relative">
        <ChatPane sessionId={sessionId} />
      </div>

      {/* Right Pane: Admin Observability */}
      <div className="w-1/2 h-full relative z-0">
        <AdminDashboard sessionId={sessionId} />
      </div>
    </main>
  );
}
