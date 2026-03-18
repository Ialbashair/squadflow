import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X, Hash, Bug, Lightbulb, CheckSquare, Sparkles,
  AlertTriangle, Clock, ArrowUp, ArrowDown,
  Inbox, PlayCircle, Eye, CheckCircle2, Save, MessageSquare
} from "lucide-react";

const typeConfig = {
  task:    { icon: CheckSquare, label: "Task",    className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  bug:     { icon: Bug,         label: "Bug",     className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  idea:    { icon: Lightbulb,   label: "Idea",    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  feature: { icon: Sparkles,    label: "Feature", className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
};

const priorityConfig = {
  urgent: { icon: AlertTriangle, label: "Urgent", color: "text-red-400",    dot: "bg-red-500" },
  high:   { icon: ArrowUp,       label: "High",   color: "text-orange-400", dot: "bg-orange-500" },
  medium: { icon: Clock,         label: "Med",    color: "text-yellow-400", dot: "bg-yellow-500" },
  low:    { icon: ArrowDown,     label: "Low",    color: "text-slate-400",  dot: "bg-slate-500" },
};

const statusConfig = [
  { id: "backlog",     label: "Backlog",     icon: Inbox,        accent: "border-slate-500/40 text-slate-400",  active: "bg-slate-500/20 border-slate-500 text-slate-300" },
  { id: "in_progress", label: "In Progress", icon: PlayCircle,   accent: "border-blue-500/40 text-blue-400",    active: "bg-blue-500/20 border-blue-500 text-blue-300" },
  { id: "in_review",   label: "In Review",   icon: Eye,          accent: "border-amber-500/40 text-amber-400",  active: "bg-amber-500/20 border-amber-500 text-amber-300" },
  { id: "done",        label: "Done",        icon: CheckCircle2, accent: "border-emerald-500/40 text-emerald-400", active: "bg-emerald-500/20 border-emerald-500 text-emerald-300" },
];

// Mock Slack messages keyed by channel (fallback pool)
const mockMessages = {
  general: "Hey team, just wanted to flag this for tracking — can someone pick this up? It's been sitting for a bit and we need to move on it before the sprint ends.",
  engineering: "Ran into this while testing the new flow. Reproduced it 3 times in a row. Logs attached in thread. We should get a fix in before the next release or it'll block QA.",
  design: "Quick thought from the design sync — we talked about this direction and I think it's worth exploring. Dropped some references in the thread below. LMK what you think!",
  product: "Adding this to the backlog from our roadmap review. Customer impact is moderate but it keeps coming up in feedback. Priority TBD once we scope it properly.",
  ops: "This keeps popping up in monitoring. Not critical yet but worth keeping an eye on — added it here so we don't lose track of it.",
  frontend: "Found this when I was working on the new component. Looks like it only happens in Safari — Chrome seems fine. Might be a CSS issue or a timing thing.",
  backend: "The endpoint is returning inconsistent results under load. Tested with wrk and saw it drop around ~200 RPS. Could be a DB connection pool issue — need to dig in.",
  default: "Flagged this in standup. Didn't want it to get lost in the noise — adding it here so we can track it properly and assign an owner.",
};

function getMockMessage(task) {
  if (task.description && task.description.length > 60) return task.description;
  const channel = (task.slack_channel || "").toLowerCase();
  return mockMessages[channel] || mockMessages.default;
}

export default function TaskDetailModal({ task, onClose, onSaved, isAdmin = true }) {
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status || "backlog");
  const [dirty, setDirty] = useState(false);

  const queryClient = useQueryClient();
  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.update(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onSaved?.();
      onClose();
    },
  });

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleChange = (setter) => (e) => { setter(e.target.value); setDirty(true); };
  const handleStatusChange = (s) => { setStatus(s); setDirty(true); };

  const handleSave = () => {
    saveMutation.mutate({ title, description, status });
  };

  const type = typeConfig[task.type] || typeConfig.task;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const TypeIcon = type.icon;
  const PriorityIcon = priority.icon;

  const initials = task.slack_author
    ? task.slack_author.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const slackMessage = getMockMessage(task);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5">
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

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-1.5 block">Title</label>
            <textarea
              value={title}
              onChange={handleChange(setTitle)}
              rows={2}
              disabled={!isAdmin}
              className={cn("w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 outline-none resize-none transition-colors", isAdmin && "focus:border-violet-500/50 focus:bg-violet-500/[0.03]", !isAdmin && "cursor-default opacity-70")}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={handleChange(setDescription)}
              rows={3}
              placeholder="Add a description…"
              disabled={!isAdmin}
              className={cn("w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/50 placeholder:text-white/20 outline-none resize-none transition-colors", isAdmin && "focus:border-violet-500/50 focus:bg-violet-500/[0.03]", !isAdmin && "cursor-default opacity-70")}
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-2 block">Status</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statusConfig.map(s => {
                const SIcon = s.icon;
                const isActive = status === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => isAdmin && handleStatusChange(s.id)}
                    disabled={!isAdmin}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all",
                      isActive ? s.active : cn("border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/[0.12]")
                    )}
                  >
                    <SIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Original Slack message */}
          <div>
            <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> Original Slack Message
            </label>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              {/* Slack author row */}
              <div className="flex items-center gap-2.5 mb-3">
                {task.slack_avatar ? (
                  <img src={task.slack_avatar} alt="" className="w-8 h-8 rounded-full ring-1 ring-white/10 flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-violet-300">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white/80">{task.slack_author || "Unknown"}</p>
                  <div className="flex items-center gap-1 text-[10px] text-white/25 mt-0.5">
                    {task.slack_channel && (
                      <>
                        <Hash className="w-3 h-3" />
                        <span>{task.slack_channel}</span>
                        <span className="mx-1">·</span>
                      </>
                    )}
                    <span>via Slack</span>
                  </div>
                </div>
              </div>
              {/* Message bubble */}
              <div className="bg-slate-800/60 rounded-xl px-4 py-3 text-sm text-white/60 leading-relaxed border border-white/[0.04]">
                {slackMessage}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] flex-shrink-0 bg-slate-900/80">
          <div className="flex items-center gap-2 text-[11px] text-white/20">
            {task.slack_channel && (
              <><Hash className="w-3 h-3" /><span>{task.slack_channel}</span></>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all">
              {isAdmin ? "Cancel" : "Close"}
            </button>
            {isAdmin && (
              <Button
                onClick={handleSave}
                disabled={!dirty || saveMutation.isPending}
                className={cn(
                  "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500",
                  "text-white text-sm font-medium rounded-xl px-5 h-9 border-0",
                  "shadow-lg shadow-violet-500/20 disabled:opacity-40 transition-all"
                )}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {saveMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}