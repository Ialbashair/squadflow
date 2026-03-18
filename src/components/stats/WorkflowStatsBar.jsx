import React from "react";
import { Inbox, PlayCircle, Eye, CheckCircle2 } from "lucide-react";

export default function WorkflowStatsBar({ tasks }) {
  const stats = [
    { label: "Backlog",     value: tasks.filter(t => (t.status || "backlog") === "backlog").length,      icon: Inbox,        color: "text-slate-400",   bg: "bg-slate-500/10" },
    { label: "In Progress", value: tasks.filter(t => t.status === "in_progress").length,                 icon: PlayCircle,   color: "text-blue-400",    bg: "bg-blue-500/10" },
    { label: "In Review",   value: tasks.filter(t => t.status === "in_review").length,                   icon: Eye,          color: "text-amber-400",   bg: "bg-amber-500/10" },
    { label: "Done",        value: tasks.filter(t => t.status === "done").length,                        icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
        >
          <div className={`p-2 rounded-lg ${stat.bg}`}>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <div>
            <p className="text-lg font-bold text-white/90 leading-none">{stat.value}</p>
            <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-wider">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}