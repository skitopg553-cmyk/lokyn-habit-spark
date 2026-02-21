import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import lokynColere from "@/assets/lokyn-colere.png";

const objectifs = [
  { id: "sport", label: "💪 Muscu / Sport" },
  { id: "course", label: "🏃 Course / Cardio" },
  { id: "business", label: "💰 Business / Argent" },
  { id: "etudes", label: "📚 Études / Langue" },
  { id: "nutrition", label: "🥗 Alimentation" },
  { id: "mental", label: "🧘 Mental / Bien-être" },
];

const OnboardingPage = () => {
  const [slide, setSlide] = useState(0);
  const [prenom, setPrenom] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();

  const toggleObjectif = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleFinish = async () => {
    await supabase
      .from("user_profile")
      .update({ prenom: prenom || "Toi", objectifs: selected } as any)
      .eq("id", "local_user");
    localStorage.setItem("onboarding_done", "true");
    navigate("/home");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-between max-w-md mx-auto px-6 pb-12 pt-16 overflow-hidden bg-background">

      {/* SLIDE 0 — Le choc */}
      {slide === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 text-center"
          style={{ animation: "slide-up-fade 500ms ease-out both" }}>
          <div style={{ animation: "lokyn-float 2.5s ease-in-out infinite" }}>
            <img src={lokynColere} alt="Lokyn" className="w-48 h-48 object-contain mb-8"
              style={{ filter: "drop-shadow(0 10px 30px rgba(255,107,43,0.5))" }} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4 leading-tight">
            Si tu fais rien,<br />
            <span className="text-primary">je vais rater ma vie.</span>
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed mb-2">
            Je suis Lokyn. Ton ego intérieur.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            Celui que tu mets en veille chaque matin quand tu scrolles au lieu d'agir.
          </p>
          <button
            onClick={() => setSlide(1)}
            className="mt-12 w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl active:scale-95 transition-transform"
            style={{ boxShadow: "0 8px 20px hsl(18 100% 56% / 0.4)" }}
          >
            Je t'écoute
          </button>
        </div>
      )}

      {/* SLIDE 1 — Le prénom */}
      {slide === 1 && (
        <div className="flex flex-col items-center justify-center flex-1 w-full text-center"
          style={{ animation: "slide-up-fade 500ms ease-out both" }}>
          <h2 className="text-2xl font-bold mb-2">Comment tu t'appelles ?</h2>
          <p className="text-muted-foreground mb-8">
            Je vais pas t'appeler "utilisateur".
          </p>
          <input
            className="w-full bg-card border border-white/10 rounded-2xl p-4 text-foreground text-center text-xl font-bold outline-none focus:border-primary mb-12"
            placeholder="Ton prénom"
            value={prenom}
            onChange={e => setPrenom(e.target.value)}
            autoFocus
          />
          <button
            onClick={() => setSlide(2)}
            disabled={!prenom.trim()}
            className="w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl active:scale-95 transition-transform disabled:opacity-30 disabled:scale-100"
            style={{ boxShadow: prenom.trim() ? "0 8px 20px hsl(18 100% 56% / 0.4)" : "none" }}
          >
            C'est moi →
          </button>
        </div>
      )}

      {/* SLIDE 2 — Les objectifs */}
      {slide === 2 && (
        <div className="flex flex-col flex-1 w-full"
          style={{ animation: "slide-up-fade 500ms ease-out both" }}>
          <h2 className="text-2xl font-bold mb-2 text-center">
            La meilleure version de toi,<br />
            <span className="text-primary">elle ferait quoi ?</span>
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-8">
            Choisis jusqu'à 3 objectifs
          </p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {objectifs.map((obj, i) => (
              <button
                key={obj.id}
                onClick={() => toggleObjectif(obj.id)}
                className={`p-4 rounded-2xl text-left font-bold text-sm transition-all active:scale-95 border-2 ${
                  selected.includes(obj.id)
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-card border-white/5 text-foreground"
                }`}
                style={{ animation: `slide-up-fade 400ms ease-out ${i * 60}ms both` }}
              >
                {obj.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSlide(3)}
            disabled={selected.length === 0}
            className="w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl active:scale-95 transition-transform disabled:opacity-30"
            style={{ boxShadow: selected.length > 0 ? "0 8px 20px hsl(18 100% 56% / 0.4)" : "none" }}
          >
            C'est ça →
          </button>
        </div>
      )}

      {/* SLIDE 3 — Le pacte */}
      {slide === 3 && (
        <div className="flex flex-col items-center justify-center flex-1 text-center"
          style={{ animation: "slide-up-fade 500ms ease-out both" }}>
          <div style={{ animation: "lokyn-float 2.5s ease-in-out infinite" }}>
            <img src={lokynColere} alt="Lokyn" className="w-48 h-48 object-contain mb-8"
              style={{ filter: "drop-shadow(0 10px 30px rgba(255,107,43,0.5))" }} />
          </div>
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Ok, <span className="text-primary">{prenom}</span>.<br />
            On verra si t'es sérieux.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Je serai là chaque jour.<br />
            Si tu lâches, je lâche aussi.
          </p>
          <button
            onClick={handleFinish}
            className="mt-12 w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl active:scale-95 transition-transform"
            style={{ boxShadow: "0 8px 20px hsl(18 100% 56% / 0.4)" }}
          >
            Je suis prêt
          </button>
        </div>
      )}

      {/* Dots navigation */}
      <div className="flex gap-2 mt-6">
        {[0,1,2,3].map(i => (
          <div key={i} className={`rounded-full transition-all duration-300 ${
            slide === i ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-white/20"
          }`} />
        ))}
      </div>
    </div>
  );
};

export default OnboardingPage;