import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import { ChevronDown, LayoutDashboard, Check, X } from "lucide-react";

export default function BoardSwitcher({ collapsed }) {
  const { activeBoardId, activeBoard, setActiveBoardId, user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user || null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (!u?.id) return;
      base44.entities.BoardMember.filter({ user_id: u.id, status: "active" }).then(memberships => {
        const ids = memberships.map(m => m.board_id);
        if (!ids.length) return;
        base44.entities.Board.list("-created_date", 100).then(all => {
          const myBoards = all.filter(b => ids.includes(b.id));
          setBoards(myBoards);
          // If there's a stored activeBoardId, resolve the board object
          if (activeBoardId && !activeBoard) {
            const found = myBoards.find(b => b.id === activeBoardId);
            if (found) setActiveBoardId(activeBoardId, found);
            else setActiveBoardId(null, null); // board no longer accessible
          }
        });
      });
    }).catch(() => {});
  }, []);

  if (collapsed) {
    return (
      <button
        onClick={() => setOpen(o => !o)}
        title={activeBoard?.name || "Select board"}
        className="flex items-center justify-center w-full h-10 text-white/30 hover:text-violet-400 transition-colors"
      >
        <LayoutDashboard className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="relative px-3 pb-2 pt-1">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left",
          activeBoard
            ? "bg-violet-500/10 border-violet-500/20 text-white/80 hover:border-violet-500/40"
            : "bg-white/[0.03] border-white/[0.08] text-white/30 hover:border-white/[0.15] hover:text-white/50"
        )}
      >
        <LayoutDashboard className={cn("w-4 h-4 flex-shrink-0", activeBoard ? "text-violet-400" : "text-white/20")} />
        <span className="text-xs font-medium truncate flex-1">
          {activeBoard?.name || "Select board…"}
        </span>
        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-3 right-3 mt-1 z-20 bg-slate-900 border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">
            <div className="px-3 py-2 border-b border-white/[0.06]">
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">Switch Board</p>
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {/* Deselect option */}
              {activeBoardId && (
                <button
                  onClick={() => { setActiveBoardId(null, null); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.05] transition-colors border-b border-white/[0.05]"
                >
                  <div className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <X className="w-3 h-3 text-white/30" />
                  </div>
                  <span className="text-xs text-white/40 flex-1">No board selected</span>
                </button>
              )}
              {boards.length === 0 && (
                <p className="text-xs text-white/20 text-center py-4">No boards yet</p>
              )}
              {boards.map(b => (
                <button
                  key={b.id}
                  onClick={() => { setActiveBoardId(b.id, b); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.05] transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center flex-shrink-0">
                    <LayoutDashboard className="w-3 h-3 text-violet-400" />
                  </div>
                  <span className="text-xs text-white/70 flex-1 truncate">{b.name}</span>
                  {activeBoardId === b.id && <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}