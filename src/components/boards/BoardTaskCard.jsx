import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowUp, Minus, ChevronDown } from "lucide-react";

const priorityConfig = {
  urgent: { label: "Urgent", color: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
  high:   { label: "High",   color: "text-orange-400 bg-orange-500/10 border-orange-500/20", dot: "bg-orange-400" },
  medium: { label: "Medium", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
  low:    { label: "Low",    color: "text-slate-400 bg-slate-500/10 border-slate-500/20", dot: "bg-slate-400" },
};

const typeConfig = {
  bug:     { label: "Bug",     color: "text-red-400" },
  feature: { label: "Feature", color: "text-violet-400" },
  idea:    { label: "Idea",    color: "text-emerald-400" },
  task:    { label: "Task",    color: "text-slate-400" },
};

export default function BoardTaskCard({ task, onClick, isDragging }) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const type = typeConfig[task.type] || typeConfig.task;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl bg-slate-900 border cursor-pointer transition-all duration-150 select-none",
        isDragging
          ? "border-violet-500/50 shadow-xl shadow-violet-500/20 scale-[1.02] rotate-1"
          : "border-white/[0.06] hover:border-white/[0.12] hover:bg-slate-800/80"
      )}
    >
      <p className="text-sm text-white/90 leading-snug mb-2 line-clamp-2">{task.title}</p>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Priority badge */}
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md border flex items-center gap-1", priority.color)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
          {priority.label}
        </span>

        {/* Type badge */}
        <span className={cn("text-[10px] font-medium", type.color)}>{type.label}</span>

        {/* Due date */}
        {task.due_date && (
          <span className="text-[10px] text-white/30 ml-auto">{task.due_date}</span>
        )}
      </div>

      {/* Assignee / Slack author */}
      {(task.slack_avatar || task.assigned_to_name || task.slack_author) && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.05]">
          {task.slack_avatar ? (
            <img src={task.slack_avatar} alt="" className="w-5 h-5 rounded-full" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center text-[10px] text-violet-300 font-bold">
              {(task.assigned_to_name || task.slack_author || "?")[0].toUpperCase()}
            </div>
          )}
          <span className="text-[10px] text-white/30 truncate">
            {task.assigned_to_name || task.slack_author}
          </span>
        </div>
      )}
    </div>
  );
}