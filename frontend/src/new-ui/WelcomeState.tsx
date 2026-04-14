import React, { useState } from 'react';
import { Bot, Crosshair, Info, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Layers } from 'lucide-react';
import QuickActions from './QuickActions';
import { ChatFilters } from '../types';

interface WelcomeStateProps {
  availableCountries: string[];
  availableRegions: string[];
  availableSubCategories: string[];
  availableCriticality: string[];
  filters: ChatFilters & { sub_category?: string; criticality?: string };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  isChatActive?: boolean;
}

const WelcomeState: React.FC<WelcomeStateProps> = ({
  availableCountries,
  availableRegions,
  availableSubCategories,
  availableCriticality,
  filters,
  setFilters,
  isChatActive = false
}) => {
  // Expand/Collapse state management
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [showAllSubCats, setShowAllSubCats] = useState(false);

  return (
    <div className={`max-w-[820px] mx-auto w-full animate-fade-in text-left ${isChatActive ? 'py-2' : 'py-4'}`}>
      
      {/* 1. WELCOME HEADER SECTION - Matches HTML exactly */}
      {!isChatActive && (
        <div className="text-center mb-[12px]">
          {/* Welcome Robot Icon: 64x64, 16px radius, yellow-orange gradient, yellow glow shadow */}
          <div className="
  w-16 h-16
  bg-gradient-to-br
  from-[#FFD400]
  via-[#FFC107]
  to-[#FF9800]
  rounded-[16px]
  flex items-center justify-center
  shadow-[0_8px_24px_rgba(255,214,0,0.4)]
  mx-auto mb-[12px]
  relative overflow-hidden
">

  {/* Gloss overlay */}
  <div className="
    absolute inset-0
    bg-white opacity-10
    rounded-[16px]
  "></div>

  {/* Solid Robot Icon (Font Awesome) */}
  <i className="
    fas fa-robot
    text-[#1F1F1F]
    text-[26px]
    relative z-10
  "></i>

</div>

          
          {/* Title: 20px, Bold, Gray-900 equivalent */}
          <h1 className="text-[20px] font-[700] text-[#1F1F1F] mb-[4px]">
            How can I help you today?
          </h1>
          
          {/* Subtitle: 12px, Gray-600 equivalent, 400px max width */}
          <p className="text-[12px] text-[#6B6B6B] max-w-[400px] mx-auto leading-[1.4]">
            Ask questions about regulations, obligations, and licenses within your compliance scope.
          </p>
        </div>
      )}

      {/* 2. SCOPE INFO CARD - Rounded 10px, Top Accent Line, specific padding */}
      <div className="bg-white border border-gray-200 rounded-[10px] px-4 py-3 mb-[12px] shadow-sm relative overflow-hidden group">
        {/* Yellow top accent line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-[#FFD400]"></div>
        
        <div className="flex items-center gap-2 text-[10px] font-[600] text-[#747480] uppercase tracking-[0.5px] mb-[8px]">
          <Crosshair size={12} className="text-[#FFD400]" />
          Your Current Scope
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {/* COLUMN 1: Geography & Sub-Category */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-[600] text-[#9897A0] uppercase tracking-[0.3px]">Geography</span>
              <div className="flex flex-wrap gap-1.5">
                {(availableCountries || []).map((country) => (
                  <button
                    key={country}
                    onClick={() => setFilters((prev: any) => ({ ...prev, country }))}
                    className={`px-[8px] py-[3px] text-[10px] font-[500] rounded-full border transition-all flex items-center gap-1 ${
                      filters.country === country
                        ? 'bg-[#2F80ED] text-white border-[#2F80ED]'
                        : 'bg-[#2F80ED]/10 text-[#2F80ED] border-transparent hover:bg-[#2F80ED]/20'
                    }`}
                  >
                    {filters.country === country && <CheckCircle2 size={8} />}
                    {country}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-[600] text-[#9897A0] uppercase tracking-[0.3px] flex items-center gap-1">
                <Layers size={8} /> Legal Sub-Category
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(showAllSubCats ? (availableSubCategories || []) : (availableSubCategories || []).slice(0, 6)).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setFilters((prev: any) => ({ ...prev, sub_category: sub }))}
                    className={`px-[8px] py-[3px] text-[10px] font-[500] rounded-full border transition-all flex items-center gap-1 ${
                      filters.sub_category === sub
                        ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                        : 'bg-[#7C3AED]/10 text-[#7C3AED] border-transparent hover:bg-[#7C3AED]/20'
                    }`}
                  >
                    {filters.sub_category === sub && <CheckCircle2 size={8} />}
                    {sub}
                  </button>
                ))}
                {(availableSubCategories || []).length > 6 && (
                  <button 
                    onClick={() => setShowAllSubCats(!showAllSubCats)}
                    className="px-[8px] py-[3px] bg-white text-[#747480] text-[10px] font-[500] rounded-full border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-1"
                  >
                    {showAllSubCats ? 'Show less' : `+${(availableSubCategories || []).length - 6} more`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 2: Regions & Criticality */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-[600] text-[#9897A0] uppercase tracking-[0.3px]">Region Selection</span>
              <div className="flex flex-wrap gap-1.5">
                {(showAllRegions ? (availableRegions || []) : (availableRegions || []).slice(0, 10)).map((region) => (
                  <button
                    key={region}
                    onClick={() => setFilters((prev: any) => ({ ...prev, state_region: region }))}
                    className={`px-[8px] py-[3px] text-[10px] font-[500] rounded-full border transition-all flex items-center gap-1 ${
                      filters.state_region === region
                        ? 'bg-[#FFD400] text-[#1F1F1F] border-[#FFD400]'
                        : 'bg-gray-100 text-[#6B6B6B] border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {filters.state_region === region && <CheckCircle2 size={8} />}
                    {region}
                  </button>
                ))}
                {(availableRegions || []).length > 10 && (
                  <button 
                    onClick={() => setShowAllRegions(!showAllRegions)}
                    className="px-[8px] py-[3px] bg-gray-100 text-[#747480] text-[10px] font-[500] rounded-full border border-transparent hover:bg-gray-200 transition-all flex items-center gap-1"
                  >
                    {showAllRegions ? <><ChevronUp size={8}/> Show less</> : <><ChevronDown size={8}/> +{(availableRegions || []).length - 10} more</>}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-[600] text-[#9897A0] uppercase tracking-[0.3px] flex items-center gap-1">
                <AlertCircle size={8} /> Risk Criticality
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(availableCriticality || []).slice(0, 4).map((level) => (
                  <button
                    key={level}
                    onClick={() => setFilters((prev: any) => ({ ...prev, criticality: level }))}
                    className={`px-[8px] py-[3px] text-[10px] font-[500] rounded-full border transition-all flex items-center gap-1 ${
                      filters.criticality === level
                        ? 'bg-[#EB5757] text-white border-[#EB5757]'
                        : 'bg-[#EB5757]/10 text-[#EB5757] border-transparent hover:bg-[#EB5757]/20'
                    }`}
                  >
                    {filters.criticality === level && <CheckCircle2 size={8} />}
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hint footer */}
        <div className="mt-[8px] pt-[8px] border-t border-gray-100 flex items-center gap-2 text-[10px] text-[#747480]">
          <Info size={9} className="text-[#2F80ED]" />
          <span className="italic">
            Refine your scope by mentioning specific countries, states, or regulatory areas in your questions
          </span>
        </div>
      </div>

      {/* 3. QUICK ACTIONS GRID - Handled by QuickActions component */}
      {!isChatActive && (
        <QuickActions />
      )}

    </div>
  );
};

export default WelcomeState;
