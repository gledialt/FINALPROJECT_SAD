import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBox({ value, onChange, placeholder = "Cari…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative mb-5">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 rounded-full bg-card pl-10 pr-10 shadow-card"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Hapus pencarian" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/** Case-insensitive match of a query against any of the given fields. */
export function matchesQuery(query: string, ...fields: (string | null | undefined)[]) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => (f ?? "").toLowerCase().includes(q));
}
