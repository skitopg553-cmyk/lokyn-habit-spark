import { useState, useEffect, useRef, useCallback } from "react";
import BottomNav from "../components/BottomNav";

const periods = ["7J", "30J", "Tout"] as const;

const timelineCards = [
  { date: "12 Mai", status: "En forme", color: "success" as const },
  { date: "11 Mai", status: "En galère", color: "danger" as const },
  { date: "10 Mai", status: "Au sommet", color: "warning" as const },
];

const disciplineData7J = [90, 85, 60, 30, 95, 55, 88];
const disciplineData30J = [70, 65, 80, 45, 90, 55, 75];
const disciplineDataAll = [75, 72, 68, 60, 85, 62, 80];
const dayLabels = ["L", "M", "M", "J", "V", "S", "D"];

const achievements = [
  { name: "7 jours d'affilée", icon: "workspace_premium", unlocked: true, color: "primary" },
  { name: "Lokyn a retrouvé ses abdos", icon: "fitness_center", unlocked: true, color: "green" },
  { name: "30 jours de feu", icon: "lock", unlocked: false, condition: "30 jours consécutifs" },
  { name: "Maître du matin", icon: "lock", unlocked: false, condition: "Habitude matinale x21" },
];

function getBarColor(value: number): string {
  if (value > 80) return "hsl(163 96% 43%)";
  if (value >= 50) return "hsl(18 100% 56%)";
  return "hsl(348 86% 61%)";
}

function getGaugeColor(score: number): string {
  if (score > 70) return "hsl(163 96% 43%)";
  if (score > 40) return "hsl(18 100% 56%)";
  return "hsl(348 86% 61%)";
}

function getGaugeLabel(score: number): string {
  if (score > 70) return "Lokyn est fier. Continue.";
  if (score > 40) return "Pas mal, mais tu peux mieux.";
  return "Lokyn te regarde de travers.";
}

const StatsPage = () => {
  const [activePeriod, setActivePeriod] = useState<typeof periods[number]>("7J");
  const [fadeState, setFadeState] = useState<"in" | "out">("in");
  const [activeTimeline, setActiveTimeline] = useState(0);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [gaugeAnimated, setGaugeAnimated] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [achievementBounce, setAchievementBounce] = useState<number | null>(null);
  const [shakeIndex, setShakeIndex] = useState<number | null>(null);
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);
  const scoreRef = useRef<number | null>(null);

  const score = 72;
  const streak = 7;
  const record = 7;
  const isRecord = streak === record;

  const disciplineData = activePeriod === "7J" ? disciplineData7J : activePeriod === "30J" ? disciplineData30J : disciplineDataAll;

  // Trigger animations on mount
  useEffect(() => {
    const t1 = setTimeout(() => setBarsAnimated(true), 300);
    const t2 = setTimeout(() => setGaugeAnimated(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Score counter animation
  useEffect(() => {
    if (!gaugeAnimated) return;
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * score);
      setDisplayScore(current);
      if (progress < 1) {
        scoreRef.current = requestAnimationFrame(animate);
      }
    };
    scoreRef.current = requestAnimationFrame(animate);
    return () => { if (scoreRef.current) cancelAnimationFrame(scoreRef.current); };
  }, [gaugeAnimated]);

  const handlePeriodChange = useCallback((period: typeof periods[number]) => {
    if (period === activePeriod) return;
    setFadeState("out");
    setTimeout(() => {
      setActivePeriod(period);
      setFadeState("in");
    }, 300);
  }, [activePeriod]);

  const handleAchievementTap = useCallback((index: number, unlocked: boolean) => {
    if (unlocked) {
      setAchievementBounce(index);
      setTimeout(() => setAchievementBounce(null), 300);
    } else {
      setShakeIndex(index);
      setTooltipIndex(index);
      setTimeout(() => setShakeIndex(null), 300);
      setTimeout(() => setTooltipIndex(null), 2000);
    }
  }, []);

  const gaugeStrokeDash = gaugeAnimated ? `${(score / 100) * 125.6} 125.6` : "0 125.6";

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <a href="/" className="material-symbols-outlined text-foreground cursor-pointer">arrow_back</a>
          <h1 className="text-2xl font-bold tracking-tight text-center flex-1">Ta progression</h1>
          <div className="w-6" />
        </div>
        {/* Period Selector */}
        <div className="flex gap-2 justify-center">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activePeriod === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      <div
        className="transition-opacity duration-300"
        style={{ opacity: fadeState === "in" ? 1 : 0 }}
      >
        {/* Timeline Lokyn */}
        <section className="mt-4">
          <h3 className="px-6 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-4">
            Timeline Lokyn
          </h3>
          <div className="flex overflow-x-auto hide-scrollbar gap-4 px-6 snap-x">
            {timelineCards.map((card, i) => (
              <div
                key={i}
                className="flex-none snap-center cursor-pointer"
                style={{
                  width: activeTimeline === i ? "11rem" : "10rem",
                  animation: `slide-in-right 400ms ease-out ${i * 100}ms both`,
                }}
                onClick={() => setActiveTimeline(i)}
              >
                <div
                  className={`relative rounded-xl p-1 overflow-hidden transition-all duration-200 ${
                    activeTimeline === i
                      ? "border-2 border-primary scale-105 bg-card"
                      : "bg-card opacity-70"
                  }`}
                  style={
                    activeTimeline !== i
                      ? {}
                      : {
                          boxShadow:
                            card.color === "success"
                              ? "0 0 12px rgba(6,214,160,0.2)"
                              : card.color === "danger"
                              ? "0 0 12px rgba(239,71,111,0.2)"
                              : "0 0 12px rgba(255,107,43,0.2)",
                        }
                  }
                >
                  <div
                    className={`aspect-[3/4] rounded-lg flex items-center justify-center text-6xl ${
                      card.color === "danger" ? "grayscale" : ""
                    }`}
                    style={{ backgroundColor: "hsl(var(--surface))" }}
                  >
                    {card.color === "success" ? "💪" : card.color === "danger" ? "😩" : "🏆"}
                  </div>
                  <div className="px-2 pb-2 pt-1">
                    <p className="text-sm font-bold">{card.date}</p>
                    <p
                      className={`text-xs font-medium ${
                        card.color === "success"
                          ? "text-success"
                          : card.color === "danger"
                          ? "text-destructive"
                          : "text-primary"
                      }`}
                    >
                      {card.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Discipline Chart */}
        <section className="mt-10 px-6">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-6">
            Discipline
          </h3>
          <div className="flex items-end justify-between h-32 gap-2">
            {disciplineData.map((value, i) => (
              <div key={i} className="flex flex-col items-center flex-1 gap-2 relative">
                {hoveredBar === i && (
                  <div className="absolute -top-7 bg-card border border-white/10 text-xs font-bold px-2 py-1 rounded-lg z-10">
                    {value}%
                  </div>
                )}
                <div
                  className="w-full rounded-t-sm cursor-pointer transition-all duration-150"
                  style={{
                    height: barsAnimated ? `${value}%` : "0%",
                    backgroundColor: getBarColor(value),
                    transitionDuration: "500ms",
                    transitionDelay: `${i * 80}ms`,
                    transitionTimingFunction: "ease-out",
                    filter: hoveredBar === i ? "brightness(1.3)" : "brightness(1)",
                  }}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={() => setHoveredBar(hoveredBar === i ? null : i)}
                />
                <span className="text-[10px] text-muted-foreground">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Global Score Gauge */}
        <section className="mt-12 px-6 flex flex-col items-center">
          <div className="relative w-48 h-32 flex items-center justify-center overflow-hidden">
            <svg className="absolute top-0 w-48 h-48 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="hsl(var(--surface))"
                strokeWidth="8"
                strokeDasharray="125.6 125.6"
                strokeLinecap="round"
              />
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke={getGaugeColor(score)}
                strokeWidth="8"
                strokeDasharray={gaugeStrokeDash}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dasharray 1.2s ease-out",
                }}
              />
            </svg>
            <div className="mt-12 text-center z-10">
              <span className="text-4xl font-bold">{displayScore}</span>
              <span className="text-muted-foreground text-lg"> / 100</span>
            </div>
          </div>
          <p
            className="mt-4 text-success italic text-sm font-medium"
            style={{
              animation: gaugeAnimated ? "slide-up-fade 400ms ease-out 1.2s both" : "none",
            }}
          >
            {getGaugeLabel(score)}
          </p>
        </section>

        {/* Streak & Record */}
        <section className="mt-12 px-6 grid grid-cols-2 gap-4">
          <div
            className="bg-card p-4 rounded-xl flex flex-col justify-between aspect-square"
            style={{ animation: "slide-up-fade 400ms ease-out 200ms both" }}
          >
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
              🔥 Streak actuel
            </span>
            <div className="flex flex-col">
              <span className="text-4xl font-bold">{streak}</span>
              <span className="text-xs text-muted-foreground">jours consécutifs</span>
            </div>
          </div>
          <div
            className="bg-card p-4 rounded-xl flex flex-col justify-between aspect-square relative"
            style={{
              animation: `slide-up-fade 400ms ease-out 300ms both${isRecord ? ", record-pulse 2s ease-in-out infinite 800ms" : ""}`,
              border: isRecord ? "2px solid #eab308" : undefined,
            }}
          >
            {isRecord && (
              <div
                className="absolute -top-3 right-4 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{
                  animation: "check-bounce 400ms cubic-bezier(0.68,-0.55,0.27,1.55) 800ms both",
                }}
              >
                RECORD!
              </div>
            )}
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
              ⚡ Record
            </span>
            <div className="flex flex-col">
              <span className="text-4xl font-bold">{record}</span>
              <span className="text-xs text-muted-foreground">jours à battre</span>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="mt-12 px-6 mb-12">
          <h3 className="text-lg font-bold mb-6">Succès débloqués</h3>
          <div className="grid grid-cols-3 gap-6">
            {achievements.map((badge, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center gap-2 cursor-pointer relative"
                style={{
                  animation: `slide-up-fade 400ms ease-out ${i * 50}ms both`,
                }}
                onClick={() => handleAchievementTap(i, badge.unlocked)}
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-transform ${
                    badge.unlocked
                      ? badge.color === "primary"
                        ? "bg-primary/20 border-primary shadow-[0_0_15px_hsl(18_100%_56%_/_0.3)]"
                        : "bg-success/20 border-success shadow-[0_0_15px_hsl(163_96%_43%_/_0.3)]"
                      : "bg-surface border-muted-foreground/30 opacity-40"
                  }`}
                  style={{
                    transform:
                      achievementBounce === i
                        ? "scale(1.2)"
                        : shakeIndex === i
                        ? undefined
                        : "scale(1)",
                    transition: "transform 300ms cubic-bezier(0.68,-0.55,0.27,1.55)",
                    animation: shakeIndex === i ? "shake-x 0.3s ease" : undefined,
                  }}
                >
                  <span
                    className={`material-symbols-outlined text-3xl ${
                      badge.unlocked
                        ? badge.color === "primary"
                          ? "text-primary"
                          : "text-success"
                        : "text-muted-foreground"
                    }`}
                  >
                    {badge.icon}
                  </span>
                </div>
                <p className={`text-[10px] font-bold ${badge.unlocked ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                  {badge.name}
                </p>
                {tooltipIndex === i && !badge.unlocked && (
                  <div
                    className="absolute -bottom-8 bg-card border border-white/10 text-[10px] text-muted-foreground px-2 py-1 rounded-lg whitespace-nowrap z-10"
                    style={{ animation: "slide-up-fade 200ms ease-out both" }}
                  >
                    🔒 {badge.condition}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default StatsPage;
