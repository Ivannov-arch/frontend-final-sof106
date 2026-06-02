'use client';

import { useState, useRef, useEffect } from "react";
import { Ship, MapPin, Navigation, Send, Compass, Info, RefreshCw, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

export default function TrackShipPage() {
  const [mapType, setMapType] = useState<'route' | 'massive_route'>('route');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! I am your Marine Traffic AI Assistant. I can help you track voyages, analyze AIS data quality, and visualize routes.',
      timestamp: 'Just now'
    },
    {
      id: '2',
      sender: 'bot',
      text: 'Currently showing the standard route from Port Klang (Malaysia) to Singapore. Use the tabs above the map to switch views.',
      timestamp: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const query = inputValue.toLowerCase();
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response based on keywords
    setTimeout(() => {
      let botResponse = "I'm not sure about that. Try asking about 'vessel status', 'ais data', 'route', or 'density map'.";

      if (query.includes('status') || query.includes('track') || query.includes('kapal')) {
        botResponse = "🚢 **Vessel Status Update:**\n• **Voyage:** Port Klang ➔ Singapore\n• **Status:** Underway Using Engine\n• **Current Speed:** 14.5 knots\n• **Heading:** 135° (SE)\n• **ETA:** June 2, 2026, 04:30 UTC.";
      } else if (query.includes('ais') || query.includes('data') || query.includes('clean')) {
        botResponse = "🛠️ **AIS Processing details (MT-AIS Toolbox):**\n• Erroneous zero coordinates: Filtered ✅\n• Improbable speeds (>92 knots): Filtered ✅\n• Land masking using high-res polygons: Active ✅\n• Downsampling interval: 180,000 ms (3 mins) ✅";
      } else if (query.includes('peta') || query.includes('map') || query.includes('density') || query.includes('route')) {
        botResponse = "🗺️ **Map & Visualization:**\n• You are viewing a Leaflet map.\n• **route.html** shows standard waypoint routing.\n• **massive_route.html** displays high-density vessel clusters along the Malacca Strait. Click the map tabs to toggle.";
      } else if (query.includes('help') || query.includes('bantuan') || query.includes('hello') || query.includes('hai')) {
        botResponse = "Hello! Ask me:\n1. 'Track vessel' to get shipping details.\n2. 'AIS cleaning' to see how the toolbox processes noise.\n3. 'Show map info' for routing parameters.";
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header / Navbar */}
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

      {/* Main Responsive Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Map Container + Stats Dashboard */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Map Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[450px] lg:h-[550px]">
            {/* Map Header with Controls */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-blue-400" />
                <span className="font-semibold text-sm">Interactive AIS Map</span>
              </div>
              <div className="flex bg-slate-850 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setMapType('route')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mapType === 'route' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Standard Route
                </button>
                <button
                  onClick={() => setMapType('massive_route')}
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

            {/* Embed Leaflet Iframe Map */}
            <div className="flex-1 bg-slate-950 relative">
              <iframe
                src={mapType === 'route' ? '/maps/route.html' : '/maps/massive_route.html'}
                className="w-full h-full border-none"
                title="AIS Marine Map"
              />
            </div>
          </div>

          {/* Quick Ship Stats */}
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

        {/* Right Side: Chatbot Panel */}
        <div className="w-full lg:w-[400px] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[550px] lg:h-[635px]">
          {/* Chat Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              <span className="font-semibold text-sm text-slate-200">Marine AI Chatbot</span>
            </div>
            <button 
              onClick={() => setMessages(prev => [prev[0], prev[1]])} 
              className="text-xs text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition-all"
              title="Reset Chat"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Message Area */}
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
            
            {/* Typing Indicator */}
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

          {/* Quick Suggestion Tags */}
          <div className="px-4 py-2 bg-slate-950/20 border-t border-slate-800 flex gap-2 overflow-x-auto scrollbar-none">
            <button 
              onClick={() => setInputValue("Track vessel")}
              className="text-xs bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap transition-all"
            >
              🚢 Track Vessel
            </button>
            <button 
              onClick={() => setInputValue("AIS data cleaning")}
              className="text-xs bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap transition-all"
            >
              🛠️ AIS Cleaning Info
            </button>
            <button 
              onClick={() => setInputValue("Show map info")}
              className="text-xs bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap transition-all"
            >
              🗺️ Map Info
            </button>
          </div>

          {/* Chat Form Input */}
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