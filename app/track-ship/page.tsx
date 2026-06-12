"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Compass, MessageSquare, RefreshCw, Send, Ship } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMarineStore } from "@/lib/store";

// Dynamically import map with ssr: false since Leaflet uses the window object
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
  mapUrl?: string;
  mapHtml?: string;
}

// API endpoints to try in order: env override → local → Render deployment
const API_CANDIDATES = [
  process.env.NEXT_PUBLIC_MARINE_API_URL,
  "http://localhost:8000",
  "https://marine-sof106.onrender.com",
].filter(Boolean) as string[];

export default function TrackShipPage() {
  const messages = useMarineStore((state) => state.messages);
  const setMessages = useMarineStore((state) => state.setMessages);
  const mapType = useMarineStore((state) => state.mapType);
  const setMapType = useMarineStore((state) => state.setMapType);
  const setRouteData = useMarineStore((state) => state.setRouteData);
  const resetChat = useMarineStore((state) => state.resetChat);

  const apiStatus = useMarineStore((state) => state.apiStatus);
  const setApiStatus = useMarineStore((state) => state.setApiStatus);
  const activeApiUrl = useMarineStore((state) => state.activeApiUrl);
  const setActiveApiUrl = useMarineStore((state) => state.setActiveApiUrl);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Probe each candidate API URL until one responds
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

  // Probe on mount, then every 30s
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

    // If no API is connected, re-probe before giving up
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
          text: `⚠️ Connection Error: Unable to reach any Marine API server.\n\nTried:\n${API_CANDIDATES.map((u) => `• ${u}`).join("\n")}\n\nPlease ensure the FastAPI backend is running locally (python -m uvicorn mt.chatbot.api:app) or the Render deployment is active.`,
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

      if (!response.ok) {
        throw new Error(`Marine API returned ${response.status}`);
      }

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

      // Fallback parsing from mapUrl if coordinates are missing (e.g. against older/deployed backend versions)
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
          if (pathParam) {
            path = pathParam.split("|");
          }
        } catch (err) {
          console.error("Failed to parse fallback coordinates from mapUrl:", err);
        }
      }

      if (coordinates && coordinates.length > 0) {
        setRouteData(path || [], coordinates);
        setMapType("route");
      }
    } catch {
      // Mark as disconnected and re-probe in background
      setApiStatus("disconnected");
      setActiveApiUrl(null);
      probeApi();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: `⚠️ Connection lost to ${currentUrl}. Searching for an available server...\n\nPlease try again in a moment.`,
          timestamp: getTimestamp(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Ship className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">
                AIS Voyage Tracker
              </h1>
              <p className="text-xs text-slate-400">
                Powered by mt-ais-toolbox
              </p>
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
                ? `API Connected`
                : apiStatus === "checking"
                  ? "Connecting..."
                  : "API Offline"}
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[450px] lg:h-[550px]">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-blue-400" />
                <span className="font-semibold text-sm">
                  Interactive AIS Map
                </span>
              </div>
              <div className="flex bg-slate-850 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setMapType("route")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mapType === "route"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Standard Route
                </button>
                <button
                  onClick={() => setMapType("massive_route")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mapType === "massive_route"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Massive Route (Density)
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 relative">
              <Map />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                Tracked Coordinates
              </span>
              <span className="text-sm font-semibold text-white mt-1">
                2,415 Points
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Current Status
              </span>
              <span className="text-xs font-bold px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full w-fit mt-1">
                Completed
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[400px] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[550px] lg:h-[635px]">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              <span className="font-semibold text-sm text-slate-200">
                Marine AI Chatbot
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

          <div className="px-4 py-2 bg-slate-950/20 border-t border-slate-800 flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setInputValue("from Jakarta to Singapore")}
              className="text-xs bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap transition-all"
            >
              Find Route
            </button>
            <button
              onClick={() => setInputValue("list ports")}
              className="text-xs bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap transition-all"
            >
              List Ports
            </button>
            {/* <button
              onClick={() => setInputValue("show traffic from port Klang to Singapore")}
              className="text-xs bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap transition-all"
            >
              Show Traffic
            </button> */}
            <button
              onClick={() => setInputValue("What is AIS data?")}
              className="text-xs bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap transition-all"
            >
              AIS Info
            </button>
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a marine traffic query..."
              className="flex-1 bg-slate-950 text-slate-100 border border-slate-850 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
