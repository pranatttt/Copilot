import React, { useRef, useEffect } from 'react';
import WelcomeState from './WelcomeState';
import InputArea from './InputArea';
import EvidenceModal from './EvidenceModal';
import { ChatMessage, ChatFilters } from '../types';
import { Scale, Info, AlertCircle, MessageCircle, SendHorizonal, Loader2 } from 'lucide-react';
import { submitFeedback, getFeedback } from '../api';

// --- INTEGRATED FEEDBACK COMPONENT (Preserved Logic) ---
const FeedbackSection: React.FC<{ query: string, response: string, sessionId: string }> = ({ query, response, sessionId }) => {
  const [remark, setRemark] = React.useState('');
  const [feedbackList, setFeedbackList] = React.useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
    <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in text-left">
      <div className="flex items-center space-x-2 mb-3 text-gray-400">
        <MessageCircle size={14} />
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Audit Remarks</span>
      </div>
      <div className="relative mb-4">
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Enter audit remark..."
          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs focus:ring-1 focus:ring-ey-yellow outline-none min-h-[60px] resize-none"
        />
        <button 
          onClick={handleSubmit}
          disabled={!remark.trim() || isSubmitting}
          className="absolute bottom-2 right-2 p-1.5 bg-[#1F1F1F] text-white rounded-lg hover:scale-105 disabled:opacity-30 transition-all"
        >
          {isSubmitting ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <SendHorizonal size={14} />
          )}
        </button>
      </div>
      {feedbackList.length > 0 && (
        <div className="space-y-2">
          {feedbackList.map((item: any) => (
            <div key={item.id} className="bg-gray-50/50 border border-gray-100 p-2.5 rounded-lg animate-slide-up">
              <p className="text-[11px] text-gray-700 leading-relaxed">• {item.remark}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ChatAreaProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  currentSessionId: string;
  
  availableCountries: string[];
  availableRegions: string[];
  availableSubCategories: string[];
  availableCriticality: string[];
  filters: ChatFilters;
  setFilters: React.Dispatch<React.SetStateAction<ChatFilters>>;
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages = [], 
  onSendMessage, 
  isLoading = false, 
  currentSessionId,
  availableCountries = [],
  availableRegions = [],
  availableSubCategories = [],
  availableCriticality = [],
  filters,
  setFilters
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [selectedEvidence, setSelectedEvidence] = React.useState<any>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages?.[messages.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth"
        });
      }
    }
  }, [messages]);

  const renderContent = (content: string) => {
    const sections = content.split(/(### REQUIREMENT|### LEGAL BASIS|### CLASSIFICATION)/g);
    if (sections.length <= 1) return <div className="text-[13px] leading-[1.6] whitespace-pre-wrap font-medium text-left">{content}</div>;
    
    return (
      <div className="space-y-4 text-left">
        {sections.map((section, idx) => {
          const trimmed = section.trim();
          if (!trimmed) return null;
          if (trimmed === "### REQUIREMENT" || trimmed === "### LEGAL BASIS" || trimmed === "### CLASSIFICATION") {
            return (
              <div key={idx} className="flex items-center gap-2 mt-6 first:mt-2">
                <div className="h-[2px] w-3 bg-ey-yellow"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{trimmed.replace("### ", "")}</span>
              </div>
            );
          }
          return <div key={idx} className="text-[13px] leading-[1.6] text-gray-700 pl-4 border-l border-gray-100">{trimmed}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB] relative overflow-hidden">
      
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <div className="max-w-[820px] mx-auto w-full py-8">
          
          {messages.length === 0 ? (
            <WelcomeState 
              availableCountries={availableCountries}
              availableRegions={availableRegions}
              availableSubCategories={availableSubCategories}
              availableCriticality={availableCriticality}
              filters={filters}
              setFilters={setFilters}
              isChatActive={false}
            />
          ) : (
            <>
              <div className="flex flex-col gap-8">
                {(messages || []).map((m) => (
                  <div key={m.id} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                    <div className={`${m.role === 'user' ? 'max-w-[85%]' : 'w-full'}`}>
                      
                      {m.role === 'assistant' ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-[8px] mb-[12px]">
                            <div className="w-[24px] h-[24px] rounded-[6px] bg-gradient-to-br from-[#FFD400] to-[#FFC107] flex items-center justify-center">
                              <i className="fas fa-robot text-[#1F1F1F] text-[12px]"></i>
                            </div>
                            <span className="text-[12px] font-semibold text-[#464653]">Compliance Copilot</span>
                            <span className="text-[10px] bg-[#F1F1F1] text-[#747480] px-[6px] py-[2px] rounded-[4px] font-medium">AI-Assisted</span>
                          </div>

                          <div className="bg-white border border-[#E4E4E4] rounded-[16px] rounded-bl-[4px] p-[14px]">
                            {m.content.includes("No compliance records found") ? (
                              <div className="flex items-start gap-3 text-orange-600 bg-orange-50 p-4 rounded-xl border border-orange-100 text-left">
                                <AlertCircle size={18} className="flex-shrink-0" />
                                <span className="text-[13px] font-bold">{m.content}</span>
                              </div>
                            ) : (
                              renderContent(m.content)
                            )}

                            {m.sources && m.sources.length > 0 && (
                              <div className="mt-8 pt-6 border-t border-gray-100 text-left">
                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">
                                  <Scale size={14} /> Evidence Basis
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {m.sources.map((src: any, i) => (
                                    <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-ey-yellow transition-all group">
                                      <h5 className="text-[11px] font-bold text-gray-800 line-clamp-1 mb-2">{src['Name of Mother Act'] || 'Legal Record'}</h5>
                                      <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-tighter">
                                        <span>Prov: {src['Compliance/ Statutory Provisions'] || 'N/A'}</span>
                                        <button 
                                          onClick={() => {
                                            setSelectedEvidence(src);
                                            setIsModalOpen(true);
                                          }} 
                                          className="p-1 hover:text-ey-black transition-colors"
                                        >
                                          <Info size={12}/>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {!m.content.includes("🚨") && (
                              <FeedbackSection 
                                query={m.associatedQuery || ""} 
                                response={m.content} 
                                sessionId={currentSessionId} 
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#1F1F1F] text-white px-[18px] py-[14px] rounded-[16px] rounded-br-[4px] text-[13px] leading-[1.6] text-left">
                          {m.content}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-3 justify-start">
                    <div className="bg-white border border-[#E4E4E4] rounded-[16px] rounded-bl-[4px] px-[18px] py-[14px]">
                      <div className="flex items-center gap-[4px]">
                        <div className="w-[8px] h-[8px] bg-[#9897A0] rounded-full animate-bounce"></div>
                        <div className="w-[8px] h-[8px] bg-[#9897A0] rounded-full animate-bounce delay-150"></div>
                        <div className="w-[8px] h-[8px] bg-[#9897A0] rounded-full animate-bounce delay-300"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="mt-6 border-t border-gray-100 pt-6">
                <WelcomeState 
                  availableCountries={availableCountries}
                  availableRegions={availableRegions}
                  availableSubCategories={availableSubCategories}
                  availableCriticality={availableCriticality}
                  filters={filters}
                  setFilters={setFilters}
                  isChatActive={true}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <InputArea onSendMessage={onSendMessage} />

      <EvidenceModal
        data={selectedEvidence}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
    </div>
  );
};

export default ChatArea;
