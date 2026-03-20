import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Header from "@/components/header/Header";
import StatsBar from "@/components/stats/StatsBar";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import SlackSyncModal from "@/components/slack/SlackSyncModal";
import SlackSettingsModal from "@/components/slack/SlackSettingsModal";
import { logTaskTypeChanged } from "@/lib/auditLog";
import { Loader2 } from "lucide-react";

export default function CardsView() {
  const { activeBoardId, activeBoard, getEffectiveUser } = useAuth();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showSlackSettings, setShowSlackSettings] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  const effectiveRole = getEffectiveUser()?.role || 'user';
  const isAdmin = effectiveRole === "admin" || effectiveRole === "team_lead";

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
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
        boardId={activeBoardId}
        board={activeBoard}
        onSynced={() => {
          queryClient.invalidateQueries({ queryKey: ["tasks", activeBoardId] });
          setShowSyncModal(false);
        }}
      />
      <SlackSettingsModal
        open={showSlackSettings}
        onClose={() => setShowSlackSettings(false)}
        boardId={activeBoardId}
        board={activeBoard}
        onUpdated={() => setShowSlackSettings(false)}
      />
      <Header
        title={activeBoard?.name || "Cards View"}
        subtitle={`${tasks.length} items`}
        onSync={handleSync}
        isSyncing={isSyncing}
        isAdmin={isAdmin}
        onSlackSettings={isAdmin ? () => setShowSlackSettings(true) : undefined}
      />
      <StatsBar tasks={tasks} />
      <KanbanBoard tasks={tasks} onDragEnd={isAdmin ? handleDragEnd : () => {}} isAdmin={isAdmin} />
    </div>
  );
}