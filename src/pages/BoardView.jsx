import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Loader2, Plus, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import BoardTaskCard from "@/components/boards/BoardTaskCard";
import BoardTaskModal from "@/components/boards/BoardTaskModal";
import SlackSyncModal from "@/components/slack/SlackSyncModal";

export default function BoardView() {
  const { id: boardId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSync, setShowSync] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setCurrentUser(u);
      // Check board membership
      const members = await base44.entities.BoardMember.filter({ board_id: boardId, user_id: u.id });
      const m = members.find(m => m.status === "accepted");
      setMembership(m || null);
      setAccessChecked(true);
    }).catch(() => setAccessChecked(true));
  }, [boardId]);

  const { data: board } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => base44.entities.Board.filter({ id: boardId }).then(r => r[0]),
    enabled: !!boardId,
  });

  const { data: columns = [], isLoading: columnsLoading } = useQuery({
    queryKey: ["columns", boardId],
    queryFn: () => base44.entities.Column.filter({ board_id: boardId }),
    enabled: !!boardId,
    select: data => [...data].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["board-tasks", boardId],
    queryFn: () => base44.entities.Task.filter({ board_id: boardId }),
    enabled: !!boardId,
    select: data => [...data].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board-tasks", boardId] }),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board-tasks", boardId] }),
  });

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks.find(t => String(t.id) === draggableId);
    if (!task) return;

    updateTaskMutation.mutate({
      id: draggableId,
      data: {
        column_id: destination.droppableId,
        position: destination.index,
      },
    });
  };

  const handleAddTask = async (columnId, title) => {
    const colTasks = tasks.filter(t => t.column_id === columnId);
    await createTaskMutation.mutateAsync({
      board_id: boardId,
      column_id: columnId,
      title,
      type: "task",
      priority: "medium",
      position: colTasks.length,
    });
  };

  const isAdmin = membership?.role === "admin";
  const isLoading = columnsLoading || tasksLoading || !accessChecked;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (accessChecked && !membership) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-sm text-white/40 mb-5">You are not a member of this board.</p>
        <Link to="/dashboard" className="text-sm text-violet-400 hover:text-violet-300">← Back to My Boards</Link>
      </div>
    );
  }

  const tasksByColumn = columns.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.column_id === col.id);
    return acc;
  }, {});

  return (
    <div>
      <SlackSyncModal
        open={showSync}
        onClose={() => setShowSync(false)}
        onSynced={() => {
          queryClient.invalidateQueries({ queryKey: ["board-tasks", boardId] });
          setShowSync(false);
        }}
        boardId={boardId}
      />

      {selectedTask && (
        <BoardTaskModal
          task={selectedTask}
          columns={columns}
          isAdmin={isAdmin}
          onClose={() => setSelectedTask(null)}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["board-tasks", boardId] });
            setSelectedTask(null);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{board?.name || "Board"}</h2>
            {board?.description && <p className="text-sm text-white/30 mt-0.5">{board.description}</p>}
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowSync(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            Sync from Slack
          </button>
        )}
      </div>

      {/* Kanban columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => (
            <BoardColumn
              key={col.id}
              column={col}
              tasks={tasksByColumn[col.id] || []}
              onTaskClick={setSelectedTask}
              onAddTask={handleAddTask}
              isAdmin={isAdmin}
            />
          ))}
          {columns.length === 0 && (
            <div className="text-white/30 text-sm py-16 text-center w-full">No columns yet.</div>
          )}
        </div>
      </DragDropContext>
    </div>
  );
}

function BoardColumn({ column, tasks, onTaskClick, onAddTask, isAdmin }) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onAddTask(column.id, newTitle.trim());
    setNewTitle("");
    setAdding(false);
  };

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-white/70">{column.title}</h3>
        <span className="text-xs text-white/25 bg-white/[0.05] px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 min-h-[200px] rounded-2xl p-2 space-y-2 transition-colors",
              snapshot.isDraggingOver
                ? "bg-violet-500/[0.07] border border-violet-500/20"
                : "bg-white/[0.02] border border-white/[0.05]"
            )}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <BoardTaskCard
                      task={task}
                      onClick={() => onTaskClick(task)}
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add task */}
      <div className="mt-2">
        {adding ? (
          <form onSubmit={handleAdd} className="space-y-2">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Task title..."
              autoFocus
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors">Add</button>
              <button type="button" onClick={() => setAdding(false)} className="flex-1 py-1.5 rounded-lg text-white/30 hover:text-white/60 text-xs transition-colors">Cancel</button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/25 hover:text-white/50 hover:bg-white/[0.03] text-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add task
          </button>
        )}
      </div>
    </div>
  );
}