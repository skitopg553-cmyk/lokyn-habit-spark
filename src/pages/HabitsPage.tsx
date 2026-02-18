import { useState, useCallback, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import BottomNav from "../components/BottomNav";

interface Habit {
  id: number;
  name: string;
  icon: string;
  detail: string;
  done: boolean;
  proofRequired?: boolean;
  iconColor: string;
  iconBg: string;
  reported?: boolean;
}

const initialHabits: Habit[] = [
  { id: 1, name: "Méditation", icon: "self_improvement", detail: "10 mins • Quotidien", done: true, iconColor: "text-emerald-500", iconBg: "bg-emerald-500/20" },
  { id: 2, name: "Séance Sport", icon: "fitness_center", detail: "45 mins • 3x / semaine", done: false, proofRequired: true, iconColor: "text-primary", iconBg: "bg-primary/20" },
  { id: 3, name: "Lecture", icon: "menu_book", detail: "20 pages • Quotidien", done: false, iconColor: "text-blue-400", iconBg: "bg-blue-500/20" },
  { id: 4, name: "Hydratation", icon: "water_drop", detail: "2L • Quotidien", done: true, iconColor: "text-amber-500", iconBg: "bg-amber-500/20" },
  { id: 5, name: "Side Project", icon: "code", detail: "1h • 5x / semaine", done: false, iconColor: "text-purple-400", iconBg: "bg-purple-500/20" },
];

const days = [
  { short: "LUN", num: 22, active: true, dot: true },
  { short: "MAR", num: 23, active: false, dot: true },
  { short: "MER", num: 24, active: false, dot: true },
  { short: "JEU", num: 25, active: false, dot: false },
  { short: "VEN", num: 26, active: false, dot: false },
  { short: "SAM", num: 27, active: false, dot: false },
  { short: "DIM", num: 28, active: false, dot: false },
];

const HabitsPage = () => {
  const [habits, setHabits] = useState(initialHabits);
  const [selectedDay, setSelectedDay] = useState(0);
  const [progressAnimated, setProgressAnimated] = useState(false);
  const touchStartX = useRef<number>(0);
  const [swipingId, setSwipingId] = useState<number | null>(null);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);

  const doneCount = habits.filter((h) => h.done).length;
  const totalCount = habits.length;
  const percent = Math.round((doneCount / totalCount) * 100);

  useEffect(() => {
    const t = setTimeout(() => setProgressAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleTouchStart = (e: React.TouchEvent, id: number) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipingId(id);
    setSwipeProgress(0);
    setSwipeDir(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipingId === null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    const progress = Math.min(Math.abs(diff) / 120, 1);
    setSwipeProgress(progress);
    setSwipeDir(diff > 20 ? "right" : diff < -20 ? "left" : null);
  };

  const handleTouchEnd = () => {
    if (swipingId === null) return;
    if (swipeProgress > 0.5 && swipeDir) {
      if (swipeDir === "right") {
        // Validate
        setHabits((prev) =>
          prev.map((h) => (h.id === swipingId ? { ...h, done: true, reported: false } : h))
        );
        confetti({
          particleCount: 5,
          spread: 50,
          origin: { y: 0.7 },
          colors: ["#06D6A0", "#0efa8a", "#04b884"],
          scalar: 0.7,
          gravity: 1.5,
        });
      } else {
        // Report
        setHabits((prev) =>
          prev.map((h) => (h.id === swipingId ? { ...h, reported: true } : h))
        );
      }
    }
    setSwipingId(null);
    setSwipeProgress(0);
    setSwipeDir(null);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden pb-24">
      {/* Header */}
      <header className="p-6 pb-2 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-3xl font-bold tracking-tight">Habitudes</h1>
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 p-0.5 overflow-hidden">
            <div className="w-full h-full rounded-full bg-primary/30 flex items-center justify-center text-xs">
              👤
            </div>
          </div>
        </div>
        <p className="text-muted-foreground font-medium text-lg">Lundi 22 Mai</p>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-primary">{doneCount}/{totalCount} faites aujourd'hui</span>
            <span className="text-xs text-muted-foreground">{percent}% complété</span>
          </div>
          <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all ease-out"
              style={{
                width: progressAnimated ? `${percent}%` : "0%",
                transitionDuration: "800ms",
                boxShadow: progressAnimated ? "0 0 8px hsl(18 100% 56% / 0.5)" : "none",
              }}
            />
          </div>
        </div>
      </header>

      {/* Weekly Calendar */}
      <section className="px-6 py-4">
        <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-4">Cette semaine</h2>
        <div className="flex justify-between items-center overflow-x-auto gap-2 hide-scrollbar">
          {days.map((day, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 cursor-pointer"
              onClick={() => setSelectedDay(i)}
            >
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{day.short}</span>
              <div
                className={`w-10 h-14 flex flex-col items-center justify-center rounded-xl transition-all duration-200 ${
                  selectedDay === i
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-white/5 opacity-60"
                }`}
              >
                <span className="text-lg font-bold">{day.num}</span>
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    selectedDay === i
                      ? "bg-white"
                      : day.dot
                      ? "bg-primary"
                      : "bg-white/10"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Habits List */}
      <main className="flex-1 px-6 pt-4 pb-32 space-y-4">
        <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Aujourd'hui</h2>

        {habits.map((habit, i) => (
          <div
            key={habit.id}
            className={`relative p-4 rounded-xl flex items-center gap-4 overflow-hidden transition-all duration-200 ${
              habit.done
                ? "bg-white/5 border border-white/5 opacity-70"
                : habit.proofRequired
                ? "bg-white/5 border-2 border-primary/20"
                : "bg-white/5 border border-white/5 shadow-sm"
            } ${habit.reported ? "opacity-50" : ""}`}
            style={{
              animation: `slide-up-fade 400ms ease-out ${i * 80}ms both`,
              background:
                swipingId === habit.id && swipeDir === "right"
                  ? `linear-gradient(to right, hsl(163 96% 43% / ${swipeProgress * 0.3}), transparent)`
                  : swipingId === habit.id && swipeDir === "left"
                  ? `linear-gradient(to left, hsl(348 86% 61% / ${swipeProgress * 0.3}), transparent)`
                  : undefined,
            }}
            onTouchStart={(e) => !habit.done && handleTouchStart(e, habit.id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Swipe icons */}
            {swipingId === habit.id && swipeDir === "right" && (
              <div
                className="absolute left-4 text-success font-bold"
                style={{ opacity: swipeProgress }}
              >
                ✓
              </div>
            )}
            {swipingId === habit.id && swipeDir === "left" && (
              <div
                className="absolute right-4 text-muted-foreground"
                style={{ opacity: swipeProgress }}
              >
                ↷
              </div>
            )}

            <div className={`w-12 h-12 rounded-lg ${habit.iconBg} ${habit.iconColor} flex items-center justify-center`}>
              <span className="material-symbols-outlined">{habit.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-bold ${habit.done ? "line-through decoration-primary/50" : ""}`}>
                  {habit.name}
                </h3>
                {habit.proofRequired && !habit.done && (
                  <span
                    className="inline-block bg-primary text-[9px] uppercase font-black px-2 py-0.5 rounded-full text-primary-foreground"
                    style={{
                      animation: "badge-pulse 2s infinite, badge-vibrate 0.3s 5s infinite",
                    }}
                  >
                    Preuve requise
                  </span>
                )}
                {habit.reported && (
                  <span className="text-xs text-muted-foreground">Reporté</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{habit.detail}</p>
            </div>
            {habit.done ? (
              <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">check</span>
              </div>
            ) : habit.proofRequired ? (
              <div className="w-8 h-8 rounded-full border-2 border-primary/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-sm">add_a_photo</span>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center" />
            )}
          </div>
        ))}
      </main>

      {/* FAB */}
      <div className="fixed bottom-24 right-6 z-20">
        <a
          href="/habits/new"
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 px-6 py-4 rounded-full shadow-2xl shadow-primary/40 font-bold transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ transition: "transform 150ms" }}>
            add
          </span>
          <span>Nouvelle habitude</span>
        </a>
      </div>

      <BottomNav />
    </div>
  );
};

export default HabitsPage;
