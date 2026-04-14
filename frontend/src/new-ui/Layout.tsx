import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ChatArea from './ChatArea';
import HistoryPanel from './HistoryPanel';
import { ChatMessage, ChatFilters } from '../types';

interface LayoutProps {
  // Chat & History Props
  messages: ChatMessage[];
  sessions: any[];
  currentSessionId: string;
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onNewChat: () => void;
  onLoadSession: (id: string) => void;
  onWipeSessions: () => void;

  // Dynamic Filter Props (Phase 2 New)
  availableCountries: string[];
  availableRegions: string[];
  availableSubCategories: string[];
  availableCriticality: string[];
  filters: ChatFilters;
  setFilters: React.Dispatch<React.SetStateAction<ChatFilters>>;
}

const Layout: React.FC<LayoutProps> = ({
  messages,
  sessions,
  currentSessionId,
  isLoading,
  onSendMessage,
  onNewChat,
  onLoadSession,
  onWipeSessions,
  
  // Deconstructing new props
  availableCountries,
  availableRegions,
  availableSubCategories,
  availableCriticality,
  filters,
  setFilters
}) => {
  // State to manage the visibility of the Right History Panel
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  return (
    <div className="flex h-screen w-full bg-ey-light text-ey-black font-sans overflow-hidden">
      
      {/* SIDEBAR: Receives all dynamic filter props */}
      <Sidebar 
        onNewChat={onNewChat} 
        filters={filters}
        setFilters={setFilters}
        availableCountries={availableCountries}
        availableRegions={availableRegions}
        availableSubCategories={availableSubCategories}
        availableCriticality={availableCriticality}
      />

      {/* MAIN VIEW: Topbar + Chat Area */}
      <div className="flex flex-1 flex-col min-w-0 bg-white relative">
        
        {/* TOPBAR: Limited to supported props only */}
        <Topbar 
          onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)} 
          isHistoryOpen={isHistoryOpen}
          onNewChat={onNewChat}
        />

        <div className="flex flex-1 overflow-hidden relative">
          {/* CHAT AREA: Updated to receive dynamic metadata and filter props */}
          <ChatArea 
            messages={messages} 
            onSendMessage={onSendMessage} 
            isLoading={isLoading} 
            currentSessionId={currentSessionId}
            availableCountries={availableCountries}
            availableRegions={availableRegions}
            availableSubCategories={availableSubCategories}
            availableCriticality={availableCriticality}
            filters={filters}
            setFilters={setFilters}
          />

          {/* HISTORY PANEL: Toggleable Right Side */}
          <HistoryPanel 
            isOpen={isHistoryOpen} 
            onClose={() => setIsHistoryOpen(false)} 
            sessions={sessions}
            onLoadSession={onLoadSession}
            onWipeSessions={onWipeSessions}
            currentSessionId={currentSessionId}
          />
        </div>
        
      </div>
    </div>
  );
};

export default Layout;
