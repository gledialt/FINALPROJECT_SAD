CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  jenis_feedback text NOT NULL CHECK (jenis_feedback IN ('keluhan','saran','apresiasi')),
  kategori text NOT NULL CHECK (kategori IN ('pengangkutan','jadwal','pelayanan','kebersihan','lainnya')),
  judul text NOT NULL CHECK (char_length(judul) BETWEEN 1 AND 150),
  isi_pesan text NOT NULL CHECK (char_length(isi_pesan) BETWEEN 1 AND 3000),
  foto_url text,
  status text NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','diproses','dibalas','selesai')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own feedback read" ON public.feedback FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'petugas'));
CREATE POLICY "resident create feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(),'masyarakat') AND status = 'baru' AND is_read = false);
CREATE POLICY "admin update feedback" ON public.feedback FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete feedback" ON public.feedback FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX feedback_user_idx ON public.feedback(user_id, created_at DESC);

CREATE TABLE public.feedback_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  isi_tanggapan text NOT NULL CHECK (char_length(isi_tanggapan) BETWEEN 1 AND 3000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.feedback_replies TO authenticated;
GRANT ALL ON public.feedback_replies TO service_role;
ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read replies" ON public.feedback_replies FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'petugas') OR EXISTS (SELECT 1 FROM public.feedback f WHERE f.id = feedback_id AND f.user_id = auth.uid()));
CREATE POLICY "admin reply" ON public.feedback_replies FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND admin_id = auth.uid());

CREATE TABLE public.feedback_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  note text NOT NULL CHECK (char_length(note) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.feedback_internal_notes TO authenticated;
GRANT ALL ON public.feedback_internal_notes TO service_role;
ALTER TABLE public.feedback_internal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read notes" ON public.feedback_internal_notes FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'petugas'));
CREATE POLICY "staff add notes" ON public.feedback_internal_notes FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'petugas')) AND author_id = auth.uid());

CREATE OR REPLACE FUNCTION public.feedback_touch() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER feedback_touch BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.feedback_touch();

-- staff need sender names
CREATE POLICY "staff read feedback senders" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'petugas') AND EXISTS (SELECT 1 FROM public.feedback f WHERE f.user_id = profiles.id));