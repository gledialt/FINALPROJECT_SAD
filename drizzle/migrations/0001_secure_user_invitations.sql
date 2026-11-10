CREATE TABLE public.account_invitations (
  email text PRIMARY KEY,
  role public.app_role NOT NULL,
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.account_invitations TO service_role;
ALTER TABLE public.account_invitations ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE assigned_role public.app_role := 'masyarakat';
BEGIN
  IF new.invited_at IS NOT NULL THEN
    SELECT role INTO assigned_role FROM public.account_invitations WHERE email = lower(new.email);
    assigned_role := coalesce(assigned_role, 'masyarakat');
  END IF;
  INSERT INTO public.profiles (id, full_name, email, whatsapp, address, rt_rw, kelurahan)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), new.email, new.raw_user_meta_data->>'whatsapp',
    CASE WHEN assigned_role = 'masyarakat' THEN new.raw_user_meta_data->>'address' END,
    CASE WHEN assigned_role = 'masyarakat' THEN new.raw_user_meta_data->>'rt_rw' END,
    CASE WHEN assigned_role = 'masyarakat' THEN new.raw_user_meta_data->>'kelurahan' END);
  INSERT INTO public.user_roles (user_id, role) VALUES (new.id, assigned_role);
  RETURN new;
END;
$$;