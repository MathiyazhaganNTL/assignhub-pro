-- =========================================================
-- GAMIFICATION TABLES & LOGIC
-- =========================================================

-- 1. Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view subjects" ON public.subjects;
CREATE POLICY "Anyone authenticated can view subjects" ON public.subjects
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed subjects
INSERT INTO public.subjects (name, code) VALUES
  ('Database Management Systems', 'DBMS'),
  ('Data Communication Networks', 'DCN'),
  ('Operating Systems', 'OS'),
  ('Digital Design & Architecture', 'DDA'),
  ('Knowledge & Key Resources', 'KKR')
ON CONFLICT (code) DO NOTHING;

-- 2. Add optional gamification columns to assignments
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS max_coins INTEGER DEFAULT 100;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS daily_reduction INTEGER;

-- 3. User Points
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_points TO authenticated;
GRANT ALL ON public.user_points TO service_role;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all points" ON public.user_points;
CREATE POLICY "Users can view all points" ON public.user_points
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "System can manage points" ON public.user_points;
CREATE POLICY "System can manage points" ON public.user_points
  FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Users can insert own points" ON public.user_points;
CREATE POLICY "Users can insert own points" ON public.user_points
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own points" ON public.user_points;
CREATE POLICY "Users can update own points" ON public.user_points
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 4. User Coins
CREATE TABLE IF NOT EXISTS public.user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_coins INTEGER NOT NULL DEFAULT 0,
  coin_level INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_coins TO authenticated;
GRANT ALL ON public.user_coins TO service_role;
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all coins" ON public.user_coins;
CREATE POLICY "Users can view all coins" ON public.user_coins
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "System can manage coins" ON public.user_coins;
CREATE POLICY "System can manage coins" ON public.user_coins
  FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Users can insert own coins" ON public.user_coins;
CREATE POLICY "Users can insert own coins" ON public.user_coins
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own coins" ON public.user_coins;
CREATE POLICY "Users can update own coins" ON public.user_coins
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 5. Achievements (definitions)
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'star',
  points_reward INTEGER NOT NULL DEFAULT 0,
  coins_reward INTEGER NOT NULL DEFAULT 0
);

GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view achievements" ON public.achievements;
CREATE POLICY "Anyone authenticated can view achievements" ON public.achievements
  FOR SELECT TO authenticated USING (true);

-- Seed achievements
INSERT INTO public.achievements (title, description, icon, points_reward, coins_reward) VALUES
  ('Early Bird', 'Submitted before deadline', 'sunrise', 50, 25),
  ('Streak 3', '3-day submission streak', 'flame', 75, 30),
  ('On Track', 'Maintained assignment consistency', 'target', 40, 20),
  ('Top Performer', 'Top 10 leaderboard rank', 'trophy', 100, 50)
ON CONFLICT DO NOTHING;

-- 6. User Achievements (earned)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 7. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_logs;
CREATE POLICY "Users can view own activity" ON public.activity_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own activity" ON public.activity_logs;
CREATE POLICY "Users can insert own activity" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 8. Leaderboard View
CREATE OR REPLACE VIEW public.leaderboard AS
  SELECT
    up.user_id,
    p.full_name AS name,
    up.total_points,
    RANK() OVER (ORDER BY up.total_points DESC) AS rank
  FROM public.user_points up
  JOIN public.profiles p ON up.user_id = p.id
  WHERE p.status = 'approved';

GRANT SELECT ON public.leaderboard TO authenticated;

-- 9. Trigger: auto-award points/coins on submission
CREATE OR REPLACE FUNCTION public.award_submission_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_assignment RECORD;
  v_days_total INTEGER;
  v_days_elapsed INTEGER;
  v_daily_red INTEGER;
  v_coins_earned INTEGER;
  v_points_earned INTEGER;
BEGIN
  -- Get assignment details
  SELECT * INTO v_assignment FROM public.assignments WHERE id = NEW.assignment_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Calculate coin reward
  v_days_total := GREATEST(1, EXTRACT(DAY FROM (v_assignment.deadline - COALESCE(v_assignment.assigned_date, v_assignment.created_at)))::INTEGER);
  v_daily_red := COALESCE(v_assignment.daily_reduction, GREATEST(1, COALESCE(v_assignment.max_coins, 100) / v_days_total));
  v_days_elapsed := GREATEST(0, EXTRACT(DAY FROM (NEW.submitted_at - COALESCE(v_assignment.assigned_date, v_assignment.created_at)))::INTEGER);
  v_coins_earned := GREATEST(0, COALESCE(v_assignment.max_coins, 100) - (v_days_elapsed * v_daily_red));
  v_points_earned := 50 + v_coins_earned; -- base 50 points per submission + coin bonus

  -- Upsert user_points
  INSERT INTO public.user_points (user_id, total_points, current_level)
  VALUES (NEW.student_id, v_points_earned, GREATEST(1, v_points_earned / 150 + 1))
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_points.total_points + v_points_earned,
    current_level = GREATEST(1, (user_points.total_points + v_points_earned) / 150 + 1),
    updated_at = now();

  -- Upsert user_coins
  INSERT INTO public.user_coins (user_id, total_coins, coin_level)
  VALUES (NEW.student_id, v_coins_earned, v_coins_earned / 50)
  ON CONFLICT (user_id) DO UPDATE SET
    total_coins = user_coins.total_coins + v_coins_earned,
    coin_level = (user_coins.total_coins + v_coins_earned) / 50,
    updated_at = now();

  -- Log activity
  INSERT INTO public.activity_logs (user_id, action, reference_type, reference_id)
  VALUES (NEW.student_id, 'Assignment "' || v_assignment.title || '" submitted — earned ' || v_coins_earned || ' coins, ' || v_points_earned || ' points', 'submission', NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_submission_award_points ON public.submissions;
CREATE TRIGGER on_submission_award_points
AFTER INSERT ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.award_submission_points();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_coins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
