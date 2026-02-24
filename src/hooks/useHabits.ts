import { useCallback, Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toDateStr, JOUR_MAP, JOUR_LABELS } from "@/lib/utils";

// --------------- Helper to get current userId ----------------
async function getAuthUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? "local_user";
}

// --------------- Types ----------------

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

// --------------- Week helpers ----------------

export function getWeekDays(weekOffset = 0) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = toDateStr(d);
    const todayStr = toDateStr(new Date());
    return {
      date: d,
      label: JOUR_LABELS[i],
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      dateStr,
      num: d.getDate(),
    };
  });
}

// --------------- useTodayHabits (React Query) ----------------

async function fetchTodayHabits(dateStr: string): Promise<Habit[]> {
  const userId = await getAuthUserId();
  const targetDate = new Date(dateStr + "T12:00:00");
  const jourActuel = JOUR_MAP[targetDate.getDay()];
  const today = toDateStr(new Date());

  const { data: allHabits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("actif", true)
    .lte("date_creation", dateStr) as any;

  let todayHabits: any[] = (allHabits || []).filter((h: any) => {
    if (h.frequence === "daily") return true;
    if (h.frequence === "weekly" || h.frequence === "recurring") return h.jours?.includes(jourActuel);
    if (h.frequence === "once") return true;
    return false;
  });

  const userHabitIds = (allHabits || []).map((h: any) => h.id);

  if (userHabitIds.length === 0) return [];

  const { data: completions } = await supabase
    .from("completions")
    .select("habit_id")
    .in("habit_id", userHabitIds)
    .eq("date", dateStr) as any;

  const completedIds: string[] = (completions || []).map((c: any) => c.habit_id);

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

  return todayHabits.map((h: any) => ({
    ...h,
    completed: completedIds.includes(h.id),
  }));
}

export function useTodayHabits(selectedDate?: string) {
  const dateStr = selectedDate || toDateStr(new Date());
  const queryClient = useQueryClient();

  const { data: habits = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["habits", dateStr],
    queryFn: () => fetchTodayHabits(dateStr),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // setHabits kept for optimistic updates (direct mutation of query cache)
  const setHabits: Dispatch<SetStateAction<Habit[]>> = useCallback(
    (updater) => {
      queryClient.setQueryData<Habit[]>(["habits", dateStr], (prev = []) => {
        if (typeof updater === "function") return updater(prev);
        return updater;
      });
    },
    [queryClient, dateStr]
  );

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return { habits, loading, refresh, setHabits };
}

// --------------- useCompleteHabit (unchanged pattern + RQ invalidation) ----------------

export function useCompleteHabit(
  onRefresh: () => void,
  setHabits: Dispatch<SetStateAction<Habit[]>>,
  selectedDate?: string,
  setProfile?: Dispatch<SetStateAction<UserProfile | null>>
) {
  const queryClient = useQueryClient();

  const complete = useCallback(async (habitId: string, xpEstime?: number) => {
    const userId = await getAuthUserId();
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

      const { data: habit } = await supabase.from("habits").select("xp_estime").eq("id", habitId).maybeSingle() as any;
      if (habit) {
        const { data: profileData } = await supabase.from("user_profile").select("xp_total").eq("id", userId).maybeSingle() as any;
        const newXp = (profileData?.xp_total || 0) + habit.xp_estime;
        const newNiveau = Math.floor(newXp / 100) + 1;
        await supabase.from("user_profile").update({ xp_total: newXp, niveau: newNiveau } as any).eq("id", userId);
      }

      await updateStreak(userId);
      localStorage.removeItem("lokyn_jours_inactif");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      onRefresh();
    } catch {
      // Rollback
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
  }, [onRefresh, setHabits, selectedDate, setProfile, queryClient]);

  const uncomplete = useCallback(async (habitId: string, xpEstime?: number) => {
    const userId = await getAuthUserId();
    const dateStr = selectedDate || toDateStr(new Date());

    setHabits((prev) => prev.map((h) => h.id === habitId ? { ...h, completed: false } : h));

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

      const { error } = await (supabase.from("completions").delete().eq("habit_id", habitId).eq("date", dateStr) as any);
      if (error) throw error;

      const { data: habit } = await supabase.from("habits").select("xp_estime").eq("id", habitId).maybeSingle() as any;
      if (habit) {
        const { data: profileData } = await supabase.from("user_profile").select("xp_total").eq("id", userId).maybeSingle() as any;
        const newXp = Math.max(0, (profileData?.xp_total || 0) - habit.xp_estime);
        const newNiveau = Math.max(1, Math.floor(newXp / 100) + 1);
        await supabase.from("user_profile").update({ xp_total: newXp, niveau: newNiveau } as any).eq("id", userId);
      }

      await updateStreak(userId);
      localStorage.removeItem("lokyn_jours_inactif");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      onRefresh();
    } catch {
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
  }, [onRefresh, setHabits, selectedDate, setProfile, queryClient]);

  return { complete, uncomplete };
}

// --------------- updateStreak (dynamic userId) ----------------

export async function updateStreak(userId?: string) {
  const uid = userId ?? await getAuthUserId();

  const habitsQuery = supabase
    .from("habits")
    .select("id, frequence, jours, date_creation") as any;
  const { data: allHabits } = await habitsQuery.eq("user_id", uid);

  const allRecurring = (allHabits || []).filter((h: any) =>
    h.frequence === "daily" || h.frequence === "recurring"
  );
  if (!allRecurring.length) return;

  const userHabitIds = allRecurring.map((h: any) => h.id);

  const { data: completions } = await supabase
    .from("completions")
    .select("date, habit_id")
    .in("habit_id", userHabitIds)
    .order("date", { ascending: false }) as any;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = toDateStr(d);
    const jourLabel = JOUR_MAP[d.getDay()];

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

  const { data: profile } = await supabase.from("user_profile").select("streak_record").eq("id", uid).maybeSingle() as any;

  await supabase.from("user_profile").update({
    streak_actuel: streak,
    streak_record: Math.max(streak, profile?.streak_record || 0),
  } as any).eq("id", uid);
}

// --------------- applyXpDecay (dynamic userId) ----------------

let decayApplied = false;

export async function applyXpDecay() {
  if (decayApplied) return;
  decayApplied = true;

  const uid = await getAuthUserId();
  const today = new Date();
  const todayStr = toDateStr(today);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    return toDateStr(d);
  });

  const { data: userHabits } = await supabase.from("habits").select("id").eq("user_id", uid) as any;
  const userHabitIds = (userHabits || []).map((h: any) => h.id);

  if (userHabitIds.length === 0) return;

  const { data: completions } = await supabase
    .from("completions")
    .select("date")
    .in("habit_id", userHabitIds)
    .in("date", last7) as any;

  const { data: profile } = await supabase.from("user_profile").select("xp_total, niveau, last_decay_date").eq("id", uid).maybeSingle() as any;

  if (!profile) return;
  if (profile.last_decay_date === todayStr) return;

  let inactiveDays = 0;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = toDateStr(d);
    const hasActivity = (completions || []).some((c: any) => c.date === ds);
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

  await supabase.from("user_profile").update({
    xp_total: newXp,
    niveau: newNiveau,
    last_decay_date: todayStr,
  } as any).eq("id", uid);
}

// --------------- useUserProfile (React Query) ----------------

async function fetchUserProfile(): Promise<UserProfile | null> {
  const uid = await getAuthUserId();
  const { data } = await supabase.from("user_profile").select("*").eq("id", uid).maybeSingle() as any;
  return data ?? null;
}

export function useUserProfile() {
  const queryClient = useQueryClient();

  const { data: profile = null, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      await applyXpDecay();
      return fetchUserProfile();
    },
    staleTime: 10000,
  });

  const setProfile: Dispatch<SetStateAction<UserProfile | null>> = useCallback(
    (updater) => {
      queryClient.setQueryData<UserProfile | null>(["profile"], (prev = null) => {
        if (typeof updater === "function") return updater(prev);
        return updater;
      });
    },
    [queryClient]
  );

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return { profile, refresh, setProfile };
}

// --------------- useHomeStats ----------------

export function useHomeStats(habits: Habit[]) {
  return { energie: 0, discipline: 0, moral: 0 };
}

// --------------- useDaysWithActivity ----------------

export function useDaysWithActivity(weekDates: string[]) {
  const { data: activeDates = [] } = useQuery({
    queryKey: ["activity", weekDates.join(",")],
    queryFn: async () => {
      const uid = await getAuthUserId();
      const { data: userHabits } = await supabase.from("habits").select("id").eq("user_id", uid) as any;
      const userHabitIds = (userHabits || []).map((h: any) => h.id);

      if (userHabitIds.length === 0) return [];

      const { data } = await supabase
        .from("completions")
        .select("date")
        .in("habit_id", userHabitIds)
        .in("date", weekDates) as any;
      return [...new Set((data || []).map((c: any) => c.date))] as string[];
    },
    staleTime: 30000,
  });
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
  const uid = await getAuthUserId();

  const { data: existing } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", uid)
    .eq("nom", formData.nom)
    .eq("actif", true)
    .maybeSingle() as any;

  if (existing) {
    toast.error("Cette habitude existe déjà et est active.");
    return false;
  }

  const { error } = await supabase.from("habits").insert({
    user_id: uid,
    ...formData,
  } as any);

  if (error) {
    toast.error("Erreur lors de la création.");
    return false;
  }

  toast("Habitude créée. On verra si tu tiens parole.");
  return true;
}
