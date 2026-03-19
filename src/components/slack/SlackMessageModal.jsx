import React from "react";
import { cn } from "@/lib/utils";
import { X, Hash, ExternalLink, Bug, Lightbulb, CheckSquare, Sparkles, AlertTriangle, ArrowUp, ArrowDown, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const typeConfig = {
  task:    { icon: CheckSquare, label: "Task",    className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  bug:     { icon: Bug,         label: "Bug",     className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  idea:    { icon: Lightbulb,   label: "Idea",    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  feature: { icon: Sparkles,    label: "Feature", className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
};

const priorityConfig = {
  urgent: { icon: AlertTriangle, label: "Urgent", color: "text-red-400" },
  high:   { icon: ArrowUp,       label: "High",   color: "text-orange-400" },
  medium: { icon: Clock,         label: "Medium", color: "text-yellow-400" },
  low:    { icon: ArrowDown,     label: "Low",    color: "text-slate-400" },
};

const statusLabels = {
  backlog:     "Backlog",
  in_progress: "In Progress",
  in_review:   "In Review",
  done:        "Done",
};

export default function SlackMessageModal({ task, onClose }) {
  if (!task) return null;

  const type = typeConfig[task.type] || typeConfig.task;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const TypeIcon = type.icon;
  const PriorityIcon = priority.icon;

  const initials = task.slack_author
    ? task.slack_author.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const createdDate = task.created_date ? new Date(task.created_date) : null;

  // Build Slack deep link if we have channel ID and message ts
  const slackLink = task.slack_channel_id && task.slack_message_ts
    ? `slack://channel?team=&id=${task.slack_channel_id}&message=${task.slack_message_ts}`
    : null;

  const slackWebLink = task.slack_channel_id && task.slack_message_ts
    ? `https://slack.com/app_redirect?channel=${task.slack_channel_id}&message_ts=${task.slack_message_ts}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg bg-slate-900 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px] font-semibold tracking-wider uppercase border px-2 py-0.5", type.className)}>
              <TypeIcon className="w-3 h-3 mr-1" />{type.label}
            </Badge>
            <div className={cn("flex items-center gap-1 text-[11px] font-medium", priority.color)}>
              <PriorityIcon className="w-3 h-3" />{priority.label}
            </div>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/[0.04]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

          {/* Card Name */}
          <div>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-1">Card Name</p>
            <p className="text-base font-semibold text-white/90 leading-snug">{task.title}</p>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-3">
            {task.slack_channel && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <Hash className="w-3 h-3 text-violet-400" />
                <span className="text-xs text-white/60">{task.slack_channel}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Status</span>
              <span className="text-xs text-white/60">{statusLabels[task.status] || task.status}</span>
            </div>
            {createdDate && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <Clock className="w-3 h-3 text-white/25" />
                <span className="text-xs text-white/40">{format(createdDate, "MMM d, h:mm a")}</span>
              </div>
            )}
          </div>

          {/* Author */}
          <div>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Posted By</p>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              {task.slack_avatar ? (
                <img src={task.slack_avatar} alt="" className="w-10 h-10 rounded-full ring-1 ring-white/10 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-violet-300">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white/80">{task.slack_author || "Unknown"}</p>
                <p className="text-[11px] text-white/30 mt-0.5">via Slack{task.slack_channel ? ` · #${task.slack_channel}` : ""}</p>
              </div>
            </div>
          </div>

          {/* Original Message */}
          <div>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Original Message</p>
            <div className="bg-slate-800/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white/65 leading-relaxed">
              {task.description || <span className="text-white/20 italic">No message content available.</span>}
            </div>
          </div>

          {/* Slack Link */}
          {slackWebLink ? (
            <a
              href={slackWebLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 text-sm font-medium hover:bg-violet-500/20 transition-all w-full justify-center"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Slack
            </a>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/20 text-xs w-full justify-center">
              <ExternalLink className="w-3.5 h-3.5" />
              Direct Slack link not available for this message
            </div>
          )}
        </div>
      </div>
    </div>
  );
}