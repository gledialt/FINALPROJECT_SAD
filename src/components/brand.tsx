import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export function Logo({ className, onDark }: { className?: string | undefined; onDark?: boolean | undefined }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
        onDark ? "bg-on-brand" : "bg-brand-pale",
        className,
      )}
    >
      <img src={logo} alt="Logo Smart Waste Management" width={28} height={28} className="size-7" />
    </span>
  );
}

export function Brand({ onDark, compact }: { onDark?: boolean | undefined; compact?: boolean | undefined }) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo onDark={onDark} />
      <span className="leading-tight">
        <span className={cn("block font-display text-base font-semibold", onDark ? "text-on-brand" : "text-foreground")}>
          Smart Waste
        </span>
        {!compact && (
          <span className={cn("block text-[11px] tracking-wide", onDark ? "text-on-brand-muted" : "text-muted-foreground")}>
            Management System
          </span>
        )}
      </span>
    </span>
  );
}
