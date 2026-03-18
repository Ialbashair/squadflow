import React, { useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import { cn } from "@/lib/utils";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <style>{`
        :root {
          --sidebar-width: ${collapsed ? '68px' : '240px'};
        }
        body {
          background: #020617;
        }
        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
      `}</style>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[800px] h-[800px] rounded-full bg-violet-600/[0.03] blur-[120px]" />
        <div className="absolute -bottom-[30%] -left-[10%] w-[600px] h-[600px] rounded-full bg-fuchsia-600/[0.02] blur-[100px]" />
      </div>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <main
        className={cn(
          "relative transition-all duration-300 ease-out min-h-screen",
          collapsed ? "ml-[68px]" : "ml-[240px]"
        )}
      >
        <div className="max-w-[1200px] mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}