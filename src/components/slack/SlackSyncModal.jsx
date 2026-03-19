import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Hash, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SlackSyncModal({ open, onClose, onSynced, boardId, board }) {
  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const isBoardConnected = !!board?.slack_admin_user_id;
  const connectedAdminName = board?.slack_admin_user_name;

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    setSelectedChannel(null);

    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (isBoardConnected) fetchChannels();
    }).catch(() => {});
  }, [open, isBoardConnected]);

  const fetchChannels = async () => {
    setLoadingChannels(true);
    try {
      const res = await base44.functions.invoke("listSlackChannels", {});
      setChannels(res.data.channels || []);
    } catch (e) {
      setError("Failed to load channels: " + (e?.response?.data?.error || e.message));
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleSync = async () => {
    if (!selectedChannel) return;
    setSyncing(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("syncSlack", {
        channel_id: selectedChannel.id,
        channel_name: selectedChannel.name,
        board_id: boardId,
      });
      setResult(res.data);
      onSynced?.();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const iAmConnectedAdmin = currentUser?.id === board?.slack_admin_user_id;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-violet-400" />
            Sync from Slack
          </DialogTitle>
        </DialogHeader>

        {/* Board not connected to Slack */}
        {!isBoardConnected ? (
          <div className="text-center py-6">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-2">Slack Not Connected</h3>
            <p className="text-sm text-white/50">
              An admin must connect a Slack account to this board before syncing. Go to Slack Settings in the header.
            </p>
            <Button onClick={onClose} variant="ghost" className="mt-4 text-white/50">Close</Button>
          </div>
        ) : !iAmConnectedAdmin ? (
          /* Connected but not the connected admin */
          <div className="text-center py-6">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-2">Wrong Slack Account</h3>
            <p className="text-sm text-white/50">
              Only <span className="text-white/80 font-medium">{connectedAdminName}</span> can sync this board — they connected their Slack account to it.
            </p>
            <Button onClick={onClose} variant="ghost" className="mt-4 text-white/50">Close</Button>
          </div>
        ) : loadingChannels ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
          </div>
        ) : result ? (
          <div className="text-center py-6">
            <div className="text-3xl font-bold text-violet-400 mb-1">{result.created}</div>
            <p className="text-white/60 text-sm">new tasks created from {result.processed} messages</p>
            <Button onClick={onClose} className="mt-4 bg-violet-600 hover:bg-violet-500 border-0">Done</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-white/50 mb-3">Select a channel to import messages from:</p>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                    selectedChannel?.id === ch.id
                      ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                      : "text-white/70 hover:bg-white/[0.05] border border-transparent"
                  )}
                >
                  <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                  {ch.name}
                  {ch.num_members && <span className="ml-auto text-xs text-white/30">{ch.num_members} members</span>}
                </button>
              ))}
              {channels.length === 0 && <p className="text-white/30 text-sm text-center py-4">No channels found</p>}
            </div>

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

            <div className="flex gap-2 mt-4">
              <Button variant="ghost" onClick={onClose} className="flex-1 text-white/50 hover:text-white">Cancel</Button>
              <Button
                onClick={handleSync}
                disabled={!selectedChannel || syncing}
                className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 text-white"
              >
                {syncing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Syncing...</> : "Sync Channel"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}