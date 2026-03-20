import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Header from "@/components/header/Header";
import SlackMessageModal from "@/components/slack/SlackMessageModal";
import SlackSyncModal from "@/components/slack/SlackSyncModal";
import SlackSettingsModal from "@/components/slack/SlackSettingsModal";
import { Badge } from "@/components/ui/badge";
import { Hash, Clock, ArrowRight, Bug, Lightbulb, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const typeConfig = {
  task: { icon: CheckSquare, className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  bug: { icon: Bug, className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  idea: { icon: Lightbulb, className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

export default function SlackInbox() {
  const { activeBoardId, activeBoard, getEffectiveUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showSlackSettings, setShowSlackSettings] = useState(false);

  const isAdmin = getEffectiveUser()?.role === "admin";

  useEffect(() => {
    if (!activeBoardId) navigate("/");
  }, [activeBoardId]);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", activeBoardId],
    queryFn: () => base44.entities.Task.filter({ board_id: activeBoardId }, "-created_date", 50),
    enabled: !!activeBoardId,
  });

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
        title="Slack Inbox"
        subtitle="Recent messages tagged for action"
        isAdmin={isAdmin}
        onSync={() => setShowSyncModal(true)}
        onSlackSettings={isAdmin ? () => setShowSlackSettings(true) : undefined}
      />

      {selectedTask && (
        <SlackMessageModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-20 text-white/20">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <Hash className="w-7 h-7 text-white/10" />
            </div>
            <p className="text-white/30 text-sm">No messages synced yet</p>
            <p className="text-white/15 text-xs mt-1">Click "Sync with Slack" to pull tagged messages</p>
          </div>
        ) : (
          tasks.map(task => {
            const type = typeConfig[task.type] || typeConfig.task;
            const TypeIcon = type.icon;
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group cursor-pointer"
              >
                <div className={cn("p-2 rounded-lg", type.className.split(" ")[0])}>
                  <TypeIcon className={cn("w-4 h-4", type.className.split(" ")[1])} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{task.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {task.slack_channel && (
                      <span className="text-[10px] text-white/25 flex items-center gap-1">
                        <Hash className="w-3 h-3" />{task.slack_channel}
                      </span>
                    )}
                    {task.slack_author && (
                      <span className="text-[10px] text-white/25">{task.slack_author}</span>
                    )}
                    <span className="text-[10px] text-white/15 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(task.created_date), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-white/[0.06] text-white/25">
                  {task.status?.replace("_", " ")}
                </Badge>
                <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-violet-400 transition-colors" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}