"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMarineStore } from "@/lib/store";

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const altPolylinesRef = useRef<L.Polyline[]>([]);

  // Real-time AIS map layers
  const aisGroupRef = useRef<L.LayerGroup | null>(null);
  const trailPolylineRef = useRef<L.Polyline | null>(null);

  const mapType = useMarineStore((state) => state.mapType);
  const routePath = useMarineStore((state) => state.routePath);
  const routeCoordinates = useMarineStore((state) => state.routeCoordinates);
  const alternativeRoutes = useMarineStore((state) => state.alternativeRoutes);

  // AIS Stream States
  const aisVessels = useMarineStore((state) => state.aisVessels);
  const aisSelectedMmsi = useMarineStore((state) => state.aisSelectedMmsi);
  const aisTrackTrails = useMarineStore((state) => state.aisTrackTrails);
  const aisTrackingZone = useMarineStore((state) => state.aisTrackingZone);
  const selectAisVessel = useMarineStore((state) => state.selectAisVessel);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Fix default Leaflet icon assets
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    const map = L.map(mapContainerRef.current, {
      center: [1.29027, 103.851959], // Default centered around Singapore
      zoom: 5,
    });

    // Dark-themed tiles to provide a premium marine aesthetic (CartoDB Dark Matter)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    aisGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

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

  // Standard Static Route Rendering
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup || mapType !== "route") {
      if (markersGroup) markersGroup.clearLayers();
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      altPolylinesRef.current.forEach((line) => line.remove());
      altPolylinesRef.current = [];
      return;
    }

    markersGroup.clearLayers();
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    altPolylinesRef.current.forEach((line) => line.remove());
    altPolylinesRef.current = [];

    if (routeCoordinates.length === 0) return;

    // Add Port Markers
    routeCoordinates.forEach((coord, index) => {
      const label = routePath[index] || `Point ${index + 1}`;
      const marker = L.marker(coord).bindPopup(`<b>${label}</b>`);
      markersGroup.addLayer(marker);
    });

    // Draw route path line
    const polyline = L.polyline(routeCoordinates, {
      color: "#3b82f6", // Blue
      weight: 4,
      opacity: 0.85,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    polylineRef.current = polyline;

    // Draw alternative routes
    if (alternativeRoutes && alternativeRoutes.length > 0) {
      alternativeRoutes.forEach((alt, idx) => {
        const altPolyline = L.polyline(alt.coordinates, {
          color: "#94a3b8", // Slate / Gray
          weight: 3,
          opacity: 0.6,
          dashArray: "6, 12",
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map)
          .bindPopup(`<b>Alternative Route ${idx + 1}</b><br/>Distance: ${alt.distance_nm.toFixed(1)} NM<br/>ETA: ${alt.eta_hours.toFixed(1)} Hours`);
        altPolylinesRef.current.push(altPolyline);
      });
    }

    try {
      const allCoords = [...routeCoordinates];
      alternativeRoutes.forEach((alt) => {
        allCoords.push(...alt.coordinates);
      });
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [55, 55] });
    } catch (e) {
      console.error("Failed to fit bounds", e);
    }
  }, [mapType, routeCoordinates, routePath, alternativeRoutes]);

  // Real-time AIS Vessels Rendering
  useEffect(() => {
    const map = mapInstanceRef.current;
    const aisGroup = aisGroupRef.current;
    if (!map || !aisGroup || mapType !== "massive_route") {
      if (aisGroup) aisGroup.clearLayers();
      return;
    }

    const currentMmsis = Object.keys(aisVessels);

    // Remove old vessel markers that have stopped transmitting or departed the scope
    aisGroup.eachLayer((layer) => {
      const markerMmsi = (layer as any).mmsi;
      if (!currentMmsis.includes(markerMmsi)) {
        aisGroup.removeLayer(layer);
      }
    });

    // Add or update active vessel markers
    currentMmsis.forEach((mmsi) => {
      const vessel = aisVessels[mmsi];
      const isSelected = mmsi === aisSelectedMmsi;
      const color = isSelected ? "#3b82f6" : "#10b981"; // Blue if selected, Emerald green if regular
      const size = isSelected ? 32 : 24;
      const rotationAngle = vessel.cog || vessel.heading || 0;

      // HTML custom rotated ship icon
      const shipIcon = L.divIcon({
        className: "custom-ship-marker",
        html: `
          <div style="transform: rotate(${rotationAngle}deg); width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; transition: transform 0.4s ease-out;">
            <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" stroke="#090d16" stroke-width="1.5">
              <path d="M12,2 L19,9 L19,17 C19,19.5 17,22 12,22 C7,22 5,19.5 5,17 L5,9 L12,2 Z" />
              <circle cx="12" cy="14" r="2.5" fill="#ffffff" />
            </svg>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
      });

      // Check if marker is already rendered
      let marker: L.Marker | undefined;
      aisGroup.eachLayer((layer) => {
        if ((layer as any).mmsi === mmsi) {
          marker = layer as L.Marker;
        }
      });

      const popupContent = `
        <div style="color: #0f172a; font-family: sans-serif; min-width: 160px; line-height: 1.4;">
          <div style="font-weight: bold; font-size: 13px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
            🚢 ${vessel.name}
          </div>
          <div style="font-size: 11px; margin-bottom: 3px;">MMSI: <span style="font-weight: 600;">${vessel.mmsi}</span></div>
          <div style="font-size: 11px; margin-bottom: 3px;">Speed: <span style="font-weight: 600;">${vessel.sog} kn</span></div>
          <div style="font-size: 11px; margin-bottom: 3px;">Heading: <span style="font-weight: 600;">${vessel.cog}°</span></div>
          <div style="font-size: 11px;">Dest: <span style="font-weight: 600; color: #1e3a8a;">${vessel.destination || "Not reported"}</span></div>
        </div>
      `;

      if (marker) {
        // Delta update to avoid redrawing entirely
        marker.setLatLng([vessel.latitude, vessel.longitude]);
        marker.setIcon(shipIcon);
        marker.setPopupContent(popupContent);
      } else {
        const newMarker = L.marker([vessel.latitude, vessel.longitude], { icon: shipIcon })
          .bindPopup(popupContent);

        (newMarker as any).mmsi = mmsi;
        newMarker.on("click", () => {
          selectAisVessel(mmsi);
        });

        aisGroup.addLayer(newMarker);
      }
    });
  }, [aisVessels, aisSelectedMmsi, mapType]);

  // Selected Vessel Trail Plotter
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mapType !== "massive_route") {
      if (trailPolylineRef.current) {
        trailPolylineRef.current.remove();
        trailPolylineRef.current = null;
      }
      return;
    }

    if (trailPolylineRef.current) {
      trailPolylineRef.current.remove();
      trailPolylineRef.current = null;
    }

    if (!aisSelectedMmsi) return;

    const trail = aisTrackTrails[aisSelectedMmsi] || [];
    if (trail.length < 2) return;

    const polyline = L.polyline(trail, {
      color: "#3b82f6", // Blue
      weight: 3,
      opacity: 0.8,
      dashArray: "6, 12",
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    trailPolylineRef.current = polyline;

    return () => {
      if (polyline) polyline.remove();
    };
  }, [aisSelectedMmsi, aisTrackTrails, mapType]);

  // Fit bounds to selected strait zone
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mapType !== "massive_route") return;

    const zoneBounds: Record<string, [[number, number], [number, number]]> = {
      singapore: [[1.15, 103.50], [1.45, 104.30]],
      sunda: [[-6.10, 105.70], [-5.70, 106.10]],
      malacca: [[2.00, 101.00], [3.50, 102.50]],
      jakarta: [[-6.15, 106.70], [-5.95, 107.00]],
    };

    const bounds = zoneBounds[aisTrackingZone];
    if (bounds) {
      try {
        map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30] });
      } catch (err) {
        console.error("Error setting zone bounds:", err);
      }
    }
  }, [aisTrackingZone, mapType]);

  // Center view on selected vessel
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mapType !== "massive_route" || !aisSelectedMmsi) return;

    const vessel = aisVessels[aisSelectedMmsi];
    if (vessel) {
      map.setView([vessel.latitude, vessel.longitude], Math.max(map.getZoom() || 11, 10));
    }
  }, [aisSelectedMmsi, mapType]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-b-xl" />;
}
