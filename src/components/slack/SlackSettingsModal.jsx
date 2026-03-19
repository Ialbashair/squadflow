import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, CheckCircle2, Unplug, ExternalLink } from "lucide-react";

const CONNECTOR_ID = "69bc1bbdaebca403c4460985";

export default function SlackSettingsModal({ open, onClose, boardId, board, onUpdated }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [mySlackConnected, setMySlackConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(null);

  const boardSlackAdminId = board?.slack_admin_user_id;
  const boardSlackAdminName = board?.slack_admin_user_name;
  const isBoardConnected = !!boardSlackAdminId;
  const iAmTheConnectedAdmin = boardSlackAdminId === currentUser?.id;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoading(true);

    base44.auth.me().then(async (u) => {
      setCurrentUser(u);
      // Check if the current user has Slack connected
      try {
        const res = await base44.functions.invoke("listSlackChannels", {});
        setMySlackConnected(!!res.data?.channels);
      } catch {
        setMySlackConnected(false);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [open]);

  const handleConnectMySlack = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    window.open(url, "_blank");
    // Poll to detect connection
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const res = await base44.functions.invoke("listSlackChannels", {});
        if (res.data?.channels) {
          setMySlackConnected(true);
          clearInterval(poll);
        }
      } catch { /* still not connected */ }
      if (attempts > 20) clearInterval(poll);
    }, 3000);
  };

  const handleConnectToBoard = async () => {
    setConnecting(true);
    setError(null);
    try {
      await base44.functions.invoke("connectBoardSlack", { board_id: boardId });
      onUpdated?.();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to connect");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      await base44.functions.invoke("disconnectBoardSlack", { board_id: boardId });
      onUpdated?.();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-violet-400" />
            Slack Integration Settings
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Board connection status */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <p className="text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">Board Connection</p>
              {isBoardConnected ? (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-white/80 font-medium">Connected</p>
                    <p className="text-xs text-white/40">via {boardSlackAdminName}'s account</p>
                  </div>
                  {iAmTheConnectedAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                    >
                      {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unplug className="w-3 h-3 mr-1" />}
                      Disconnect
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-white/50 mb-3">No Slack account connected to this board.</p>
                  {mySlackConnected ? (
                    <Button
                      onClick={handleConnectToBoard}
                      disabled={connecting}
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 text-white"
                    >
                      {connecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Connect My Slack to This Board
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-white/40">First, connect your personal Slack account:</p>
                      <Button
                        onClick={handleConnectMySlack}
                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 text-white"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Connect Slack Account
                      </Button>
                      {mySlackConnected && (
                        <Button
                          onClick={handleConnectToBoard}
                          disabled={connecting}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 border-0 text-white"
                        >
                          {connecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Connect My Slack to This Board
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info box */}
            <div className="p-3 rounded-xl bg-violet-500/[0.06] border border-violet-500/20">
              <p className="text-xs text-violet-300/70 leading-relaxed">
                Only one Slack account can be connected per board at a time. Once connected, board admins can sync any channel from that account. Only the admin who connected Slack can disconnect it.
              </p>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}