import React, { useState } from 'react';
import { Send, Sparkles, ShieldCheck } from 'lucide-react';

interface InputAreaProps {
  onSendMessage?: (message: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage }) => {
  const [text, setText] = useState('');

  const suggestions = [
    'Regulations in Karnataka',
    'Compare labor law India vs UAE',
    'Pending tasks',
    'High-risk obligations'
  ];

  const handleSend = () => {
    if (text.trim() && onSendMessage) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-6 flex-shrink-0 z-40">
      <div className="max-w-[820px] mx-auto w-full">
        
        {/* INPUT BOX CONTAINER */}
        <div className="relative group">
          {/* Subtle EY-Yellow glow effect on focus matching HTML focus-within state */}
          <div className="absolute -inset-0.5 bg-ey-yellow rounded-[18px] blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
          
          <div className="relative flex items-end gap-3 bg-gray-50 border-2 border-gray-200 focus-within:border-ey-yellow focus-within:bg-white rounded-2xl p-3 transition-all duration-200 shadow-inner">
            <textarea 
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask about regulations, obligations, licenses..."
              className="flex-1 bg-transparent border-none outline-none resize-none text-[13px] leading-relaxed py-1.5 px-2 custom-scrollbar max-h-[120px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            
            <button 
              onClick={handleSend}
              disabled={!text.trim()}
              className="w-10 h-10 bg-ey-black text-white hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all flex-shrink-0 shadow-lg"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* SUGGESTION CHIPS (Requirement: Suggestion Chips) */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {suggestions.map((chip) => (
            <button
              key={chip}
              onClick={() => setText(chip)}
              className="px-4 py-2 bg-white border border-gray-200 hover:border-ey-yellow hover:bg-ey-yellow/5 rounded-full text-[11px] font-semibold text-gray-600 transition-all shadow-sm"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* BOTTOM HINT (Requirement: Grounded responses text) */}
        <div className="mt-4 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center justify-center gap-2">
            <ShieldCheck size={12} className="text-blue-500" />
            <span>Verified responses based on approved platform records</span>
          </p>
        </div>

      </div>
    </div>
  );
};

export default InputArea;
