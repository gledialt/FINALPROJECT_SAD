CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, whatsapp, address, rt_rw, kelurahan)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), new.email, new.raw_user_meta_data->>'whatsapp', new.raw_user_meta_data->>'address', new.raw_user_meta_data->>'rt_rw', new.raw_user_meta_data->>'kelurahan');
  INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'masyarakat');
  RETURN new;
END;
$$;
CREATE OR REPLACE FUNCTION public.assign_created_account_role(target_user_id uuid, assigned_role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN RAISE EXCEPTION 'Pengguna tidak ditemukan'; END IF;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  INSERT INTO public.user_roles(user_id, role) VALUES (target_user_id, assigned_role);
  IF assigned_role <> 'masyarakat' THEN UPDATE public.profiles SET address = NULL, rt_rw = NULL, kelurahan = NULL WHERE id = target_user_id; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_created_account_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_created_account_role(uuid, public.app_role) TO service_role;
CREATE OR REPLACE FUNCTION public.clear_deleted_account_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.account_invitations WHERE lower(email) = lower(old.email);
  DELETE FROM public.activation_codes WHERE user_id = old.id OR lower(email) = lower(old.email);
  DELETE FROM public.user_roles WHERE user_id = old.id;
  RETURN old;
END;
$$;
CREATE TRIGGER clear_deleted_account_history BEFORE DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.clear_deleted_account_history();
COMMENT ON TABLE public.account_invitations IS 'DEPRECATED: admin-created accounts receive roles via service-role-only assign_created_account_role; ordinary signup always masyarakat';
COMMENT ON TABLE public.activation_codes IS 'DEPRECATED: account passwords are admin-set and recovery uses Cloud Auth OTP';