import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Header from "@/components/header/Header";
import StatsBar from "@/components/stats/StatsBar";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import SlackSyncModal from "@/components/slack/SlackSyncModal";
import { logTaskTypeChanged } from "@/lib/auditLog";
import { Loader2 } from "lucide-react";

export default function CardsView() {
  const { activeBoardId, activeBoard } = useAuth();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      const role = u?.role;
      setIsAdmin(role === "admin" || role === "team_lead");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeBoardId) navigate("/");
  }, [activeBoardId]);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", activeBoardId],
    queryFn: () => base44.entities.Task.filter({ board_id: activeBoardId }, "-created_date", 100),
    enabled: !!activeBoardId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", activeBoardId] }),
  });

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const task = tasks.find(t => String(t.id) === draggableId);
    updateMutation.mutate({
      id: draggableId,
      data: { type: destination.droppableId, order: destination.index },
    });
    if (task && destination.droppableId !== source.droppableId) {
      logTaskTypeChanged({ task, fromType: source.droppableId, toType: destination.droppableId, user: currentUser });
    }
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
          queryClient.invalidateQueries({ queryKey: ["tasks", activeBoardId] });
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