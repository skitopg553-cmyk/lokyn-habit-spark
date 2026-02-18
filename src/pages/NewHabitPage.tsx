import { useState, useMemo, useCallback } from "react";
import BottomNav from "../components/BottomNav";

const categories = [
  { id: "sport", name: "Sport", desc: "Séance salle, Iron Man, course...", icon: "fitness_center" },
  { id: "projet", name: "Projet perso", desc: "Business en ligne, side project...", icon: "work" },
  { id: "connaissance", name: "Connaissance", desc: "Lire 10 pages, réviser ses cours...", icon: "menu_book" },
  { id: "addiction", name: "Stop addiction", desc: "Sans tabac, sans scroll...", icon: "block" },
  { id: "mental", name: "Mental", desc: "Méditation, journaling...", icon: "psychology" },
  { id: "nutrition", name: "Nutrition", desc: "Manger sain, boire 2L...", icon: "restaurant" },
];

const dayLabels = [
  { letter: "L", name: "Lun" },
  { letter: "M", name: "Mar" },
  { letter: "M", name: "Mer" },
  { letter: "J", name: "Jeu" },
  { letter: "V", name: "Ven" },
  { letter: "S", name: "Sam" },
  { letter: "D", name: "Dim" },
];

type FrequencyType = "once" | "recurring" | "weekly";

const NewHabitPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>("sport");
  const [habitName, setHabitName] = useState("Séance salle");
  const [objective, setObjective] = useState("");
  const [frequency, setFrequency] = useState<FrequencyType>("recurring");
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4]);
  const [reminderOn, setReminderOn] = useState(true);
  const [reminderHour, setReminderHour] = useState(8);
  const [proofRequired, setProofRequired] = useState(true);
  const [showLokyn, setShowLokyn] = useState(false);
  const [lokynMessage, setLokynMessage] = useState("");

  const toggleDay = useCallback((index: number) => {
    setSelectedDays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
    );
  }, []);

  const selectAllDays = useCallback(() => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  }, []);

  // XP calculation
  const xp = useMemo(() => {
    let base = 10;
    // Duration > 60 min → +30 XP (we'll assume sport = 60+)
    if (selectedCategory === "sport" || selectedCategory === "projet") base += 30;
    // Daily frequency → +20 XP
    if (frequency === "recurring" && selectedDays.length >= 5) base += 20;
    // Proof required → +20 XP
    if (proofRequired) base += 20;
    return base;
  }, [selectedCategory, frequency, selectedDays, proofRequired]);

  const xpLevel = useMemo(() => {
    if (xp <= 20) return { label: "LÉGER", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" };
    if (xp <= 50) return { label: "MODÉRÉ", color: "text-yellow-400", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/20" };
    if (xp <= 80) return { label: "SÉRIEUX", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" };
    return { label: "EXTRÊME", color: "text-red-500", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" };
  }, [xp]);

  const handleCreate = () => {
    setShowLokyn(true);
    setLokynMessage("On verra si tu tiens parole.");
    setTimeout(() => setShowLokyn(false), 2200);
  };

  const selectedCat = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden pb-24 bg-background text-foreground font-display">
      {/* Header */}
      <div className="flex items-center p-4 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <a
          href="/habits"
          className="flex size-10 items-center justify-center cursor-pointer hover:bg-surface rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </a>
        <h1 className="text-lg font-bold flex-1 text-center pr-10">Nouvelle Habitude</h1>
      </div>

      <div className="px-4 py-6 space-y-10">
        {/* Category Selection */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8">Quel type d'habitude ?</h2>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`flex flex-col p-4 rounded-xl gap-2 cursor-pointer transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? "bg-surface-active border-2 border-primary"
                    : "bg-surface border-2 border-transparent hover:bg-surface-active"
                }`}
                onClick={() => {
                  setSelectedCategory(cat.id);
                }}
                style={{
                  animation:
                    selectedCategory === cat.id
                      ? "check-bounce 200ms cubic-bezier(0.68, -0.55, 0.27, 1.55)"
                      : "none",
                }}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg mb-2 ${
                    selectedCategory === cat.id
                      ? "bg-primary/20 text-primary"
                      : "bg-white/5 text-white/60"
                  }`}
                >
                  <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
                </div>
                <p className="font-bold text-base">{cat.name}</p>
                <p className="text-muted-foreground text-xs">{cat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Habit Details */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold">Décris ton habitude</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground ml-1">Nom de l'habitude</label>
              <input
                className="w-full bg-surface border-none rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50 outline-none"
                placeholder="ex : Travailler sur mon business"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground ml-1">Objectif précis (optionnel)</label>
              <input
                className="w-full bg-surface border-none rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50 outline-none"
                placeholder="ex : 1h de travail, 10 pages, 5km..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Frequency */}
        <section className="space-y-6">
          <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
            À quelle fréquence ?
          </h3>
          <div className="space-y-4">
            <div className="flex p-1 bg-surface rounded-xl">
              {(["once", "recurring", "weekly"] as FrequencyType[]).map((f) => (
                <button
                  key={f}
                  className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all duration-200 ${
                    frequency === f
                      ? "bg-surface-active text-foreground border border-white/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setFrequency(f)}
                >
                  {f === "once" ? "UNE SEULE FOIS" : f === "recurring" ? "RÉCURRENT" : "X FOIS / SEMAINE"}
                </button>
              ))}
            </div>

            {/* Day selector - slide down when recurring */}
            {frequency === "recurring" && (
              <div
                className="flex flex-col items-center space-y-6 py-2"
                style={{ animation: "slide-down 300ms ease-out" }}
              >
                <div className="flex justify-between w-full px-2">
                  {dayLabels.map((day, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-2 cursor-pointer"
                      onClick={() => toggleDay(i)}
                    >
                      <div
                        className={`size-10 rounded-full flex items-center justify-center font-bold transition-all duration-200 ${
                          selectedDays.includes(i)
                            ? "bg-primary text-primary-foreground"
                            : "bg-white/5 text-muted-foreground border border-white/5"
                        }`}
                        style={{
                          animation: selectedDays.includes(i)
                            ? "check-bounce 200ms cubic-bezier(0.68, -0.55, 0.27, 1.55)"
                            : "none",
                        }}
                      >
                        {day.letter}
                      </div>
                      <span
                        className={`text-[10px] ${
                          selectedDays.includes(i) ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {day.name}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  className="px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold transition-all active:scale-95"
                  onClick={selectAllDays}
                >
                  Tous les jours
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Reminder */}
        <section className="p-4 bg-surface rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">notifications_active</span>
              <div>
                <p className="font-bold text-base">Rappel activé</p>
                <p className="text-xs text-muted-foreground">Lockyn te rappellera à cette heure.</p>
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors duration-200 ${
                reminderOn ? "bg-primary" : "bg-white/10"
              }`}
              onClick={() => setReminderOn(!reminderOn)}
            >
              <div
                className={`size-4 bg-white rounded-full transition-all duration-200 ${
                  reminderOn ? "ml-auto" : "ml-0"
                }`}
              />
            </div>
          </div>

          {reminderOn && (
            <div
              className="flex justify-center items-center h-24 border-t border-white/5 mt-2"
              style={{ animation: "slide-down 300ms ease-out" }}
            >
              <div className="flex items-center gap-4 text-3xl font-bold">
                <button
                  className="opacity-30 text-xl hover:opacity-60 transition-opacity"
                  onClick={() => setReminderHour((h) => Math.max(0, h - 1))}
                >
                  {String(reminderHour - 1).padStart(2, "0")}
                </button>
                <div className="text-primary bg-primary/10 px-4 py-2 rounded-lg scale-110">
                  {String(reminderHour).padStart(2, "0")}:00
                </div>
                <button
                  className="opacity-30 text-xl hover:opacity-60 transition-opacity"
                  onClick={() => setReminderHour((h) => Math.min(23, h + 1))}
                >
                  {String(reminderHour + 1).padStart(2, "0")}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Photo Proof Toggle */}
        <section className="p-4 bg-surface rounded-xl flex items-center justify-between border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">photo_camera</span>
            </div>
            <div>
              <p className="font-bold text-base">Validation par preuve photo</p>
              <p className="text-xs text-muted-foreground">Lockyn devra vérifier.</p>
            </div>
          </div>
          <div
            className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors duration-200 ${
              proofRequired ? "bg-primary" : "bg-white/10"
            }`}
            onClick={() => setProofRequired(!proofRequired)}
          >
            <div
              className={`size-4 bg-white rounded-full transition-all duration-200 ${
                proofRequired ? "ml-auto" : "ml-0"
              }`}
            />
          </div>
        </section>

        {/* Proof badge slide-down */}
        {proofRequired && (
          <div style={{ animation: "slide-down 250ms ease-out" }}>
            <span className="inline-flex items-center gap-1 bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
              📸 PREUVE REQUISE
            </span>
          </div>
        )}

        {/* Preview Card */}
        <section className="pt-8 pb-4 space-y-6">
          <div className="p-5 bg-surface-active rounded-2xl border border-primary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl">
                {selectedCat?.icon || "star"}
              </span>
            </div>
            <div className="space-y-3 relative z-10">
              {proofRequired && (
                <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold">
                  <span className="material-symbols-outlined text-sm">verified</span> PREUVE REQUISE
                </div>
              )}
              <h4 className="text-2xl font-bold">{habitName || "Mon habitude"}</h4>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                <span>
                  {frequency === "recurring" && selectedDays.length === 7
                    ? `Tous les jours à ${String(reminderHour).padStart(2, "0")}:00`
                    : `${selectedDays.length}x / semaine`}
                </span>
              </div>
              <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                    <span>Lokyn estime :</span>
                    <span className="text-primary font-bold">⚡ {xp} XP</span>
                    <span className="text-xs text-muted-foreground">par séance</span>
                  </div>
                  <div
                    className={`px-2 py-0.5 ${xpLevel.bgColor} ${xpLevel.color} border ${xpLevel.borderColor} rounded text-[10px] font-bold uppercase tracking-wider`}
                  >
                    {xpLevel.label}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Basé sur ta durée, ta fréquence et la validation requise.
                </p>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="space-y-4">
            <button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-[0_4px_20px_hsl(18_100%_56%_/_0.3)] active:scale-[0.95] transition-all"
              onClick={handleCreate}
            >
              Créer l'habitude
            </button>

            {/* Lokyn appears */}
            <div
              className="flex items-center justify-center gap-2 overflow-hidden"
              style={{
                opacity: showLokyn ? 1 : 0,
                transform: showLokyn ? "translateY(0)" : "translateY(20px)",
                transition: "all 300ms ease-out",
              }}
            >
              <div className="size-8 bg-primary/30 rounded-full flex items-center justify-center text-sm">
                🐣
              </div>
              <p className="text-xs text-muted-foreground font-medium italic">{lokynMessage}</p>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default NewHabitPage;
