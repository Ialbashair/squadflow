import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Hash, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SlackSyncModal({ open, onClose, onSynced }) {
  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setResult(null);
      setError(null);
      fetchChannels();
    }
  }, [open]);

  const fetchChannels = async () => {
    setLoadingChannels(true);
    try {
      const res = await base44.functions.invoke("listSlackChannels", {});
      setChannels(res.data.channels || []);
    } catch (e) {
      setError("Failed to load channels: " + e.message);
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleSync = async () => {
    if (!selectedChannel) return;
    setSyncing(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("syncSlack", { channel_id: selectedChannel.id });
      setResult(res.data);
      onSynced?.();
    } catch (e) {
      setError("Sync failed: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-violet-400" />
            Sync from Slack
          </DialogTitle>
        </DialogHeader>

        {loadingChannels ? (
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