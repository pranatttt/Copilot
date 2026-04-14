import React, { useEffect } from 'react';

interface EvidenceModalProps {
  data: any;
  isOpen: boolean;
  onClose: () => void;
}

const EvidenceModal: React.FC<EvidenceModalProps> = ({ data, isOpen, onClose }) => {
  // STEP 2 — ADD ESC KEY CLOSE SUPPORT
  useEffect(() => {
  if (!isOpen) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [isOpen, onClose]);


  if (!isOpen) return null;

  // STEP 3 — SORT METADATA KEYS
  const metadataEntries = data
    ? Object.entries(data).sort(([a], [b]) =>
        a.localeCompare(b)
      )
    : [];

  return (
    <div 
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[12px] shadow-xl w-full max-w-[700px] mx-4 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER SECTION - STEP 4 Update Border */}
        <div className="flex items-center justify-between p-[16px] border-b border-[#E4E4E4]">
          <h2 className="text-[16px] font-semibold text-[#1F1F1F]">
            Evidence Details
          </h2>
          <button 
            onClick={onClose}
            className="w-[32px] h-[32px] rounded-[6px] hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-times text-[#464653]"></i>
          </button>
        </div>

        {/* BODY SECTION */}
        <div className="overflow-y-auto p-[16px] space-y-[12px] custom-scrollbar">
          {metadataEntries.length > 0 ? (
            metadataEntries.map(([key, value]) => (
              <div 
                key={key} 
                // STEP 4 Update Border
                className="bg-gray-50 border border-[#E4E4E4] rounded-[8px] p-[10px]"
              >
                <div className="text-[10px] uppercase tracking-wide text-[#9897A0] font-medium mb-[4px]">
                  {key
                    .replace(/_/g, ' ')
                    .replace(/\?/g, '')
                  }
                </div>
                {/* STEP 6 Final value class */}
                <div className="text-[13px] text-[#1F1F1F] leading-[1.6] whitespace-pre-wrap break-words">
                  {value !== null && value !== undefined
                    ? String(value)
                    : 'N/A'}
                </div>
              </div>
            ))
          ) : (
            // STEP 5 IMPROVE EMPTY STATE MESSAGE
            <div className="text-center py-8 text-[#9897A0] text-[13px]">
              No structured evidence metadata available.
            </div>
          )}
        </div>

        {/* FOOTER SECTION - STEP 4 Update Border */}
        <div className="p-[16px] border-t border-[#E4E4E4] flex justify-end">
          <button 
            onClick={onClose}
            className="px-[14px] py-[8px] bg-[#1F1F1F] text-white rounded-[8px] hover:bg-[#464653] text-[12px] transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvidenceModal;
