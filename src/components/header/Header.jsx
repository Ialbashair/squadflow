import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchModal from "@/components/search/SearchModal";

export default function Header({ title, subtitle, onSync, isSyncing }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-white/30 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="relative p-2.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
          >
            <Search className="w-4 h-4" />
          </button>
          <button className="relative p-2.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-violet-400 rounded-full" />
          </button>
          <Button
            onClick={onSync}
            disabled={isSyncing}
            className={cn(
              "ml-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500",
              "text-white text-sm font-medium rounded-xl px-5 h-10",
              "shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30",
              "transition-all duration-200 border-0"
            )}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
            {isSyncing ? "Syncing..." : "Sync with Slack"}
          </Button>
        </div>
      </header>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}