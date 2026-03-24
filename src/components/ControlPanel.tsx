
import React, { useState } from 'react';
import { MurfConfig } from '../types';

interface ControlPanelProps {
  murfConfig: MurfConfig;
  setMurfConfig: (config: MurfConfig) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  embedded?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  murfConfig, 
  setMurfConfig, 
  isSettingsOpen, 
  setIsSettingsOpen,
  embedded = false
}) => {
  const [localKey, setLocalKey] = useState(murfConfig.apiKey);
  const [localVoice, setLocalVoice] = useState(murfConfig.voiceId);

  const handleSave = () => {
    setMurfConfig({ apiKey: localKey, voiceId: localVoice });
    if (!embedded) setIsSettingsOpen(false);
  };

  // If closed and not embedded, show the gear icon button
  if (!isSettingsOpen && !embedded) {
    return (
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="absolute top-6 right-6 p-3 text-violet-400/60 hover:text-violet-200 hover:bg-white/5 rounded-full transition-all z-30"
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.02c.076-.588.135-1.181.18-1.781l.029-.398a.749.749 0 01.406-.613l.61-.357c.79-.46 1.852-.303 2.457.368.04.045.078.092.115.14 1.258 1.597 1.95 3.57 1.95 5.69 0 1.294-.316 2.502-.876 3.593-.162.316-.543.468-.86.342l-.539-.215a.75.75 0 01-.43-.918c.174-.63.298-1.285.367-1.956m0 0a20.864 20.864 0 00-.18-1.781l-.03-.398a.749.749 0 01-.405-.612l-.611-.357a1.603 1.603 0 00-2.457.368" />
        </svg>
      </button>
    );
  }

  // Render Content
  const content = (
    <div className={`w-full ${embedded ? 'px-0 py-2' : 'max-w-md bg-slate-900/90 border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden'}`}>
        {!embedded && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
        )}
        
        {!embedded && <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">Agent Configuration</h2>}
        
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-cyan-500/70 mb-2">TTS API Key (Optional)</label>
            <input 
              type="password" 
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="ElevenLabs or Murf Key"
              className="w-full bg-transparent border-b border-white/20 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors font-mono"
            />
            <p className="text-[10px] text-white/30 mt-2 font-mono">Leave empty to use Browser Native High-Definition TTS.</p>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-cyan-500/70 mb-2">Override Voice ID</label>
            <input 
              type="text" 
              value={localVoice}
              onChange={(e) => setLocalVoice(e.target.value)}
              placeholder="e.g. en-US-stark"
              className="w-full bg-transparent border-b border-white/20 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors font-mono"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          {!embedded && (
            <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2.5 text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
                Cancel
            </button>
          )}
          <button 
            onClick={handleSave}
            className={`px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-sm text-xs font-bold tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all ${embedded ? 'w-full md:w-auto' : ''}`}
          >
            {embedded ? 'UPDATE SYSTEM CONFIG' : 'Save Changes'}
          </button>
        </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {content}
    </div>
  );
};

export default ControlPanel;
