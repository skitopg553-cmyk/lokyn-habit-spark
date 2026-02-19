import { useState } from "react";
import BottomNav from "../components/BottomNav";

const mockFriends = [
  {
    id: "1",
    prenom: "Lucas",
    status: "en_forme",
    message: "Lucas vient de finir sa 3e séance. Lokyn respire la santé.",
    time: "Il y a 2h",
    trend: "up",
  },
  {
    id: "2",
    prenom: "Marie",
    status: "en_galere",
    message: "Marie inactive depuis 2 jours. Lokyn s'est affalé sur le canapé.",
    time: "Il y a 5h",
    trend: "down",
  },
  {
    id: "3",
    prenom: "Thomas",
    status: "en_galere",
    message: "Thomas a besoin d'un coup de boost. Ton Lokyn commence à s'inquiéter.",
    time: "Aujourd'hui, 09:12",
    trend: "down",
  },
];

const reactions = ["🔥", "💀", "👏", "😬"];

const SocialPage = () => {
  const [filter, setFilter] = useState<"tous" | "en_forme" | "en_galere">("tous");
  const [sentReactions, setSentReactions] = useState<Record<string, string>>({});

  const filtered = mockFriends.filter(f =>
    filter === "tous" ? true : f.status === filter
  );

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden pb-24">

      <header className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold tracking-tight">Ton réseau</h1>
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-muted-foreground cursor-pointer">group</span>
            <span className="material-symbols-outlined text-primary cursor-pointer">person_add</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {mockFriends.filter(f => f.status === "en_galere").length} amis en galère aujourd'hui 👀
        </p>
      </header>

      {/* Filter pills */}
      <div className="flex gap-2 px-6 mb-6">
        {(["tous", "en_forme", "en_galere"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground"
            }`}
          >
            {f === "tous" ? "Tous" : f === "en_forme" ? "En forme" : "En galère"}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="px-6 space-y-4">
        {/* Défi card */}
        <div
          className="bg-card border border-primary/30 rounded-2xl p-4"
          style={{ animation: "slide-up-fade 400ms ease-out both" }}
        >
          <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">
            ⚡ DÉFI
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">bolt</span>
            </div>
            <div>
              <p className="font-bold text-sm">Challenge Éclair</p>
              <p className="text-xs text-muted-foreground">50 pompes ensemble avant minuit</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-transform">
              Accepter
            </button>
            <button className="flex-1 py-2.5 rounded-xl bg-surface text-muted-foreground font-bold text-sm active:scale-95 transition-transform">
              Ignorer
            </button>
          </div>
        </div>

        {/* Friend cards */}
        {filtered.map((friend, i) => (
          <div
            key={friend.id}
            className="bg-card rounded-2xl p-4"
            style={{ animation: `slide-up-fade 400ms ease-out ${(i + 1) * 80}ms both` }}
          >
            <div className="flex gap-3 mb-3">
              {/* Lokyn avatar placeholder */}
              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-xl shrink-0">
                🐟
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-sm">{friend.prenom}</p>
                  <span className={`material-symbols-outlined text-sm ${friend.trend === "up" ? "text-success" : "text-destructive"}`}>
                    {friend.trend === "up" ? "trending_up" : "trending_down"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{friend.message}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{friend.time}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <div className="flex gap-3">
                {reactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSentReactions(prev => ({ ...prev, [friend.id]: emoji }))}
                    className={`text-lg transition-transform active:scale-125 ${
                      sentReactions[friend.id] === emoji ? "scale-125" : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button className="text-xs text-primary font-bold">
                Commenter →
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default SocialPage;
