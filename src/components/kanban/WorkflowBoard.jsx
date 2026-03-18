import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Bug, Lightbulb, CheckSquare, Sparkles,
  AlertTriangle, Clock, ArrowUp, ArrowDown,
  Hash, Inbox, PlayCircle, Eye, CheckCircle2
} from "lucide-react";
import TaskDetailModal from "./TaskDetailModal";

const COLUMNS = [
  { id: "backlog",     label: "Backlog",     icon: Inbox,        accent: "bg-slate-500",   glow: "shadow-slate-500/20",   color: "text-slate-400" },
  { id: "in_progress", label: "In Progress", icon: PlayCircle,   accent: "bg-blue-500",    glow: "shadow-blue-500/20",    color: "text-blue-400" },
  { id: "in_review",   label: "In Review",   icon: Eye,          accent: "bg-amber-500",   glow: "shadow-amber-500/20",   color: "text-amber-400" },
  { id: "done",        label: "Done",        icon: CheckCircle2, accent: "bg-emerald-500", glow: "shadow-emerald-500/20", color: "text-emerald-400" },
];

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

function WorkflowCard({ task, provided, isDragging, onClick }) {
  const type = typeConfig[task.type] || typeConfig.task;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const TypeIcon = type.icon;
  const PriorityIcon = priority.icon;

  const initials = task.slack_author
    ? task.slack_author.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => !isDragging && onClick(task)}
      className={cn(
        "relative rounded-xl border border-white/[0.06] mb-2",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm",
        "hover:border-white/[0.12] transition-all duration-200 cursor-grab active:cursor-grabbing",
        isDragging && "shadow-2xl shadow-violet-500/10 border-violet-500/30 scale-[1.02] rotate-1"
      )}
    >
      <div className={cn("absolute top-0 left-4 right-4 h-[2px] rounded-full opacity-60", priority.dot)} />

      {/* Mobile condensed */}
      <div className="md:hidden px-3 py-2.5">
        <p className="text-sm font-medium text-white/90 leading-snug line-clamp-2 mb-2">{task.title}</p>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={cn("text-[10px] font-semibold tracking-wider uppercase border px-1.5 py-0 h-5", type.className)}>
            <TypeIcon className="w-3 h-3 mr-1 flex-shrink-0" />{type.label}
          </Badge>
          <div className="flex items-center gap-1.5 min-w-0">
            {task.slack_avatar ? (
              <img src={task.slack_avatar} alt="" className="w-5 h-5 rounded-full ring-1 ring-white/10 flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-violet-300">{initials}</div>
            )}
            {task.slack_author && <span className="text-[10px] text-white/30 truncate">{task.slack_author}</span>}
          </div>
        </div>
      </div>

      {/* Desktop full */}
      <div className="hidden md:block p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className={cn("text-[10px] font-semibold tracking-wider uppercase border px-2 py-0.5", type.className)}>
            <TypeIcon className="w-3 h-3 mr-1" />{type.label}
          </Badge>
          <div className={cn("flex items-center gap-1 text-[10px] font-medium", priority.color)}>
            <PriorityIcon className="w-3 h-3" />{priority.label}
          </div>
        </div>
        <h4 className="text-sm font-medium text-white/90 leading-snug mb-2 line-clamp-2">{task.title}</h4>
        {task.description && (
          <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-3">{task.description}</p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          {task.slack_channel && (
            <div className="flex items-center gap-1 text-[10px] text-white/30">
              <Hash className="w-3 h-3" />{task.slack_channel}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {task.slack_avatar ? (
              <img src={task.slack_avatar} alt="" className="w-5 h-5 rounded-full ring-1 ring-white/10" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[9px] font-bold text-violet-300">{initials}</div>
            )}
            {task.slack_author && <span className="text-[10px] text-white/30">{task.slack_author}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowBoard({ tasks, onDragEnd }) {
  const [selectedTask, setSelectedTask] = useState(null);

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks
      .filter(t => (t.status || "backlog") === col.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return acc;
  }, {});

  return (
    <>
    {selectedTask && (
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    )}
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto pb-4 px-1">
        {COLUMNS.map(col => {
          const ColIcon = col.icon;
          return (
            <div key={col.id} className="flex flex-col w-full md:min-w-[280px] md:max-w-[340px] md:flex-1">
              {/* Column header */}
              <div className="flex items-center gap-3 mb-4 px-1">
                <div className={cn("w-2.5 h-2.5 rounded-full shadow-lg", col.accent, col.glow)} />
                <ColIcon className={cn("w-4 h-4", col.color)} />
                <h3 className="text-sm font-semibold text-white/70 tracking-wide uppercase">{col.label}</h3>
                <span className="ml-auto text-xs font-mono text-white/20 bg-white/[0.04] px-2 py-0.5 rounded-full">
                  {grouped[col.id].length}
                </span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 rounded-2xl p-3 min-h-[200px] transition-colors duration-200",
                      "bg-white/[0.02] border border-white/[0.04]",
                      snapshot.isDraggingOver && "bg-violet-500/[0.04] border-violet-500/20"
                    )}
                  >
                    {grouped[col.id].map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(provided, snapshot) => (
                          <WorkflowCard task={task} provided={provided} isDragging={snapshot.isDragging} onClick={setSelectedTask} />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {grouped[col.id].length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center justify-center py-12 text-white/10">
                        <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center mb-3">
                          <span className="text-lg">+</span>
                        </div>
                        <p className="text-xs">Drop items here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
    </>
  );
}