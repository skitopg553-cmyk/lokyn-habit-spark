import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import lokynNeutre from "@/assets/lokyn-neutre.png";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createHabit } from "@/hooks/useHabits";

const objectifs = [
  { id: "sport", label: "💪 Muscu / Sport" },
  { id: "course", label: "🏃 Course / Cardio" },
  { id: "business", label: "💰 Business / Argent" },
  { id: "etudes", label: "📚 Études / Langue" },
  { id: "nutrition", label: "🥗 Alimentation" },
  { id: "mental", label: "🧘 Mental / Bien-être" },
  { id: "connaissance", label: "📖 Connaissance" },
];

const HABITS_SUGGESTIONS: Record<string, any[]> = {
  sport: [
    { nom: "Séance salle", categorie: "sport", frequence: "weekly", fois_par_semaine: 3, xp_estime: 40, jours: [] },
    { nom: "30 min cardio", categorie: "sport", frequence: "weekly", fois_par_semaine: 2, xp_estime: 25, jours: [] },
    { nom: "Stretching quotidien", categorie: "sport", frequence: "daily", fois_par_semaine: 7, xp_estime: 15, jours: [] },
  ],
  course: [
    { nom: "Courir 5km", categorie: "sport", frequence: "weekly", fois_par_semaine: 2, xp_estime: 40, jours: [] },
    { nom: "Sprints", categorie: "sport", frequence: "weekly", fois_par_semaine: 1, xp_estime: 25, jours: [] },
  ],
  business: [
    { nom: "1h deep work", categorie: "projet", frequence: "daily", fois_par_semaine: 7, xp_estime: 30, jours: [] },
    { nom: "Lire 20 pages", categorie: "connaissance", frequence: "daily", fois_par_semaine: 7, xp_estime: 20, jours: [] },
    { nom: "Revoir mes objectifs", categorie: "mental", frequence: "weekly", fois_par_semaine: 1, xp_estime: 15, jours: [] },
  ],
  etudes: [
    { nom: "30min révision", categorie: "connaissance", frequence: "daily", fois_par_semaine: 7, xp_estime: 25, jours: [] },
    { nom: "Écouter podcast audio", categorie: "connaissance", frequence: "weekly", fois_par_semaine: 3, xp_estime: 15, jours: [] },
  ],
  nutrition: [
    { nom: "Boire 2L d'eau", categorie: "nutrition", frequence: "daily", fois_par_semaine: 7, xp_estime: 15, jours: [] },
    { nom: "Pas de sucre ajouté", categorie: "nutrition", frequence: "daily", fois_par_semaine: 7, xp_estime: 25, jours: [] },
    { nom: "Cuisiner maison", categorie: "nutrition", frequence: "daily", fois_par_semaine: 7, xp_estime: 25, jours: [] },
  ],
  mental: [
    { nom: "10 min méditation", categorie: "mental", frequence: "daily", fois_par_semaine: 7, xp_estime: 20, jours: [] },
    { nom: "Journal le soir", categorie: "mental", frequence: "daily", fois_par_semaine: 7, xp_estime: 15, jours: [] },
    { nom: "Pas d'écran avant dormir", categorie: "addiction", frequence: "daily", fois_par_semaine: 7, xp_estime: 20, jours: [] },
  ],
  connaissance: [
    { nom: "Lire 20 pages", categorie: "connaissance", frequence: "daily", fois_par_semaine: 7, xp_estime: 20, jours: [] },
    { nom: "Écouter podcast", categorie: "connaissance", frequence: "weekly", fois_par_semaine: 3, xp_estime: 15, jours: [] },
  ],
};

const OnboardingPage = () => {
  const [slide, setSlide] = useState(0);
  const [prenom, setPrenom] = useState("");
  const [selectedObj, setSelectedObj] = useState<string[]>([]);
  const [suggestedHabits, setSuggestedHabits] = useState<(any & { checked: boolean })[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (slide === 3 && suggestedHabits.length === 0) {
      let pool: any[] = [];
      selectedObj.forEach(obj => {
        pool.push(...(HABITS_SUGGESTIONS[obj] || []));
      });
      const unique = Array.from(new Map(pool.map(item => [item.nom, item])).values());
      const selected = unique.slice(0, 3).map(h => ({ ...h, checked: true }));
      setSuggestedHabits(selected);
    }
  }, [slide, selectedObj, suggestedHabits.length]);

  const toggleObjectif = (id: string) => {
    setSelectedObj(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const toggleHabit = (nom: string) => {
    setSuggestedHabits(prev =>
      prev.map(h => (h.nom === nom ? { ...h, checked: !h.checked } : h))
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const record = user?.id
        ? { auth_id: user.id, prenom: prenom.trim() || "Toi", objectifs: selectedObj }
        : { id: "local_user", prenom: prenom.trim() || "Toi", objectifs: selectedObj };

      const conflictCol = user?.id ? "auth_id" : "id";
      await (supabase.from("user_profile").upsert(record as any, { onConflict: conflictCol }) as any);

      // Create habits
      const habitsToCreate = suggestedHabits.filter(h => h.checked);
      for (const h of habitsToCreate) {
        await createHabit({
          nom: h.nom,
          categorie: h.categorie,
          frequence: h.frequence,
          jours: h.jours,
          fois_par_semaine: h.fois_par_semaine,
          heure_rappel: null,
          preuve_requise: false,
          xp_estime: h.xp_estime,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["profile-prenom"] });
      queryClient.invalidateQueries({ queryKey: ["today-habits"] });
      navigate("/home");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-between max-w-md mx-auto px-6 pb-12 pt-16 overflow-hidden bg-background">

      {/* SLIDE 0 — Le choc */}
      {slide === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 text-center w-full"
          style={{ animation: "slide-up-fade 500ms ease-out both" }}>
          <div style={{ animation: "lokyn-float 2.5s ease-in-out infinite" }}>
            <img
              src={lokynNeutre}
              alt="Lokyn"
              className="w-48 h-48 object-contain mb-8 select-none"
              width={192}
              height={192}
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3 leading-tight">
            Si tu fais rien,<br />
            <span className="text-primary">je vais rater ma vie.</span>
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed mb-6 font-medium">
            Je suis Lokyn. Ton ego intérieur.<br />
            Celui que tu mets en veille chaque matin quand tu scrolles au lieu d'agir.
          </p>
          <button
            type="button"
            onClick={() => setSlide(1)}
            className="mt-6 w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl active:scale-95 transition-transform shadow-[0_8px_20px_hsl(18_100%_56%_/_0.3)]"
          >
            Je comprends
          </button>
        </div>
      )}

      {/* SLIDE 1 — Le prénom */}
      {slide === 1 && (
        <div className="flex flex-col items-center justify-center flex-1 w-full text-center"
          style={{ animation: "slide-up-fade 500ms ease-out both" }}>
          <h2 className="text-3xl font-bold mb-2">Comment tu t'appelles ?</h2>
          <p className="text-muted-foreground mb-8 text-base">
            Pour que je sache qui blâmer.
          </p>
          <input
            className="w-full bg-card border border-white/10 rounded-2xl p-5 text-foreground text-center text-2xl font-bold outline-none focus:border-primary transition-colors focus:bg-card/80 mb-12 shadow-sm"
            placeholder="Ton prénom"
            value={prenom}
            onChange={e => setPrenom(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setSlide(2)}
            disabled={!prenom.trim()}
            className="w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl active:scale-95 transition-transform disabled:opacity-30 disabled:scale-100 shadow-[0_8px_20px_hsl(18_100%_56%_/_0.3)] disabled:shadow-none"
          >
            C'est moi →
          </button>
        </div>
      )}

      {/* SLIDE 2 — Les objectifs */}
      {slide === 2 && (
        <div className="flex flex-col flex-1 w-full justify-center py-4"
          style={{ animation: "slide-up-fade 500ms ease-out both" }}>
          <h2 className="text-3xl font-bold mb-2 text-center text-foreground">
            Sur quoi tu veux<br />
            <span className="text-primary">progresser ?</span>
          </h2>
          <p className="text-muted-foreground text-center text-base font-medium mb-8">
            Choisis jusqu'à 3 domaines.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-10 w-full">
            {objectifs.map((obj, i) => (
              <button
                type="button"
                key={obj.id}
                onClick={() => toggleObjectif(obj.id)}
                className={`p-4 rounded-2xl text-left font-bold text-sm transition-all active:scale-95 border-2 ${selectedObj.includes(obj.id)
                  ? "bg-primary/20 border-primary text-primary shadow-sm"
                  : "bg-surface border-white/5 text-foreground hover:border-white/20 hover:bg-surface-active"
                  } ${obj.id === 'connaissance' ? 'col-span-2' : ''}`}
                style={{ animation: `slide-up-fade 400ms ease-out ${i * 60}ms both` }}
              >
                {obj.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSlide(3)}
            disabled={selectedObj.length === 0}
            className="w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 shadow-[0_8px_20px_hsl(18_100%_56%_/_0.3)] disabled:shadow-none mt-auto"
          >
            C'est parti →
          </button>
        </div>
      )}

      {/* SLIDE 3 — Les habitudes suggérées */}
      {slide === 3 && (
        <div className="flex flex-col flex-1 w-full justify-center py-4"
          style={{ animation: "slide-up-fade 500ms ease-out both" }}>
          <h2 className="text-3xl font-bold mb-2 text-center leading-tight">
            Tes premières<br />
            <span className="text-primary">habitudes.</span>
          </h2>
          <p className="text-muted-foreground text-center text-base mb-8 font-medium">
            On commence simple. Tu peux modifier après.
          </p>

          <div className="space-y-3 mb-10 w-full">
            {suggestedHabits.map((habit, i) => (
              <button
                type="button"
                key={i}
                onClick={() => toggleHabit(habit.nom)}
                className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all active:scale-95 ${habit.checked
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-surface border-white/5 text-muted-foreground hover:bg-surface-active"
                  }`}
                style={{ animation: `slide-up-fade 400ms ease-out ${i * 60}ms both` }}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${habit.checked ? "bg-primary border-primary text-background" : "border-muted-foreground bg-transparent"
                    }`}>
                    {habit.checked && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                  </div>
                  <div>
                    <h3 className={`font-bold text-[15px] ${habit.checked ? "text-foreground" : ""}`}>{habit.nom}</h3>
                    <p className={`text-xs ${habit.checked ? "text-primary" : "text-muted-foreground"} mt-0.5 font-medium`}>
                      {habit.frequence === 'daily' ? 'Tous les jours' : `${habit.fois_par_semaine}x par semaine`}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleFinish}
            disabled={loading || suggestedHabits.filter(h => h.checked).length === 0}
            className="w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 shadow-[0_8px_20px_hsl(18_100%_56%_/_0.3)] disabled:shadow-none mt-auto"
          >
            {loading ? "Création..." : "On commence"}
          </button>
        </div>
      )}

      {/* Dots navigation */}
      <div className="flex gap-2 mt-8 absolute bottom-6 left-1/2 -translate-x-1/2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`rounded-full transition-all duration-300 ${slide === i ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-white/10"}`} />
        ))}
      </div>
    </div>
  );
};

export default OnboardingPage;