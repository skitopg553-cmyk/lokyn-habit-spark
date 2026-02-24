import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useTodayHabits, useCompleteHabit, useUserProfile, getWeekDays, useDaysWithActivity } from "@/hooks/useHabits";
import { ICON_MAP } from "@/lib/utils";
import { haptic } from "@/lib/haptic";

const JOUR_LABELS_UPPER = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const PULL_THRESHOLD = 65;

const HabitsPage = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const todayIndex = weekDays.findIndex((d) => d.isToday);
  const [selectedDay, setSelectedDay] = useState(todayIndex >= 0 ? todayIndex : 0);
  const selectedDateStr = weekDays[selectedDay]?.dateStr;
  const isSelectedFuture = weekDays[selectedDay]?.isFuture;

  useEffect(() => {
    if (weekOffset === 0 && todayIndex >= 0) {
      setSelectedDay(todayIndex);
    } else if (weekOffset !== 0) {
      setSelectedDay(0);
    }
  }, [weekOffset, todayIndex]);

  const { habits, loading, refresh, setHabits } = useTodayHabits(selectedDateStr);
  const { refresh: refreshProfile, setProfile } = useUserProfile();
  const combinedRefresh = useCallback(() => {
    return Promise.all([refresh(), refreshProfile()]);
  }, [refresh, refreshProfile]);
  const { complete, uncomplete } = useCompleteHabit(combinedRefresh, setHabits, selectedDateStr, setProfile);

  const weekDateStrs = useMemo(() => weekDays.map((d) => d.dateStr), [weekDays]);
  const activeDates = useDaysWithActivity(weekDateStrs);

  const [progressAnimated, setProgressAnimated] = useState(false);
  const touchStartX = useRef<number>(0);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeDir, setSwipeDir] = useState<"right" | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [longPressId, setLongPressId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const deleteHabit = async (habitId: string) => {
    haptic("heavy");
    await supabase
      .from("habits")
      .update({ actif: false } as any)
      .eq("id", habitId);
    refresh();
    toast("Habitude supprimée.");
  };

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
    setSwipeDir(diff > 20 ? "right" : null);
  };

  const handleTouchEnd = () => {
    if (swipingId === null) return;
    if (swipeProgress > 0.5 && swipeDir === "right") {
      const habit = habits.find((h) => h.id === swipingId);
      if (habit && !habit.completed) {
        haptic("light");
        complete(habit.id, habit.xp_estime);
        confetti({
          particleCount: 5,
          spread: 50,
          origin: { y: 0.7 },
          colors: ["#06D6A0", "#0efa8a", "#04b884"],
          scalar: 0.7,
          gravity: 1.5,
        });
      }
    }
    setSwipingId(null);
    setSwipeProgress(0);
    setSwipeDir(null);
  };

  // Pull-to-refresh handlers (on the outer wrapper)
  const handlePullStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY;
  };

  const handlePullMove = (e: React.TouchEvent) => {
    if (window.scrollY !== 0) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setPullDistance(Math.min(delta * 0.4, PULL_THRESHOLD));
  };

  const handlePullEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      haptic("light");
      setIsRefreshing(true);
      await combinedRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  };

  const selectedDate = weekDays[selectedDay]?.date;
  const dateHeader = selectedDate
    ? selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    : "";

  return (
    <div
      className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden pb-24"
      onTouchStart={handlePullStart}
      onTouchMove={handlePullMove}
      onTouchEnd={handlePullEnd}
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

      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? "transform 300ms ease" : "none",
        }}
      >
        {/* Calendar Nav */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2" style={{ animation: "slide-down 300ms ease-out both" }}>
          <button
            type="button"
            onClick={() => setWeekOffset(o => Math.max(o - 1, -4))}
            disabled={weekOffset <= -4}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-white/5 active:scale-95 transition-all text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:scale-100"
            aria-label="Semaine précédente"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <span className="text-sm font-bold tracking-wider text-muted-foreground uppercase text-center flex-1">
            {weekOffset === 0 ? "Cette semaine" : weekOffset === -1 ? "Semaine dernière" : `Il y a ${Math.abs(weekOffset)} semaines`}
          </span>
          <button
            type="button"
            onClick={() => setWeekOffset(o => Math.min(o + 1, 0))}
            disabled={weekOffset >= 0}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-white/5 active:scale-95 transition-all text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:scale-100"
            aria-label="Semaine suivante"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>

        {/* Header */}
        <header className="px-6 py-4 sticky top-0 bg-background/80 backdrop-blur-md z-10">
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
                  className={`w-10 h-14 flex flex-col items-center justify-center rounded-xl transition-all duration-200 ${selectedDay === i
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-white/5 opacity-60"
                    }`}
                >
                  <span className="text-lg font-bold">{day.num}</span>
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${selectedDay === i
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

            return (
              <div
                key={habit.id}
                className={`relative p-4 rounded-xl flex items-center gap-4 overflow-hidden transition-all duration-200 ${habit.completed
                  ? "bg-white/5 border border-white/5 opacity-70"
                  : habit.preuve_requise
                    ? "bg-white/5 border-2 border-primary/20"
                    : "bg-white/5 border border-white/5 shadow-sm"
                  }`}
                style={{
                  animation: `slide-up-fade 400ms ease-out ${i * 80}ms both`,
                  background:
                    swipingId === habit.id && swipeDir === "right"
                      ? `linear-gradient(to right, hsl(163 96% 43% / ${swipeProgress * 0.3}), transparent)`
                      : undefined,
                }}
                onTouchStart={(e) => {
                  if (!habit.completed && !isSelectedFuture) handleTouchStart(e, habit.id);
                  longPressTimer.current = setTimeout(() => {
                    haptic("medium");
                    setLongPressId(habit.id);
                  }, 600);
                }}
                onTouchMove={(e) => {
                  if (!isSelectedFuture) handleTouchMove(e);
                  if (longPressTimer.current) clearTimeout(longPressTimer.current);
                }}
                onTouchEnd={() => {
                  if (!isSelectedFuture) handleTouchEnd();
                  if (longPressTimer.current) clearTimeout(longPressTimer.current);
                }}
              >
                {swipingId === habit.id && swipeDir === "right" && (
                  <div className="absolute left-4 text-success font-bold" style={{ opacity: swipeProgress }}>✓</div>
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
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {habit.frequence === "daily" || habit.frequence === "recurring" ? "Quotidien" : habit.frequence} • {habit.xp_estime} XP
                  </p>
                </div>
                {habit.completed ? (
                  <button
                    type="button"
                    disabled={isSelectedFuture}
                    className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => { if (!isSelectedFuture) { haptic("light"); uncomplete(habit.id, habit.xp_estime); } }}
                    aria-label="Annuler habitude"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                ) : habit.preuve_requise ? (
                  <button
                    type="button"
                    disabled={isSelectedFuture}
                    className="w-8 h-8 rounded-full border-2 border-primary/40 flex items-center justify-center disabled:opacity-30"
                    aria-label="Preuve requise"
                  >
                    <span className="material-symbols-outlined text-primary text-sm">add_a_photo</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSelectedFuture}
                    className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => { if (!isSelectedFuture) { haptic("light"); complete(habit.id, habit.xp_estime); } }}
                    aria-label="Valider habitude"
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
      </div>

      {longPressId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-2xl p-6 mx-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Supprimer cette habitude ?</h3>
            <p className="text-muted-foreground text-sm mb-6">Lokyn va être déçu.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLongPressId(null)}
                className="flex-1 py-3 rounded-xl bg-surface text-foreground font-semibold text-sm active:scale-95 transition-transform"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteHabit(longPressId);
                  setLongPressId(null);
                }}
                className="flex-1 py-3 rounded-xl bg-destructive text-white font-semibold text-sm active:scale-95 transition-transform"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default HabitsPage;
