-- Create tables
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL, -- 'pdf', 'link', 'rich-text'
  content TEXT NOT NULL, -- file url, link, or rich text
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  format TEXT NOT NULL, -- 'file', 'text'
  content TEXT NOT NULL, -- file url or text response
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for assignments
CREATE POLICY "Anyone authenticated can view assignments" ON public.assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert assignments" ON public.assignments
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update assignments" ON public.assignments
  FOR UPDATE TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete assignments" ON public.assignments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Policies for submissions
CREATE POLICY "Students can view own submissions" ON public.submissions
  FOR SELECT TO authenticated USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can insert own submissions" ON public.submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Admins can delete/update submissions" ON public.submissions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Triggers for automatic notifications
CREATE OR REPLACE FUNCTION public.handle_new_assignment_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message)
  SELECT p.id, 'New Assignment Uploaded', 'A new assignment "' || NEW.title || '" has been uploaded. Deadline: ' || to_char(NEW.deadline AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC'
  FROM public.profiles p
  JOIN public.user_roles r ON p.id = r.user_id
  WHERE p.status = 'approved' AND r.role = 'student';
  RETURN NEW;
END; $$;

CREATE TRIGGER on_assignment_created
AFTER INSERT ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.handle_new_assignment_notification();

CREATE OR REPLACE FUNCTION public.handle_student_approval_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (NEW.id, 'Account Approved', 'Your student access request has been approved! You can now access your assignments.');
  ELSIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (NEW.id, 'Account Rejected', 'Your student access request was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided.'));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_student_profile_updated
AFTER UPDATE OF status ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_student_approval_notification();

-- Enable realtime
alter publication supabase_realtime add table public.assignments;
alter publication supabase_realtime add table public.submissions;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.profiles;

-- Create Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', true) ON CONFLICT DO NOTHING;

-- RLS storage policies
CREATE POLICY "Public Access to Assignments Storage" ON storage.objects FOR SELECT TO public USING (bucket_id = 'assignments');
CREATE POLICY "Admins can upload assignments storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'assignments' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update assignments storage" ON storage.objects FOR UPDATE TO authenticated WITH CHECK (bucket_id = 'assignments' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete assignments storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'assignments' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and students can view submissions storage" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'submissions');
CREATE POLICY "Students can upload submissions storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'submissions' AND public.has_role(auth.uid(), 'student'));
