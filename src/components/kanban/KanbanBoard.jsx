import React, { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";
import TaskDetailModal from "./TaskDetailModal";

const COLUMNS = ["task", "bug", "idea", "feature"];

export default function KanbanBoard({ tasks, onDragEnd, isAdmin }) {
  const [selectedTask, setSelectedTask] = useState(null);

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col] = tasks
      .filter(t => t.type === col)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return acc;
  }, {});

  return (
    <>
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          isAdmin={isAdmin}
        />
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto pb-4 px-1">
          {COLUMNS.map(col => (
            <KanbanColumn key={col} columnId={col} tasks={grouped[col]} onCardClick={setSelectedTask} />
          ))}
        </div>
      </DragDropContext>
    </>
  );
}