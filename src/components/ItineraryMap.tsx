"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapboxMap } from "mapbox-gl";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import type { ItineraryItem } from "@/lib/types";

const SLOT_COLORS: Record<string, string> = {
  morning_destination: "#38bdf8",
  lunch: "#fbbf24",
  afternoon_destination: "#4ade80",
  dinner: "#f97316",
  evening_activity: "#fb7185",
  morning: "#38bdf8",
  afternoon: "#4ade80",
  evening: "#fb7185",
};

type Props = {
  items: ItineraryItem[];
  /** Item selected via card or pin — map flies here at zoom 15. */
  focusedId?: string | null;
  onSelectPin?: (id: string | null) => void;
};

const FLY_ZOOM = 15;
const FLY_DURATION_MS = 1500;

function flyMapToItem(map: MapboxMap, lng: number, lat: number): void {
  map.flyTo({
    center: [lng, lat],
    zoom: FLY_ZOOM,
    duration: FLY_DURATION_MS,
    essential: true,
  });
}

function initialView(items: ItineraryItem[]) {
  const valid = items.filter((i) => Number.isFinite(i.lat) && Number.isFinite(i.lng) && i.lat !== 0);
  if (!valid.length) {
    return { longitude: 0, latitude: 20, zoom: 2 };
  }
  let minLat = valid[0].lat;
  let maxLat = valid[0].lat;
  let minLng = valid[0].lng;
  let maxLng = valid[0].lng;
  for (const p of valid) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  const lat = (minLat + maxLat) / 2;
  const lng = (minLng + maxLng) / 2;
  const latPad = Math.max((maxLat - minLat) * 0.2, 0.02);
  const lngPad = Math.max((maxLng - minLng) * 0.2, 0.02);
  const zoomLat = Math.log2(360 / (maxLat - minLat + latPad * 2));
  const zoomLng = Math.log2(360 / (maxLng - minLng + lngPad * 2));
  const zoom = Math.min(14, Math.max(3, Math.min(zoomLat, zoomLng)));
  return { longitude: lng, latitude: lat, zoom };
}

export function ItineraryMap({ items, focusedId, onSelectPin }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const view = useMemo(() => initialView(items), [items]);
  const mapRef = useRef<MapRef | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const flySignature = useMemo(() => {
    if (!focusedId) return "";
    const it = items.find((i) => i.id === focusedId);
    if (!it) return "";
    if (!Number.isFinite(it.lat) || !Number.isFinite(it.lng) || (it.lat === 0 && it.lng === 0)) {
      return "";
    }
    return `${focusedId}:${it.lng.toFixed(6)},${it.lat.toFixed(6)}`;
  }, [focusedId, items]);

  useEffect(() => {
    if (!mapReady || !flySignature || !focusedId) return;
    const item = items.find((i) => i.id === focusedId);
    if (!item) return;

    const run = (map: MapboxMap) => {
      flyMapToItem(map, item.lng, item.lat);
    };

    const map = mapRef.current?.getMap();
    if (!map) return;

    const exec = () => run(map);
    if (map.isStyleLoaded()) {
      exec();
    } else {
      map.once("load", exec);
    }
  }, [mapReady, flySignature, focusedId, items]);

  if (!token) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-surface-muted bg-surface p-6 text-center">
        <p className="font-display text-base font-semibold text-ink">Map disabled</p>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          Add <code className="rounded bg-surface-muted px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> to{" "}
          <code className="rounded bg-surface-muted px-1">.env.local</code> to show pins. Get a free
          token at{" "}
          <a
            href="https://mapbox.com/"
            className="text-accent underline"
            target="_blank"
            rel="noreferrer"
          >
            mapbox.com
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-2xl border border-surface-muted">
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={{
          ...view,
          bearing: 0,
          pitch: 0,
        }}
        onLoad={() => setMapReady(true)}
        style={{ width: "100%", height: "100%", minHeight: 320 }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        reuseMaps
      >
        <NavigationControl position="top-right" />
        {items.map((it) => {
          if (!Number.isFinite(it.lat) || !Number.isFinite(it.lng) || (it.lat === 0 && it.lng === 0)) {
            return null;
          }
          const color = SLOT_COLORS[it.timeSlot] ?? "#94a3b8";
          const active = focusedId === it.id;
          return (
            <Marker key={it.id} longitude={it.lng} latitude={it.lat} anchor="bottom">
              <button
                type="button"
                title={it.name}
                className="h-4 w-4 -translate-y-0.5 rounded-full border-2 border-white shadow-md"
                style={{
                  backgroundColor: color,
                  boxShadow: active ? `0 0 0 3px rgba(56,189,248,0.6)` : undefined,
                  transform: active ? "scale(1.15)" : undefined,
                }}
                aria-label={it.name}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPin?.(it.id);
                }}
              />
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
