"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMarineStore } from "@/lib/store";

// Static coordinates for the Massive Route (Density)
const MASSIVE_ROUTE_POINTS: { name: string; lat: number; lon: number }[] = [
  { name: "Colombo", lat: 6.94, lon: 79.85 },
  { name: "Belawan", lat: 3.78, lon: 98.68 },
  { name: "PortKlang", lat: 3.0, lon: 101.4 },
  { name: "Singapore", lat: 1.3, lon: 103.8 },
  { name: "Jakarta", lat: -6.12, lon: 106.85 },
  { name: "Surabaya", lat: -7.2, lon: 112.73 },
  { name: "Makassar", lat: -5.13, lon: 119.41 },
  { name: "Bitung", lat: 1.45, lon: 125.18 },
];

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const mapType = useMarineStore((state) => state.mapType);
  const routePath = useMarineStore((state) => state.routePath);
  const routeCoordinates = useMarineStore((state) => state.routeCoordinates);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Fix default Leaflet icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    const map = L.map(mapContainerRef.current, {
      center: [1.29027, 103.851959], // center around Singapore by default
      zoom: 5,
    });

    // Standard OpenStreetMap tiles (bright, standard colors)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Invalidate size shortly after initialization to resolve container sizing bugs
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Paths based on mapType, routeCoordinates, routePath
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear previous markers & polylines
    markersGroup.clearLayers();
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    let coordsToRender: [number, number][] = [];
    let popupLabels: string[] = [];

    if (mapType === "route") {
      coordsToRender = routeCoordinates;
      popupLabels = routePath;
    } else {
      coordsToRender = MASSIVE_ROUTE_POINTS.map((p) => [p.lat, p.lon]);
      popupLabels = MASSIVE_ROUTE_POINTS.map((p) => p.name);
    }

    if (coordsToRender.length === 0) return;

    // Add Markers
    coordsToRender.forEach((coord, index) => {
      const label = popupLabels[index] || `Point ${index + 1}`;
      const marker = L.marker(coord).bindPopup(`<b>${label}</b>`);
      markersGroup.addLayer(marker);
    });

    // Add Polyline
    const polyline = L.polyline(coordsToRender, {
      color: "#2563eb", // blue-600
      weight: 4,
      opacity: 0.85,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    polylineRef.current = polyline;

    // Auto fit bounds to show the complete path
    try {
      const bounds = L.latLngBounds(coordsToRender);
      map.fitBounds(bounds, { padding: [55, 55] });
    } catch (e) {
      console.error("Failed to fit bounds", e);
    }

    // Delay size invalidation slightly so transition animations settle first
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [mapType, routeCoordinates, routePath]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-b-xl" />;
}
