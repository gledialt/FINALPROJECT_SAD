CREATE TABLE public.sorting_guides (
 key text PRIMARY KEY,
 name text NOT NULL,
 short text NOT NULL DEFAULT '',
 detail text NOT NULL DEFAULT '',
 position integer NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sorting_guides TO authenticated;
GRANT ALL ON public.sorting_guides TO service_role;
ALTER TABLE public.sorting_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read sorting guides" ON public.sorting_guides FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage sorting guides" ON public.sorting_guides FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active)) WITH CHECK (public.has_role(auth.uid(), 'admin') AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active));
ALTER TABLE public.schedules ADD COLUMN schedule_date date;
DROP POLICY IF EXISTS "staff manage processes" ON public.processes;