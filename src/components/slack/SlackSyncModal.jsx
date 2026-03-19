import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Hash, Loader2, RefreshCw, Unplug } from "lucide-react";
import { cn } from "@/lib/utils";

const CONNECTOR_ID = "69bc1bbdaebca403c4460985";

export default function SlackSyncModal({ open, onClose, onSynced }) {
  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [notConnected, setNotConnected] = useState(false);

  useEffect(() => {
    if (open) {
      setResult(null);
      setError(null);
      setNotConnected(false);
      fetchChannels();
    }
  }, [open]);

  const fetchChannels = async () => {
    setLoadingChannels(true);
    try {
      const res = await base44.functions.invoke("listSlackChannels", {});
      setChannels(res.data.channels || []);
      setNotConnected(false);
    } catch (e) {
      // If token missing, treat as not connected
      if (e.message?.includes("not connected") || e.message?.includes("token") || e.message?.includes("connector")) {
        setNotConnected(true);
      } else {
        setError("Failed to load channels: " + e.message);
      }
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    window.open(url, "_blank");
    // Poll briefly to detect when user has connected
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const res = await base44.functions.invoke("listSlackChannels", {});
        setChannels(res.data.channels || []);
        setNotConnected(false);
        clearInterval(poll);
      } catch {
        // still not connected
      }
      if (attempts > 20) clearInterval(poll);
    }, 3000);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setChannels([]);
    setNotConnected(true);
  };

  const handleSync = async () => {
    if (!selectedChannel) return;
    setSyncing(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("syncSlack", { channel_id: selectedChannel.id, channel_name: selectedChannel.name });
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
        ) : notConnected ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Connect your Slack</h3>
            <p className="text-sm text-white/50 mb-5">Connect your Slack account to browse your channels and sync messages into tasks.</p>
            <Button
              onClick={handleConnect}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 text-white w-full"
            >
              Connect Slack Account
            </Button>
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
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-red-400 transition-colors"
              >
                <Unplug className="w-3.5 h-3.5" />
                Disconnect
              </button>
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