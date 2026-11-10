import { useEffect, useRef, useState } from "react";
import { CalendarDays, Crosshair, ExternalLink, Layers, Map, MapPin, Satellite } from "lucide-react";
import { Button } from "./ui/button";
import { StatusBadge } from "./common";
import type { Database } from "@/integrations/supabase/types";
import type { Map as LeafletMap, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";

export type LocationRow = Database["public"]["Tables"]["locations"]["Row"];
type Mode = "map" | "satellite" | "hybrid";

export function LocationMap({ locations, actions }: { locations: LocationRow[]; actions?: (location: LocationRow) => React.ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<TileLayer[]>([]);
  const [mode, setMode] = useState<Mode>("satellite");
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    import("leaflet").then((L) => {
      if (disposed || !container.current) return;
      const map = L.map(container.current, { scrollWheelZoom: false }).setView([1.4113469, 124.9645495], 13);
      mapRef.current = map;
      const points: [number, number][] = [];
      locations.forEach((location) => {
        if (location.latitude == null || location.longitude == null) return;
        const point: [number, number] = [location.latitude, location.longitude];
        points.push(point);
        L.marker(point, { icon: L.divIcon({ className: "location-pin", html: '<span class="map-marker"></span>', iconSize: [30, 38], iconAnchor: [15, 38] }) }).addTo(map).bindTooltip(location.name).on("click", () => setSelected(location.id));
      });
      if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 15 });
      map.invalidateSize();
    }).catch(() => setError(true));
    return () => { disposed = true; mapRef.current?.remove(); mapRef.current = null; layerRef.current = []; };
  }, [locations]);

  useEffect(() => {
    let disposed = false;
    import("leaflet").then((L) => {
      if (disposed || !mapRef.current) return;
      const map = mapRef.current;
      layerRef.current.forEach((layer) => layer.remove());
      const base = mode === "map"
        ? L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 })
        : L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Imagery © Esri", maxZoom: 19 });
      base.addTo(map);
      layerRef.current = [base];
      if (mode === "hybrid") {
        const labels = L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 });
        labels.addTo(map); layerRef.current.push(labels);
      }
    });
    return () => { disposed = true; };
  }, [mode, locations]);

  return <div className="grid items-start gap-5 xl:grid-cols-[1.4fr_1fr] xl:items-stretch">
    <div className="relative overflow-hidden rounded-lg border xl:h-full">
      <div ref={container} className="location-map h-[420px] w-full md:h-[560px] xl:h-full xl:min-h-[560px]" aria-label="Peta satelit lokasi pengelolaan" />
      <div className="absolute right-3 top-3 z-[500] flex rounded-lg border bg-card p-1 shadow-card">
        {([{ value: "map", label: "Peta", icon: Map }, { value: "satellite", label: "Satelit", icon: Satellite }, { value: "hybrid", label: "Hybrid", icon: Layers }] as const).map((item) => <Button key={item.value} size="sm" variant={mode === item.value ? "default" : "ghost"} aria-pressed={mode === item.value} onClick={() => setMode(item.value)} className="gap-1.5 px-2 text-xs"><item.icon className="size-3.5" />{item.label}</Button>)}
      </div>
      {error && <p className="absolute bottom-8 left-3 z-[500] rounded bg-card p-3 text-sm">Peta belum dapat dimuat. Gunakan tautan Google Maps.</p>}
    </div>
    <div className="space-y-3">{locations.map((location) => <article key={location.id} className={`rounded-lg border bg-card p-5 shadow-card ${selected === location.id ? "border-brand-mid" : ""}`}>
      <div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-pale text-brand-mid"><MapPin className="size-5" /></span><div className="min-w-0"><h2 className="font-semibold">{location.name}</h2><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{location.address}</p></div></div>
      {location.description && <p className="mt-3 text-sm text-muted-foreground">{location.description}</p>}
      {(location.schedule_date || location.schedule_time) && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-brand-pale p-3.5">
          <CalendarDays className="mt-0.5 size-5 shrink-0 text-brand-mid" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{location.schedule_title || "Jadwal Pengangkutan"}</p>
              {location.activity_status && <StatusBadge tone={activityTone(location.activity_status)}>{location.activity_status}</StatusBadge>}
            </div>
            {location.schedule_date && <p className="mt-1 text-sm text-muted-foreground">{location.schedule_date}</p>}
            {location.schedule_time && <p className="text-sm text-muted-foreground">{location.schedule_time}</p>}
          </div>
        </div>
      )}
      <div className="mt-3"><StatusBadge tone={location.is_verified ? "success" : "warning"}>{location.is_verified ? "Terverifikasi" : "Koordinat belum diverifikasi"}</StatusBadge></div>
      {location.latitude != null && location.longitude != null ? <><p className="mt-2 text-xs text-muted-foreground">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => { if (location.latitude == null || location.longitude == null) return; mapRef.current?.flyTo([location.latitude, location.longitude], 16); setSelected(location.id); }}><Crosshair className="size-4" />Lihat di peta</Button><Button asChild size="sm"><a href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Google Maps</a></Button></div></> : <p className="mt-3 text-xs text-muted-foreground">Koordinat belum ditambahkan.</p>}
      {actions && <div className="mt-4 flex justify-end gap-2 border-t pt-3">{actions(location)}</div>}
    </article>)}</div>
  </div>;
}

function activityTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("berlangsung")) return "success" as const;
  if (s.includes("selesai")) return "neutral" as const;
  if (s.includes("batal") || s.includes("tunda")) return "danger" as const;
  return "info" as const;
}
