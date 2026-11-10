CREATE TABLE public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('feedback_baru','feedback_dibalas','status_berubah')),
  feedback_id uuid REFERENCES public.feedback(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  recipient_role text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','terkirim','gagal')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_notifications TO authenticated;
GRANT ALL ON public.email_notifications TO service_role;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read email notifications" ON public.email_notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX email_notifications_status_idx ON public.email_notifications(status, created_at);

CREATE OR REPLACE FUNCTION public.queue_feedback_new() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.email_notifications (event_type, feedback_id, recipient_email, recipient_role, subject, body)
  SELECT 'feedback_baru', NEW.id, p.email, r.role::text,
    'Feedback baru: ' || NEW.judul,
    'Ada ' || NEW.jenis_feedback || ' baru dari warga (kategori ' || NEW.kategori || '): ' || left(NEW.isi_pesan, 500)
  FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
  WHERE r.role::text IN ('admin','petugas') AND p.is_active = true AND coalesce(p.email,'') <> '';
  RETURN NEW;
END $$;
CREATE TRIGGER feedback_queue_new AFTER INSERT ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.queue_feedback_new();

CREATE OR REPLACE FUNCTION public.queue_feedback_reply() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.email_notifications (event_type, feedback_id, recipient_email, recipient_role, subject, body)
  SELECT 'feedback_dibalas', f.id, p.email, 'masyarakat',
    'Feedback Anda dibalas: ' || f.judul, 'Tanggapan: ' || left(NEW.isi_tanggapan, 1000)
  FROM public.feedback f JOIN public.profiles p ON p.id = f.user_id
  WHERE f.id = NEW.feedback_id AND coalesce(p.email,'') <> '';
  RETURN NEW;
END $$;
CREATE TRIGGER feedback_queue_reply AFTER INSERT ON public.feedback_replies FOR EACH ROW EXECUTE FUNCTION public.queue_feedback_reply();

CREATE OR REPLACE FUNCTION public.queue_feedback_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.email_notifications (event_type, feedback_id, recipient_email, recipient_role, subject, body)
    SELECT 'status_berubah', NEW.id, p.email, 'masyarakat',
      'Status feedback diperbarui: ' || NEW.judul, 'Status feedback Anda sekarang: ' || NEW.status
    FROM public.profiles p WHERE p.id = NEW.user_id AND coalesce(p.email,'') <> '';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER feedback_queue_status AFTER UPDATE OF status ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.queue_feedback_status();

REVOKE EXECUTE ON FUNCTION public.queue_feedback_new(), public.queue_feedback_reply(), public.queue_feedback_status() FROM PUBLIC, anon, authenticated;