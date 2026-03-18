import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { Inbox, LayoutDashboard, LayoutGrid, Zap, ChevronLeft, ChevronRight, X, Settings, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { label: "Kanban Board", icon: LayoutDashboard, page: "KanbanBoard" },
  { label: "Cards View",   icon: LayoutGrid,      page: "CardsView" },
  { label: "Slack Inbox",  icon: Inbox,           page: "SlackInbox" },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, isMobile, onMobileClose }) {
  const location = useLocation();

  // On mobile: slide in/out as overlay. On desktop: fixed, width changes.
  const sidebarVisible = isMobile ? mobileOpen : true;

  return (
    <>
      {/* Mobile hamburger button (always visible on mobile when sidebar is closed) */}
      {isMobile && !mobileOpen && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-50 w-9 h-9 rounded-xl bg-slate-800 border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
        >
          <div className="flex flex-col gap-1">
            <span className="w-4 h-0.5 bg-current rounded" />
            <span className="w-4 h-0.5 bg-current rounded" />
            <span className="w-3 h-0.5 bg-current rounded" />
          </div>
        </button>
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 flex flex-col w-[240px]",
          "bg-slate-950 border-r border-white/[0.06]",
          "transition-all duration-300 ease-out",
          // Desktop: shrink to icon-only
          !isMobile && collapsed && "w-[68px]",
          // Mobile: slide off-screen when closed
          isMobile && !mobileOpen && "-translate-x-full",
          isMobile && mobileOpen && "translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.04]">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="overflow-hidden flex-1">
              <h1 className="text-base font-bold text-white tracking-tight">SquadFlow</h1>
              <p className="text-[10px] text-white/30 -mt-0.5">Slack → Tasks</p>
            </div>
          )}
          {/* Close button on mobile */}
          {isMobile && (
            <button onClick={onMobileClose} className="ml-auto text-white/30 hover:text-white/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname.includes(item.page) ||
              (item.page === "KanbanBoard" && location.pathname === "/");
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={isMobile ? onMobileClose : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  "text-sm font-medium",
                  isActive
                    ? "bg-violet-500/10 text-violet-400 shadow-inner"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                )}
              >
                <item.icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive && "drop-shadow-lg")} />
                {(!collapsed || isMobile) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section: settings + collapse */}
        <div className="border-t border-white/[0.04]">
          <div className="px-3 py-2">
            <Link
              to="/Profile"
              onClick={isMobile ? onMobileClose : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
                location.pathname.includes("Profile")
                  ? "bg-violet-500/10 text-violet-400"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              )}
            >
              <Settings className="w-[18px] h-[18px] flex-shrink-0" />
              {(!collapsed || isMobile) && <span>Settings</span>}
            </Link>
          </div>
          {!isMobile && (
            <button
              onClick={onToggle}
              className="flex items-center justify-center w-full h-10 border-t border-white/[0.04] text-white/20 hover:text-white/50 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}