import React, { useState } from 'react';
import { History, X, Search, MessageSquare, Clock, Trash2 } from 'lucide-react';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: any[]; // Matches ChatSession interface
  onLoadSession: (id: string) => void;
  onWipeSessions: () => void;
  currentSessionId: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  isOpen, 
  onClose, 
  sessions, 
  onLoadSession, 
  onWipeSessions,
  currentSessionId
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Requirement: UI must remain responsive (local search filter)
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside 
      className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ease-in-out shadow-2xl z-20 ${
        isOpen ? 'w-[300px]' : 'w-0 overflow-hidden border-none'
      }`}
    >
      {/* PANEL HEADER */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-tight">
          <History size={16} className="text-ey-yellow" />
          Chat History
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-gray-200 rounded-md text-gray-400 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* HISTORY SEARCH (Requirement: Support feedback retrieve patterns) */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-ey-yellow outline-none transition-all"
          />
        </div>

        {/* SESSIONS LIST */}
        <div className="space-y-6">
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
              Previous Conversations
            </div>
            
            {filteredSessions.length === 0 ? (
              <div className="px-2 py-4 text-center border border-dashed border-gray-200 rounded-xl">
                <p className="text-[10px] text-gray-400 italic">No matching interactions found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSessions.map((session) => (
                  <button 
                    key={session.id}
                    onClick={() => onLoadSession(session.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all group ${
                      session.id === currentSessionId 
                      ? 'border-ey-yellow bg-yellow-50/30 ring-1 ring-ey-yellow/20' 
                      : 'border-gray-100 bg-gray-50/50 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare size={12} className={session.id === currentSessionId ? 'text-ey-yellow' : 'text-gray-400'} />
                      <div className={`text-[12px] font-semibold truncate ${session.id === currentSessionId ? 'text-ey-black' : 'text-gray-700'}`}>
                        {session.title}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                       <span className="text-[9px] font-bold text-gray-400 uppercase">Interactive Session</span>
                       <span className="text-[8px] text-gray-300 font-mono italic">#{session.id.slice(0, 8)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER: Wipe Sessions Logic (Requirement: Visible to all users) */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/30 space-y-3">
        <button 
          onClick={onWipeSessions}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider"
        >
          <Trash2 size={12} />
          Wipe Local History
        </button>
        <p className="text-[9px] text-gray-400 font-medium italic text-center">
          Persistent history is active.
        </p>
      </div>
    </aside>
  );
};

export default HistoryPanel;
