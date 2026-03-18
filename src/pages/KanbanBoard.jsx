import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header/Header";
import WorkflowStatsBar from "@/components/stats/WorkflowStatsBar";
import WorkflowBoard from "@/components/kanban/WorkflowBoard";
import { Loader2 } from "lucide-react";

export default function KanbanBoardPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => setIsAdmin(u?.role === "admin")).catch(() => {});
  }, []);

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
    updateMutation.mutate({
      id: draggableId,
      data: { status: destination.droppableId, order: destination.index },
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
        title="Kanban Board"
        subtitle={`${tasks.length} items from Slack`}
        onSync={handleSync}
        isSyncing={isSyncing}
      />
      <WorkflowStatsBar tasks={tasks} />
      <WorkflowBoard tasks={tasks} onDragEnd={handleDragEnd} />
    </div>
  );
}