import React from 'react';
import { AgentState, Theme } from '../types';

interface VoiceOrbProps {
  state: AgentState;
  theme: Theme;
}

const VoiceOrb: React.FC<VoiceOrbProps> = ({ state, theme }) => {
  // Determine state-based visuals
  const isSpeaking = state === AgentState.SPEAKING;
  const isListening = state === AgentState.LISTENING;
  const isProcessing = state === AgentState.PROCESSING;
  const isIdle = state === AgentState.IDLE;

  // Dynamic classes based on theme
  const primaryColor = theme.primary.replace('bg-', 'text-').replace('500', '400');
  const glowColor = theme.secondary.replace('bg-', 'shadow-');

  return (
    <div className="relative flex items-center justify-center w-96 h-96 transition-all duration-700">
      
      {/* 1. Outer Tech Ring (Static/Slow Spin) */}
      <div className={`absolute inset-0 rounded-full border border-white/10 border-dashed animate-spin-reverse opacity-40`}></div>
      
      {/* 2. Expanding Wave (Listening/Speaking) */}
      {(isListening || isSpeaking) && (
        <div className={`absolute inset-0 rounded-full border-2 ${primaryColor} opacity-20 animate-[ping_2s_ease-out_infinite]`}></div>
      )}

      {/* 3. Rotating Sector Ring (Processing) */}
      <div className={`absolute w-80 h-80 rounded-full border border-white/5 flex items-center justify-center ${isProcessing ? 'animate-spin duration-700' : 'animate-spin-slow'}`}>
         <div className={`absolute top-0 w-2 h-2 ${theme.bgGradient} rounded-full shadow-[0_0_10px_currentColor]`}></div>
         <div className={`absolute bottom-0 w-2 h-2 ${theme.bgGradient} rounded-full shadow-[0_0_10px_currentColor]`}></div>
         <div className={`absolute left-0 w-2 h-2 ${theme.bgGradient} rounded-full shadow-[0_0_10px_currentColor]`}></div>
         <div className={`absolute right-0 w-2 h-2 ${theme.bgGradient} rounded-full shadow-[0_0_10px_currentColor]`}></div>
      </div>

      {/* 4. Inner Data Ring */}
      <div className={`absolute w-64 h-64 rounded-full border border-white/10 flex items-center justify-center ${isListening ? 'animate-pulse' : ''}`}>
        <svg className="w-full h-full p-2 opacity-50" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" className={primaryColor} />
          {isProcessing && <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="20 40" className={`${primaryColor} animate-spin origin-center`} />}
        </svg>
      </div>

      {/* 5. The Core (Arc Reactor) */}
      <div className={`relative w-32 h-32 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-300 ${isSpeaking ? 'scale-110' : 'scale-100'}`}
           style={{ boxShadow: isSpeaking ? `0 0 50px ${theme.secondary.replace('bg-', '')}` : `0 0 20px rgba(0,0,0,0.5)` }}>
        
        {/* Core Glow */}
        <div className={`absolute inset-2 rounded-full ${theme.bgGradient} opacity-20 blur-md`}></div>
        
        {/* Solid Core */}
        <div className={`w-20 h-20 rounded-full bg-black/80 border border-white/30 flex items-center justify-center relative overflow-hidden`}>
           {/* Inner Light */}
           <div className={`absolute w-full h-full ${theme.bgGradient} opacity-50 blur-xl ${isSpeaking ? 'animate-pulse-fast' : 'opacity-20'}`}></div>
           
           {/* Status Icon/Text */}
           <div className="z-10 flex flex-col items-center">
             {isListening ? (
               <div className={`w-3 h-3 rounded-full ${theme.bgGradient} animate-ping`}></div>
             ) : isProcessing ? (
                <div className={`w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin`}></div>
             ) : (
                <div className={`w-2 h-2 rounded-full bg-white/50`}></div>
             )}
           </div>
        </div>
      </div>

      {/* Status Label */}
      <div className={`absolute -bottom-10 font-mono text-xs tracking-[0.5em] ${primaryColor} uppercase`}>
        {state === AgentState.IDLE ? 'ONLINE' : state}
      </div>
    </div>
  );
};

export default VoiceOrb;
