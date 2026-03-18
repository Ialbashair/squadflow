import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import KanbanCard from "./KanbanCard";

const columnConfig = {
  task: { label: "Tasks", accent: "bg-blue-500", glow: "shadow-blue-500/20" },
  bug: { label: "Bugs", accent: "bg-amber-500", glow: "shadow-amber-500/20" },
  idea: { label: "Ideas", accent: "bg-emerald-500", glow: "shadow-emerald-500/20" },
  feature: { label: "Features", accent: "bg-violet-500", glow: "shadow-violet-500/20" },
};

export default function KanbanColumn({ columnId, tasks, onCardClick }) {
  const config = columnConfig[columnId] || columnConfig.todo;

  return (
    <div className="flex flex-col w-full md:min-w-[280px] md:max-w-[340px] md:flex-1">
      {/* Column header */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className={cn("w-2.5 h-2.5 rounded-full shadow-lg", config.accent, config.glow)} />
        <h3 className="text-sm font-semibold text-white/70 tracking-wide uppercase">
          {config.label}
        </h3>
        <span className="ml-auto text-xs font-mono text-white/20 bg-white/[0.04] px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={columnId}>
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
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                {(provided, snapshot) => (
                  <KanbanCard
                    task={task}
                    provided={provided}
                    isDragging={snapshot.isDragging}
                    onClick={onCardClick}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
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
}