import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertTriangle, ShieldCheck, ArrowRight, Plus, Pencil, Trash2, MoveRight } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_LABELS = {
  backlog: "Backlog",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  task: "Task", bug: "Bug", idea: "Idea", feature: "Feature",
};

const ACTION_CONFIG = {
  moved:   { icon: MoveRight, color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",    label: "Moved" },
  created: { icon: Plus,      color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Created" },
  updated: { icon: Pencil,    color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",   label: "Updated" },
  deleted: { icon: Trash2,    color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",       label: "Deleted" },
};

const ROLE_CONFIG = {
  admin:     { label: "Admin",       color: "text-violet-300", bg: "bg-violet-500/20 border-violet-500/30" },
  team_lead: { label: "Team Lead",   color: "text-amber-300",  bg: "bg-amber-500/20 border-amber-500/30" },
  user:      { label: "Team Member", color: "text-slate-300",  bg: "bg-slate-500/20 border-slate-500/30" },
};

function StatusChip({ value }) {
  const label = STATUS_LABELS[value] || value;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-xs font-medium text-white/70">
      {label}
    </span>
  );
}

function LogEntry({ log }) {
  const action = ACTION_CONFIG[log.action_type] || ACTION_CONFIG.updated;
  const role = ROLE_CONFIG[log.user_role] || ROLE_CONFIG.user;
  const ActionIcon = action.icon;
  // Parse the UTC date from created_date and display in local timezone
  const date = log.created_date ? new Date(log.created_date) : null;

  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.08] transition-all">
      {/* Action icon */}
      <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5", action.bg)}>
        <ActionIcon className={cn("w-4 h-4", action.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {/* User */}
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 flex items-center justify-center text-[10px] font-bold text-white/80 flex-shrink-0">
            {(log.user_name || "?")[0].toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-white/90">{log.user_name}</span>
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", role.bg, role.color)}>
            {role.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-white/50 mb-2">{log.description}</p>

        {/* From → To pill */}
        {log.from_value && log.to_value && (
          <div className="flex items-center gap-2 flex-wrap">
            <StatusChip value={log.from_value} />
            <ArrowRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
            <StatusChip value={log.to_value} />
          </div>
        )}
      </div>

      {/* Time */}
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-white/25">
          {date ? formatDistanceToNow(date, { addSuffix: true }) : ""}
        </p>
        {date && (
          <p className="text-[10px] text-white/15 mt-0.5">
            {format(date, "MMM d, h:mm a zzz")}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (u?.role !== "admin" && u?.role !== "team_lead") {
        setNotAuthorized(true);
      }
      setLoadingUser(false);
    }).catch(() => setLoadingUser(false));
  }, []);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 200),
    enabled: !notAuthorized && !loadingUser,
  });

  if (loadingUser || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (notAuthorized) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-sm text-white/40">You need Team Lead or Admin privileges to view the Audit Log.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Audit Log</h2>
          <p className="text-sm text-white/30 mt-0.5">{logs.length} recorded actions</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 text-white/20 text-sm">
          No actions recorded yet. Actions will appear here as team members interact with the board.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => <LogEntry key={log.id} log={log} />)}
        </div>
      )}
    </div>
  );
}