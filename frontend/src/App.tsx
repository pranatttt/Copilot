import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Hammer, ClipboardList, ShieldCheck, RefreshCw, Send, 
  MapPin, BookOpen, X, Loader2, Scale, LayoutDashboard, 
  Bell, MessageSquare, Trash2, Globe, ChevronLeft, Download, 
  Settings, HelpCircle, ExternalLink, Info, CheckCircle2, AlertTriangle, Layers, AlertCircle, FileText,
  MessageCircle, SendHorizonal
} from 'lucide-react';
import { ChatMessage, ChatFilters, ComplianceScope, FeedbackRecord } from './types';
import { sendChatMessage, getMetadata, getChatHistory, submitFeedback, getFeedback } from './api';

// --- IMPORT NEW UI ---
import Layout from './new-ui/Layout';

// --- FEEDBACK SYSTEM COMPONENT ---
const FeedbackSection: React.FC<{ query: string, response: string, sessionId: string }> = ({ query, response, sessionId }) => {
  const [remark, setRemark] = useState('');
  const [feedbackList, setFeedbackList] = useState<FeedbackRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchExistingFeedback = async () => {
      const data = await getFeedback(query, response);
      setFeedbackList(data);
    };
    fetchExistingFeedback();
  }, [query, response]);

  const handleSubmit = async () => {
    if (!remark.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitFeedback(sessionId, query, response, remark);
      setRemark('');
      const updatedData = await getFeedback(query, response);
      setFeedbackList(updatedData);
    } catch (e) {
      alert("Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-100 animate-fade-in">
      <div className="flex items-center space-x-2 mb-4 text-gray-400">
        <MessageCircle size={14} />
        <span className="text-[10px] font-black uppercase tracking-widest">Audit Remarks & Feedback</span>
      </div>
      <div className="relative mb-6">
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Enter audit remark..."
          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs focus:ring-1 focus:ring-[#FFE600] outline-none min-h-[60px] resize-none"
        />
        <button 
          onClick={handleSubmit}
          disabled={!remark.trim() || isSubmitting}
          className="absolute bottom-2 right-2 p-2 bg-black text-[#FFE600] rounded-lg hover:scale-105 disabled:opacity-30 transition-all"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
        </button>
      </div>
      {feedbackList.length > 0 && (
        <div className="space-y-3">
          <div className="text-[9px] font-bold text-gray-400 uppercase mb-2">Previous Feedback:</div>
          {feedbackList.map((item) => (
            <div key={item.id} className="bg-white border border-gray-50 p-3 rounded-xl shadow-sm animate-slide-up">
              <p className="text-[11px] text-gray-700 leading-relaxed">• {item.remark}</p>
              <div className="mt-2 text-[8px] text-gray-300 font-mono">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ChatSession {
  id: string;
  title: string;
}

const App: React.FC = () => {
  // --- 1. CORE STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]); 
  const [currentSessionId, setCurrentSessionId] = useState<string>(''); 
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);
  const [availableCriticality, setAvailableCriticality] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  const [filters, setFilters] = useState<ChatFilters & { sub_category?: string, criticality?: string }>({
    country: 'India',
    state_region: 'All States',
    category: 'All',
    sub_category: 'All',
    criticality: 'All'
  });

  const scope: ComplianceScope = { role: "Compliance Manager", tenant: "Acme Corp", countries: ["India"], regAreasCount: 12 };

  // --- 2. INITIALIZATION ---
  useEffect(() => {
    const initializeApp = async () => {
      let sessionId = localStorage.getItem('ey_current_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('ey_current_session_id', sessionId);
      }
      setCurrentSessionId(sessionId);

      try {
        const history = await getChatHistory(sessionId);
        if (history && history.length > 0) {
          setMessages(history.map((m: any) => ({
            ...m,
            timestamp: new Date(m.created_at),
            associatedQuery: m.user_query || ""
          })));
        }
      } catch (e) { console.error("History recovery failed"); }

      try {
        const data = await getMetadata();
        if (data) {
          setAvailableCountries(Array.from(new Set(data.countries || [])));
          setAvailableRegions(data.regions || []);
          setAvailableCategories(data.categories || []);
          // @ts-ignore
          setAvailableSubCategories(data.sub_categories || []);
          // @ts-ignore
          setAvailableCriticality(data.criticality || []);
        }
      } catch (err) { console.error("Metadata sync failed"); }

      const savedSessions = localStorage.getItem('ey_past_sessions_list');
      if (savedSessions) setSessions(JSON.parse(savedSessions));
    };

    initializeApp();
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  const renderStructuredContent = (content: string) => {
    const sections = content.split(/(### REQUIREMENT|### LEGAL BASIS|### CLASSIFICATION)/g);
    if (sections.length <= 1) return <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{content}</div>;
    return (
      <div className="space-y-6">
        {sections.map((section, idx) => {
          const trimmed = section.trim();
          if (!trimmed) return null;
          if (trimmed === "### REQUIREMENT" || trimmed === "### LEGAL BASIS" || trimmed === "### CLASSIFICATION") {
            return (
              <div key={idx} className="flex items-center space-x-3 mt-8 first:mt-2">
                <div className="h-[2px] w-4 bg-[#FFE600]"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FFE600] bg-black px-3 py-1 rounded">{trimmed.replace("### ", "")}</span>
                <div className="h-[1px] flex-1 bg-gray-100"></div>
              </div>
            );
          }
          return <div key={idx} className="pl-4 border-l-2 border-gray-50 text-sm leading-relaxed whitespace-pre-wrap font-medium text-gray-700">{trimmed}</div>;
        })}
      </div>
    );
  };

  const handleApplyContext = () => {
    setSyncStatus(`${filters.state_region} | ${filters.sub_category} | ${filters.criticality}`);
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      const sessionSummary = { id: currentSessionId, title: messages[0].content.slice(0, 30) + "..." };
      const updatedSessions = [sessionSummary, ...sessions.filter(s => s.id !== currentSessionId)];
      setSessions(updatedSessions);
      localStorage.setItem('ey_past_sessions_list', JSON.stringify(updatedSessions));
    }
    const newId = crypto.randomUUID();
    setCurrentSessionId(newId);
    localStorage.setItem('ey_current_session_id', newId);
    setMessages([]);
  };

  const loadPastSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const history = await getChatHistory(sessionId);
      setCurrentSessionId(sessionId);
      localStorage.setItem('ey_current_session_id', sessionId);
      setMessages(history.map((m: any) => ({ ...m, timestamp: new Date(m.created_at), associatedQuery: m.user_query || "" })));
    } catch (e) { console.error("Session load failed"); } finally { setIsLoading(false); }
  };

  const handleSend = async (override?: string) => {
    const val = override || input;
    if (!val.trim() || isLoading) return;

    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    const isValidHistory = lastAssistantMsg && !lastAssistantMsg.content.includes("🚨") && !lastAssistantMsg.content.includes("No compliance records found");
    const prevResponseText = isValidHistory ? lastAssistantMsg.content : undefined;

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: val, timestamp: new Date() }]);
    setInput('');
    setIsLoading(true);

    try {
      const apiFilters = {
        country: filters.country === 'All' ? undefined : filters.country,
        state_region: filters.state_region === 'All States' ? undefined : filters.state_region,
        category: filters.category === 'All' ? undefined : filters.category,
        sub_category: filters.sub_category === 'All' ? undefined : filters.sub_category,
        criticality: filters.criticality === 'All' ? undefined : filters.criticality
      };

      const response = await sendChatMessage(val, apiFilters, currentSessionId, prevResponseText);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources || [],
        timestamp: new Date(),
        associatedQuery: val 
      }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: `🚨 Error: ${e.message}`, timestamp: new Date(), sources: [] }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. RENDER ONLY NEW UI LAYOUT ---
  return (
    <Layout
      messages={messages}
      sessions={sessions}
      currentSessionId={currentSessionId}
      isLoading={isLoading}
      onSendMessage={handleSend}
      onNewChat={handleNewChat}
      onLoadSession={loadPastSession}
      onWipeSessions={() => {
        localStorage.clear();
        setSessions([]);
        setMessages([]);
        handleNewChat();
      }}
      availableCountries={availableCountries}
      availableRegions={availableRegions}
      availableSubCategories={availableSubCategories}
      availableCriticality={availableCriticality}
      filters={filters}
      setFilters={setFilters}
    />
  );
};

export default App;
