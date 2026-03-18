import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header/Header";
import StatsBar from "@/components/stats/StatsBar";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import SlackSyncModal from "@/components/slack/SlackSyncModal";
import { Loader2 } from "lucide-react";

export default function CardsView() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      const role = u?.role;
      setIsAdmin(role === "admin" || role === "team_lead");
    }).catch(() => {});
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
      data: { type: destination.droppableId, order: destination.index },
    });
  };

  const handleSync = () => {
    setShowSyncModal(true);
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
      <SlackSyncModal
        open={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onSynced={() => {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          setShowSyncModal(false);
        }}
      />
      <Header
        title="Cards View"
        subtitle={`${tasks.length} items from Slack`}
        onSync={handleSync}
        isSyncing={isSyncing}
        isAdmin={isAdmin}
      />
      <StatsBar tasks={tasks} />
      <KanbanBoard tasks={tasks} onDragEnd={isAdmin ? handleDragEnd : () => {}} isAdmin={isAdmin} />
    </div>
  );
}