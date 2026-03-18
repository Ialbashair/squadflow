import React from "react";
import { Badge } from "@/components/ui/badge";
import { Bug, Lightbulb, CheckSquare, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig = {
  task:    { icon: CheckSquare, label: "Task",    className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  bug:     { icon: Bug,         label: "Bug",     className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  idea:    { icon: Lightbulb,   label: "Idea",    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  feature: { icon: Sparkles,    label: "Feature", className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
};

export default function KanbanCard({ task, provided, isDragging }) {
  const type = typeConfig[task.type] || typeConfig.task;
  const TypeIcon = type.icon;

  // Generate initials for avatar fallback
  const initials = task.slack_author
    ? task.slack_author.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        "relative rounded-xl border border-white/[0.06] px-3 py-2.5 mb-2",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm",
        "hover:border-white/[0.12] transition-all duration-200 cursor-grab active:cursor-grabbing",
        isDragging && "shadow-2xl shadow-violet-500/10 border-violet-500/30 scale-[1.02] rotate-1"
      )}
    >
      {/* Title */}
      <p className="text-sm font-medium text-white/90 leading-snug line-clamp-2 mb-2.5 pr-1">
        {task.title}
      </p>

      {/* Footer: type badge + author */}
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className={cn("text-[10px] font-semibold tracking-wider uppercase border px-1.5 py-0 h-5", type.className)}
        >
          <TypeIcon className="w-3 h-3 mr-1 flex-shrink-0" />
          {type.label}
        </Badge>

        <div className="flex items-center gap-1.5 min-w-0">
          {task.slack_avatar ? (
            <img src={task.slack_avatar} alt="" className="w-5 h-5 rounded-full ring-1 ring-white/10 flex-shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-violet-300">
              {initials}
            </div>
          )}
          {task.slack_author && (
            <span className="text-[10px] text-white/30 truncate">{task.slack_author}</span>
          )}
        </div>
      </div>
    </div>
  );
}