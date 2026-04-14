import React from 'react';
import { 
  Plus, 
  Download, 
  History, 
  LayoutGrid, 
  Gavel, 
  CheckSquare,
  Award
} from 'lucide-react';

interface TopbarProps {
  onToggleHistory: () => void;
  isHistoryOpen: boolean;
  onNewChat: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onToggleHistory, isHistoryOpen, onNewChat }) => {
  const [activeTab, setActiveTab] = React.useState('all');

  const tabs = [
    { id: 'all', label: 'All', icon: <LayoutGrid size={11} /> },
    { id: 'regulations', label: 'Regulations', icon: <Gavel size={11} /> },
    { id: 'obligations', label: 'Obligations', icon: <CheckSquare size={11} /> },
    { id: 'licenses', label: 'Licenses', icon: <Award size={11} /> },
  ];

  return (
    <header className="h-[72px] bg-white border-b border-[#E4E4E4] px-[24px] flex items-center justify-between flex-shrink-0 z-40">
      
      {/* LEFT SIDE: Icon, Title & Tabs */}
      <div className="flex items-center gap-[16px]">
        
        {/* 1. Robot Icon Container (36x36, gradient, 10px radius) */}
        <div className="flex items-center" style={{ gap: '10px' }}>
          <div className="w-[36px] h-[36px] bg-gradient-to-br from-[#FFD400] to-[#FFC107] rounded-[10px] flex items-center justify-center shadow-sm">
            <i className="fas fa-robot text-[#1F1F1F] text-[18px]"></i>
          </div>

          {/* 2. Title Text (16px and 11px) */}
          <div className="flex flex-col">
            <h1 className="text-[16px] font-[600] text-[#1F1F1F] leading-tight">
              Compliance Copilot
            </h1>
            <span className="text-[11px] text-[#747480]">
              AI-powered compliance assistant
            </span>
          </div>
        </div>

        {/* 3. Module Tabs Section (bg #F1F1F1, 4px padding, 10px radius) */}
        <nav className="flex bg-[#F1F1F1] p-[4px] rounded-[10px] gap-[4px] ml-[8px]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-[6px] px-[14px] py-[8px] rounded-[8px] text-[12px] font-[500] transition-all duration-150 ${
                activeTab === tab.id 
                ? 'bg-white text-[#1F1F1F] shadow-sm' 
                : 'bg-transparent text-[#6B6B6B] hover:text-[#1F1F1F]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* RIGHT SIDE: Action Buttons */}
      <div className="flex items-center gap-[8px]">
        
        {/* 4. New Chat Button (#1F1F1F, hover #464653) */}
        <button 
          onClick={onNewChat}
          className="flex items-center gap-[6px] px-[14px] py-[8px] bg-[#1F1F1F] text-white hover:bg-[#464653] rounded-[8px] text-[12px] font-[500] transition-all duration-150 shadow-sm"
        >
          <Plus size={14} className="text-[#FFD400]" />
          <span>New Chat</span>
        </button>

        {/* 5. Export Button (White, Gray-300 border) */}
        <button className="flex items-center gap-[6px] px-[14px] py-[8px] bg-white border border-[#C4C4CD] text-[#6B6B6B] hover:border-[#9897A0] hover:text-[#1F1F1F] rounded-[8px] text-[12px] font-[500] transition-all duration-150 shadow-sm">
          <Download size={14} />
          <span>Export</span>
        </button>

        {/* 6. Chat History Toggle Button (36x36, #F1F1F1) */}
        <button 
          onClick={onToggleHistory}
          className={`w-[36px] h-[36px] flex items-center justify-center rounded-[8px] transition-all duration-150 ${
            isHistoryOpen 
            ? 'bg-[#FFD400] text-[#1F1F1F]' 
            : 'bg-[#F1F1F1] text-[#747480] hover:bg-[#E4E4E4] hover:text-[#1F1F1F]'
          }`}
          title="Chat History"
        >
          <History size={18} />
        </button>
      </div>
      
    </header>
  );
};

export default Topbar;
