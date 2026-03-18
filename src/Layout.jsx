import React, { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import { cn } from "@/lib/utils";

const MOBILE_BREAKPOINT = 768;

export default function Layout({ children }) {
  const isMobileNow = () => window.innerWidth < MOBILE_BREAKPOINT;

  const [collapsed, setCollapsed] = useState(() => isMobileNow());
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-collapse when viewport shrinks to mobile
  useEffect(() => {
    const handleResize = () => {
      if (isMobileNow()) {
        setCollapsed(true);
        setMobileOpen(false);
      } else {
        setCollapsed(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = isMobileNow();

  const handleToggle = () => {
    if (isMobile) {
      setMobileOpen(prev => !prev);
    } else {
      setCollapsed(prev => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <style>{`
        body { background: #020617; }
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

      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={isMobile ? false : collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        isMobile={isMobile}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main
        className={cn(
          "relative transition-all duration-300 ease-out min-h-screen",
          // On mobile: no margin (sidebar is overlay). On desktop: shift by sidebar width.
          isMobile ? "ml-0" : (collapsed ? "ml-[68px]" : "ml-[240px]")
        )}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}