import React from 'react';
import { 
  Home, 
  ClipboardList, 
  PieChart, 
  Settings, 
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewChat }) => {
  return (
    <aside className="w-[240px] bg-ey-charcoal text-white flex flex-col h-full border-r border-white/10 z-50 flex-shrink-0">
      
      {/* SIDEBAR HEADER: Logo matching HTML */}
      <div className="p-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-9 h-9 bg-ey-yellow rounded flex items-center justify-center font-bold text-ey-black text-sm">
          EY
        </div>
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold leading-tight">Compliance Manager</span>
          <span className="text-[10px] text-gray-400">Client Admin Portal</span>
        </div>
      </div>

      {/* NAVIGATION SECTION */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1 custom-scrollbar">
        
        <div className="px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
          Main Navigation
        </div>
        <NavItem icon={<Home size={16} />} label="Overview" />
        <NavItem icon={<ClipboardList size={16} />} label="My Tasks" badge="5" />
        <NavItem icon={<PieChart size={16} />} label="Dashboard" />

        <div className="my-4 border-t border-white/5 mx-2" />

        <div className="px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
          Quick Access
        </div>
        <NavItem icon={<MessageSquare size={16} />} label="Compliance Copilot" active />
      </nav>

      {/* SIDEBAR FOOTER: User Profile matching HTML */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-ey-yellow rounded-full flex items-center justify-center font-bold text-ey-black text-xs">
            SJ
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-medium truncate">Sarah Johnson</span>
            <span className="text-[10px] text-gray-500 truncate">Client Admin</span>
          </div>
          <Settings size={14} className="ml-auto text-gray-500 hover:text-white cursor-pointer" />
        </div>
      </div>
      
    </aside>
  );
};

// Internal Helper Component for Nav Items
const NavItem: React.FC<{ icon: React.ReactNode; label: string; badge?: string; active?: boolean }> = ({ icon, label, badge, active }) => (
  <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group ${active ? 'bg-ey-yellow text-ey-black font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
    <span className={active ? 'text-ey-black' : 'group-hover:text-ey-yellow'}>{icon}</span>
    <span className="text-xs flex-1 text-left">{label}</span>
    {badge && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">{badge}</span>}
  </button>
);

export default Sidebar;
