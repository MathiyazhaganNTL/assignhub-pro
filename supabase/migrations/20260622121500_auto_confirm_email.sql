-- Auto-confirm email for new users via database trigger
-- Since AssignHub already has an admin approval workflow,
-- email confirmation is redundant and blocks student login.

CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Automatically confirm the user's email on signup
  UPDATE auth.users
  SET email_confirmed_at = now(),
      raw_user_meta_data = raw_user_meta_data || '{"email_verified": true}'::jsonb
  WHERE id = NEW.id
    AND email_confirmed_at IS NULL;
  RETURN NEW;
END;
$$;

-- Run AFTER the existing on_auth_user_created trigger
DROP TRIGGER IF EXISTS on_auth_user_email_confirm ON auth.users;
CREATE TRIGGER on_auth_user_email_confirm
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user_email();

-- Revoke public access
REVOKE EXECUTE ON FUNCTION public.auto_confirm_user_email() FROM PUBLIC, anon, authenticated;
