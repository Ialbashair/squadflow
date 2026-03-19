import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { X, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const TYPES = ["task", "bug", "feature", "idea"];

export default function BoardTaskModal({ task, columns, isAdmin, onClose, onUpdated }) {
  const [form, setForm] = useState({
    title: task.title || "",
    description: task.description || "",
    priority: task.priority || "medium",
    type: task.type || "task",
    column_id: task.column_id || "",
    due_date: task.due_date || "",
    assigned_to_name: task.assigned_to_name || "",
  });
  const [showDelete, setShowDelete] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.update(task.id, data),
    onSuccess: onUpdated,
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Task.delete(task.id),
    onSuccess: onUpdated,
  });

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Task Details</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Title</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors resize-none"
            />
          </div>

          {/* Row: Column + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Column</label>
              <select
                value={form.column_id}
                onChange={e => setForm(f => ({ ...f, column_id: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
              >
                {columns.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
              >
                {PRIORITIES.map(p => <option key={p} value={p} className="bg-slate-900 capitalize">{p}</option>)}
              </select>
            </div>
          </div>

          {/* Row: Type + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
              >
                {TYPES.map(t => <option key={t} value={t} className="bg-slate-900 capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Slack source info */}
          {task.slack_author && (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-xs text-white/30 mb-1">Synced from Slack</p>
              <div className="flex items-center gap-2">
                {task.slack_avatar && <img src={task.slack_avatar} alt="" className="w-5 h-5 rounded-full" />}
                <span className="text-xs text-white/60">{task.slack_author} · #{task.slack_channel}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-white/[0.06]">
          {isAdmin && !showDelete && (
            <button
              onClick={() => setShowDelete(true)}
              className="p-2 rounded-xl text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {showDelete && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Delete this task?</span>
              <button
                onClick={() => deleteMutation.mutate()}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-colors"
              >
                {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes, delete"}
              </button>
              <button onClick={() => setShowDelete(false)} className="text-xs text-white/30 hover:text-white/50">Cancel</button>
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors">Cancel</button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors flex items-center gap-2"
            >
              {updateMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}