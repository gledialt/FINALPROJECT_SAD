import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const guidesQuery = queryOptions({
  queryKey: ["sorting-guides"],
  queryFn: async () => {
    const { data, error } = await supabase.from("sorting_guides").select("*").order("position");
    if (error) throw error;
    return data ?? [];
  },
});