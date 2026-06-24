-- ============================================================
-- COMBINED MIGRATION: Submission Workflow + Resubmission Count
-- Run this ONCE in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Create submission status enum type if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE public.submission_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'resubmitted');
  END IF;
END
$$;

-- 2. Add all workflow columns to submissions table
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS status public.submission_status NOT NULL DEFAULT 'submitted';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS review_comments TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS approval_points INTEGER;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS approval_coins INTEGER;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS resubmission_count INTEGER NOT NULL DEFAULT 0;

-- 3. RLS policy for students to update their rejected submissions
DROP POLICY IF EXISTS "Students can update own submissions" ON public.submissions;
CREATE POLICY "Students can update own submissions" ON public.submissions
  FOR UPDATE TO authenticated
  USING (auth.uid() = student_id AND public.has_role(auth.uid(), 'student') AND status = 'rejected')
  WITH CHECK (auth.uid() = student_id AND public.has_role(auth.uid(), 'student') AND status = 'resubmitted');

-- 4. Remove old gamification trigger if it exists
DROP TRIGGER IF EXISTS on_submission_award_points ON public.submissions;
DROP FUNCTION IF EXISTS public.award_submission_points();

-- 5. Create the submission status change trigger function
CREATE OR REPLACE FUNCTION public.handle_submission_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_assignment_title TEXT;
  v_student_name TEXT;
  v_admin_record RECORD;
BEGIN
  -- Get assignment title
  SELECT title INTO v_assignment_title FROM public.assignments WHERE id = NEW.assignment_id;
  
  -- Get student name
  SELECT COALESCE(full_name, 'Student') INTO v_student_name FROM public.profiles WHERE id = NEW.student_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (user_id, action, reference_type, reference_id)
    VALUES (NEW.student_id, 'Assignment "' || v_assignment_title || '" submitted', 'submission', NEW.id);
  
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    IF NEW.status = 'under_review' THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (NEW.student_id, 'Assignment Under Review', 'Your submission for "' || v_assignment_title || '" is currently being reviewed.');
      
      INSERT INTO public.activity_logs (user_id, action, reference_type, reference_id)
      VALUES (NEW.student_id, 'Assignment "' || v_assignment_title || '" under review', 'submission', NEW.id);
      
    ELSIF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (
        NEW.student_id, 
        'Assignment Approved', 
        'Your submission for "' || v_assignment_title || '" has been approved.' || CHR(10) || CHR(10) || 
        '+' || COALESCE(NEW.approval_points, 0) || ' Points' || CHR(10) || 
        '+' || COALESCE(NEW.approval_coins, 0) || ' Coins'
      );
      
      INSERT INTO public.activity_logs (user_id, action, reference_type, reference_id)
      VALUES (NEW.student_id, 'Assignment "' || v_assignment_title || '" approved — earned ' || COALESCE(NEW.approval_coins, 0) || ' coins, ' || COALESCE(NEW.approval_points, 0) || ' points', 'submission', NEW.id);
      
      INSERT INTO public.user_points (user_id, total_points, current_level)
      VALUES (NEW.student_id, COALESCE(NEW.approval_points, 0), GREATEST(1, COALESCE(NEW.approval_points, 0) / 150 + 1))
      ON CONFLICT (user_id) DO UPDATE SET
        total_points = user_points.total_points + COALESCE(NEW.approval_points, 0),
        current_level = GREATEST(1, (user_points.total_points + COALESCE(NEW.approval_points, 0)) / 150 + 1),
        updated_at = now();

      INSERT INTO public.user_coins (user_id, total_coins, coin_level)
      VALUES (NEW.student_id, COALESCE(NEW.approval_coins, 0), COALESCE(NEW.approval_coins, 0) / 50)
      ON CONFLICT (user_id) DO UPDATE SET
        total_coins = user_coins.total_coins + COALESCE(NEW.approval_coins, 0),
        coin_level = (user_coins.total_coins + COALESCE(NEW.approval_coins, 0)) / 50,
        updated_at = now();
        
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (
        NEW.student_id, 
        'Assignment Requires Revision', 
        'Your submission for "' || v_assignment_title || '" has been reviewed.' || CHR(10) || CHR(10) ||
        'Comments: ' || COALESCE(NEW.review_comments, 'Please improve the answer and resubmit.')
      );
      
      INSERT INTO public.activity_logs (user_id, action, reference_type, reference_id)
      VALUES (NEW.student_id, 'Assignment "' || v_assignment_title || '" rejected — revision required', 'submission', NEW.id);

      IF NEW.resubmission_count >= 2 THEN
        INSERT INTO public.notifications (user_id, title, message)
        VALUES (
          NEW.student_id,
          'Resubmission Limit Reached',
          'You have reached the maximum resubmission limit for "' || v_assignment_title || '". Further submissions require administrator approval.'
        );
      END IF;
      
    ELSIF NEW.status = 'resubmitted' THEN
      IF OLD.resubmission_count >= 2 THEN
        RAISE EXCEPTION 'Maximum resubmission limit (2) reached for this assignment.';
      END IF;

      NEW.resubmission_count := OLD.resubmission_count + 1;

      FOR v_admin_record IN (SELECT user_id FROM public.user_roles WHERE role = 'admin') LOOP
        INSERT INTO public.notifications (user_id, title, message)
        VALUES (v_admin_record.user_id, 'Assignment Resubmitted', 'Student ' || v_student_name || ' has resubmitted "' || v_assignment_title || '" (attempt ' || NEW.resubmission_count || ' of 2).');
      END LOOP;
      
      INSERT INTO public.activity_logs (user_id, action, reference_type, reference_id)
      VALUES (NEW.student_id, 'Assignment "' || v_assignment_title || '" resubmitted (attempt ' || NEW.resubmission_count || ')', 'submission', NEW.id);
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Attach trigger
DROP TRIGGER IF EXISTS on_submission_status_changed ON public.submissions;
CREATE TRIGGER on_submission_status_changed
BEFORE INSERT OR UPDATE OF status ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.handle_submission_status_change();

-- 7. Enable realtime for submissions (if not already)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
  END IF;
END
$$;
