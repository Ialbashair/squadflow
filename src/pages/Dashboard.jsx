import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Plus, LayoutDashboard, Loader2, ChevronRight, Check, X, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import CreateBoardModal from "@/components/boards/CreateBoardModal";

function MemberAvatars({ boardId, allMembers }) {
  const members = (allMembers || []).filter(m => m.board_id === boardId && m.status === "active");
  const shown = members.slice(0, 5);
  const overflow = members.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((m, i) => (
        <div
          key={m.id}
          title={m.user_name || m.user_email}
          className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/50 to-fuchsia-500/50 border border-slate-900 flex items-center justify-center text-[9px] font-bold text-white/80"
        >
          {(m.user_name || m.user_email || "?")[0].toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-6 h-6 rounded-full bg-white/[0.08] border border-slate-900 flex items-center justify-center text-[9px] text-white/40 font-bold">
          +{overflow}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { setActiveBoardId, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  // All memberships for current user (active boards)
  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["my-memberships", currentUser?.id],
    queryFn: () => base44.entities.BoardMember.filter({ user_id: currentUser.id, status: "active" }),
    enabled: !!currentUser?.id,
  });

  // Pending invites for current user (matched by email)
  const { data: pendingInvites = [] } = useQuery({
    queryKey: ["pending-invites", currentUser?.email],
    queryFn: () => base44.entities.BoardMember.filter({ invited_email: currentUser.email, status: "pending" }),
    enabled: !!currentUser?.email,
  });

  const boardIds = memberships.map(m => m.board_id);

  // Fetch boards I'm a member of
  const { data: allBoards = [] } = useQuery({
    queryKey: ["boards", boardIds.join(",")],
    queryFn: () => base44.entities.Board.list("-created_date", 100),
    enabled: boardIds.length > 0,
  });
  const boards = allBoards.filter(b => boardIds.includes(b.id));

  // Fetch boards for pending invites
  const pendingBoardIds = pendingInvites.map(p => p.board_id);
  const { data: pendingBoards = [] } = useQuery({
    queryKey: ["pending-boards", pendingBoardIds.join(",")],
    queryFn: () => base44.entities.Board.list("-created_date", 100),
    enabled: pendingBoardIds.length > 0,
  });
  const pendingBoardMap = pendingBoards.reduce((acc, b) => { acc[b.id] = b; return acc; }, {});

  // All active members across all boards (for avatars)
  const { data: allMembers = [] } = useQuery({
    queryKey: ["board-members-all", boardIds.join(",")],
    queryFn: () => base44.entities.BoardMember.filter({ status: "active" }),
    enabled: boardIds.length > 0,
  });

  const roleByBoard = memberships.reduce((acc, m) => {
    acc[m.board_id] = m.role;
    return acc;
  }, {});

  // Accept invite
  const acceptMutation = useMutation({
    mutationFn: (invite) => base44.entities.BoardMember.update(invite.id, {
      status: "active",
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      user_email: currentUser.email,
      joined_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      queryClient.invalidateQueries({ queryKey: ["my-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });

  // Decline invite
  const declineMutation = useMutation({
    mutationFn: (invite) => base44.entities.BoardMember.delete(invite.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pending-invites"] }),
  });

  const handleBoardCreated = () => {
    setShowCreate(false);
    queryClient.invalidateQueries({ queryKey: ["my-memberships"] });
    queryClient.invalidateQueries({ queryKey: ["boards"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <CreateBoardModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleBoardCreated}
        currentUser={currentUser}
      />

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300">Pending Invites</h3>
            <span className="text-xs text-amber-400 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">{pendingInvites.length}</span>
          </div>
          <div className="space-y-2">
            {pendingInvites.map(invite => {
              const board = pendingBoardMap[invite.board_id];
              return (
                <div key={invite.id} className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{board?.name || "A board"}</p>
                    <p className="text-xs text-white/30">You've been invited to join this board</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => declineMutation.mutate(invite)}
                      disabled={declineMutation.isPending || acceptMutation.isPending}
                      className="p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => acceptMutation.mutate(invite)}
                      disabled={acceptMutation.isPending || declineMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition-all"
                    >
                      {acceptMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Accept
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">My Boards</h2>
          <p className="text-sm text-white/30 mt-0.5">{boards.length} board{boards.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          New Board
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.map(board => {
          const isAdmin = roleByBoard[board.id] === "admin";
          return (
            <button
              key={board.id}
              onClick={() => { setActiveBoardId(board.id, board); navigate("/KanbanBoard"); }}
              className="group relative flex flex-col p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/30 hover:bg-violet-500/[0.04] transition-all duration-200 text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-violet-400" />
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  isAdmin
                    ? "text-violet-300 bg-violet-500/20 border-violet-500/30"
                    : "text-slate-400 bg-slate-500/20 border-slate-500/30"
                )}>
                  {isAdmin ? "ADMIN" : "MEMBER"}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1 line-clamp-1">{board.name}</h3>
              {board.description && (
                <p className="text-xs text-white/40 mb-3 line-clamp-2">{board.description}</p>
              )}
              <div className="mt-auto flex items-center gap-3 pt-3 border-t border-white/[0.05]">
                <MemberAvatars boardId={board.id} allMembers={allMembers} />
                <ChevronRight className="w-3.5 h-3.5 text-white/20 ml-auto group-hover:text-violet-400 transition-colors" />
              </div>
            </button>
          );
        })}

        {/* Create New Board card */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-violet-500/30 hover:bg-violet-500/[0.03] transition-all duration-200 text-white/20 hover:text-violet-400 min-h-[140px]"
        >
          <Plus className="w-8 h-8" />
          <span className="text-sm font-medium">Create New Board</span>
        </button>
      </div>

      {boards.length === 0 && pendingInvites.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-7 h-7 text-violet-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">No boards yet</h3>
          <p className="text-sm text-white/30 mb-6">Create your first board or wait for an invite.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
          >
            Create Board
          </button>
        </div>
      )}
    </div>
  );
}