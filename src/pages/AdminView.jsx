import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import { Mail, ChevronDown, Loader2, Search, Save, AlertTriangle, Link, Copy, Check, Trash2, X, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function ConfirmModal({ title, message, action, onClose, onConfirm, deleting }) {
  const [code] = useState(generateCode);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    if (input !== code) return;
    setProcessing(true);
    await onConfirm();
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-xs text-white/40">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-sm text-white/50 mb-5">
          {message}
        </p>

        <div className="flex items-center justify-center mb-5">
          <div className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 font-mono text-2xl font-bold text-red-300 tracking-[0.3em]">
            {code}
          </div>
        </div>

        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          placeholder="Type the code above..."
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white font-mono tracking-widest outline-none focus:border-red-500/50 transition-colors placeholder:text-white/20 mb-4 text-center"
          maxLength={6}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-sm text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={input !== code || processing}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
              input === code && !processing
                ? "bg-red-500/80 hover:bg-red-500 text-white"
                : "bg-red-500/20 text-red-300/40 cursor-not-allowed"
            )}
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {processing ? `${action}...` : action}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const { roleOverride, setRoleOverride } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [pendingRoles, setPendingRoles] = useState({});
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [notAdmin, setNotAdmin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showClearAuditModal, setShowClearAuditModal] = useState(false);
  const [showDisconnectSlackModal, setShowDisconnectSlackModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("All Cards Deleted");
  const [viewAsRole, setViewAsRole] = useState(roleOverride);

  const isPreview = window.location.hostname.includes("base44.com") && window.location.hostname.includes("preview");
  const publishedOrigin = isPreview ? "" : window.location.origin;
  const [inviteBase, setInviteBase] = useState(publishedOrigin);
  const inviteLink = inviteBase ? inviteBase.replace(/\/$/, "") : "";

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const handleResetAllCards = async () => {
    const tasks = await base44.entities.Task.list();
    await Promise.all(tasks.map(t => base44.entities.Task.delete(t.id)));
    setShowResetModal(false);
    setSuccessMessage("All Cards Deleted");
    setShowSuccessModal(true);
  };

  const handleClearAuditLog = async () => {
    const logs = await base44.entities.AuditLog.list();
    await Promise.all(logs.map(l => base44.entities.AuditLog.delete(l.id)));
    setShowClearAuditModal(false);
    setSuccessMessage("Audit Log Cleared");
    setShowSuccessModal(true);
  };

  const handleDisconnectSlack = async () => {
    await base44.functions.invoke("disconnectSlack", {});
    setShowDisconnectSlackModal(false);
    setSuccessMessage("Slack Disconnected");
    setShowSuccessModal(true);
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
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">{successMessage}</h3>
            <p className="text-sm text-white/40 mb-5">
              {successMessage === "All Cards Deleted" 
                ? "The Kanban board has been successfully reset."
                : "The Audit Log has been successfully cleared."}
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {showResetModal && (
        <ConfirmModal
          title="Reset All Cards"
          message="All tasks on the Kanban board will be permanently deleted. To confirm, type the code below:"
          action="Delete All Cards"
          onClose={() => setShowResetModal(false)}
          onConfirm={handleResetAllCards}
        />
      )}

      {showClearAuditModal && (
        <ConfirmModal
          title="Clear Audit Log"
          message="All audit log entries will be permanently deleted. To confirm, type the code below:"
          action="Clear Audit Log"
          onClose={() => setShowClearAuditModal(false)}
          onConfirm={handleClearAuditLog}
        />
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin View</h2>
          <p className="text-sm text-white/30 mt-0.5">{users.length} team members</p>
        </div>
      </div>

      {/* Invite link */}
      <div className="mb-6 p-4 rounded-2xl bg-violet-500/[0.06] border border-violet-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Link className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">Invite Link</span>
        </div>
        <p className="text-xs text-white/40 mb-3">Share this link with anyone to invite them to the app. New users join as Team Members by default — you can promote them here.</p>
        {isPreview && (
          <div className="mb-2">
            <input
              value={inviteBase}
              onChange={e => setInviteBase(e.target.value)}
              placeholder="Enter your published URL, e.g. https://yourapp.base44.app"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/70 font-mono outline-none focus:border-violet-500/50 transition-colors placeholder:text-white/20"
            />
            <p className="text-[10px] text-white/25 mt-1">You're in the editor — paste your published app URL above (found in Dashboard → Domains).</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/50 font-mono truncate">
            {inviteLink || <span className="text-white/20 italic">Enter URL above</span>}
          </div>
          <button
            onClick={copyInviteLink}
            disabled={!inviteLink}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0",
              copied
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : inviteLink
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30"
                  : "bg-white/[0.03] text-white/20 border border-white/[0.06] cursor-not-allowed"
            )}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
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

      {/* View As Role */}
      <div className="mb-10 p-4 rounded-2xl bg-violet-500/[0.06] border border-violet-500/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300">👁️</div>
          <span className="text-sm font-semibold text-violet-300">View As Role</span>
        </div>
        <p className="text-xs text-white/40 mb-4">See what the app looks and feels like for different roles:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => {
                const newRole = viewAsRole === r.value ? null : r.value;
                setViewAsRole(newRole);
                setRoleOverride(newRole);
              }}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left",
                viewAsRole === r.value
                  ? `${r.bg} border-current scale-105`
                  : "bg-white/[0.02] border-white/[0.1] hover:border-white/[0.15]"
              )}
            >
              <div className={cn("text-xs font-bold mb-1", r.color)}>{r.label}</div>
              <div className="text-[11px] text-white/40">{r.description}</div>
              {viewAsRole === r.value && (
                <div className="mt-3 pt-3 border-t border-current/20 text-[10px] text-white/50">
                  ✓ Viewing as {r.label}
                </div>
              )}
            </button>
          ))}
        </div>
        {viewAsRole && (
          <div className="mt-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <div className="text-xs text-white/60 mb-2 font-medium">Permissions for {RoleConfig(viewAsRole).label}:</div>
            <ul className="text-[11px] text-white/40 space-y-1">
              {viewAsRole === "admin" && (
                <>
                  <li>✓ Full access to all features</li>
                  <li>✓ Can manage users and roles</li>
                  <li>✓ Can sync with Slack</li>
                  <li>✓ Can view and clear audit logs</li>
                  <li>✓ Can reset all cards</li>
                </>
              )}
              {viewAsRole === "team_lead" && (
                <>
                  <li>✓ Can move and edit cards on Kanban</li>
                  <li>✓ Can view audit log</li>
                  <li>✓ Cannot access Admin View</li>
                  <li>✓ Cannot sync with Slack</li>
                </>
              )}
              {viewAsRole === "user" && (
                <>
                  <li>✓ Can move cards on Kanban board</li>
                  <li>✓ Cards assigned to themselves only</li>
                  <li>✓ Cannot create or delete cards</li>
                  <li>✓ Cannot access Admin View</li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="mt-10 p-4 rounded-2xl bg-red-500/[0.04] border border-red-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold text-red-300">Danger Zone</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30">Permanently delete all cards from the Kanban board.</p>
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-all flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset All Cards
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30">Permanently delete all audit log entries.</p>
            <button
              onClick={() => setShowClearAuditModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-all flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Audit Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}