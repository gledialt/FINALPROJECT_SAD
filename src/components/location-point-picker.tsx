import { useEffect, useRef, useState } from "react";
import type { Map, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

export function LocationPointPicker({ latitude, longitude, onChange }: { latitude: string; longitude: string; onChange: (lat: string, lng: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  const [error, setError] = useState(false);
  useEffect(() => {
    let disposed = false;
    import("leaflet").then((L) => {
      if (disposed || !container.current) return;
      const lat = Number(latitude), lng = Number(longitude);
      const valid = latitude !== "" && longitude !== "" && Number.isFinite(lat) && Number.isFinite(lng);
      const point: [number, number] = valid ? [lat, lng] : [1.4113469, 124.9645495];
      const map = L.map(container.current, { scrollWheelZoom: false }).setView(point, 16);
      mapRef.current = map;
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Imagery © Esri", maxZoom: 19 }).addTo(map);
      const marker = L.marker(point, { draggable: true, icon: L.divIcon({ className: "location-pin", html: '<span class="map-marker"></span>', iconSize: [30, 38], iconAnchor: [15, 38] }) }).addTo(map);
      markerRef.current = marker;
      const update = (lat: number, lng: number) => callback.current(lat.toFixed(7), lng.toFixed(7));
      map.on("click", (event) => { marker.setLatLng(event.latlng); update(event.latlng.lat, event.latlng.lng); });
      marker.on("dragend", () => { const point = marker.getLatLng(); update(point.lat, point.lng); });
      map.invalidateSize();
    }).catch(() => setError(true));
    return () => { disposed = true; mapRef.current?.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);
  useEffect(() => {
    const lat = Number(latitude), lng = Number(longitude);
    if (latitude && longitude && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) markerRef.current?.setLatLng([lat, lng]);
  }, [latitude, longitude]);
  return <div className="sm:col-span-2"><div ref={container} role="application" aria-label="Atur titik lokasi pada peta" className="location-map h-80 w-full rounded-lg border" />{error && <p className="mt-2 text-sm text-danger">Peta belum dapat dimuat. Masukkan koordinat secara manual.</p>}</div>;
}