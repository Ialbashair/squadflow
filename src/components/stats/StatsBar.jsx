import React from "react";
import { CheckSquare, Bug, Lightbulb, TrendingUp } from "lucide-react";

export default function StatsBar({ tasks }) {
  const stats = [
    { label: "Total", value: tasks.length, icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Tasks", value: tasks.filter(t => t.type === "task").length, icon: CheckSquare, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Bugs", value: tasks.filter(t => t.type === "bug").length, icon: Bug, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Ideas", value: tasks.filter(t => t.type === "idea").length, icon: Lightbulb, color: "text-emerald-400", bg: "bg-emerald-500/10" },
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