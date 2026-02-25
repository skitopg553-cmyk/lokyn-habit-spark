

# AUDIT COMPLET LOKYN -- Etat reel post Phase 2

J'ai inspecte chaque fichier, chaque table, chaque colonne, chaque policy, chaque user en base. Voici la realite.

---

## CONSTAT PRINCIPAL : LA MIGRATION AUTH N'A JAMAIS ETE APPLIQUEE

Le fichier `supabase/migrations/20260224094310_auth.sql` existe dans le code mais n'a **jamais ete executee** sur la base de donnees. Preuves :

```text
Colonnes actuelles de user_profile :
  id (text, PK, default "local_user")
  prenom, streak_actuel, streak_record, niveau, xp_total, objectifs, last_decay_date
  
  ❌ PAS de colonne auth_id
  ❌ PAS de colonne created_at

Colonnes actuelles de habits :
  id, user_id (text), nom, categorie, frequence, jours, ...
  
  ❌ PAS de colonne user_id_new

Colonnes actuelles de completions :
  id, habit_id, date, preuve_url, validated_at
  
  ❌ PAS de colonne user_id

Trigger on_auth_user_created : ❌ N'EXISTE PAS
Fonction handle_new_user : ❌ N'EXISTE PAS

RLS policies : TOUTES encore "Allow all" USING(true) WITH CHECK(true)
```

Consequence : le code frontend reference `auth_id` dans 5+ fichiers, mais cette colonne n'existe pas. Toutes les queries echouent silencieusement.

---

## ETAT DE LA BASE DE DONNEES

```text
auth.users : 8 comptes
  - 3 avec email_confirmed_at (peuvent se connecter)
  - 5 SANS confirmation (ne peuvent PAS se connecter)
  
user_profile : 1 SEULE LIGNE → id="local_user", prenom="ruben"
  → Aucun user authentifie n'a de profil
  
habits : ~20 lignes
  → user_id contient de vrais UUIDs (les inserts marchent car user_id est text)
  → Mais les habits de "local_user" n'existent plus (plus personne ne les utilise)
  
completions : non verifiees mais liees aux habits via habit_id
```

---

## BUGS IDENTIFIES -- PAR ORDRE DE GRAVITE

### BUG 1 : Aucun user connecte n'a de profil (CRITIQUE)

`useUserProfile()` fait : `supabase.from("user_profile").select("*").eq("id", uid)`

Ou `uid` = UUID auth (ex: `d6ed64ae-...`). Mais la seule ligne dans `user_profile` a `id = "local_user"`. Resultat : **profile = null pour tous les users connectes**.

Consequences en cascade :
- HomePage : `profile?.prenom` → "Alex" (fallback), `profile?.streak_actuel` → 0, `profile?.xp_total` → 0
- XP toujours a 0, niveau toujours a 1
- Le streak ne se met jamais a jour (la ligne n'existe pas)
- `applyXpDecay` ne fait rien (pas de profil)

### BUG 2 : Onboarding en boucle infinie (CRITIQUE)

Flux actuel :
1. User se connecte → AuthGuard charge
2. AuthGuard fait `supabase.from("user_profile").select("prenom").eq("auth_id", session.user.id)`
3. La colonne `auth_id` **n'existe pas** → la query retourne null
4. `prenom` = null (pas "Alex")
5. Le check `prenom === "Alex"` est false → l'user passe le guard → va sur `/home`

**Mais** : si l'onboarding a deja ete fait, le `handleFinish()` fait `supabase.from("user_profile").upsert({ auth_id: user.id, prenom: ... }, { onConflict: "auth_id" })`. La colonne `auth_id` n'existe pas → **l'upsert echoue silencieusement**. Le prenom n'est jamais sauvegarde.

Scenario onboarding infini : si le code est modifie pour que le guard redirige vers `/onboarding` quand le profil n'existe pas (au lieu de checker "Alex"), l'user fait l'onboarding → ca ne sauvegarde rien → retour au guard → re-redirige vers l'onboarding → boucle.

### BUG 3 : XP ne monte jamais (CRITIQUE)

`useCompleteHabit.complete()` fait :
```ts
const { data: profileData } = await supabase.from("user_profile")
  .select("xp_total").eq("id", userId).maybeSingle()
```
`userId` = UUID auth. Pas de match → `profileData` = null → `newXp = 0 + habit.xp_estime` → update sur `eq("id", userId)` → **aucune ligne matchee** → rien ne se passe.

L'optimistic update montre l'XP monter dans l'UI, mais au prochain refresh tout revient a 0.

### BUG 4 : Streak ne fonctionne pas (CRITIQUE)

`updateStreak()` fait `eq("id", uid)` sur `user_profile` → pas de match → la mise a jour streak ne s'applique a rien.

### BUG 5 : Lokyn toujours en etat "streak" ou "neutre" (MAJEUR)

`accountAgeDays` est calcule via `supabase.from("user_profile").select("created_at")` mais :
- La colonne `created_at` n'existe pas
- Meme si elle existait, le query utilise `eq("auth_id", uid)` qui echoue aussi
- Fallback : `setAccountAgeDays(99)` → Lokyn saute directement a l'etat adulte, jamais d'oeufs

`joursInactif` est calcule via `supabase.from("completions").select("date").in("date", pastDates)` **sans filtre par user** → retourne les completions de TOUS les users → fausse le calcul.

Avec `joursInactif = 0` et `completionPercent = 100` (si toutes les habitudes sont cochees), Lokyn est toujours en etat "streak". Sinon avec completionPercent = 0 et joursInactif = 0, il est "neutre". La gradation decu/enerve/chute ne s'active presque jamais.

### BUG 6 : 5 users ne peuvent pas se connecter (MAJEUR)

Sur 8 users, 5 n'ont pas `email_confirmed_at`. Si auto-confirm est bien active maintenant, ces 5 users ont ete crees **avant** l'activation. Ils ne peuvent pas se connecter avec `signInWithPassword`.

### BUG 7 : Erreur de build TS2589 dans AuthGuard (BLOQUANT)

Ligne 19 : `supabase.from("user_profile").select("prenom").eq("auth_id", session.user.id).maybeSingle()` — le chaining Supabase avec une colonne inexistante dans les types generes cause une recursion de type infinie. Le `as any` sur la ligne 23 ne suffit pas car le type s'evalue avant le cast.

### BUG 8 : Erreurs de build vite.config.ts (BLOQUANT)

Le plugin `png-cache-plugin` utilise des parametres `server`, `req`, `res`, `next` sans types. Il faut ajouter les types explicites ou caster en `any`.

### BUG 9 : ProfilePage `.eq("auth_id", user.id)` pour le changement de prenom

`handleSavePrenom` fait `supabase.from("user_profile").update({...}).eq("auth_id", user.id)` — la colonne n'existe pas → le update ne matche rien → le prenom ne se sauvegarde jamais.

### BUG 10 : HabitsPage interactions bloquees pour le passe

`isInteractionDisabled = isSelectedFuture || isPast` — les habitudes des jours passes sont **non-cochables**. C'est un choix UX, mais le message "Le passe ne se modifie pas" est frustrant si l'user a oublie de cocher hier. A discuter.

---

## PLAN DE CORRECTION -- 12 ACTIONS CHIRURGICALES

### ACTION 1 : Appliquer la migration SQL manquante (corrigee)

La migration existante a des problemes (elle ajoute `user_id_new` au lieu de modifier `user_id`, elle ne cree pas `created_at`). Voici ce qu'il faut reellement faire :

```sql
-- Ajouter auth_id et created_at a user_profile
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Ajouter user_id a completions (pour filtre direct)
ALTER TABLE completions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Creer le trigger de creation auto de profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_profile (id, auth_id, prenom, created_at, ...)
  VALUES (NEW.id::text, NEW.id, 'Alex', now(), ...)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### ACTION 2 : Creer les profils manquants pour les 8 users existants

Inserer une ligne `user_profile` pour chaque user auth qui n'en a pas, avec `auth_id` et `id` = leur UUID.

### ACTION 3 : Confirmer les emails des 5 users non confirmes

Ou les supprimer si ce sont des comptes de test.

### ACTION 4 : Fix useUserProfile — utiliser auth_id au lieu de id

`fetchUserProfile()` doit faire `.eq("auth_id", uid)` au lieu de `.eq("id", uid)`. Pareil pour `applyXpDecay`, `updateStreak`, `useCompleteHabit` (toutes les queries qui font `.eq("id", uid)` sur `user_profile`).

### ACTION 5 : Fix AuthGuard — cast as any pour eviter TS2589

Envelopper toute la query dans un cast `as any` au bon endroit, ou utiliser une approche `.from("user_profile" as any)`.

### ACTION 6 : Fix vite.config.ts — typer les parametres du plugin

Ajouter `(server: any)` et `(req: any, res: any, next: any)` ou utiliser les types de `http` et `vite`.

### ACTION 7 : Fix HomePage accountAgeDays — utiliser created_at via auth_id

La query doit utiliser `eq("auth_id", uid)` et la colonne `created_at` doit exister.

### ACTION 8 : Fix HomePage joursInactif — filtrer par user

La query de completions pour `joursInactif` ne filtre pas par user. Il faut d'abord recuperer les habit_ids de l'user, puis filtrer les completions par ces habit_ids (comme dans `useTodayHabits`).

### ACTION 9 : Fix Onboarding handleFinish — s'assurer que la ligne existe

Utiliser `upsert` avec `onConflict: "auth_id"` mais seulement apres que la colonne `auth_id` existe. Ou faire un INSERT s'il n'y a pas de profil.

### ACTION 10 : Fix RLS policies

Remplacer les `USING(true)` par des policies restrictives basees sur `auth.uid()`.

### ACTION 11 : Fix ProfilePage handleSavePrenom

Utiliser `eq("auth_id", user.id)` apres que la colonne existe.

### ACTION 12 : Nettoyer les donnees de test en base

Supprimer les doublons d'habitudes et les profils orphelins.

---

## RESUME : POURQUOI LES IA DISAIENT "RESOLU"

Les IA ont ecrit la migration SQL dans un fichier, mais ce fichier n'a **jamais ete execute** sur la base de donnees reelle. Le code a ete modifie pour utiliser `auth_id`, mais la colonne n'existe pas dans la DB. Resultat : le code compile (grace aux `as any`), mais toutes les queries retournent null/vide a l'execution.

C'est l'equivalent d'ecrire les instructions pour construire un pont, mais ne jamais poser les fondations. Tout le monde dit "le plan est bon" sans verifier que le beton a ete coule.

**La correction prend environ 1h** : executer la migration SQL, creer les profils manquants, corriger les 6-7 fichiers qui font `.eq("id", uid)` au lieu de `.eq("auth_id", uid)`, et fixer les 2 erreurs de build.

