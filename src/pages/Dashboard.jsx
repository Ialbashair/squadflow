import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, LayoutDashboard, Users, Loader2, Trash2, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import CreateBoardModal from "@/components/boards/CreateBoardModal";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // All board memberships for the current user
  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["my-memberships", currentUser?.id],
    queryFn: () => base44.entities.BoardMember.filter({ user_id: currentUser.id, status: "accepted" }),
    enabled: !!currentUser?.id,
  });

  // Fetch all boards that match membership board_ids
  const boardIds = memberships.map(m => m.board_id);
  const { data: allBoards = [] } = useQuery({
    queryKey: ["boards", boardIds.join(",")],
    queryFn: () => base44.entities.Board.list("-created_date", 100),
    enabled: boardIds.length > 0,
  });

  const boards = allBoards.filter(b => boardIds.includes(b.id));

  // Member counts per board
  const { data: allMembers = [] } = useQuery({
    queryKey: ["board-members-all"],
    queryFn: () => base44.entities.BoardMember.filter({ status: "accepted" }),
    enabled: boardIds.length > 0,
  });

  const memberCountByBoard = allMembers.reduce((acc, m) => {
    acc[m.board_id] = (acc[m.board_id] || 0) + 1;
    return acc;
  }, {});

  const roleByBoard = memberships.reduce((acc, m) => {
    acc[m.board_id] = m.role;
    return acc;
  }, {});

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

      <div className="flex items-center justify-between mb-8">
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
          const memberCount = memberCountByBoard[board.id] || 0;
          return (
            <Link
              key={board.id}
              to={`/board/${board.id}`}
              className="group relative flex flex-col p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/30 hover:bg-violet-500/[0.04] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-violet-400" />
                </div>
                {isAdmin && (
                  <span className="text-[10px] font-bold text-violet-300 bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 rounded-full">
                    ADMIN
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-white mb-1 line-clamp-1">{board.name}</h3>
              {board.description && (
                <p className="text-xs text-white/40 mb-3 line-clamp-2">{board.description}</p>
              )}
              <div className="mt-auto flex items-center gap-3 pt-3 border-t border-white/[0.05]">
                <div className="flex items-center gap-1.5 text-xs text-white/30">
                  <Users className="w-3.5 h-3.5" />
                  {memberCount} member{memberCount !== 1 ? "s" : ""}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/20 ml-auto group-hover:text-violet-400 transition-colors" />
              </div>
            </Link>
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

      {boards.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-7 h-7 text-violet-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">No boards yet</h3>
          <p className="text-sm text-white/30 mb-6">Create your first board to get started.</p>
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