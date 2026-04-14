import React from 'react';
import { Gavel, ClipboardCheck, Award, RefreshCw } from 'lucide-react';

const QuickActions: React.FC = () => {
  const actions = [
    {
      title: "Regulations",
      desc: "Search & understand",
      icon: <Gavel size={18} />,
      color: "bg-blue-50 text-blue-600",
      query: "Show all regulations in my scope"
    },
    {
      title: "Obligations",
      desc: "Track compliance",
      icon: <ClipboardCheck size={18} />,
      color: "bg-purple-50 text-purple-600",
      query: "Show high-risk obligations"
    },
    {
      title: "Licenses",
      desc: "Monitor renewals",
      icon: <Award size={18} />,
      color: "bg-green-50 text-green-600",
      query: "Which licenses are expiring soon?"
    },
    {
      title: "Updates",
      desc: "Recent changes",
      icon: <RefreshCw size={18} />,
      color: "bg-orange-50 text-orange-500",
      query: "What changed in the last 30 days?"
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {actions.map((action, index) => (
        <button
          key={index}
          className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-ey-yellow hover:-translate-y-1 hover:shadow-md transition-all duration-200 group flex flex-col items-center"
        >
          {/* Icon Container with semantic colors matching HTML reference */}
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 ${action.color}`}>
            {action.icon}
          </div>
          
          <div className="text-[11px] font-bold text-gray-800 mb-0.5">
            {action.title}
          </div>
          
          <div className="text-[9px] text-gray-500 font-medium">
            {action.desc}
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
