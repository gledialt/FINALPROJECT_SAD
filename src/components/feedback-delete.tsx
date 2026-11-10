import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function DeleteFeedbackButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const run = async () => {
    setPending(true);
    const { error, count } = await supabase.from("feedback").delete({ count: "exact" }).eq("id", id);
    setPending(false);
    if (error || !count) { toast.error("Feedback gagal dihapus."); return; }
    toast.success("Feedback dihapus.");
    setOpen(false);
    onDeleted();
    qc.invalidateQueries({ queryKey: ["feedback"] });
  };
  return (
    <>
      <Button variant="outline" className="text-danger" onClick={() => setOpen(true)}><Trash2 className="size-4" /> Hapus Feedback</Button>
      <AlertDialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus feedback ini?</AlertDialogTitle>
            <AlertDialogDescription>Feedback beserta tanggapannya akan dihapus permanen dan tidak bisa dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <Button variant="destructive" disabled={pending} onClick={run}>Hapus</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
