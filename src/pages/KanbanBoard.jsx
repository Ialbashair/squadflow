import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header/Header";
import StatsBar from "@/components/stats/StatsBar";
import WorkflowBoard from "@/components/kanban/WorkflowBoard";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import { Loader2, Kanban, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "workflow", label: "Kanban Board", icon: Kanban },
  { id: "cards",   label: "Cards View",   icon: LayoutGrid },
];

export default function KanbanBoardPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("workflow");
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-created_date", 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  // Workflow board: drag updates `status`
  const handleWorkflowDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    updateMutation.mutate({
      id: draggableId,
      data: { status: destination.droppableId, order: destination.index },
    });
  };

  // Cards view: drag updates `type`
  const handleCardsDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    updateMutation.mutate({
      id: draggableId,
      data: { type: destination.droppableId, order: destination.index },
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsSyncing(false);
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Board"
        subtitle={`${tasks.length} items from Slack`}
        onSync={handleSync}
        isSyncing={isSyncing}
      />
      <StatsBar tasks={tasks} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-violet-500/20 text-violet-300 shadow-inner"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "workflow" && (
        <WorkflowBoard tasks={tasks} onDragEnd={handleWorkflowDragEnd} />
      )}
      {activeTab === "cards" && (
        <KanbanBoard tasks={tasks} onDragEnd={handleCardsDragEnd} />
      )}
    </div>
  );
}