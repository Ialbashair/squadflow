import React from "react";
import { Badge } from "@/components/ui/badge";
import { Bug, Lightbulb, CheckSquare, Sparkles, AlertTriangle, Clock, ArrowUp, ArrowDown, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig = {
  task:    { icon: CheckSquare, label: "Task",    className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  bug:     { icon: Bug,         label: "Bug",     className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  idea:    { icon: Lightbulb,   label: "Idea",    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  feature: { icon: Sparkles,    label: "Feature", className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
};

const priorityConfig = {
  urgent: { icon: AlertTriangle, label: "Urgent", color: "text-red-400",    dot: "bg-red-400" },
  high:   { icon: ArrowUp,       label: "High",   color: "text-orange-400", dot: "bg-orange-400" },
  medium: { icon: Clock,         label: "Med",    color: "text-yellow-400", dot: "bg-yellow-400" },
  low:    { icon: ArrowDown,     label: "Low",    color: "text-slate-400",  dot: "bg-slate-400" },
};

export default function KanbanCard({ task, provided, isDragging, onClick }) {
  const type = typeConfig[task.type] || typeConfig.task;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const TypeIcon = type.icon;
  const PriorityIcon = priority.icon;

  const initials = task.slack_author
    ? task.slack_author.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const avatar = task.slack_avatar ? (
    <img src={task.slack_avatar} alt="" className="w-5 h-5 rounded-full ring-1 ring-white/10 flex-shrink-0" />
  ) : (
    <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-violet-300">
      {initials}
    </div>
  );

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        "relative rounded-xl border border-white/[0.06] mb-2",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm",
        "hover:border-white/[0.12] transition-all duration-200 cursor-grab active:cursor-grabbing",
        isDragging && "shadow-2xl shadow-violet-500/10 border-violet-500/30 scale-[1.02] rotate-1"
      )}
    >
      {/* Priority bar */}
      <div className={cn("absolute top-0 left-4 right-4 h-[2px] rounded-full opacity-60", priority.dot)} />

      {/* ── MOBILE: condensed layout ── */}
      <div className="md:hidden px-3 py-2.5">
        <p className="text-sm font-medium text-white/90 leading-snug line-clamp-2 mb-2">
          {task.title}
        </p>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={cn("text-[10px] font-semibold tracking-wider uppercase border px-1.5 py-0 h-5", type.className)}>
            <TypeIcon className="w-3 h-3 mr-1 flex-shrink-0" />
            {type.label}
          </Badge>
          <div className="flex items-center gap-1.5 min-w-0">
            {avatar}
            {task.slack_author && (
              <span className="text-[10px] text-white/30 truncate">{task.slack_author}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── DESKTOP: full layout ── */}
      <div className="hidden md:block p-4">
        {/* Header: Type badge + Priority */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className={cn("text-[10px] font-semibold tracking-wider uppercase border px-2 py-0.5", type.className)}>
            <TypeIcon className="w-3 h-3 mr-1" />
            {type.label}
          </Badge>
          <div className={cn("flex items-center gap-1 text-[10px] font-medium", priority.color)}>
            <PriorityIcon className="w-3 h-3" />
            {priority.label}
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-white/90 leading-snug mb-2 line-clamp-2">
          {task.title}
        </h4>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {/* Footer: Channel + Author */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          {task.slack_channel && (
            <div className="flex items-center gap-1 text-[10px] text-white/30">
              <Hash className="w-3 h-3" />
              {task.slack_channel}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {avatar}
            {task.slack_author && (
              <span className="text-[10px] text-white/30">{task.slack_author}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}