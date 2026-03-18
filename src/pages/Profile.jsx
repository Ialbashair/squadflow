import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, Mail, Shield, LogOut, Save, Loader2 } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setFullName(u.full_name || "");
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ full_name: fullName });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  const role = user?.role ?? "user";
  const roleDisplay = role === "admin" ? { label: "Admin", cls: "bg-violet-500/20 text-violet-300 border-violet-500/30" }
    : role === "team_lead" ? { label: "Team Lead", cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" }
    : { label: "Team Member", cls: "bg-slate-500/20 text-slate-400 border-slate-500/30" };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white tracking-tight mb-8">Profile</h2>

      {/* Avatar + role */}
      <div className="flex items-center gap-5 mb-8 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-violet-500/20 flex-shrink-0">
          {(user?.full_name || user?.email || "?")[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-white truncate">{user?.full_name || "Unnamed"}</p>
          <p className="text-sm text-white/40 truncate">{user?.email}</p>
          <div className={cn(
            "inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold border",
            roleDisplay.cls
          )}>
            <Shield className="w-3 h-3" />
            {roleDisplay.label}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="space-y-4 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Account Details</h3>

        <div>
          <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-1.5 block">Display Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-1.5 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              value={user?.email || ""}
              disabled
              className="w-full bg-white/[0.02] border border-white/[0.04] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white/30 outline-none cursor-not-allowed"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || fullName === user?.full_name}
          className={cn(
            "w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500",
            "text-white text-sm font-medium rounded-xl h-10 border-0",
            "shadow-lg shadow-violet-500/20 disabled:opacity-40 transition-all"
          )}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Permissions info */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] mb-4">
        <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Permissions</h3>
        <ul className="space-y-2 text-sm text-white/50">
          <li className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", role === "admin" ? "bg-emerald-400" : "bg-slate-600")} />
            Admin View &amp; user management
            {role !== "admin" && <span className="ml-auto text-[10px] text-white/20">Admin only</span>}
          </li>
          <li className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", role === "admin" ? "bg-emerald-400" : "bg-slate-600")} />
            Sync with Slack / manage integrations
            {role !== "admin" && <span className="ml-auto text-[10px] text-white/20">Admin only</span>}
          </li>
          <li className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", (role === "admin" || role === "team_lead") ? "bg-emerald-400" : "bg-slate-600")} />
            Move &amp; edit cards
            {role === "user" && <span className="ml-auto text-[10px] text-white/20">Admin &amp; Team Lead</span>}
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Move cards on Kanban (assign to self)
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            View boards &amp; search tasks
          </li>
        </ul>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06] border border-transparent hover:border-red-500/20 transition-all"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );
}