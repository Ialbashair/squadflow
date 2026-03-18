import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header/Header";
import StatsBar from "@/components/stats/StatsBar";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import { Loader2 } from "lucide-react";

export default function KanbanBoardPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-created_date", 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newType = destination.droppableId;
    updateMutation.mutate({
      id: draggableId,
      data: { type: newType, order: destination.index },
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate sync — will be replaced with real Slack integration
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
        title="Kanban Board"
        subtitle={`${tasks.length} items from Slack`}
        onSync={handleSync}
        isSyncing={isSyncing}
      />
      <StatsBar tasks={tasks} />
      <KanbanBoard tasks={tasks} onDragEnd={handleDragEnd} />
    </div>
  );
}