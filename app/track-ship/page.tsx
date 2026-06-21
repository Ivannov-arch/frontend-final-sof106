"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Compass,
  MessageSquare,
  RefreshCw,
  Send,
  Ship,
  Play,
  Square,
  Key,
  Terminal,
  Search,
  MapPin,
  Anchor,
  Info,
  Sliders,
  CheckCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMarineStore, VesselData, AlternativeRoute } from "@/lib/store";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

interface ChatApiResponse {
  success: boolean;
  input: string;
  response?: {
    type?: string;
    content?: string;
  };
  markdown?: string;
  path?: string[];
  coordinates?: [number, number][];
  alternativeRoutes?: AlternativeRoute[];
  mapUrl?: string;
  mapHtml?: string;
}

const SHARED_AIS_KEY = process.env.NEXT_PUBLIC_AISSTREAM_API_KEY || "";

const API_CANDIDATES = [
  process.env.NEXT_PUBLIC_MARINE_API_URL,
  "http://localhost:8000",
  "https://marine-sof106.onrender.com",
].filter(Boolean) as string[];

// Bounding box preset configurations
const ZONE_PRESETS: Record<
  string,
  { name: string; bounds: [[number, number], [number, number]] }
> = {
  singapore: {
    name: "Singapore Strait",
    bounds: [
      [1.15, 103.5],
      [1.45, 104.3],
    ],
  },
  sunda: {
    name: "Sunda Strait",
    bounds: [
      [-6.1, 105.7],
      [-5.7, 106.1],
    ],
  },
  malacca: {
    name: "Malacca Strait",
    bounds: [
      [2.0, 101.0],
      [3.5, 102.5],
    ],
  },
  jakarta: {
    name: "Jakarta Bay",
    bounds: [
      [-6.15, 106.7],
      [-5.95, 107.0],
    ],
  },
};

// Simulated mock vessel generator presets
const MOCK_VESSELS_PRESETS: Record<
  string,
  {
    name: string;
    mmsi: string;
    lat: number;
    lon: number;
    sog: number;
    cog: number;
    type: number;
    dest: string;
  }[]
> = {
  singapore: [
    {
      name: "EVER GIVEN",
      mmsi: "353136000",
      lat: 1.25,
      lon: 103.7,
      sog: 11.4,
      cog: 85,
      type: 70,
      dest: "SINGAPORE",
    },
    {
      name: "MAERSK MC-KINNEY",
      mmsi: "219400000",
      lat: 1.22,
      lon: 103.85,
      sog: 14.2,
      cog: 265,
      type: 70,
      dest: "ROTTERDAM",
    },
    {
      name: "COSCO SHANGHAI",
      mmsi: "477123400",
      lat: 1.35,
      lon: 104.15,
      sog: 16.8,
      cog: 80,
      type: 70,
      dest: "SHANGHAI",
    },
    {
      name: "BUMI SURABAYA",
      mmsi: "525010200",
      lat: 1.18,
      lon: 103.65,
      sog: 4.5,
      cog: 120,
      type: 80,
      dest: "BATAM",
    },
    {
      name: "KRI BIMA SUCI",
      mmsi: "525100001",
      lat: 1.28,
      lon: 103.95,
      sog: 6.2,
      cog: 95,
      type: 55,
      dest: "JAKARTA",
    },
  ],
  sunda: [
    {
      name: "CRISTAL NAVIGATOR",
      mmsi: "371900100",
      lat: -5.92,
      lon: 105.9,
      sog: 12.1,
      cog: 15,
      type: 80,
      dest: "MERAK",
    },
    {
      name: "INDONESIA FERRY",
      mmsi: "525000002",
      lat: -5.93,
      lon: 105.98,
      sog: 8.4,
      cog: 195,
      type: 60,
      dest: "BAKAUHENI",
    },
    {
      name: "PACIFIC TANKER",
      mmsi: "355000230",
      lat: -5.85,
      lon: 105.82,
      sog: 13.5,
      cog: 210,
      type: 80,
      dest: "CILACAP",
    },
    {
      name: "SILIWANGI ARMY",
      mmsi: "525999000",
      lat: -6.02,
      lon: 105.88,
      sog: 2.1,
      cog: 45,
      type: 55,
      dest: "SURABAYA",
    },
  ],
  malacca: [
    {
      name: "LANGKAWI EXPRESS",
      mmsi: "533001222",
      lat: 2.8,
      lon: 101.4,
      sog: 22.4,
      cog: 320,
      type: 60,
      dest: "LANGKAWI",
    },
    {
      name: "MALACCA STAR",
      mmsi: "563049100",
      lat: 2.3,
      lon: 101.9,
      sog: 10.2,
      cog: 140,
      type: 70,
      dest: "SINGAPORE",
    },
    {
      name: "SEA CORAL",
      mmsi: "477991000",
      lat: 3.1,
      lon: 101.1,
      sog: 12.8,
      cog: 310,
      type: 70,
      dest: "PORT KLANG",
    },
    {
      name: "PORT KLANG PILOT",
      mmsi: "533992200",
      lat: 2.95,
      lon: 101.25,
      sog: 18.1,
      cog: 135,
      type: 31,
      dest: "PORT KLANG",
    },
  ],
  jakarta: [
    {
      name: "DHARMA FERRY VII",
      mmsi: "525003112",
      lat: -6.08,
      lon: 106.85,
      sog: 11.2,
      cog: 350,
      type: 60,
      dest: "SURABAYA",
    },
    {
      name: "JAKARTA TUG 1",
      mmsi: "525029011",
      lat: -6.02,
      lon: 106.75,
      sog: 3.2,
      cog: 180,
      type: 31,
      dest: "TG PRIOK",
    },
    {
      name: "SERIBU EXPRESS",
      mmsi: "525049922",
      lat: -5.98,
      lon: 106.7,
      sog: 24.5,
      cog: 330,
      type: 60,
      dest: "PULAU TIDUNG",
    },
    {
      name: "PELNI SINABUNG",
      mmsi: "525110992",
      lat: -6.09,
      lon: 106.95,
      sog: 14.5,
      cog: 10,
      type: 60,
      dest: "MAKASSAR",
    },
  ],
};

export default function TrackShipPage() {
  const messages = useMarineStore((state) => state.messages);
  const setMessages = useMarineStore((state) => state.setMessages);
  const mapType = useMarineStore((state) => state.mapType);
  const setMapType = useMarineStore((state) => state.setMapType);
  const setRouteData = useMarineStore((state) => state.setRouteData);
  const resetChat = useMarineStore((state) => state.resetChat);
  const routeCoordinates = useMarineStore((state) => state.routeCoordinates);

  // API Backend states
  const apiStatus = useMarineStore((state) => state.apiStatus);
  const setApiStatus = useMarineStore((state) => state.setApiStatus);
  const activeApiUrl = useMarineStore((state) => state.activeApiUrl);
  const setActiveApiUrl = useMarineStore((state) => state.setActiveApiUrl);

  // AIS Stream states & actions
  const aisStatus = useMarineStore((state) => state.aisStatus);
  const setAisStatus = useMarineStore((state) => state.setAisStatus);
  const aisError = useMarineStore((state) => state.aisError);
  const setAisError = useMarineStore((state) => state.setAisError);
  const aisVessels = useMarineStore((state) => state.aisVessels);
  const updateAisVessel = useMarineStore((state) => state.updateAisVessel);
  const aisSelectedMmsi = useMarineStore((state) => state.aisSelectedMmsi);
  const selectAisVessel = useMarineStore((state) => state.selectAisVessel);
  const aisTrackingZone = useMarineStore((state) => state.aisTrackingZone);
  const setAisTrackingZone = useMarineStore(
    (state) => state.setAisTrackingZone,
  );
  const aisLogs = useMarineStore((state) => state.aisLogs);
  const addAisLog = useMarineStore((state) => state.addAisLog);
  const clearAisLogs = useMarineStore((state) => state.clearAisLogs);
  const aisDemoMode = useMarineStore((state) => state.aisDemoMode);
  const setAisDemoMode = useMarineStore((state) => state.setAisDemoMode);
  const clearAisVessels = useMarineStore((state) => state.clearAisVessels);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [vesselFilter, setVesselFilter] = useState("");
  const [showAisLogs, setShowAisLogs] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logTerminalEndRef = useRef<HTMLDivElement>(null);

  // Connection refs
  const sseAbortRef = useRef<AbortController | null>(null);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localMockVesselsRef = useRef<Record<string, VesselData>>({});

  // Auto-scroll for logs terminal
  useEffect(() => {
    logTerminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aisLogs, showAisLogs]);

  // Probe API connection
  const probeApi = useCallback(async (): Promise<string | null> => {
    setApiStatus("checking");
    for (const baseUrl of API_CANDIDATES) {
      try {
        const url = baseUrl.replace(/\/+$/, "");
        const res = await fetch(url, {
          method: "GET",
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          setActiveApiUrl(url);
          setApiStatus("connected");
          return url;
        }
      } catch {
        // try next candidate
      }
    }
    setApiStatus("disconnected");
    setActiveApiUrl(null);
    return null;
  }, [setApiStatus, setActiveApiUrl]);

  useEffect(() => {
    probeApi();
    const interval = setInterval(probeApi, 30_000);
    return () => clearInterval(interval);
  }, [probeApi]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const getTimestamp = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // AIS Stream Engine Connection Handler
  const handleAisConnect = useCallback(() => {
    // Clean up any existing instances
    if (sseAbortRef.current) {
      sseAbortRef.current.abort();
      sseAbortRef.current = null;
    }
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    clearAisVessels();

    if (aisDemoMode) {
      setAisStatus("connecting");
      setAisError(null);
      addAisLog("[System] Initializing Simulated AIS Stream engine...");

      setTimeout(() => {
        setAisStatus("connected");
        addAisLog(
          `[System] Connected to Mock AIS Streamer (Zone: ${aisTrackingZone.toUpperCase()}).`,
        );

        // Load starting presets
        const startPresets =
          MOCK_VESSELS_PRESETS[aisTrackingZone] ||
          MOCK_VESSELS_PRESETS.singapore;
        const initialVessels: Record<string, VesselData> = {};

        startPresets.forEach((p) => {
          const v: VesselData = {
            mmsi: p.mmsi,
            name: p.name,
            latitude: p.lat,
            longitude: p.lon,
            sog: p.sog,
            cog: p.cog,
            heading: p.cog,
            destination: p.dest,
            shipType: p.type,
            lastUpdated: new Date().toISOString(),
          };
          initialVessels[p.mmsi] = v;
          updateAisVessel(v);
          addAisLog(
            `[AIS] Stream detected: Vessel ${v.name} (MMSI: ${v.mmsi})`,
          );
        });

        localMockVesselsRef.current = initialVessels;

        // Start coordinate drift cycle simulating actual movements
        demoIntervalRef.current = setInterval(() => {
          const mmsis = Object.keys(localMockVesselsRef.current);
          if (mmsis.length === 0) return;

          // Select a random vessel to drift
          const randomMmsi = mmsis[Math.floor(Math.random() * mmsis.length)];
          const v = localMockVesselsRef.current[randomMmsi];

          const rad = (v.cog * Math.PI) / 180;
          // Scale movement drift visually
          const driftFactor = 0.0001;
          const dLat = Math.cos(rad) * v.sog * driftFactor;
          const dLon = Math.sin(rad) * v.sog * driftFactor;

          // Introduce minor heading perturbations (-6 to +6 deg)
          let newCog = v.cog + (Math.random() * 12 - 6);
          if (newCog < 0) newCog += 360;
          if (newCog >= 360) newCog -= 360;

          // Minor speed adjustments
          const newSog = Math.max(0.5, v.sog + (Math.random() * 1.6 - 0.8));

          const updatedVessel: VesselData = {
            ...v,
            latitude: parseFloat((v.latitude + dLat).toFixed(6)),
            longitude: parseFloat((v.longitude + dLon).toFixed(6)),
            cog: parseFloat(newCog.toFixed(1)),
            heading: Math.round(newCog),
            sog: parseFloat(newSog.toFixed(1)),
            lastUpdated: new Date().toISOString(),
          };

          localMockVesselsRef.current[randomMmsi] = updatedVessel;
          updateAisVessel(updatedVessel);
          addAisLog(
            `[AIS] Msg ID 1 (PosReport): ${updatedVessel.name} (${updatedVessel.mmsi}) | Lat: ${updatedVessel.latitude}, Lon: ${updatedVessel.longitude} | Speed: ${updatedVessel.sog} kn | Heading: ${updatedVessel.cog}°`,
          );
        }, 1200);
      }, 1000);
    } else {
      // Connect via backend SSE proxy (AISstream blocks direct browser connections)
      if (!SHARED_AIS_KEY) {
        setAisStatus("error");
        setAisError(
          "Shared API Key is missing. Please add NEXT_PUBLIC_AISSTREAM_API_KEY to your .env.local file and restart the server.",
        );
        addAisLog(
          "[System Error] API Key missing. Please configure NEXT_PUBLIC_AISSTREAM_API_KEY in .env.local.",
        );
        return;
      }

      const backendUrl = activeApiUrl;
      if (!backendUrl) {
        setAisStatus("error");
        setAisError("Backend API is offline. Cannot proxy AIS stream.");
        addAisLog(
          "[System Error] Backend API not reachable. Start the FastAPI server.",
        );
        return;
      }

      setAisStatus("connecting");
      setAisError(null);
      addAisLog("[System] Connecting to AIS stream via backend proxy...");

      const targetZone =
        ZONE_PRESETS[aisTrackingZone] ?? ZONE_PRESETS.singapore;
      const [[minLat, minLon], [maxLat, maxLon]] = targetZone.bounds;
      const params = new URLSearchParams({
        api_key: SHARED_AIS_KEY,
        min_lat: String(minLat),
        min_lon: String(minLon),
        max_lat: String(maxLat),
        max_lon: String(maxLon),
      });

      const controller = new AbortController();
      sseAbortRef.current = controller;

      addAisLog(
        `[System] Subscribing to zone: ${targetZone.name} | Bounds: [[${minLat},${minLon}],[${maxLat},${maxLon}]]`,
      );

      fetch(`${backendUrl}/api/ais/stream?${params}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok || !res.body) {
            throw new Error(`Proxy returned ${res.status}`);
          }
          setAisStatus("connected");
          addAisLog("[System] SSE proxy connected. Streaming live AIS data...");

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  setAisStatus("error");
                  setAisError(`AISStream Error: ${data.error}`);
                  addAisLog(`[AISStream API Error] ${data.error}`);
                  controller.abort();
                  return;
                }

                const msgType = data.MessageType;
                const meta = data.MetaData || {};
                const mmsi = meta.MMSI_String || String(meta.MMSI);
                if (!mmsi) continue;

                const name = meta.ShipName?.trim() || `Vessel ${mmsi}`;
                const lat = meta.latitude;
                const lon = meta.longitude;
                if (lat === undefined || lon === undefined) continue;

                let sog = 0,
                  cog = 0,
                  heading = 0,
                  destination = "",
                  shipType = 0;
                if (
                  msgType === "PositionReport" &&
                  data.Message?.PositionReport
                ) {
                  sog = data.Message.PositionReport.Sog || 0;
                  cog = data.Message.PositionReport.Cog || 0;
                  heading = data.Message.PositionReport.TrueHeading || 0;
                } else if (
                  msgType === "ShipStaticData" &&
                  data.Message?.ShipStaticData
                ) {
                  destination =
                    data.Message.ShipStaticData.Destination?.trim() || "";
                  shipType = data.Message.ShipStaticData.Type || 0;
                }

                const parsedVessel: Partial<VesselData> & { mmsi: string } = {
                  mmsi,
                  name,
                  latitude: lat,
                  longitude: lon,
                  sog,
                  cog,
                  heading: heading || cog,
                  lastUpdated: meta.time_utc || new Date().toISOString(),
                };
                if (destination) parsedVessel.destination = destination;
                if (shipType) parsedVessel.shipType = shipType;

                updateAisVessel(parsedVessel);
                addAisLog(
                  `[Live AIS] ${msgType} | ${name} (${mmsi}) | Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`,
                );
              } catch {
                // skip malformed line
              }
            }
          }
          setAisStatus("disconnected");
          addAisLog("[System] SSE stream ended.");
        })
        .catch((err: Error) => {
          if (err.name === "AbortError") return;
          setAisStatus("error");
          setAisError(err.message || "SSE proxy connection failed.");
          addAisLog(`[System Error] ${err.message}`);
        });
    }
  }, [
    aisDemoMode,
    aisTrackingZone,
    activeApiUrl,
    updateAisVessel,
    addAisLog,
    clearAisVessels,
    setAisStatus,
    setAisError,
  ]);

  const handleAisDisconnect = useCallback(() => {
    if (sseAbortRef.current) {
      sseAbortRef.current.abort();
      sseAbortRef.current = null;
    }
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setAisStatus("disconnected");
    addAisLog("[System] Terminated connections. Stream stopped.");
  }, [setAisStatus, addAisLog]);

  // Handle auto-reconnect when toggling tracking parameters or mounting
  useEffect(() => {
    // Clean up any active connections
    if (sseAbortRef.current) {
      sseAbortRef.current.abort();
      sseAbortRef.current = null;
    }
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }

    // Auto-connect whenever the AIS tab is active
    if (mapType === "massive_route") {
      handleAisConnect();
    }
  }, [mapType, aisTrackingZone, aisDemoMode, handleAisConnect]); // Re-connect automatically on configuration tweaks

  // Handle chatbot send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const userRawText = inputValue.trim();
    if (!userRawText) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "user",
        text: userRawText,
        timestamp: getTimestamp(),
      },
    ]);
    setInputValue("");
    setIsTyping(true);

    let currentUrl = activeApiUrl;
    if (!currentUrl) {
      currentUrl = await probeApi();
    }

    if (!currentUrl) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: `⚠️ Connection Error: Unable to reach any Marine API server.\n\nPlease ensure the FastAPI backend is running locally (python -m uvicorn mt.chatbot.api:app).`,
          timestamp: getTimestamp(),
        },
      ]);
      setIsTyping(false);
      return;
    }

    try {
      const response = await fetch(`${currentUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userRawText }),
      });

      if (!response.ok)
        throw new Error(`Marine API returned ${response.status}`);

      const data: ChatApiResponse = await response.json();
      const botText =
        data.markdown || data.response?.content || "No response received.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: botText,
          timestamp: getTimestamp(),
        },
      ]);

      let coordinates = data.coordinates;
      let path = data.path;
      const altRoutes = data.alternativeRoutes || [];

      if ((!coordinates || coordinates.length === 0) && data.mapUrl) {
        try {
          const urlObj = new URL(data.mapUrl, "http://dummy.com");
          const coordsParam = urlObj.searchParams.get("coords");
          const pathParam = urlObj.searchParams.get("path");
          if (coordsParam) {
            coordinates = coordsParam.split(";").map((pair) => {
              const [lat, lon] = pair.split(",").map(Number);
              return [lat, lon] as [number, number];
            });
          }
          if (pathParam) path = pathParam.split("|");
        } catch (err) {
          console.error("Failed to parse coordinates from mapUrl:", err);
        }
      }

      if (coordinates && coordinates.length > 0) {
        setRouteData(path || [], coordinates, altRoutes);
        setMapType("route");
      }
    } catch {
      setApiStatus("disconnected");
      setActiveApiUrl(null);
      probeApi();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: `⚠️ API Servers are currently offline. Searching for servers...`,
          timestamp: getTimestamp(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Filtered vessel calculations
  const filteredVessels = Object.values(aisVessels).filter((vessel) => {
    const query = vesselFilter.toLowerCase().trim();
    if (!query) return true;
    return (
      vessel.name.toLowerCase().includes(query) ||
      vessel.mmsi.includes(query) ||
      vessel.destination?.toLowerCase().includes(query)
    );
  });

  const selectedVessel = aisSelectedMmsi ? aisVessels[aisSelectedMmsi] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Ship className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">
                AIS Marine Tracker
              </h1>
              <p className="text-xs text-slate-400">Powered by AISstream.io</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                apiStatus === "connected"
                  ? "bg-green-500 animate-ping"
                  : apiStatus === "checking"
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500"
              }`}
            ></span>
            <span
              className={`text-xs font-medium ${
                apiStatus === "connected"
                  ? "text-green-400"
                  : apiStatus === "checking"
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {apiStatus === "connected"
                ? `Route API Connected`
                : apiStatus === "checking"
                  ? "Connecting API..."
                  : "Route API Offline"}
            </span>
            {apiStatus === "disconnected" && (
              <button
                onClick={probeApi}
                className="text-xs text-slate-400 hover:text-white transition-colors"
                title="Retry connection"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
        {/* Left Map Content Panel */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[480px] lg:h-[580px]">
            {/* Map Header Tabs */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-blue-400" />
                <span className="font-semibold text-sm">
                  Interactive Navigation Map
                </span>
              </div>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button
                  onClick={() => setMapType("route")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    mapType === "route"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Static Route Planning
                </button>
                <button
                  onClick={() => setMapType("massive_route")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    mapType === "massive_route"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Real-time AIS Tracker
                </button>
              </div>
            </div>

            {/* Render Map Component */}
            <div className="flex-1 bg-slate-950 relative">
              <Map />
            </div>
          </div>

          {/* Map Footer Information Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {mapType === "route" ? (
              <>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Departure Port
                  </span>
                  <span className="text-sm font-semibold text-white mt-1">
                    Port Klang (MY)
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Destination Port
                  </span>
                  <span className="text-sm font-semibold text-white mt-1">
                    Singapore (SG)
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Waypoints
                  </span>
                  <span className="text-sm font-semibold text-white mt-1">
                    {routeCoordinates.length} Points
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Optimal Route Status
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full w-fit mt-1">
                    Ready
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    AIS connection
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit mt-1 border ${
                      aisStatus === "connected"
                        ? "bg-green-500/10 text-green-400 border-green-500/20 animate-pulse"
                        : aisStatus === "connecting"
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {aisStatus.toUpperCase()}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Tracked Vessels
                  </span>
                  <span className="text-sm font-semibold text-white mt-1">
                    {Object.keys(aisVessels).length} in scope
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Tracking Preset
                  </span>
                  <span className="text-sm font-semibold text-white mt-1 capitalize">
                    {aisTrackingZone}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Feed Mode
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full w-fit mt-1 border ${
                      aisDemoMode
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {aisDemoMode ? "Simulated Demo" : "Live Stream"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Console Panel (Chatbot or AIS Stream Controller) */}
        <div className="w-full lg:w-[420px] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[600px] lg:h-[680px]">
          {mapType === "route" ? (
            /* Chatbot Mode Panel */
            <>
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  <span className="font-semibold text-sm text-slate-200">
                    Marine AI Assistant
                  </span>
                </div>
                <button
                  onClick={resetChat}
                  className="text-xs text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition-all"
                  title="Reset Chat"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Chat Scrolling Window */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-950/40">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm whitespace-pre-line leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                      <span className="block text-[10px] mt-1.5 opacity-60 text-right">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 text-slate-400 border border-slate-700 rounded-2xl rounded-bl-none p-3 text-sm shadow-sm flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Input Recommendations */}
              <div className="px-4 py-2 bg-slate-950/20 border-t border-slate-850 flex gap-2 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setInputValue("from Port Klang to Singapore")}
                  className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap transition-all"
                >
                  Find Route
                </button>
                <button
                  onClick={() => setInputValue("list ports")}
                  className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap transition-all"
                >
                  List Ports
                </button>
                <button
                  onClick={() => setInputValue("help")}
                  className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap transition-all"
                >
                  User Guide
                </button>
                <button
                  onClick={() => setInputValue("explain AIS data")}
                  className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap transition-all"
                >
                  AIS info
                </button>
              </div>

              {/* Chat Send Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask the Marine AI helper..."
                  className="flex-1 bg-slate-950 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all flex items-center justify-center"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            /* Real-Time AIS Tracker Console Deck */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* AIS Deck Title */}
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-blue-400" />
                  <span className="font-semibold text-sm text-slate-200 font-sans">
                    AIS Streaming Console
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      aisStatus === "connected"
                        ? "bg-green-500 animate-pulse"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs text-slate-400 font-mono capitalize">
                    {aisStatus}
                  </span>
                </div>
              </div>

              {/* Scrollable Control Panels Section */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-950/20">
                {/* Connection Setup Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-blue-400" /> Connection
                    Credentials
                  </h3>

                  {/* Demo Mode Toggle */}
                  <label className="flex items-center justify-between cursor-pointer py-1 select-none">
                    <span className="text-xs font-medium text-slate-200">
                      Enable Simulated Demo Mode
                    </span>
                    <input
                      type="checkbox"
                      checked={aisDemoMode}
                      onChange={(e) => {
                        handleAisDisconnect();
                        setAisDemoMode(e.target.checked);
                      }}
                      className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                  </label>

                  {/* API Key Status Indicator (Hidden if Demo Mode enabled) */}
                  {!aisDemoMode && (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-200">
                          AISstream API Key
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Managed via Environment
                        </span>
                      </div>
                      {SHARED_AIS_KEY ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950/40 text-green-400 border border-green-900/60">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/40 text-red-400 border border-red-900/60 animate-pulse">
                          Missing
                        </span>
                      )}
                    </div>
                  )}

                  {/* Connect Actions */}
                  {aisStatus === "connected" ? (
                    <button
                      onClick={handleAisDisconnect}
                      className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Square className="h-3.5 w-3.5" /> Disconnect Stream
                    </button>
                  ) : (
                    <button
                      onClick={handleAisConnect}
                      disabled={aisStatus === "connecting"}
                      className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="h-3.5 w-3.5" />{" "}
                      {aisStatus === "connecting"
                        ? "Connecting..."
                        : "Connect Stream"}
                    </button>
                  )}

                  {aisError && (
                    <div className="p-2 border border-red-900 bg-red-950/20 text-red-400 text-xs rounded-lg flex items-start gap-1.5 leading-snug">
                      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{aisError}</span>
                    </div>
                  )}
                </div>

                {/* Preset Strait Bounds Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-400" /> Strait
                    presets scope
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ZONE_PRESETS).map(([key, zone]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setAisTrackingZone(key as "singapore" | "sunda" | "malacca" | "jakarta" | "custom");
                          selectAisVessel(null); // Clear selections
                        }}
                        className={`p-2 rounded-lg text-left text-xs font-semibold transition-all border ${
                          aisTrackingZone === key
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        📍 {zone.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Vessel Explorer Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 min-h-[220px] max-h-[300px]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Anchor className="h-3.5 w-3.5 text-blue-400" /> Vessel
                      scope explorer
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-950 text-slate-400 rounded-full border border-slate-850">
                      {filteredVessels.length} found
                    </span>
                  </div>

                  {/* Vessel Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search vessels by name or mmsi..."
                      value={vesselFilter}
                      onChange={(e) => setVesselFilter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-blue-500 text-slate-100 placeholder-slate-500"
                    />
                    <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
                  </div>

                  {/* Vessels List */}
                  <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 scrollbar-thin">
                    {filteredVessels.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500">
                        {aisStatus !== "connected"
                          ? "Connect feed to stream vessels"
                          : "No matching vessels tracked"}
                      </div>
                    ) : (
                      filteredVessels.map((vessel) => (
                        <div
                          key={vessel.mmsi}
                          onClick={() => selectAisVessel(vessel.mmsi)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex justify-between items-center ${
                            aisSelectedMmsi === vessel.mmsi
                              ? "bg-blue-600/10 border-blue-500 text-white"
                              : "bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-300"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-xs truncate flex items-center gap-1.5">
                              🚢 {vessel.name}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              MMSI: {vessel.mmsi}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-emerald-400 block">
                              {vessel.sog} kn
                            </span>
                            <span className="text-[9px] text-slate-500 block font-mono">
                              {vessel.cog}° COG
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Selected Vessel Meta Panel */}
                {selectedVessel && (
                  <div className="bg-gradient-to-br from-blue-950/20 to-slate-900 border border-blue-500/20 rounded-xl p-4 flex flex-col gap-3.5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 bg-blue-500/10 text-blue-400 border-l border-b border-blue-500/20 rounded-bl-lg">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Ship className="h-5 w-5 text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-white truncate pr-6">
                          {selectedVessel.name}
                        </h4>
                        <p className="text-[10px] text-blue-300/80">
                          Active Voyage details
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-blue-900/30 pt-3">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          MMSI Code
                        </span>
                        <span className="font-semibold font-mono">
                          {selectedVessel.mmsi}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Ship Speed
                        </span>
                        <span className="font-semibold text-emerald-400">
                          {selectedVessel.sog} knots
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Course / Heading
                        </span>
                        <span className="font-semibold">
                          {selectedVessel.cog}° / {selectedVessel.heading}°
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Destination
                        </span>
                        <span className="font-semibold truncate block text-blue-300">
                          {selectedVessel.destination || "Not reported"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Current Coordinates
                        </span>
                        <span className="font-semibold font-mono text-[11px] block mt-0.5">
                          Lat: {selectedVessel.latitude.toFixed(5)}, Lon:{" "}
                          {selectedVessel.longitude.toFixed(5)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 border-t border-blue-900/30 pt-3">
                      <button
                        onClick={() => selectAisVessel(null)}
                        className="flex-1 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all text-center"
                      >
                        Close Details
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Collapsible Live Raw Ticker Terminal logs */}
              <div className="border-t border-slate-800 bg-slate-950 flex flex-col overflow-hidden max-h-[180px]">
                <div
                  onClick={() => setShowAisLogs(!showAisLogs)}
                  className="px-4 py-2 bg-slate-900 border-b border-slate-950 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-emerald-400">
                      AIS Data stream logs
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAisLogs();
                      }}
                      className="text-[9px] font-bold font-mono text-slate-500 hover:text-slate-300 transition-colors uppercase border border-slate-800 px-1.5 py-0.5 rounded"
                    >
                      Clear
                    </button>
                    <span className="text-[10px] text-slate-500">
                      {showAisLogs ? "▼ Hide" : "▲ Show"}
                    </span>
                  </div>
                </div>

                {showAisLogs && (
                  <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] leading-relaxed text-emerald-500 bg-black/90 scrollbar-none min-h-[100px]">
                    <div className="flex flex-col-reverse gap-0.5">
                      <div ref={logTerminalEndRef} />
                      {aisLogs.map((log, idx) => {
                        let color = "text-emerald-400";
                        if (log.includes("[System Error]"))
                          color = "text-red-500 font-bold";
                        else if (log.includes("[System]"))
                          color = "text-yellow-400";
                        return (
                          <div
                            key={idx}
                            className={`${color} break-all truncate`}
                          >
                            {log}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
