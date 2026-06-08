'use client';

import { useEffect, useRef, useState } from "react";
import { Compass, MessageSquare, RefreshCw, Send, Ship } from "lucide-react";

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

interface ChatApiResponse {
  success: boolean;
  input: string;
  response?: {
    type?: string;
    content?: string;
  };
  markdown?: string;
  mapUrl?: string;
  mapHtml?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_MARINE_API_URL || "http://127.0.0.1:8000";
const initialMessages: Message[] = [
  {
    id: '1',
    sender: 'bot',
    text: 'Hello! I am your Marine Traffic AI Assistant. I can help you track voyages, analyze AIS data quality, and visualize routes.',
    timestamp: 'Just now',
  },
  {
    id: '2',
    sender: 'bot',
    text: 'Currently showing the standard route from Port Klang (Malaysia) to Singapore. Use the tabs above the map to switch views.',
    timestamp: 'Just now',
  },
];

export default function TrackShipPage() {
  const [mapType, setMapType] = useState<'route' | 'massive_route'>('route');
  const [mapUrl, setMapUrl] = useState('/maps/route.html');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const getTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const userRawText = inputValue.trim();
    if (!userRawText) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: userRawText,
        timestamp: getTimestamp(),
      },
    ]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
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
      const botText = data.markdown || data.response?.content || "No response received.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botText,
          timestamp: getTimestamp(),
        },
      ]);

      if (data.mapHtml) {
        try {
          await fetch('/api/save-map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html: data.mapHtml })
          });
          setMapUrl(`/maps/route.html?v=${Date.now()}`);
          setMapType('route');
        } catch (err) {
          console.error("Failed to save dynamic map HTML:", err);
        }
      } else if (data.mapUrl) {
        const relativeUrl = data.mapUrl.startsWith('/') ? data.mapUrl : `/${data.mapUrl}`;
        setMapUrl(relativeUrl);
        setMapType(data.mapUrl.includes('massive') ? 'massive_route' : 'route');
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `Connection Error: unable to connect to the Marine AI routing server. Please ensure FastAPI is running at ${API_BASE_URL}.`,
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Ship className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">AIS Voyage Tracker</h1>
              <p className="text-xs text-slate-400">Powered by mt-ais-toolbox</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
            <span className="text-xs text-slate-300 font-medium">AIS API Link Live</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[450px] lg:h-[550px]">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-blue-400" />
                <span className="font-semibold text-sm">Interactive AIS Map</span>
              </div>
              <div className="flex bg-slate-850 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => {
                    setMapType('route');
                    setMapUrl('/maps/route.html');
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mapType === 'route'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Standard Route
                </button>
                <button
                  onClick={() => {
                    setMapType('massive_route');
                    setMapUrl('/maps/massive_route.html');
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mapType === 'massive_route'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Massive Route (Density)
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 relative">
              <iframe
                src={mapUrl}
                className="w-full h-full border-none"
                title="AIS Marine Map"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">Departure Port</span>
              <span className="text-sm font-semibold text-white mt-1">Port Klang (MY)</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">Destination Port</span>
              <span className="text-sm font-semibold text-white mt-1">Singapore (SG)</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">Tracked Coordinates</span>
              <span className="text-sm font-semibold text-white mt-1">2,415 Points</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">Current Status</span>
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
              <span className="font-semibold text-sm text-slate-200">Marine AI Chatbot</span>
            </div>
            <button
              onClick={() => setMessages(initialMessages)}
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
                className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm whitespace-pre-line leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
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
              onClick={() => setInputValue("What is AIS data?")}
              className="text-xs bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap transition-all"
            >
              AIS Info
            </button>
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
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
