import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header/Header";
import WorkflowStatsBar from "@/components/stats/WorkflowStatsBar";
import WorkflowBoard from "@/components/kanban/WorkflowBoard";
import SlackSyncModal from "@/components/slack/SlackSyncModal";
import { logTaskMoved } from "@/lib/auditLog";
import { Loader2 } from "lucide-react";

export default function KanbanBoardPage() {
  const { getEffectiveUser } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      const effectiveUser = getEffectiveUser();
      const role = effectiveUser?.role;
      setIsAdmin(role === "admin" || role === "team_lead");
      setIsAdminOnly(role === "admin");
    }).catch(() => {});
  }, [getEffectiveUser]);

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
    const task = tasks.find(t => String(t.id) === draggableId);
    updateMutation.mutate({
      id: draggableId,
      data: { status: destination.droppableId, order: destination.index },
    });
    if (task && destination.droppableId !== source.droppableId) {
      logTaskMoved({ task, fromStatus: source.droppableId, toStatus: destination.droppableId, user: currentUser });
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
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          setShowSyncModal(false);
        }}
      />
      <Header
        title="Kanban Board"
        subtitle={`${tasks.length} items from Slack`}
        onSync={handleSync}
        isSyncing={isSyncing}
        isAdmin={isAdminOnly}
      />
      <WorkflowStatsBar tasks={tasks} />
      <WorkflowBoard tasks={tasks} onDragEnd={handleDragEnd} isAdmin={isAdmin} canDrag={true} />
    </div>
  );
}