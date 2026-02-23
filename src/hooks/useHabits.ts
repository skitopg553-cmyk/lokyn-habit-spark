import { useState, useEffect, useCallback, Dispatch, SetStateAction } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toDateStr, JOUR_MAP, JOUR_LABELS } from "@/lib/utils";

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

export function useTodayHabits(selectedDate?: string) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const dateStr = selectedDate || toDateStr(new Date());

  const refresh = useCallback(async () => {
    const targetDate = new Date(dateStr + "T12:00:00");
    const jourActuel = JOUR_MAP[targetDate.getDay()];
    const today = toDateStr(new Date());

    const { data: allHabits } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", "local_user")
      .eq("actif", true) as any;

    let todayHabits: any[] = (allHabits || []).filter((h: any) => {
      if (h.frequence === "daily") return true;
      if (h.frequence === "weekly" || h.frequence === "recurring") return h.jours?.includes(jourActuel);
      if (h.frequence === "once") return true;
      return false;
    });

    const { data: completions } = await supabase
      .from("completions")
      .select("habit_id")
      .eq("date", dateStr) as any;

    const completedIds: string[] = (completions || []).map((c: any) => c.habit_id);

    // Pour les dates passées/actuelles, inclure aussi les habitudes supprimées qui ont été complétées ce jour-là
    if (dateStr <= today && completedIds.length > 0) {
      const activeIds = new Set(todayHabits.map((h: any) => h.id));
      const deletedCompletedIds = completedIds.filter((id) => !activeIds.has(id));
      if (deletedCompletedIds.length > 0) {
        const { data: deletedHabits } = await supabase
          .from("habits")
          .select("*")
          .in("id", deletedCompletedIds) as any;
        todayHabits = [...todayHabits, ...(deletedHabits || [])];
      }
    }

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

  return { habits, loading, refresh, setHabits };
}

export function useCompleteHabit(
  onRefresh: () => void,
  setHabits: Dispatch<SetStateAction<Habit[]>>,
  selectedDate?: string,
  setProfile?: Dispatch<SetStateAction<UserProfile | null>>
) {
  const complete = useCallback(async (habitId: string, xpEstime?: number) => {
    const dateStr = selectedDate || toDateStr(new Date());

    // Optimistic update habits
    setHabits((prev) => prev.map((h) => h.id === habitId ? { ...h, completed: true } : h));

    // Optimistic update profile XP
    if (setProfile && xpEstime !== undefined) {
      setProfile((prev) => {
        if (!prev) return prev;
        const newXp = prev.xp_total + xpEstime;
        const newNiveau = Math.floor(newXp / 100) + 1;
        return { ...prev, xp_total: newXp, niveau: newNiveau };
      });
    }

    try {
      const { data: existing } = await supabase
        .from("completions")
        .select("id")
        .eq("habit_id", habitId)
        .eq("date", dateStr)
        .maybeSingle() as any;

      if (!existing) {
        const { error } = await supabase.from("completions").insert({ habit_id: habitId, date: dateStr } as any);
        if (error) throw error;
      }

      // Update XP + niveau in Supabase
      const { data: habit } = await supabase.from("habits").select("xp_estime").eq("id", habitId).maybeSingle() as any;
      if (habit) {
        const { data: profileData } = await supabase.from("user_profile").select("xp_total").eq("id", "local_user").maybeSingle() as any;
        const newXp = (profileData?.xp_total || 0) + habit.xp_estime;
        const newNiveau = Math.floor(newXp / 100) + 1;
        await supabase.from("user_profile").update({ xp_total: newXp, niveau: newNiveau } as any).eq("id", "local_user");
      }

      await updateStreak();
      localStorage.removeItem("lokyn_jours_inactif");
      onRefresh();
    } catch {
      // Rollback optimistic updates
      setHabits((prev) => prev.map((h) => h.id === habitId ? { ...h, completed: false } : h));
      if (setProfile && xpEstime !== undefined) {
        setProfile((prev) => {
          if (!prev) return prev;
          const newXp = Math.max(0, prev.xp_total - xpEstime);
          const newNiveau = Math.max(1, Math.floor(newXp / 100) + 1);
          return { ...prev, xp_total: newXp, niveau: newNiveau };
        });
      }
    }
  }, [onRefresh, setHabits, selectedDate, setProfile]);

  const uncomplete = useCallback(async (habitId: string, xpEstime?: number) => {
    const dateStr = selectedDate || toDateStr(new Date());

    // Optimistic update habits
    setHabits((prev) => prev.map((h) => h.id === habitId ? { ...h, completed: false } : h));

    // Optimistic update profile XP (subtract)
    if (setProfile && xpEstime !== undefined) {
      setProfile((prev) => {
        if (!prev) return prev;
        const newXp = Math.max(0, prev.xp_total - xpEstime);
        const newNiveau = Math.max(1, Math.floor(newXp / 100) + 1);
        return { ...prev, xp_total: newXp, niveau: newNiveau };
      });
    }

    try {
      const { data: existing } = await supabase
        .from("completions")
        .select("id")
        .eq("habit_id", habitId)
        .eq("date", dateStr)
        .maybeSingle() as any;

      if (!existing) return;

      const { error } = await supabase.from("completions").delete().eq("habit_id", habitId).eq("date", dateStr);
      if (error) throw error;

      // Subtract XP in Supabase
      const { data: habit } = await supabase.from("habits").select("xp_estime").eq("id", habitId).maybeSingle() as any;
      if (habit) {
        const { data: profileData } = await supabase.from("user_profile").select("xp_total").eq("id", "local_user").maybeSingle() as any;
        const newXp = Math.max(0, (profileData?.xp_total || 0) - habit.xp_estime);
        const newNiveau = Math.max(1, Math.floor(newXp / 100) + 1);
        await supabase.from("user_profile").update({ xp_total: newXp, niveau: newNiveau } as any).eq("id", "local_user");
      }

      await updateStreak();
      localStorage.removeItem("lokyn_jours_inactif");
      onRefresh();
    } catch {
      // Rollback optimistic updates
      setHabits((prev) => prev.map((h) => h.id === habitId ? { ...h, completed: true } : h));
      if (setProfile && xpEstime !== undefined) {
        setProfile((prev) => {
          if (!prev) return prev;
          const newXp = prev.xp_total + xpEstime;
          const newNiveau = Math.floor(newXp / 100) + 1;
          return { ...prev, xp_total: newXp, niveau: newNiveau };
        });
      }
    }
  }, [onRefresh, setHabits, selectedDate, setProfile]);

  return { complete, uncomplete };
}

export async function updateStreak() {
  const { data: completions } = await supabase
    .from("completions")
    .select("date, habit_id")
    .order("date", { ascending: false }) as any;

  // Fetch ALL habits (including inactive) to check historical scheduling
  const { data: allHabits } = await supabase
    .from("habits")
    .select("id, frequence, jours, date_creation")
    .eq("user_id", "local_user") as any;

  const allRecurring = (allHabits || []).filter((h: any) =>
    h.frequence === "daily" || h.frequence === "recurring"
  );
  if (!allRecurring.length) return;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = toDateStr(d);
    const jourLabel = JOUR_MAP[d.getDay()];

    // Only count habits that existed on this day and were scheduled
    const habitsForDay = allRecurring.filter((h: any) => {
      const created = (h.date_creation || "").slice(0, 10);
      if (created > ds) return false;
      if (h.frequence === "daily") return true;
      if (h.frequence === "recurring") return h.jours?.includes(jourLabel);
      return false;
    });

    const habitIds = new Set(habitsForDay.map((h: any) => h.id));
    const completedCount = (completions || []).filter(
      (c: any) => c.date === ds && habitIds.has(c.habit_id)
    ).length;

    if (completedCount >= habitsForDay.length) {
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

// Singleton guard — applyXpDecay runs only once per session
let decayApplied = false;

export async function applyXpDecay() {
  if (decayApplied) return;
  decayApplied = true;

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

  return { profile, refresh, setProfile };
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
