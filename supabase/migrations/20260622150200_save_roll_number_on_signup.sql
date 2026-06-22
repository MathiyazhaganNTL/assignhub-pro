-- =========================================================
-- Fix: Save roll_number from signup metadata into profiles
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;

  IF user_count = 0 THEN
    INSERT INTO public.profiles (id, email, full_name, roll_number, status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'roll_number', '')), ''),
      'approved'
    );
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.profiles (id, email, full_name, roll_number, status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'roll_number', '')), ''),
      'pending'
    );
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  END IF;

  RETURN NEW;
END; $$;
