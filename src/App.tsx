import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, MicOff, Send, BookOpen, User as UserIcon, Settings, 
  LayoutDashboard, FileText, Activity, LogOut,
  ChevronRight, Volume2, Search, Info, Camera, Trash2,
  Clock, RefreshCw, Plus, CheckCircle2, Phone, Mail, Printer,
  Building2, Smile, Meh, Frown
} from 'lucide-react';
import { Project, Message, Document, Account, User as UserType, Analytics } from './types';
import { generateGroundedAnswer } from './services/aiService';
import { QRCodeCanvas } from 'qrcode.react';

import { GoogleGenAI, Modality, LiveServerMessage, Type, FunctionDeclaration } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const API_BASE = ''; // Force relative paths for Cloud Run environment

// --- Components ---

const SummaryPage = ({ sessionId }: { sessionId: string }) => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("SummaryPage: Fetching summary for session:", sessionId, "using API_BASE:", API_BASE || "(relative)");
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/summary`);
        if (!res.ok) {
          throw new Error("Session not found or expired.");
        }
        const data = await res.json();
        setSummary(data);
      } catch (err: any) {
        console.error("Failed to fetch summary:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSummary();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Session Not Found</h1>
          <p className="text-slate-500">{error || "The session summary you are looking for is no longer available or the link is invalid."}</p>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Contact Support</p>
            <p className="text-slate-600 text-sm">info@lawcommission.gov.kn</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Session Summary</h1>
            <p className="text-slate-500">VoiceIt Assistant Interaction • {new Date(summary.timestamp).toLocaleDateString()}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Volume2 className="w-6 h-6" />
          </div>
        </header>

        <section className="space-y-8 mb-12">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Questions & Answers
          </h2>
          {summary.qa && summary.qa.length > 0 ? (
            summary.qa.map((item: any, i: number) => (
              <div key={i} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-100 transition-all">
                <div className="mb-6">
                  <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-3">Question</p>
                  <p className="text-slate-900 font-bold text-xl md:text-2xl leading-tight">{item.q}</p>
                </div>
        <div className="pl-4 border-l-4 border-emerald-500 bg-emerald-50/30 p-4 rounded-r-2xl">
          <p className="text-emerald-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">VoiceIt Answer</p>
          <p className="text-slate-700 leading-relaxed text-lg">{item.a}</p>
          {item.sources && item.sources.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sources</p>
              <div className="flex flex-wrap gap-2">
                {item.sources.map((src: any, si: number) => (
                  <div key={si} className="group relative">
                    <div className="text-[10px] bg-white px-2 py-1.5 rounded-lg border border-emerald-100 text-emerald-700 flex items-center gap-1.5 shadow-sm">
                      <BookOpen className="w-3 h-3" />
                      <span className="font-medium">{src.documentTitle}</span>
                      <span className="opacity-40">•</span>
                      <span>p. {src.pageNumber}</span>
                    </div>
                    {src.excerpt && (
                      <div className="mt-2 p-4 bg-slate-50 border-l-4 border-indigo-200 rounded-r-2xl text-xs text-slate-600 italic leading-relaxed shadow-sm">
                        <p className="font-bold text-[9px] uppercase tracking-widest text-indigo-400 mb-1 not-italic">Excerpt</p>
                        "{src.excerpt}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 italic">No questions were recorded in this session.</p>
          )}
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Source Documents
          </h2>
          {summary.sources && summary.sources.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {/* Deduplicate sources by title just in case */}
              {Array.from(new Map(summary.sources.map((item: any) => [item.title, item])).values()).map((doc: any, i: number) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-indigo-300 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">{doc.title}</span>
                      <span className="text-xs text-slate-400 uppercase tracking-wider">{doc.page_count} Pages</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 italic">No source documents were referenced or available for download.</p>
          )}
        </section>

        <footer className="pt-12 border-t border-slate-200 text-center pb-12">
          <div className="inline-flex items-center gap-2 text-slate-900 font-bold text-lg mb-6">
            <Volume2 className="w-5 h-5 text-indigo-600" />
            VoiceIt Assistant
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Phone className="w-3 h-3" />
                869-467-1623
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Mail className="w-3 h-3" />
                info@lawcommission.gov.kn
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Cherami Ltd. · 868-222-0011</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

const SummaryPopup = ({ sessionId, onClose, onPrint }: { sessionId: string, onClose: () => void, onPrint?: () => void }) => {
  const PUBLIC_BASE_URL = import.meta.env.VITE_PUBLIC_BASE_URL || "https://voiceit.caribdesigns.com";
  const summaryUrl = `${PUBLIC_BASE_URL}/session/${sessionId}`;

  const handlePrint = () => {
    if (onPrint) onPrint();
    // Ensure the print area is ready and then trigger print
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      {/* Printable Area (Hidden in UI, visible in print) */}
      <div id="print-area" className="hidden">
        <div style={{ textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <h1 style={{ fontSize: '18px', margin: '0' }}>VoiceIt Session</h1>
          <p style={{ fontSize: '10px', color: '#666', margin: '2px 0' }}>Thank you for visiting</p>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>Scan for Session Summary</p>
          <QRCodeCanvas value={summaryUrl} size={150} level="H" includeMargin={false} />
          <p style={{ fontSize: '9px', color: '#888', marginTop: '10px', textAlign: 'center' }}>Scan this code to view your questions, answers, and download source documents.</p>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', fontSize: '8px', color: '#444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Tel: 869-467-1623</span>
            <span>info@lawcommission.gov.kn</span>
          </div>
          <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#000' }}>
            Powered by Cherami Ltd. - 868-222-0011
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
            display: flex !important;
          }
          #print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 4in !important;
            height: 4in !important;
            padding: 0.2in !important;
            background: white !important;
            color: black !important;
            font-family: sans-serif !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            z-index: 9999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] p-8 md:p-12 max-w-2xl w-full text-center shadow-2xl relative overflow-hidden no-print"
      >
        {/* UI Content */}
        <div className="no-print">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400" />
          
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Thank You!</h2>
          <p className="text-slate-500 text-lg mb-8">Thank you for using the VoiceIt application.</p>
          
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-xl">
              <QRCodeCanvas value={summaryUrl} size={180} level="H" includeMargin={true} />
            </div>
            <p className="mt-4 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Scan to save your session summary</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 text-left">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contact Information</p>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-300" />
                <span className="font-medium">869-467-1623</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-300" />
                <span className="font-medium text-sm">info@lawcommission.gov.kn</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Powered By</p>
              <div className="flex items-center gap-2 text-slate-900">
                <span className="font-bold">Cherami Ltd.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-300" />
                <span className="font-medium">868-222-0011</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handlePrint}
              className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Print Receipt
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
            >
              Close & Finish
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const VoiceOrb = ({ isSpeaking, isThinking, onClick }: { isSpeaking: boolean, isThinking: boolean, onClick?: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
    >
      {/* Outer Glow */}
      <div className={`absolute inset-0 rounded-full bg-blue-500/20 blur-[60px] md:blur-[80px] transition-all duration-1000 ${isSpeaking ? 'scale-150 opacity-100' : 'scale-100 opacity-40'}`} />
      
      {/* Core Orb */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.1, 1] : 1,
          rotate: 360
        }}
        transition={{
          scale: { repeat: Infinity, duration: 2 },
          rotate: { repeat: Infinity, duration: 20, ease: "linear" }
        }}
        className={`relative w-36 h-36 md:w-48 md:h-48 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 shadow-[0_0_30px_rgba(59,130,246,0.5)] md:shadow-[0_0_50px_rgba(59,130,246,0.5)] flex items-center justify-center overflow-hidden`}
      >
        {/* Swirling inner details */}
        <div className="absolute inset-0 opacity-30 animate-orb-rotate">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_white_0%,_transparent_70%)] blur-xl" />
        </div>
        
        {/* Pulse Ring */}
        {isSpeaking && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 border-2 border-white/30 rounded-full"
          />
        )}
      </motion.div>

      {/* Thinking Indicator */}
      {isThinking && (
        <div className="absolute -bottom-8 flex gap-2">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
      )}
    </div>
  );
};

const KioskMode = ({ project, sessionTimeout, onExit }: { project: Project, sessionTimeout: number, onExit: () => void }) => {
  const [isPresent, setIsPresent] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [session, setSession] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcription, setTranscription] = useState('');
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  
  const isPresentRef = useRef(false);
  const connectionStatusRef = useRef<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const isConnectingRef = useRef(false);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueue = useRef<AudioBuffer[]>([]);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const nextStartTime = useRef(0);
  const isPlaying = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());
  const hasPromptedRef = useRef<boolean>(false);
  const lastSeenTimeRef = useRef<number | null>(null);
  const currentTurnRef = useRef<{ userText: string, modelText: string, sources: any[] }>({ userText: '', modelText: '', sources: [] });
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Sync refs with state for use in callbacks
  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  useEffect(() => {
    isPresentRef.current = isPresent;
    if (!isPresent) {
      // Reset state when user leaves
      setTranscription('');
      setIsListening(false);
      setIsThinking(false);
      setIsSpeaking(false);
      hasPromptedRef.current = false;
    }
  }, [isPresent]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/projects/${project.id}/documents`);
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
        }
      } catch (e) {
        console.warn("Failed to fetch documents from backend.");
      }
    };
    fetchDocs();
  }, [project.id]);

  useEffect(() => {
    let timer: any;
    const initCamera = async () => {
      try {
        if (mediaStreamRef.current) return;
        
        console.log("Initializing unified media stream...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        mediaStreamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn("Video play failed:", e));
        }
        
        // Auto-start session after a short delay to ensure camera is ready
        timer = setTimeout(() => { 
          if (!isPresentRef.current && connectionStatusRef.current === 'idle') {
            console.log("Initial presence detected: starting session.");
            startSession(); 
          }
        }, 500);
      } catch (err) {
        console.warn("Media access denied or unavailable:", err);
        setError("Camera/Microphone access is required for Kiosk mode.");
      }
    };
    initCamera();
    return () => {
      if (timer) clearTimeout(timer);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [project.id]);

  // Handle session lifecycle based on isPresent state
  useEffect(() => {
    if (isPresent && isVoiceMode) {
      // If we are present and in voice mode, ensure session is connected
      if (connectionStatus === 'idle' || connectionStatus === 'error' || (connectionStatus === 'connected' && !liveSessionRef.current)) {
        console.log("Session lifecycle: connecting live session");
        
        const now = Date.now();
        const timeSinceLastSeen = lastSeenTimeRef.current ? (now - lastSeenTimeRef.current) : null;
        const isReturn = timeSinceLastSeen !== null && timeSinceLastSeen < (sessionTimeout * 1000);
        
        connectLive(documents, isReturn);
      }
    } else if (isPresent && !isVoiceMode) {
      // If we are present but in text mode, close live session if it exists
      if (liveSessionRef.current) {
        console.log("Session lifecycle: closing live session for text mode");
        liveSessionRef.current.close();
        liveSessionRef.current = null;
      }
      if (connectionStatus !== 'connected') {
        setConnectionStatus('connected');
      }
    } else if (!isPresent) {
      // If not present, close everything
      if (liveSessionRef.current) {
        console.log("Session lifecycle: closing live session (no presence)");
        liveSessionRef.current.close();
        liveSessionRef.current = null;
      }
      setConnectionStatus('idle');
      if (isPresentRef.current) {
        lastSeenTimeRef.current = Date.now();
      }
    }
  }, [isPresent, isVoiceMode, connectionStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("KioskMode unmounting: performing cleanup");
      if (liveSessionRef.current) {
        try { liveSessionRef.current.close(); } catch (e) {}
        liveSessionRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      stopAudioPlayback();
    };
  }, []);

  // Inactivity Timeout Logic
  useEffect(() => {
    if (!isPresent) {
      setRemainingSeconds(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;
      const totalTimeout = sessionTimeout * 1000;
      const remaining = Math.max(0, Math.ceil((totalTimeout - idleTime) / 1000));
      
      setRemainingSeconds(remaining);

      // Inactivity timeout (prompt)
      if (idleTime > (sessionTimeout - 30) * 1000 && !hasPromptedRef.current && sessionTimeout > 30 && !showSummary) {
        if (liveSessionRef.current) {
          // Use a more natural prompt via text input to the live session
          try {
            liveSessionRef.current.sendRealtimeInput({
              media: { data: btoa("I haven't heard from you in a while. Do you need any more assistance, or should I close this session?"), mimeType: 'text/plain' }
            });
            hasPromptedRef.current = true;
          } catch (e) {
            console.warn("Failed to send inactivity prompt:", e);
          }
        }
      } 
      // Timeout after prompt (or immediately if timeout is reached)
      else if (idleTime > totalTimeout && !showSummary) {
        console.log("Session timed out due to inactivity - showing summary");
        setShowSummary(true);
        if (liveSessionRef.current) {
          liveSessionRef.current.close();
          liveSessionRef.current = null;
        }
      }
      // If summary is showing, have a secondary timeout to reset completely if no one interacts
      else if (showSummary && idleTime > totalTimeout + 60000) {
        console.log("Summary popup timed out - resetting kiosk");
        handleReset();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPresent, sessionTimeout]);

  // Presence Detection / Auto-start Loop
  useEffect(() => {
    if (isPresent) return;

    const interval = setInterval(() => {
      // If we are idle and not connecting, and it's been a while since we last saw someone
      // or if we've never seen anyone, try to "detect" presence.
      // In a real app, this would use a face detection API.
      if (connectionStatusRef.current === 'idle' && !isConnectingRef.current) {
        const now = Date.now();
        const timeSinceLastSeen = lastSeenTimeRef.current ? (now - lastSeenTimeRef.current) : Infinity;
        
        // If they've been gone for at least 5 seconds, look for a "new" presence
        if (timeSinceLastSeen > 5000) {
          console.log("Looking for new presence...");
          // For this demo, we'll assume someone is detected if the camera is active
          if (mediaStreamRef.current?.active) {
            startSession();
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPresent]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Global interaction listener to reset inactivity timer
  useEffect(() => {
    const handleInteraction = () => {
      if (isPresentRef.current) {
        lastActivityRef.current = Date.now();
        hasPromptedRef.current = false;
      }
    };
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const startSession = async () => {
    if (isPresentRef.current || connectionStatusRef.current === 'connecting') {
      console.log("Session already active or connecting, ignoring start request.");
      return;
    }
    
    try {
      console.log("Starting session flow...");
      setError(null);
      setConnectionStatus('connecting');
      
      const now = Date.now();
      const timeSinceLastSeen = lastSeenTimeRef.current ? (now - lastSeenTimeRef.current) : null;
      // It's a return only if they were seen recently AND within the timeout period
      const isReturn = timeSinceLastSeen !== null && timeSinceLastSeen < (sessionTimeout * 1000); 
      
      console.log(`Starting session. Time since last seen: ${timeSinceLastSeen}ms. Is return: ${isReturn}`);
      
      // Fetch latest documents right before starting session to ensure AI has latest knowledge
      let currentDocs = documents;
      try {
        const res = await fetch(`${API_BASE}/api/projects/${project.id}/documents`);
        if (res.ok) {
          currentDocs = await res.json();
          setDocuments(currentDocs);
          console.log(`Fetched ${currentDocs.length} documents for session.`);
        }
      } catch (e) {
        console.warn("Failed to fetch latest documents, using cached ones.");
      }

      // Use existing media stream
      if (!mediaStreamRef.current) {
        console.log("No media stream available, attempting to initialize...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      }

      // Resume audio context immediately on user interaction
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Try to create a session on the backend, but don't block if it fails
      try {
        const res = await fetch(`${API_BASE}/api/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: project.id })
        });
        if (res.ok) {
          const data = await res.json();
          setSession(data.id);
          sessionRef.current = data.id;
        } else {
          const id = 'local-' + Date.now();
          setSession(id);
          sessionRef.current = id;
        }
      } catch (e) {
        console.warn("Backend session creation failed, using local session.");
        const id = 'local-' + Date.now();
        setSession(id);
        sessionRef.current = id;
      }

      isPresentRef.current = true;
      setIsPresent(true);
      lastActivityRef.current = Date.now();
      
      if (isVoiceMode) {
        // Pass the freshly fetched docs to connectLive
        connectLive(currentDocs, isReturn);
      } else {
        setConnectionStatus('connected');
        console.log("Setting initial greeting for text mode.");
        const content = isReturn 
          ? "Welcome back. How can I help?"
          : `Welcome. I am the assistant for ${project.title}. ${project.description}. I’m ready to help. What would you like to do first?`;
          
        const greeting: Message = {
          id: 'greet-' + Date.now(),
          role: 'model',
          content,
          created_at: new Date().toISOString()
        };
        setMessages([greeting]);
      }
    } catch (err) {
      console.error("Error in startSession:", err);
      setError("Failed to start session. Please try again.");
      setConnectionStatus('error');
      isPresentRef.current = false;
      setIsPresent(false);
    }
  };

  const connectLive = async (currentDocs?: Document[], isReturn: boolean = false) => {
    if (isConnectingRef.current || connectionStatusRef.current === 'connected') {
      console.log("Already connecting or connected to Gemini Live, skipping.");
      return;
    }
    
    const docsToUse = currentDocs || documents;
    console.log(`Connecting to Gemini Live with ${docsToUse.length} documents. Is return: ${isReturn}`);
    
    try {
      console.log("Connecting to Gemini Live...");
      isConnectingRef.current = true;
      setConnectionStatus('connecting');
      
      // Initialize AI instance right before connection as per guidelines
      const currentAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const stream = mediaStreamRef.current;
      if (!stream) throw new Error("Media stream not initialized");

      if (videoRef.current && videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Video play failed:", e));
      }
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      const contextText = docsToUse.map(d => `SOURCE DOCUMENT: ${d.title}\nCONTENT:\n${d.content}`).join("\n\n---\n\n");
      
      console.log("Context text length:", contextText.length);
      if (contextText.length > 0) {
        console.log("Context text snippet:", contextText.substring(0, 1000) + "...");
      } else {
        console.warn("Context text is EMPTY! Check if documents have content.");
      }
      
      // Log individual document content lengths
      docsToUse.forEach(d => {
        console.log(`Document in context: ${d.title}, Content length: ${d.content?.length || 0}`);
      });

      const showSourceFunctionDeclaration: FunctionDeclaration = {
        name: "showSource",
        parameters: {
          type: Type.OBJECT,
          description: "Display the source document details to the user. Call this when the user says 'yes' to seeing sources or explicitly asks to open a source.",
          properties: {
            documentTitle: {
              type: Type.STRING,
              description: "The title of the document to show.",
            },
            pageNumber: {
              type: Type.NUMBER,
              description: "The page number within the document.",
            },
            excerpt: {
              type: Type.STRING,
              description: "The specific excerpt from the document.",
            },
          },
          required: ["documentTitle", "pageNumber", "excerpt"],
        },
      };

      const closeSourceFunctionDeclaration: FunctionDeclaration = {
        name: "closeSource",
        parameters: {
          type: Type.OBJECT,
          description: "Close the currently displayed source document. Call this when the user says 'close source' or 'hide source'.",
          properties: {},
        },
      };

      const showSummaryFunctionDeclaration: FunctionDeclaration = {
        name: "showSummary",
        parameters: {
          type: Type.OBJECT,
          description: "Display the session summary and QR code to the user. Call this when the user indicates they are finished with the session (e.g., 'no', 'I'm done', 'goodbye') after you've asked if there's anything else you can help with.",
          properties: {},
        },
      };

      const systemInstruction = `
        You are a real-time kiosk assistant for ${project.title}.
        
        CONTEXT:
        ${project.description}
        
        KNOWLEDGE BASE:
        ${contextText}
        
        GREETING INSTRUCTION:
        A user has just entered the interaction zone. 
        This is a ${isReturn ? 'RETURNING' : 'NEW'} user.
        
        ${isReturn 
          ? "Greet them warmly with a 'Welcome back!' and ask if they have more questions about " + project.title + "."
          : "Introduce yourself as the " + project.title + " assistant. Welcome them, briefly mention what the project is about, and invite them to ask questions."
        }
        
        Keep the initial greeting concise but very professional and welcoming.
        
        GENERAL RULES:
        
        1. When you receive a "NEW_PRESENCE" signal, immediately respond with a full introduction.
        2. When you receive a "RETURN_PRESENCE" signal, respond with a shorter welcome back message.
        3. The full introduction must include:
           - A warm welcome.
           - Your identity as the assistant for "${project.title}".
           - A brief mention of the project: "${project.description}".
           - An invitation to ask questions.
        4. Do not wait for the visitor to say hello first.
        5. Do not ask for permission to begin.
        6. Keep the greeting natural, polished, and professional.
        
        FULL GREETING TEMPLATE:
        "Welcome! I am the assistant for ${project.title}. ${project.description}. I'm here to help you with any questions you might have. What would you like to know?"
        
        RETURN GREETING TEMPLATE:
        "Welcome back! How can I continue to help you today?"
        
        ABOUT THIS PROJECT:
        ${project.description}
        
        KNOWLEDGE BASE (CONTEXT DOCUMENTS):
        ${docsToUse.length > 0 ? contextText : "No documents uploaded yet."}
        
        YOUR MISSION:
        - Answer questions strictly based on the provided KNOWLEDGE BASE.
        - ${project.instructions}
        - If the answer is not in the context, politely say you don't have that information.
        - Be friendly, calm, confident, and professional.
        - IMPORTANT: After every answer derived from the knowledge base, you MUST ask the user if they want to see the source.
        - If they say "yes", "show me", "open source", or specify a source, call the 'showSource' tool with the relevant details.
        - If they say "close source", "hide source", or "stop showing", call the 'closeSource' tool.
        - You can handle multiple sources. If there are multiple, ask which one they want to see or offer to show them all.
        - READ SOURCE FEATURE: When a source is shown on screen via 'showSource', you MUST ask the user if they would like you to read out what is shown. If they say yes, read the excerpt clearly and naturally.
        
        SESSION END INSTRUCTION:
        When all questions are asked and answers are given and sources are shown and closed, ask the user: "Is there anything else I can help you with today?".
        If the user indicates they are finished (e.g., "no", "I'm done", "goodbye"), call the 'showSummary' tool immediately.
      `;

      const sessionPromise = currentAi.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ functionDeclarations: [showSourceFunctionDeclaration, closeSourceFunctionDeclaration, showSummaryFunctionDeclaration] }],
        },
        callbacks: {
          onopen: () => {
            console.log("Live session opened successfully");
            setConnectionStatus('connected');
            setIsListening(true);
            lastActivityRef.current = Date.now();
            hasPromptedRef.current = true; // Mark as prompted since AI will greet via system instruction
            
            // Reset current turn tracking
            currentTurnRef.current = { userText: '', modelText: '', sources: [] };
            
            // Trigger proactive greeting via text signal
            const signal = isReturn ? 'RETURN_PRESENCE' : 'NEW_PRESENCE';
            const promptText = isReturn 
              ? `[SIGNAL: ${signal}] The user has returned. Please greet them back warmly.` 
              : `[SIGNAL: ${signal}] A new user has arrived. Please introduce yourself and welcome them as the ${project.title} assistant.`;
              
            sessionPromise.then(s => {
              if (s && isPresentRef.current) {
                // Use a smaller timeout to ensure the session is ready but greeting is fast
                setTimeout(() => {
                  if (s && isPresentRef.current) {
                    console.log(`Sending proactive greeting prompt (${signal}) to AI...`);
                    s.sendClientContent({
                      turns: [{ role: 'user', parts: [{ text: promptText + " Respond immediately." }] }],
                      turnComplete: true
                    });
                  }
                }, 100);
              }
            });
            
            sessionPromise.then(s => {
              console.log("Gemini Live session resolved:", s);
              if (s && isPresentRef.current) {
                liveSessionRef.current = s;
                
                // Start video streaming loop
                if (videoRef.current) {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const video = videoRef.current;
                  
                  const sendFrame = () => {
                    if (!isPresentRef.current || !liveSessionRef.current) return;
                    
                    if (video.videoWidth > 0 && video.videoHeight > 0) {
                      // Resize for performance and API limits
                      const targetWidth = 480; // Slightly higher resolution for better detection
                      const targetHeight = (video.videoHeight / video.videoWidth) * targetWidth;
                      canvas.width = targetWidth;
                      canvas.height = targetHeight;
                      
                      ctx?.drawImage(video, 0, 0, targetWidth, targetHeight);
                      const base64Frame = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
                      
                      try {
                        // Sending video frame for context
                        liveSessionRef.current.sendRealtimeInput({
                          media: { data: base64Frame, mimeType: 'image/jpeg' }
                        });
                      } catch (e) {
                        console.error("Failed to send video frame:", e);
                      }
                    }
                    // Send frame every 1 second for near-instant detection
                    setTimeout(sendFrame, 1000);
                  };
                  sendFrame();
                }
              }
            });
            
            const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            source.connect(processor);
            processor.connect(audioContextRef.current!.destination);
            
            processor.onaudioprocess = (e) => {
              if (!isPresentRef.current || connectionStatusRef.current !== 'connected') return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              
              const bytes = new Uint8Array(pcmData.buffer);
              let binary = '';
              const len = bytes.byteLength;
              for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64Data = btoa(binary);
              
              sessionPromise.then(s => {
                if (s && isPresentRef.current && connectionStatusRef.current === 'connected') {
                  try {
                    s.sendRealtimeInput({
                      media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                    });
                  } catch (e) {
                    console.error("Failed to send audio input:", e);
                  }
                }
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            try {
              if (!isPresentRef.current) return;
              console.log("Received message from Gemini:", message);
              
              if (message.serverContent?.modelTurn?.parts) {
                for (const part of message.serverContent.modelTurn.parts) {
                  if (part.inlineData) {
                    playAudioChunk(part.inlineData.data);
                  }
                }
              }
              
              if (message.serverContent?.interrupted) {
                stopAudioPlayback();
              }

              if (message.toolCall) {
                for (const call of message.toolCall.functionCalls) {
                  if (call.name === 'showSource') {
                    const args = call.args as any;
                    const newSource = {
                      documentTitle: args.documentTitle,
                      pageNumber: args.pageNumber,
                      excerpt: args.excerpt
                    };
                    setSelectedSource({
                      id: 'source-' + Date.now(),
                      project_id: project.id,
                      title: args.documentTitle,
                      content: args.excerpt,
                      page_count: 1,
                      ...newSource
                    });
                    
                    currentTurnRef.current.sources.push(newSource);
                    
                    // Add source to the current model message
                    setMessages(prev => {
                      const lastMsg = prev[prev.length - 1];
                      if (lastMsg?.role === 'model') {
                        const existingSources = lastMsg.sources || [];
                        // Avoid duplicates
                        if (!existingSources.some(s => s.documentTitle === newSource.documentTitle && s.pageNumber === newSource.pageNumber)) {
                          return [...prev.slice(0, -1), { ...lastMsg, sources: [...existingSources, newSource] }];
                        }
                      }
                      return prev;
                    });

                    // Send response back to model
                    sessionPromise.then(s => {
                      if (s) {
                        s.sendToolResponse({
                          functionResponses: [{
                            name: 'showSource',
                            id: call.id,
                            response: { success: true }
                          }]
                        });
                      }
                    });
                  } else if (call.name === 'closeSource') {
                    setSelectedSource(null);
                    sessionPromise.then(s => {
                      if (s) {
                        s.sendToolResponse({
                          functionResponses: [{
                            name: 'closeSource',
                            id: call.id,
                            response: { success: true }
                          }]
                        });
                      }
                    });
                  } else if (call.name === 'showSummary') {
                    setShowSummary(true);
                    sessionPromise.then(s => {
                      if (s) {
                        s.sendToolResponse({
                          functionResponses: [{
                            name: 'showSummary',
                            id: call.id,
                            response: { success: true }
                          }]
                        });
                      }
                    });
                  }
                }
              }

              if (message.serverContent?.turnComplete) {
                setTranscription('');
                
                // Save the turn to backend if we have content
                const currentSession = sessionRef.current;
                if (currentSession && (currentTurnRef.current.userText || currentTurnRef.current.modelText)) {
                  const saveTurn = async () => {
                    try {
                      // Save user message
                      if (currentTurnRef.current.userText) {
                        await fetch(`${API_BASE}/api/sessions/${currentSession}/messages`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            role: 'user', 
                            content: currentTurnRef.current.userText 
                          })
                        });
                      }
                      
                      // Save model message with sources
                      if (currentTurnRef.current.modelText) {
                        await fetch(`${API_BASE}/api/sessions/${currentSession}/messages`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            role: 'model', 
                            content: currentTurnRef.current.modelText,
                            sources: currentTurnRef.current.sources
                          })
                        });
                      }
                      
                      // Reset for next turn
                      currentTurnRef.current = { userText: '', modelText: '', sources: [] };
                    } catch (e) {
                      console.warn("Failed to save turn to backend:", e);
                    }
                  };
                  saveTurn();
                }

                setMessages(prev => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg?.id === 'live-current') {
                    return [...prev.slice(0, -1), { ...lastMsg, id: Date.now().toString() }];
                  }
                  return prev;
                });
                // Only set isSpeaking to false if there are no more audio chunks queued
                if (activeSourcesRef.current.length === 0) {
                  setIsSpeaking(false);
                }
              }

              // User transcription
              if (message.serverContent?.inputTranscription?.text) {
                const text = message.serverContent.inputTranscription.text;
                setTranscription(text);
                currentTurnRef.current.userText = text;
                lastActivityRef.current = Date.now();
                hasPromptedRef.current = false;

                // Handle voice commands when summary is showing
                if (showSummary) {
                  if (text.includes('print')) {
                    window.print();
                  } else if (text.includes('close') || text.includes('done') || text.includes('finish')) {
                    handleReset();
                  }
                }
              }

              // Model transcription
              if (message.serverContent?.modelTurn?.parts) {
                lastActivityRef.current = Date.now();
                hasPromptedRef.current = false;
                setIsSpeaking(true); // Ensure text is shown when model starts responding
                const textParts = message.serverContent.modelTurn.parts.filter(p => p.text).map(p => p.text).join("");
                if (textParts) {
                  currentTurnRef.current.modelText += textParts;
                  setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg?.role === 'model' && lastMsg.id === 'live-current') {
                      return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + textParts }];
                    }
                    return [...prev, {
                      id: 'live-current',
                      role: 'model',
                      content: textParts,
                      created_at: new Date().toISOString()
                    }];
                  });
                }
              }
            } catch (e) {
              console.error("Error processing message:", e);
            }
          },
          onclose: () => {
            console.log("Live session closed by server");
            if (isPresentRef.current) {
              console.warn("Unexpected session closure while user is present. Resetting state.");
              setConnectionStatus('idle');
              isPresentRef.current = false;
              setIsPresent(false);
            }
          },
          onerror: (err) => {
            console.error("Live session error:", err);
            if (isPresentRef.current) {
              setError("Connection error. Please try again.");
              setConnectionStatus('error');
              if (err.message?.includes("Requested entity was not found")) {
                (window as any).aistudio?.openSelectKey();
              }
            }
          },
        }
      });

      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to connect live:", err);
      setConnectionStatus('error');
      setError("Failed to connect to AI voice service.");
    } finally {
      isConnectingRef.current = false;
    }
  };

  const playAudioChunk = (base64Data: string) => {
    if (!audioContextRef.current) return;
    setIsSpeaking(true);
    
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      
      const pcmData = new Int16Array(bytes.buffer);
      const floatData = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 32768.0;

      // Gemini Live output is 24000Hz
      const buffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
      buffer.getChannelData(0).set(floatData);
      
      const currentTime = audioContextRef.current.currentTime;
      
      // If we are starting fresh or fell behind, reset nextStartTime
      if (nextStartTime.current < currentTime) {
        nextStartTime.current = currentTime + 0.05; // 50ms lookahead buffer
      }
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      
      source.start(nextStartTime.current);
      activeSourcesRef.current.push(source);
      nextStartTime.current += buffer.duration;
      
      // Keep track of the source so we can stop it on interruption
      // We store it in a way that we can stop multiple if they are queued
      const sourceNode = source;
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== sourceNode);
        if (currentSourceRef.current === sourceNode) {
          currentSourceRef.current = null;
        }
        // If this was the last source and we've already received turnComplete, set isSpeaking to false
        if (activeSourcesRef.current.length === 0) {
          setIsSpeaking(false);
        }
      };
      currentSourceRef.current = source;
    } catch (e) {
      console.error("Error playing audio chunk:", e);
    }
  };

  const stopAudioPlayback = () => {
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    currentSourceRef.current = null;
    // Note: nextStartTime.current = 0 will be handled in playAudioChunk
    nextStartTime.current = 0;
    setIsSpeaking(false);
  };

  const handleExit = () => {
    console.log("Exiting Kiosk Mode...");
    setShowSummary(false);
    stopAudioPlayback();
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    isPresentRef.current = false;
    setIsPresent(false);
    onExit();
  };

  const handleReset = () => {
    console.log("Full UI Reset triggered.");
    setShowSummary(false);
    stopAudioPlayback();
    if (liveSessionRef.current) {
      try { liveSessionRef.current.close(); } catch (e) {}
      liveSessionRef.current = null;
    }
    
    // Comprehensive state reset
    setIsPresent(false);
    isPresentRef.current = false;
    setMessages([]);
    setTranscription('');
    setInput('');
    setIsListening(false);
    setIsThinking(false);
    setIsSpeaking(false);
    setSelectedSource(null);
    setConnectionStatus('idle');
    setRemainingSeconds(null);
    lastSeenTimeRef.current = Date.now();
    hasPromptedRef.current = false;
    currentTurnRef.current = { userText: '', modelText: '', sources: [] };
    setSession(null);
    sessionRef.current = null;
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || !session) return;
    
    lastActivityRef.current = Date.now();
    hasPromptedRef.current = false;

    if (isVoiceMode && liveSessionRef.current) {
      liveSessionRef.current.sendRealtimeInput({
        media: { data: btoa(text), mimeType: 'text/plain' }
      });
      setTranscription(text);
    } else {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);
      setIsThinking(true);
      
      try {
        // Save user message to backend
        fetch(`${API_BASE}/api/sessions/${session}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'user', content: text })
        }).catch(e => console.warn("Failed to save user message:", e));

        const history = messages.map(m => ({ role: m.role, content: m.content }));
        const result = await generateGroundedAnswer(text, project, documents, history);
        
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: result.answer,
          sources: result.sources,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMsg]);

        // Save AI message to backend
        fetch(`${API_BASE}/api/sessions/${session}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            role: 'model', 
            content: result.answer, 
            sources: result.sources 
          })
        }).catch(e => console.warn("Failed to save AI message:", e));

        if (result.showSummary) {
          setShowSummary(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsThinking(false);
        setInput('');
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!isPresent ? (
        <motion.div 
          key="waiting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-screen w-full bg-black flex flex-col items-center justify-center text-white p-6 md:p-8 overflow-hidden relative"
        >
          <video ref={videoRef} autoPlay muted className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="z-10 text-center w-full max-w-md">
            <div className="relative mb-8 md:mb-12 flex justify-center">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-600/20 rounded-full blur-2xl absolute inset-0 animate-pulse" />
              <div className="w-24 h-24 md:w-32 md:h-32 border-2 border-white/10 rounded-full flex items-center justify-center relative backdrop-blur-sm">
                <Camera className="w-10 h-10 md:w-12 md:h-12 text-white/40" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tighter mb-4">VoiceIt</h1>
            <div className="h-20 flex flex-col items-center justify-center">
              {connectionStatus === 'idle' && (
                <p className="text-lg md:text-xl text-white/60 font-light max-w-xs md:max-w-md mx-auto leading-tight">Waiting for presence...</p>
              )}
              {connectionStatus === 'connecting' && (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-lg md:text-xl text-blue-400 font-light animate-pulse">Establishing secure connection...</p>
                  <div className="flex gap-1">
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  </div>
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-lg md:text-xl text-red-400 font-light">Connection failed</p>
                  <p className="text-xs md:text-sm text-white/40">Please check your API key or network.</p>
                </div>
              )}
            </div>
            <button 
              onClick={startSession} 
              disabled={connectionStatus === 'connecting'}
              className={`mt-8 w-full sm:w-auto px-8 py-4 md:py-3 rounded-full text-sm font-medium transition-all ${
                connectionStatus === 'connecting' 
                  ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                  : 'bg-white/10 hover:bg-white/20 border border-white/10 text-white active:scale-95'
              }`}
            >
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Enter Interaction Zone'}
            </button>
          </motion.div>
        </motion.div>
      ) : isVoiceMode ? (
        <motion.div 
          key="voice"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden relative"
        >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[1000px] h-[600px] md:h-[1000px] bg-blue-600/5 rounded-full blur-[100px] md:blur-[160px]" />
        </div>
        <div className="absolute top-6 left-6 md:top-12 md:left-12 flex items-center gap-3 md:gap-4 z-20">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl flex items-center justify-center">
            <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-medium tracking-tight">VoiceIt</h2>
            <div className="flex items-center gap-2">
              <p className="text-[8px] md:text-xs text-white/40 uppercase tracking-widest">Active</p>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
              <p className="text-[8px] md:text-[10px] text-blue-400/60 uppercase tracking-widest font-bold">
                {documents.length} Docs
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-6 right-6 md:top-12 md:right-12 flex flex-col sm:flex-row items-end sm:items-center gap-2 md:gap-4 z-20">
          {isSpeaking && (
            <button 
              onClick={stopAudioPlayback}
              className="px-4 md:px-6 py-2 md:py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-full text-[10px] md:text-sm font-medium text-red-400 transition-all flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Interrupt
            </button>
          )}
          <button 
            onClick={handleExit}
            className="px-4 md:px-6 py-2 md:py-3 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-full text-[10px] md:text-sm font-medium text-white/60 hover:text-red-400 transition-all"
          >
            Exit
          </button>
          <button onClick={() => { setIsVoiceMode(false); setIsListening(false); setIsSpeaking(false); setIsThinking(false); }} className="px-4 md:px-6 py-2 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] md:text-sm font-medium transition-all">Text Mode</button>
        </div>
        <div className="z-10 flex flex-col items-center gap-8 md:gap-12 w-full max-w-2xl">
          <div className="relative">
            <VoiceOrb isSpeaking={isSpeaking} isThinking={isThinking} onClick={isSpeaking ? stopAudioPlayback : undefined} />
            {/* Hidden video element for frame capture */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
            />
          </div>
          <div className="text-center w-full min-h-[100px] md:min-h-[120px] flex flex-col justify-center px-4">
            <AnimatePresence>
              {isSpeaking && (
                <motion.div key="speaking" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <p className="text-xl md:text-3xl font-light leading-snug">
                    {messages[messages.length - 1]?.content}
                  </p>
                  {messages[messages.length - 1]?.sources && messages[messages.length - 1]?.sources!.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {messages[messages.length - 1]?.sources!.map((src, i) => (
                        <button 
                          key={i} 
                          onClick={() => setSelectedSource(src)} 
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] md:text-xs transition-all hover:scale-105 active:scale-95"
                        >
                          <BookOpen className="w-3 h-3 text-blue-400" />
                          {src.documentTitle}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              {isThinking && !isSpeaking && (
                <motion.p key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg md:text-2xl font-light text-white/40 italic">Consulting knowledge base...</motion.p>
              )}
              {!isSpeaking && !isThinking && isListening && (
                <motion.div key="listening-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <p className="text-lg md:text-2xl font-light text-white/60">I'm listening...</p>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div key={i} animate={{ height: [8, 24, 8] }} transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }} className="w-1 bg-blue-500 rounded-full" />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="absolute bottom-8 md:bottom-12 left-0 right-0 flex justify-center gap-4 md:gap-8 text-white/30">
          <div className="flex items-center gap-2 text-[8px] md:text-[10px] uppercase tracking-[0.2em]"><Mic className="w-3 h-3 md:w-4 md:h-4" /> Mic Active</div>
          <div className="flex items-center gap-2 text-[8px] md:text-[10px] uppercase tracking-[0.2em]"><Activity className="w-3 h-3 md:w-4 md:h-4" /> Sync</div>
        </div>
        
        <input type="text" className="opacity-0 absolute" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { handleSend((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} />
        
        <AnimatePresence>
          {selectedSource && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md"
            >
              <div className="bg-[#0a0a0a] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <h3 className="font-medium truncate max-w-[200px] md:max-w-md">{selectedSource.documentTitle}</h3>
                  </div>
                  <button onClick={() => setSelectedSource(null)} className="p-2 text-white/40 hover:text-white transition-colors">
                    Close
                  </button>
                </div>
                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                  <div className="aspect-[3/4] bg-white/5 rounded-xl border border-white/10 p-6 md:p-12 relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-[8px] md:text-[10px] uppercase tracking-widest text-white/20">Page {selectedSource.pageNumber}</div>
                    <div className="space-y-4">
                      <div className="h-3 md:h-4 w-3/4 bg-white/10 rounded" />
                      <div className="h-3 md:h-4 w-full bg-white/10 rounded" />
                      <div className="h-3 md:h-4 w-5/6 bg-white/10 rounded" />
                      <div className="py-4 md:py-8 px-4 md:px-6 bg-blue-500/10 border-l-4 border-blue-500 text-blue-100 italic font-serif text-lg md:text-xl leading-relaxed">
                        "{selectedSource.excerpt}"
                      </div>
                      <div className="h-3 md:h-4 w-full bg-white/10 rounded" />
                      <div className="h-3 md:h-4 w-2/3 bg-white/10 rounded" />
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-6 border-t border-white/10 flex justify-center">
                  <button 
                    onClick={() => setSelectedSource(null)}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-medium transition-all"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {remainingSeconds !== null && (
          <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100]">
            <div className={`px-4 py-2 rounded-2xl backdrop-blur-xl border-2 shadow-2xl flex items-center gap-3 transition-all duration-500 ${remainingSeconds < 10 ? 'bg-red-500/30 border-red-500 text-red-200 animate-pulse scale-110' : 'bg-white/10 border-white/20 text-white/80'}`}>
              <div className="relative">
                <Clock className={`w-4 h-4 ${remainingSeconds < 10 ? 'animate-spin-slow' : ''}`} />
                {remainingSeconds < 10 && <div className="absolute inset-0 bg-red-500 blur-sm animate-pulse rounded-full" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Session Time</span>
                <span className="text-sm font-mono font-bold leading-none">{Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        )}

        {showSummary && (
          <SummaryPopup 
            sessionId={session || 'unknown'} 
            onClose={handleReset} 
          />
        )}
        </motion.div>
      ) : (
        <motion.div
          key="text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-screen w-full bg-[#050505] text-white flex flex-col font-sans overflow-hidden"
        >
      <header className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center backdrop-blur-md bg-black/40 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center"><Volume2 className="w-5 h-5 md:w-6 md:h-6" /></div>
          <div>
            <h2 className="text-base md:text-lg font-medium leading-none">VoiceIt</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/40 truncate max-w-[80px] md:max-w-none">{project.title}</span>
              <span className="w-1 h-1 bg-white/10 rounded-full" />
              <span className="text-[8px] md:text-[9px] text-blue-400/60 uppercase tracking-widest font-bold">{documents.length} Docs</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={handleExit}
            className="hidden sm:block px-3 md:px-4 py-1.5 md:py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-full text-[10px] md:text-xs font-medium text-white/60 hover:text-red-400 transition-all"
          >
            Exit
          </button>
          <button onClick={() => setIsVoiceMode(true)} className="px-3 md:px-4 py-1.5 md:py-2 bg-white/10 rounded-full text-[10px] md:text-xs font-medium hover:bg-white/20 transition-colors">Voice</button>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden relative">
        <div className={`flex-1 flex flex-col transition-all duration-500 ${selectedSource ? 'hidden md:flex md:w-1/2' : 'w-full'}`}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 scroll-smooth">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600' : 'bg-white/5 border border-white/10'} p-4 md:p-5 rounded-2xl shadow-xl`}>
                    <p className="text-base md:text-lg leading-relaxed font-light">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10 flex flex-wrap gap-2">
                        {msg.sources.map((src, i) => (
                          <button key={i} onClick={() => setSelectedSource(src)} className="flex items-center gap-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] md:text-xs transition-colors"><BookOpen className="w-3 h-3" />{src.documentTitle}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isThinking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-1">
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="p-4 md:p-6 bg-black/40 backdrop-blur-xl border-t border-white/10">
            <div className="max-w-3xl mx-auto flex items-center gap-3 md:gap-4">
              <button onClick={() => setIsListening(!isListening)} className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}><Mic className="w-5 h-5 md:w-6 md:h-6" /></button>
              <div className="flex-1 relative">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend(input)} placeholder={isListening ? "Listening..." : "Ask..."} className="w-full bg-white/5 border border-white/10 rounded-full py-3 md:py-4 px-5 md:px-6 focus:outline-none focus:border-blue-500/50 transition-colors text-base md:text-lg font-light" />
                <button onClick={() => handleSend(input)} className="absolute right-1.5 top-1.5 w-9 h-9 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"><Send className="w-4 h-4 md:w-5 md:h-5" /></button>
              </div>
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {selectedSource && (
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              className="fixed inset-0 md:relative md:inset-auto md:w-1/2 border-l border-white/10 bg-[#0a0a0a] flex flex-col z-30"
            >
              <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-blue-400" /><h3 className="font-medium truncate max-w-[150px] md:max-w-[200px]">{selectedSource.documentTitle}</h3></div>
                <button onClick={() => setSelectedSource(null)} className="p-2 text-white/40 hover:text-white">Close</button>
              </div>
              <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="aspect-[3/4] bg-white/5 rounded-xl border border-white/10 p-6 md:p-12 relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-[8px] md:text-[10px] uppercase tracking-widest text-white/20">Page {selectedSource.pageNumber}</div>
                  <div className="space-y-4">
                    <div className="h-3 md:h-4 w-3/4 bg-white/10 rounded" /><div className="h-3 md:h-4 w-full bg-white/10 rounded" /><div className="h-3 md:h-4 w-5/6 bg-white/10 rounded" />
                    <div className="py-4 md:py-8 px-4 md:px-6 bg-blue-500/10 border-l-4 border-blue-500 text-blue-100 italic font-serif text-lg md:text-xl leading-relaxed">"{selectedSource.excerpt}"</div>
                    <div className="h-3 md:h-4 w-full bg-white/10 rounded" /><div className="h-3 md:h-4 w-2/3 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {remainingSeconds !== null && (
          <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100]">
            <div className={`px-4 py-2 rounded-2xl backdrop-blur-xl border-2 shadow-2xl flex items-center gap-3 transition-all duration-500 ${remainingSeconds < 10 ? 'bg-red-500/30 border-red-500 text-red-200 animate-pulse scale-110' : 'bg-white/10 border-white/20 text-white/80'}`}>
              <div className="relative">
                <Clock className={`w-4 h-4 ${remainingSeconds < 10 ? 'animate-spin-slow' : ''}`} />
                {remainingSeconds < 10 && <div className="absolute inset-0 bg-red-500 blur-sm animate-pulse rounded-full" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Session Time</span>
                <span className="text-sm font-mono font-bold leading-none">{Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        )}

        {showSummary && (
          <SummaryPopup 
            sessionId={session || 'unknown'} 
            onClose={handleReset} 
          />
        )}
      </main>
    </motion.div>
    )}
  </AnimatePresence>
  );
};

const AdminDashboard = ({ onLaunchKiosk, sessionTimeout, setSessionTimeout }: { onLaunchKiosk: (project: Project) => void, sessionTimeout: number, setSessionTimeout: (val: number) => void }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountAnalytics, setAccountAnalytics] = useState<Analytics | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [managingProject, setManagingProject] = useState<Project | null>(null);
  const [projectDocs, setProjectDocs] = useState<Document[]>([]);
  const [newProject, setNewProject] = useState({ title: '', description: '', instructions: '', account_id: 'acc_default' });
  const [newAccount, setNewAccount] = useState({ name: '', branding_json: '{}' });
  const [uploadingDoc, setUploadingDoc] = useState({ title: '', content: '' });
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ 
    show: boolean, 
    title: string, 
    message: string, 
    onConfirm: () => void,
    confirmLabel?: string,
    confirmColor?: string
  } | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fetchData = async () => {
    console.log("fetchData: Starting Promise.all for projects, users, analytics, accounts...");
    try {
      const [pRes, uRes, aRes, accRes] = await Promise.all([
        fetch(`${API_BASE}/api/projects`).then(r => r),
        fetch(`${API_BASE}/api/users`).then(r => r),
        fetch(`${API_BASE}/api/analytics`).then(r => r),
        fetch(`${API_BASE}/api/accounts`).then(r => r)
      ]);
      
      if (!pRes.ok || !uRes.ok || !aRes.ok || !accRes.ok) {
        setAnalytics(null);
        return;
      }

      const projects = await pRes.json();
      const users = await uRes.json();
      const analytics = await aRes.json();
      const accounts = await accRes.json();
      
      setProjects(projects);
      setUsers(users);
      setAnalytics(analytics);
      setAccounts(accounts);
    } catch (error) {
      console.error("Fetch data failed:", error);
      setAnalytics(null);
    }
  };

  const fetchAccountAnalytics = async (accountId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/accounts/${accountId}/analytics`);
      if (res.ok) {
        const data = await res.json();
        setAccountAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch account analytics:", error);
    }
  };

  useEffect(() => {
    if (selectedAccount) {
      fetchAccountAnalytics(selectedAccount.id);
    }
  }, [selectedAccount]);

  useEffect(() => {
    console.log("App: Fetching initial data using API_BASE:", API_BASE || "(relative)");
    fetch(`${API_BASE}/api/health`)
      .then(res => res.json())
      .then(data => console.log("Server Health Check:", data))
      .catch(err => console.error("Server Health Check Failed:", err));

    fetchData();
  }, []);

  const handleCreateProject = async () => {
    if (!newProject.title) return;
    try {
      const res = await fetch(editingProject ? `${API_BASE}/api/projects/${editingProject.id}` : `${API_BASE}/api/projects`, {
        method: editingProject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }
      
      setNewProject({ title: '', description: '', instructions: '', account_id: 'acc_default' });
      setShowNewProject(false);
      setEditingProject(null);
      fetchData();
    } catch (error) {
      console.error("Failed to save project:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save project'}`);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.name) return;
    try {
      const res = await fetch(editingAccount ? `${API_BASE}/api/accounts/${editingAccount.id}` : `${API_BASE}/api/accounts`, {
        method: editingAccount ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      });
      
      if (!res.ok) throw new Error('Failed to save account');
      
      setNewAccount({ name: '', branding_json: '{}' });
      setShowNewAccount(false);
      setEditingAccount(null);
      fetchData();
    } catch (error) {
      console.error("Failed to save account:", error);
    }
  };

  const handleEditProject = (proj: Project) => {
    setEditingProject(proj);
    setNewProject({ 
      title: proj.title, 
      description: proj.description || '', 
      instructions: proj.instructions || '',
      account_id: proj.account_id || 'acc_default'
    });
    setShowNewProject(true);
  };

  const handleEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setNewAccount({ name: acc.name, branding_json: acc.branding_json || '{}' });
    setShowNewAccount(true);
  };

  const handleManageProject = async (proj: Project) => {
    setManagingProject(proj);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${proj.id}/documents`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const docs = await res.json();
      console.log("Fetched docs for project:", proj.id, docs);
      setProjectDocs(docs);
    } catch (error) {
      console.error("Error fetching project documents:", error);
      setProjectDocs([]);
    }
  };

  const handleDeleteDoc = (docId: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      onConfirm: async () => {
        await fetch(`${API_BASE}/api/documents/${docId}`, { method: 'DELETE' });
        if (managingProject) handleManageProject(managingProject);
        fetchData();
        setConfirmModal(null);
      }
    });
  };

  const handleUploadDoc = async () => {
    if (!managingProject || (!uploadingDoc.title && selectedFiles.length === 0 && !uploadingDoc.content)) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadingDoc.title);
      formData.append('content', uploadingDoc.content);
      
      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
      }

      await fetch(`${API_BASE}/api/projects/${managingProject.id}/documents`, {
        method: 'POST',
        body: formData
      });
      
      setUploadingDoc({ title: '', content: '' });
      setSelectedFiles([]);
      setShowUploadModal(false);
      handleManageProject(managingProject);
      fetchData();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProject = (id: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project and all its documents? This action cannot be undone.',
      onConfirm: async () => {
        await fetch(`${API_BASE}/api/projects/${id}`, { method: 'DELETE' });
        fetchData();
        setConfirmModal(null);
      }
    });
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'session_timeout', value: sessionTimeout })
      });
      // Optionally show a success toast or modal
      setConfirmModal({
        show: true,
        title: 'Settings Saved',
        message: 'Your kiosk behavior settings have been successfully updated.',
        onConfirm: () => setConfirmModal(null),
        confirmLabel: 'OK',
        confirmColor: 'bg-indigo-600 hover:bg-indigo-700'
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white">
              <Volume2 className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">VoiceIt</h1>
          </div>
          <button onClick={() => setShowMobileMenu(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-600">
            <LogOut className="w-5 h-5 rotate-180" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'accounts', icon: Building2, label: 'Accounts' },
            { id: 'projects', icon: BookOpen, label: 'Projects' },
            { id: 'users', icon: UserIcon, label: 'Users' },
            { id: 'analytics', icon: Activity, label: 'Analytics' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setManagingProject(null); setSelectedAccount(null); setShowMobileMenu(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id && !managingProject && !selectedAccount ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System Health</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${analytics ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className={`text-sm font-medium ${analytics ? 'text-emerald-600' : 'text-red-600'}`}>
                  {analytics ? 'Operational' : 'Backend Unreachable'}
                </span>
              </div>
              {!analytics && (
                <button 
                  onClick={() => fetchData()} 
                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Retry connection"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
            {analytics && !analytics.dbConnected && (
              <div className="mt-2 text-[10px] text-red-500 font-bold">
                Database Error: Check server logs
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white">
            <Volume2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg">VoiceIt</span>
        </div>
        <button onClick={() => setShowMobileMenu(true)} className="p-2 bg-slate-50 rounded-lg text-slate-600">
          <LayoutDashboard className="w-5 h-5" />
        </button>
      </div>

      {/* Overlay */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 md:mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 capitalize">
              {managingProject ? 'Project Management' : selectedAccount ? `Account: ${selectedAccount.name}` : activeTab}
            </h2>
            <p className="text-slate-500 mt-1 text-sm md:text-base">
              {selectedAccount ? 'View account-specific analytics and projects.' : 'Manage your enterprise knowledge and kiosk deployments.'}
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {activeTab === 'accounts' && !selectedAccount && (
              <button 
                onClick={() => setShowNewAccount(true)}
                className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                New Account
              </button>
            )}
            <button className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Export Logs</button>
            <button 
              onClick={() => setShowNewProject(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              New Project
            </button>
          </div>
        </header>

        {managingProject ? (
          <div className="space-y-8">
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
              <button 
                onClick={() => setManagingProject(null)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 rotate-180" />
              </button>
              <div className="min-w-0">
                <h3 className="text-xl md:text-2xl font-bold truncate">{managingProject.title}</h3>
                <p className="text-slate-500 text-xs md:text-sm truncate">Manage documents and knowledge base for this project.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h4 className="font-bold">Documents</h4>
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm"
                    >
                      Upload Document
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {projectDocs.map(doc => (
                      <div key={doc.id} className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-slate-100 rounded-xl text-slate-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm md:text-base">{doc.title}</p>
                            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider">{doc.page_count} Pages • PDF</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                          <button 
                            onClick={() => setViewingDoc(doc)}
                            className="text-indigo-600 text-sm font-bold hover:underline"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {projectDocs.length === 0 && (
                      <div className="p-12 text-center text-slate-400">
                        No documents uploaded yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold mb-6">Project Details</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                      <p className="text-sm text-slate-600">{managingProject.description}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">AI Instructions</p>
                      <p className="text-sm text-slate-600 italic">"{managingProject.instructions}"</p>
                    </div>
                    <button 
                      onClick={() => handleEditProject(managingProject)}
                      className="w-full mt-4 py-2 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                    >
                      Edit Project Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : selectedAccount ? (
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => setSelectedAccount(null)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
              <div>
                <h3 className="text-2xl font-bold">{selectedAccount.name}</h3>
                <p className="text-slate-500 text-sm">Account Overview & Scoped Analytics</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Sessions</p>
                <h3 className="text-2xl font-bold text-slate-900">{accountAnalytics?.totalSessions || 0}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Projects</p>
                <h3 className="text-2xl font-bold text-slate-900">{accountAnalytics?.activeProjects || 0}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Avg. Accuracy</p>
                <h3 className="text-2xl font-bold text-slate-900">{accountAnalytics?.accuracy || 0}%</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Sentiment Analysis</h3>
                <div className="flex items-center justify-around py-4">
                  <div className="text-center">
                    <Smile className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{accountAnalytics?.sentimentTotals?.positive || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Positive</p>
                  </div>
                  <div className="text-center">
                    <Meh className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{accountAnalytics?.sentimentTotals?.neutral || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neutral</p>
                  </div>
                  <div className="text-center">
                    <Frown className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{accountAnalytics?.sentimentTotals?.negative || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Negative</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Account Projects</h3>
                <div className="space-y-4">
                  {projects.filter(p => p.account_id === selectedAccount.id).map(proj => (
                    <div key={proj.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <span className="font-bold text-slate-800">{proj.title}</span>
                      <button onClick={() => handleManageProject(proj)} className="text-indigo-600 text-xs font-bold hover:underline">Manage</button>
                    </div>
                  ))}
                  {projects.filter(p => p.account_id === selectedAccount.id).length === 0 && (
                    <p className="text-slate-400 italic text-sm">No projects assigned to this account.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {activeTab === 'overview' && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
                  {[
                    { label: 'Total Sessions', value: analytics?.totalSessions || '0', change: '+12%', icon: Activity },
                    { label: 'Active Kiosks', value: analytics?.activeKiosks || '0', change: 'Live', icon: Settings },
                    { label: 'Knowledge Base', value: `${analytics?.totalDocuments || 0} docs`, change: `${analytics?.totalMessages || 0} msgs`, icon: BookOpen },
                    { label: 'Avg. Accuracy', value: `${analytics?.accuracy || 0}%`, change: '+0.2%', icon: Info },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                          <stat.icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {stat.change}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm font-medium text-slate-500">{stat.label}</p>
                      <h3 className="text-xl md:text-2xl font-bold text-slate-900">{stat.value}</h3>
                    </div>
                  ))}
                </div>

                {/* Sentiment Overview */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mb-10">
                  <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Global Sentiment Analysis</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-emerald-50 rounded-2xl">
                      <Smile className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                      <p className="text-xl font-bold text-emerald-900">{analytics?.sentimentTotals?.positive || 0}</p>
                      <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Positive</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-2xl">
                      <Meh className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                      <p className="text-xl font-bold text-amber-900">{analytics?.sentimentTotals?.neutral || 0}</p>
                      <p className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">Neutral</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-2xl">
                      <Frown className="w-6 h-6 text-red-600 mx-auto mb-2" />
                      <p className="text-xl font-bold text-red-900">{analytics?.sentimentTotals?.negative || 0}</p>
                      <p className="text-[8px] font-bold text-red-600 uppercase tracking-widest">Negative</p>
                    </div>
                  </div>
                </div>

                {/* Projects Grid */}
                <h3 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Active Projects
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((proj) => (
                    <div key={proj.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                      <div className="h-24 md:h-32 bg-slate-100 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
                        <div className="absolute bottom-4 left-4">
                          <span className="px-2 py-1 bg-white/90 backdrop-blur rounded text-[10px] font-bold uppercase tracking-wider text-indigo-600">Active</span>
                        </div>
                      </div>
                      <div className="p-4 md:p-6">
                        <h4 
                          className="text-base md:text-lg font-bold mb-2 group-hover:text-indigo-600 transition-colors cursor-pointer"
                          onClick={() => onLaunchKiosk(proj)}
                        >
                          {proj.title}
                        </h4>
                        <p className="text-xs md:text-sm text-slate-500 line-clamp-2 mb-6">{proj.description}</p>
                        <div className="flex flex-wrap justify-between items-center pt-4 border-t border-slate-100 gap-y-3">
                          <div className="flex gap-3">
                            <button 
                              onClick={() => handleDeleteProject(proj.id)}
                              className="text-red-500 text-[10px] md:text-xs font-medium hover:underline"
                            >
                              Delete
                            </button>
                            <button 
                              onClick={() => onLaunchKiosk(proj)}
                              className="text-indigo-600 text-[10px] md:text-xs font-medium hover:underline flex items-center gap-1"
                            >
                              <Mic className="w-3 h-3" /> Kiosk
                            </button>
                          </div>
                          <button 
                            onClick={() => handleManageProject(proj)}
                            className="px-3 md:px-4 py-1.5 bg-indigo-600 text-white text-[10px] md:text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-sm"
                          >
                            Manage <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'accounts' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Account Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Projects</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Users</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accounts.map(acc => (
                      <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs">
                              {acc.name[0]}
                            </div>
                            <span className="font-bold text-sm text-slate-900">{acc.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {projects.filter(p => p.account_id === acc.id).length} Projects
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {users.filter(u => u.account_id === acc.id).length} Users
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => setSelectedAccount(acc)} className="text-indigo-600 font-bold text-xs hover:underline">View Dashboard</button>
                            <button onClick={() => handleEditAccount(acc)} className="text-slate-600 font-bold text-xs hover:underline">Edit</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Project Name</th>
                      <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projects.map(proj => (
                      <tr key={proj.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs">{proj.title[0]}</div>
                            <span className="font-bold text-xs md:text-sm text-slate-900">{proj.title}</span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-[10px] md:text-xs text-slate-500 max-w-[200px] truncate">{proj.description}</td>
                        <td className="px-4 md:px-6 py-4">
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[8px] md:text-[10px] font-bold rounded-full uppercase tracking-wider">Active</span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 md:gap-3">
                            <button onClick={() => onLaunchKiosk(proj)} className="text-indigo-600 font-bold text-[10px] md:text-xs hover:underline">Kiosk</button>
                            <button onClick={() => handleManageProject(proj)} className="text-slate-600 font-bold text-[10px] md:text-xs hover:underline">Manage</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                      <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Account</th>
                      <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><UserIcon className="w-4 h-4" /></div>
                            <span className="font-bold text-xs md:text-sm text-slate-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-[10px] md:text-xs text-slate-500">{user.email}</td>
                        <td className="px-4 md:px-6 py-4 text-[10px] md:text-xs text-slate-500">{user.account_name || 'Global'}</td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={`px-2 py-1 text-[8px] md:text-[10px] font-bold rounded-full uppercase tracking-wider ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right text-[10px] md:text-xs text-slate-400">{new Date(user.last_active).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white p-4 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Session Volume (Last 7 Days)</h3>
                  <div className="h-48 md:h-64 flex items-end gap-1 md:gap-2">
                    {(analytics?.sessionVolume || [0, 0, 0, 0, 0, 0, 0]).map((count: number, i: number) => {
                      const max = Math.max(...(analytics?.sessionVolume || [1]), 1);
                      const h = (count / max) * 100;
                      return (
                        <div key={i} className="flex-1 bg-indigo-50 rounded-t-lg relative group">
                          <motion.div 
                            initial={{ height: 0 }} 
                            animate={{ height: `${Math.max(h, 5)}%` }} 
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="bg-indigo-600 rounded-t-lg w-full" 
                          />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {count} sessions
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-4 text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </div>
                <div className="bg-white p-4 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Accuracy Distribution</h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Correct Answers', value: analytics?.distribution?.correct || 94, color: 'bg-emerald-500' },
                      { label: 'Clarifications', value: analytics?.distribution?.clarifications || 4, color: 'bg-amber-500' },
                      { label: 'Unknowns', value: analytics?.distribution?.unknowns || 2, color: 'bg-red-500' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[10px] md:text-xs mb-2">
                          <span className="font-bold text-slate-700 uppercase tracking-wider">{item.label}</span>
                          <span className="font-bold text-slate-900">{item.value}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${item.value}%` }} 
                            transition={{ duration: 1, delay: i * 0.2 }}
                            className={`h-full ${item.color}`} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl space-y-4 md:space-y-8">
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold mb-6 md:mb-8 text-sm md:text-base">Account Settings</h4>
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Organization Name</label>
                      <input type="text" defaultValue="Global Enterprise" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm md:text-base" />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Contact Email</label>
                      <input type="email" defaultValue="admin@enterprise.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm md:text-base" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold mb-6 md:mb-8 text-sm md:text-base">Kiosk Behavior</h4>
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Session Timeout (seconds)</label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <input 
                          type="range" 
                          min="30" 
                          max="600" 
                          step="30"
                          value={sessionTimeout}
                          onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                          className="w-full sm:flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="w-16 text-center font-bold text-indigo-600 bg-indigo-50 py-1 rounded-lg text-sm md:text-base">
                          {sessionTimeout}s
                        </span>
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-400 mt-2">How long to wait before prompting the user and eventually closing the session due to inactivity.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 px-2 md:px-0">
                  <button onClick={() => fetchData()} className="flex-1 sm:flex-none px-6 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold">Cancel</button>
                  <button 
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className={`flex-1 sm:flex-none px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2 ${isSavingSettings ? 'opacity-50' : ''}`}
                  >
                    {isSavingSettings ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal && confirmModal.show && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-slate-100">
                <h3 className="text-xl md:text-2xl font-bold">{confirmModal.title}</h3>
                <p className="text-slate-500 mt-2 text-sm md:text-base">{confirmModal.message}</p>
              </div>
              <div className="p-6 md:p-8 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="px-6 py-2 text-slate-600 font-bold text-sm md:text-base"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className={`px-8 py-2 ${confirmModal.confirmColor || 'bg-red-600 hover:bg-red-700'} text-white rounded-xl font-bold shadow-lg transition-colors text-sm md:text-base`}
                >
                  {confirmModal.confirmLabel || 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewProject && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-slate-100">
                <h3 className="text-xl md:text-2xl font-bold">{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
                <p className="text-slate-500 mt-1 text-xs md:text-sm">Define your knowledge base and AI behavior.</p>
              </div>
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Assignment</label>
                  <select 
                    value={newProject.account_id}
                    onChange={e => setNewProject({...newProject, account_id: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm md:text-base"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Project Title</label>
                  <input 
                    type="text" 
                    value={newProject.title}
                    onChange={e => setNewProject({...newProject, title: e.target.value})}
                    placeholder="e.g. Legal & Policy Library" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm md:text-base" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea 
                    value={newProject.description}
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                    placeholder="Briefly describe the purpose..." 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 h-20 md:h-24 resize-none text-sm md:text-base" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">AI Instructions</label>
                  <textarea 
                    value={newProject.instructions}
                    onChange={e => setNewProject({...newProject, instructions: e.target.value})}
                    placeholder="How should the AI behave?" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 h-24 md:h-32 resize-none text-sm md:text-base" 
                  />
                </div>
              </div>
              <div className="p-6 md:p-8 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  onClick={() => { setShowNewProject(false); setEditingProject(null); }}
                  className="px-6 py-2 text-slate-600 font-bold text-sm md:text-base"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateProject}
                  className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-colors text-sm md:text-base"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Account Modal */}
      <AnimatePresence>
        {showNewAccount && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-slate-100">
                <h3 className="text-xl md:text-2xl font-bold">{editingAccount ? 'Edit Account' : 'Create New Account'}</h3>
                <p className="text-slate-500 mt-1 text-xs md:text-sm">Manage enterprise organization details.</p>
              </div>
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Name</label>
                  <input 
                    type="text" 
                    value={newAccount.name}
                    onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                    placeholder="e.g. Acme Corp" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm md:text-base" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Branding Config (JSON)</label>
                  <textarea 
                    value={newAccount.branding_json}
                    onChange={e => setNewAccount({...newAccount, branding_json: e.target.value})}
                    placeholder='{"primaryColor": "#4f46e5"}' 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 h-32 resize-none text-sm md:text-base font-mono" 
                  />
                </div>
              </div>
              <div className="p-6 md:p-8 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  onClick={() => { setShowNewAccount(false); setEditingAccount(null); }}
                  className="px-6 py-2 text-slate-600 font-bold text-sm md:text-base"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateAccount}
                  className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-colors text-sm md:text-base"
                >
                  {editingAccount ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Document Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-slate-100">
                <h3 className="text-xl md:text-2xl font-bold">Upload Document</h3>
                <p className="text-slate-500 mt-1 text-xs md:text-sm">Add a new file to the knowledge base.</p>
              </div>
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Document Title (Optional if uploading PDF)</label>
                  <input 
                    type="text" 
                    value={uploadingDoc.title}
                    onChange={e => setUploadingDoc({...uploadingDoc, title: e.target.value})}
                    placeholder="e.g. Q3 Safety Report" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm md:text-base" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Upload PDF</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 md:h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Camera className="w-6 h-6 md:w-8 md:h-8 text-slate-400 mb-2" />
                        <p className="mb-2 text-xs md:text-sm text-slate-500">
                          <span className="font-semibold">Click to upload</span>
                        </p>
                        <p className="text-[10px] md:text-xs text-slate-400">PDF (MAX. 10MB)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.doc,.docx"
                        multiple
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          setSelectedFiles(prev => [...prev, ...files]);
                        }}
                      />
                    </label>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs md:text-sm font-medium text-indigo-700 truncate flex-1">{file.name}</span>
                          <button 
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} 
                            className="text-indigo-400 hover:text-indigo-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white px-2 text-slate-400">Or Paste Text</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Content / Text</label>
                  <textarea 
                    value={uploadingDoc.content}
                    onChange={e => setUploadingDoc({...uploadingDoc, content: e.target.value})}
                    placeholder="Paste document text here..." 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 h-24 md:h-32 resize-none text-sm md:text-base" 
                  />
                </div>
              </div>
              <div className="p-6 md:p-8 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  onClick={() => { setShowUploadModal(false); setSelectedFiles([]); }}
                  className="px-6 py-2 text-slate-600 font-bold text-sm md:text-base"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUploadDoc}
                  disabled={isUploading}
                  className={`px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : 'Upload'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Document Modal */}
      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg md:text-2xl font-bold text-slate-900">{viewingDoc.title}</h3>
                  <p className="text-slate-500 mt-1 text-[10px] md:text-xs uppercase tracking-wider font-bold">{viewingDoc.page_count} Pages • Knowledge Base Document</p>
                </div>
                <button 
                  onClick={() => setViewingDoc(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <LogOut className="w-5 h-5 md:w-6 md:h-6 rotate-180" />
                </button>
              </div>
              <div className="p-4 md:p-8 overflow-y-auto bg-slate-50 flex-1">
                <div className="bg-white p-6 md:p-10 rounded-2xl border border-slate-200 shadow-sm min-h-full">
                  <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm text-slate-700 leading-relaxed">
                    {viewingDoc.content}
                  </pre>
                </div>
              </div>
              <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setViewingDoc(null)}
                  className="w-full sm:w-auto px-8 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-xs md:text-sm"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [mode, setMode] = useState<'kiosk' | 'admin' | 'select'>('select');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessionTimeout, setSessionTimeout] = useState(180); // Default 3 minutes

  // Check for summary page
  const path = window.location.pathname;
  const sessionMatch = path.match(/^\/session\/([^/]+)/);
  if (sessionMatch) {
    return <SummaryPage sessionId={sessionMatch[1]} />;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const summaryData = urlParams.get('summary');
  if (summaryData) {
    // Fallback for old style links if any
    try {
      const decoded = JSON.parse(atob(summaryData));
      if (decoded.sessionId) return <SummaryPage sessionId={decoded.sessionId} />;
    } catch (e) {}
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/projects`).then(res => res.json()).then(setProjects);
    fetch(`${API_BASE}/api/settings`).then(res => res.json()).then(settings => {
      if (settings.session_timeout) {
        setSessionTimeout(parseInt(settings.session_timeout));
      }
    });
  }, []);

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8 md:mb-12">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 md:mb-6 shadow-lg shadow-indigo-200">
              <Volume2 className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2">VoiceIt Rebuild</h1>
            <p className="text-slate-500 text-sm md:text-base">Select an interface to begin the experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <button 
              onClick={() => setMode('admin')}
              className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 mb-4 md:mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2">Admin Console</h3>
              <p className="text-slate-500 mb-6 md:mb-8 text-sm md:text-base">Manage accounts, projects, and knowledge ingestion.</p>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm md:text-base">
                Open Dashboard <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 mb-4 md:mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Mic className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2">Kiosk Mode</h3>
              <p className="text-slate-500 mb-4 md:mb-6 text-sm md:text-base">Interactive AI assistant for privacy pods and public spaces.</p>
              
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Project</p>
                {projects.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => { setSelectedProject(p); setMode('kiosk'); }}
                    className="w-full p-3 bg-slate-50 hover:bg-blue-50 rounded-xl text-left flex justify-between items-center group/item transition-colors"
                  >
                    <span className="font-medium text-slate-700 group-hover/item:text-blue-700 text-sm md:text-base">{p.title}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover/item:text-blue-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'admin') return (
    <AdminDashboard 
      onLaunchKiosk={(p) => { setSelectedProject(p); setMode('kiosk'); }} 
      sessionTimeout={sessionTimeout}
      setSessionTimeout={setSessionTimeout}
    />
  );
  if (mode === 'kiosk' && selectedProject) return (
    <AnimatePresence mode="wait">
      <KioskMode project={selectedProject} sessionTimeout={sessionTimeout} onExit={() => setMode('select')} />
    </AnimatePresence>
  );

  return null;
}
