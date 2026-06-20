import { create } from "zustand";

export interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
}

export type ApiStatus = "checking" | "connected" | "disconnected";

export interface VesselData {
  mmsi: string;
  name: string;
  latitude: number;
  longitude: number;
  sog: number; // Speed Over Ground in knots
  cog: number; // Course Over Ground in degrees
  heading: number; // True heading in degrees
  destination?: string;
  shipType?: number;
  lastUpdated: string;
}

export interface AlternativeRoute {
  path: string[];
  coordinates: [number, number][];
  distance_nm: number;
  eta_hours: number;
}

interface MarineStore {
  messages: Message[];
  mapType: "route" | "massive_route"; // "massive_route" is mapped visually as the Real-time AIS Tracker
  routePath: string[];
  routeCoordinates: [number, number][];
  alternativeRoutes: AlternativeRoute[];
  apiStatus: ApiStatus;
  activeApiUrl: string | null;

  // AIS Stream state
  aisApiKey: string;
  aisStatus: "disconnected" | "connecting" | "connected" | "error";
  aisError: string | null;
  aisVessels: Record<string, VesselData>;
  aisSelectedMmsi: string | null;
  aisTrackingZone: "singapore" | "sunda" | "malacca" | "jakarta" | "custom";
  aisLogs: string[];
  aisTrackTrails: Record<string, [number, number][]>;
  aisDemoMode: boolean;

  // Actions
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  addMessage: (message: Message) => void;
  setMapType: (type: "route" | "massive_route") => void;
  setRouteData: (path: string[], coordinates: [number, number][], alternativeRoutes?: AlternativeRoute[]) => void;
  setApiStatus: (status: ApiStatus) => void;
  setActiveApiUrl: (url: string | null) => void;
  resetChat: () => void;

  // AIS Stream actions
  setAisApiKey: (key: string) => void;
  setAisStatus: (status: "disconnected" | "connecting" | "connected" | "error") => void;
  setAisError: (error: string | null) => void;
  updateAisVessel: (vessel: Partial<VesselData> & { mmsi: string }) => void;
  selectAisVessel: (mmsi: string | null) => void;
  setAisTrackingZone: (zone: "singapore" | "sunda" | "malacca" | "jakarta" | "custom") => void;
  addAisLog: (log: string) => void;
  clearAisLogs: () => void;
  setAisDemoMode: (demo: boolean) => void;
  clearAisVessels: () => void;
}

const defaultMessages: Message[] = [
  {
    id: "1",
    sender: "bot",
    text: "Hello! I am your Marine Traffic AI Assistant. I can help you track voyages, analyze AIS data quality, and visualize routes.",
    timestamp: "Just now",
  },
  {
    id: "2",
    sender: "bot",
    text: "Currently showing the standard route from Port Klang (Malaysia) to Singapore. Use the tabs above the map to switch views.",
    timestamp: "Just now",
  },
];

const defaultPath = ["PortKlang", "MalaccaStrait", "SingaporeStrait", "Singapore"];
const defaultCoordinates: [number, number][] = [
  [3.0, 101.4],
  [2.35, 101.95],
  [1.22, 103.6],
  [1.29027, 103.851959],
];

// Helper to safely access localStorage in client-side Next.js environment
const getLocalStorageKey = (key: string, defaultValue: string): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key) || defaultValue;
  }
  return defaultValue;
};

export const useMarineStore = create<MarineStore>((set) => ({
  messages: defaultMessages,
  mapType: "route",
  routePath: defaultPath,
  routeCoordinates: defaultCoordinates,
  alternativeRoutes: [],
  apiStatus: "checking",
  activeApiUrl: null,

  // AIS Stream Initial State
  aisApiKey: getLocalStorageKey("aisstream_api_key", ""),
  aisStatus: "disconnected",
  aisError: null,
  aisVessels: {},
  aisSelectedMmsi: null,
  aisTrackingZone: "singapore",
  aisLogs: ["[System] AIS Tracker initialized. Use Demo Mode or supply an API Key to begin."],
  aisTrackTrails: {},
  aisDemoMode: false, // Defaults to Demo Mode so it works instantly out-of-the-box!

  setMessages: (newMessages) =>
    set((state) => ({
      messages: typeof newMessages === "function" ? newMessages(state.messages) : newMessages,
    })),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setMapType: (type) => set({ mapType: type }),
  setRouteData: (path, coordinates, alternativeRoutes) =>
    set({
      routePath: path,
      routeCoordinates: coordinates,
      alternativeRoutes: alternativeRoutes || []
    }),
  setApiStatus: (status) => set({ apiStatus: status }),
  setActiveApiUrl: (url) => set({ activeApiUrl: url }),
  resetChat: () =>
    set({
      messages: defaultMessages,
      routePath: defaultPath,
      routeCoordinates: defaultCoordinates,
      alternativeRoutes: [],
      mapType: "route",
    }),

  // AIS Actions
  setAisApiKey: (key) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("aisstream_api_key", key);
    }
    set({ aisApiKey: key });
  },
  setAisStatus: (status) => set({ aisStatus: status }),
  setAisError: (error) => set({ aisError: error }),
  updateAisVessel: (vessel) =>
    set((state) => {
      const existing = state.aisVessels[vessel.mmsi];
      const updatedVessel = {
        mmsi: vessel.mmsi,
        name: vessel.name || existing?.name || `MMSI: ${vessel.mmsi}`,
        latitude: vessel.latitude !== undefined ? vessel.latitude : existing?.latitude || 0,
        longitude: vessel.longitude !== undefined ? vessel.longitude : existing?.longitude || 0,
        sog: vessel.sog !== undefined ? vessel.sog : existing?.sog || 0,
        cog: vessel.cog !== undefined ? vessel.cog : existing?.cog || 0,
        heading: vessel.heading !== undefined ? vessel.heading : existing?.heading || 0,
        destination: vessel.destination || existing?.destination,
        shipType: vessel.shipType !== undefined ? vessel.shipType : existing?.shipType,
        lastUpdated: vessel.lastUpdated || new Date().toISOString(),
      };

      // Add position coordinate to trailing path history
      const existingTrail = state.aisTrackTrails[vessel.mmsi] || [];
      const isNewCoordinate =
        existingTrail.length === 0 ||
        existingTrail[existingTrail.length - 1][0] !== updatedVessel.latitude ||
        existingTrail[existingTrail.length - 1][1] !== updatedVessel.longitude;

      let newTrail = existingTrail;
      if (isNewCoordinate && updatedVessel.latitude && updatedVessel.longitude) {
        newTrail = [...existingTrail, [updatedVessel.latitude, updatedVessel.longitude] as [number, number]];
        // Cap the trail points length to preserve memory
        if (newTrail.length > 50) {
          newTrail.shift();
        }
      }

      return {
        aisVessels: {
          ...state.aisVessels,
          [vessel.mmsi]: updatedVessel,
        },
        aisTrackTrails: {
          ...state.aisTrackTrails,
          [vessel.mmsi]: newTrail,
        },
      };
    }),
  selectAisVessel: (mmsi) => set({ aisSelectedMmsi: mmsi }),
  setAisTrackingZone: (zone) => set({ aisTrackingZone: zone }),
  addAisLog: (log) =>
    set((state) => {
      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const newLogs = [`[${timestamp}] ${log}`, ...state.aisLogs];
      if (newLogs.length > 100) {
        newLogs.pop();
      }
      return { aisLogs: newLogs };
    }),
  clearAisLogs: () => set({ aisLogs: [] }),
  setAisDemoMode: (demo) => set({ aisDemoMode: demo }),
  clearAisVessels: () => set({ aisVessels: {}, aisTrackTrails: {}, aisSelectedMmsi: null }),
}));
