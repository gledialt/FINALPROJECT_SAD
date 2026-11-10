CREATE OR REPLACE FUNCTION public.promote_bootstrap_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(new.email) = 'adminsmartwaste@gmail.com' THEN
    DELETE FROM public.user_roles WHERE user_id = new.id;
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'admin');
    UPDATE public.profiles SET full_name = CASE WHEN full_name = '' THEN 'Admin Smart Waste' ELSE full_name END WHERE id = new.id;
  END IF;
  RETURN new;
END;
$$;
CREATE TRIGGER on_auth_user_created_zz_admin AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.promote_bootstrap_admin();