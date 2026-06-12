import { create } from "zustand";

export interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
}

export type ApiStatus = "checking" | "connected" | "disconnected";

interface MarineStore {
  messages: Message[];
  mapType: "route" | "massive_route";
  routePath: string[];
  routeCoordinates: [number, number][];
  apiStatus: ApiStatus;
  activeApiUrl: string | null;

  // Actions
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  addMessage: (message: Message) => void;
  setMapType: (type: "route" | "massive_route") => void;
  setRouteData: (path: string[], coordinates: [number, number][]) => void;
  setApiStatus: (status: ApiStatus) => void;
  setActiveApiUrl: (url: string | null) => void;
  resetChat: () => void;
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

export const useMarineStore = create<MarineStore>((set) => ({
  messages: defaultMessages,
  mapType: "route",
  routePath: defaultPath,
  routeCoordinates: defaultCoordinates,
  apiStatus: "checking",
  activeApiUrl: null,

  setMessages: (newMessages) =>
    set((state) => ({
      messages: typeof newMessages === "function" ? newMessages(state.messages) : newMessages,
    })),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setMapType: (type) => set({ mapType: type }),
  setRouteData: (path, coordinates) =>
    set({
      routePath: path,
      routeCoordinates: coordinates,
    }),
  setApiStatus: (status) => set({ apiStatus: status }),
  setActiveApiUrl: (url) => set({ activeApiUrl: url }),
  resetChat: () =>
    set({
      messages: defaultMessages,
      routePath: defaultPath,
      routeCoordinates: defaultCoordinates,
      mapType: "route",
    }),
}));
