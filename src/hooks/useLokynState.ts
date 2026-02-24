import oeuf1 from "@/assets/lokyn-oeuf-1.png";
import oeuf2 from "@/assets/lokyn-oeuf-2.png";
import oeuf3 from "@/assets/lokyn-oeuf-3.png";
import oeufEclosion from "@/assets/lokyn-oeuf-eclosion.png";
import neutre from "@/assets/lokyn-neutre.png";
import rayonnant from "@/assets/lokyn-rayonnant.png";
import streakImg from "@/assets/lokyn-streak.png";
import decu from "@/assets/lokyn-decu.png";
import chute from "@/assets/lokyn-chute.png";

export type LokynEtat =
  | "oeuf-1"
  | "oeuf-2"
  | "oeuf-3"
  | "oeuf-eclosion"
  | "rayonnant"
  | "streak"
  | "chute"
  | "decu"
  | "neutre";

interface LokynStateParams {
  streak: number;
  completionPercent: number;
  joursInactif: number;
  accountAgeDays: number;
}

interface LokynStateResult {
  image: string;
  etat: LokynEtat;
  label: string;
  isOeuf: boolean;
  dropShadowColor: string;
}

const CONFIG: Record<LokynEtat, { image: string; label: string; dropShadowColor: string }> = {
  "oeuf-1": {
    image: oeuf1,
    label: "Jour 1 — Je t'attends…",
    dropShadowColor: "drop-shadow(0 10px 20px rgba(255,107,43,0.35))",
  },
  "oeuf-2": {
    image: oeuf2,
    label: "Presque là…",
    dropShadowColor: "drop-shadow(0 10px 20px rgba(255,107,43,0.35))",
  },
  "oeuf-3": {
    image: oeuf3,
    label: "Je vais sortir. Fais-le.",
    dropShadowColor: "drop-shadow(0 10px 20px rgba(255,107,43,0.35))",
  },
  "oeuf-eclosion": {
    image: oeufEclosion,
    label: "Je suis là !",
    dropShadowColor: "drop-shadow(0 10px 20px rgba(255,107,43,0.35))",
  },
  rayonnant: {
    image: rayonnant,
    label: "Tu gères. Continue.",
    dropShadowColor: "drop-shadow(0 10px 20px rgba(255, 215, 0, 0.5))",
  },
  streak: {
    image: streakImg,
    label: "On est chauds. 🔥",
    dropShadowColor: "drop-shadow(0 10px 20px rgba(255, 100, 0, 0.6))",
  },
  chute: {
    image: chute,
    label: "Je me dégrade à cause de toi.",
    dropShadowColor: "drop-shadow(0 10px 20px rgba(101, 67, 33, 0.5))",
  },
  decu: {
    image: decu,
    label: "Vraiment ? C'est tout ?",
    dropShadowColor: "drop-shadow(0 10px 20px rgba(255,107,43,0.35))",
  },
  neutre: {
    image: neutre,
    label: "Fais quelque chose.",
    dropShadowColor: "drop-shadow(0 10px 20px rgba(255,107,43,0.35))",
  },
};

export function useLokynState({
  streak,
  completionPercent,
  joursInactif,
  accountAgeDays,
}: LokynStateParams): LokynStateResult {
  let etat: LokynEtat;

  if (accountAgeDays === 0) {
    etat = "oeuf-1";
  } else if (accountAgeDays === 1) {
    etat = "oeuf-2";
  } else if (completionPercent === 100) {
    etat = "streak";
  } else if (accountAgeDays === 2 && streak < 3) {
    etat = "oeuf-3";
  } else if (accountAgeDays <= 3 && streak < 3) {
    etat = "oeuf-eclosion";
  } else if (completionPercent >= 50 && streak >= 3) {
    etat = "rayonnant";
  } else if (joursInactif >= 2) {
    etat = "chute";
  } else if (joursInactif >= 1 || completionPercent < 50) {
    etat = "decu";
  } else {
    etat = "neutre";
  }

  const cfg = CONFIG[etat];

  return {
    image: cfg.image,
    etat,
    label: cfg.label,
    isOeuf: etat.startsWith("oeuf"),
    dropShadowColor: cfg.dropShadowColor,
  };
}

export const MESSAGES_BY_ETAT: Record<LokynEtat, string[]> = {
  "oeuf-1": [
    "Je suis là. On commence demain.",
    "Tu m'as créé. Maintenant on verra.",
    "Sois prêt. Demain ça commence.",
  ],
  "oeuf-2": [
    "Presque... Je vais bientôt sortir.",
    "Encore un peu de patience.",
    "Tu es prêt pour moi ?",
  ],
  "oeuf-3": [
    "Je vais sortir. Fais-le.",
    "Prouve-moi que tu le mérites.",
    "C'est maintenant ou jamais.",
  ],
  "oeuf-eclosion": [
    "Je suis là ! Tu es prêt ?",
    "On part ensemble maintenant.",
    "Montre-moi ce que tu vaux.",
  ],
  rayonnant: [
    "Tu es en feu. Ne t'arrête pas.",
    "C'est ça. Continue comme ça.",
    "Je suis fier de toi.",
    "Rien ne peut t'arrêter.",
    "On est imbattables.",
  ],
  streak: [
    "On est chauds. Garde le rythme.",
    "Chaque jour compte.",
    "Tu commences à me convaincre.",
    "Pas mal. Mais peut mieux faire.",
    "Continue, on est lancés.",
  ],
  chute: [
    "Tu m'as abandonné. Je le ressens.",
    "Regarde ce que tu m'as fait.",
    "C'est décevant. Vraiment.",
    "Je me dégrade à cause de toi.",
    "Reviens. S'il te plaît.",
    "C'est ta faute.",
  ],
  decu: [
    "Vraiment ? C'est tout ?",
    "Tu peux faire mieux que ça.",
    "...",
    "Je t'avais prévenu.",
    "Déçu. Encore.",
  ],
  neutre: [
    "Fais quelque chose.",
    "Tu attends quoi ?",
    "Un effort. Juste un.",
    "Allez, bouge.",
    "Je t'observe.",
  ],
};
