import React, { useEffect, useRef, useState } from 'react';
import { Message, FeedbackState } from '../types';

interface ChatHistoryProps {
  messages: Message[];
  onFeedback: (messageId: string, feedback: FeedbackState) => void;
  accentColor: string;
}

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = language === 'python' ? 'py' : 
                language === 'javascript' || language === 'js' ? 'js' :
                language === 'typescript' || language === 'ts' || language === 'tsx' ? 'tsx' :
                language === 'html' ? 'html' : 'txt';
    a.download = `snippet.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeploy = () => {
    let mimeType = 'text/plain';
    let content = code;

    if (language === 'html' || language === 'xml' || language === 'svg') {
       mimeType = 'text/html';
    } else if (language === 'javascript' || language === 'js') {
       mimeType = 'text/html';
       content = `<html><body><script>${code}</script></body></html>`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const isDeployable = ['html', 'javascript', 'js', 'svg', 'xml'].includes(language.toLowerCase());

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl group font-mono text-left w-full max-w-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 select-none">
        <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
            <span className="ml-2 text-[10px] uppercase text-white/40 tracking-wider">
            {language || 'TEXT'}
            </span>
        </div>
        
        <div className="flex items-center gap-3">
           {isDeployable && (
               <button 
                 onClick={handleDeploy}
                 className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                 title="Run / Preview"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                 </svg>
                 <span className="text-[9px] font-bold">RUN</span>
               </button>
           )}

           <button 
             onClick={handleDownload} 
             className="text-white/40 hover:text-white transition-colors" 
             title="Download"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </button>
           
           <button 
             onClick={handleCopy} 
             className={`flex items-center gap-1.5 transition-colors ${copied ? 'text-green-400' : 'text-white/40 hover:text-white'}`}
             title="Copy"
           >
             {copied ? (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
               </svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
               </svg>
             )}
           </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar bg-black/50">
        <pre className="font-mono text-xs leading-relaxed text-[#e5e5e5] whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, onFeedback, accentColor }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
      });
    }
  }, [messages]);

  const textAccent = accentColor.replace('bg-', 'text-').replace('500', '400');
  const borderAccent = accentColor.replace('bg-', 'border-').replace('500', '500');

  const renderMessageText = (text: string) => {
    const parts = text.split(/(```[\w-]*\n?[\s\S]*?```)/g);
    return parts.map((part, index) => {
      const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/);
      if (match) {
        return <CodeBlock key={index} language={match[1] || ''} code={match[2]} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col w-full h-full max-h-[300px] md:max-h-[600px] bg-black/60 rounded-xl border border-white/10 backdrop-blur-md relative overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
           <div className={`w-2 h-2 rounded-full ${accentColor} shadow-[0_0_10px_currentColor] animate-pulse`}></div>
           <span className={`text-[10px] font-bold tracking-[0.2em] uppercase text-white/80`}>System Log</span>
        </div>
        <span className="text-[10px] font-mono text-white/30 tracking-widest">LIVE FEED</span>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-white/20 select-none">
                <div className={`w-12 h-12 rounded-full border border-dashed border-white/20 animate-spin-slow mb-4`}></div>
                <p className="tracking-[0.3em] uppercase text-[10px]">Awaiting Input</p>
            </div>
        )}
        
        {messages.map((msg) => {
            const isAgent = msg.role === 'agent';
            return (
                <div key={msg.id} className={`flex w-full ${isAgent ? 'justify-start' : 'justify-end'}`}>
                    <div className={`flex flex-col max-w-[90%] md:max-w-[85%] ${isAgent ? 'items-start' : 'items-end'}`}>
                        
                        {/* Sender Label */}
                        <div className="flex items-center gap-2 mb-1 px-1">
                            <span className={`text-[9px] uppercase tracking-wider font-bold ${isAgent ? textAccent : 'text-cyan-400'}`}>
                                {isAgent ? '/// FALCON' : '/// USER'}
                            </span>
                            <span className="text-[9px] text-white/20 font-mono">{formatTime(msg.timestamp)}</span>
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`relative p-4 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-300
                            ${isAgent 
                                ? `bg-[#1a1a1a]/80 border-white/10 rounded-tl-sm` 
                                : `bg-cyan-950/30 border-cyan-500/20 rounded-tr-sm text-cyan-50`
                            }
                        `}>
                            {/* Attachments */}
                            {msg.attachment && (
                                <div className="mb-3 rounded-lg border border-white/10 overflow-hidden bg-black/50">
                                <img src={msg.attachment} alt="User attachment" className="max-w-full h-auto max-h-48 object-contain" />
                                </div>
                            )}

                            {/* Generated Images */}
                            {msg.generatedImage && (
                                <div className="mb-4 rounded-lg border border-white/20 overflow-hidden shadow-2xl group">
                                    <div className="bg-white/5 px-3 py-1.5 text-[9px] text-white/50 border-b border-white/10 flex justify-between">
                                        <span>VISUAL OUTPUT</span>
                                        <span className="text-white/30">GENERATED</span>
                                    </div>
                                    <img src={msg.generatedImage} alt="Generated visual" className="w-full h-auto object-cover" />
                                </div>
                            )}

                            {/* Text Content */}
                            <div className={`text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words font-sans ${isAgent ? 'text-slate-300' : 'text-cyan-100'}`}>
                                {isAgent ? renderMessageText(msg.text) : msg.text}
                            </div>
                        </div>

                        {/* Feedback Actions (Agent Only) */}
                        {isAgent && (
                            <div className="flex gap-2 mt-2 ml-1 opacity-50 hover:opacity-100 transition-opacity">
                                <button 
                                onClick={() => onFeedback(msg.id, 'up')}
                                className={`p-1.5 rounded hover:bg-white/10 transition-colors ${msg.feedback === 'up' ? textAccent : 'text-white/30'}`}
                                title="Helpful"
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill={msg.feedback === 'up' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                                </button>
                                <button 
                                onClick={() => onFeedback(msg.id, 'down')}
                                className={`p-1.5 rounded hover:bg-white/10 transition-colors ${msg.feedback === 'down' ? 'text-red-400' : 'text-white/30'}`}
                                title="Not Helpful"
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill={msg.feedback === 'down' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default ChatHistory;