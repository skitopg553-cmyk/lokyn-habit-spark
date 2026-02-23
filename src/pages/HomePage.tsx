import { useState, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
// StatBar supprimé
import BottomNav from "../components/BottomNav";
import { useTodayHabits, useCompleteHabit, useUserProfile, Habit } from "@/hooks/useHabits";
import { useLokynState, MESSAGES_BY_ETAT } from "@/hooks/useLokynState";
import { supabase } from "@/integrations/supabase/client";

const ICON_MAP: Record<string, string> = {
  sport: "fitness_center",
  projet: "work",
  connaissance: "menu_book",
  addiction: "block",
  mental: "self_improvement",
  nutrition: "water_drop",
};

const fireConfetti = () =>
  confetti({
    particleCount: 4,
    spread: 40,
    origin: { y: 0.8 },
    colors: ["#FF6B2B", "#ff8c57", "#ffb088", "#ff5500"],
    scalar: 0.6,
    gravity: 1.5,
  });

const HomePage = () => {
  const [message, setMessage] = useState("…");
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [lokynBounce, setLokynBounce] = useState(false);

  // Lokyn state data
  const [accountAgeDays, setAccountAgeDays] = useState(999);
  const [joursInactif, setJoursInactif] = useState(0);

  const { habits, refresh, setHabits } = useTodayHabits();
  const { profile, refresh: refreshProfile } = useUserProfile();
  const combinedRefresh = useCallback(() => {
    refresh();
    refreshProfile();
  }, [refresh, refreshProfile]);
  const { complete, uncomplete } = useCompleteHabit(combinedRefresh, setHabits);
  const xpActuel = profile?.xp_total || 0;
  const xpPercent = Math.min(Math.round((xpActuel % 100)), 100);

  const doneCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;
  const completionPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 100;

  const lokyn = useLokynState({
    streak: profile?.streak_actuel || 0,
    completionPercent,
    joursInactif,
    accountAgeDays,
  });

  // Fetch accountAgeDays and joursInactif on mount
  useEffect(() => {
    async function fetchLokynData() {
      // Account age from user_profile.created_at
      const { data: profileData } = await supabase
        .from("user_profile")
        .select("created_at")
        .eq("id", "local_user")
        .maybeSingle() as any;

      if (profileData?.created_at) {
        const created = new Date(profileData.created_at);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        setAccountAgeDays(diffDays);
      }

      // Count consecutive inactive days before today
      const today = new Date();
      const pastDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (i + 1));
        return d.toISOString().split("T")[0];
      });

      const { data: completions } = await supabase
        .from("completions")
        .select("date")
        .in("date", pastDates) as any;

      const completionDates = new Set((completions || []).map((c: any) => c.date));
      let inactif = 0;
      for (const date of pastDates) {
        if (!completionDates.has(date)) {
          inactif++;
        } else {
          break;
        }
      }
      setJoursInactif(inactif);
    }

    fetchLokynData();
  }, []);

  // Update bubble message when lokyn state changes
  useEffect(() => {
    const pool = MESSAGES_BY_ETAT[lokyn.etat];
    setMessage(pool[0]);
  }, [lokyn.etat]);

  useEffect(() => {
    const timer = setTimeout(() => setBubbleVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLokynTap = useCallback(() => {
    setLokynBounce(true);
    const pool = MESSAGES_BY_ETAT[lokyn.etat];
    const randomMsg = pool[Math.floor(Math.random() * pool.length)];
    setMessage(randomMsg);
    setTimeout(() => setLokynBounce(false), 200);
  }, [lokyn.etat]);

  const handleCheckbox = useCallback(
    (habit: Habit) => {
      if (habit.completed) {
        uncomplete(habit.id);
      } else {
        complete(habit.id);
        fireConfetti();
      }
    },
    [complete, uncomplete]
  );

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour, <span className="text-primary">{profile?.prenom || "Alex"}</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {totalCount > 0 ? `${doneCount}/${totalCount} faites aujourd'hui` : "Prêt pour tes défis ?"}
          </p>
        </div>
        <div className="flex items-center bg-primary/10 border border-primary/20 px-4 py-2 rounded-full">
          <span className="text-primary font-bold mr-1">{profile?.streak_actuel || 0}</span>
          <span className="material-symbols-outlined text-primary fill-1 leading-none text-xl">
            local_fire_department
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mascot Section */}
        <div className="relative flex flex-col items-center justify-center py-6 px-4">
          {/* Speech Bubble */}
          <div
            className="absolute top-0 right-10 z-10 transition-opacity duration-500"
            style={{ opacity: bubbleVisible ? 1 : 0 }}
          >
            <div className="bg-card/70 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl rounded-tr-none shadow-xl max-w-[200px]">
              <p className="text-sm font-medium leading-tight italic">"{message}"</p>
            </div>
          </div>

          {/* Lokyn Mascot — NO background, NO circle, just the image */}
          <div
            className="w-64 h-64 flex items-center justify-center cursor-pointer"
            onClick={handleLokynTap}
            style={{
              transform: lokynBounce ? "scale(1.08)" : "scale(1)",
              transition: "transform 200ms cubic-bezier(0.68, -0.55, 0.27, 1.55)",
            }}
          >
            <img
              src={lokyn.image}
              alt="Lokyn"
              className="w-48 h-48 object-contain select-none"
              style={{ mixBlendMode: "screen" }}
            />
          </div>

          {/* Lokyn state label */}
          <p className="text-xs text-muted-foreground italic mt-1 text-center">{lokyn.label}</p>

          {/* Vitality Bars */}
          <div className="w-full max-w-sm px-6 mt-8">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  XP
                </span>
                <span className="text-xs font-bold text-primary">
                  Niveau {profile?.niveau || 1}
                </span>
              </div>
              <span className="text-xs font-bold text-primary">
                {xpActuel % 100}/100
              </span>
            </div>
            <div className="h-3 w-full bg-card rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-primary rounded-full transition-all ease-out"
                style={{
                  width: `${xpPercent}%`,
                  transitionDuration: "800ms",
                  boxShadow: "0 0 12px hsl(18 100% 56% / 0.6)",
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 text-right">
              {100 - (xpActuel % 100)} XP avant le niveau suivant
            </p>
          </div>
        </div>

        {/* Habits Section */}
        <section className="mt-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-lg font-bold">Habitudes du jour</h2>
            <a className="text-primary text-xs font-bold uppercase tracking-wider" href="/habits">
              Voir tout
            </a>
          </div>
          <div className="flex overflow-x-auto gap-4 px-6 pb-4 hide-scrollbar">
            {habits.length === 0 && (
              <p className="text-muted-foreground text-sm italic">Aucune habitude — crée ta première !</p>
            )}
            {habits.map((habit, i) => (
              <div
                key={habit.id}
                className="flex-shrink-0 w-40 bg-card p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center"
                style={{ animation: `slide-up-fade 400ms ease-out ${i * 100}ms both` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-primary">
                    {ICON_MAP[habit.categorie] || "star"}
                  </span>
                </div>
                <p className="font-bold text-sm mb-3">{habit.nom}</p>
                <div
                  className={`w-6 h-6 border-2 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 ${
                    habit.completed ? "bg-success border-success" : "border-primary"
                  }`}
                  onClick={() => handleCheckbox(habit)}
                >
                  {habit.completed && (
                    <span className="material-symbols-outlined text-xs text-white">check</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default HomePage;
