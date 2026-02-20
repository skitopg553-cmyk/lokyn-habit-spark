import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Habit {
  id: string;
  user_id: string;
  nom: string;
  categorie: string;
  frequence: string;
  jours: string[];
  fois_par_semaine: number;
  heure_rappel: string | null;
  preuve_requise: boolean;
  xp_estime: number;
  date_creation: string;
  actif: boolean;
  completed?: boolean;
}

export interface UserProfile {
  id: string;
  prenom: string;
  streak_actuel: number;
  streak_record: number;
  niveau: number;
  xp_total: number;
  objectifs: string[];
}

const JOUR_MAP = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
const JOUR_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function getWeekDays() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: d,
      label: JOUR_LABELS[i],
      isToday: d.toDateString() === today.toDateString(),
      dateStr: d.toISOString().split("T")[0],
      num: d.getDate(),
    };
  });
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export function useTodayHabits(selectedDate?: string) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const dateStr = selectedDate || toDateStr(new Date());

  const refresh = useCallback(async () => {
    const targetDate = new Date(dateStr + "T12:00:00");
    const jourActuel = JOUR_MAP[targetDate.getDay()];

    const { data: allHabits } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", "local_user")
      .eq("actif", true) as any;

    const todayHabits = (allHabits || []).filter((h: any) => {
      if (h.frequence === "daily") return true;
      if (h.frequence === "weekly" || h.frequence === "recurring") return h.jours?.includes(jourActuel);
      if (h.frequence === "once") return true;
      return false;
    });

    const { data: completions } = await supabase
      .from("completions")
      .select("habit_id")
      .eq("date", dateStr) as any;

    const completedIds = (completions || []).map((c: any) => c.habit_id);

    setHabits(
      todayHabits.map((h: any) => ({
        ...h,
        completed: completedIds.includes(h.id),
      }))
    );
    setLoading(false);
  }, [dateStr]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { habits, loading, refresh };
}

export function useCompleteHabit(onRefresh: () => void) {
  const complete = useCallback(async (habitId: string, preuveRequise: boolean) => {
    const dateStr = toDateStr(new Date());

    const { data: existing } = await supabase
      .from("completions")
      .select("id")
      .eq("habit_id", habitId)
      .eq("date", dateStr)
      .maybeSingle() as any;

    if (existing) return;

    if (preuveRequise) {
      toast("📸 Preuve requise — fonctionnalité à venir.");
      return;
    }

    await supabase.from("completions").insert({ habit_id: habitId, date: dateStr } as any);

    // Update XP + niveau
    const { data: habit } = await supabase.from("habits").select("xp_estime").eq("id", habitId).maybeSingle() as any;
    if (habit) {
      const { data: profile } = await supabase.from("user_profile").select("xp_total").eq("id", "local_user").maybeSingle() as any;
      const newXp = (profile?.xp_total || 0) + habit.xp_estime;
      const newNiveau = Math.floor(newXp / 100) + 1;
      await supabase.from("user_profile").update({ xp_total: newXp, niveau: newNiveau } as any).eq("id", "local_user");
    }

    await updateStreak();
    onRefresh();
    toast("✅ Habitude validée !");
  }, [onRefresh]);

  const uncomplete = useCallback(async (habitId: string) => {
    const dateStr = toDateStr(new Date());
    await supabase.from("completions").delete().eq("habit_id", habitId).eq("date", dateStr);
    onRefresh();
    toast("Habitude décochée.");
  }, [onRefresh]);

  return { complete, uncomplete };
}

export async function updateStreak() {
  const { data: completions } = await supabase
    .from("completions")
    .select("date")
    .order("date", { ascending: false }) as any;

  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", "local_user")
    .eq("actif", true) as any;

  const dailyHabits = (habits || []).filter((h: any) => h.frequence === "daily" || h.frequence === "recurring");
  if (!dailyHabits.length) return;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = toDateStr(d);
    const completedToday = (completions || []).filter((c: any) => c.date === ds).length;
    if (completedToday >= dailyHabits.length) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const { data: profile } = await supabase
    .from("user_profile")
    .select("streak_record")
    .eq("id", "local_user")
    .maybeSingle() as any;

  await supabase
    .from("user_profile")
    .update({
      streak_actuel: streak,
      streak_record: Math.max(streak, profile?.streak_record || 0),
    } as any)
    .eq("id", "local_user");
}

export async function applyXpDecay() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    return d.toISOString().split("T")[0];
  });

  const { data: completions } = await supabase
    .from("completions")
    .select("date")
    .in("date", last7) as any;

  const { data: profile } = await supabase
    .from("user_profile")
    .select("xp_total, niveau, last_decay_date")
    .eq("id", "local_user")
    .maybeSingle() as any;

  if (!profile) return;
  if (profile.last_decay_date === todayStr) return;

  let inactiveDays = 0;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const hasActivity = (completions || []).some(
      (c: any) => c.date === ds
    );
    if (!hasActivity) inactiveDays++;
    else break;
  }

  let decay = 0;
  if (inactiveDays >= 7) decay = 100;
  else if (inactiveDays >= 3) decay = 50;
  else if (inactiveDays >= 1) decay = 20;

  if (decay === 0) return;

  const newXp = Math.max(0, (profile.xp_total || 0) - decay);
  const newNiveau = Math.max(1, Math.floor(newXp / 100) + 1);

  await supabase
    .from("user_profile")
    .update({
      xp_total: newXp,
      niveau: newNiveau,
      last_decay_date: todayStr,
    } as any)
    .eq("id", "local_user");
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("user_profile")
      .select("*")
      .eq("id", "local_user")
      .maybeSingle() as any;
    setProfile(data);
  }, []);

  useEffect(() => {
    applyXpDecay().then(() => refresh());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, refresh };
}

export function useHomeStats(habits: Habit[]) {
  const [stats, setStats] = useState({ energie: 0, discipline: 0, moral: 0 });

  useEffect(() => {
    async function calc() {
      const total = habits.length || 1;
      const done = habits.filter((h) => h.completed).length;
      const discipline = Math.round((done / total) * 100);

      const energyHabits = habits.filter((h) => ["sport", "nutrition", "Sport", "Nutrition"].includes(h.categorie));
      const energyDone = energyHabits.filter((h) => h.completed).length;
      const energie = energyHabits.length ? Math.round((energyDone / energyHabits.length) * 100) : discipline;

      const { data: profile } = await supabase
        .from("user_profile")
        .select("streak_actuel")
        .eq("id", "local_user")
        .maybeSingle() as any;
      const moral = Math.min((profile?.streak_actuel || 0) * 10, 100);

      setStats({ energie, discipline, moral });
    }
    calc();
  }, [habits]);

  return stats;
}

export function useDaysWithActivity(weekDates: string[]) {
  const [activeDates, setActiveDates] = useState<string[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("completions")
        .select("date")
        .in("date", weekDates) as any;
      setActiveDates([...new Set((data || []).map((c: any) => c.date))] as string[]);
    }
    fetch();
  }, [weekDates.join(",")]);

  return activeDates;
}

export async function createHabit(formData: {
  nom: string;
  categorie: string;
  frequence: string;
  jours: string[];
  fois_par_semaine: number;
  heure_rappel: string | null;
  preuve_requise: boolean;
  xp_estime: number;
}) {
  const { error } = await supabase.from("habits").insert({
    user_id: "local_user",
    ...formData,
  } as any);

  if (error) {
    toast.error("Erreur lors de la création.");
    return false;
  }

  toast("Habitude créée. On verra si tu tiens parole.");
  return true;
}
