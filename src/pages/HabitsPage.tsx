import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import BottomNav from "../components/BottomNav";
import { useTodayHabits, useCompleteHabit, getWeekDays, useDaysWithActivity } from "@/hooks/useHabits";

const ICON_MAP: Record<string, { icon: string; color: string; bg: string }> = {
  sport: { icon: "fitness_center", color: "text-primary", bg: "bg-primary/20" },
  projet: { icon: "work", color: "text-purple-400", bg: "bg-purple-500/20" },
  connaissance: { icon: "menu_book", color: "text-blue-400", bg: "bg-blue-500/20" },
  addiction: { icon: "block", color: "text-red-400", bg: "bg-red-500/20" },
  mental: { icon: "self_improvement", color: "text-emerald-500", bg: "bg-emerald-500/20" },
  nutrition: { icon: "water_drop", color: "text-amber-500", bg: "bg-amber-500/20" },
};

const JOUR_LABELS_UPPER = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

const HabitsPage = () => {
  const weekDays = useMemo(() => getWeekDays(), []);
  const todayIndex = weekDays.findIndex((d) => d.isToday);
  const [selectedDay, setSelectedDay] = useState(todayIndex >= 0 ? todayIndex : 0);
  const selectedDateStr = weekDays[selectedDay]?.dateStr;

  const { habits, loading, refresh } = useTodayHabits(selectedDateStr);
  const { complete, uncomplete } = useCompleteHabit(refresh);

  const weekDateStrs = useMemo(() => weekDays.map((d) => d.dateStr), [weekDays]);
  const activeDates = useDaysWithActivity(weekDateStrs);

  const [progressAnimated, setProgressAnimated] = useState(false);
  const touchStartX = useRef<number>(0);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  const doneCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;
  const percent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setProgressAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
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
      const habit = habits.find((h) => h.id === swipingId);
      if (swipeDir === "right" && habit && !habit.completed) {
        complete(habit.id, habit.preuve_requise);
        confetti({
          particleCount: 5,
          spread: 50,
          origin: { y: 0.7 },
          colors: ["#06D6A0", "#0efa8a", "#04b884"],
          scalar: 0.7,
          gravity: 1.5,
        });
      } else if (swipeDir === "left") {
        setReportedIds((prev) => new Set(prev).add(swipingId));
      }
    }
    setSwipingId(null);
    setSwipeProgress(0);
    setSwipeDir(null);
  };

  // Format selected day header
  const selectedDate = weekDays[selectedDay]?.date;
  const dateHeader = selectedDate
    ? selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    : "";

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
        <p className="text-muted-foreground font-medium text-lg capitalize">{dateHeader}</p>

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
          {weekDays.map((day, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 cursor-pointer"
              onClick={() => setSelectedDay(i)}
            >
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{JOUR_LABELS_UPPER[i]}</span>
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
                      : activeDates.includes(day.dateStr)
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

        {loading && <p className="text-muted-foreground text-sm">Chargement...</p>}
        {!loading && habits.length === 0 && (
          <p className="text-muted-foreground text-sm italic">Aucune habitude prévue ce jour.</p>
        )}

        {habits.map((habit, i) => {
          const mapping = ICON_MAP[habit.categorie] || { icon: "star", color: "text-primary", bg: "bg-primary/20" };
          const isReported = reportedIds.has(habit.id);

          return (
            <div
              key={habit.id}
              className={`relative p-4 rounded-xl flex items-center gap-4 overflow-hidden transition-all duration-200 ${
                habit.completed
                  ? "bg-white/5 border border-white/5 opacity-70"
                  : habit.preuve_requise
                  ? "bg-white/5 border-2 border-primary/20"
                  : "bg-white/5 border border-white/5 shadow-sm"
              } ${isReported ? "opacity-50" : ""}`}
              style={{
                animation: `slide-up-fade 400ms ease-out ${i * 80}ms both`,
                background:
                  swipingId === habit.id && swipeDir === "right"
                    ? `linear-gradient(to right, hsl(163 96% 43% / ${swipeProgress * 0.3}), transparent)`
                    : swipingId === habit.id && swipeDir === "left"
                    ? `linear-gradient(to left, hsl(348 86% 61% / ${swipeProgress * 0.3}), transparent)`
                    : undefined,
              }}
              onTouchStart={(e) => !habit.completed && handleTouchStart(e, habit.id)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Swipe icons */}
              {swipingId === habit.id && swipeDir === "right" && (
                <div className="absolute left-4 text-success font-bold" style={{ opacity: swipeProgress }}>✓</div>
              )}
              {swipingId === habit.id && swipeDir === "left" && (
                <div className="absolute right-4 text-muted-foreground" style={{ opacity: swipeProgress }}>↷</div>
              )}

              <div className={`w-12 h-12 rounded-lg ${mapping.bg} ${mapping.color} flex items-center justify-center`}>
                <span className="material-symbols-outlined">{mapping.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold ${habit.completed ? "line-through decoration-primary/50" : ""}`}>
                    {habit.nom}
                  </h3>
                  {habit.preuve_requise && !habit.completed && (
                    <span
                      className="inline-block bg-primary text-[9px] uppercase font-black px-2 py-0.5 rounded-full text-primary-foreground"
                      style={{ animation: "badge-pulse 2s infinite" }}
                    >
                      Preuve requise
                    </span>
                  )}
                  {isReported && <span className="text-xs text-muted-foreground">Reporté</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {habit.frequence === "daily" || habit.frequence === "recurring" ? "Quotidien" : habit.frequence} • {habit.xp_estime} XP
                </p>
              </div>
              {habit.completed ? (
                <div
                  className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center cursor-pointer"
                  onClick={() => uncomplete(habit.id)}
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                </div>
              ) : habit.preuve_requise ? (
                <div className="w-8 h-8 rounded-full border-2 border-primary/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm">add_a_photo</span>
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center cursor-pointer"
                  onClick={() => complete(habit.id, false)}
                />
              )}
            </div>
          );
        })}
      </main>

      {/* FAB */}
      <div className="fixed bottom-24 right-6 z-20">
        <a
          href="/habits/new"
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 px-6 py-4 rounded-full shadow-2xl shadow-primary/40 font-bold transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ transition: "transform 150ms" }}>add</span>
          <span>Nouvelle habitude</span>
        </a>
      </div>

      <BottomNav />
    </div>
  );
};

export default HabitsPage;
