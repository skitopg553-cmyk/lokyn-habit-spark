import { useState, useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import BottomNav from "../components/BottomNav";
import { useTodayHabits, useCompleteHabit, useUserProfile, Habit } from "@/hooks/useHabits";
import { useLokynState, MESSAGES_BY_ETAT } from "@/hooks/useLokynState";
import { supabase } from "@/integrations/supabase/client";
import lokynDecu from "@/assets/lokyn-decu.png";
import { ICON_MAP } from "@/lib/utils";
import { haptic } from "@/lib/haptic";

const fireConfetti = () =>
  confetti({
    particleCount: 4,
    spread: 40,
    origin: { y: 0.8 },
    colors: ["#FF6B2B", "#ff8c57", "#ffb088", "#ff5500"],
    scalar: 0.6,
    gravity: 1.5,
  });

const PULL_THRESHOLD = 65;

const HomePage = () => {
  const [message, setMessage] = useState("…");
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [lokynBounce, setLokynBounce] = useState(false);
  const [accountAgeDays, setAccountAgeDays] = useState(999);
  const [joursInactif, setJoursInactif] = useState(0);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const { habits, refresh, setHabits } = useTodayHabits();
  const { profile, refresh: refreshProfile, setProfile } = useUserProfile();
  const combinedRefresh = useCallback(() => {
    return Promise.all([refresh(), refreshProfile()]);
  }, [refresh, refreshProfile]);
  const { complete, uncomplete } = useCompleteHabit(combinedRefresh, setHabits, undefined, setProfile);

  // XP bar animation state
  const [xpDisplay, setXpDisplay] = useState(0);
  const [niveauDisplay, setNiveauDisplay] = useState(1);
  const [xpBarTransition, setXpBarTransition] = useState("600ms");
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const prevNiveauRef = useRef<number>(-1);

  useEffect(() => {
    if (!profile) return;
    const currentNiveau = profile.niveau || 1;
    const currentXpPercent = Math.min(Math.round(profile.xp_total % 100), 100);
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    if (prevNiveauRef.current !== -1 && currentNiveau > prevNiveauRef.current) {
      setIsLevelingUp(true);
      haptic("levelup");
      setXpBarTransition("600ms");
      setXpDisplay(100);
      t1 = setTimeout(() => {
        setNiveauDisplay(currentNiveau);
        setXpBarTransition("0ms");
        setXpDisplay(0);
        t2 = setTimeout(() => {
          setXpBarTransition("400ms");
          setXpDisplay(currentXpPercent);
          setIsLevelingUp(false);
        }, 50);
      }, 700);
    } else {
      setXpBarTransition("600ms");
      setXpDisplay(currentXpPercent);
      setNiveauDisplay(currentNiveau);
    }
    prevNiveauRef.current = currentNiveau;

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [profile?.niveau, profile?.xp_total]);

  const doneCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;
  const completionPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 100;

  // Confetti + haptic when all done
  const prevDoneRef = useRef(0);
  useEffect(() => {
    if (
      totalCount > 0 &&
      doneCount === totalCount &&
      prevDoneRef.current < totalCount
    ) {
      haptic("success");
    }
    prevDoneRef.current = doneCount;
  }, [doneCount, totalCount]);

  const lokyn = useLokynState({
    streak: profile?.streak_actuel || 0,
    completionPercent,
    joursInactif,
    accountAgeDays,
  });

  useEffect(() => {
    async function fetchLokynData() {
      const cachedAge = localStorage.getItem("lokyn_account_age_days");
      const cachedAgeTime = localStorage.getItem("lokyn_account_age_updated");
      const ageMs = cachedAgeTime ? Date.now() - parseInt(cachedAgeTime) : Infinity;

      if (cachedAge !== null && ageMs < 86_400_000) {
        setAccountAgeDays(parseInt(cachedAge));
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        const profileQuery = supabase.from("user_profile").select("created_at") as any;
        const { data: profileData } = await (uid
          ? profileQuery.eq("auth_id", uid)
          : profileQuery.eq("id", "local_user")
        ).maybeSingle();

        if (profileData?.created_at) {
          const diffDays = Math.floor((Date.now() - new Date(profileData.created_at).getTime()) / 86_400_000);
          setAccountAgeDays(diffDays);
          localStorage.setItem("lokyn_account_age_days", String(diffDays));
          localStorage.setItem("lokyn_account_age_updated", String(Date.now()));
        } else {
          setAccountAgeDays(99);
          localStorage.setItem("lokyn_account_age_days", "99");
          localStorage.setItem("lokyn_account_age_updated", String(Date.now()));
        }
      }

      const cachedInactif = localStorage.getItem("lokyn_jours_inactif");
      if (cachedInactif !== null) {
        setJoursInactif(parseInt(cachedInactif));
      } else {
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
          if (!completionDates.has(date)) inactif++;
          else break;
        }
        setJoursInactif(inactif);
        localStorage.setItem("lokyn_jours_inactif", String(inactif));
      }
    }
    fetchLokynData();
  }, []);

  useEffect(() => {
    const pool = MESSAGES_BY_ETAT[lokyn.etat];
    setMessage(pool[0]);
  }, [lokyn.etat]);

  useEffect(() => {
    const timer = setTimeout(() => setBubbleVisible(true), 500);

    const interval = setInterval(() => {
      setBubbleVisible(false);
      setTimeout(() => {
        const pool = MESSAGES_BY_ETAT[lokyn.etat];
        const randomMsg = pool[Math.floor(Math.random() * pool.length)];
        setMessage(randomMsg);
        setBubbleVisible(true);
      }, 500); // Wait for fade out to complete
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [lokyn.etat]);

  const handleLokynTap = useCallback(() => {
    haptic("light");
    setLokynBounce(true);
    const pool = MESSAGES_BY_ETAT[lokyn.etat];
    const randomMsg = pool[Math.floor(Math.random() * pool.length)];
    setMessage(randomMsg);
    setTimeout(() => setLokynBounce(false), 200);
  }, [lokyn.etat]);

  const handleCheckbox = useCallback(
    (habit: Habit) => {
      if (habit.completed) {
        haptic("light");
        uncomplete(habit.id, habit.xp_estime);
      } else {
        haptic("light");
        complete(habit.id, habit.xp_estime);
        fireConfetti();
      }
    },
    [complete, uncomplete]
  );

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY !== 0) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setPullDistance(Math.min(delta * 0.4, PULL_THRESHOLD));
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      haptic("light");
      setIsRefreshing(true);
      await combinedRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div
      className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden pb-24"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-center z-30 pointer-events-none overflow-hidden"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance / PULL_THRESHOLD,
          transition: pullDistance === 0 ? "height 300ms ease, opacity 300ms ease" : "none",
        }}
      >
        <div className="flex items-center justify-center">
          <span
            className="material-symbols-outlined text-primary text-xl"
            style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }}
          >
            {isRefreshing ? "refresh" : "arrow_downward"}
          </span>
        </div>
      </div>

      {/* Content shifts down during pull */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? "transform 300ms ease" : "none",
        }}
      >
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

            {/* Lokyn Mascot */}
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
                width={192}
                height={192}
              />
            </div>

            <p className="text-xs text-muted-foreground italic mt-1 text-center">{lokyn.label}</p>

            {/* XP Bar */}
            <div className="w-full max-w-sm px-6 mt-8">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                    XP
                  </span>
                  <span className={`text-xs font-bold text-primary ${isLevelingUp ? "scale-110" : ""} transition-transform`}>
                    Niveau {niveauDisplay}
                  </span>
                </div>
                <span className="text-xs font-bold text-primary">
                  {xpDisplay}/100
                </span>
              </div>
              <div className="h-3 w-full bg-card rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-primary rounded-full transition-all ease-out"
                  style={{
                    width: `${xpDisplay}%`,
                    transitionDuration: xpBarTransition,
                    boxShadow: "0 0 12px hsl(18 100% 56% / 0.6)",
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-right">
                {100 - xpDisplay} XP avant le niveau suivant
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
                <div className="flex flex-col items-center justify-center p-6 bg-card border border-white/5 rounded-2xl w-full text-center mx-4">
                  <img src={lokynDecu} alt="Lokyn s'ennuie" className="w-16 h-16 object-contain mb-3 opacity-80" loading="lazy" width={64} height={64} />
                  <p className="text-muted-foreground text-sm font-medium mb-4">Lokyn s'ennuie. Crée ta première habitude.</p>
                  <a href="/habits/new" className="bg-primary/20 text-primary font-bold px-4 py-2 rounded-xl text-sm transition-colors active:scale-95 border border-primary/30">
                    Nouvelle habitude
                  </a>
                </div>
              )}
              {habits.map((habit, i) => (
                <div
                  key={habit.id}
                  className="flex-shrink-0 w-40 bg-card p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center"
                  style={{ animation: `slide-up-fade 400ms ease-out ${i * 100}ms both` }}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-primary">
                      {ICON_MAP[habit.categorie]?.icon || "star"}
                    </span>
                  </div>
                  <p className="font-bold text-sm mb-3">{habit.nom}</p>
                  <div
                    className={`w-6 h-6 border-2 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 ${habit.completed ? "bg-success border-success" : "border-primary"
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
      </div>

      <BottomNav />
    </div>
  );
};

export default HomePage;
