-- 1. Create submission status enum type if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE public.submission_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'resubmitted');
  END IF;
END
$$;

-- 2. Alter public.submissions table to add the new review columns
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS status public.submission_status NOT NULL DEFAULT 'submitted';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS review_comments TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS approval_points INTEGER;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS approval_coins INTEGER;

-- 3. Update RLS policies for public.submissions to allow students to update their submissions when rejected
DROP POLICY IF EXISTS "Students can update own submissions" ON public.submissions;
CREATE POLICY "Students can update own submissions" ON public.submissions
  FOR UPDATE TO authenticated
  USING (auth.uid() = student_id AND public.has_role(auth.uid(), 'student') AND status = 'rejected')
  WITH CHECK (auth.uid() = student_id AND public.has_role(auth.uid(), 'student') AND status = 'resubmitted');

-- 4. De-couple gamification points awarding on initial submission
DROP TRIGGER IF EXISTS on_submission_award_points ON public.submissions;
DROP FUNCTION IF EXISTS public.award_submission_points();

-- 5. Create new trigger function to handle submission status changes
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

  -- Trigger logs and notifications depending on TG_OP and status changes
  IF TG_OP = 'INSERT' THEN
    -- Student submitted assignment
    INSERT INTO public.activity_logs (user_id, action, reference_type, reference_id)
    VALUES (NEW.student_id, 'Assignment "' || v_assignment_title || '" submitted', 'submission', NEW.id);
  
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    
    -- Status transitioned to under_review
    IF NEW.status = 'under_review' THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (NEW.student_id, 'Assignment Under Review', 'Your submission for "' || v_assignment_title || '" is currently being reviewed.');
      
      INSERT INTO public.activity_logs (user_id, action, reference_type, reference_id)
      VALUES (NEW.student_id, 'Assignment "' || v_assignment_title || '" under review', 'submission', NEW.id);
      
    -- Status transitioned to approved
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
      
      -- Upsert user_points
      INSERT INTO public.user_points (user_id, total_points, current_level)
      VALUES (NEW.student_id, COALESCE(NEW.approval_points, 0), GREATEST(1, COALESCE(NEW.approval_points, 0) / 150 + 1))
      ON CONFLICT (user_id) DO UPDATE SET
        total_points = user_points.total_points + COALESCE(NEW.approval_points, 0),
        current_level = GREATEST(1, (user_points.total_points + COALESCE(NEW.approval_points, 0)) / 150 + 1),
        updated_at = now();

      -- Upsert user_coins
      INSERT INTO public.user_coins (user_id, total_coins, coin_level)
      VALUES (NEW.student_id, COALESCE(NEW.approval_coins, 0), COALESCE(NEW.approval_coins, 0) / 50)
      ON CONFLICT (user_id) DO UPDATE SET
        total_coins = user_coins.total_coins + COALESCE(NEW.approval_coins, 0),
        coin_level = (user_coins.total_coins + COALESCE(NEW.approval_coins, 0)) / 50,
        updated_at = now();
        
    -- Status transitioned to rejected
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
      
    -- Status transitioned to resubmitted
    ELSIF NEW.status = 'resubmitted' THEN
      -- Notify admins
      FOR v_admin_record IN (SELECT user_id FROM public.user_roles WHERE role = 'admin') LOOP
        INSERT INTO public.notifications (user_id, title, message)
        VALUES (v_admin_record.user_id, 'Assignment Resubmitted', 'Student ' || v_student_name || ' has resubmitted "' || v_assignment_title || '".');
      END LOOP;
      
      INSERT INTO public.activity_logs (user_id, action, reference_type, reference_id)
      VALUES (NEW.student_id, 'Assignment "' || v_assignment_title || '" resubmitted', 'submission', NEW.id);
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Attach trigger to submissions table
DROP TRIGGER IF EXISTS on_submission_status_changed ON public.submissions;
CREATE TRIGGER on_submission_status_changed
AFTER INSERT OR UPDATE OF status ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.handle_submission_status_change();
