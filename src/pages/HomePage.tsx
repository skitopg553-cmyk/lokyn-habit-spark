import { useState, useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import StatBar from "../components/StatBar";
import BottomNav from "../components/BottomNav";
import lokynColere from "@/assets/lokyn-colere.png";

const lokynMessages = [
  "Tu veux vraiment que je reste comme ça ?",
  "Je t'avais prévenu.",
  "Un effort. Juste un.",
  "...",
  "Tu me fais honte.",
  "Allez, bouge.",
];

const habits = [
  { id: 1, name: "Méditation", icon: "self_improvement", done: false },
  { id: 2, name: "Sport", icon: "fitness_center", done: true },
  { id: 3, name: "Lecture", icon: "menu_book", done: false },
  { id: 4, name: "Hydratation", icon: "water_drop", done: true },
];

const HomePage = () => {
  const [message, setMessage] = useState(lokynMessages[0]);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [lokynBounce, setLokynBounce] = useState(false);
  const [habitStates, setHabitStates] = useState(habits.map((h) => h.done));
  const [checkBounce, setCheckBounce] = useState<number | null>(null);
  const [fabRotated, setFabRotated] = useState(false);

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

  const handleCheckbox = useCallback((index: number) => {
    setCheckBounce(index);
    setHabitStates((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });

    // Mini confetti
    confetti({
      particleCount: 4,
      spread: 40,
      origin: { y: 0.8 },
      colors: ["#FF6B2B", "#ff8c57", "#ffb088", "#ff5500"],
      scalar: 0.6,
      gravity: 1.5,
    });

    setTimeout(() => setCheckBounce(null), 250);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour, <span className="text-primary">Alex</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Prêt pour tes défis ?</p>
        </div>
        <div className="flex items-center bg-primary/10 border border-primary/20 px-4 py-2 rounded-full">
          <span className="text-primary font-bold mr-1">7</span>
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
            className="w-64 h-64 flex items-center justify-center relative cursor-pointer"
            onClick={handleLokynTap}
            style={{
              animation: "lokyn-float 2.5s ease-in-out infinite",
              transform: lokynBounce ? "scale(1.08)" : "scale(1)",
              transition: "transform 200ms cubic-bezier(0.68, -0.55, 0.27, 1.55)",
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: "0 20px 60px rgba(255,107,43,0.3)",
              }}
            />
            <img
              src={lokynColere}
              alt="Lokyn"
              className="relative z-10 w-48 h-48 object-contain select-none"
            />
          </div>

          {/* Vitality Bars */}
          <div className="w-full max-w-sm px-6 mt-8 space-y-4">
            <StatBar label="Énergie" value={60} delay={0} />
            <StatBar label="Discipline" value={85} delay={150} />
            <StatBar label="Moral" value={50} delay={300} />
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
            {habits.map((habit, i) => (
              <div
                key={habit.id}
                className="flex-shrink-0 w-40 bg-card p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center"
                style={{
                  animation: `slide-up-fade 400ms ease-out ${i * 100}ms both`,
                }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-primary">{habit.icon}</span>
                </div>
                <p className="font-bold text-sm mb-3">{habit.name}</p>
                <div
                  className={`w-6 h-6 border-2 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 ${
                    habitStates[i]
                      ? "bg-success border-success"
                      : "border-primary"
                  }`}
                  onClick={() => handleCheckbox(i)}
                  style={{
                    animation: checkBounce === i ? "check-bounce 250ms cubic-bezier(0.68, -0.55, 0.27, 1.55)" : "none",
                  }}
                >
                  {habitStates[i] && (
                    <span className="material-symbols-outlined text-xs text-white">check</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FAB */}
      <div className="fixed bottom-24 right-6 z-50">
        <a
          href="/habits/new"
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 pl-4 pr-6 py-4 rounded-full shadow-[0_8px_20px_hsl(18_100%_56%_/_0.4)] transition-transform active:scale-95"
          onClick={() => {
            setFabRotated(true);
            setTimeout(() => setFabRotated(false), 150);
          }}
        >
          <span
            className="material-symbols-outlined font-bold"
            style={{
              transform: fabRotated ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform 150ms ease-out",
            }}
          >
            add
          </span>
          <span className="font-bold text-sm uppercase tracking-wide">Ajouter preuve</span>
        </a>
      </div>

      <BottomNav />
    </div>
  );
};

export default HomePage;
