import React from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";

const COLUMNS = ["task", "bug", "idea", "feature"];

export default function KanbanBoard({ tasks, onDragEnd }) {
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col] = tasks
      .filter(t => t.type === col)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return acc;
  }, {});

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto pb-4 px-1">
        {COLUMNS.map(col => (
          <KanbanColumn key={col} columnId={col} tasks={grouped[col]} />
        ))}
      </div>
    </DragDropContext>
  );
}