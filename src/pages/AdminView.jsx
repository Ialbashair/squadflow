import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Shield, User, Mail, ChevronDown, Loader2, Search, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLES = [
  {
    value: "admin",
    label: "Admin",
    description: "Full access including Admin View & Slack sync",
    color: "text-violet-300",
    bg: "bg-violet-500/20 border-violet-500/30",
    dot: "bg-violet-400",
  },
  {
    value: "team_lead",
    label: "Team Lead",
    description: "Can move & edit cards, no Admin access",
    color: "text-amber-300",
    bg: "bg-amber-500/20 border-amber-500/30",
    dot: "bg-amber-400",
  },
  {
    value: "user",
    label: "Team Member",
    description: "Can move cards on Kanban (assigns to self)",
    color: "text-slate-300",
    bg: "bg-slate-500/20 border-slate-500/30",
    dot: "bg-slate-400",
  },
];

function RoleConfig(role) {
  return ROLES.find(r => r.value === role) || ROLES[2];
}

function RoleDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = RoleConfig(value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
          current.bg, current.color
        )}
      >
        <div className={cn("w-1.5 h-1.5 rounded-full", current.dot)} />
        {current.label}
        <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-56 z-20 bg-slate-900 border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => { onChange(r.value); setOpen(false); }}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]",
                  value === r.value && "bg-white/[0.03]"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full mt-1 flex-shrink-0", r.dot)} />
                <div>
                  <div className={cn("text-xs font-semibold", r.color)}>{r.label}</div>
                  <div className="text-[10px] text-white/30 mt-0.5">{r.description}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [pendingRoles, setPendingRoles] = useState({});
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [notAdmin, setNotAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then(me => {
      setCurrentUser(me);
      if (me?.role !== "admin") {
        setNotAdmin(true);
        setLoading(false);
        return;
      }
      return base44.entities.User.list().then(all => {
        setUsers(all);
        setLoading(false);
      });
    }).catch(() => setLoading(false));
  }, []);

  const handleRoleChange = (userId, role) => {
    setPendingRoles(prev => ({ ...prev, [userId]: role }));
  };

  const handleSave = async (user) => {
    const newRole = pendingRoles[user.id];
    if (!newRole) return;
    setSaving(prev => ({ ...prev, [user.id]: true }));
    await base44.entities.User.update(user.id, { role: newRole });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    setPendingRoles(prev => { const n = { ...prev }; delete n[user.id]; return n; });
    setSaving(prev => { const n = { ...prev }; delete n[user.id]; return n; });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (notAdmin) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-sm text-white/40">You need Admin privileges to view this page.</p>
      </div>
    );
  }

  const filtered = users.filter(u =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin View</h2>
          <p className="text-sm text-white/30 mt-0.5">{users.length} team members</p>
        </div>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {ROLES.map(r => (
          <div key={r.value} className={cn("p-4 rounded-xl border", r.bg)}>
            <div className={cn("text-xs font-bold mb-1", r.color)}>{r.label}</div>
            <div className="text-[11px] text-white/40">{r.description}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
        />
      </div>

      {/* User list */}
      <div className="space-y-2">
        {filtered.map(u => {
          const effectiveRole = pendingRoles[u.id] ?? u.role ?? "user";
          const roleConfig = RoleConfig(effectiveRole);
          const isDirty = pendingRoles[u.id] !== undefined;
          const isMe = u.id === currentUser?.id;

          return (
            <div
              key={u.id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 flex items-center justify-center text-sm font-bold text-white/80 flex-shrink-0">
                {(u.full_name || u.email || "?")[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white/90 truncate">{u.full_name || "Unnamed"}</span>
                  {isMe && <span className="text-[10px] text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full">You</span>}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-white/20" />
                  <span className="text-xs text-white/30 truncate">{u.email}</span>
                </div>
              </div>

              {/* Role selector */}
              <RoleDropdown
                value={effectiveRole}
                onChange={(role) => handleRoleChange(u.id, role)}
              />

              {/* Save button */}
              {isDirty && (
                <Button
                  onClick={() => handleSave(u)}
                  disabled={saving[u.id]}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-medium rounded-xl px-4 h-8 border-0 flex-shrink-0"
                >
                  {saving[u.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                  {!saving[u.id] && "Save"}
                </Button>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/20 text-sm">No users found</div>
        )}
      </div>
    </div>
  );
}