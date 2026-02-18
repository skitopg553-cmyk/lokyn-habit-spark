import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";

const objectives = ["Fitness", "Études", "Nutrition"];

const settingsItems = [
  { icon: "notifications", label: "Notifications" },
  { icon: "lock", label: "Confidentialité" },
  { icon: "group", label: "Gérer mes amis" },
];

const customizationCategories = ["Tenues", "Accessoires", "Décors"];

const customizationItems: Record<string, { name: string; icon: string; unlocked: boolean; condition?: string }[]> = {
  Tenues: [
    { name: "Sport", icon: "fitness_center", unlocked: true },
    { name: "Costume", icon: "checkroom", unlocked: true },
    { name: "Ninja", icon: "volunteer_activism", unlocked: false, condition: "Streak 14j" },
    { name: "Royal", icon: "crown", unlocked: false, condition: "Niveau 10" },
  ],
  Accessoires: [
    { name: "Lunettes", icon: "visibility", unlocked: true },
    { name: "Casquette", icon: "sports_baseball", unlocked: false, condition: "30 habitudes" },
  ],
  Décors: [
    { name: "Gym", icon: "sports_gymnastics", unlocked: true },
    { name: "Plage", icon: "beach_access", unlocked: false, condition: "Streak 21j" },
  ],
};

const ProfilePage = () => {
  const [objectives_, setObjectives] = useState(objectives);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetClosing, setSheetClosing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Tenues");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [shakeItem, setShakeItem] = useState<string | null>(null);
  const [tooltipItem, setTooltipItem] = useState<string | null>(null);
  const [avatarBounce, setAvatarBounce] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAvatarTap = useCallback(() => {
    setAvatarBounce(true);
    setTimeout(() => setAvatarBounce(false), 300);
  }, []);

  const handleAddObjective = useCallback(() => {
    setObjectives((prev) => [...prev, "Nouveau"]);
  }, []);

  const handleOpenSheet = useCallback(() => {
    setShowSheet(true);
    setSheetClosing(false);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetClosing(true);
    setTimeout(() => {
      setShowSheet(false);
      setSheetClosing(false);
    }, 300);
  }, []);

  const handleSave = useCallback(() => {
    setSaveFlash(true);
    setTimeout(() => {
      setSaveFlash(false);
      handleCloseSheet();
      toast("Lokyn mis à jour ✓", { duration: 2000 });
    }, 300);
  }, [handleCloseSheet]);

  const handleItemTap = useCallback((item: typeof customizationItems["Tenues"][0]) => {
    if (item.unlocked) {
      setSelectedItem(item.name);
    } else {
      setShakeItem(item.name);
      setTooltipItem(item.name);
      setTimeout(() => setShakeItem(null), 300);
      setTimeout(() => setTooltipItem(null), 1500);
    }
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden pb-24">
      {/* Header / Avatar */}
      <header
        className="flex flex-col items-center pt-12 pb-8 px-6"
        style={{ animation: mounted ? "slide-up-fade 400ms ease-out both" : "none" }}
      >
        <div className="relative mb-6" onClick={handleAvatarTap}>
          <div
            className="w-[180px] h-[180px] rounded-full bg-surface border-4 border-primary flex items-center justify-center overflow-hidden cursor-pointer text-7xl select-none"
            style={{
              animation: "avatar-glow-pulse 3s ease-in-out infinite",
              transform: avatarBounce ? "scale(1.05)" : "scale(1)",
              transition: "transform 300ms cubic-bezier(0.68,-0.55,0.27,1.55)",
            }}
          >
            👤
          </div>
          <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-2 border-4 border-background">
            <span className="material-symbols-outlined text-sm block fill-1">verified</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Alex Martin</h1>
        <div
          className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-primary/30"
          style={{ animation: "slide-up-fade 300ms ease-out 200ms both" }}
        >
          Niveau 4 — En progression
        </div>
        <button
          onClick={handleOpenSheet}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-primary text-primary font-bold text-sm active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          Personnaliser Lokyn
        </button>
      </header>

      {/* Quick Stats */}
      <section className="px-4 mb-8">
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: "🔥", value: "7", sub1: "Jours", sub2: "Streak" },
            { emoji: "✅", value: "127", sub1: "Faites", sub2: "Habitudes" },
            { emoji: "👥", value: "8", sub1: "", sub2: "Amis" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-card p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer active:scale-97 transition-transform"
              style={{ animation: `slide-up-fade 350ms ease-out ${i * 100}ms both` }}
            >
              <span className="text-primary font-bold text-lg leading-none mb-1">
                {stat.emoji} {stat.value}
              </span>
              {stat.sub1 && (
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {stat.sub1}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground mt-1">{stat.sub2}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Objectives */}
      <section className="px-6 mb-10">
        <h3 className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase mb-4">
          Mes Objectifs
        </h3>
        <div className="flex flex-wrap gap-3">
          {objectives_.map((obj, i) => (
            <div
              key={i}
              className={`bg-surface px-4 py-2.5 rounded-full flex items-center gap-3 border transition-all duration-200 ${
                editingIndex === i ? "border-primary bg-surface-active" : "border-white/5"
              }`}
              style={{ animation: `slide-up-fade 300ms ease-out ${i * 80}ms both` }}
            >
              <span className="text-sm font-medium">{obj}</span>
              <span
                className="material-symbols-outlined text-muted-foreground text-lg cursor-pointer"
                onClick={() => setEditingIndex(editingIndex === i ? null : i)}
              >
                edit
              </span>
            </div>
          ))}
          <button
            onClick={handleAddObjective}
            className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </section>

      {/* Settings */}
      <section className="px-6 space-y-1">
        <h3 className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase mb-4">
          Paramètres
        </h3>
        {settingsItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-4 group cursor-pointer border-b border-white/5"
            style={{ animation: `slide-up-fade 300ms ease-out ${i * 40}ms both` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary transition-colors">
                  {item.icon}
                </span>
              </div>
              <span className="font-medium">{item.label}</span>
            </div>
            <span className="material-symbols-outlined text-muted-foreground/40">chevron_right</span>
          </div>
        ))}
        {/* Logout */}
        <div
          className="flex items-center justify-between py-4 cursor-pointer"
          style={{ animation: `slide-up-fade 300ms ease-out ${settingsItems.length * 40}ms both` }}
          onClick={() => setShowLogout(true)}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-destructive">logout</span>
            </div>
            <span className="font-medium text-destructive">Se déconnecter</span>
          </div>
          <span className="material-symbols-outlined text-muted-foreground/40">chevron_right</span>
        </div>
      </section>

      {/* Logout Confirmation */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="bg-card border border-white/10 rounded-2xl p-6 mx-6 w-full max-w-sm"
            style={{ animation: "check-bounce 200ms ease-out both" }}
          >
            <h3 className="text-lg font-bold mb-2">Se déconnecter ?</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Tu es sûr ? Lokyn sera triste sans toi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 py-3 rounded-xl bg-surface text-foreground font-semibold text-sm active:scale-95 transition-transform"
              >
                Annuler
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm active:scale-95 transition-transform"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customization Bottom Sheet */}
      {showSheet && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseSheet}
            style={{ animation: "count-fade 200ms ease-out both" }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-white/10 rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
            style={{
              animation: sheetClosing
                ? "sheet-down 300ms ease-in forwards"
                : "sheet-up 300ms ease-out both",
            }}
          >
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold mb-4">Personnaliser Lokyn</h3>

            {/* Category Pills */}
            <div className="flex gap-2 mb-6">
              {customizationCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div
              className="grid grid-cols-3 gap-4 mb-6"
              style={{ animation: "count-fade 250ms ease-out both" }}
              key={activeCategory}
            >
              {customizationItems[activeCategory]?.map((item) => (
                <div
                  key={item.name}
                  className="relative flex flex-col items-center gap-2 cursor-pointer"
                  onClick={() => handleItemTap(item)}
                >
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center border-2 transition-all ${
                      selectedItem === item.name && item.unlocked
                        ? "border-primary bg-primary/10"
                        : item.unlocked
                        ? "border-white/10 bg-surface"
                        : "border-muted-foreground/20 bg-surface opacity-40"
                    }`}
                    style={{
                      transform:
                        selectedItem === item.name && item.unlocked
                          ? "scale(1.05)"
                          : undefined,
                      transition: "transform 200ms cubic-bezier(0.68,-0.55,0.27,1.55)",
                      animation: shakeItem === item.name ? "shake-x 0.3s ease" : undefined,
                    }}
                  >
                    <span
                      className={`material-symbols-outlined text-2xl ${
                        item.unlocked ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {item.unlocked ? item.icon : "lock"}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">{item.name}</span>
                  {tooltipItem === item.name && !item.unlocked && (
                    <div
                      className="absolute -bottom-6 bg-card border border-white/10 text-[10px] text-muted-foreground px-2 py-0.5 rounded-lg whitespace-nowrap z-10"
                      style={{ animation: "count-fade 200ms ease-out both" }}
                    >
                      🔒 {item.condition}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              className={`w-full py-3 rounded-xl font-bold text-sm text-primary-foreground active:scale-95 transition-all ${
                saveFlash ? "bg-success" : "bg-primary"
              }`}
            >
              Sauvegarder
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
