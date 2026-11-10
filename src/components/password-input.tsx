import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className={cn("pr-11", className)} />
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Sembunyikan password" : "Lihat password"}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 h-full w-11 text-muted-foreground hover:text-foreground"
      >
        {show ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </Button>
    </div>
  );
}
