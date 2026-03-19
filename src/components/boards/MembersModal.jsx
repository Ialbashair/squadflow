import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, UserPlus, Loader2, UserX, Mail, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

function Avatar({ name, email, size = "sm" }) {
  const initial = (name || email || "?")[0].toUpperCase();
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={cn("rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 flex items-center justify-center font-bold text-white/80 flex-shrink-0", sizeClass)}>
      {initial}
    </div>
  );
}

export default function MembersModal({ boardId, currentUserId, onClose }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState(null);
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["board-members", boardId],
    queryFn: () => base44.entities.BoardMember.filter({ board_id: boardId }),
    select: data => data.filter(m => m.status !== "removed"),
  });

  const activeMembers = members.filter(m => m.status === "active");
  const pendingMembers = members.filter(m => m.status === "pending");

  const inviteMutation = useMutation({
    mutationFn: () => base44.functions.invoke("inviteBoardMember", { board_id: boardId, email: inviteEmail.trim() }),
    onSuccess: () => {
      setInviteEmail("");
      setInviteError(null);
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
    },
    onError: (err) => {
      setInviteError(err?.response?.data?.error || err.message || "Failed to send invite");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId) => base44.entities.BoardMember.update(memberId, { status: "removed" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board-members", boardId] }),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (memberId) => base44.entities.BoardMember.delete(memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board-members", boardId] }),
  });

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteError(null);
    inviteMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-violet-400" />
            Board Members
          </h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Invite input */}
          <form onSubmit={handleInvite} className="space-y-2">
            <label className="text-xs text-white/40 block">Invite by email</label>
            <div className="flex gap-2">
              <input
                value={inviteEmail}
                onChange={e => { setInviteEmail(e.target.value); setInviteError(null); }}
                placeholder="teammate@example.com"
                type="email"
                className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!inviteEmail.trim() || inviteMutation.isPending}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-40 flex items-center gap-2 flex-shrink-0"
              >
                {inviteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Invite
              </button>
            </div>
            {inviteError && <p className="text-red-400 text-xs">{inviteError}</p>}
          </form>

          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-violet-400 animate-spin" /></div>
          ) : (
            <>
              {/* Active members */}
              <div>
                <p className="text-xs text-white/30 mb-2 font-medium">Members ({activeMembers.length})</p>
                <div className="space-y-1.5">
                  {activeMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <Avatar name={m.user_name} email={m.user_email} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 font-medium truncate">{m.user_name || m.user_email}</p>
                        {m.user_name && <p className="text-xs text-white/30 truncate">{m.user_email}</p>}
                      </div>
                      {m.role === "admin" ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-violet-300 bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 rounded-full">
                          <Crown className="w-2.5 h-2.5" /> Admin
                        </span>
                      ) : (
                        m.user_id !== currentUserId && (
                          <button
                            onClick={() => removeMutation.mutate(m.id)}
                            disabled={removeMutation.isPending}
                            className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  ))}
                  {activeMembers.length === 0 && <p className="text-xs text-white/20 py-2 text-center">No members yet</p>}
                </div>
              </div>

              {/* Pending invites */}
              {pendingMembers.length > 0 && (
                <div>
                  <p className="text-xs text-white/30 mb-2 font-medium">Pending Invites ({pendingMembers.length})</p>
                  <div className="space-y-1.5">
                    {pendingMembers.map(m => (
                      <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/20">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/60 truncate">{m.invited_email}</p>
                          <p className="text-[10px] text-amber-400/60">Invite pending</p>
                        </div>
                        <button
                          onClick={() => cancelInviteMutation.mutate(m.id)}
                          disabled={cancelInviteMutation.isPending}
                          className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}