import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Bug, Lightbulb, CheckSquare, Sparkles, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig = {
  task:    { icon: CheckSquare, className: "bg-blue-500/10 text-blue-400" },
  bug:     { icon: Bug,         className: "bg-amber-500/10 text-amber-400" },
  idea:    { icon: Lightbulb,   className: "bg-emerald-500/10 text-emerald-400" },
  feature: { icon: Sparkles,    className: "bg-violet-500/10 text-violet-400" },
};

const statusLabel = {
  backlog:     "Backlog",
  in_progress: "In Progress",
  in_review:   "In Review",
  done:        "Done",
};

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-created_date", 100),
  });

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const q = query.toLowerCase().trim();
  const results = q
    ? tasks.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.slack_author?.toLowerCase().includes(q)
      )
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-xl bg-slate-900 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
          <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title, description or author..."
            className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20 outline-none"
          />
          <button onClick={onClose} className="text-white/20 hover:text-white/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {q && results.length === 0 && (
            <div className="py-12 text-center text-sm text-white/20">No results found</div>
          )}
          {!q && (
            <div className="py-12 text-center text-sm text-white/20">Start typing to search…</div>
          )}
          {results.map(task => {
            const type = typeConfig[task.type] || typeConfig.task;
            const TypeIcon = type.icon;
            const initials = task.slack_author
              ? task.slack_author.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
              : "?";

            return (
              <div
                key={task.id}
                className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-default last:border-0"
              >
                <div className={cn("mt-0.5 p-1.5 rounded-lg flex-shrink-0", type.className)}>
                  <TypeIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-white/30 truncate mt-0.5">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {task.slack_author && (
                      <div className="flex items-center gap-1.5">
                        {task.slack_avatar ? (
                          <img src={task.slack_avatar} alt="" className="w-4 h-4 rounded-full" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center text-[8px] font-bold text-violet-300">
                            {initials}
                          </div>
                        )}
                        <span className="text-[10px] text-white/30">{task.slack_author}</span>
                      </div>
                    )}
                    {task.slack_channel && (
                      <div className="flex items-center gap-1 text-[10px] text-white/20">
                        <Hash className="w-3 h-3" />{task.slack_channel}
                      </div>
                    )}
                    {task.status && (
                      <span className="text-[10px] text-white/20">{statusLabel[task.status] || task.status}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}