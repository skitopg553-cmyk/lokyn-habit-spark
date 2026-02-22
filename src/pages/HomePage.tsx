import { useState, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
// StatBar supprimé
import BottomNav from "../components/BottomNav";
import lokynColere from "@/assets/lokyn-colere.png";
import { useTodayHabits, useCompleteHabit, useUserProfile, Habit } from "@/hooks/useHabits";

const lokynMessages = [
  "Tu veux vraiment que je reste comme ça ?",
  "Je t'avais prévenu.",
  "Un effort. Juste un.",
  "...",
  "Tu me fais honte.",
  "Allez, bouge.",
];

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
  const [message, setMessage] = useState(lokynMessages[0]);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [lokynBounce, setLokynBounce] = useState(false);

  const { habits, refresh } = useTodayHabits();
  const { complete, uncomplete } = useCompleteHabit(refresh);
  const { profile } = useUserProfile();
  const xpActuel = profile?.xp_total || 0;
  const xpPercent = Math.min(Math.round((xpActuel % 100)), 100);

  useEffect(() => {
    const timer = setTimeout(() => setBubbleVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLokynTap = useCallback(() => {
    setLokynBounce(true);
    const randomMsg = lokynMessages[Math.floor(Math.random() * lokynMessages.length)];
    setMessage(randomMsg);
    setTimeout(() => setLokynBounce(false), 200);
  }, []);

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

  const doneCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;

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
              animation: "lokyn-float 2.5s ease-in-out infinite",
              transform: lokynBounce ? "scale(1.08)" : "scale(1)",
              transition: "transform 200ms cubic-bezier(0.68, -0.55, 0.27, 1.55)",
            }}
          >
            <img
              src={lokynColere}
              alt="Lokyn"
              className="w-48 h-48 object-contain select-none"
              style={{ filter: "drop-shadow(0 10px 20px rgba(255,107,43,0.35))" }}
            />
          </div>

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
