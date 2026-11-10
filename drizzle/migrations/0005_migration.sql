ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS schedule_title text, ADD COLUMN IF NOT EXISTS schedule_date text, ADD COLUMN IF NOT EXISTS schedule_time text, ADD COLUMN IF NOT EXISTS activity_status text;

CREATE TABLE public.activation_codes (
  email text PRIMARY KEY,
  user_id uuid NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.activation_codes TO service_role;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.app_info (
  key text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_info TO authenticated;
GRANT ALL ON public.app_info TO service_role;
ALTER TABLE public.app_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read app info" ON public.app_info FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff manage app info" ON public.app_info FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'petugas')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'petugas'));

DROP POLICY IF EXISTS "read published" ON public.announcements;
CREATE POLICY "read published" ON public.announcements FOR SELECT TO authenticated USING (is_published OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'petugas'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE assigned_role public.app_role;
BEGIN
  SELECT role INTO assigned_role FROM public.account_invitations WHERE email = lower(new.email);
  assigned_role := coalesce(assigned_role, 'masyarakat');
  INSERT INTO public.profiles (id, full_name, email, whatsapp, address, rt_rw, kelurahan)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), new.email, new.raw_user_meta_data->>'whatsapp',
    CASE WHEN assigned_role = 'masyarakat' THEN new.raw_user_meta_data->>'address' END,
    CASE WHEN assigned_role = 'masyarakat' THEN new.raw_user_meta_data->>'rt_rw' END,
    CASE WHEN assigned_role = 'masyarakat' THEN new.raw_user_meta_data->>'kelurahan' END);
  INSERT INTO public.user_roles (user_id, role) VALUES (new.id, assigned_role);
  RETURN new;
END;
$$;

UPDATE public.locations SET name = 'TPA Sawangan', address = 'Sawangan, Airmadidi, Minahasa Utara, Sulawesi Utara' WHERE name = 'TPA Airmadidi';
UPDATE public.locations SET address = E'Kel. Airmadidi Atas, Kec. Airmadidi\nKab. Minahasa Utara, Sulawesi Utara', description = 'Lokasi Pengangkutan',
  schedule_title = 'Jadwal Pengangkutan', schedule_date = 'Senin, 28 April 2025', schedule_time = '08.00 – 10.00 WITA', activity_status = 'Berlangsung'
 WHERE name = 'RW 10 Airmadidi Atas';

INSERT INTO public.sorting_guides (key, name, short, detail, position) VALUES
 ('organik','Organik','Sisa makanan, daun, sayur','Sampah yang mudah terurai: sisa makanan, kulit buah, sayuran, daun, dan ranting. Dapat dijadikan kompos.',1),
 ('anorganik','Anorganik','Plastik, kaleng, kertas','Sampah yang sulit terurai namun dapat didaur ulang: botol plastik, kaleng, kertas, kardus, dan kaca. Bersihkan dan keringkan sebelum dibuang.',2),
 ('residu','Residu','Popok, puntung, styrofoam','Sampah yang tidak dapat didaur ulang maupun dikomposkan: popok sekali pakai, pembalut, puntung rokok, styrofoam kotor.',3),
 ('b3','B3','Baterai, lampu, obat','Bahan Berbahaya dan Beracun: baterai, lampu neon, obat kedaluwarsa, kemasan pestisida, dan cairan kimia. Pisahkan dan jangan dicampur.',4),
 ('tips','Tips Pemilahan','',E'Sediakan wadah terpisah untuk setiap kategori.\nBilas kemasan sebelum dibuang.\nKeluarkan sampah sesuai jadwal pengangkutan.\nJangan mencampur sampah B3 dengan sampah lain.',5)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_info (key, title, content) VALUES
 ('lokasi_info','Informasi','Peta ini menunjukkan lokasi wilayah pengangkutan (RW 10 Airmadidi Atas) dan lokasi TPA Sawangan yang menjadi tujuan akhir pengelolaan sampah.');